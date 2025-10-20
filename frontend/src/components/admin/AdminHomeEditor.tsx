import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import type { SiteSection } from '@shared/siteSections';
import { DEFAULT_SITE_SECTIONS } from '@shared/siteSections';

type EditableSection = SiteSection & { preview_image?: string };

const mergeWithDefaults = (incoming: Partial<SiteSection>[] | undefined): EditableSection[] => {
  const defaults = new Map(DEFAULT_SITE_SECTIONS.map((section) => [section.key, section]));
  const merged = new Map<string, EditableSection>();

  (incoming || []).forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim()
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
      sort_order: sortOrder
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
      sort_order: typeof section.sort_order === 'number' ? section.sort_order : index
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

const cloneDefaults = () => DEFAULT_SITE_SECTIONS.map((section) => ({ ...section }));

export default function AdminHomeEditor() {
  const [sections, setSections] = useState<EditableSection[]>(cloneDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSections();
  }, []);

  async function fetchSections() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setSections(mergeWithDefaults(json.sections));
      } else {
        setSections(cloneDefaults());
      }
    } catch (e) {
      console.error(e);
      setSections(cloneDefaults());
    } finally {
      setLoading(false);
    }
  }

  function updateSection(sectionKey: string, key: keyof EditableSection, value: string | number) {
    setSections((prev) =>
      prev.map((section) =>
        section.key === sectionKey
          ? { ...section, [key]: value }
          : section
      )
    );
  }

  async function save() {
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
    } catch (e) {
      console.error(e);
      alert('Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(sectionKey: string, file: File) {
    if (!file) return;
    setUploadsInProgress((v) => v + 1);
    setUploadError((p) => ({ ...p, [sectionKey]: '' }));

    // Show local preview immediately
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

      // Use XHR to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/content/upload');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress((p) => ({ ...p, [sectionKey]: pct }));
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
                setUploadError((p) => ({ ...p, [sectionKey]: json.error || 'Error subida' }));
                reject(new Error(json.error || 'Upload failed'));
              }
            } catch (e) {
              setUploadError((p) => ({ ...p, [sectionKey]: 'Respuesta inválida' }));
              reject(e);
            }
          } else {
            setUploadError((p) => ({ ...p, [sectionKey]: `HTTP ${xhr.status}` }));
            reject(new Error(`HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          setUploadError((p) => ({ ...p, [sectionKey]: 'Error de red' }));
          reject(new Error('Network error'));
        };

        xhr.send(form);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUploadProgress((p) => ({ ...p, [sectionKey]: 0 }));
      setUploadsInProgress((v) => Math.max(0, v - 1));
    }
  }

  async function clearCache() {
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
        alert('No se pudo borrar cache');
      }
    } catch (e) {
      console.error(e);
      alert('Error al borrar cache');
    } finally {
      setClearingCache(false);
    }
  }

  function addSection() {
    const nextIndex = sections.length;
    const newSection: EditableSection = {
      key: `section_${Date.now()}`,
      title: `Nueva sección ${nextIndex + 1}`,
      content: '',
      image_url: '',
      sort_order: nextIndex
    };
    setSections((prev) => [...prev, newSection]);
  }

  function resetToDefaults() {
    if (window.confirm('¿Restablecer las secciones a los valores por defecto?')) {
      setSections(cloneDefaults());
    }
  }

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sort_order - b.sort_order),
    [sections]
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Editor de Inicio</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="space-y-4">
          {sortedSections.map((s, idx) => {
            const sectionNumber = idx + 1;
            const label = `Sección ${sectionNumber}${s.key ? ` · ${s.key}` : ''}`;

            return (
              <div key={s.key || idx} className="border p-4 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Orden</label>
                    <input
                      type="number"
                      value={s.sort_order ?? idx}
                      onChange={(e) => updateSection(s.key, 'sort_order', Number(e.target.value))}
                      className="w-20 border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <label className="block text-sm font-medium">Título</label>
                <input
                  value={s.title || ''}
                  onChange={(e) => updateSection(s.key, 'title', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Título de la sección"
                />

                <label className="block text-sm font-medium mt-2">Imagen (URL)</label>
                <input
                  value={s.image_url || ''}
                  onChange={(e) => updateSection(s.key, 'image_url', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder="https://..."
                />
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(s.key, f);
                    }}
                  />
                  <span className="text-sm text-gray-500">o pega una URL arriba</span>
                </div>
                {/* Thumbnail & progress */}
                {s.image_url ? (
                  <div className="mb-2">
                    <img src={s.image_url} alt="preview" style={{ maxHeight: 120 }} className="rounded" />
                  </div>
                ) : null}
                {uploadProgress[s.key] ? (
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded h-2">
                      <div style={{ width: `${uploadProgress[s.key]}%` }} className="bg-blue-500 h-2 rounded" />
                    </div>
                    <div className="text-xs text-gray-600">{uploadProgress[s.key]}%</div>
                  </div>
                ) : null}
                {uploadError[s.key] ? <div className="text-sm text-red-600">{uploadError[s.key]}</div> : null}
                <label className="block text-sm font-medium">Contenido</label>
                <textarea
                  value={s.content || ''}
                  onChange={(e) => updateSection(s.key, 'content', e.target.value)}
                  className="w-full border rounded px-2 py-1 mb-2"
                />
              </div>
            );
          })}

          <div className="flex space-x-2">
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
              <div className="text-sm text-gray-600 self-center">Subiendo imágenes… ({uploadsInProgress})</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
