import { useEffect, useMemo, useState } from 'react';
import { Save, Settings2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { PortalSectionContent } from '@shared/portalSections';
import { getDefaultPortalSections } from '../features/portal/portalSections';

const getAuthToken = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  if (typeof window !== 'undefined') return window.localStorage.getItem('auth_token') || '';
  return '';
};

export default function AdminPortalDelSocio() {
  const [sections, setSections] = useState<PortalSectionContent[]>(getDefaultPortalSections());
  const [activeKey, setActiveKey] = useState<string>(getDefaultPortalSections()[0]?.key || 'inicio');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getAuthToken();
        const response = await fetch('/api/admin/portal-sections', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'No se pudo cargar el Portal del Socio');
        }
        if (active && Array.isArray(json.sections) && json.sections.length > 0) {
          setSections(json.sections);
          setActiveKey(json.sections[0].key);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error cargando Portal del Socio');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeKey) || sections[0],
    [sections, activeKey],
  );

  const updateSection = (key: string, field: 'title' | 'description', value: string) => {
    setSections((current) =>
      current.map((section) => (section.key === key ? { ...section, [field]: value } : section)),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      const response = await fetch('/api/admin/portal-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sections }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'No se pudo guardar el Portal del Socio');
      }
      setSections(json.sections);
      alert('Portal del Socio guardado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando Portal del Socio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">
              <Settings2 className="h-4 w-4" /> Administración
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Portal del Socio</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
              Gestiona el contenido base de cada sección del Portal del Socio desde el panel administrativo.
            </p>
          </div>
          <Button onClick={handleSave} className="bg-red-600 text-white" disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="px-2 pb-3 text-sm font-semibold text-gray-900">Secciones del portal</p>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveKey(section.key)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    activeKey === section.key
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-transparent bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{section.title}</div>
                  <div className="mt-1 text-xs text-gray-500">/{section.path}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            {loading || !activeSection ? (
              <div className="text-sm text-gray-600">Cargando editor…</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">Editando sección</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">{activeSection.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">Ruta pública: /portaldelsocio/{activeSection.path}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Título</label>
                  <input
                    value={activeSection.title}
                    onChange={(event) => updateSection(activeSection.key, 'title', event.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                    placeholder="Título de la sección"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Descripción</label>
                  <textarea
                    value={activeSection.description}
                    onChange={(event) => updateSection(activeSection.key, 'description', event.target.value)}
                    rows={8}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-7 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                    placeholder="Describe el contenido base de esta sección"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
