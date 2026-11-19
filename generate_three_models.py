import zlib
import urllib.request
import os

def plantuml_encode(text):
    zlibbed = zlib.compress(text.encode('utf-8'))[2:-4]
    b64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    res = []
    for i in range(0, len(zlibbed), 3):
        b1 = zlibbed[i]
        b2 = zlibbed[i+1] if i+1 < len(zlibbed) else 0
        b3 = zlibbed[i+2] if i+2 < len(zlibbed) else 0
        res.append(b64[b1 >> 2])
        res.append(b64[((b1 & 0x3) << 4) | (b2 >> 4)])
        res.append(b64[((b2 & 0xF) << 2) | (b3 >> 6)])
        res.append(b64[b3 & 0x3F])
    return ''.join(res)

def render_plantuml(puml_code, output_png_path):
    encoded = plantuml_encode(puml_code)
    url = f"http://www.plantuml.com/plantuml/png/{encoded}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    with open(output_png_path, 'wb') as f:
        f.write(data)
    print(f"Generated: {output_png_path} ({len(data)} bytes)")

# ==============================================================================
# 1. MODELO CONCEPTUAL (Nivel de Negocio - Sin tipos tecnicos, Sin FKs)
# ==============================================================================
conceptual_puml = """@startuml
skinparam DefaultFontName Arial
skinparam roundcorner 8
skinparam linetype ortho
skinparam shadowing false

skinparam class {
    BackgroundColor #FFFFFF
    BorderColor #2D5A27
    HeaderBackgroundColor #E8F0E6
    FontSize 12
    AttributeFontSize 11
}

skinparam packageBackgroundColor #FAFCFA
skinparam packageBorderColor #8E9B90

title <size:17><b>Modelo Conceptual de Datos (CDM)</b></size>\\n<size:12>Sistema Gastronómico La Bodega Verde (Comandas y Facturación)</size>

package "Entidades del Dominio de Negocio" {

    class "USUARIO" as Usuario <<Entidad>> {
        # id_usuario (Identificador)
        --
        nombre
        email
        rol
        estado_activo
    }

    class "MESA" as Mesa <<Entidad>> {
        # numero_mesa (Identificador)
        --
        capacidad_comensales
        estado_atencion
    }

    class "CATEGORIA" as Categoria <<Entidad>> {
        # id_categoria (Identificador)
        --
        nombre_categoria
        descripcion
    }

    class "PLATO" as Plato <<Entidad>> {
        # id_plato (Identificador)
        --
        nombre_plato
        precio_carta
        descripcion
        disponibilidad
    }

    class "PEDIDO" as Pedido <<Entidad>> {
        # numero_pedido (Identificador)
        --
        estado_comanda
        importe_total
        fecha_creacion
        fecha_cierre
    }

    class "DETALLE_PEDIDO" as DetallePedido <<Entidad Débil>> {
        # linea_pedido (Identificador)
        --
        cantidad
        precio_unitario
        nota_preparacion
    }

    class "COMPROBANTE" as Comprobante <<Entidad>> {
        # id_comprobante (Identificador)
        --
        tipo_documento
        serie_correlativo
        cliente_nombre
        cliente_documento
        subtotal_gravado
        impuesto_igv
        importe_total
        fecha_emision
    }

    class "PAGO" as Pago <<Entidad>> {
        # id_transaccion (Identificador)
        --
        metodo_pago
        monto_pagado
        monto_recibido
        vuelto_entregado
        codigo_referencia
        fecha_pago
    }
}

' Relaciones Semanticas de Negocio (Verbos, Cardinalidades min..max)
Categoria "1" --- "1..*" Plato : clasifica >
Mesa "1" --- "0..*" Pedido : aloja >
Usuario "1" --- "0..*" Pedido : registra >

Pedido "1" --- "1..*" DetallePedido : contiene >
Plato "1" --- "0..*" DetallePedido : es_solicitado_en >

Pedido "1" --- "0..1" Comprobante : liquida_en >
Usuario "1" --- "0..*" Comprobante : emite >

Comprobante "1" --- "1..*" Pago : se_abona_con >

note right of DetallePedido
  <b>Regla Conceptual:</b>
  Entidad débil por identificación:
  representa el consumo específico de
  un plato dentro de una comanda.
end note

note right of Comprobante
  <b>Regla Conceptual:</b>
  Un pedido genera como máximo 1 comprobante
  fiscal (Boleta o Factura).
end note

@enduml"""

