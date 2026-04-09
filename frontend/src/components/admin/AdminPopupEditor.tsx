import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { SitePopupConfig } from '@shared/sitePopup';

type PopupFormState = {
  image_url: string;
  link_url: string;
  open_in_new_tab: boolean;
  is_active: boolean;
  updated_at?: string;
};

const getAuthToken = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  if (typeof window !== 'undefined') return window.localStorage.getItem('auth_token') || '';
  return '';
};

const emptyState: PopupFormState = {
  image_url: '',
  link_url: '',
  open_in_new_tab: false,
  is_active: false,
};

const normalizePopup = (popup: SitePopupConfig | null | undefined): PopupFormState => ({
  image_url: popup?.image_url || '',
  link_url: popup?.link_url || '',
  open_in_new_tab: Boolean(popup?.open_in_new_tab),
  is_active: Boolean(popup?.is_active),
  updated_at: popup?.updated_at,
});

export default function AdminPopupEditor() {
  const [form, setForm] = useState<PopupFormState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const response = await fetch('/api/admin/content/popup', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'No se pudo cargar el popup');
        }

        if (active) setForm(normalizePopup(json.popup));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error cargando popup');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const updateField = useCallback(<K extends keyof PopupFormState>(key: K, value: PopupFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => updateField('image_url', String(reader.result));
    reader.readAsDataURL(file);

    try {
      const token = getAuthToken();
      const payload = new FormData();
      payload.append('file', file);
      payload.append('folder', 'popup');
      payload.append('filename', file.name);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/content/upload');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText);
              if (json.success && json.url) {
                updateField('image_url', json.url);
                resolve();
                return;
              }
              reject(new Error(json.error || 'No se pudo subir la imagen'));
            } catch (error) {
              reject(error);
            }
            return;
          }
          reject(new Error(`HTTP ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error('Error de red al subir la imagen'));
        xhr.send(payload);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo imagen');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [updateField]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const trimmedImageUrl = form.image_url.trim();
      const trimmedLinkUrl = form.link_url.trim();

      if (form.is_active && !trimmedImageUrl) {
        throw new Error('Debes subir una imagen antes de activar el popup');
      }

      const token = getAuthToken();
      const response = await fetch('/api/admin/content/popup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image_url: trimmedImageUrl,
          link_url: trimmedLinkUrl,
          open_in_new_tab: trimmedLinkUrl ? form.open_in_new_tab : false,
          is_active: form.is_active,
        }),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || `No se pudo guardar el popup (HTTP ${response.status})`);
      }

      setForm(normalizePopup(json.popup));
      alert('Popup guardado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando popup');
    } finally {
      setSaving(false);
    }
  }, [form]);

  const hasLink = useMemo(() => form.link_url.trim().length > 0, [form.link_url]);

  if (loading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">Cargando popup…</div>;
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Pop Up principal del sitio</h2>
        <p className="text-sm text-gray-600">
          Administra el popup que se muestra al ingresar a la portada. Solo existe un popup principal activo a la vez.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">Imagen del popup</label>
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Sube una imagen idealmente de 800 x 800 px</p>
                  <p className="text-xs text-gray-500 mt-1">Se adaptará en escritorio, tablet y móvil manteniendo proporción sin deformarse.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Subiendo…' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadImage(file);
                    }}
                    disabled={uploading || saving}
                  />
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">O pega una URL si quieres reemplazarla manualmente</label>
                <input
                  value={form.image_url}
                  onChange={(event) => updateField('image_url', event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  disabled={saving}
                />
              </div>

              {uploading && uploadProgress > 0 ? (
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-red-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{uploadProgress}%</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => {
                  if (event.target.checked && !form.image_url.trim()) {
                    setError('Debes subir una imagen antes de activar el popup');
                    return;
                  }
                  setError(null);
                  updateField('is_active', event.target.checked);
                }}
                className="mt-1 rounded border-gray-300"
                disabled={saving}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Activar popup</span>
                <span className="block text-xs text-gray-500 mt-1">Si está desactivado, no se mostrará nada en la web.</span>
              </span>
            </label>

            <label className={`flex items-start gap-3 rounded-xl border p-4 ${hasLink ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
              <input
                type="checkbox"
                checked={form.open_in_new_tab}
                onChange={(event) => updateField('open_in_new_tab', event.target.checked)}
                className="mt-1 rounded border-gray-300"
                disabled={!hasLink || saving}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Abrir link en nueva pestaña</span>
                <span className="block text-xs text-gray-500 mt-1">Solo aplica si configuraste un enlace en la imagen.</span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Enlace opcional al hacer clic en la imagen</label>
            <input
              value={form.link_url}
              onChange={(event) => updateField('link_url', event.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
              disabled={saving}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} className="bg-red-600 text-white" disabled={saving || uploading}>
              {saving ? 'Guardando…' : 'Guardar popup'}
            </Button>
            <Button
              variant="outline"
              disabled={saving || uploading}
              onClick={() => setForm((prev) => ({ ...emptyState, updated_at: prev.updated_at }))}
            >
              Limpiar formulario
            </Button>
            {form.updated_at ? <span className="text-xs text-gray-500">Última actualización: {new Date(form.updated_at).toLocaleString('es-CL')}</span> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
              <Eye className="h-4 w-4" /> Vista previa
            </div>

            <div className="mx-auto flex min-h-[320px] w-full max-w-[320px] items-center justify-center rounded-[28px] bg-black/75 p-4 shadow-inner">
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-white shadow-2xl">
                {form.image_url ? (
                  form.link_url ? (
                    <a
                      href={form.link_url}
                      target={form.open_in_new_tab ? '_blank' : '_self'}
                      rel={form.open_in_new_tab ? 'noreferrer noopener' : undefined}
                      className="flex h-full w-full items-center justify-center"
                    >
                      <img src={form.image_url} alt="Vista previa del popup" className="h-full w-full object-contain" />
                    </a>
                  ) : (
                    <img src={form.image_url} alt="Vista previa del popup" className="h-full w-full object-contain" />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 text-center text-sm text-gray-500">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                    <p>Sube una imagen para ver cómo se presentará el popup.</p>
                  </div>
                )}

                <button
                  type="button"
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-lg"
                  aria-label="Cerrar preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-2">Resumen de publicación</p>
            <ul className="space-y-2">
              <li><span className="font-medium text-gray-800">Estado:</span> {form.is_active ? 'Activo' : 'Inactivo'}</li>
              <li><span className="font-medium text-gray-800">Imagen:</span> {form.image_url ? 'Cargada' : 'Pendiente'}</li>
              <li><span className="font-medium text-gray-800">Link:</span> {hasLink ? form.link_url : 'Sin enlace'}</li>
              <li><span className="font-medium text-gray-800">Destino:</span> {hasLink ? (form.open_in_new_tab ? 'Nueva pestaña' : 'Misma pestaña') : 'No aplica'}</li>
            </ul>
            {hasLink ? (
              <a
                href={form.link_url}
                target={form.open_in_new_tab ? '_blank' : '_self'}
                rel={form.open_in_new_tab ? 'noreferrer noopener' : undefined}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <ExternalLink className="h-4 w-4" /> Probar enlace configurado
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
