import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PlatosService {
  constructor(private readonly prisma: PrismaService) {}

  // Listar todos los platos con su categoría e ingredientes de receta
  findAll(soloActivos?: boolean) {
    return this.prisma.plato.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: {
        categoria: true,
        receta: {
          include: { insumo: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  // Obtener un plato por ID
  async findOne(id: number) {
    const plato = await this.prisma.plato.findUnique({
      where: { id },
      include: {
        categoria: true,
        receta: {
          include: { insumo: true }
        }
      }
    });
    if (!plato) throw new NotFoundException(`Plato #${id} no encontrado`);
    return plato;
  }

  create(data: any) {
    return this.prisma.plato.create({
      data: {
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        precio: data.precio,
        descripcion: data.descripcion || null,
        activo: data.activo ?? true
      }
    });
  }

  update(id: number, data: any) {
    return this.prisma.plato.update({
      where: { id },
      data
    });
  }

  // RF-02 y RF-03: Verificar disponibilidad de platos en tiempo real y auto-bloquear
  async verificarDisponibilidad(id: number) {
    const plato = await this.findOne(id);
    let tieneStockSuficiente = true;
    const insumosFaltantes: any[] = [];

    for (const item of plato.receta) {
      if (Number(item.insumo.stockActual) < Number(item.cantidadRequerida)) {
        tieneStockSuficiente = false;
        insumosFaltantes.push({
          insumo: item.insumo.nombre,
          requerido: item.cantidadRequerida,
          disponible: item.insumo.stockActual
        });
      }
    }

    // Auto-bloqueo en tiempo real si falta algún ingrediente crítico
    if (!tieneStockSuficiente && plato.activo) {
      await this.prisma.plato.update({
        where: { id },
        data: { activo: false }
      });
    }

    return {
      platoId: plato.id,
      nombre: plato.nombre,
      disponible: tieneStockSuficiente,
      insumosFaltantes
    };
  }

  // RF-16: Configurar ficha técnica / receta de un plato
  async configurarReceta(platoId: number, ingredientes: { insumoId: number; cantidadRequerida: number }[]) {
    await this.findOne(platoId);

    return this.prisma.$transaction(async (tx) => {
      // Eliminar receta anterior si existe
      await tx.recetaDetalle.deleteMany({
        where: { platoId }
      });

      // Insertar nuevos ingredientes de la ficha técnica
      await tx.recetaDetalle.createMany({
        data: ingredientes.map(item => ({
          platoId,
          insumoId: item.insumoId,
          cantidadRequerida: item.cantidadRequerida
        }))
      });

      return tx.plato.findUnique({
        where: { id: platoId },
        include: { receta: { include: { insumo: true } } }
      });
    });
  }
}