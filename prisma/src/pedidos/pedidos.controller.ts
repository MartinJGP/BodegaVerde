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
    // Si viene autenticado por JWT usa req.user.userId, si no, acepta dto.usuarioId o usa 1 por defecto
    const usuarioId = req.user?.userId || dto.usuarioId || 1;
    
    // Crear pedido en BD, validar recetas y descontar stock atómicamente
    const pedido = await this.pedidosService.crearPedido(dto, usuarioId);
    
    // Notificar instantáneamente a la pantalla de cocina (KDS) por WebSockets
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
    
    // Notificar cambio de estado en tiempo real (notifica a meseros si está LISTO)
    this.pedidosGateway.notificarActualizacionEstado(pedidoActualizado);

    return {
      success: true,
      message: `Estado del pedido #${id} actualizado a ${estado}`,
      pedido: pedidoActualizado
    };
  }
}
