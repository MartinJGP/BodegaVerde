import { Controller, Post, Get, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { PedidosService } from './pedidos.service.js';
import { PedidosGateway } from './pedidos.gateway.js';
import { EstadoPedido } from '@prisma/client';

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  @Get()
  async findAll(@Query('estado') estado?: EstadoPedido) {
    return this.pedidosService.findAll(estado);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(+id);
  }

  @Post()
  async crearPedido(@Body() dto: any, @Req() req: any) {
    const usuarioId = req.user?.userId || dto.usuarioId || 1;
    const pedido = await this.pedidosService.crearPedido(dto, usuarioId);
    this.pedidosGateway.notificarNuevoPedido(pedido);

    return { 
      success: true, 
      message: 'Comanda registrada exitosamente y stock descontado',
      pedido 
    };
  }

  @Patch(':id/estado')
  async actualizarEstado(
    @Param('id') id: string,
    @Body() body: any
  ) {
    const estado: EstadoPedido = body.estado || body;
    const pedidoActualizado = await this.pedidosService.actualizarEstado(+id, estado);
    this.pedidosGateway.notificarActualizacionEstado(pedidoActualizado);

    return {
      success: true,
      message: `Estado del pedido #${id} actualizado a ${estado}`,
      pedido: pedidoActualizado
    };
  }
}
