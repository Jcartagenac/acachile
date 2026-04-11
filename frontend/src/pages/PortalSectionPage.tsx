import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowUpRight, Blocks, Compass, Download, File, FileImage, FileText, Layers3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PortalSectionContent } from '@shared/portalSections';
import type { PortalDocument } from '@shared/portalDocuments';
import type { PortalLayoutContextValue } from '../components/portal/PortalDelSocioLayout';

const isImageType = (fileType: string) => fileType.startsWith('image/');
const isPdfType = (fileType: string) => fileType === 'application/pdf';

function DocumentCard({ document }: { document: PortalDocument }) {
  const thumb = (() => {
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
  })();

  return (
    <a
      href={document.file_url}
      target="_blank"
      rel="noreferrer noopener"
      className="group rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <div className="h-44 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">{thumb}</div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{document.visible_name}</p>
          <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{document.file_name}</p>
        </div>
        <div className="rounded-full bg-neutral-100 p-2 text-neutral-600 transition group-hover:bg-primary-50 group-hover:text-primary-700">
          <Download className="h-4 w-4" />
        </div>
      </div>
    </a>
  );
}

export default function PortalSectionPage() {
  const { section: sectionPath } = useParams();
  const { sections } = useOutletContext<PortalLayoutContextValue>();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const section: PortalSectionContent | undefined = sections.find((item) => item.path === sectionPath) || sections[0];

  useEffect(() => {
    let active = true;
    if (section?.path !== 'documentos') {
      setDocuments([]);
      return;
    }

    (async () => {
      try {
        setDocumentsLoading(true);
        const response = await fetch('/api/portal/documents', { cache: 'no-store' });
        const json = await response.json();
        if (active && response.ok && json?.success && Array.isArray(json.documents)) {
          setDocuments(json.documents);
        }
      } catch (error) {
        console.warn('[PortalSectionPage] No se pudieron cargar documentos.', error);
      } finally {
        if (active) setDocumentsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [section?.path]);

  if (!section) {
    return (
      <div className="rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-soft-xl backdrop-blur-soft">
        <h2 className="text-2xl font-bold text-neutral-950">Portal del Socio</h2>
        <p className="mt-2 text-sm text-neutral-600">No se pudo resolver la sección solicitada.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] w-full flex-col gap-6 rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-soft-xl backdrop-blur-soft sm:p-8 lg:p-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px] xl:items-start">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
            Portal del Socio
          </p>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.6rem]">
              {section.title}
            </h2>
            <p className="max-w-4xl text-sm leading-8 text-neutral-600 sm:text-base">
              {section.description}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-100/70 p-5 shadow-soft-lg">
          <p className="text-sm font-semibold text-neutral-900">Visión del módulo</p>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Esta sección ya está estructurada para crecer con componentes, integraciones, permisos, contenidos y herramientas propias.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 shadow-soft-sm">
            <ArrowUpRight className="h-4 w-4" /> Preparada para siguiente etapa
          </div>
        </div>
      </div>

      {section.path === 'documentos' ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-950">Biblioteca de documentos</h3>
              <p className="mt-1 text-sm text-neutral-600">Archivos administrados desde el panel del Portal del Socio.</p>
            </div>
            <div className="text-xs text-neutral-500">PDF, imágenes y documentos disponibles para socios.</div>
          </div>

          {documentsLoading ? (
            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 px-6 py-10 text-center text-sm text-neutral-500">
              Cargando documentos…
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50/90 px-6 py-10 text-center text-sm text-neutral-500">
              Aún no hay documentos publicados en esta sección.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 p-5 shadow-soft-sm transition-transform duration-200 hover:-translate-y-1">
              <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft-sm">
                <Blocks className="h-5 w-5 text-primary-600" />
              </div>
              <p className="mt-4 text-base font-semibold text-neutral-900">Base funcional</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                La sección ya está habilitada dentro del portal con navegación propia y una base clara para sumar contenido real.
              </p>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 p-5 shadow-soft-sm transition-transform duration-200 hover:-translate-y-1">
              <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft-sm">
                <Layers3 className="h-5 w-5 text-primary-600" />
              </div>
              <p className="mt-4 text-base font-semibold text-neutral-900">Escalabilidad</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                El módulo puede crecer con vistas, servicios, permisos, componentes específicos y lógica independiente cuando lo definan.
              </p>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 p-5 shadow-soft-sm transition-transform duration-200 hover:-translate-y-1 md:col-span-2 xl:col-span-1">
              <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft-sm">
                <Compass className="h-5 w-5 text-primary-600" />
              </div>
              <p className="mt-4 text-base font-semibold text-neutral-900">Navegación clara</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                Puedes moverte entre módulos sin salir del portal, manteniendo una experiencia fluida y consistente.
              </p>
            </div>
          </div>

          <div className="mt-auto overflow-hidden rounded-[32px] bg-gradient-to-r from-neutral-950 via-neutral-900 to-primary-900 px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)] sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-lg font-semibold">Bienvenido a la sección {section.title}</p>
                <p className="mt-2 text-sm leading-7 text-white/80 sm:text-base">
                  Este módulo ya tiene una base visual y estructural sólida para evolucionar hacia una experiencia completa dentro del Portal del Socio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/portaldelsocio/inicio"
                  className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
                >
                  Volver al inicio
                </Link>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-white/70">
                  Espacio listo para crecer
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
