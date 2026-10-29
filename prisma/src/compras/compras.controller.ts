import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ComprasService } from './compras.service.js';
import { EstadoOrden } from '@prisma/client';

@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  findAll(@Query('estado') estado?: EstadoOrden) {
    return this.comprasService.findAll(estado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comprasService.findOne(+id);
  }

  @Post()
  crearOrden(@Body() dto: any, @Req() req: any) {
    const usuarioId = req.user?.userId || dto.usuarioId || 1;
    return this.comprasService.crearOrden(dto, usuarioId);
  }

  @Patch(':id/estado')
  actualizarEstado(@Param('id') id: string, @Body('estado') estado: EstadoOrden) {
    return this.comprasService.actualizarEstado(+id, estado);
  }

  @Post(':id/recepcion')
  recepcionarInsumos(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const usuarioId = req.user?.userId || dto.usuarioId || 1;
    return this.comprasService.recepcionarInsumos(+id, dto, usuarioId);
  }
}
