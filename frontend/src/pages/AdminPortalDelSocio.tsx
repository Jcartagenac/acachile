import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { File, FileImage, FileText, Laptop, Save, Settings2, Smartphone, Tablet, Trash2, Upload, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { PortalSectionContent } from '@shared/portalSections';
import type { PortalDocument } from '@shared/portalDocuments';
import { getDefaultPortalSections } from '../features/portal/portalSections';
import { PortalDocumentsGrid } from '../components/portal/PortalDocumentsPreview';
import { cn } from '../utils/cn';

const getAuthToken = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  if (typeof window !== 'undefined') return window.localStorage.getItem('auth_token') || '';
  return '';
};

const isImageType = (fileType: string) => fileType.startsWith('image/');
const isPdfType = (fileType: string) => fileType === 'application/pdf';

const formatBytes = (value?: number | null) => {
  if (!value) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

function DocumentThumb({ document }: { document: PortalDocument }) {
  if (isImageType(document.file_type)) {
    return <img src={document.file_url} alt={document.visible_name} className="h-full w-full object-cover" />;
  }

  if (isPdfType(document.file_type)) {
    return <div className="flex h-full w-full items-center justify-center bg-red-50 text-red-600"><FileText className="h-10 w-10" /></div>;
  }

  if (document.file_type.includes('word') || document.file_type.includes('document')) {
    return <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600"><FileText className="h-10 w-10" /></div>;
  }

  return <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500"><File className="h-10 w-10" /></div>;
}

type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

const previewViewports: Array<{ key: PreviewViewport; label: string; icon: typeof Laptop; widthClass: string }> = [
  { key: 'desktop', label: 'Desktop', icon: Laptop, widthClass: 'w-full' },
  { key: 'tablet', label: 'Tablet', icon: Tablet, widthClass: 'mx-auto w-full max-w-[820px]' },
  { key: 'mobile', label: 'Móvil', icon: Smartphone, widthClass: 'mx-auto w-full max-w-[390px]' },
];

export default function AdminPortalDelSocio() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<PortalSectionContent[]>(getDefaultPortalSections());
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [activeKey, setActiveKey] = useState<string>(getDefaultPortalSections()[0]?.key || 'inicio');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDocumentsPreview, setShowDocumentsPreview] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getAuthToken();
        const [sectionsResponse, documentsResponse] = await Promise.all([
          fetch('/api/admin/portal-sections', {
            cache: 'no-store',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
          fetch('/api/admin/portal-documents', {
            cache: 'no-store',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }),
        ]);

        const sectionsJson = await sectionsResponse.json();
        const documentsJson = await documentsResponse.json();

        if (!sectionsResponse.ok || !sectionsJson.success) {
          throw new Error(sectionsJson.error || 'No se pudo cargar el Portal del Socio');
        }
        if (!documentsResponse.ok || !documentsJson.success) {
          throw new Error(documentsJson.error || 'No se pudieron cargar los documentos');
        }

        if (active && Array.isArray(sectionsJson.sections) && sectionsJson.sections.length > 0) {
          setSections(sectionsJson.sections);
          setActiveKey((current) => current || sectionsJson.sections[0].key);
        }
        if (active && Array.isArray(documentsJson.documents)) {
          setDocuments(documentsJson.documents);
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

  const currentViewport = previewViewports.find((item) => item.key === previewViewport) || previewViewports[0];

  const updateSection = (key: string, field: 'title' | 'description', value: string) => {
    setSections((current) =>
      current.map((section) => (section.key === key ? { ...section, [field]: value } : section)),
    );
  };

  const handleSaveSections = async () => {
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

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setError(null);
      const token = getAuthToken();
      const uploaded: PortalDocument[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('visibleName', file.name);

        const response = await fetch('/api/admin/portal-documents', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || `No se pudo subir ${file.name}`);
        }
        uploaded.push(json.document);
      }

      setDocuments((current) => [...uploaded, ...current]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo documentos');
    } finally {
      setUploading(false);
    }
  };

  const handleRenameDocument = async (id: number, visibleName: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/portal-documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ visible_name: visibleName }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'No se pudo actualizar el nombre');
      }
      setDocuments((current) => current.map((item) => (item.id === id ? json.document : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando documento');
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/portal-documents/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'No se pudo eliminar el documento');
      }
      setDocuments((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando documento');
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
              Gestiona el contenido base de cada sección y administra los documentos públicos del portal desde el panel administrativo.
            </p>
          </div>
          <Button onClick={handleSaveSections} className="bg-red-600 text-white" disabled={saving || loading}>
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
                  onClick={() => {
                    if (section.key === 'competencias') {
                      navigate('/panel-admin/portal-del-socio/competencias');
                      return;
                    }
                    setActiveKey(section.key);
                  }}
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
              <div className="space-y-8">
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

                {activeSection.key === 'documentos' ? (
                  <div className="space-y-5 border-t border-gray-200 pt-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Gestión de documentos</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Sube, renombra y elimina archivos que se mostrarán en la sección Documentos del Portal del Socio.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => handleUploadFiles(event.target.files)}
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                        />
                        <Button
                          variant={showDocumentsPreview ? 'outline' : 'secondary'}
                          onClick={() => setShowDocumentsPreview((current) => !current)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> {showDocumentsPreview ? 'Ocultar vista previa' : 'Vista previa'}
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} className="bg-red-600 text-white" disabled={uploading}>
                          <Upload className="mr-2 h-4 w-4" /> {uploading ? 'Subiendo…' : 'Subir archivos'}
                        </Button>
                      </div>
                    </div>

                    {documents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                        Aún no hay documentos cargados para esta sección.
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {documents.map((document) => (
                          <div key={document.id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="h-40 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                              <DocumentThumb document={document} />
                            </div>

                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                  Nombre visible
                                </label>
                                <input
                                  defaultValue={document.visible_name}
                                  onBlur={(event) => {
                                    const nextValue = event.target.value.trim();
                                    if (nextValue && nextValue !== document.visible_name) {
                                      handleRenameDocument(document.id, nextValue);
                                    }
                                  }}
                                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                                />
                              </div>

                              <div className="text-xs text-gray-500">
                                <div>{document.file_name}</div>
                                <div className="mt-1 flex items-center gap-2">
                                  {isImageType(document.file_type) ? <FileImage className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                  <span>{document.file_type}</span>
                                  <span>·</span>
                                  <span>{formatBytes(document.file_size)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <a
                                  href={document.file_url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-flex items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                >
                                  Ver archivo
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDocument(document.id)}
                                  className="inline-flex items-center rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showDocumentsPreview ? (
                      <div className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Vista previa del frontend</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Esta vista reutiliza la misma grilla del portal público y refleja nombres visibles, orden y archivos actuales.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {previewViewports.map((viewport) => {
                              const Icon = viewport.icon;
                              return (
                                <button
                                  key={viewport.key}
                                  type="button"
                                  onClick={() => setPreviewViewport(viewport.key)}
                                  className={cn(
                                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                                    previewViewport === viewport.key
                                      ? 'border-red-500 bg-red-50 text-red-700'
                                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  {viewport.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-gray-200 bg-white p-3 shadow-inner sm:p-5">
                          <div className={cn('transition-all duration-300', currentViewport.widthClass)}>
                            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 p-4 shadow-soft-xl backdrop-blur-soft sm:p-6">
                              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-neutral-950">Biblioteca de documentos</h3>
                                  <p className="mt-1 text-sm text-neutral-600">Archivos administrados desde el panel del Portal del Socio.</p>
                                </div>
                                <div className="text-xs text-neutral-500">Vista {currentViewport.label.toLowerCase()}</div>
                              </div>

                              <PortalDocumentsGrid
                                documents={documents}
                                emptyMessage="Aún no hay documentos cargados para esta sección."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
