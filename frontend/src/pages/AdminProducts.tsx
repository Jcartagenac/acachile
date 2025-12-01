import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Hash, Image as ImageIcon, Check } from 'lucide-react';
import { 
  getProductsAdmin, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  type Product 
} from '../services/shopService';
import { imageService } from '../services/imageService';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    inventory: '',
    image_url: '',
    is_active: 1
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProductsAdmin();
      setProducts(data);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        inventory: product.inventory?.toString() || '0',
        image_url: product.image_url || '',
        is_active: product.is_active
      });
      setImagePreview(product.image_url);
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        price: '',
        inventory: '0',
        image_url: '',
        is_active: 1
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if new file selected
      if (imageFile) {
        const uploaded = await imageService.uploadImage(imageFile, { folder: 'shop-products' });
        if (uploaded.success && uploaded.data) {
          imageUrl = uploaded.data.url;
        }
      }

      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        inventory: parseInt(formData.inventory),
        image_url: imageUrl,
        is_active: formData.is_active
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      await loadProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar producto "${product.name}"?`)) return;

    try {
      await deleteProduct(product.id);
      await loadProducts();
    } catch (err: any) {
      alert('Error al eliminar producto: ' + err.message);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { is_active: product.is_active ? 0 : 1 });
      await loadProducts();
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

  if (isLoading) {
    return <div className="p-6">Cargando productos...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestión de Productos (SKUs)</h1>
          <p className="text-neutral-600">Administra el catálogo de la tienda</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Imagen</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Precio</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Inventario</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-neutral-400" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-neutral-700">{product.sku}</td>
                <td className="px-4 py-3 text-sm font-medium text-neutral-900">{product.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-700">{formatCurrency(product.price)}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold ${
                    (product.inventory || 0) > 10 ? 'text-green-600' :
                    (product.inventory || 0) > 0 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {product.inventory || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      product.is_active 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="p-12 text-center text-neutral-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>No hay productos registrados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="PROD-001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Precio <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="50000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Descripción detallada del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Inventario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Imagen del Producto
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
                  />
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-neutral-700">
                    Producto activo (visible en tienda)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
