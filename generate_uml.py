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

code = '''@startuml
skinparam DefaultFontName Arial
skinparam roundcorner 8
skinparam nodeBackgroundColor #FFFFFF
skinparam nodeBorderColor #2D5A27
skinparam nodeBorderThickness 1.5
skinparam componentBackgroundColor #F4F8F4
skinparam componentBorderColor #2D5A27
skinparam databaseBackgroundColor #FBFDFB
skinparam databaseBorderColor #2D5A27
skinparam arrowColor #2D5A27
skinparam arrowThickness 1.2
skinparam packageBackgroundColor #FAFCFA
skinparam packageBorderColor #8E9B90

title Diagrama de Despliegue UML - Arquitectura Cloud (La Bodega Verde)

package "Capa Cliente (Frontend - Next.js 14)" {
  node "Tablet del Mesero" <<device>> as Tablet {
    artifact "App Web Mesero\\n(Next.js PWA)" as MeseroApp
  }
  
  node "Pantalla de Cocina" <<device>> as CocinaNode {
    artifact "App Web Cocina\\n(Socket.io Client)" as CocinaApp
  }
  
  node "Terminal de Caja" <<device>> as Caja {
    artifact "App Web Caja\\n(Next.js POS)" as CajaApp
  }
}

package "Capa Servidor (Backend y Datos - Nube)" {
  node "Servidor de Aplicaciones Cloud\\n[Google Cloud Run / Node.js + NestJS]" <<executionEnvironment>> as AppServer {
    component "API Gateway\\n(Endpoints REST HTTP)" as REST
    component "Socket.io Gateway\\n(Servicio WebSockets)" as WS
    component "Lógica de Negocio (Servicios NestJS)\\n- Módulo de Comandas y Mesas\\n- Módulo de Cobros y Facturación" as Business
    component "Capa de Persistencia\\n(Prisma ORM)" as ORM
    
    REST --> Business
    WS --> Business
    Business --> ORM
  }

  database "Servidor de Base de Datos\\n[PostgreSQL 16 - Supabase / Cloud SQL]" <<database>> as DBNode {
    folder "Esquema Relacional\\n- Mesas\\n- Pedidos y Detalle\\n- Comprobantes y Pagos\\n- Platos y Categorías\\n- Usuarios" as Tables
  }
}

' Conexiones de Red Cliente - Servidor
MeseroApp --> REST : <<protocol>> HTTPS (JSON)\\n[Registro de pedidos]
MeseroApp <--> WS : <<protocol>> WSS (WebSockets)\\n[Alertas de pedidos listos]

CocinaApp <--> WS : <<protocol>> WSS (WebSockets)\\n[Comandas en tiempo real]

CajaApp --> REST : <<protocol>> HTTPS (JSON)\\n[Cobro y facturación]
CajaApp <--> WS : <<protocol>> WSS (WebSockets)\\n[Solicitudes de cuenta]

ORM --> DBNode : <<protocol>> TCP/IP 5432 (SSL)\\n[Consultas SQL / Transacciones ACID]

@enduml'''

url = 'http://www.plantuml.com/plantuml/png/' + plantuml_encode(code)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = resp.read()

with open('C:/Users/marti/.gemini/antigravity/brain/9c322b4d-6950-4508-be61-1f825052231e/arquitectura_despliegue_uml.png', 'wb') as f:
    f.write(data)

with open('C:/Users/marti/Documents/Ciclo 9/Servicios Cloud/arquitectura_despliegue_uml.png', 'wb') as f:
    f.write(data)

print('Generated arquitectura_despliegue_uml.png successfully!')
