export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
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
  subtotal: number;
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  payment_method: 'webpay' | 'transfer' | null;
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
