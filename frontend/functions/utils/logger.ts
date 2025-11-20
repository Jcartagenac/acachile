/**
 * Sistema de logging condicional para Cloudflare Pages Functions
 * Solo registra logs en desarrollo, pero siempre registra errores y warnings
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    data?: any;
    context?: string;
}

/**
 * Determina si debe registrar el log basado en el ambiente
 */
function shouldLog(level: LogLevel, environment?: string): boolean {
    // Errores y warnings siempre se registran
    if (level === 'error' || level === 'warn') {
        return true;
    }

    // Debug e info solo en desarrollo
    return environment === 'development';
}

/**
 * Formatea el mensaje de log con contexto
 */
function formatMessage(context: string | undefined, message: string): string {
    return context ? `[${context}] ${message}` : message;
}

/**
 * Logger principal
 */
export const logger = {
    /**
     * Log de debug - solo en desarrollo
     */
    debug: (message: string, options?: LogOptions, env?: string) => {
        if (shouldLog('debug', env)) {
            console.log(formatMessage(options?.context, message), options?.data || '');
        }
    },

    /**
     * Log de info - solo en desarrollo
     */
    info: (message: string, options?: LogOptions, env?: string) => {
        if (shouldLog('info', env)) {
            console.log(formatMessage(options?.context, message), options?.data || '');
        }
    },

    /**
     * Log de warning - siempre activo
     */
    warn: (message: string, options?: LogOptions) => {
        console.warn(formatMessage(options?.context, message), options?.data || '');
    },

    /**
     * Log de error - siempre activo
     */
    error: (message: string, options?: LogOptions) => {
        console.error(formatMessage(options?.context, message), options?.data || '');
    },
};

/**
 * Helper para crear un logger con contexto predefinido
 * 
 * @example
 * const log = createLogger('AUTH/LOGIN', env.ENVIRONMENT);
 * log.info('Processing login request');
 * log.debug('User details', { userId: 123 });
 * log.error('Login failed', { error: error.message });
 */
export function createLogger(context: string, env?: string) {
    return {
        debug: (message: string, data?: any) =>
            logger.debug(message, { context, data }, env),
        info: (message: string, data?: any) =>
            logger.info(message, { context, data }, env),
        warn: (message: string, data?: any) =>
            logger.warn(message, { context, data }),
        error: (message: string, data?: any) =>
            logger.error(message, { context, data }),
    };
}
