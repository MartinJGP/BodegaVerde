import os
import zlib
import urllib.request

# ------------------------------------------------------------------------------
# 1. PLANTUML ENCODER & RENDERER (USING GRAPHVIZ DOT ENGINE ON PLANTUML SERVER)
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
# 2. DEFINICIÓN DEL DIAGRAMA CONCEPTUAL CHEN (CON ENCABEZADO Y ESTILO IMPECABLE)
# ------------------------------------------------------------------------------
chen_dot_code = """@startdot
graph ER_Chen {
    graph [
        rankdir=TB,
        dpi=160,
        nodesep=0.65,
        ranksep=0.9,
        splines=spline,
        overlap=false,
        bgcolor="#FFFFFF",
        label="Diagrama Conceptual de Datos (Notación de Peter Chen)\\nSistema Gastronómico La Bodega Verde",
        labelloc="t",
        labeljust="c",
        fontname="Segoe UI Bold",
        fontsize=18,
        fontcolor="#1E3F1A"
    ];

    node [fontname="Segoe UI, Arial", fontsize=11];
    edge [fontname="Segoe UI, Arial", fontsize=11, penwidth=1.3, color="#2D5A27"];

    // ==========================================
    // 1. ENTIDADES (Rectangulos)
    // ==========================================
    node [
        shape=box,
        style="filled",
        fillcolor="#D5E8D4",
        color="#2D5A27",
        penwidth=2.0,
        fontname="Segoe UI Bold",
        fontsize=13,
        fontcolor="#1E3F1A",
        margin="0.25,0.15"
    ];
    CATEGORIA; PLATO; MESA; USUARIO; PEDIDO; DETALLE_PEDIDO; COMPROBANTE; PAGO;

    // ==========================================
    // 2. RELACIONES (Rombos / Diamantes)
    // ==========================================
    node [
        shape=diamond,
        style="filled",
        fillcolor="#FFF2CC",
        color="#D6B656",
        penwidth=1.8,
        fontname="Segoe UI Bold",
        fontsize=11,
        fontcolor="#664D03",
        height=0.8,
        width=1.4
    ];
    R_CLASIFICA [label="Clasifica"];
    R_SOLICITA  [label="Solicita"];
    R_ALOJA     [label="Aloja"];
    R_REGISTRA  [label="Registra\\n(Mesero)"];
    R_CONTIENE  [label="Contiene"];
    R_GENERA    [label="Genera"];
    R_EMITE     [label="Emite\\n(Cajero)"];
    R_LIQUIDA   [label="Liquida"];

    // ==========================================
    // 3. ATRIBUTOS (Elipses con clave subrayada)
    // ==========================================
    node [
        shape=ellipse,
        style="filled",
        fillcolor="#F8F9FA",
        color="#6C757D",
        penwidth=1.1,
        fontname="Segoe UI",
        fontsize=10,
        fontcolor="#212529",
        height=0.45,
        width=1.05
    ];
    edge [color="#6C757D", penwidth=1.0, fontsize=10];

    // Atributos CATEGORIA
    c_id  [label=<<U>id_categoria</U>>, fontname="Segoe UI Bold"];
    c_nom [label="nombre"];
    c_des [label="descripcion"];
    c_id -- CATEGORIA; c_nom -- CATEGORIA; c_des -- CATEGORIA;

    // Atributos PLATO
    p_id  [label=<<U>id_plato</U>>, fontname="Segoe UI Bold"];
    p_nom [label="nombre"];
    p_pre [label="precio"];
    p_dis [label="disponible"];
    p_id -- PLATO; p_nom -- PLATO; p_pre -- PLATO; p_dis -- PLATO;

    // Atributos MESA
    m_id  [label=<<U>id_mesa</U>>, fontname="Segoe UI Bold"];
    m_num [label="numero"];
    m_cap [label="capacidad"];
    m_est [label="estado"];
    m_id -- MESA; m_num -- MESA; m_cap -- MESA; m_est -- MESA;

    // Atributos USUARIO
    u_id  [label=<<U>id_usuario</U>>, fontname="Segoe UI Bold"];
    u_nom [label="nombre"];
    u_ema [label="email"];
    u_rol [label="rol"];
    u_act [label="activo"];
    u_id -- USUARIO; u_nom -- USUARIO; u_ema -- USUARIO; u_rol -- USUARIO; u_act -- USUARIO;

    // Atributos PEDIDO
    ped_id  [label=<<U>id_pedido</U>>, fontname="Segoe UI Bold"];
    ped_est [label="estado"];
    ped_tot [label="total"];
    ped_fec [label="fecha"];
    ped_id -- PEDIDO; ped_est -- PEDIDO; ped_tot -- PEDIDO; ped_fec -- PEDIDO;

    // Atributos DETALLE_PEDIDO
    det_id  [label=<<U>id_detalle</U>>, fontname="Segoe UI Bold"];
    det_can [label="cantidad"];
    det_pre [label="precio_unit"];
    det_sub [label="subtotal"];
    det_not [label="notas"];
    det_id -- DETALLE_PEDIDO; det_can -- DETALLE_PEDIDO; det_pre -- DETALLE_PEDIDO; det_sub -- DETALLE_PEDIDO; det_not -- DETALLE_PEDIDO;

    // Atributos COMPROBANTE
    cmp_id  [label=<<U>id_comprobante</U>>, fontname="Segoe UI Bold"];
    cmp_tip [label="tipo"];
    cmp_ser [label="serie_num"];
    cmp_cli [label="cliente"];
    cmp_tot [label="total"];
    cmp_id -- COMPROBANTE; cmp_tip -- COMPROBANTE; cmp_ser -- COMPROBANTE; cmp_cli -- COMPROBANTE; cmp_tot -- COMPROBANTE;

    // Atributos PAGO
    pag_id  [label=<<U>id_pago</U>>, fontname="Segoe UI Bold"];
    pag_met [label="metodo"];
    pag_mon [label="monto"];
    pag_fec [label="fecha"];
    pag_id -- PAGO; pag_met -- PAGO; pag_mon -- PAGO; pag_fec -- PAGO;

    // ==========================================
    // 4. RELACIONES Y CARDINALIDADES (1 y N/M)
    // ==========================================
    edge [color="#2D5A27", penwidth=1.8, fontname="Segoe UI Bold", fontsize=12, fontcolor="#1E3F1A"];

    // CATEGORIA - PLATO
    CATEGORIA -- R_CLASIFICA [label=" 1 "];
    R_CLASIFICA -- PLATO     [label=" N "];

    // PLATO - DETALLE
    PLATO -- R_SOLICITA          [label=" 1 "];
    R_SOLICITA -- DETALLE_PEDIDO [label=" N "];

    // MESA - PEDIDO
    MESA -- R_ALOJA      [label=" 1 "];
    R_ALOJA -- PEDIDO    [label=" N "];

    // USUARIO - PEDIDO
    USUARIO -- R_REGISTRA   [label=" 1 "];
    R_REGISTRA -- PEDIDO    [label=" N "];

    // PEDIDO - DETALLE
    PEDIDO -- R_CONTIENE         [label=" 1 "];
    R_CONTIENE -- DETALLE_PEDIDO [label=" N "];

    // PEDIDO - COMPROBANTE
    PEDIDO -- R_GENERA         [label=" 1 "];
    R_GENERA -- COMPROBANTE    [label=" 1 "];

    // USUARIO - COMPROBANTE
    USUARIO -- R_EMITE       [label=" 1 "];
    R_EMITE -- COMPROBANTE   [label=" N "];

    // COMPROBANTE - PAGO
    COMPROBANTE -- R_LIQUIDA [label=" 1 "];
    R_LIQUIDA -- PAGO        [label=" N "];
}
@enddot"""

