-- Script de inicialización de base de datos para Railway
-- Inventario de Zapatos - Sistema Multi-tenant (SaaS)
-- IMPORTANTE: Railway usa la base de datos 'railway' por defecto

USE railway;

-- Tabla de Tiendas (Tenants)
CREATE TABLE IF NOT EXISTS tiendas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    estado ENUM('activo', 'suspendido', 'cancelado') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin_trial TIMESTAMP NULL,
    fecha_ultimo_pago TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    estado ENUM('activo', 'inactivo', 'bloqueado') DEFAULT 'activo',
    email_verificado BOOLEAN DEFAULT FALSE,
    fecha_ultimo_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Tabla de relación Usuarios-Tiendas (muchos a muchos)
CREATE TABLE IF NOT EXISTS usuarios_tiendas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tienda_id INT NOT NULL,
    role ENUM('owner', 'admin', 'vendedor', 'solo_lectura') DEFAULT 'vendedor',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_tienda (usuario_id, tienda_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_tienda (tienda_id)
) ENGINE=InnoDB;

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    INDEX idx_tienda (tienda_id),
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB;

-- Tabla de Productos (Zapatos)
CREATE TABLE IF NOT EXISTS productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    categoria_id INT,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    precio_compra DECIMAL(10, 2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10, 2) NOT NULL,
    stock_total INT NOT NULL DEFAULT 0,
    codigo_barras VARCHAR(50),
    sku VARCHAR(50),
    imagen_url VARCHAR(500),
    estado ENUM('activo', 'agotado', 'descontinuado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_tienda (tienda_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_nombre (nombre),
    INDEX idx_codigo_barras (codigo_barras),
    INDEX idx_sku (sku)
) ENGINE=InnoDB;

-- Tabla de Tallas/Variantes de Productos
CREATE TABLE IF NOT EXISTS producto_tallas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    talla VARCHAR(10) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    color VARCHAR(50),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_producto_talla_color (producto_id, talla, color),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB;

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),
    direccion TEXT,
    documento VARCHAR(50),
    tipo_documento ENUM('DNI', 'RUC', 'CE', 'Pasaporte') DEFAULT 'DNI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    INDEX idx_tienda (tienda_id),
    INDEX idx_nombre (nombre),
    INDEX idx_documento (documento)
) ENGINE=InnoDB;

-- Tabla de Facturas/Ventas
CREATE TABLE IF NOT EXISTS facturas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    cliente_id INT,
    usuario_id INT NOT NULL,
    numero_factura VARCHAR(50) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    impuesto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'yape', 'plin') NOT NULL,
    estado ENUM('pendiente', 'pagado', 'anulado') DEFAULT 'pagado',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_tienda (tienda_id),
    INDEX idx_numero_factura (numero_factura),
    INDEX idx_fecha (fecha),
    INDEX idx_estado (estado)
) ENGINE=InnoDB;

-- Tabla de Items de Factura
CREATE TABLE IF NOT EXISTS factura_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    factura_id INT NOT NULL,
    producto_id INT NOT NULL,
    talla_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (talla_id) REFERENCES producto_tallas(id) ON DELETE SET NULL,
    INDEX idx_factura (factura_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB;

-- Tabla de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    producto_id INT NOT NULL,
    talla_id INT,
    usuario_id INT NOT NULL,
    tipo ENUM('entrada', 'salida', 'ajuste', 'devolucion') NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    referencia VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (talla_id) REFERENCES producto_tallas(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_tienda (tienda_id),
    INDEX idx_producto (producto_id),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB;

-- Tabla de Suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    plan_id ENUM('free', 'basic', 'premium', 'enterprise') NOT NULL,
    estado ENUM('activa', 'cancelada', 'vencida', 'pendiente_pago') DEFAULT 'activa',
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    fecha_proximo_pago TIMESTAMP NULL,
    monto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    periodo ENUM('mensual', 'anual') DEFAULT 'mensual',
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    INDEX idx_tienda (tienda_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_proximo_pago (fecha_proximo_pago)
) ENGINE=InnoDB;

-- Tabla de Historial de Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT NOT NULL,
    suscripcion_id INT,
    monto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'COP',
    plan_pagado ENUM('free', 'basic', 'premium', 'enterprise') NOT NULL,
    metodo_pago ENUM('tarjeta', 'transferencia', 'yape', 'plin', 'stripe', 'mercadopago', 'wompi') NOT NULL,
    estado ENUM('pendiente', 'completado', 'fallido', 'reembolsado') DEFAULT 'pendiente',
    referencia_pago VARCHAR(255),
    datos_adicionales JSON,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id) ON DELETE CASCADE,
    FOREIGN KEY (suscripcion_id) REFERENCES suscripciones(id) ON DELETE SET NULL,
    INDEX idx_tienda (tienda_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_pago (fecha_pago),
    INDEX idx_referencia (referencia_pago)
) ENGINE=InnoDB;

-- Tabla de Límites por Plan
CREATE TABLE IF NOT EXISTS limites_planes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan ENUM('free', 'basic', 'premium', 'enterprise') NOT NULL UNIQUE,
    max_productos INT NOT NULL,
    max_usuarios INT NOT NULL,
    max_facturas_mes INT NOT NULL,
    tiene_api BOOLEAN DEFAULT FALSE,
    tiene_soporte_prioritario BOOLEAN DEFAULT FALSE,
    tiene_backup_automatico BOOLEAN DEFAULT FALSE,
    tiene_multi_tienda BOOLEAN DEFAULT FALSE,
    tiene_analytics_avanzados BOOLEAN DEFAULT FALSE,
    precio_mensual DECIMAL(10, 2) NOT NULL,
    precio_anual DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar límites de cada plan
INSERT INTO limites_planes (plan, max_productos, max_usuarios, max_facturas_mes, tiene_api, tiene_soporte_prioritario, tiene_backup_automatico, tiene_multi_tienda, tiene_analytics_avanzados, precio_mensual, precio_anual) VALUES
('free', 50, 1, 100, FALSE, FALSE, FALSE, FALSE, FALSE, 0.00, 0.00),
('basic', 500, 3, 500, FALSE, TRUE, TRUE, FALSE, FALSE, 29.00, 290.00),
('premium', 999999, 10, 999999, TRUE, TRUE, TRUE, FALSE, TRUE, 79.00, 790.00),
('enterprise', 999999, 999999, 999999, TRUE, TRUE, TRUE, TRUE, TRUE, 199.00, 1990.00)
ON DUPLICATE KEY UPDATE 
    max_productos=VALUES(max_productos),
    max_usuarios=VALUES(max_usuarios),
    max_facturas_mes=VALUES(max_facturas_mes),
    tiene_api=VALUES(tiene_api),
    tiene_soporte_prioritario=VALUES(tiene_soporte_prioritario),
    tiene_backup_automatico=VALUES(tiene_backup_automatico),
    tiene_multi_tienda=VALUES(tiene_multi_tienda),
    tiene_analytics_avanzados=VALUES(tiene_analytics_avanzados),
    precio_mensual=VALUES(precio_mensual),
    precio_anual=VALUES(precio_anual);
