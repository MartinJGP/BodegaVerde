import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EstadoPedido, TipoMovimiento, EstadoMesa } from '@prisma/client';

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  // Listar pedidos activos con filtro opcional por estado
  async findAll(estado?: EstadoPedido) {
    return this.prisma.pedido.findMany({
      where: estado ? { estado } : undefined,
      include: {
        mesa: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        detalles: {
          include: { plato: true }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });
  }

  // Obtener un pedido específico por ID
  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        mesa: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        detalles: {
          include: { plato: true }
        }
      }
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }

    return pedido;
  }

  // transaccion atomica para comanda y descuento de stock
  async crearPedido(dto: any, usuarioId?: number) {
    return this.prisma.$transaction(async (tx) => {
      let userValidoId = usuarioId;
      if (userValidoId) {
        const existe = await tx.usuario.findUnique({ where: { id: userValidoId } });
        if (!existe) userValidoId = undefined;
      }

      if (!userValidoId) {
        const mesero = await tx.usuario.findFirst({ where: { rol: 'MESERO' } });
        const primerUsuario = mesero || await tx.usuario.findFirst();
        if (!primerUsuario) {
          throw new BadRequestException('No hay usuarios registrados en el sistema');
        }
        userValidoId = primerUsuario.id;
      }

      const pedido = await tx.pedido.create({
        data: {
          mesaId: dto.mesaId,
          usuarioId: userValidoId,
          estado: EstadoPedido.PENDIENTE,
          total: dto.total,
          detalles: {
            create: dto.detalles.map((d: any) => ({
              platoId: d.platoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
              notasPersonalizadas: d.notas || null,
            }))
          }
        },
        include: {
          detalles: { include: { plato: true } },
          mesa: true,
          usuario: { select: { id: true, nombre: true, rol: true } }
        }
      });

      await tx.mesa.update({
        where: { id: dto.mesaId },
        data: { estado: EstadoMesa.OCUPADA }
      });

      // deduccion de insumos por receta
      for (const detalle of dto.detalles) {
        const receta = await tx.recetaDetalle.findMany({
          where: { platoId: detalle.platoId }
        });

        for (const ingrediente of receta) {
          const cantRequerida = Number(ingrediente.cantidadRequerida) * detalle.cantidad;
          
          const insumo = await tx.insumo.findUnique({
            where: { id: ingrediente.insumoId }
          });

          if (!insumo || Number(insumo.stockActual) < cantRequerida) {
            throw new BadRequestException(
              `Stock insuficiente para el insumo #${ingrediente.insumoId} (${insumo?.nombre || 'desconocido'}). Se requieren ${cantRequerida} ${insumo?.unidadMedida || ''}, disponible: ${insumo?.stockActual || 0}`
            );
          }

          const stockResultante = Number(insumo.stockActual) - cantRequerida;
          await tx.insumo.update({
            where: { id: insumo.id },
            data: { stockActual: stockResultante }
          });

          await tx.kardexMovimiento.create({
            data: {
              insumoId: insumo.id,
              usuarioId: userValidoId,
              tipoMovimiento: TipoMovimiento.SALIDA_VENTA,
              cantidad: cantRequerida,
              stockAnterior: insumo.stockActual,
              stockResultante,
              motivo: `Venta comanda #${pedido.id} (Mesa ${pedido.mesa.numero})`
            }
          });
        }
      }

      return pedido;
    });
  }

  // actualizacion de estado del pedido
  async actualizarEstado(id: number, nuevoEstado: EstadoPedido) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }

    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id },
      data: { estado: nuevoEstado },
      include: {
        mesa: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        detalles: { include: { plato: true } }
      }
    });

    // Si el pedido se entrega o finaliza, gestionar estado de la mesa
    if (nuevoEstado === EstadoPedido.CANCELADO || nuevoEstado === EstadoPedido.ENTREGADO) {
      // Verificar si hay otros pedidos pendientes en la mesa
      const otrosPedidos = await this.prisma.pedido.count({
        where: {
          mesaId: pedido.mesaId,
          estado: { notIn: [EstadoPedido.CANCELADO, EstadoPedido.ENTREGADO] },
          id: { not: id }
        }
      });
      if (otrosPedidos === 0 && nuevoEstado === EstadoPedido.CANCELADO) {
        await this.prisma.mesa.update({
          where: { id: pedido.mesaId },
          data: { estado: EstadoMesa.DISPONIBLE }
        });
      }
    }

    return pedidoActualizado;
  }
}
