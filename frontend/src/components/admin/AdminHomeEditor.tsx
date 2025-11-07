import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import type { SiteSection, SiteSectionSourceType, SitePageKey } from '@shared/siteSections';
import type { Evento } from '@shared/index';
import type { NewsArticle } from '../../services/newsService';

type EditableSection = SiteSection & { preview_image?: string };

const PAGE_TABS: Array<{ key: SitePageKey; label: string }> = [
  { key: 'home', label: 'Inicio' },
  { key: 'about', label: 'Quiénes Somos' },
  { key: 'contact', label: 'Contacto' }
];

const coerceSourceType = (value: unknown): SiteSectionSourceType =>
  value === 'event' || value === 'news' ? value : 'custom';

const getAuthToken = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('auth_token') || '';
  }
  return '';
};

// NO usar defaults - trabajar solo con datos reales
const processIncomingSections = (page: SitePageKey, incoming: Partial<SiteSection>[] | undefined): EditableSection[] => {
  // Si no hay datos, retornar array vacío
  if (!incoming || incoming.length === 0) {
    return [];
  }

  const processed: EditableSection[] = [];

  incoming.forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim().length > 0
        ? raw.key.trim()
        : `section_${index}`;

    const sortOrder =
      typeof raw?.sort_order === 'number'
        ? raw.sort_order
        : index;

    processed.push({
      page,
      key: tentativeKey,
      title: typeof raw?.title === 'string' ? raw.title : '',
      content: typeof raw?.content === 'string' ? raw.content : '',
      image_url: typeof raw?.image_url === 'string' ? raw.image_url : '',
      sort_order: sortOrder,
      source_type: coerceSourceType(raw?.source_type),
      source_id: raw?.source_id != null ? String(raw.source_id) : undefined,
      cta_label: raw?.cta_label != null ? String(raw.cta_label) : undefined,
      cta_url: raw?.cta_url != null ? String(raw.cta_url) : undefined
    });
  });

  return processed.sort((a, b) => a.sort_order - b.sort_order);
};

