import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service.js';
import { PedidosGateway } from './pedidos.gateway.js';
import { PedidosController } from './pedidos.controller.js';

@Module({
  controllers: [PedidosController],
  providers: [PedidosService, PedidosGateway],
  exports: [PedidosService, PedidosGateway],
})
export class PedidosModule {}
