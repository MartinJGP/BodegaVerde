import os
import zlib
import urllib.request

# ------------------------------------------------------------------------------
# 1. PLANTUML ENCODER & RENDERER
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# 2. DEFINICIÓN DEL DIAGRAMA ER EN PLANTUML (ESTILO DRAW.IO / CROW'S FOOT)
# ------------------------------------------------------------------------------
erd_puml = """@startuml
skinparam dpi 150
hide circle
skinparam DefaultFontName "Segoe UI"
skinparam DefaultFontSize 12
skinparam roundcorner 6
skinparam linetype ortho
skinparam shadowing false
skinparam nodesep 55
skinparam ranksep 60

' Paleta estilo Draw.io (La Bodega Verde: Verde Botánico & Esmeralda Suave)
skinparam entity {
    BackgroundColor #FFFFFF
    BorderColor #2D5A27
    HeaderBackgroundColor #D5E8D4
    HeaderBorderColor #2D5A27
    FontSize 13
    FontStyle bold
    AttributeFontSize 11
}

skinparam arrow {
    Color #2D5A27
    FontColor #1E3F1A
    FontSize 11
    Thickness 1.8
}

skinparam package {
    BackgroundColor #FAFCFA
    BorderColor #8E9B90
    FontSize 13
    FontStyle bold
    FontColor #2D5A27
}

title <size:18><b>Diagrama Entidad - Relación (DER / ERD)</b></size>\\n<size:12>Sistema Gastronómico La Bodega Verde — Modelo Relacional para Draw.io (Notación Crow's Foot)</size>

package "1. Catálogo y Menú" {
    entity "categorias" as categorias {
        * **id_categoria** : INT <<PK>>
        --
        * nombre : VARCHAR(100)
        descripcion : TEXT
        * activo : BOOLEAN
    }

    entity "platos" as platos {
        * **id_plato** : INT <<PK>>
        --
        * id_categoria : INT <<FK>>
        * nombre : VARCHAR(120)
        descripcion : TEXT
        * precio : DECIMAL(10,2)
        * disponible : BOOLEAN
        * activo : BOOLEAN
    }
}

package "2. Salón y Personal" {
    entity "mesas" as mesas {
        * **id_mesa** : INT <<PK>>
        --
        * numero : INT <<UNIQUE>>
        * capacidad : INT
        * estado : VARCHAR(20)
        * activo : BOOLEAN
    }

    entity "usuarios" as usuarios {
        * **id_usuario** : INT <<PK>>
        --
        * nombre : VARCHAR(100)
        * email : VARCHAR(150) <<UNIQUE>>
        * password_hash : VARCHAR(255)
        * rol : VARCHAR(20)
        * activo : BOOLEAN
        * created_at : TIMESTAMPTZ
    }
}

package "3. Operaciones de Comanda" {
    entity "pedidos" as pedidos {
        * **id_pedido** : INT <<PK>>
        --
        * id_mesa : INT <<FK>>
        * id_usuario : INT <<FK>>
        * estado : VARCHAR(20)
        * total : DECIMAL(10,2)
        * created_at : TIMESTAMPTZ
        * updated_at : TIMESTAMPTZ
    }

    entity "pedidos_detalle" as pedidos_detalle {
        * **id_detalle** : INT <<PK>>
        --
        * id_pedido : INT <<FK>>
        * id_plato : INT <<FK>>
        * cantidad : INT
        * precio_unitario : DECIMAL(10,2)
        * subtotal : DECIMAL(10,2)
        notas : VARCHAR(255)
    }
}

package "4. Caja y Facturación" {
    entity "comprobantes" as comprobantes {
        * **id_comprobante** : INT <<PK>>
        --
        * id_pedido : INT <<FK, UNIQUE>>
        * id_usuario : INT <<FK>>
        * tipo : VARCHAR(20)
        * serie : VARCHAR(4)
        * numero : VARCHAR(8)
        * cliente_tipo_doc : VARCHAR(10)
        * cliente_num_doc : VARCHAR(15)
        * cliente_nombre : VARCHAR(150)
        * subtotal : DECIMAL(10,2)
        * igv : DECIMAL(10,2)
        * total : DECIMAL(10,2)
        * estado : VARCHAR(20)
        * created_at : TIMESTAMPTZ
    }

    entity "pagos" as pagos {
        * **id_pago** : INT <<PK>>
        --
        * id_comprobante : INT <<FK>>
        * metodo : VARCHAR(20)
        * monto : DECIMAL(10,2)
        referencia : VARCHAR(100)
        * created_at : TIMESTAMPTZ
    }
}

' Relaciones Crow's Foot con descripción clara
categorias ||--o{ platos : "1:N contiene"
platos ||--o{ pedidos_detalle : "1:N solicitado en"

mesas ||--o{ pedidos : "1:N aloja"
usuarios ||--o{ pedidos : "1:N registra (mesero)"

pedidos ||--|{ pedidos_detalle : "1:N desglosa en"
pedidos ||--o| comprobantes : "1:0..1 liquida en"

usuarios ||--o{ comprobantes : "1:N emite (cajero)"
comprobantes ||--|{ pagos : "1:N cancela con"

@enduml
"""

