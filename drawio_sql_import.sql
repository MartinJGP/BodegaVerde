-- =============================================================================
-- DRAW.IO SQL IMPORT SCRIPT: SISTEMA LA BODEGA VERDE
-- En Draw.io ve a: Menú > Organizar (Arrange) > Insertar (Insert) > Avanzado (Advanced) > SQL
-- Pega este código y presiona "Insertar" para generar automáticamente todas las tablas y relaciones.
-- =============================================================================

CREATE TABLE categorias (
    id_categoria INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE platos (
    id_plato INT PRIMARY KEY,
    id_categoria INT NOT NULL REFERENCES categorias(id_categoria),
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE mesas (
    id_mesa INT PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    capacidad INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'libre',
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id_pedido INT PRIMARY KEY,
    id_mesa INT NOT NULL REFERENCES mesas(id_mesa),
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos_detalle (
    id_detalle INT PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedidos(id_pedido),
    id_plato INT NOT NULL REFERENCES platos(id_plato),
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas VARCHAR(255)
);

CREATE TABLE comprobantes (
    id_comprobante INT PRIMARY KEY,
    id_pedido INT NOT NULL UNIQUE REFERENCES pedidos(id_pedido),
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario),
    tipo VARCHAR(20) NOT NULL,
    serie VARCHAR(4) NOT NULL,
    numero VARCHAR(8) NOT NULL,
    cliente_tipo_doc VARCHAR(10),
    cliente_num_doc VARCHAR(15),
    cliente_nombre VARCHAR(150),
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagos (
    id_pago INT PRIMARY KEY,
    id_comprobante INT NOT NULL REFERENCES comprobantes(id_comprobante),
    metodo VARCHAR(20) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    referencia VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
