import type { PagesFunction, Env } from '../../../types';
import { jsonResponse } from '../../../_middleware';

interface OrderItem {
  product_id: number;
  sku: string;
  quantity: number;
}

interface CreateOrderRequest {
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

/**
 * POST /api/shop/orders - Create new order
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as CreateOrderRequest;

    // Validaciones básicas
    if (!body.items || body.items.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Order must contain at least one item'
      }, 400);
    }

    if (!body.customer_name || !body.customer_rut || !body.customer_email || 
        !body.customer_phone || !body.customer_address || !body.shipping_region) {
      return jsonResponse({
        success: false,
        error: 'All customer information is required: name, rut, email, phone, address, shipping_region'
      }, 400);
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customer_email)) {
      return jsonResponse({
        success: false,
        error: 'Invalid email format'
      }, 400);
    }

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Verificar disponibilidad y calcular totales
    const orderItems = [];
    let subtotal = 0;

    for (const item of body.items) {
      const product = await context.env.DB.prepare(
        'SELECT id, sku, name, description, price, inventory, is_active FROM shop_products WHERE id = ?'
      ).bind(item.product_id).first<{
        id: number;
        sku: string;
        name: string;
        description: string | null;
        price: number;
        inventory: number;
        is_active: number;
      }>();

      if (!product) {
        return jsonResponse({
          success: false,
          error: `Product with ID ${item.product_id} not found`
        }, 404);
      }

      if (product.is_active !== 1) {
        return jsonResponse({
          success: false,
          error: `Product "${product.name}" is not available`
        }, 400);
      }

      if (product.inventory < item.quantity) {
        return jsonResponse({
          success: false,
          error: `Insufficient inventory for product "${product.name}". Available: ${product.inventory}, Requested: ${item.quantity}`
        }, 400);
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        product_description: product.description,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    const shippingCost = body.shipping_cost || 0;
    const total = subtotal + shippingCost;

    // Iniciar transacción: crear orden y items
    const orderResult = await context.env.DB.prepare(`
      INSERT INTO shop_orders (
        order_number, customer_name, customer_rut, customer_email, 
        customer_phone, customer_address, shipping_region, shipping_cost, 
        subtotal, total, status, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderNumber,
      body.customer_name,
      body.customer_rut,
      body.customer_email,
      body.customer_phone,
      body.customer_address,
      body.shipping_region,
      shippingCost,
      subtotal,
      total,
      'pending',
      body.payment_method || null
    ).run();

    if (!orderResult.success) {
      throw new Error('Failed to create order');
    }

    const orderId = orderResult.meta.last_row_id;

    // Insertar items de la orden
    for (const item of orderItems) {
      await context.env.DB.prepare(`
        INSERT INTO shop_order_items (
          order_id, product_id, sku, product_name, product_description,
          unit_price, quantity, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        item.product_id,
        item.sku,
        item.product_name,
        item.product_description,
        item.unit_price,
        item.quantity,
        item.subtotal
      ).run();

      // Reducir inventario
      await context.env.DB.prepare(
        'UPDATE shop_products SET inventory = inventory - ? WHERE id = ?'
      ).bind(item.quantity, item.product_id).run();
    }

    return jsonResponse({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id: orderId,
        order_number: orderNumber,
        subtotal,
        shipping_cost: shippingCost,
        total,
        items: orderItems
      }
    }, 201);

  } catch (error) {
    console.error('Error creating order:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};

/**
 * GET /api/shop/orders?email=xxx - Get orders by email
 * GET /api/shop/orders?orderNumber=xxx - Get order by number
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { searchParams } = new URL(context.request.url);
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');

    if (!email && !orderNumber) {
      return jsonResponse({
        success: false,
        error: 'Email or orderNumber parameter is required'
      }, 400);
    }

    let query = `
      SELECT 
        o.*,
        GROUP_CONCAT(
          json_object(
            'id', i.id,
            'sku', i.sku,
            'product_name', i.product_name,
            'unit_price', i.unit_price,
            'quantity', i.quantity,
            'subtotal', i.subtotal
          )
        ) as items
      FROM shop_orders o
      LEFT JOIN shop_order_items i ON o.id = i.order_id
    `;

    let bindValue: string;
    if (orderNumber) {
      query += ' WHERE o.order_number = ?';
      bindValue = orderNumber;
    } else {
      query += ' WHERE o.customer_email = ?';
      bindValue = email!;
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const result = await context.env.DB.prepare(query).bind(bindValue).all();

    const orders = (result.results || []).map((order: any) => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));

    return jsonResponse({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch orders'
    }, 500);
  }
};
