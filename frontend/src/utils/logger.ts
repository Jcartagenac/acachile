/**
 * Sistema de logging para debug
 * ACA Chile Frontend
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'ACA', level: LogLevel = LogLevel.DEBUG) {
    this.prefix = prefix;
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, component: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] [${this.prefix}] [${level}] [${component}] ${message}`;
    
    if (data) {
      console.groupCollapsed(fullMessage);
      console.log('Data:', data);
      console.trace('Stack trace');
      console.groupEnd();
    } else {
      console.log(fullMessage);
    }
  }

  debug(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage('DEBUG', component, message, data);
    }
  }

  info(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('INFO', component, message, data);
    }
  }

  warn(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatMessage('WARN', component, message, data);
    }
  }

  error(component: string, message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.formatMessage('ERROR', component, message, error);
      if (error?.stack) {
        console.error('Error Stack:', error.stack);
      }
    }
  }

  // Métodos específicos para diferentes componentes
  auth = {
    debug: (message: string, data?: any) => this.debug('AUTH', message, data),
    info: (message: string, data?: any) => this.info('AUTH', message, data),
    warn: (message: string, data?: any) => this.warn('AUTH', message, data),
    error: (message: string, error?: any) => this.error('AUTH', message, error),
  };

  api = {
    debug: (message: string, data?: any) => this.debug('API', message, data),
    info: (message: string, data?: any) => this.info('API', message, data),
    warn: (message: string, data?: any) => this.warn('API', message, data),
    error: (message: string, error?: any) => this.error('API', message, error),
  };

  ui = {
    debug: (message: string, data?: any) => this.debug('UI', message, data),
    info: (message: string, data?: any) => this.info('UI', message, data),
    warn: (message: string, data?: any) => this.warn('UI', message, data),
    error: (message: string, error?: any) => this.error('UI', message, error),
  };

  search = {
    debug: (message: string, data?: any) => this.debug('SEARCH', message, data),
    info: (message: string, data?: any) => this.info('SEARCH', message, data),
    warn: (message: string, data?: any) => this.warn('SEARCH', message, data),
    error: (message: string, error?: any) => this.error('SEARCH', message, error),
  };

  events = {
    debug: (message: string, data?: any) => this.debug('EVENTS', message, data),
    info: (message: string, data?: any) => this.info('EVENTS', message, data),
    warn: (message: string, data?: any) => this.warn('EVENTS', message, data),
    error: (message: string, error?: any) => this.error('EVENTS', message, error),
  };

  // Función para logging de performance
  time(label: string) {
    console.time(`[${this.prefix}] ${label}`);
  }

  timeEnd(label: string) {
    console.timeEnd(`[${this.prefix}] ${label}`);
  }

  // Función para logging de red
  networkRequest(method: string, url: string, data?: any) {
    this.api.debug(`${method} ${url}`, { 
      method, 
      url, 
      data,
      timestamp: Date.now() 
    });
  }

  networkResponse(method: string, url: string, status: number, response?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.api[level](`${method} ${url} - ${status}`, { 
      method, 
      url, 
      status,
      response,
      timestamp: Date.now() 
    });
  }
}

// Instancia global del logger
export const logger = new Logger('ACA-CHILE', 
  import.meta.env.MODE === 'development' ? LogLevel.DEBUG : LogLevel.ERROR
);

// Helper para activar/desactivar logging
export const setDebugMode = (enabled: boolean) => {
  logger.setLevel(enabled ? LogLevel.DEBUG : LogLevel.ERROR);
  localStorage.setItem('aca_debug_mode', enabled.toString());
};

// Verificar si debug está activado desde localStorage
const debugFromStorage = localStorage.getItem('aca_debug_mode');
if (debugFromStorage === 'true') {
  logger.setLevel(LogLevel.DEBUG);
}

// Exponer funciones de debug en window para uso en DevTools
if (import.meta.env.MODE === 'development') {
  (window as any).acaDebug = {
    logger,
    setDebugMode,
    LogLevel,
    enableAll: () => setDebugMode(true),
    disableAll: () => setDebugMode(false),
  };
}

export default logger;