# ------------------------------------------------------------------------------
# 3. NATIVE DRAW.IO XML GENERATOR (.drawio)
# ------------------------------------------------------------------------------
def generate_drawio_xml():
    xml = """<mxfile host="app.diagrams.net" modified="2026-11-20T03:00:00.000Z" agent="Antigravity" version="24.0.0" type="device">
  <diagram id="diagrama_er_bodega_verde" name="Diagrama ER - La Bodega Verde">
    <mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1200" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- TITULO -->
        <mxCell id="title" value="&lt;b&gt;&lt;font style=&quot;font-size: 20px;&quot; color=&quot;#1e3f1a&quot;&gt;DIAGRAMA ENTIDAD - RELACIÓN (ERD)&lt;/font&gt;&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 13px;&quot; color=&quot;#4a5d4e&quot;&gt;Sistema de Gestión Gastronómica — La Bodega Verde (PostgreSQL 16)&lt;/font&gt;" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" vertex="1" parent="1">
          <mxGeometry x="550" y="30" width="700" height="50" as="geometry" />
        </mxCell>

        <!-- TABLA: CATEGORIAS -->
        <mxCell id="tbl_categorias" value="categorias" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="120" width="220" height="110" as="geometry" />
        </mxCell>
        <mxCell id="c_cat_pk" value="+ id_categoria: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_categorias">
          <mxGeometry y="28" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cat_nom" value="• nombre: VARCHAR(100)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_categorias">
          <mxGeometry y="54" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cat_act" value="• activo: BOOLEAN" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_categorias">
          <mxGeometry y="80" width="220" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: PLATOS -->
        <mxCell id="tbl_platos" value="platos" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="300" width="220" height="188" as="geometry" />
        </mxCell>
        <mxCell id="c_pla_pk" value="+ id_plato: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_platos">
          <mxGeometry y="28" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pla_fk" value="# id_categoria: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_platos">
          <mxGeometry y="54" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pla_nom" value="• nombre: VARCHAR(120)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_platos">
          <mxGeometry y="80" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pla_pre" value="• precio: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_platos">
          <mxGeometry y="106" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pla_dis" value="• disponible: BOOLEAN" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_platos">
          <mxGeometry y="132" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pla_act" value="• activo: BOOLEAN" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_platos">
          <mxGeometry y="158" width="220" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: MESAS -->
        <mxCell id="tbl_mesas" value="mesas" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="400" y="120" width="220" height="136" as="geometry" />
        </mxCell>
        <mxCell id="c_mes_pk" value="+ id_mesa: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_mesas">
          <mxGeometry y="28" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_mes_num" value="• numero: INT [UNIQUE]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_mesas">
          <mxGeometry y="54" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_mes_cap" value="• capacidad: INT" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_mesas">
          <mxGeometry y="80" width="220" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_mes_est" value="• estado: VARCHAR(20)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_mesas">
          <mxGeometry y="106" width="220" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: USUARIOS -->
        <mxCell id="tbl_usuarios" value="usuarios" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="760" y="120" width="240" height="188" as="geometry" />
        </mxCell>
        <mxCell id="c_usu_pk" value="+ id_usuario: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_usuarios">
          <mxGeometry y="28" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_usu_nom" value="• nombre: VARCHAR(100)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_usuarios">
          <mxGeometry y="54" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_usu_ema" value="• email: VARCHAR(150) [UNIQUE]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_usuarios">
          <mxGeometry y="80" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_usu_rol" value="• rol: VARCHAR(20)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_usuarios">
          <mxGeometry y="106" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_usu_act" value="• activo: BOOLEAN" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_usuarios">
          <mxGeometry y="132" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_usu_fec" value="• created_at: TIMESTAMPTZ" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_usuarios">
          <mxGeometry y="158" width="240" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: PEDIDOS -->
        <mxCell id="tbl_pedidos" value="pedidos" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="400" y="380" width="230" height="188" as="geometry" />
        </mxCell>
        <mxCell id="c_ped_pk" value="+ id_pedido: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_pedidos">
          <mxGeometry y="28" width="230" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_ped_fk_mes" value="# id_mesa: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_pedidos">
          <mxGeometry y="54" width="230" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_ped_fk_usu" value="# id_usuario: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_pedidos">
          <mxGeometry y="80" width="230" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_ped_est" value="• estado: VARCHAR(20)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_pedidos">
          <mxGeometry y="106" width="230" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_ped_tot" value="• total: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_pedidos">
          <mxGeometry y="132" width="230" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_ped_fec" value="• created_at: TIMESTAMPTZ" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_pedidos">
          <mxGeometry y="158" width="230" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: PEDIDOS_DETALLE -->
        <mxCell id="tbl_detalle" value="pedidos_detalle" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="580" width="240" height="214" as="geometry" />
        </mxCell>
        <mxCell id="c_det_pk" value="+ id_detalle: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="28" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_det_fk_ped" value="# id_pedido: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="54" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_det_fk_pla" value="# id_plato: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="80" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_det_can" value="• cantidad: INT" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="106" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_det_pre" value="• precio_unitario: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="132" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_det_sub" value="• subtotal: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="158" width="240" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_det_not" value="• notas: VARCHAR(255)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_detalle">
          <mxGeometry y="184" width="240" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: COMPROBANTES -->
        <mxCell id="tbl_comprobantes" value="comprobantes" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="760" y="380" width="260" height="292" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_pk" value="+ id_comprobante: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="28" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_fk_ped" value="# id_pedido: INT [FK, UNIQUE]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="54" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_fk_usu" value="# id_usuario: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="80" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_tip" value="• tipo: VARCHAR(20) [BOLETA/FACTURA]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="106" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_num" value="• serie_numero: VARCHAR(13)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="132" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_cli" value="• cliente_nombre: VARCHAR(150)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="158" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_doc" value="• cliente_num_doc: VARCHAR(15)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="184" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_sub" value="• subtotal: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="210" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_igv" value="• igv: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="236" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_cmp_tot" value="• total: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_comprobantes">
          <mxGeometry y="262" width="260" height="26" as="geometry" />
        </mxCell>

        <!-- TABLA: PAGOS -->
        <mxCell id="tbl_pagos" value="pagos" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;fontSize=13;rounded=1;" vertex="1" parent="1">
          <mxGeometry x="760" y="730" width="260" height="162" as="geometry" />
        </mxCell>
        <mxCell id="c_pag_pk" value="+ id_pago: INT [PK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=1;fontSize=11;" vertex="1" parent="tbl_pagos">
          <mxGeometry y="28" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pag_fk_cmp" value="# id_comprobante: INT [FK]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontStyle=2;fontSize=11;fontColor=#2d5a27;" vertex="1" parent="tbl_pagos">
          <mxGeometry y="54" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pag_met" value="• metodo: VARCHAR(20) [YAPE/EFECT/TARJ]" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_pagos">
          <mxGeometry y="80" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pag_mon" value="• monto: DECIMAL(10,2)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_pagos">
          <mxGeometry y="106" width="260" height="26" as="geometry" />
        </mxCell>
        <mxCell id="c_pag_fec" value="• created_at: TIMESTAMPTZ" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontSize=11;" vertex="1" parent="tbl_pagos">
          <mxGeometry y="132" width="260" height="26" as="geometry" />
        </mxCell>

        <!-- CONECTORES ER (CROW'S FOOT NOTATION) -->

        <!-- 1. categorias - platos (1:N) -->
        <mxCell id="rel_cat_pla" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;" edge="1" parent="1" source="tbl_categorias" target="tbl_platos">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 2. platos - pedidos_detalle (1:N) -->
        <mxCell id="rel_pla_det" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;" edge="1" parent="1" source="tbl_platos" target="tbl_detalle">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 3. mesas - pedidos (1:N) -->
        <mxCell id="rel_mes_ped" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;" edge="1" parent="1" source="tbl_mesas" target="tbl_pedidos">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 4. usuarios - pedidos (1:N) -->
        <mxCell id="rel_usu_ped" value="1 : N (mesero)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;exitX=0;exitY=0.75;exitDx=0;exitDy=0;entryX=1;entryY=0.25;entryDx=0;entryDy=0;" edge="1" parent="1" source="tbl_usuarios" target="tbl_pedidos">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 5. pedidos - pedidos_detalle (1:N) -->
        <mxCell id="rel_ped_det" value="1 : N (comanda)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;exitX=0;exitY=0.8;exitDx=0;exitDy=0;entryX=1;entryY=0.3;entryDx=0;entryDy=0;" edge="1" parent="1" source="tbl_pedidos" target="tbl_detalle">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 6. pedidos - comprobantes (1:0..1) -->
        <mxCell id="rel_ped_cmp" value="1 : 0..1 (factura)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERzeroToOne;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" edge="1" parent="1" source="tbl_pedidos" target="tbl_comprobantes">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 7. usuarios - comprobantes (1:N cajero) -->
        <mxCell id="rel_usu_cmp" value="1 : N (cajero)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="tbl_usuarios" target="tbl_comprobantes">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <!-- 8. comprobantes - pagos (1:N) -->
        <mxCell id="rel_cmp_pag" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow=ERmandOne;startFill=0;endArrow=ERmany;endFill=0;strokeColor=#2D5A27;strokeWidth=1.5;fontColor=#1E3F1A;fontSize=11;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;" edge="1" parent="1" source="tbl_comprobantes" target="tbl_pagos">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""
    return xml

# ------------------------------------------------------------------------------
# 4. DRAW.IO SQL DDL SCRIPT (Para importar en Draw.io: Insert > Advanced > SQL)
# ------------------------------------------------------------------------------
sql_ddl = """-- =============================================================================
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
"""

# ------------------------------------------------------------------------------
# 5. EJECUCIÓN PRINCIPAL
# ------------------------------------------------------------------------------
base_dir = r"C:\Users\marti\Documents\Ciclo 9\Servicios Cloud"
artifact_dir = r"C:\Users\marti\.gemini\antigravity\brain\9c322b4d-6950-4508-be61-1f825052231e"

# 1. Guardar PUML y Renderizar PNG
puml_path = os.path.join(base_dir, "diagrama_er_drawio.puml")
png_path = os.path.join(base_dir, "diagrama_er_drawio.png")
artifact_png = os.path.join(artifact_dir, "diagrama_er_drawio.png")

with open(puml_path, "w", encoding="utf-8") as f:
    f.write(erd_puml)
print(f"Saved: {puml_path}")

render_plantuml(erd_puml, png_path)

# Copiar a carpeta de artefactos
with open(png_path, "rb") as f_in, open(artifact_png, "wb") as f_out:
    f_out.write(f_in.read())
print(f"Copied to artifact: {artifact_png}")

# 2. Generar archivo nativo .drawio
drawio_xml = generate_drawio_xml()
drawio_path = os.path.join(base_dir, "diagrama_er_bodega_verde.drawio")
artifact_drawio = os.path.join(artifact_dir, "diagrama_er_bodega_verde.drawio")

with open(drawio_path, "w", encoding="utf-8") as f:
    f.write(drawio_xml)
print(f"Saved: {drawio_path}")

with open(artifact_drawio, "w", encoding="utf-8") as f:
    f.write(drawio_xml)
print(f"Copied to artifact: {artifact_drawio}")

# 3. Guardar archivo SQL para Draw.io
sql_path = os.path.join(base_dir, "drawio_sql_import.sql")
with open(sql_path, "w", encoding="utf-8") as f:
    f.write(sql_ddl)
print(f"Saved: {sql_path}")

print("=== ALL ARTIFACTS AND DIAGRAMS GENERATED SUCCESSFULLY! ===")
