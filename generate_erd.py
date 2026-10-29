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

plantuml_code = """@startuml
skinparam DefaultFontName Arial
skinparam roundcorner 5
skinparam linetype ortho
skinparam shadowing false
skinparam packageBackgroundColor #FAFCFA
skinparam packageBorderColor #2D5A27
skinparam packageFontStyle bold

' Paleta de colores Bodega Verde
skinparam class {
    BackgroundColor #FFFFFF
    BorderColor #2D5A27
    HeaderBackgroundColor #E8F0E6
    FontSize 11
    AttributeFontSize 10
}

title <size:16><b>Diagrama Entidad-Relación (ERD) - Base de Datos PostgreSQL (Supabase)</b></size>\\n<size:12>Módulos de Gestión de Comandas y Checkout / Facturación - La Bodega Verde</size>

package "Control de Usuarios y Roles" as PkgUsuarios {
    entity "usuarios" as Usuario {
        * id : INT <<PK>> [Auto]
        --
        * nombre : VARCHAR(255)
        * email : VARCHAR(255) <<UNIQUE>>
        * passwordHash : VARCHAR(255)
        * rol : ENUM ('ADMIN','MESERO','COCINERO','CAJERO')
        * activo : BOOLEAN [default: true]
    }
}

package "Salón y Mesas" as PkgMesas {
    entity "mesas" as Mesa {
        * id : INT <<PK>> [Auto]
        --
        * numero : INT <<UNIQUE>>
        * capacidad : INT
        * estado : ENUM ('DISPONIBLE','OCUPADA','EN_PAGO')
    }
}

package "Catálogo de Menú" as PkgMenu {
    entity "categorias" as Categoria {
        * id : INT <<PK>> [Auto]
        --
        * nombre : VARCHAR(100)
        descripcion : TEXT
    }

    entity "platos" as Plato {
        * id : INT <<PK>> [Auto]
        --
        * categoriaId : INT <<FK>>
        * nombre : VARCHAR(150)
        * precio : DECIMAL(10,2)
        descripcion : TEXT
        * activo : BOOLEAN [default: true]
    }
}

package "Proceso 1: Gestión de Comandas y Pedidos" as PkgComandas {
    entity "pedidos" as Pedido {
        * id : INT <<PK>> [Auto]
        --
        * mesaId : INT <<FK>>
        * usuarioId : INT <<FK>> (Mesero)
        * estado : ENUM ('PENDIENTE','EN_PREPARACION','LISTO','ENTREGADO','PAGADO','CANCELADO')
        * total : DECIMAL(10,2) [default: 0.00]
        * fechaCreacion : TIMESTAMP [default: now()]
        fechaCierre : TIMESTAMP
    }

    entity "pedidos_detalle" as PedidoDetalle {
        * id : INT <<PK>> [Auto]
        --
        * pedidoId : INT <<FK>>
        * platoId : INT <<FK>>
        * cantidad : INT
        * precioUnitario : DECIMAL(10,2)
        notasPersonalizadas : VARCHAR(255)
    }
}

package "Proceso 2: Cierre de Cuenta y Checkout" as PkgCheckout {
    entity "comprobantes" as Comprobante {
        * id : INT <<PK>> [Auto]
        --
        * pedidoId : INT <<FK, UNIQUE>>
        cajeroId : INT <<FK>> (Cajero)
        * tipo : ENUM ('BOLETA','FACTURA')
        * serie : VARCHAR(10) [default: 'B001']
        * numeroCorrelativo : INT
        clienteNombre : VARCHAR(200)
        clienteDocumento : VARCHAR(20)
        * subtotal : DECIMAL(10,2)
        * igv : DECIMAL(10,2)
        * total : DECIMAL(10,2)
        * fechaEmision : TIMESTAMP [default: now()]
        * estado : ENUM ('EMITIDO','ANULADO')
    }

    entity "pagos" as Pago {
        * id : INT <<PK>> [Auto]
        --
        * comprobanteId : INT <<FK>>
        * metodoPago : ENUM ('EFECTIVO','TARJETA','YAPE','PLIN')
        * monto : DECIMAL(10,2)
        montoRecibido : DECIMAL(10,2)
        vuelto : DECIMAL(10,2)
        referencia : VARCHAR(100)
        * fechaPago : TIMESTAMP [default: now()]
    }
}

' Relaciones con Cardinalidad
Categoria ||--|{ Plato : "1 categoria tiene N platos"

Mesa ||--o{ Pedido : "1 mesa registra N pedidos"
Usuario ||--o{ Pedido : "1 mesero registra N pedidos"

Pedido ||--|{ PedidoDetalle : "1 pedido contiene 1..N detalles"
Plato ||--o{ PedidoDetalle : "1 plato figura en N detalles"

Pedido ||--o| Comprobante : "1 pedido genera 0..1 comprobante"
Usuario ||--o{ Comprobante : "1 cajero emite N comprobantes"

Comprobante ||--|{ Pago : "1 comprobante tiene 1..N pagos"

note bottom of Comprobante
  <b>Lógica de Facturación Fiscal:</b>
  * 1 a 1 con Pedido (garantiza que cada consumo se facture una sola vez)
  * Cálculo tributario: Total = Subtotal + IGV (18%)
  * Boleta (DNI opcional) / Factura (RUC obligatorio)
end note

note bottom of Pago
  <b>Soporte Multi-Método:</b>
  * Soporta pago mixto (ej: Efectivo + Yape)
  * Registra vuelto para pagos en efectivo
  * Almacena código de voucher o transacción digital
end note

@enduml
"""

url = 'http://www.plantuml.com/plantuml/png/' + plantuml_encode(plantuml_code)
print(f"Connecting to PlantUML server...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = resp.read()

paths = [
    'C:/Users/marti/.gemini/antigravity/brain/9c322b4d-6950-4508-be61-1f825052231e/diagrama_base_de_datos.png',
    'C:/Users/marti/Documents/Ciclo 9/Servicios Cloud/diagrama_base_de_datos.png'
]

for p in paths:
    with open(p, 'wb') as f:
        f.write(data)
    print(f"Saved: {p} ({len(data)} bytes)")

# Save plantuml source
with open('C:/Users/marti/Documents/Ciclo 9/Servicios Cloud/diagrama_base_de_datos.puml', 'w', encoding='utf-8') as f:
    f.write(plantuml_code)
print("Saved diagrama_base_de_datos.puml")
