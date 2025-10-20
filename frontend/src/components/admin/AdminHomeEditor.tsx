import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

export default function AdminHomeEditor() {
  const [sections, setSections] = useState([] as any[]);
  const [loading, setLoading] = useState(false);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [uploadError, setUploadError] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchSections();
  }, []);

  async function fetchSections() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content');
      const json = await res.json();
      if (json.success) setSections(json.sections || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function updateSection(index: number, key: string, value: string | number) {
    const copy = [...sections];
    copy[index] = { ...copy[index], [key]: value };
    setSections(copy);
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      const json = await res.json();
      if (json.success) alert('Secciones guardadas correctamente');
    } catch (e) {
      console.error(e);
      alert('Error guardando');
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(index: number, file: File) {
    if (!file) return;
    setUploadsInProgress((v) => v + 1);
    setUploadError((p) => ({ ...p, [index]: '' }));

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      updateSection(index, 'image_url', String(reader.result));
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
            setUploadProgress((p) => ({ ...p, [index]: pct }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              if (json.success && json.url) {
                updateSection(index, 'image_url', json.url);
                resolve();
              } else {
                setUploadError((p) => ({ ...p, [index]: json.error || 'Error subida' }));
                reject(new Error(json.error || 'Upload failed'));
              }
            } catch (e) {
              setUploadError((p) => ({ ...p, [index]: 'Respuesta inválida' }));
              reject(e);
            }
          } else {
            setUploadError((p) => ({ ...p, [index]: `HTTP ${xhr.status}` }));
            reject(new Error(`HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          setUploadError((p) => ({ ...p, [index]: 'Error de red' }));
          reject(new Error('Network error'));
        };

        xhr.send(form);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUploadProgress((p) => ({ ...p, [index]: 0 }));
      setUploadsInProgress((v) => Math.max(0, v - 1));
    }
  }

  async function clearCache() {
    try {
      const res = await fetch('/api/admin/content/clear_cache', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Cache KV borrado');
      } else {
        alert('No se pudo borrar cache');
      }
    } catch (e) {
      console.error(e);
      alert('Error al borrar cache');
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Editor de Inicio</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="space-y-4">
          {sections.map((s, idx) => (
            <div key={s.key || idx} className="border p-4 rounded">
              <label className="block text-sm font-medium">Título</label>
              <input value={s.title || ''} onChange={(e) => updateSection(idx, 'title', e.target.value)} className="w-full border rounded px-2 py-1 mb-2" />
              <label className="block text-sm font-medium">Imagen (URL)</label>
              <input value={s.image_url || ''} onChange={(e) => updateSection(idx, 'image_url', e.target.value)} className="w-full border rounded px-2 py-1 mb-2" />
              <div className="flex items-center space-x-2 mb-2">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(idx, f); }} />
                <span className="text-sm text-gray-500">o pega una URL arriba</span>
              </div>
              {/* Thumbnail & progress */}
              {s.image_url ? (
                <div className="mb-2">
                  <img src={s.image_url} alt="preview" style={{ maxHeight: 120 }} className="rounded" />
                </div>
              ) : null}
              {uploadProgress[idx] ? (
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div style={{ width: `${uploadProgress[idx]}%` }} className="bg-blue-500 h-2 rounded" />
                  </div>
                  <div className="text-xs text-gray-600">{uploadProgress[idx]}%</div>
                </div>
              ) : null}
              {uploadError[idx] ? <div className="text-sm text-red-600">{uploadError[idx]}</div> : null}
              <label className="block text-sm font-medium">Contenido</label>
              <textarea value={s.content || ''} onChange={(e) => updateSection(idx, 'content', e.target.value)} className="w-full border rounded px-2 py-1 mb-2" />
            </div>
          ))}

          <div className="flex space-x-2">
            <Button onClick={save} className="bg-red-600 text-white" disabled={uploadsInProgress > 0}>Guardar secciones</Button>
            <Button onClick={clearCache} className="bg-gray-600 text-white" disabled={uploadsInProgress > 0}>Borrar cache KV</Button>
            {uploadsInProgress > 0 && <div className="text-sm text-gray-600 self-center">Subiendo imagenes... ({uploadsInProgress})</div>}
          </div>
        </div>
      )}
    </div>
  );
}
