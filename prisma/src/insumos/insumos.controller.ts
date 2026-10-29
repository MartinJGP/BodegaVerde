import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { InsumosService } from './insumos.service.js';

@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Get()
  findAll() {
    return this.insumosService.findAll();
  }

  @Get('alertas/stock-minimo')
  getAlertasStockMinimo() {
    return this.insumosService.getAlertasStockMinimo();
  }

  @Get('alertas/por-vencer')
  getAlertasPorVencer(@Query('dias') dias?: string) {
    return this.insumosService.getAlertasPorVencer(dias ? +dias : 7);
  }

  @Get('kardex/global')
  getKardexGlobal() {
    return this.insumosService.getKardexGlobal();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insumosService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.insumosService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.insumosService.update(+id, data);
  }

  @Get(':id/kardex')
  getKardex(@Param('id') id: string) {
    return this.insumosService.getKardex(+id);
  }

  @Post(':id/merma')
  registrarMerma(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const usuarioId = req.user?.userId || body.usuarioId || 1;
    return this.insumosService.registrarMerma(+id, {
      cantidad: body.cantidad,
      motivo: body.motivo,
      usuarioId
    });
  }

  @Post(':id/ajuste')
  ajustarStock(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const usuarioId = req.user?.userId || data.usuarioId || 1;
    return this.insumosService.ajustarStock(+id, {
      cantidad: data.cantidad,
      motivo: data.motivo,
      usuarioId
    });
  }
}