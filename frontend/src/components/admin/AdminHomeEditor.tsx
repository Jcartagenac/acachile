import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import type { SiteSection, SiteSectionSourceType } from '@shared/siteSections';
import { DEFAULT_SITE_SECTIONS } from '@shared/siteSections';
import type { Evento } from '@shared/index';
import type { NewsArticle } from '../../services/newsService';

type EditableSection = SiteSection & { preview_image?: string };

const cloneDefaults = (): EditableSection[] =>
  DEFAULT_SITE_SECTIONS.map((section) => ({ ...section }));

const coerceSourceType = (value: unknown): SiteSectionSourceType =>
  value === 'event' || value === 'news' ? value : 'custom';

const mergeWithDefaults = (incoming: Partial<SiteSection>[] | undefined): EditableSection[] => {
  const defaults = new Map(DEFAULT_SITE_SECTIONS.map((section) => [section.key, section]));
  const merged = new Map<string, EditableSection>();

  (incoming || []).forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim().length > 0
        ? raw.key.trim()
        : DEFAULT_SITE_SECTIONS[index]?.key ?? `section_${index}`;

    const fallback = defaults.get(tentativeKey);
    const sortOrder =
      typeof raw?.sort_order === 'number'
        ? raw.sort_order
        : fallback?.sort_order ?? index;

    merged.set(tentativeKey, {
      key: tentativeKey,
      title: typeof raw?.title === 'string' ? raw.title : fallback?.title ?? '',
      content: typeof raw?.content === 'string' ? raw.content : fallback?.content ?? '',
      image_url: typeof raw?.image_url === 'string' ? raw.image_url : fallback?.image_url ?? '',
      sort_order: sortOrder,
      source_type: coerceSourceType(raw?.source_type ?? fallback?.source_type),
      source_id:
        typeof raw?.source_id === 'string'
          ? raw.source_id
          : typeof fallback?.source_id === 'string'
            ? fallback.source_id
            : undefined,
      cta_label:
        typeof raw?.cta_label === 'string'
          ? raw.cta_label
          : typeof fallback?.cta_label === 'string'
            ? fallback.cta_label
            : undefined,
      cta_url:
        typeof raw?.cta_url === 'string'
          ? raw.cta_url
          : typeof fallback?.cta_url === 'string'
            ? fallback.cta_url
            : undefined
    });

    defaults.delete(tentativeKey);
  });

  for (const remaining of defaults.values()) {
    merged.set(remaining.key, { ...remaining });
  }

  return Array.from(merged.values()).sort((a, b) => a.sort_order - b.sort_order);
};

const sanitizeSectionsForSave = (sections: EditableSection[]): SiteSection[] =>
  sections
    .map((section, index) => ({
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

export default function AdminHomeEditor() {
  const [sections, setSections] = useState<EditableSection[]>(cloneDefaults);
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
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/content', { cache: 'no-store' });
        const json = await response.json();
        if (json?.success) {
          setSections(mergeWithDefaults(json.sections));
        } else {
          setSections(cloneDefaults());
        }
      } catch (error) {
        console.error('[AdminHomeEditor] fetchSections error:', error);
        setSections(cloneDefaults());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (listsLoaded) return;

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
  }, [listsLoaded]);

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
      if (value === 'custom') {
        setSections((prev) =>
          prev.map((section) =>
            section.key === sectionKey
              ? {
                  ...section,
                  source_type: 'custom',
                  source_id: undefined
                }
              : section
          )
        );
        return;
      }

      setSections((prev) =>
        prev.map((section) =>
          section.key === sectionKey
            ? {
                ...section,
                source_type: value
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
      const token = localStorage.getItem('token') || '';
      const payload = sanitizeSectionsForSave(sections);

      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ sections: payload })
      });
      const json = await res.json();
      if (json.success) {
        alert('Secciones guardadas correctamente');
        setSections(mergeWithDefaults(json.sections));
      } else {
        alert(json.error || 'No se pudo guardar la información');
      }
    } catch (error) {
      console.error('[AdminHomeEditor] save error:', error);
      alert('Error guardando');
    } finally {
      setSaving(false);
    }
  }, [sections]);

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
        const token = localStorage.getItem('token') || '';
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'home');
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
    [updateSection]
  );

  const clearCache = useCallback(async () => {
    setClearingCache(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/admin/content/clear_cache', {
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
  }, []);

  const addSection = useCallback(() => {
    const nextIndex = sections.length;
    const newSection: EditableSection = {
      key: `section_${Date.now()}`,
      title: `Nueva sección ${nextIndex + 1}`,
      content: '',
      image_url: '',
      sort_order: nextIndex,
      source_type: 'custom'
    };
    setSections((prev) => [...prev, newSection]);
  }, [sections.length]);

  const resetToDefaults = useCallback(() => {
    if (window.confirm('¿Restablecer las secciones a los valores por defecto?')) {
      setSections(cloneDefaults());
    }
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Editor de Inicio</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="space-y-4">
          {sortedSections.map((section, index) => {
            const label = section.key ? `Sección ${index + 1} · ${section.key}` : `Sección ${index + 1}`;

            return (
              <div key={section.key || index} className="border p-4 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
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
                    >
                      <option value="custom">Contenido manual</option>
                      <option value="event">Evento destacado</option>
                      <option value="news">Noticia destacada</option>
                    </select>
                  </div>
                  {section.source_type === 'event' && (
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
                  {section.source_type === 'news' && (
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
                  rows={5}
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
              </div>
            );
          })}

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

