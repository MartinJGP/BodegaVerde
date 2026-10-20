import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'online',
      proyecto: 'Sistema Web La Bodega Verde',
      descripcion: 'API REST y WebSockets para gestión de pedidos y control de inventario',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }
}
