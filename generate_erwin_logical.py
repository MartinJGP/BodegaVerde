import os
import zlib
import urllib.request

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
    print(f"Generated PNG: {output_png_path} ({len(data)} bytes)")

# Código PlantUML que simula con máxima precisión erwin Data Modeler (Information Engineering)
erwin_puml = """@startuml
skinparam dpi 160
hide circle
skinparam DefaultFontName "Segoe UI"
skinparam DefaultFontSize 11
skinparam roundcorner 0
skinparam linetype ortho
skinparam shadowing false
skinparam nodesep 50
skinparam ranksep 60

' Estilo clásico erwin Data Modeler (Theme IE / Information Engineering)
skinparam class {
    BackgroundColor #FFFFFF
    BorderColor #2B4C6F
    HeaderBackgroundColor #E8F1F8
    HeaderBorderColor #2B4C6F
    FontSize 12
    FontStyle bold
    AttributeFontSize 10
    BorderThickness 1.5
}

skinparam arrow {
    Color #1C3B5E
    FontColor #0C233C
    FontSize 10
    Thickness 1.4
}

skinparam package {
    BackgroundColor #FAFCFF
    BorderColor #A3B8CC
    FontSize 12
    FontStyle bold
    FontColor #1C3B5E
}

title <size:18><b>Modelo Lógico de Datos (LDM) — Estándar erwin Data Modeler</b></size>\\n<size:12>Sistema Gastronómico La Bodega Verde — Notación Information Engineering (IE / Crow's Foot) Normalizado en 3FN</size>

package "Módulo: Catálogo y Carta" {
    entity "CATEGORIA" as Categoria {
        + id_categoria : Integer <<PK>>
        --
        * nombre : String(100)
        descripcion : String(255)
        * activo : Boolean
    }

    entity "PLATO" as Plato {
        + id_plato : Integer <<PK>>
        --
        * id_categoria : Integer <<FK>>
        * nombre : String(120)
        descripcion : String(255)
        * precio : Decimal(10,2)
        * disponible : Boolean
        * activo : Boolean
    }
}

package "Módulo: Salón y Personal" {
    entity "MESA" as Mesa {
        + id_mesa : Integer <<PK>>
        --
        * numero : Integer <<AK1>>
        * capacidad : Integer
        * estado : String(20)
        * activo : Boolean
    }

    entity "USUARIO" as Usuario {
        + id_usuario : Integer <<PK>>
        --
        * nombre : String(100)
        * email : String(150) <<AK1>>
        * password_hash : String(255)
        * rol : String(20)
        * activo : Boolean
        * created_at : DateTime
    }
}

package "Módulo: Comandas y Atención" {
    entity "PEDIDO" as Pedido {
        + id_pedido : Integer <<PK>>
        --
        * id_mesa : Integer <<FK>>
        * id_usuario : Integer <<FK>>
        * estado : String(20)
        * total : Decimal(10,2)
        * created_at : DateTime
        * updated_at : DateTime
    }

    entity "PEDIDO_DETALLE" as DetallePedido {
        + id_detalle : Integer <<PK>>
        --
        * id_pedido : Integer <<FK>>
        * id_plato : Integer <<FK>>
        * cantidad : Integer
        * precio_unitario : Decimal(10,2)
        * subtotal : Decimal(10,2)
        notas : String(255)
    }
}

package "Módulo: Facturación y Cobranzas" {
    entity "COMPROBANTE" as Comprobante {
        + id_comprobante : Integer <<PK>>
        --
        * id_pedido : Integer <<FK, AK1>>
        * id_usuario : Integer <<FK>>
        * tipo : String(20)
        * serie : String(4)
        * numero : String(8)
        cliente_tipo_doc : String(10)
        cliente_num_doc : String(15)
        cliente_nombre : String(150)
        * subtotal : Decimal(10,2)
        * igv : Decimal(10,2)
        * total : Decimal(10,2)
        * estado : String(20)
        * created_at : DateTime
    }

    entity "PAGO" as Pago {
        + id_pago : Integer <<PK>>
        --
        * id_comprobante : Integer <<FK>>
        * metodo : String(20)
        * monto : Decimal(10,2)
        referencia : String(100)
        * created_at : DateTime
    }
}

' Relaciones erwin (Non-Identifying 1:N -> líneas discontinuas con Crow's Foot)
Categoria ||..o{ Plato : "clasifica a"
Plato ||..o{ DetallePedido : "se solicita en"

Mesa ||..o{ Pedido : "aloja a"
Usuario ||..o{ Pedido : "registra a (mesero)"

Pedido ||..|{ DetallePedido : "se desglosa en"
Pedido ||..o| Comprobante : "genera (1 a 0..1)"

Usuario ||..o{ Comprobante : "emite (cajero)"
Comprobante ||..|{ Pago : "se cancela con"

note bottom of DetallePedido
  <b>Normalización 3FN en erwin:</b>
  * <b>1FN:</b> Atributos atómicos indivisibles.
  * <b>2FN:</b> Dependencia funcional completa de la PK.
  * <b>3FN:</b> precio_unitario se conserva como snapshot
    histórico (no depende transitivamente del precio actual de PLATO).
end note

@enduml
"""

base_dir = r"C:\Users\marti\Documents\Ciclo 9\Servicios Cloud"
artifact_dir = r"C:\Users\marti\.gemini\antigravity\brain\9c322b4d-6950-4508-be61-1f825052231e"

puml_path = os.path.join(base_dir, "diagrama_logico_erwin.puml")
png_path = os.path.join(base_dir, "diagrama_logico_erwin.png")
artifact_png = os.path.join(artifact_dir, "diagrama_logico_erwin.png")

with open(puml_path, "w", encoding="utf-8") as f:
    f.write(erwin_puml)

render_plantuml(erwin_puml, png_path)

with open(png_path, "rb") as f_in, open(artifact_png, "wb") as f_out:
    f_out.write(f_in.read())

print("Saved and rendered erwin logical diagram successfully!")
