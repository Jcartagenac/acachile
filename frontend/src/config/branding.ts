export const DEFAULT_HEADER_LOGO = 'https://pub-9edd01c5f73442228a840ca5c8fca38a.r2.dev/home/img-1762489301673-11k166.jpg';

export const getOfficialAcaLogoUrl = () => {
  const envLogoUrl = (import.meta.env.VITE_HEADER_LOGO_URL as string | undefined)?.trim();
  return envLogoUrl || DEFAULT_HEADER_LOGO;
};