const sanitizeSectionsForSave = (page: SitePageKey, sections: EditableSection[]): SiteSection[] =>
  sections
    .map((section, index) => ({
      page,
      key: section.key,
      title: section.title.trim(),
      content: section.content,
      image_url: section.image_url,
      sort_order: typeof section.sort_order === 'number' ? section.sort_order : index,
      source_type: section.source_type ?? 'custom',
      source_id: section.source_id,
      cta_label: section.cta_label?.trim() || undefined,
      cta_url: section.cta_url?.trim() || undefined
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

interface AdminHomeEditorProps {
  initialPage?: SitePageKey;
}

export default function AdminHomeEditor({ initialPage = 'home' }: AdminHomeEditorProps) {
  const [activePage, setActivePage] = useState<SitePageKey>(initialPage);
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Evento[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);

  useEffect(() => {
    setActivePage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        console.log('[AdminHomeEditor] Fetching sections for page:', activePage);
        const token = getAuthToken();
        const response = await fetch(`/api/admin/content?page=${activePage}`, { 
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await response.json();
        console.log('[AdminHomeEditor] Response:', json);
        
        if (active && json?.success) {
          const processed = processIncomingSections(activePage, json.sections);
          console.log('[AdminHomeEditor] Processed sections:', processed);
          setSections(processed);
        } else if (active) {
          console.warn('[AdminHomeEditor] No success in response, setting empty array');
          setSections([]);
        }
      } catch (error) {
        console.error('[AdminHomeEditor] fetchSections error:', error);
        if (active) {
          setSections([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'home' || listsLoaded) return;

    (async () => {
      try {
        const [eventsRes, newsRes] = await Promise.all([
          fetch('/api/eventos?status=published&limit=100', { cache: 'no-store' })
            .then((res) => res.json())
            .catch(() => ({ success: false })),
          fetch('/api/noticias?limit=100', { cache: 'no-store' })
            .then((res) => res.json())
            .catch(() => ({ success: false }))
        ]);

        if (eventsRes?.success && Array.isArray(eventsRes.data)) {
          setEvents(eventsRes.data as Evento[]);
        }

        if (newsRes?.success && Array.isArray(newsRes.data)) {
          setNews(newsRes.data as NewsArticle[]);
        }
      } finally {
        setListsLoaded(true);
      }
    })();
  }, [activePage, listsLoaded]);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sort_order - b.sort_order),
    [sections]
  );

  const updateSection = useCallback(
    <K extends keyof EditableSection>(sectionKey: string, key: K, value: EditableSection[K]) => {
      setSections((prev) =>
        prev.map((section) =>
          section.key === sectionKey
            ? { ...section, [key]: value }
            : section
        )
      );
    },
    []
  );

  const applyEventToSection = useCallback(
    (sectionKey: string, eventId: string) => {
      const event = events.find((item) => String(item.id) === eventId);
      if (!event) {
        updateSection(sectionKey, 'source_id', undefined);
        return;
      }

      const descriptionParts: string[] = [];
      if (event.description) descriptionParts.push(event.description);
      if (event.date) {
        const formattedDate = new Date(event.date).toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        descriptionParts.push(`Fecha: ${formattedDate}`);
      }
      if (event.location) descriptionParts.push(`Lugar: ${event.location}`);
      if (event.registrationOpen) descriptionParts.push('Inscripciones abiertas');

      setSections((prev) =>
        prev.map((section) =>
          section.key === sectionKey
            ? {
                ...section,
                source_type: 'event',
                source_id: eventId,
                title: event.title || section.title,
                content: descriptionParts.filter(Boolean).join('\n\n') || section.content,
                image_url: event.image || section.image_url,
                cta_label: section.cta_label || 'Ver evento',
                cta_url: `/eventos/${event.id}`
              }
            : section
        )
      );
    },
    [events, updateSection]
  );

  const applyNewsToSection = useCallback(
    (sectionKey: string, slug: string) => {
      const article = news.find((item) => item.slug === slug);
      if (!article) {
        updateSection(sectionKey, 'source_id', undefined);
        return;
      }

      const content = article.excerpt || article.content || '';

      setSections((prev) =>
        prev.map((section) =>
          section.key === sectionKey
            ? {
                ...section,
                source_type: 'news',
                source_id: slug,
                title: article.title || section.title,
                content,
                image_url: article.featured_image || section.image_url,
                cta_label: section.cta_label || 'Leer noticia',
                cta_url: `/noticias/${article.slug}`
              }
            : section
        )
      );
    },
    [news, updateSection]
  );

  const handleSourceTypeChange = useCallback(
    (sectionKey: string, value: SiteSectionSourceType) => {
      setSections((prev) =>
        prev.map((section) =>
          section.key === sectionKey
            ? {
                ...section,
                source_type: value,
                source_id: value === 'custom' ? undefined : section.source_id
              }
            : section
        )
      );

      if (value === 'event' && events[0]) {
        applyEventToSection(sectionKey, String(events[0].id));
      }

      if (value === 'news' && news[0]) {
        applyNewsToSection(sectionKey, news[0].slug);
      }
    },
    [events, news, applyEventToSection, applyNewsToSection]
  );

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const payload = sanitizeSectionsForSave(activePage, sections);

      console.log('[AdminHomeEditor] Starting save operation for page:', activePage);
      console.log('[AdminHomeEditor] Payload to save:', JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/admin/content?page=${activePage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ sections: payload })
      });

      console.log('[AdminHomeEditor] Response status:', res.status);
      const json = await res.json();
      console.log('[AdminHomeEditor] Response JSON:', JSON.stringify(json, null, 2));

      if (json.success) {
        alert('Secciones guardadas correctamente');
        setSections(processIncomingSections(activePage, json.sections));
        console.log('[AdminHomeEditor] Save successful, sections updated');
      } else {
        console.error('[AdminHomeEditor] Save failed with error:', json.error);
        alert(json.error || 'No se pudo guardar la información');
      }
    } catch (error) {
      console.error('[AdminHomeEditor] save error:', error);
      alert('Error guardando');
    } finally {
      setSaving(false);
    }
  }, [sections, activePage]);

  const uploadImage = useCallback(
    async (sectionKey: string, file: File) => {
      if (!file) return;
      setUploadsInProgress((value) => value + 1);
      setUploadError((prev) => ({ ...prev, [sectionKey]: '' }));

      const reader = new FileReader();
      reader.onload = () => {
        updateSection(sectionKey, 'image_url', String(reader.result));
      };
      reader.readAsDataURL(file);

      try {
        const token = getAuthToken();
        const form = new FormData();
        form.append('file', file);
        form.append('folder', activePage === 'home' ? 'home' : 'content');
        form.append('filename', file.name);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/admin/content/upload');
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              setUploadProgress((prev) => ({ ...prev, [sectionKey]: percentage }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText);
                if (json.success && json.url) {
                  updateSection(sectionKey, 'image_url', json.url);
                  resolve();
                } else {
                  setUploadError((prev) => ({ ...prev, [sectionKey]: json.error || 'Error subida' }));
                  reject(new Error(json.error || 'Upload failed'));
                }
              } catch (error) {
                setUploadError((prev) => ({ ...prev, [sectionKey]: 'Respuesta inválida' }));
                reject(error);
              }
            } else {
              setUploadError((prev) => ({ ...prev, [sectionKey]: `HTTP ${xhr.status}` }));
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            setUploadError((prev) => ({ ...prev, [sectionKey]: 'Error de red' }));
            reject(new Error('Network error'));
          };

          xhr.send(form);
        });
      } catch (error) {
        console.error('[AdminHomeEditor] uploadImage error:', error);
      } finally {
        setUploadProgress((prev) => ({ ...prev, [sectionKey]: 0 }));
        setUploadsInProgress((value) => Math.max(0, value - 1));
      }
    },
    [updateSection, activePage]
  );

  const clearCache = useCallback(async () => {
    setClearingCache(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/content/clear_cache?page=${activePage}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const json = await res.json();
      if (json.success) {
        alert('Cache KV borrado');
      } else {
        alert(json.error || 'No se pudo borrar cache');
      }
    } catch (error) {
      console.error('[AdminHomeEditor] clearCache error:', error);
      alert('Error al borrar cache');
    } finally {
      setClearingCache(false);
    }
  }, [activePage]);

  const addSection = useCallback(() => {
    const nextIndex = sections.length;
    const newSection: EditableSection = {
      page: activePage,
      key: `section_${Date.now()}`,
      title: `Nueva sección ${nextIndex + 1}`,
      content: '',
      image_url: '',
      sort_order: nextIndex,
      source_type: 'custom'
    };
    setSections((prev) => [...prev, newSection]);
  }, [sections.length, activePage]);

  const deleteSection = useCallback((sectionKey: string) => {
    if (window.confirm('¿Eliminar esta sección?')) {
      setSections((prev) => prev.filter(s => s.key !== sectionKey));
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    if (window.confirm('¿Eliminar todas las secciones? Esta acción no se puede deshacer.')) {
      setSections([]);
    }
  }, [activePage]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm space-y-6">
      <div className="flex flex-wrap gap-2">
        {PAGE_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={tab.key === activePage ? 'primary' : 'outline'}
            onClick={() => setActivePage(tab.key)}
            disabled={saving || uploadsInProgress > 0 || clearingCache}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="space-y-4">
          {sortedSections.map((section, index) => (
            <div key={section.key || index} className="border p-4 rounded space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {section.key ? `${section.key}` : `Sección ${index + 1}`}
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Orden</label>
                  <input
                    type="number"
                    value={section.sort_order ?? index}
                    onChange={(event) => updateSection(section.key, 'sort_order', Number(event.target.value))}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Contenido basado en</label>
                  <select
                    value={section.source_type ?? 'custom'}
                    onChange={(event) => handleSourceTypeChange(section.key, event.target.value as SiteSectionSourceType)}
                    className="w-full border rounded px-2 py-1"
                    disabled={activePage !== 'home'}
                  >
                    <option value="custom">Contenido manual</option>
                    <option value="event">Evento destacado</option>
                    <option value="news">Noticia destacada</option>
                  </select>
                </div>
                {activePage === 'home' && section.source_type === 'event' && (
                  <div>
                    <label className="block text-sm font-medium">Selecciona evento</label>
                    <select
                      value={section.source_id ?? ''}
                      onChange={(event) => applyEventToSection(section.key, event.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">-- selecciona --</option>
                      {events.map((event) => (
                        <option key={event.id} value={String(event.id)}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {activePage === 'home' && section.source_type === 'news' && (
                  <div>
                    <label className="block text-sm font-medium">Selecciona noticia</label>
                    <select
                      value={section.source_id ?? ''}
                      onChange={(event) => applyNewsToSection(section.key, event.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">-- selecciona --</option>
                      {news.map((article) => (
                        <option key={article.id} value={article.slug}>
                          {article.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <label className="block text-sm font-medium">Título</label>
              <input
                value={section.title || ''}
                onChange={(event) => updateSection(section.key, 'title', event.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="Título de la sección"
              />

              <label className="block text-sm font-medium mt-2">Imagen (URL)</label>
              <input
                value={section.image_url || ''}
                onChange={(event) => updateSection(section.key, 'image_url', event.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="https://..."
              />
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadImage(section.key, file);
                  }}
                />
                <span className="text-sm text-gray-500">o pega una URL arriba</span>
              </div>

              {section.image_url ? (
                <div className="mb-2">
                  <img src={section.image_url} alt="preview" style={{ maxHeight: 120 }} className="rounded" />
                </div>
              ) : null}
              {uploadProgress[section.key] ? (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div style={{ width: `${uploadProgress[section.key]}%` }} className="bg-blue-500 h-2 rounded" />
                  </div>
                  <div className="text-xs text-gray-600">{uploadProgress[section.key]}%</div>
                </div>
              ) : null}
              {uploadError[section.key] ? <div className="text-sm text-red-600">{uploadError[section.key]}</div> : null}

              <label className="block text-sm font-medium">Contenido</label>
              <textarea
                value={section.content || ''}
                onChange={(event) => updateSection(section.key, 'content', event.target.value)}
                className="w-full border rounded px-2 py-1 mb-2"
                rows={activePage === 'contact' ? 6 : 4}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Texto del botón</label>
                  <input
                    value={section.cta_label || ''}
                    onChange={(event) => updateSection(section.key, 'cta_label', event.target.value)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="Ej: Ver evento"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">URL del botón</label>
                  <input
                    value={section.cta_url || ''}
                    onChange={(event) => updateSection(section.key, 'cta_url', event.target.value)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => deleteSection(section.key)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Eliminar sección
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} className="bg-red-600 text-white" disabled={saving || uploadsInProgress > 0}>
              {saving ? 'Guardando…' : 'Guardar secciones'}
            </Button>
            <Button onClick={clearCache} className="bg-gray-600 text-white" disabled={clearingCache || uploadsInProgress > 0}>
              {clearingCache ? 'Borrando cache…' : 'Borrar cache KV'}
            </Button>
            <Button onClick={addSection} className="bg-blue-600 text-white" disabled={uploadsInProgress > 0}>
              Agregar sección
            </Button>
            <Button onClick={resetToDefaults} variant="secondary" disabled={uploadsInProgress > 0}>
              Restaurar por defecto
            </Button>
            {uploadsInProgress > 0 && (
              <div className="text-sm text-gray-600">Subiendo imágenes… ({uploadsInProgress})</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
