import type { PagesFunction, Env } from '../../../types';
import { jsonResponse } from '../../../_middleware';

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  inventory: number;
  image_url: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/shop/products - Get all active products (public)
 * GET /api/shop/products?includeInactive=true - Get all products including inactive (admin only)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { searchParams } = new URL(context.request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const includeInventory = searchParams.get('includeInventory') === 'true';

    let fields = 'id, sku, name, description, price, image_url, is_active, created_at, updated_at';
    
    // Admin API includes inventory and gallery fields
    if (includeInventory) {
      fields = 'id, sku, name, description, detailed_description, price, inventory, image_url, gallery_images, is_active, created_at, updated_at';
    }

    let query = `SELECT ${fields} FROM shop_products`;
    
    // Public API only shows active products
    if (!includeInactive) {
      query += ' WHERE is_active = 1';
    }
    
    query += ' ORDER BY created_at DESC';

    const result = await context.env.DB.prepare(query).all<Product>();

    // Remove inventory from public response
    const products = (result.results || []).map((p: Product) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      price: p.price,
      image_url: p.image_url,
      is_active: p.is_active,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return jsonResponse({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch products'
    }, 500);
  }
};

/**
 * POST /api/shop/products - Create new product (admin only)
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      sku: string;
      name: string;
      description?: string;
      detailed_description?: string;
      price: number;
      inventory: number;
      image_url?: string;
      gallery_images?: string;
      is_active?: boolean;
    };

    // Validaciones básicas
    if (!body.sku || !body.name || body.price === undefined || body.inventory === undefined) {
      return jsonResponse({
        success: false,
        error: 'SKU, name, price and inventory are required'
      }, 400);
    }

    // Verificar si el SKU ya existe
    const existing = await context.env.DB.prepare(
      'SELECT id FROM shop_products WHERE sku = ?'
    ).bind(body.sku).first();

    if (existing) {
      return jsonResponse({
        success: false,
        error: 'A product with this SKU already exists'
      }, 400);
    }

    // Insertar producto
    const result = await context.env.DB.prepare(`
      INSERT INTO shop_products (sku, name, description, detailed_description, price, inventory, image_url, gallery_images, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.sku,
      body.name,
      body.description || null,
      body.detailed_description || null,
      body.price,
      body.inventory,
      body.image_url || null,
      body.gallery_images || null,
      body.is_active !== false ? 1 : 0
    ).run();

    if (!result.success) {
      throw new Error('Failed to create product');
    }

    return jsonResponse({
      success: true,
      message: 'Product created successfully',
      data: { id: result.meta.last_row_id }
    }, 201);

  } catch (error) {
    console.error('Error creating product:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to create product'
    }, 500);
  }
};
