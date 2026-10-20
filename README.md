# 🌿 La Bodega Verde — Sistema de Gestión Gastronómica

Sistema web integral en tiempo real para la gestión operativa de restaurante y cafetería, diseñado con arquitectura desacoplada: **Frontend en Next.js 14** (App Router, Tailwind CSS, Lucide Icons, WebSockets) y **Backend en NestJS** con **Prisma ORM** y **PostgreSQL (Supabase)**.

---

## 🚀 Arquitectura del Proyecto

```text
BodegaVerde/
├── frontend/                 # Aplicación Cliente (Next.js 14 + Tailwind CSS)
│   ├── src/
│   │   ├── app/              # Páginas y layout global
│   │   ├── components/       # Modales, cabecera, alertas sonoras
│   │   │   └── views/        # Vistas: MeseroView, CocinaView, AdminView
│   │   ├── lib/              # Cliente API REST y WebSockets (Socket.io)
│   │   └── types/            # Definiciones de TypeScript
│   ├── vercel.json           # Configuración optimizada para Vercel
│   └── package.json
│
├── prisma/                   # Backend API (NestJS + Prisma + Socket.io Gateway)
│   ├── prisma/               # Esquema de base de datos y migraciones
│   │   └── schema.prisma     # Modelos: Mesa, Pedido, DetallePedido, Plato, Insumo, Kardex
│   ├── src/                  # Módulos: pedidos, mesas, platos, insumos, auth, websockets
│   └── package.json
│
├── iniciar-proyecto.bat      # Script automatizado para inicio en Windows
└── README.md                 # Documentación técnica
```

---

## 📋 Módulos y Funcionalidades

### 1. 🍽️ Terminal de Mesero (POS Táctil)
- **Gestión visual de mesas:** Estados en tiempo real (*Libre*, *Ocupada*, *Esperando Pago*).
- **Toma ágil de pedidos:** Navegación por categorías (Entradas, Fondos, Bebidas, Postres) con notas personalizadas para cocina.
- **Notificaciones sonoras y visuales:** Alerta instantánea vía WebSockets cuando cocina marca un pedido como *"LISTO"* o en preparación.
- **Liberación de mesas:** Opción para desocupar mesas una vez concluida la atención.

### 2. 👨‍🍳 Cocina (KDS - Kitchen Display System)
- **Cola de comandas en vivo:** Actualización en tiempo real sin recargar página.
- **Flujo de estados:** *Pendiente* ➔ *Cocinando* ➔ *Listo* ➔ *Entregado*.
- **Alertas de tiempo:** Indicadores de demoras y preparación.

### 3. 📦 Inventario y Kardex (Almacén)
- Control de insumos, stock mínimo y alertas automáticas.
- Registro de movimientos kardex (Entradas, Salidas, Mermas y Ajustes).

---

## 💻 Ejecución Local

### Opción 1: Inicio Rápido (Windows)
Doble clic en el archivo `iniciar-proyecto.bat` para iniciar automáticamente el backend (puerto `3001`) y el frontend (puerto `3000`).

### Opción 2: Inicio Manual

#### 1. Backend (NestJS)
```bash
cd prisma
npm install
# Crear archivo .env basado en .env.example con tu DATABASE_URL
npx prisma generate
npm run start:dev
```
*Backend disponible en:* `http://localhost:3001`

#### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Frontend disponible en:* `http://localhost:3000`

---

## ☁️ Guía de Despliegue en Vercel (Frontend)

Para desplegar la aplicación cliente en **Vercel**:

1. Ingresa a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** ➔ **"Project"**.
3. Selecciona el repositorio **`MartinJGP/BodegaVerde`**.
4. En la sección **Configure Project**:
   - **Root Directory:** Haz clic en *Edit* y selecciona **`frontend`**.
   - **Framework Preset:** Vercel detectará automáticamente **Next.js**.
5. En la sección **Environment Variables**, añade:
   - `NEXT_PUBLIC_API_URL`: URL pública de tu backend (ej. `https://tu-backend.onrender.com`).
   - `NEXT_PUBLIC_WS_URL`: URL pública del WebSocket de tu backend (ej. `https://tu-backend.onrender.com`).
6. Haz clic en **"Deploy"**.

---

## 🛠️ Despliegue del Backend (Render / Railway / VPS)

Dado que el backend utiliza **WebSockets persistentes (Socket.io)** y **Prisma ORM**, se recomienda alojarlo en un servicio con soporte de procesos continuos:

- **Plataformas recomendadas:** [Render](https://render.com), [Railway](https://railway.app), o un VPS (Ubuntu / Docker).
- **Variables requeridas:**
  - `DATABASE_URL`: Cadena de conexión PostgreSQL (Supabase / Neon).
  - `PORT`: `3001` (o la asignada por el proveedor).
  - `JWT_SECRET`: Llave secreta para autenticación.
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:prod`

---

## 📄 Licencia
Proyecto académico — Ciclo 9: Servicios Cloud.
