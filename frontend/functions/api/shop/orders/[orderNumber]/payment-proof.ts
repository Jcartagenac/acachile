// API endpoint for updating payment proof
// PATCH /api/shop/orders/[orderNumber]/payment-proof

import type { PagesFunction, Env } from '../../../../types';
import { jsonResponse } from '../../../../_middleware';

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const orderNumber = context.params.orderNumber as string;
    const body = await context.request.json() as { payment_proof_url: string };

    if (!body.payment_proof_url) {
      return jsonResponse({
        success: false,
        error: 'payment_proof_url is required'
      }, 400);
    }

    const result = await context.env.DB.prepare(
      'UPDATE shop_orders SET payment_proof_url = ?, updated_at = datetime(\'now\') WHERE order_number = ?'
    ).bind(body.payment_proof_url, orderNumber).run();

    if (result.meta.changes === 0) {
      return jsonResponse({
        success: false,
        error: 'Order not found'
      }, 404);
    }

    return jsonResponse({
      success: true,
      message: 'Payment proof uploaded successfully'
    });

  } catch (error) {
    console.error('Error updating payment proof:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to update payment proof'
    }, 500);
  }
};
