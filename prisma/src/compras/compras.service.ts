import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EstadoOrden, EstadoLote, TipoMovimiento } from '@prisma/client';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(estado?: EstadoOrden) {
    return this.prisma.ordenCompra.findMany({
      where: estado ? { estado } : undefined,
      include: {
        proveedor: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        detalles: { include: { insumo: true } }
      },
      orderBy: { fechaEmision: 'desc' }
    });
  }

  async findOne(id: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        detalles: { include: { insumo: true } }
      }
    });
    if (!orden) throw new NotFoundException(`Orden de compra #${id} no encontrada`);
    return orden;
  }

  // RF-10: Elaborar órdenes de compra dirigidas a proveedores
  async crearOrden(dto: any, usuarioId?: number) {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('La orden de compra debe contener al menos un insumo');
    }

    // Resolver usuario válido
    let userValidoId = usuarioId;
    if (userValidoId) {
      const existe = await this.prisma.usuario.findUnique({ where: { id: userValidoId } });
      if (!existe) userValidoId = undefined;
    }
    if (!userValidoId) {
      const admin = await this.prisma.usuario.findFirst({ where: { rol: 'ADMIN' } });
      const primerUsuario = admin || await this.prisma.usuario.findFirst();
      userValidoId = primerUsuario?.id || 1;
    }

    const totalEstimado = dto.detalles.reduce((acc: number, d: any) => {
      return acc + (Number(d.cantidadSolicitada) * Number(d.precioUnitario));
    }, 0);

    return this.prisma.ordenCompra.create({
      data: {
        proveedorId: dto.proveedorId,
        usuarioId: userValidoId,
        estado: EstadoOrden.PENDIENTE,
        totalEstimado,
        detalles: {
          create: dto.detalles.map((d: any) => ({
            insumoId: d.insumoId,
            cantidadSolicitada: d.cantidadSolicitada,
            precioUnitario: d.precioUnitario
          }))
        }
      },
      include: {
        proveedor: true,
        detalles: { include: { insumo: true } }
      }
    });
  }

  // Actualizar estado simple (ej. ENVIADA)
  async actualizarEstado(id: number, estado: EstadoOrden) {
    return this.prisma.ordenCompra.update({
      where: { id },
      data: { estado }
    });
  }

  // RF-11: Registrar recepción de insumos físicos con código de lote y fecha de caducidad
  async recepcionarInsumos(id: number, dto: any, usuarioId?: number) {
    const orden = await this.findOne(id);
    if (orden.estado === EstadoOrden.RECEPCIONADA) {
      throw new BadRequestException(`La orden #${id} ya fue recepcionada anteriormente`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Resolver usuario válido
      let userValidoId = usuarioId;
      if (userValidoId) {
        const existe = await tx.usuario.findUnique({ where: { id: userValidoId } });
        if (!existe) userValidoId = undefined;
      }
      if (!userValidoId) {
        const admin = await tx.usuario.findFirst({ where: { rol: 'ADMIN' } });
        const primerUsuario = admin || await tx.usuario.findFirst();
        userValidoId = primerUsuario?.id || 1;
      }

      // 1. Actualizar orden a RECEPCIONADA
      await tx.ordenCompra.update({
        where: { id },
        data: { estado: EstadoOrden.RECEPCIONADA }
      });

      // 2. Procesar cada lote recibido
      for (const lote of dto.lotes) {
        const insumo = await tx.insumo.findUnique({ where: { id: lote.insumoId } });
        if (!insumo) throw new NotFoundException(`Insumo #${lote.insumoId} no encontrado`);

        const cantidadRecibida = Number(lote.cantidad);

        // Crear registro de lote con fecha de caducidad (RF-11)
        await tx.loteInsumo.create({
          data: {
            insumoId: lote.insumoId,
            codigoLote: lote.codigoLote || `LOT-${Date.now()}-${lote.insumoId}`,
            fechaCaducidad: new Date(lote.fechaCaducidad),
            cantidadIngresada: cantidadRecibida,
            cantidadDisponible: cantidadRecibida,
            estado: EstadoLote.ACTIVO
          }
        });

        // Actualizar stock del insumo
        const stockResultante = Number(insumo.stockActual) + cantidadRecibida;
        await tx.insumo.update({
          where: { id: insumo.id },
          data: { stockActual: stockResultante }
        });

        // Registrar entrada en el Kárdex (RF-17)
        await tx.kardexMovimiento.create({
          data: {
            insumoId: insumo.id,
            usuarioId: userValidoId,
            tipoMovimiento: TipoMovimiento.ENTRADA_COMPRA,
            cantidad: cantidadRecibida,
            stockAnterior: insumo.stockActual,
            stockResultante,
            motivo: `Recepción Orden Compra #${id} (${orden.proveedor.razonSocial}) - Lote ${lote.codigoLote}`
          }
        });
      }

      return tx.ordenCompra.findUnique({
        where: { id },
        include: {
          proveedor: true,
          detalles: { include: { insumo: true } }
        }
      });
    });
  }
}
