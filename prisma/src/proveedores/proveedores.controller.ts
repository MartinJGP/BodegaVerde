import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service.js';

@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Get()
  findAll() {
    return this.proveedoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proveedoresService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.proveedoresService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.proveedoresService.update(+id, data);
  }
}
