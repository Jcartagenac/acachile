import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useImageService } from '../../hooks/useImageService';

interface ImageGalleryUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageGalleryUploader({
  images,
  onChange,
  maxImages = 20,
}: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageService = useImageService();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      alert(`Ya has alcanzado el límite máximo de ${maxImages} imágenes.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    if (filesToUpload.length < files.length) {
      alert(
        `Solo se pueden subir ${remainingSlots} imágenes más para no exceder el límite de ${maxImages}.`
      );
    }

    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const fileKey = file.name;
        setUploadProgress((prev) => ({ ...prev, [fileKey]: true }));

        try {
          const result = await imageService.uploadGalleryImage(file);
          setUploadProgress((prev) => ({ ...prev, [fileKey]: false }));
          
          if (result.success && result.data) {
            return result.data.publicUrl;
          }
          return null;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress((prev) => ({ ...prev, [fileKey]: false }));
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUrls = uploadedUrls.filter((url: string | null): url is string => url !== null);

      if (successfulUrls.length > 0) {
        onChange([...images, ...successfulUrls]);
      }

      if (successfulUrls.length < filesToUpload.length) {
        alert(
          `Se subieron ${successfulUrls.length} de ${filesToUpload.length} imágenes. Algunas fallaron.`
        );
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error al subir las imágenes. Por favor intenta de nuevo.');
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    if (movedImage) {
      newImages.splice(toIndex, 0, movedImage);
      onChange(newImages);
    }
  };

  const isUploadingAny = Object.values(uploadProgress).some((val) => val);

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          images.length >= maxImages
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-400 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
        }`}
        onClick={() => {
          if (images.length < maxImages && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={images.length >= maxImages}
        />

        <div className="flex flex-col items-center gap-2">
          {uploading || isUploadingAny ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-600">Subiendo imágenes...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="text-gray-700 font-medium">
                {images.length >= maxImages
                  ? `Límite de ${maxImages} imágenes alcanzado`
                  : 'Arrastra imágenes aquí o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-gray-500">
                {images.length} / {maxImages} imágenes
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
            >
              <img
                src={imageUrl}
                alt={`Galería ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay con controles */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4" />
                </button>

                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveImage(index, index - 1);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    title="Mover a la izquierda"
                  >
                    ←
                  </button>
                )}

                {index < images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveImage(index, index + 1);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    title="Mover a la derecha"
                  >
                    →
                  </button>
                )}
              </div>

              {/* Número de imagen */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && !isUploadingAny && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay imágenes en la galería</p>
        </div>
      )}
    </div>
  );
}
