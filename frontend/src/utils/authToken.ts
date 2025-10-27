const TOKEN_KEYS = ['auth_token', 'authToken', 'token'] as const;

const escapeCookieName = (name: string) =>
  name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapeCookieName(name)}=([^;]*)`)
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
};

export const getStoredToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const fromCookie = readCookie(key);
    if (fromCookie) {
      return fromCookie;
    }
  }

  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of TOKEN_KEYS) {
    const fromStorage = window.localStorage.getItem(key);
    if (fromStorage) {
      return fromStorage;
    }
  }

  return null;
};

export const buildAuthHeaders = (
  baseHeaders?: HeadersInit,
  contentType?: string
): Headers => {
  const headers = new Headers(baseHeaders ?? undefined);

  if (contentType && !headers.has('Content-Type')) {
    headers.set('Content-Type', contentType);
  }

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};
