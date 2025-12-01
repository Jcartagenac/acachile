-- Migration 0019: Add gallery images to products
-- Date: 2024-12-18
-- Purpose: Support multiple product images (up to 10 photos)

-- Add gallery_images column to store JSON array of image URLs
ALTER TABLE shop_products ADD COLUMN gallery_images TEXT;

-- Add detailed description column for product detail page
ALTER TABLE shop_products ADD COLUMN detailed_description TEXT;

-- Create index for faster product lookups by SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON shop_products(sku);
