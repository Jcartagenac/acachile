import { Download, File, FileText } from 'lucide-react';
import type { PortalDocument } from '@shared/portalDocuments';
import { cn } from '../../utils/cn';

const isImageType = (fileType: string) => fileType.startsWith('image/');
const isPdfType = (fileType: string) => fileType === 'application/pdf';

export function PortalDocumentCard({ document }: { document: PortalDocument }) {
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

export function PortalDocumentsGrid({
  documents,
  loading,
  emptyMessage = 'Aún no hay documentos publicados en esta sección.',
  className,
}: {
  documents: PortalDocument[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={cn('rounded-[28px] border border-neutral-200 bg-neutral-50/90 px-6 py-10 text-center text-sm text-neutral-500', className)}>
        Cargando documentos…
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={cn('rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50/90 px-6 py-10 text-center text-sm text-neutral-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {documents.map((document) => (
        <PortalDocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
