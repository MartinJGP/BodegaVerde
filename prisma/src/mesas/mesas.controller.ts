import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { MesasService } from './mesas.service.js';
import { PedidosGateway } from '../pedidos/pedidos.gateway.js';

@Controller('mesas')
export class MesasController {
  constructor(
    private readonly mesasService: MesasService,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  @Get()
  findAll() {
    return this.mesasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mesasService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.mesasService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const mesaActualizada = await this.mesasService.update(+id, data);
    this.pedidosGateway.notificarMesaActualizada(mesaActualizada);
    return mesaActualizada;
  }
}