-- Migration: Create Shop/Cart Tables
-- Description: Sistema de carrito de compras con productos (SKUs) y órdenes

-- Tabla de productos/SKUs disponibles para la venta
CREATE TABLE IF NOT EXISTS shop_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  inventory INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_shop_products_sku ON shop_products(sku);
CREATE INDEX IF NOT EXISTS idx_shop_products_active ON shop_products(is_active);

-- Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS shop_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_rut TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  -- Totales
  subtotal REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  -- Estado de la orden
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'completed', 'cancelled')),
  payment_method TEXT CHECK(payment_method IN ('webpay', 'transfer', null)),
  payment_proof_url TEXT,
  -- Metadata
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Índices para órdenes
CREATE INDEX IF NOT EXISTS idx_shop_orders_number ON shop_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_shop_orders_email ON shop_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_created ON shop_orders(created_at);

-- Tabla de items de orden (productos en cada orden)
CREATE TABLE IF NOT EXISTS shop_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES shop_products(id)
);

-- Índices para order items
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_product ON shop_order_items(product_id);

-- Tabla de configuración de métodos de pago
CREATE TABLE IF NOT EXISTS shop_payment_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_type TEXT NOT NULL UNIQUE CHECK(payment_type IN ('webpay', 'transfer')),
  is_enabled INTEGER DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  config_data TEXT, -- JSON con configuración adicional
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insertar configuración de métodos de pago
INSERT INTO shop_payment_config (payment_type, is_enabled, config_data, display_order) VALUES
('webpay', 1, '{"url":"https://www.webpay.cl/company/61599?utm_source=transbank&utm_medium=portal3.0&utm_campaign=link_portal","name":"Webpay Plus","description":"Pago con tarjeta de crédito o débito"}', 1),
('transfer', 1, '{"bank":"SCOTIABANK","account_type":"CUENTA CORRIENTE","account_number":"980474798","account_name":"ASOCIACIÓN CHILENA DE ASADORES","rut":"65181942-3","emails":["TESORERIA@ACACHILE.COM","DIRECTORIO@ACACHILE.COM"],"description":"Transferencia bancaria directa"}', 2);

-- Datos de ejemplo de productos (opcional, comentar si no se desean)
INSERT INTO shop_products (sku, name, description, price, inventory, is_active) VALUES
('MEMBRESIA-2025', 'Membresía ACA 2025', 'Membresía anual de la Asociación Chilena de Asadores para el año 2025. Incluye acceso a eventos exclusivos, descuentos especiales y contenido premium.', 50000, 100, 1),
('CURSO-BBQ-BASICO', 'Curso BBQ Básico', 'Curso introductorio de técnicas básicas de BBQ. Aprende los fundamentos del asado perfecto con nuestros expertos.', 35000, 50, 1),
('CURSO-BBQ-AVANZADO', 'Curso BBQ Avanzado', 'Curso avanzado de técnicas profesionales de BBQ. Para quienes ya dominan lo básico y quieren llevar sus habilidades al siguiente nivel.', 60000, 30, 1),
('DELANTAL-ACA', 'Delantal Oficial ACA', 'Delantal oficial de la Asociación Chilena de Asadores. Material resistente al calor, con bolsillos y logo bordado.', 25000, 75, 1),
('KIT-ASADOR', 'Kit del Asador', 'Kit completo con herramientas esenciales para asado: pinzas, tenedor, espátula y cuchillo. Todo en estuche de transporte.', 45000, 40, 1);
