import { useEffect, useMemo, useRef } from 'react';
import { getOfficialAcaLogoUrl } from '@/config/branding';
import cotizadorTemplate from '@/assets/cotizador/cotizador-template.html?raw';

const TEMPLATE_LOGO_TOKEN = '__ACA_LOGO_URL__';

const CotizadorPage = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const iframeHtml = useMemo(
    () => cotizadorTemplate.replaceAll(TEMPLATE_LOGO_TOKEN, getOfficialAcaLogoUrl()),
    [],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(iframeHtml);
    doc.close();
  }, [iframeHtml]);

  return (
    <div className="h-screen bg-neutral-50">
      <iframe
        ref={iframeRef}
        title="Cotizador ACA Chile"
        className="block h-full w-full border-0 bg-white"
        sandbox="allow-scripts allow-downloads allow-modals allow-same-origin"
      />
    </div>
  );
};

export default CotizadorPage;
