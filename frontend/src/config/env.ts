/**
 * Configuración centralizada de variables de entorno
 * Este archivo lee las variables de entorno inyectadas durante el build
 * Por Cloudflare Pages o localmente desde .env files
 */

/**
 * URL base del API
 * En producción, esto es inyectado por Cloudflare Pages desde la variable FRONTEND_URL
 * En desarrollo, usa el valor de .env.local o localhost
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? window.location.origin 
    : 'http://localhost:8788');

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
