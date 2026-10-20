import { Module } from '@nestjs/common';
import { MesasController } from './mesas.controller.js';
import { MesasService } from './mesas.service.js';
import { PedidosModule } from '../pedidos/pedidos.module.js';

@Module({
  imports: [PedidosModule],
  controllers: [MesasController],
  providers: [MesasService],
  exports: [MesasService],
})
export class MesasModule {}