import { Module } from '@nestjs/common';
import { ComprobantesService } from './comprobantes.service.js';
import { ComprobantesController } from './comprobantes.controller.js';
import { PedidosModule } from '../pedidos/pedidos.module.js';

@Module({
  imports: [PedidosModule],
  controllers: [ComprobantesController],
  providers: [ComprobantesService],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}
