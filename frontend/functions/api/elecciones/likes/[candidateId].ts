import type { PagesFunction, Env } from '../../../types';

const VALID_CANDIDATES = new Set([
  'daniel-tolosa',
  'jorge-silva',
  'karina-norero',
  'barbara-inostroza',
  'pauli',
  'eduardo-elgueta',
  'oscar-cerda',
  'bloque-etica',
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const getKey = (candidateId: string) => `elecciones:likes:${candidateId}`;

export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const candidateId = String(params.candidateId || '');
    if (!VALID_CANDIDATES.has(candidateId)) {
      return json({ success: false, error: 'candidate_id inválido' }, 400);
    }

    const browserId = new URL(request.url).searchParams.get('browserId') || '';
    const raw = await env.ACA_KV.get(getKey(candidateId));
    const data = raw ? JSON.parse(raw) : { count: 0, users: [] as string[] };

    return json({
      success: true,
      data: {
        candidateId,
        totalLikes: data.count || 0,
        userLiked: browserId ? Array.isArray(data.users) && data.users.includes(browserId) : false,
      },
    });
  } catch (error) {
    console.error('[ELECCIONES LIKES] GET error', error);
    return json({ success: false, error: 'Error obteniendo likes' }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
  try {
    const candidateId = String(params.candidateId || '');
    if (!VALID_CANDIDATES.has(candidateId)) {
      return json({ success: false, error: 'candidate_id inválido' }, 400);
    }

    const body = await request.json<{ browserId?: string }>();
    const browserId = String(body?.browserId || '').trim();
    if (!browserId) {
      return json({ success: false, error: 'browserId requerido' }, 400);
    }

    const raw = await env.ACA_KV.get(getKey(candidateId));
    const data = raw ? JSON.parse(raw) : { count: 0, users: [] as string[] };
    const users = Array.isArray(data.users) ? data.users : [];
    const existingIndex = users.indexOf(browserId);

    let userLiked = false;
    if (existingIndex >= 0) {
      users.splice(existingIndex, 1);
      data.count = Math.max(0, (data.count || 0) - 1);
      userLiked = false;
    } else {
      users.push(browserId);
      data.count = (data.count || 0) + 1;
      userLiked = true;
    }

    data.users = users;
    data.lastUpdated = new Date().toISOString();
    await env.ACA_KV.put(getKey(candidateId), JSON.stringify(data));

    return json({
      success: true,
      data: {
        candidateId,
        totalLikes: data.count,
        userLiked,
      },
    });
  } catch (error) {
    console.error('[ELECCIONES LIKES] POST error', error);
    return json({ success: false, error: 'Error procesando like' }, 500);
  }
};
