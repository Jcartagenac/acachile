export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  detailed_description?: string | null;
  price: number;
  inventory?: number;
  image_url: string | null;
  gallery_images?: string[] | null;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  product_id: number;
  sku: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  customer_name: string;
  customer_rut: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  shipping_region: string;
  shipping_cost: number;
  payment_method?: 'webpay' | 'transfer';
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_rut: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  shipping_region: string | null;
  shipping_cost: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  payment_method: 'webpay' | 'transfer' | null;
  payment_proof_url: string | null;
  created_at: string;
  items: Array<{
    id: number;
    sku: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
}

export interface ShippingRate {
  region_code: string;
  region_name: string;
  rate: number;
  estimated_days: string;
}

export interface PaymentConfig {
  type: 'webpay' | 'transfer';
  is_enabled: boolean;
  config: {
    url?: string;
    name?: string;
    description?: string;
    bank?: string;
    account_type?: string;
    account_number?: string;
    account_name?: string;
    rut?: string;
    emails?: string[];
  };
  display_order: number;
}

/**
 * Get all active products
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch('/api/shop/products');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch products');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: number): Promise<Product> {
  try {
    const response = await fetch(`/api/shop/products/${id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch product');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Get single product by SKU
 */
export async function getProductBySku(sku: string): Promise<Product> {
  try {
    const response = await fetch(`/api/shop/products/sku/${encodeURIComponent(sku)}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch product');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    throw error;
  }
}

/**
 * Create new order
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<{
  order_id: number;
  order_number: string;
  subtotal: number;
  total: number;
}> {
  try {
    const response = await fetch('/api/shop/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get orders by email
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/shop/orders?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch orders');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  try {
    const response = await fetch(`/api/shop/orders?orderNumber=${encodeURIComponent(orderNumber)}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch order');
    }

    return data.data[0];
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Get payment methods configuration
 */
export async function getPaymentConfig(): Promise<PaymentConfig[]> {
  try {
    const response = await fetch('/api/shop/payment-config');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch payment config');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching payment config:', error);
    throw error;
  }
}

/**
 * Get shipping rates
 */
export async function getShippingRates(): Promise<ShippingRate[]> {
  try {
    const response = await fetch('/api/shop/shipping-rates');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    throw error;
  }
}

/**
 * Upload payment proof for an order
 */
export async function uploadPaymentProof(orderNumber: string, file: File): Promise<{ url: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderNumber', orderNumber);
    formData.append('category', 'payment-proofs');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload payment proof');
    }

    return { url: data.url };
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    throw error;
  }
}

/**
 * Update order with payment proof URL
 */
export async function updateOrderPaymentProof(orderNumber: string, proofUrl: string): Promise<void> {
  try {
    const response = await fetch(`/api/shop/orders/${orderNumber}/payment-proof`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_proof_url: proofUrl }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update payment proof');
    }
  } catch (error) {
    console.error('Error updating payment proof:', error);
    throw error;
  }
}

/**
 * Get all orders (admin)
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const response = await fetch('/api/shop/orders/all');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch orders');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
}

/**
 * Update order status (admin)
 */
export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  try {
    const response = await fetch(`/api/shop/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update order status');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Create product (admin)
 */
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  try {
    const response = await fetch('/api/shop/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create product');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update product (admin)
 */
export async function updateProduct(productId: number, productData: Partial<Product>): Promise<void> {
  try {
    const response = await fetch(`/api/shop/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Delete product (admin)
 */
export async function deleteProduct(productId: number): Promise<void> {
  try {
    const response = await fetch(`/api/shop/products/${productId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

/**
 * Get all products including inventory (admin)
 */
export async function getProductsAdmin(): Promise<Product[]> {
  try {
    const response = await fetch('/api/shop/products?includeInactive=true&includeInventory=true');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch products');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Cart management in localStorage
 */
const CART_STORAGE_KEY = 'aca_shop_cart';

export function getCartFromStorage(): CartItem[] {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error reading cart from storage:', error);
    return [];
  }
}

export function saveCartToStorage(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
}

export function clearCart(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
}

export function addToCart(product: Product, quantity: number = 1): CartItem[] {
  const cart = getCartFromStorage();
  const existingItem = cart.find((item: CartItem) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  saveCartToStorage(cart);
  return cart;
}

export function removeFromCart(productId: number): CartItem[] {
  const cart = getCartFromStorage();
  const updatedCart = cart.filter((item: CartItem) => item.id !== productId);
  saveCartToStorage(updatedCart);
  return updatedCart;
}

export function updateCartItemQuantity(productId: number, quantity: number): CartItem[] {
  const cart = getCartFromStorage();
  const item = cart.find((item: CartItem) => item.id === productId);

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
    saveCartToStorage(cart);
  }

  return cart;
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((count: number, item: CartItem) => count + item.quantity, 0);
}
