-- Migration 0018: Add shipping fields to shop_orders
-- Date: 2024-12-18
-- Purpose: Support shipping cost calculation by region

-- Add shipping fields to shop_orders table
ALTER TABLE shop_orders ADD COLUMN shipping_region TEXT;
ALTER TABLE shop_orders ADD COLUMN shipping_cost REAL DEFAULT 0;

-- Create shipping rates table for Blue Express (Tamaño S, origen IV Región)
CREATE TABLE IF NOT EXISTS shop_shipping_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code TEXT UNIQUE NOT NULL,
  region_name TEXT NOT NULL,
  rate REAL NOT NULL,
  estimated_days TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert Blue Express rates for size S from IV Región
-- Based on Blue Express Tarifario PyME 2024-2025
INSERT INTO shop_shipping_rates (region_code, region_name, rate, estimated_days) VALUES
('RM', 'Región Metropolitana', 4500, '2-3 días'),
('I', 'Región de Tarapacá', 8900, '4-6 días'),
('II', 'Región de Antofagasta', 8200, '4-6 días'),
('III', 'Región de Atacama', 6500, '3-5 días'),
('IV', 'Región de Coquimbo', 3500, '1-2 días'),
('V', 'Región de Valparaíso', 4200, '2-3 días'),
('VI', 'Región del Libertador Bernardo O''Higgins', 5200, '3-4 días'),
('VII', 'Región del Maule', 5800, '3-4 días'),
('VIII', 'Región del Biobío', 6200, '3-5 días'),
('IX', 'Región de La Araucanía', 6900, '4-5 días'),
('X', 'Región de Los Lagos', 7500, '4-6 días'),
('XI', 'Región de Aysén', 12500, '6-8 días'),
('XII', 'Región de Magallanes', 13500, '6-8 días'),
('XIV', 'Región de Los Ríos', 7200, '4-5 días'),
('XV', 'Región de Arica y Parinacota', 9500, '5-7 días'),
('XVI', 'Región de Ñuble', 6000, '3-4 días');

-- Create index for faster region lookups
CREATE INDEX IF NOT EXISTS idx_shipping_rates_region ON shop_shipping_rates(region_code);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_region ON shop_orders(shipping_region);
CREATE INDEX IF NOT EXISTS idx_orders_payment_proof ON shop_orders(payment_proof_url);

-- Update existing orders to have 0 shipping cost if null
UPDATE shop_orders SET shipping_cost = 0 WHERE shipping_cost IS NULL;
