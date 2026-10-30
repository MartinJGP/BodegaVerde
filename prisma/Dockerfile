# ==========================================
# Etapa 1: Compilación y dependencias (Builder)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# dependencias necesarias para prisma en alpine linux
RUN apk add --no-cache openssl libc6-compat

# copiar archivos de definicion de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# instalacion de dependencias y generacion del cliente prisma
RUN npm ci
RUN npx prisma generate

# copiar codigo fuente y compilar a javascript
COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Imagen final de ejecucion (Runner)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3001

# copiar solo dependencias de produccion y artefactos compilados
COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

# comando de inicio del backend
CMD ["node", "dist/main"]
