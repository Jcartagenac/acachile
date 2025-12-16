import type { PagesFunction, Env } from '../../../../types';
import { jsonResponse } from '../../../../_middleware';

/**
 * DELETE /api/shop/orders/:orderId - Delete order and its items (admin only)
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const orderId = parseInt(context.params.orderId as string);

    if (isNaN(orderId)) {
      return jsonResponse({
        success: false,
        error: 'Invalid order ID'
      }, 400);
    }

    // Check if order exists
    const order = await context.env.DB.prepare(
      'SELECT id FROM shop_orders WHERE id = ?'
    ).bind(orderId).first();

    if (!order) {
      return jsonResponse({
        success: false,
        error: 'Order not found'
      }, 404);
    }

    // Delete order items first (child records)
    await context.env.DB.prepare(
      'DELETE FROM shop_order_items WHERE order_id = ?'
    ).bind(orderId).run();

    // Delete the order
    const result = await context.env.DB.prepare(
      'DELETE FROM shop_orders WHERE id = ?'
    ).bind(orderId).run();

    if (result.meta.changes === 0) {
      return jsonResponse({
        success: false,
        error: 'Failed to delete order'
      }, 500);
    }

    return jsonResponse({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting order:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to delete order: ' + (error.message || 'Unknown error')
    }, 500);
  }
};
