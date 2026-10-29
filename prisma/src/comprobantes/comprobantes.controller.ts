import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { ComprobantesService } from './comprobantes.service.js';

@Controller('comprobantes')
export class ComprobantesController {
  constructor(private readonly comprobantesService: ComprobantesService) {}

  @Get()
  async findAll() {
    return this.comprobantesService.findAll();
  }

  @Get('resumen/diario')
  async getResumenDiario() {
    return this.comprobantesService.getResumenDiario();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.comprobantesService.findOne(+id);
  }

  @Post()
  async emitirComprobante(@Body() dto: any, @Req() req: any) {
    const cajeroId = req.user?.userId || dto.cajeroId;
    return this.comprobantesService.emitirComprobante({
      ...dto,
      cajeroId,
    });
  }
}