# ==============================================================================
# 2. MODELO LÓGICO (Estructura Relacional Normalizada en 3FN - Tipos Logicos)
# ==============================================================================
logico_puml = """@startuml
skinparam DefaultFontName Arial
skinparam roundcorner 5
skinparam linetype ortho
skinparam shadowing false

skinparam class {
    BackgroundColor #FFFFFF
    BorderColor #2D5A27
    HeaderBackgroundColor #E8F0E6
    FontSize 11
    AttributeFontSize 10
}

skinparam packageBackgroundColor #FAFCFA
skinparam packageBorderColor #8E9B90
skinparam packageFontStyle bold

title <size:17><b>Modelo Lógico de Datos (LDM) - 3FN</b></size>\\n<size:12>Esquema Relacional Independiente de SGBD con Notación Pata de Gallo (Crow's Foot)</size>

package "Módulo: Catálogo y Salón" {
    entity "CATEGORIAS" as Categorias {
        + id : Integer [PK]
        --
        * nombre : String(100)
        descripcion : String(255)
    }

    entity "PLATOS" as Platos {
        + id : Integer [PK]
        --
        * categoria_id : Integer [FK]
        * nombre : String(150)
        * precio : Decimal(10,2)
        descripcion : String(255)
        * activo : Boolean
    }

    entity "MESAS" as Mesas {
        + id : Integer [PK]
        --
        * numero : Integer [UNIQUE]
        * capacidad : Integer
        * estado : Enum ('DISPONIBLE','OCUPADA','EN_PAGO')
    }
}

package "Módulo: Usuarios y Accesos" {
    entity "USUARIOS" as Usuarios {
        + id : Integer [PK]
        --
        * nombre : String(150)
        * email : String(255) [UNIQUE]
        * password_hash : String(255)
        * rol : Enum ('ADMIN','MESERO','COCINERO','CAJERO')
        * activo : Boolean
    }
}

package "Módulo: Comandas en Tiempo Real" {
    entity "PEDIDOS" as Pedidos {
        + id : Integer [PK]
        --
        * mesa_id : Integer [FK]
        * usuario_id : Integer [FK]
        * estado : Enum ('PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO','PAGADO','CANCELADO')
        * total : Decimal(10,2)
        * fecha_creacion : DateTime
        fecha_cierre : DateTime
    }

    entity "PEDIDOS_DETALLE" as PedidosDetalle {
        + id : Integer [PK]
        --
        * pedido_id : Integer [FK]
        * plato_id : Integer [FK]
        * cantidad : Integer
        * precio_unitario : Decimal(10,2)
        notas_personalizadas : String(255)
    }
}

package "Módulo: Facturación y Checkout" {
    entity "COMPROBANTES" as Comprobantes {
        + id : Integer [PK]
        --
        * pedido_id : Integer [FK, UNIQUE]
        cajero_id : Integer [FK]
        * tipo : Enum ('BOLETA','FACTURA')
        * serie : String(10)
        * numero_correlativo : Integer
        cliente_nombre : String(200)
        cliente_documento : String(20)
        * subtotal : Decimal(10,2)
        * igv : Decimal(10,2)
        * total : Decimal(10,2)
        * fecha_emision : DateTime
        * estado : Enum ('EMITIDO','ANULADO')
    }

    entity "PAGOS" as Pagos {
        + id : Integer [PK]
        --
        * comprobante_id : Integer [FK]
        * metodo_pago : Enum ('EFECTIVO','TARJETA','YAPE','PLIN')
        * monto : Decimal(10,2)
        monto_recibido : Decimal(10,2)
        vuelto : Decimal(10,2)
        referencia : String(100)
        * fecha_pago : DateTime
    }
}

' Relaciones Relacionales (Notacion Pata de Gallo)
Categorias ||--|{ Platos : "1 categoria clasifica 1..N platos"

Mesas ||--o{ Pedidos : "1 mesa registra 0..N pedidos"
Usuarios ||--o{ Pedidos : "1 mesero atiende 0..N pedidos"

Pedidos ||--|{ PedidosDetalle : "1 pedido desglosa 1..N detalles"
Platos ||--o{ PedidosDetalle : "1 plato figura en 0..N detalles"

Pedidos ||--o| Comprobantes : "1 pedido genera 0..1 comprobante"
Usuarios ||--o{ Comprobantes : "1 cajero emite 0..N comprobantes"

Comprobantes ||--|{ Pagos : "1 comprobante liquida con 1..N pagos"

note bottom of PedidosDetalle
  <b>Normalización 3FN:</b>
  * 1FN: Atributos atómicos indivisibles.
  * 2FN: Dependencia funcional completa de la PK.
  * 3FN: precio_unitario se conserva como snapshot
    para evitar dependencia transitiva si cambia el precio del plato.
end note

@enduml"""

