import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  getCartFromStorage,
  updateCartItemQuantity,
  removeFromCart,
  getCartTotal,
  getCartItemCount,
  clearCart,
  createOrder,
  type CartItem,
  type CreateOrderRequest
} from '../services/shopService';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerRut, setCustomerRut] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    setCart(getCartFromStorage());
  }, []);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const updatedCart = updateCartItemQuantity(productId, newQuantity);
    setCart(updatedCart);
  };

  const handleRemove = (productId: number) => {
    const updatedCart = removeFromCart(productId);
    setCart(updatedCart);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatRut = (rut: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = rut.replace(/[^0-9kK]/g, '');
    
    // Format as XX.XXX.XXX-X
    if (cleaned.length <= 1) return cleaned;
    
    const body = cleaned.slice(0, -1);
    const verifier = cleaned.slice(-1);
    
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${verifier}`;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setCustomerRut(formatted);
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!customerRut.trim()) {
      setError('El RUT es obligatorio');
      return false;
    }
    if (!customerEmail.trim()) {
      setError('El email es obligatorio');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setError('El email no es válido');
      return false;
    }
    if (!customerPhone.trim()) {
      setError('El teléfono es obligatorio');
      return false;
    }
    if (!customerAddress.trim()) {
      setError('La dirección es obligatoria');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    setError(null);

    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData: CreateOrderRequest = {
        items: cart.map((item: CartItem) => ({
          product_id: item.id,
          sku: item.sku,
          quantity: item.quantity
        })),
        customer_name: customerName.trim(),
        customer_rut: customerRut.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim()
      };

      const result = await createOrder(orderData);
      
      // Clear cart
      clearCart();
      
      // Redirect to payment page
      navigate(`/cart/payment/${result.order_number}`, {
        state: {
          orderNumber: result.order_number,
          total: result.total
        }
      });

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la orden. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartTotal = getCartTotal(cart);
  const cartItemCount = getCartItemCount(cart);

  return (
    <>
      <SEOHelmet
        title="Carrito de Compras - ACA Chile"
        description="Completa tu compra en la tienda de la Asociación Chilena de Asadores"
        url="https://acachile.com/cart"
      />

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-4">
              <ShoppingCart className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700 tracking-wide uppercase">
                Carrito de Compras
              </span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Tu Carrito
            </h1>
            <p className="text-neutral-600">
              {cartItemCount > 0 ? `${cartItemCount} ${cartItemCount === 1 ? 'producto' : 'productos'} en tu carrito` : 'Tu carrito está vacío'}
            </p>
          </div>

          {cart.length === 0 ? (
            /* Empty Cart */
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-neutral-600 mb-6">
                Agrega productos a tu carrito para continuar
              </p>
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Ir a la Tienda
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item: CartItem) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-neutral-200 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-neutral-600 mb-2">
                          SKU: {item.sku}
                        </p>
                        <p className="text-lg font-bold text-primary-600">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-3">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-neutral-700">
                          Subtotal: {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">
                    Resumen de Compra
                  </h2>
                  <div className="space-y-2 mb-4 pb-4 border-b border-neutral-200">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total:</span>
                    <span className="text-primary-600">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {/* Customer Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">
                    Información de Contacto
                  </h2>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Nombre Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        RUT <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerRut}
                        onChange={handleRutChange}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="12.345.678-9"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Teléfono <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+56 9 1234 5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Dirección <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Calle Ejemplo 123, Comuna, Ciudad"
                      />
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          Proceder al Pago
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
