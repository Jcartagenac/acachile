// GET: return site sections (tries DB first, falls back to KV)
// POST: upsert sections into DB and update KV cache

import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';

export async function onRequestGet(context) {
  const { request, env } = context;

  // Require auth for admin endpoints? Allow public GET for this endpoint is acceptable,
  // but we'll allow GET without auth (public) while POST requires admin. Keep GET public.

  try {
    // Try to read from DB
    let sections = [];
    if (env.DB) {
      try {
        // Ensure table exists
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS site_sections (
            key TEXT PRIMARY KEY,
            title TEXT,
            image_url TEXT,
            content TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        const res = await env.DB.prepare('SELECT key, title, image_url, content, sort_order FROM site_sections ORDER BY sort_order ASC').all();
        sections = res.results || [];
      } catch (e) {
        console.warn('[CONTENT GET] DB read failed, falling back to KV:', e.message);
      }
    }

    // If DB empty, try KV
    if ((!sections || sections.length === 0) && env.ACA_KV) {
      const kv = await env.ACA_KV.get('site:sections');
      if (kv) {
        sections = JSON.parse(kv);
      }
    }

    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[CONTENT GET] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Authenticate and authorize
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'Token inválido', 401, env.ENVIRONMENT === 'development' ? { details: err } : undefined);
    }

    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    const body = await request.json();
    const sections = body.sections || [];

    // Basic validation
    if (!Array.isArray(sections)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Upsert into DB if available
    if (env.DB) {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const key = s.key || `section_${i}`;
        const title = s.title || '';
        const image_url = s.image_url || '';
        const content = s.content || '';
        const sort_order = typeof s.sort_order === 'number' ? s.sort_order : i;

        await env.DB.prepare(`
          INSERT INTO site_sections (key, title, image_url, content, sort_order, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET
            title=excluded.title,
            image_url=excluded.image_url,
            content=excluded.content,
            sort_order=excluded.sort_order,
            updated_at=datetime('now')
        `).bind(key, title, image_url, content, sort_order).run();
      }
    }

    // Update KV cache
    if (env.ACA_KV) {
      await env.ACA_KV.put('site:sections', JSON.stringify(sections));
    }

    // Optional: purge Cloudflare cache if API token and zone are configured
    try {
      const cfToken = env.CLOUDFLARE_API_TOKEN || env.CF_API_TOKEN;
      const cfZone = env.CLOUDFLARE_ZONE_ID || env.CF_ZONE_ID;
      if (cfToken && cfZone) {
        // Try to purge specific files first (index, assets referenced in index, and possible image URLs)
        const frontendUrl = (env.FRONTEND_URL || env.VITE_API_BASE_URL || 'https://acachile.pages.dev').replace(/\/$/, '');
        const r2Public = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');

        const filesToPurge = new Set();
        // Purge homepage and index
        filesToPurge.add(`${frontendUrl}/`);
        filesToPurge.add(`${frontendUrl}/index.html`);

        // Add image URLs from sections that are on the known hosts
        try {
          for (const s of sections) {
            if (s && s.image_url) {
              const img = String(s.image_url);
              if (img.startsWith(frontendUrl) || (r2Public && img.startsWith(r2Public))) {
                filesToPurge.add(img);
              }
            }
          }
        } catch (e2) {
          // ignore
        }

        // Try to fetch the index.html to discover referenced assets (e.g. /assets/index-*.js)
        try {
          const indexRes = await fetch(frontendUrl + '/');
          if (indexRes && indexRes.ok) {
            const indexText = await indexRes.text();
            const assetRegex = /\/(?:assets|assets\/[^"'\s]+\/)\S+?\.(js|css|map)/g;
            let match;
            while ((match = assetRegex.exec(indexText)) !== null) {
              let assetPath = match[0];
              // If assetPath is relative (starts with /), make absolute
              if (assetPath.startsWith('/')) {
                filesToPurge.add(`${frontendUrl}${assetPath}`);
              } else {
                filesToPurge.add(`${frontendUrl}/${assetPath}`);
              }
            }
          }
        } catch (e) {
          // Cannot fetch index; ignore and fallback later
          console.warn('[CONTENT POST] Could not fetch frontend index to discover assets:', e);
        }

        const files = Array.from(filesToPurge).slice(0, 1000); // CF limit

        if (files.length > 0) {
          await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZone}/purge_cache`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files })
          });
        } else {
          // fallback to purge everything
          await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZone}/purge_cache`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ purge_everything: true })
          });
        }
      }
    } catch (purgeError) {
      console.warn('[CONTENT POST] Cloudflare purge failed (non-fatal):', purgeError);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[CONTENT POST] Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
