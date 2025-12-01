// API endpoint for updating order status
// PATCH /api/shop/orders/[orderId]/status

import type { PagesFunction, Env } from '../../../../types';
import { jsonResponse } from '../../../../_middleware';

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const orderId = parseInt(context.params.orderId as string);
    const body = await context.request.json() as { status: string };

    if (!body.status) {
      return jsonResponse({
        success: false,
        error: 'status is required'
      }, 400);
    }

    const validStatuses = ['pending', 'paid', 'completed', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return jsonResponse({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, 400);
    }

    const result = await context.env.DB.prepare(
      'UPDATE shop_orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(body.status, orderId).run();

    if (result.meta.changes === 0) {
      return jsonResponse({
        success: false,
        error: 'Order not found'
      }, 404);
    }

    return jsonResponse({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to update order status'
    }, 500);
  }
};
