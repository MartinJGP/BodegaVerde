const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src');

const files = {
  // MESAS
  'mesas/mesas.module.ts': `import { Module } from '@nestjs/common';\nimport { MesasController } from './mesas.controller';\nimport { MesasService } from './mesas.service';\n\n@Module({ controllers: [MesasController], providers: [MesasService] })\nexport class MesasModule {}`,
  'mesas/mesas.controller.ts': `import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';\nimport { MesasService } from './mesas.service';\n\n@Controller('mesas')\nexport class MesasController {\n  constructor(private readonly mesasService: MesasService) {}\n  @Get() findAll() { return this.mesasService.findAll(); }\n  @Post() create(@Body() data: any) { return this.mesasService.create(data); }\n  @Patch(':id') update(@Param('id') id: string, @Body() data: any) { return this.mesasService.update(+id, data); }\n}`,
  'mesas/mesas.service.ts': `import { Injectable } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\n\n@Injectable()\nexport class MesasService {\n  constructor(private prisma: PrismaService) {}\n  findAll() { return this.prisma.mesa.findMany({ orderBy: { numero: 'asc' } }); }\n  create(data: any) { return this.prisma.mesa.create({ data }); }\n  update(id: number, data: any) { return this.prisma.mesa.update({ where: { id }, data }); }\n}`,

  // PLATOS (con categorias y recetas)
  'platos/platos.module.ts': `import { Module } from '@nestjs/common';\nimport { PlatosController } from './platos.controller';\nimport { PlatosService } from './platos.service';\n\n@Module({ controllers: [PlatosController], providers: [PlatosService] })\nexport class PlatosModule {}`,
  'platos/platos.controller.ts': `import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';\nimport { PlatosService } from './platos.service';\n\n@Controller('platos')\nexport class PlatosController {\n  constructor(private readonly platosService: PlatosService) {}\n  @Get() findAll() { return this.platosService.findAll(); }\n  @Post() create(@Body() data: any) { return this.platosService.create(data); }\n  @Patch(':id') update(@Param('id') id: string, @Body() data: any) { return this.platosService.update(+id, data); }\n}`,
  'platos/platos.service.ts': `import { Injectable } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\n\n@Injectable()\nexport class PlatosService {\n  constructor(private prisma: PrismaService) {}\n  // obtiene todos los platos con su categoria y receta\n  findAll() { return this.prisma.plato.findMany({ include: { categoria: true, receta: { include: { insumo: true } } } }); }\n  create(data: any) { return this.prisma.plato.create({ data }); }\n  update(id: number, data: any) { return this.prisma.plato.update({ where: { id }, data }); }\n}`,

  // INSUMOS E INVENTARIO (con kardex)
  'insumos/insumos.module.ts': `import { Module } from '@nestjs/common';\nimport { InsumosController } from './insumos.controller';\nimport { InsumosService } from './insumos.service';\n\n@Module({ controllers: [InsumosController], providers: [InsumosService] })\nexport class InsumosModule {}`,
  'insumos/insumos.controller.ts': `import { Controller, Get, Post, Body, Param } from '@nestjs/common';\nimport { InsumosService } from './insumos.service';\n\n@Controller('insumos')\nexport class InsumosController {\n  constructor(private readonly insumosService: InsumosService) {}\n  @Get() findAll() { return this.insumosService.findAll(); }\n  @Get(':id/kardex') getKardex(@Param('id') id: string) { return this.insumosService.getKardex(+id); }\n  @Post(':id/ajuste') ajustarStock(@Param('id') id: string, @Body() data: any) { return this.insumosService.ajustarStock(+id, data); }\n}`,
  'insumos/insumos.service.ts': `import { Injectable } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport { TipoMovimiento } from '@prisma/client';\n\n@Injectable()\nexport class InsumosService {\n  constructor(private prisma: PrismaService) {}\n  findAll() { return this.prisma.insumo.findMany(); }\n  \n  // obtiene el historial completo del kardex\n  getKardex(insumoId: number) { \n    return this.prisma.kardexMovimiento.findMany({ \n      where: { insumoId }, \n      orderBy: { fechaRegistro: 'desc' },\n      include: { usuario: { select: { nombre: true, rol: true } } }\n    }); \n  }\n\n  // ajuste manual de inventario (auditoria)\n  ajustarStock(insumoId: number, dto: { cantidad: number, motivo: string, usuarioId: number }) {\n    return this.prisma.$transaction(async (tx) => {\n      const insumo = await tx.insumo.findUnique({ where: { id: insumoId } });\n      const stockResultante = Number(insumo.stockActual) + dto.cantidad;\n      \n      await tx.insumo.update({ where: { id: insumoId }, data: { stockActual: stockResultante } });\n      \n      return tx.kardexMovimiento.create({\n        data: {\n          insumoId,\n          usuarioId: dto.usuarioId,\n          tipoMovimiento: TipoMovimiento.AJUSTE_FISICO,\n          cantidad: dto.cantidad,\n          stockAnterior: insumo.stockActual,\n          stockResultante,\n          motivo: dto.motivo\n        }\n      });\n    });\n  }\n}`
};

Object.keys(files).forEach(filePath => {
  const fullPath = path.join(basePath, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[filePath]);
});

// Actualizar app.module.ts
const appModulePath = path.join(basePath, 'app.module.ts');
let appModuleContent = `import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { MesasModule } from './mesas/mesas.module';
import { PlatosModule } from './platos/platos.module';
import { InsumosModule } from './insumos/insumos.module';

@Module({
  imports: [
    PrismaModule, 
    PedidosModule,
    MesasModule,
    PlatosModule,
    InsumosModule
  ]
})
export class AppModule {}`;
fs.writeFileSync(appModulePath, appModuleContent);

console.log('Modulos creados exitosamente!');
