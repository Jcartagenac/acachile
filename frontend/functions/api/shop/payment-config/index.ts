import type { PagesFunction, Env } from '../../../types';
import { jsonResponse } from '../../../_middleware';

/**
 * GET /api/shop/payment-config - Get payment methods configuration
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.DB.prepare(
      'SELECT payment_type, is_enabled, config_data, display_order FROM shop_payment_config WHERE is_enabled = 1 ORDER BY display_order'
    ).all();

    const paymentMethods = (result.results || []).map((method: any) => ({
      type: method.payment_type,
      is_enabled: method.is_enabled === 1,
      config: method.config_data ? JSON.parse(method.config_data) : {},
      display_order: method.display_order
    }));

    return jsonResponse({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Error fetching payment config:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch payment configuration'
    }, 500);
  }
};
