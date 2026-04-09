/**
 * Configuración centralizada de variables de entorno
 * Este archivo lee las variables de entorno inyectadas durante el build
 * Por Cloudflare Pages o localmente desde .env files
 */

/**
 * URL base del API
 * En producción preferimos el mismo origin actual del navegador para evitar
 * errores cross-origin entre acachile.com y www.acachile.com.
 */
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

const resolveApiBaseUrl = () => {
  if (!configuredApiBaseUrl) {
    return import.meta.env.MODE === 'production' ? browserOrigin : 'http://localhost:8788';
  }

  const normalizedConfigured = configuredApiBaseUrl.replace(/\/$/, '');

  if (typeof window === 'undefined') {
    return normalizedConfigured;
  }

  try {
    const configuredUrl = new URL(normalizedConfigured, browserOrigin);
    const configuredHost = configuredUrl.hostname.replace(/^www\./, '');
    const currentHost = window.location.hostname.replace(/^www\./, '');

    // Si estamos en el mismo dominio base pero distinto subdominio (www vs apex),
    // usar el mismo origin actual del navegador para evitar bloqueos CORS.
    if (configuredHost === currentHost && configuredUrl.origin !== window.location.origin) {
      return window.location.origin;
    }

    return configuredUrl.toString().replace(/\/$/, '');
  } catch {
    return normalizedConfigured;
  }
};

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Entorno actual (development, production, preview)
 */
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';

/**
 * Dominio del sitio (usado para CORS y validaciones)
 */
export const DOMAIN = import.meta.env.VITE_DOMAIN || 
  (import.meta.env.MODE === 'production' 
    ? window.location.hostname 
    : 'localhost');

/**
 * URL pública de R2 para imágenes
 */
export const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 
  `https://images.${DOMAIN}`;

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = ENVIRONMENT === 'development' || import.meta.env.DEV;

/**
 * Verifica si estamos en modo producción
 */
export const isProduction = ENVIRONMENT === 'production' || import.meta.env.PROD;

/**
 * Log de configuración en desarrollo
 */
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    API_BASE_URL,
    ENVIRONMENT,
    DOMAIN,
    R2_PUBLIC_URL,
    mode: import.meta.env.MODE
  });
}
