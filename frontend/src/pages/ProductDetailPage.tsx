import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductBySku, addToCart, type Product } from '../services/shopService';
import { SEOHelmet } from '../components/SEOHelmet';

export default function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (sku) {
      loadProduct();
    }
  }, [sku]);

  const loadProduct = async () => {
    if (!sku) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProductBySku(sku);
      setProduct(data);
      setSelectedImage(data.image_url || '');
    } catch (err: any) {
      setError(err.message || 'Error al cargar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Use the shopService functions to ensure user-specific cart
    addToCart(product, quantity);
    
    // Redirect to cart
    navigate('/cart');
  };

  const allImages = product ? [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.gallery_images || [])
  ].filter(Boolean) : [];

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    if (allImages.length > 0 && allImages[currentImageIndex]) {
      setSelectedImage(allImages[currentImageIndex]!);
    }
  }, [currentImageIndex, allImages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Producto no encontrado</h2>
          <p className="text-neutral-600 mb-6">{error || 'El producto que buscas no está disponible.'}</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title={`${product.name} - Tienda ACA Chile`}
        description={product.description || `Compra ${product.name} en la tienda oficial de ACA Chile`}
      />

      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a la tienda
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden group">
                  {selectedImage ? (
                    <>
                      <img
                        src={selectedImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={handlePreviousImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="h-6 w-6 text-neutral-900" />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="h-6 w-6 text-neutral-900" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-neutral-300" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {allImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setSelectedImage(img);
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === img
                            ? 'border-primary-600 ring-2 ring-primary-200'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="mb-2">
                  <span className="text-sm font-semibold text-neutral-500">SKU: {product.sku}</span>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="text-neutral-600 mb-6 text-lg">
                    {product.description}
                  </p>
                )}

                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                {/* Detailed Description */}
                {product.detailed_description && (
                  <div className="mb-6 pb-6 border-b">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Descripción detallada</h3>
                    <div className="text-neutral-600 whitespace-pre-line">
                      {product.detailed_description}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-10 text-center border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg"
                >
                  <ShoppingCart className="h-6 w-6" />
                  Agregar al carrito
                </button>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Envío:</strong> Calculado en el checkout según tu región
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
