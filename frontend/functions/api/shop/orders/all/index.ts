// API endpoint for admin order management
// GET /api/shop/orders/all - Get all orders (admin)

import type { PagesFunction, Env } from '../../../../types';
import { jsonResponse } from '../../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // TODO: Add authentication check for admin users

    const query = `
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
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    const result = await context.env.DB.prepare(query).all();

    const orders = (result.results || []).map((order: any) => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));

    return jsonResponse({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch orders'
    }, 500);
  }
};
