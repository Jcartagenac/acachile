// Get product by SKU
import type { Env } from '../../../../types';

interface CloudflareContext {
  request: Request;
  env: Env;
  params: {
    sku: string;
  };
}

export async function onRequestGet(context: CloudflareContext) {
  const { env, params } = context;
  const { sku } = params;

  try {
    // Decode SKU from URL
    const decodedSku = decodeURIComponent(sku);

    // Query product by SKU, include gallery_images and detailed_description
    const result = await env.DB.prepare(`
      SELECT 
        id,
        sku,
        name,
        description,
        detailed_description,
        price,
        image_url,
        gallery_images,
        is_active,
        created_at,
        updated_at
      FROM shop_products
      WHERE sku = ? AND is_active = 1
    `).bind(decodedSku).first();

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse gallery_images if it exists
    let parsedProduct = { ...result };
    if (result.gallery_images) {
      try {
        parsedProduct.gallery_images = JSON.parse(result.gallery_images as string);
      } catch (e) {
        parsedProduct.gallery_images = [];
      }
    } else {
      parsedProduct.gallery_images = [];
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedProduct
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching product by SKU:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
