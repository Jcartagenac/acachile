import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Building2, Check, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import { getPaymentConfig, getOrderByNumber, type PaymentConfig, type Order } from '../services/shopService';

export default function PaymentPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentConfig[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'webpay' | 'transfer' | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [orderNumber]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [methods, orderData] = await Promise.all([
        getPaymentConfig(),
        orderNumber ? getOrderByNumber(orderNumber) : Promise.resolve(null)
      ]);
      
      setPaymentMethods(methods);
      setOrder(orderData);

      // Auto-select first method if only one available
      if (methods.length === 1 && methods[0]) {
        setSelectedMethod(methods[0].type);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const webpayMethod = paymentMethods.find((m: PaymentConfig) => m.type === 'webpay');
  const transferMethod = paymentMethods.find((m: PaymentConfig) => m.type === 'transfer');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg">
            <div className="h-5 w-5 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-neutral-700 font-medium">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Orden no encontrada</h2>
          <p className="text-neutral-600 mb-6">No se pudo encontrar la orden especificada</p>
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Volver al Carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title={`Pago - Orden ${orderNumber} - ACA Chile`}
        description="Completa tu pago para finalizar tu compra"
        url={`https://acachile.com/cart/payment/${orderNumber}`}
      />

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al carrito
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                  ¡Orden Creada!
                </h1>
                <p className="text-neutral-600">
                  Orden N° <span className="font-semibold text-primary-600">{order.order_number}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600 mb-1">Total a pagar</p>
                <p className="text-3xl font-bold text-primary-600">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Resumen de productos:</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-neutral-600">
                      {item.product_name} x {item.quantity}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t border-neutral-200 mt-4 pt-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Información de contacto:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-neutral-600">Nombre:</span>
                  <p className="font-semibold text-neutral-900">{order.customer_name}</p>
                </div>
                <div>
                  <span className="text-neutral-600">RUT:</span>
                  <p className="font-semibold text-neutral-900">{order.customer_rut}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Email:</span>
                  <p className="font-semibold text-neutral-900">{order.customer_email}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Teléfono:</span>
                  <p className="font-semibold text-neutral-900">{order.customer_phone}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-600">Dirección:</span>
                  <p className="font-semibold text-neutral-900">{order.customer_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-neutral-900">
              Selecciona tu método de pago
            </h2>

            {/* Webpay Option */}
            {webpayMethod && (
              <div
                onClick={() => setSelectedMethod('webpay')}
                className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all border-2 ${
                  selectedMethod === 'webpay' 
                    ? 'border-primary-600 ring-2 ring-primary-200' 
                    : 'border-transparent hover:border-primary-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    selectedMethod === 'webpay' 
                      ? 'bg-primary-100' 
                      : 'bg-neutral-100'
                  }`}>
                    <CreditCard className={`h-6 w-6 ${
                      selectedMethod === 'webpay' 
                        ? 'text-primary-600' 
                        : 'text-neutral-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">
                      {webpayMethod.config.name || 'Webpay Plus'}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-4">
                      {webpayMethod.config.description}
                    </p>

                    {selectedMethod === 'webpay' && (
                      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                        <p className="text-sm text-neutral-700 mb-3">
                          Serás redirigido a la página de pago de Transbank para completar tu transacción de forma segura.
                        </p>
                        <a
                          href={webpayMethod.config.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                        >
                          Ir a Webpay
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                    )}
                  </div>
                  {selectedMethod === 'webpay' && (
                    <Check className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* Transfer Option */}
            {transferMethod && (
              <div
                onClick={() => setSelectedMethod('transfer')}
                className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all border-2 ${
                  selectedMethod === 'transfer' 
                    ? 'border-primary-600 ring-2 ring-primary-200' 
                    : 'border-transparent hover:border-primary-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    selectedMethod === 'transfer' 
                      ? 'bg-primary-100' 
                      : 'bg-neutral-100'
                  }`}>
                    <Building2 className={`h-6 w-6 ${
                      selectedMethod === 'transfer' 
                        ? 'text-primary-600' 
                        : 'text-neutral-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 mb-1">
                      Transferencia Bancaria
                    </h3>
                    <p className="text-neutral-600 text-sm mb-4">
                      {transferMethod.config.description}
                    </p>

                    {selectedMethod === 'transfer' && (
                      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <h4 className="font-semibold text-neutral-900 mb-3">
                          Datos para transferencia:
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-neutral-600 uppercase tracking-wide">Nombre</label>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900">{transferMethod.config.account_name}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(transferMethod.config.account_name || '', 'name');
                                }}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors"
                                title="Copiar"
                              >
                                {copiedField === 'name' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-neutral-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-600 uppercase tracking-wide">RUT</label>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900">{transferMethod.config.rut}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(transferMethod.config.rut || '', 'rut');
                                }}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors"
                                title="Copiar"
                              >
                                {copiedField === 'rut' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-neutral-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-600 uppercase tracking-wide">Banco</label>
                            <p className="font-semibold text-neutral-900">{transferMethod.config.bank}</p>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-600 uppercase tracking-wide">Tipo de Cuenta</label>
                            <p className="font-semibold text-neutral-900">{transferMethod.config.account_type}</p>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-600 uppercase tracking-wide">N° de Cuenta</label>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900">{transferMethod.config.account_number}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(transferMethod.config.account_number || '', 'account');
                                }}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors"
                                title="Copiar"
                              >
                                {copiedField === 'account' ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-neutral-500" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-neutral-600 uppercase tracking-wide">Correos de Contacto</label>
                            {transferMethod.config.emails?.map((email: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <p className="font-semibold text-neutral-900">{email}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(email, `email-${index}`);
                                  }}
                                  className="p-1 hover:bg-neutral-200 rounded transition-colors"
                                  title="Copiar"
                                >
                                  {copiedField === `email-${index}` ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-neutral-500" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                            <p className="text-sm text-yellow-800">
                              <strong>Importante:</strong> Una vez realizada la transferencia, envía el comprobante a uno de los correos indicados incluyendo tu número de orden: <strong>{order.order_number}</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedMethod === 'transfer' && (
                    <Check className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Recibirás un correo de confirmación con los detalles de tu orden a <strong>{order.customer_email}</strong>. Una vez que confirmemos tu pago, te notificaremos por el mismo medio.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
