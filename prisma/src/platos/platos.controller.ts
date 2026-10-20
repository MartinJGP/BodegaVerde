import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { PlatosService } from './platos.service.js';

@Controller('platos')
export class PlatosController {
  constructor(private readonly platosService: PlatosService) {}

  @Get()
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.platosService.findAll(soloActivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.platosService.findOne(+id);
  }

  // RF-02 y RF-03: Validar disponibilidad de insumos
  @Get(':id/disponibilidad')
  verificarDisponibilidad(@Param('id') id: string) {
    return this.platosService.verificarDisponibilidad(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.platosService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.platosService.update(+id, data);
  }

  // RF-16: Configurar ficha técnica / receta de un plato
  @Post(':id/receta')
  configurarReceta(
    @Param('id') id: string,
    @Body('ingredientes') ingredientes: { insumoId: number; cantidadRequerida: number }[]
  ) {
    return this.platosService.configurarReceta(+id, ingredientes);
  }
}