# ==============================================================================
# 3. MODELO FÍSICO (Especifico para PostgreSQL 16 en Supabase - DDL Real)
# ==============================================================================
fisico_puml = """@startuml
skinparam DefaultFontName Arial
skinparam roundcorner 5
skinparam linetype ortho
skinparam shadowing false

skinparam class {
    BackgroundColor #FFFFFF
    BorderColor #2D5A27
    HeaderBackgroundColor #E8F0E6
    FontSize 10
    AttributeFontSize 9
}

skinparam packageBackgroundColor #FAFCFA
skinparam packageBorderColor #8E9B90
skinparam packageFontStyle bold

title <size:17><b>Modelo Físico de Base de Datos (PDM)</b></size>\\n<size:12>SGBD: PostgreSQL 16 (Supabase Cloud AWS) - Tipos Nativos, Constraints e Índices</size>

package "public (PostgreSQL Schema)" {

    entity "usuarios" as tbl_usuarios {
        + id : SERIAL <<PK>>
        --
        * nombre : VARCHAR(255)
        * email : VARCHAR(255) <<UQ_usuarios_email>>
        * password_hash : VARCHAR(255)
        * rol : rol_usuario_enum
        * activo : BOOLEAN DEFAULT true
    }

    entity "mesas" as tbl_mesas {
        + id : SERIAL <<PK>>
        --
        * numero : INTEGER <<UQ_mesas_numero>>
        * capacidad : SMALLINT CHECK (capacidad > 0)
        * estado : estado_mesa_enum DEFAULT 'DISPONIBLE'
    }

    entity "categorias" as tbl_categorias {
        + id : SERIAL <<PK>>
        --
        * nombre : VARCHAR(100)
        descripcion : TEXT
    }

    entity "platos" as tbl_platos {
        + id : SERIAL <<PK>>
        --
        * categoria_id : INTEGER <<FK_platos_categoria>>
        * nombre : VARCHAR(150)
        * precio : NUMERIC(10,2) CHECK (precio >= 0)
        descripcion : TEXT
        * activo : BOOLEAN DEFAULT true
        --
        <<INDEX>> idx_platos_categoria_id
    }

    entity "pedidos" as tbl_pedidos {
        + id : SERIAL <<PK>>
        --
        * mesa_id : INTEGER <<FK_pedidos_mesa>>
        * usuario_id : INTEGER <<FK_pedidos_usuario>>
        * estado : estado_pedido_enum DEFAULT 'PENDIENTE'
        * total : NUMERIC(10,2) DEFAULT 0.00
        * fecha_creacion : TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        fecha_cierre : TIMESTAMPTZ
        --
        <<INDEX>> idx_pedidos_mesa_id
        <<INDEX>> idx_pedidos_estado
        <<INDEX>> idx_pedidos_fecha
    }

    entity "pedidos_detalle" as tbl_pedidos_detalle {
        + id : SERIAL <<PK>>
        --
        * pedido_id : INTEGER <<FK_detalles_pedido, ON DELETE CASCADE>>
        * plato_id : INTEGER <<FK_detalles_plato>>
        * cantidad : INTEGER CHECK (cantidad > 0)
        * precio_unitario : NUMERIC(10,2)
        notas_personalizadas : VARCHAR(255)
        --
        <<INDEX>> idx_pedidos_detalle_pedido_id
    }

    entity "comprobantes" as tbl_comprobantes {
        + id : SERIAL <<PK>>
        --
        * pedido_id : INTEGER <<FK_comprobante_pedido, UQ_comprobante_pedido>>
        cajero_id : INTEGER <<FK_comprobante_cajero, ON DELETE SET NULL>>
        * tipo : tipo_comprobante_enum DEFAULT 'BOLETA'
        * serie : VARCHAR(10) DEFAULT 'B001'
        * numero_correlativo : INTEGER
        cliente_nombre : VARCHAR(200)
        cliente_documento : VARCHAR(20)
        * subtotal : NUMERIC(10,2)
        * igv : NUMERIC(10,2)
        * total : NUMERIC(10,2)
        * fecha_emision : TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        * estado : estado_comprobante_enum DEFAULT 'EMITIDO'
        --
        <<UQ>> uq_comprobante_serie_correlativo (serie, numero_correlativo)
        <<INDEX>> idx_comprobantes_fecha_emision
    }

    entity "pagos" as tbl_pagos {
        + id : SERIAL <<PK>>
        --
        * comprobante_id : INTEGER <<FK_pagos_comprobante, ON DELETE CASCADE>>
        * metodo_pago : metodo_pago_enum
        * monto : NUMERIC(10,2) CHECK (monto > 0)
        monto_recibido : NUMERIC(10,2)
        vuelto : NUMERIC(10,2)
        referencia : VARCHAR(100)
        * fecha_pago : TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        --
        <<INDEX>> idx_pagos_comprobante_id
    }
}

' Claves Foraneas Fisicas con Accion Referencial
tbl_categorias ||--|{ tbl_platos : "FK: categoria_id -> categorias(id)"
tbl_mesas ||--o{ tbl_pedidos : "FK: mesa_id -> mesas(id) [ON DELETE RESTRICT]"
tbl_usuarios ||--o{ tbl_pedidos : "FK: usuario_id -> usuarios(id) [ON DELETE RESTRICT]"

tbl_pedidos ||--|{ tbl_pedidos_detalle : "FK: pedido_id -> pedidos(id) [ON DELETE CASCADE]"
tbl_platos ||--o{ tbl_pedidos_detalle : "FK: plato_id -> platos(id) [ON DELETE RESTRICT]"

tbl_pedidos ||--o| tbl_comprobantes : "FK: pedido_id -> pedidos(id) [UNIQUE]"
tbl_usuarios ||--o{ tbl_comprobantes : "FK: cajero_id -> usuarios(id) [ON DELETE SET NULL]"

tbl_comprobantes ||--|{ tbl_pagos : "FK: comprobante_id -> comprobantes(id) [ON DELETE CASCADE]"

note bottom of tbl_comprobantes
  <b>Constraints e Integridad PostgreSQL:</b>
  * Restricción UNIQUE en pedido_id garantiza 1:1.
  * Índice B-Tree en fecha_emision acelera Arqueo Diario.
  * Transacciones ACID gestionadas por motor Postgres.
end note

@enduml"""

# Guardar archivos PUML
base_dir = r"C:\Users\marti\Documents\Ciclo 9\Servicios Cloud"

puml_files = {
    "modelo_conceptual.puml": (conceptual_puml, os.path.join(base_dir, "modelo_conceptual.png")),
    "modelo_logico.puml": (logico_puml, os.path.join(base_dir, "modelo_logico.png")),
    "modelo_fisico.puml": (fisico_puml, os.path.join(base_dir, "modelo_fisico.png")),
}

for filename, (code, png_path) in puml_files.items():
    puml_path = os.path.join(base_dir, filename)
    with open(puml_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Saved: {puml_path}")
    render_plantuml(code, png_path)

print("All 3 models generated successfully!")
