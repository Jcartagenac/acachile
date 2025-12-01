import { useState, useEffect } from 'react';
import { Package, Search, Eye, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getAllOrders, updateOrderStatus, type Order } from '../services/shopService';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <div className="p-6">Cargando órdenes...</div>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por número, email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Orden</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Comprobante</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="font-mono text-sm font-semibold text-primary-600">
                    {order.order_number}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {order.payment_method === 'webpay' ? 'Webpay' : 'Transferencia'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-neutral-900">{order.customer_name}</div>
                  <div className="text-xs text-neutral-500">{order.customer_email}</div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(order.total)}
                  </div>
                  {order.shipping_cost > 0 && (
                    <div className="text-xs text-neutral-500">
                      + envío {formatCurrency(order.shipping_cost)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {order.payment_proof_url ? (
                    <a
                      href={order.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Ver
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">Sin comprobante</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-neutral-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>No se encontraron órdenes</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    Orden {selectedOrder.order_number}
                  </h2>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusLabel(selectedOrder.status)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold text-neutral-900 mb-2">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-neutral-600">Nombre:</span>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">RUT:</span>
                    <p className="font-medium">{selectedOrder.customer_rut}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Email:</span>
                    <p className="font-medium">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Teléfono:</span>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-600">Dirección:</span>
                    <p className="font-medium">{selectedOrder.customer_address}</p>
                  </div>
                  {selectedOrder.shipping_region && (
                    <div className="col-span-2">
                      <span className="text-neutral-600">Región de envío:</span>
                      <p className="font-medium">{selectedOrder.shipping_region}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-neutral-900 mb-2">Productos</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-3 bg-neutral-50 rounded">
                      <div>
                        <p className="font-medium text-neutral-900">{item.product_name}</p>
                        <p className="text-sm text-neutral-600">SKU: {item.sku} • Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-neutral-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Envío:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.shipping_cost)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedOrder.payment_proof_url && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-neutral-900 mb-2">Comprobante de Pago</h3>
                  <a
                    href={selectedOrder.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <Download className="h-4 w-4" />
                    Descargar comprobante
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
