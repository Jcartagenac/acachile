import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import { getProducts, addToCart, getCartItemCount, type Product } from '../services/shopService';

export default function ShopPage() {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [addedToCart, setAddedToCart] = useState<Record<number, boolean>>({});
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    loadProducts();
    updateCartCount();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data);
      
      // Initialize quantities to 1 for each product
      const initialQuantities: Record<number, number> = {};
      data.forEach(product => {
        initialQuantities[product.id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (err) {
      setError('Error al cargar los productos. Por favor intenta nuevamente.');
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('aca_shop_cart') || '[]');
    const count = getCartItemCount(cart);
    setCartItemCount(count);
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities(prev => {
      const newQty = Math.max(1, (prev[productId] || 1) + delta);
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    addToCart(product, quantity);
    updateCartCount();
    
    // Show success feedback
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg">
            <div className="h-5 w-5 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-neutral-700 font-medium">Cargando productos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Error al cargar</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={loadProducts}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
            <ShoppingCart className="h-8 w-8 text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No hay productos disponibles</h2>
          <p className="text-neutral-600">Pronto agregaremos nuevos productos a nuestra tienda.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title="Tienda - ACA Chile"
        description="Encuentra membresías, cursos de BBQ, equipamiento y más en la tienda oficial de la Asociación Chilena de Asadores"
        url="https://acachile.com/shop"
      />

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Tienda ACA Chile
              </h1>
              <p className="text-neutral-600">
                Productos exclusivos para asadores apasionados
              </p>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => navigate('/cart')}
              className="relative inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Carrito</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {/* Product Image - Clickeable */}
                <Link 
                  to={`/shop/${product.sku}`}
                  className="block relative h-48 bg-gradient-to-br from-neutral-100 to-neutral-200"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-16 w-16 text-neutral-400" />
                    </div>
                  )}
                  
                  {/* SKU Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md">
                    <span className="text-xs font-semibold text-neutral-600">{product.sku}</span>
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <span className="text-sm text-neutral-600">Precio</span>
                      <p className="text-2xl font-bold text-primary-600">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-semibold text-neutral-700">Cantidad:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                        disabled={(quantities[product.id] || 1) <= 1}
                      >
                        <Minus className="h-4 w-4 text-neutral-700" />
                      </button>
                      <span className="min-w-[40px] text-center font-semibold text-neutral-900">
                        {quantities[product.id] || 1}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4 text-neutral-700" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link
                      to={`/shop/${product.sku}`}
                      className="w-full py-3 rounded-xl font-semibold transition-all bg-neutral-100 hover:bg-neutral-200 text-neutral-900 flex items-center justify-center gap-2"
                    >
                      Ver detalles
                    </Link>
                    
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addedToCart[product.id]}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        addedToCart[product.id]
                          ? 'bg-green-500 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {addedToCart[product.id] ? (
                        <span className="inline-flex items-center gap-2">
                          <Check className="h-5 w-5" />
                          Agregado al carrito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          Agregar al carrito
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
