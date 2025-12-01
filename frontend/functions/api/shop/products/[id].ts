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
}

/**
 * GET /api/shop/products/:id - Get single product by ID (public, no inventory)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;

    const product = await context.env.DB.prepare(
      'SELECT id, sku, name, description, price, image_url, is_active FROM shop_products WHERE id = ? AND is_active = 1'
    ).bind(id).first<Product>();

    if (!product) {
      return jsonResponse({
        success: false,
        error: 'Product not found'
      }, 404);
    }

    return jsonResponse({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch product'
    }, 500);
  }
};

/**
 * PUT /api/shop/products/:id - Update product (admin only)
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;
    const body = await context.request.json() as {
      sku?: string;
      name?: string;
      description?: string;
      price?: number;
      inventory?: number;
      image_url?: string;
      is_active?: boolean;
    };

    // Verificar que el producto existe
    const existing = await context.env.DB.prepare(
      'SELECT id FROM shop_products WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return jsonResponse({
        success: false,
        error: 'Product not found'
      }, 404);
    }

    // Si se está cambiando el SKU, verificar que no exista ya
    if (body.sku) {
      const duplicateSku = await context.env.DB.prepare(
        'SELECT id FROM shop_products WHERE sku = ? AND id != ?'
      ).bind(body.sku, id).first();

      if (duplicateSku) {
        return jsonResponse({
          success: false,
          error: 'A product with this SKU already exists'
        }, 400);
      }
    }

    // Construir query de actualización dinámicamente
    const updates: string[] = [];
    const values: any[] = [];

    if (body.sku !== undefined) {
      updates.push('sku = ?');
      values.push(body.sku);
    }
    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.price !== undefined) {
      updates.push('price = ?');
      values.push(body.price);
    }
    if (body.inventory !== undefined) {
      updates.push('inventory = ?');
      values.push(body.inventory);
    }
    if (body.image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(body.image_url);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }

    updates.push('updated_at = datetime("now")');
    values.push(id);

    const result = await context.env.DB.prepare(
      `UPDATE shop_products SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    if (!result.success) {
      throw new Error('Failed to update product');
    }

    return jsonResponse({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to update product'
    }, 500);
  }
};

/**
 * DELETE /api/shop/products/:id - Delete product (admin only)
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;

    const result = await context.env.DB.prepare(
      'DELETE FROM shop_products WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return jsonResponse({
        success: false,
        error: 'Product not found'
      }, 404);
    }

    return jsonResponse({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to delete product'
    }, 500);
  }
};
