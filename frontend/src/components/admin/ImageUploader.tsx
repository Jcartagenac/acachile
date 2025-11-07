import React, { useState, useRef } from 'react';
import { Upload, X, Check, Copy, Image as ImageIcon, Loader2 } from 'lucide-react';

const getAuthToken = () => {
  if (typeof document === 'undefined') return '';
  
  // Try to get from cookie first
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('auth_token') || window.localStorage.getItem('token') || '';
  }
  
  return '';
};

interface UploadedImage {
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

export default function ImageUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Por favor selecciona archivos de imagen válidos (PNG, JPG, GIF, etc.)');
      return;
    }

    for (const file of imageFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const formData = new FormData();
      formData.append('file', file);

      console.log('[ImageUploader] Uploading file:', file.name, 'size:', file.size);

      const response = await fetch('/api/admin/content/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('[ImageUploader] Response status:', response.status);
      const data = await response.json();
      console.log('[ImageUploader] Response data:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Error al subir la imagen (status: ${response.status})`);
      }

      const newImage: UploadedImage = {
        url: data.url,
        name: file.name,
        size: file.size,
        uploadedAt: new Date()
      };

      setUploadedImages(prev => [newImage, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al subir imagen');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Imágenes al R2</h3>
        <p className="text-sm text-gray-600 mb-6">
          Sube imágenes que se almacenarán en Cloudflare R2 y estarán disponibles públicamente. 
          Los formatos soportados son: PNG, JPG, GIF, WEBP.
        </p>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />

          <div className="space-y-4">
            {uploading ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-red-600 animate-spin" />
                <p className="text-sm text-gray-600">Subiendo imagen...</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <button
                    type="button"
                    onClick={onButtonClick}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Seleccionar imágenes
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    o arrastra y suelta archivos aquí
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <X className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error al subir imagen</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Images List */}
      {uploadedImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Imágenes Subidas ({uploadedImages.length})
          </h3>
          
          <div className="space-y-4">
            {uploadedImages.map((image, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.name}
                    </p>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatBytes(image.size)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={image.url}
                      readOnly
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-700 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                        copiedUrl === image.url
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="Copiar URL"
                    >
                      {copiedUrl === image.url ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="text-sm">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="text-sm">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Subida: {image.uploadedAt.toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Consejos</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Las imágenes se almacenan permanentemente en Cloudflare R2</li>
          <li>Usa nombres de archivo descriptivos (sin espacios, usa guiones)</li>
          <li>Optimiza las imágenes antes de subirlas para mejor rendimiento</li>
          <li>Las URLs generadas son públicas y pueden usarse en cualquier lugar del sitio</li>
        </ul>
      </div>
    </div>
  );
}
