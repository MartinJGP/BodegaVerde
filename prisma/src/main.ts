import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir conexión desde el frontend (Vercel, localhost y tablets)
  app.enableCors({
    origin: true, // Refleja dinámicamente el origen de la petición (Vercel, local) evitando bloqueos de credenciales
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Servidor backend La Bodega Verde corriendo en http://localhost:${port}`);
}
await bootstrap();
