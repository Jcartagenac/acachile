import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { SitePopupConfig } from '@shared/sitePopup';

interface SitePopupProps {
  popup: SitePopupConfig | null;
}

const buildDismissKey = (popup: SitePopupConfig | null) => {
  if (!popup) return '';
  return `aca-site-popup-dismissed:${popup.updated_at || popup.image_url}`;
};

export function SitePopup({ popup }: SitePopupProps) {
  const dismissKey = useMemo(() => buildDismissKey(popup), [popup]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!popup?.is_active || !popup.image_url) {
      setIsOpen(false);
      return;
    }

    try {
      const dismissed = dismissKey ? window.sessionStorage.getItem(dismissKey) : null;
      setIsOpen(dismissed !== 'true');
    } catch {
      setIsOpen(true);
    }
  }, [popup, dismissKey]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !dismissKey) return;
    try {
      window.sessionStorage.setItem(dismissKey, 'true');
    } catch {
      // ignore session storage issues
    }
  }, [isOpen, dismissKey]);

  if (!popup?.is_active || !popup.image_url || !isOpen) return null;

  const image = (
    <img
      src={popup.image_url}
      alt="Popup principal ACA Chile"
      className="h-full w-full object-contain"
    />
  );

  const imageContent = popup.link_url ? (
    <a
      href={popup.link_url}
      target={popup.open_in_new_tab ? '_blank' : '_self'}
      rel={popup.open_in_new_tab ? 'noreferrer noopener' : undefined}
      className="block h-full w-full"
    >
      {image}
    </a>
  ) : image;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/72 px-4 py-6 backdrop-blur-[2px]" onClick={() => setIsOpen(false)}>
      <div
        className="relative w-full max-w-[800px] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_-35px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-black/80"
          aria-label="Cerrar popup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex max-h-[88vh] min-h-[280px] w-full items-center justify-center bg-white p-4 sm:p-5 lg:p-6">
          <div className="aspect-square w-full max-w-[800px] overflow-hidden rounded-2xl bg-white">
            {imageContent}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SitePopup;
