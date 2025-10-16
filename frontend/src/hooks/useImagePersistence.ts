import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CachedImage {
  url: string;
  filename: string;
  uploadedAt: string;
  expiresAt: string;
}

interface ImagePersistence {
  // Estado de carga
  isLoading: boolean;
  error: string | null;
  
  // URLs de imágenes
  avatarUrl: string | null;
  homeImages: string[];
  eventImages: { [eventId: string]: string };
  
  // Funciones de gestión
  cacheImageUrl: (key: string, url: string, filename: string) => void;
  getCachedImageUrl: (key: string) => string | null;
  clearExpiredCache: () => void;
  validateImageExists: (url: string) => Promise<boolean>;
  refreshImageCache: () => void;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milliseconds
const CACHE_KEY_PREFIX = 'acachile_image_';

export function useImagePersistence(): ImagePersistence {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [homeImages, setHomeImages] = useState<string[]>([]);
  const [eventImages, setEventImages] = useState<{ [eventId: string]: string }>({});

  // Inicializar cache al montar el componente
  useEffect(() => {
    initializeCache();
  }, [user?.id]);

  // Inicializar cache desde localStorage
  const initializeCache = () => {
    if (!user?.id) return;

    try {
      // Limpiar cache expirado
      clearExpiredCache();

      // Cargar avatar desde cache
      const cachedAvatar = getCachedImageUrl(`avatar_${user.id}`);
      if (cachedAvatar) {
        setAvatarUrl(cachedAvatar);
      }

      // Cargar imágenes del home
      const cachedHomeImages = getCachedImageUrls('home_images');
      setHomeImages(cachedHomeImages);

      // Cargar imágenes de eventos
      const cachedEvents = getCachedEventImages();
      setEventImages(cachedEvents);

    } catch (error) {
      console.error('Error inicializando cache de imágenes:', error);
      setError('Error cargando imágenes desde cache');
    }
  };

  // Guardar URL en cache con expiración
  const cacheImageUrl = (key: string, url: string, filename: string) => {
    try {
      const cachedImage: CachedImage = {
        url,
        filename,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + CACHE_DURATION).toISOString(),
      };

      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(cachedImage));

      // Actualizar estado según el tipo de imagen
      if (key.includes('avatar') && user?.id) {
        setAvatarUrl(url);
        
        // También actualizar en el contexto de Auth
        // Esto asegura que el avatar se mantenga sincronizado
        if (user) {
          user.avatar = url;
        }
      } else if (key.includes('home')) {
        setHomeImages(prev => [...prev, url]);
      }

      console.log('✅ Imagen guardada en cache:', { key, url, filename });

    } catch (error) {
      console.error('❌ Error guardando imagen en cache:', error);
      setError('Error guardando imagen en cache');
    }
  };

  // Obtener URL desde cache
  const getCachedImageUrl = (key: string): string | null => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cachedImage: CachedImage = JSON.parse(cached);
      const now = new Date();
      const expiresAt = new Date(cachedImage.expiresAt);

      // Verificar si no ha expirado
      if (now > expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cachedImage.url;

    } catch (error) {
      console.error('Error leyendo cache de imagen:', error);
      return null;
    }
  };

  // Obtener múltiples URLs del cache
  const getCachedImageUrls = (prefix: string): string[] => {
    try {
      const urls: string[] = [];
      const cacheKeyPrefix = `${CACHE_KEY_PREFIX}${prefix}`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(cacheKeyPrefix)) {
          const url = getCachedImageUrl(key.replace(CACHE_KEY_PREFIX, ''));
          if (url) urls.push(url);
        }
      }

      return urls;
    } catch (error) {
      console.error('Error obteniendo URLs del cache:', error);
      return [];
    }
  };

  // Obtener imágenes de eventos desde cache
  const getCachedEventImages = (): { [eventId: string]: string } => {
    try {
      const eventImages: { [eventId: string]: string } = {};
      const eventPrefix = `${CACHE_KEY_PREFIX}event_`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(eventPrefix)) {
          const eventId = key.replace(eventPrefix, '');
          const url = getCachedImageUrl(`event_${eventId}`);
          if (url) eventImages[eventId] = url;
        }
      }

      return eventImages;
    } catch (error) {
      console.error('Error obteniendo imágenes de eventos:', error);
      return {};
    }
  };

  // Helper: Verificar si una key de cache ha expirado
  const isCacheKeyExpired = (key: string, now: Date): boolean => {
    const cached = localStorage.getItem(key);
    if (!cached) return false;

    try {
      const cachedImage: CachedImage = JSON.parse(cached);
      const expiresAt = new Date(cachedImage.expiresAt);
      return now > expiresAt;
    } catch (e) {
      // Si no se puede parsear, considerar expirado
      return true;
    }
  };

  // Helper: Recolectar keys expiradas del localStorage
  const collectExpiredKeys = (now: Date): string[] => {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        if (isCacheKeyExpired(key, now)) {
          keysToRemove.push(key);
        }
      }
    }

    return keysToRemove;
  };

  // Limpiar cache expirado
  const clearExpiredCache = () => {
    try {
      const now = new Date();
      const keysToRemove = collectExpiredKeys(now);

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Limpieza de cache: ${keysToRemove.length} imágenes expiradas eliminadas`);
      }

    } catch (error) {
      console.error('Error limpiando cache expirado:', error);
    }
  };

  // Validar si una imagen existe en R2
  const validateImageExists = async (url: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error validando existencia de imagen:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refrescar cache completo
  const refreshImageCache = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Limpiar cache expirado
      clearExpiredCache();
      
      // Recargar desde cache
      initializeCache();
      
      console.log('🔄 Cache de imágenes refrescado');
    } catch (error) {
      console.error('Error refrescando cache:', error);
      setError('Error refrescando cache de imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Estado
    isLoading,
    error,
    
    // URLs
    avatarUrl,
    homeImages,
    eventImages,
    
    // Funciones
    cacheImageUrl,
    getCachedImageUrl,
    clearExpiredCache,
    validateImageExists,
    refreshImageCache,
  };
}

// Hook especializado para avatares
export function useAvatarPersistence() {
  const { user } = useAuth();
  const { cacheImageUrl, getCachedImageUrl, isLoading, error } = useImagePersistence();

  const updateAvatar = (url: string, filename: string) => {
    if (user?.id) {
      cacheImageUrl(`avatar_${user.id}`, url, filename);
    }
  };

  const getAvatarUrl = (): string | null => {
    if (!user?.id) return null;
    return getCachedImageUrl(`avatar_${user.id}`) || user.avatar || null;
  };

  return {
    avatarUrl: getAvatarUrl(),
    updateAvatar,
    isLoading,
    error,
  };
}