# ------------------------------------------------------------------------------
# 3. DRAW.IO NATIVE XML GENERATOR (NOTACIÓN DE PETER CHEN)
# ------------------------------------------------------------------------------
def generate_chen_drawio_xml():
    xml = """<mxfile host="app.diagrams.net" modified="2026-11-20T03:30:00.000Z" agent="Antigravity" version="24.0.0" type="device">
  <diagram id="diagrama_conceptual_chen" name="Modelo Conceptual - Notación Chen">
    <mxGraphModel dx="1600" dy="1100" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1300" background="#FFFFFF" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- TITULO -->
        <mxCell id="title" value="&lt;b&gt;&lt;font style=&quot;font-size: 22px;&quot; color=&quot;#1e3f1a&quot;&gt;MODELO CONCEPTUAL DE DATOS (NOTACIÓN DE PETER CHEN)&lt;/font&gt;&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 13px;&quot; color=&quot;#4a5d4e&quot;&gt;Sistema Gastronómico La Bodega Verde — Diagrama Entidad-Relación de Negocio&lt;/font&gt;" style="text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];autosize=1;strokeColor=none;fillColor=none;" vertex="1" parent="1">
          <mxGeometry x="450" y="20" width="800" height="50" as="geometry" />
        </mxCell>

        <!-- LEYENDA -->
        <mxCell id="leg_box" value="" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fafcfa;strokeColor=#b0bec5;dashed=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="20" width="320" height="70" as="geometry" />
        </mxCell>
        <mxCell id="leg_ent" value="Entidad" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=10;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="75" y="35" width="60" height="24" as="geometry" />
        </mxCell>
        <mxCell id="leg_rel" value="Relación" style="shape=rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;fontSize=9;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="150" y="30" width="65" height="34" as="geometry" />
        </mxCell>
        <mxCell id="leg_atr" value="Atributo" style="shape=ellipse;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontSize=10;fontColor=#333333;" vertex="1" parent="1">
          <mxGeometry x="230" y="35" width="60" height="24" as="geometry" />
        </mxCell>
        <mxCell id="leg_key" value="&lt;u&gt;Clave&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontStyle=1;fontSize=10;fontColor=#333333;" vertex="1" parent="1">
          <mxGeometry x="305" y="35" width="60" height="24" as="geometry" />
        </mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 1: CATEGORIA -->
        <!-- ======================================================== -->
        <mxCell id="ent_categoria" value="CATEGORIA" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="120" y="180" width="130" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos CATEGORIA -->
        <mxCell id="atr_c_id" value="&lt;u&gt;id_categoria&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="30" y="110" width="100" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_c_nom" value="nombre" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="145" y="90" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_c_des" value="descripcion" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="235" y="110" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_c_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_c_id" target="ent_categoria"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_c_nom" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_c_nom" target="ent_categoria"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_c_des" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_c_des" target="ent_categoria"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Clasifica (CATEGORIA - PLATO) -->
        <mxCell id="rel_clasifica" value="Clasifica" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="135" y="275" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_cat_rel" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_categoria" target="rel_clasifica"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_rel_pla" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_clasifica" target="ent_plato"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 2: PLATO -->
        <!-- ======================================================== -->
        <mxCell id="ent_plato" value="PLATO" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="120" y="380" width="130" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos PLATO -->
        <mxCell id="atr_p_id" value="&lt;u&gt;id_plato&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="10" y="340" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_p_nom" value="nombre" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="10" y="390" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_p_pre" value="precio" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="10" y="440" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_p_dis" value="disponible" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="80" y="470" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_p_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_p_id" target="ent_plato"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_p_nom" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_p_nom" target="ent_plato"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_p_pre" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_p_pre" target="ent_plato"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_p_dis" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_p_dis" target="ent_plato"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 3: MESA -->
        <!-- ======================================================== -->
        <mxCell id="ent_mesa" value="MESA" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="500" y="180" width="130" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos MESA -->
        <mxCell id="atr_m_id" value="&lt;u&gt;id_mesa&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="410" y="110" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_m_num" value="numero" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="500" y="90" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_m_cap" value="capacidad" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="585" y="90" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_m_est" value="estado" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="650" y="125" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_m_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_m_id" target="ent_mesa"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_m_num" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_m_num" target="ent_mesa"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_m_cap" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_m_cap" target="ent_mesa"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_m_est" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_m_est" target="ent_mesa"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Aloja (MESA - PEDIDO) -->
        <mxCell id="rel_aloja" value="Aloja" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="515" y="275" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_mes_rel" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_mesa" target="rel_aloja"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_rel_ped" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_aloja" target="ent_pedido"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 4: USUARIO -->
        <!-- ======================================================== -->
        <mxCell id="ent_usuario" value="USUARIO" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="920" y="180" width="130" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos USUARIO -->
        <mxCell id="atr_u_id" value="&lt;u&gt;id_usuario&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="820" y="100" width="90" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_u_nom" value="nombre" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="920" y="80" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_u_ema" value="email" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1010" y="80" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_u_rol" value="rol" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1070" y="120" width="70" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_u_act" value="activo" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1080" y="175" width="70" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_u_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_u_id" target="ent_usuario"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_u_nom" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_u_nom" target="ent_usuario"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_u_ema" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_u_ema" target="ent_usuario"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_u_rol" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_u_rol" target="ent_usuario"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_u_act" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_u_act" target="ent_usuario"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Registra (USUARIO - PEDIDO) -->
        <mxCell id="rel_registra" value="Registra&#xa;(Mesero)" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="720" y="275" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_usu_reg" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_usuario" target="rel_registra"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_reg_ped" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_registra" target="ent_pedido"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 5: PEDIDO -->
        <!-- ======================================================== -->
        <mxCell id="ent_pedido" value="PEDIDO" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="610" y="380" width="130" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos PEDIDO -->
        <mxCell id="atr_ped_id" value="&lt;u&gt;id_pedido&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="500" y="440" width="90" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_ped_est" value="estado" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="590" y="460" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_ped_tot" value="total" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="675" y="460" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_ped_fec" value="fecha" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="750" y="435" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_ped_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_ped_id" target="ent_pedido"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_ped_est" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_ped_est" target="ent_pedido"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_ped_tot" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_ped_tot" target="ent_pedido"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_ped_fec" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_ped_fec" target="ent_pedido"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Solicita (PLATO - DETALLE_PEDIDO) -->
        <mxCell id="rel_solicita" value="Solicita" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="250" y="520" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_pla_sol" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_plato" target="rel_solicita"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_sol_det" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_solicita" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Contiene (PEDIDO - DETALLE_PEDIDO) -->
        <mxCell id="rel_contiene" value="Contiene" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="460" y="520" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_ped_con" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_pedido" target="rel_contiene"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_con_det" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_contiene" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 6: DETALLE_PEDIDO -->
        <!-- ======================================================== -->
        <mxCell id="ent_detalle" value="DETALLE_PEDIDO" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="340" y="650" width="150" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos DETALLE_PEDIDO -->
        <mxCell id="atr_det_id" value="&lt;u&gt;id_detalle&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="220" y="655" width="90" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_det_can" value="cantidad" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="235" y="715" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_det_pre" value="precio_unit" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="325" y="735" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_det_sub" value="subtotal" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="420" y="735" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_det_not" value="notas" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="510" y="710" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_det_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_det_id" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_det_can" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_det_can" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_det_pre" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_det_pre" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_det_sub" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_det_sub" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_det_not" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_det_not" target="ent_detalle"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Genera (PEDIDO - COMPROBANTE) -->
        <mxCell id="rel_genera" value="Genera" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="840" y="470" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_ped_gen" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_pedido" target="rel_genera"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_gen_cmp" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_genera" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Emite (USUARIO - COMPROBANTE) -->
        <mxCell id="rel_emite" value="Emite&#xa;(Cajero)" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="1050" y="380" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_usu_emi" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_usuario" target="rel_emite"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_emi_cmp" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_emite" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 7: COMPROBANTE -->
        <!-- ======================================================== -->
        <mxCell id="ent_comprobante" value="COMPROBANTE" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="1010" y="550" width="150" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos COMPROBANTE -->
        <mxCell id="atr_cmp_id" value="&lt;u&gt;id_comprobante&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1190" y="490" width="115" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_cmp_tip" value="tipo" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1200" y="540" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_cmp_ser" value="serie_num" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1200" y="590" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_cmp_cli" value="cliente" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1190" y="640" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_cmp_tot" value="total" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1110" y="660" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_cmp_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_cmp_id" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_cmp_tip" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_cmp_tip" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_cmp_ser" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_cmp_ser" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_cmp_cli" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_cmp_cli" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_cmp_tot" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_cmp_tot" target="ent_comprobante"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- RELACION: Liquida (COMPROBANTE - PAGO) -->
        <mxCell id="rel_liquida" value="Liquida" style="shape=rhombus;whiteSpace=wrap;html=1;fontStyle=1;fontSize=11;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#664d03;" vertex="1" parent="1">
          <mxGeometry x="1035" y="720" width="100" height="55" as="geometry" />
        </mxCell>
        <mxCell id="e_cmp_liq" value="1" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="ent_comprobante" target="rel_liquida"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_liq_pag" value="N" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#2D5A27;strokeWidth=1.5;fontStyle=1;fontSize=12;fontColor=#1e3f1a;" edge="1" parent="1" source="rel_liquida" target="ent_pago"><mxGeometry relative="1" as="geometry" /></mxCell>

        <!-- ======================================================== -->
        <!-- ENTIDAD 8: PAGO -->
        <!-- ======================================================== -->
        <mxCell id="ent_pago" value="PAGO" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontSize=13;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#1e3f1a;" vertex="1" parent="1">
          <mxGeometry x="1020" y="860" width="130" height="45" as="geometry" />
        </mxCell>
        <!-- Atributos PAGO -->
        <mxCell id="atr_pag_id" value="&lt;u&gt;id_pago&lt;/u&gt;" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fontStyle=1;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="910" y="865" width="85" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_pag_met" value="metodo" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="940" y="930" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_pag_mon" value="monto" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1045" y="945" width="80" height="36" as="geometry" />
        </mxCell>
        <mxCell id="atr_pag_fec" value="fecha" style="shape=ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor=#f5f5f5;strokeColor=#666666;" vertex="1" parent="1">
          <mxGeometry x="1145" y="930" width="75" height="36" as="geometry" />
        </mxCell>
        <mxCell id="e_pag_id" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_pag_id" target="ent_pago"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_pag_met" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_pag_met" target="ent_pago"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_pag_mon" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_pag_mon" target="ent_pago"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e_pag_fec" style="edgeStyle=none;html=1;endArrow=none;strokeColor=#666666;" edge="1" parent="1" source="atr_pag_fec" target="ent_pago"><mxGeometry relative="1" as="geometry" /></mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""
    return xml

# ------------------------------------------------------------------------------
# 4. EJECUCIÓN PRINCIPAL Y COPIADO DE ARCHIVOS
# ------------------------------------------------------------------------------
base_dir = r"C:\Users\marti\Documents\Ciclo 9\Servicios Cloud"
artifact_dir = r"C:\Users\marti\.gemini\antigravity\brain\9c322b4d-6950-4508-be61-1f825052231e"

# 1. Renderizar imagen del Modelo Conceptual Chen
png_path = os.path.join(base_dir, "diagrama_conceptual_chen.png")
artifact_png = os.path.join(artifact_dir, "diagrama_conceptual_chen.png")
modelo_conceptual_png = os.path.join(base_dir, "modelo_conceptual.png")
artifact_modelo_conceptual = os.path.join(artifact_dir, "modelo_conceptual.png")

render_plantuml(chen_dot_code, png_path)

# Copiar a rutas correspondientes
with open(png_path, "rb") as f_in:
    content = f_in.read()
    with open(artifact_png, "wb") as f_out:
        f_out.write(content)
    with open(modelo_conceptual_png, "wb") as f_out:
        f_out.write(content)
    with open(artifact_modelo_conceptual, "wb") as f_out:
        f_out.write(content)

# 2. Generar archivo nativo .drawio de Notación Chen
drawio_xml = generate_chen_drawio_xml()
drawio_path = os.path.join(base_dir, "diagrama_conceptual_chen.drawio")
artifact_drawio = os.path.join(artifact_dir, "diagrama_conceptual_chen.drawio")

with open(drawio_path, "w", encoding="utf-8") as f:
    f.write(drawio_xml)
with open(artifact_drawio, "w", encoding="utf-8") as f:
    f.write(drawio_xml)

print(f"Saved: {png_path}")
print(f"Saved: {drawio_path}")
print("=== CHEN DIAGRAM GENERATED SUCCESSFULLY! ===")
