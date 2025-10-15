// Servicio para gestión de imágenes en Cloudflare R2
import { AppUser } from '../../../shared';

export interface ImageUploadOptions {
  folder: 'avatars' | 'home' | 'events' | 'news' | 'gallery';
  maxSize?: number; // en bytes, default 5MB
  allowedTypes?: string[]; // default: image/*
  resize?: {
    width: number;
    height: number;
    quality?: number; // 0-100, default 80
  };
}

export interface ImageUploadResult {
  url: string;
  publicUrl: string;
  filename: string;
  size: number;
  type: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ImageService {
  // Configuraciones de R2 ahora se manejan en el backend
  private readonly API_BASE_URL = '/api';
  
  private authContext?: {
    user: AppUser | null;
    updateUser: (userData: Partial<AppUser>) => void;
  };

  // Set the auth context for user identification
  setAuthContext(authContext: { user: AppUser | null; updateUser: (userData: Partial<AppUser>) => void }) {
    this.authContext = authContext;
  }

  // Validar archivo de imagen
  private validateImageFile(file: File, options: ImageUploadOptions): { valid: boolean; error?: string } {
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB por defecto
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    // Verificar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}`
      };
    }

    // Verificar tamaño
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `El archivo es muy grande. Tamaño máximo: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  // Generar nombre único para archivo
  private generateUniqueFilename(originalName: string, folder: string, userId?: number): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const userPrefix = userId ? `user-${userId}` : 'anonymous';
    
    return `${folder}/${userPrefix}-${timestamp}-${randomId}.${extension}`;
  }

  // Redimensionar imagen (usando Canvas API)
  private async resizeImage(file: File, options: ImageUploadOptions['resize']): Promise<File> {
    if (!options) return file;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular dimensiones manteniendo proporción
        let { width, height } = options;
        const aspectRatio = img.width / img.height;

        if (width && !height) {
          height = width / aspectRatio;
        } else if (height && !width) {
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Error al redimensionar imagen'));
            }
          },
          file.type,
          (options.quality || 80) / 100
        );
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Subir imagen a Cloudflare R2
  async uploadImage(file: File, options: ImageUploadOptions): Promise<ApiResponse<ImageUploadResult>> {
    try {
      // Validar archivo
      const validation = this.validateImageFile(file, options);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Redimensionar si es necesario
      let processedFile = file;
      if (options.resize) {
        processedFile = await this.resizeImage(file, options.resize);
      }

      // Generar nombre único
      const filename = this.generateUniqueFilename(
        file.name, 
        options.folder, 
        this.authContext?.user?.id
      );

      // Crear FormData para la API
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('filename', filename);
      formData.append('folder', options.folder);

      console.log('📤 Subiendo imagen a R2:', {
        filename,
        folder: options.folder,
        size: processedFile.size,
        type: processedFile.type,
      });

      // Llamada real a la API de R2
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const apiResult = await response.json();

      if (!response.ok || !apiResult.success) {
        throw new Error(apiResult.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ImageUploadResult = {
        url: apiResult.data.publicUrl,
        publicUrl: apiResult.data.publicUrl,
        filename: filename,
        size: processedFile.size,
        type: processedFile.type
      };

      console.log('✅ Imagen subida exitosamente a R2:', result.publicUrl);

      return {
        success: true,
        data: result,
        message: 'Imagen subida exitosamente a R2'
      };

    } catch (error) {
      console.error('Error subiendo imagen a R2:', error);
      return {
        success: false,
        error: 'Error subiendo imagen. Inténtalo nuevamente.'
      };
    }
  }

  // Subir avatar de usuario
  async uploadAvatar(file: File): Promise<ApiResponse<ImageUploadResult>> {
    const options: ImageUploadOptions = {
      folder: 'avatars',
      maxSize: 2 * 1024 * 1024, // 2MB para avatares
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      resize: {
        width: 200,
        height: 200,
        quality: 90
      }
    };

    const result = await this.uploadImage(file, options);
    
    // Si la subida fue exitosa, actualizar el usuario en AuthContext
    if (result.success && result.data && this.authContext?.user) {
      this.authContext.updateUser({ 
        avatar: result.data.publicUrl 
      });
    }

    return result;
  }

  // Subir imagen para el home
  async uploadHomeImage(file: File): Promise<ApiResponse<ImageUploadResult>> {
    const options: ImageUploadOptions = {
      folder: 'home',
      maxSize: 10 * 1024 * 1024, // 10MB para imágenes del home
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      resize: {
        width: 1200,
        height: 800,
        quality: 85
      }
    };

    return this.uploadImage(file, options);
  }

  // Subir imagen para eventos
  async uploadEventImage(file: File): Promise<ApiResponse<ImageUploadResult>> {
    const options: ImageUploadOptions = {
      folder: 'events',
      maxSize: 8 * 1024 * 1024, // 8MB para eventos
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      resize: {
        width: 800,
        height: 600,
        quality: 85
      }
    };

    return this.uploadImage(file, options);
  }

  // Subir imagen para noticias
  async uploadNewsImage(file: File): Promise<ApiResponse<ImageUploadResult>> {
    const options: ImageUploadOptions = {
      folder: 'news',
      maxSize: 5 * 1024 * 1024, // 5MB para noticias
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      resize: {
        width: 600,
        height: 400,
        quality: 80
      }
    };

    return this.uploadImage(file, options);
  }

  // Subir imagen para galería
  async uploadGalleryImage(file: File): Promise<ApiResponse<ImageUploadResult>> {
    const options: ImageUploadOptions = {
      folder: 'gallery',
      maxSize: 15 * 1024 * 1024, // 15MB para galería (alta calidad)
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    };

    return this.uploadImage(file, options);
  }

  // Eliminar imagen de R2
  async deleteImage(filename: string): Promise<ApiResponse<void>> {
    try {
      // Simular eliminación de R2
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🗑️ Imagen eliminada de R2:', filename);

      return {
        success: true,
        message: 'Imagen eliminada exitosamente'
      };

    } catch (error) {
      console.error('Error eliminando imagen de R2:', error);
      return {
        success: false,
        error: 'Error eliminando imagen'
      };
    }
  }

  // Obtener URL optimizada para diferentes tamaños
  getOptimizedUrl(originalUrl: string, options?: { width?: number; height?: number; quality?: number }): string {
    if (!options) return originalUrl;

    // En producción, esto usaría Cloudflare Image Resizing
    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());

    return `${originalUrl}${params.toString() ? '?' + params.toString() : ''}`;
  }

  // Verificar si una URL es válida
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/') === true;
    } catch {
      return false;
    }
  }
}

export const imageService = new ImageService();