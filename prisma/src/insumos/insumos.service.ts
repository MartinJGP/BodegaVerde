import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TipoMovimiento, EstadoLote } from '@prisma/client';

@Injectable()
export class InsumosService {
  constructor(private readonly prisma: PrismaService) {}

  // Listar todos los insumos del inventario
  findAll() {
    return this.prisma.insumo.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        lotes: {
          where: { estado: EstadoLote.ACTIVO },
          orderBy: { fechaCaducidad: 'asc' }
        }
      }
    });
  }

  // Obtener un insumo específico
  async findOne(id: number) {
    const insumo = await this.prisma.insumo.findUnique({
      where: { id },
      include: {
        lotes: true,
        recetas: { include: { plato: true } }
      }
    });
    if (!insumo) throw new NotFoundException(`Insumo #${id} no encontrado`);
    return insumo;
  }

  // Crear un nuevo insumo
  create(data: any) {
    return this.prisma.insumo.create({
      data: {
        nombre: data.nombre,
        unidadMedida: data.unidadMedida,
        stockActual: data.stockActual ?? 0,
        stockMinimo: data.stockMinimo,
        costoPromedio: data.costoPromedio ?? 0
      }
    });
  }

  // Actualizar un insumo
  update(id: number, data: any) {
    return this.prisma.insumo.update({
      where: { id },
      data
    });
  }

  // RF-17: Historial de Kárdex por insumo
  getKardex(insumoId: number) {
    return this.prisma.kardexMovimiento.findMany({
      where: { insumoId },
      orderBy: { fechaRegistro: 'desc' },
      include: {
        usuario: { select: { id: true, nombre: true, rol: true } },
        insumo: true
      }
    });
  }

  // RF-17: Historial global de movimientos de Kárdex
  getKardexGlobal() {
    return this.prisma.kardexMovimiento.findMany({
      orderBy: { fechaRegistro: 'desc' },
      include: {
        insumo: true,
        usuario: { select: { id: true, nombre: true, rol: true } }
      },
      take: 100
    });
  }

  // RF-12: Alertas automáticas de stock mínimo
  async getAlertasStockMinimo() {
    const insumos = await this.prisma.insumo.findMany({
      orderBy: { nombre: 'asc' }
    });
    return insumos.filter(i => Number(i.stockActual) <= Number(i.stockMinimo));
  }

  // RF-13: Alertas tempranas de insumos próximos a caducar
  async getAlertasPorVencer(diasLimite: number = 7) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasLimite);

    return this.prisma.loteInsumo.findMany({
      where: {
        estado: EstadoLote.ACTIVO,
        fechaCaducidad: { lte: fechaLimite }
      },
      include: { insumo: true },
      orderBy: { fechaCaducidad: 'asc' }
    });
  }

  // RF-14: Registro y justificación de mermas y productos en mal estado
  async registrarMerma(insumoId: number, dto: { cantidad: number; motivo: string; usuarioId?: number }) {
    if (!dto.motivo || dto.motivo.trim() === '') {
      throw new BadRequestException('El motivo de la merma es obligatorio');
    }

    return this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id: insumoId } });
      if (!insumo) throw new NotFoundException(`Insumo #${insumoId} no encontrado`);

      const cantidadMerma = Number(dto.cantidad);
      if (Number(insumo.stockActual) < cantidadMerma) {
        throw new BadRequestException(`No se puede registrar merma mayor al stock disponible (${insumo.stockActual})`);
      }

      // Validar usuario
      let userValidoId = dto.usuarioId;
      if (userValidoId) {
        const existe = await tx.usuario.findUnique({ where: { id: userValidoId } });
        if (!existe) userValidoId = undefined;
      }
      if (!userValidoId) {
        const admin = await tx.usuario.findFirst({ where: { rol: 'ADMIN' } });
        const primerUsuario = admin || await tx.usuario.findFirst();
        userValidoId = primerUsuario?.id || 1;
      }

      const stockResultante = Number(insumo.stockActual) - cantidadMerma;

      await tx.insumo.update({
        where: { id: insumoId },
        data: { stockActual: stockResultante }
      });

      return tx.kardexMovimiento.create({
        data: {
          insumoId,
          usuarioId: userValidoId,
          tipoMovimiento: TipoMovimiento.MERMA,
          cantidad: cantidadMerma,
          stockAnterior: insumo.stockActual,
          stockResultante,
          motivo: `[MERMA] ${dto.motivo}`
        },
        include: { insumo: true }
      });
    });
  }

  // RF-15: Ajuste manual de inventario derivado de conteo físico
  async ajustarStock(insumoId: number, dto: { cantidad: number; motivo: string; usuarioId?: number }) {
    return this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id: insumoId } });
      if (!insumo) throw new NotFoundException(`Insumo #${insumoId} no encontrado`);

      // Validar usuario
      let userValidoId = dto.usuarioId;
      if (userValidoId) {
        const existe = await tx.usuario.findUnique({ where: { id: userValidoId } });
        if (!existe) userValidoId = undefined;
      }
      if (!userValidoId) {
        const admin = await tx.usuario.findFirst({ where: { rol: 'ADMIN' } });
        const primerUsuario = admin || await tx.usuario.findFirst();
        userValidoId = primerUsuario?.id || 1;
      }

      const stockResultante = Number(insumo.stockActual) + Number(dto.cantidad);

      await tx.insumo.update({
        where: { id: insumoId },
        data: { stockActual: stockResultante }
      });

      return tx.kardexMovimiento.create({
        data: {
          insumoId,
          usuarioId: userValidoId,
          tipoMovimiento: TipoMovimiento.AJUSTE_FISICO,
          cantidad: dto.cantidad,
          stockAnterior: insumo.stockActual,
          stockResultante,
          motivo: `[AJUSTE AUDITORÍA] ${dto.motivo || 'Cuadre físico'}`
        },
        include: { insumo: true }
      });
    });
  }
}