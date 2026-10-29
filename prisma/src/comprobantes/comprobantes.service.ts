import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PedidosGateway } from '../pedidos/pedidos.gateway.js';
import { TipoComprobante, EstadoComprobante, MetodoPago, EstadoPedido, EstadoMesa } from '@prisma/client';

export interface CreatePagoInput {
  metodoPago: MetodoPago;
  monto: number;
  montoRecibido?: number;
  vuelto?: number;
  referencia?: string;
}

export interface CreateComprobanteInput {
  pedidoId: number;
  cajeroId?: number;
  tipo: TipoComprobante;
  clienteNombre?: string;
  clienteDocumento?: string;
  pagos: CreatePagoInput[];
}

@Injectable()
export class ComprobantesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  // Listar todos los comprobantes emitidos (para auditoría y arqueo de caja)
  async findAll() {
    return this.prisma.comprobante.findMany({
      include: {
        pedido: {
          include: {
            mesa: true,
            detalles: { include: { plato: true } },
          },
        },
        cajero: { select: { id: true, nombre: true, email: true, rol: true } },
        pagos: true,
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  // Obtener un comprobante por ID
  async findOne(id: number) {
    const comp = await this.prisma.comprobante.findUnique({
      where: { id },
      include: {
        pedido: {
          include: {
            mesa: true,
            detalles: { include: { plato: true } },
          },
        },
        cajero: { select: { id: true, nombre: true, email: true, rol: true } },
        pagos: true,
      },
    });

    if (!comp) {
      throw new NotFoundException(`Comprobante #${id} no encontrado`);
    }

    return comp;
  }

  // Resumen del día para arqueo de caja (RF-13)
  async getResumenDiario() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const comprobantesHoy = await this.prisma.comprobante.findMany({
      where: {
        fechaEmision: { gte: hoy },
        estado: EstadoComprobante.EMITIDO,
      },
      include: { pagos: true },
    });

    let totalRecaudado = 0;
    let totalBoletas = 0;
    let totalFacturas = 0;
    const desgloseMetodos: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      YAPE: 0,
      PLIN: 0,
    };

    for (const c of comprobantesHoy) {
      const monto = Number(c.total);
      totalRecaudado += monto;
      if (c.tipo === TipoComprobante.BOLETA) totalBoletas++;
      if (c.tipo === TipoComprobante.FACTURA) totalFacturas++;

      for (const p of c.pagos) {
        const pMonto = Number(p.monto);
        desgloseMetodos[p.metodoPago] = (desgloseMetodos[p.metodoPago] || 0) + pMonto;
      }
    }

    return {
      fecha: new Date().toISOString().split('T')[0],
      totalComprobantes: comprobantesHoy.length,
      totalBoletas,
      totalFacturas,
      totalRecaudado: Number(totalRecaudado.toFixed(2)),
      desgloseMetodos,
    };
  }

  // Emitir comprobante, registrar pagos y liberar mesa (RF-11, RF-12, RF-14)
  async emitirComprobante(dto: CreateComprobanteInput) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validar existencia del pedido
      const pedido = await tx.pedido.findUnique({
        where: { id: dto.pedidoId },
        include: { mesa: true, comprobante: true },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido #${dto.pedidoId} no encontrado`);
      }

      if (pedido.comprobante) {
        throw new BadRequestException(
          `El pedido #${dto.pedidoId} ya tiene un comprobante emitido (${pedido.comprobante.serie}-${pedido.comprobante.numeroCorrelativo})`
        );
      }

      if (pedido.estado === EstadoPedido.PAGADO) {
        throw new BadRequestException(`El pedido #${dto.pedidoId} ya se encuentra pagado`);
      }

      // 2. Validar o asignar Cajero
      let cajeroId = dto.cajeroId;
      if (cajeroId) {
        const existe = await tx.usuario.findUnique({ where: { id: cajeroId } });
        if (!existe) cajeroId = undefined;
      }
      if (!cajeroId) {
        const cajeroUser = await tx.usuario.findFirst({ where: { rol: 'CAJERO' } });
        const adminUser = await tx.usuario.findFirst({ where: { rol: 'ADMIN' } });
        cajeroId = cajeroUser?.id || adminUser?.id || 1;
      }

      // 3. Cálculos tributarios (SUNAT 18% IGV)
      const total = Number(pedido.total);
      const subtotal = Number((total / 1.18).toFixed(2));
      const igv = Number((total - subtotal).toFixed(2));

      // 4. Calcular correlativo incremental por tipo
      const serie = dto.tipo === TipoComprobante.FACTURA ? 'F001' : 'B001';
      const ultimo = await tx.comprobante.findFirst({
        where: { tipo: dto.tipo, serie },
        orderBy: { numeroCorrelativo: 'desc' },
      });
      const numeroCorrelativo = ultimo ? ultimo.numeroCorrelativo + 1 : 1;

      // 5. Crear el comprobante
      const comprobante = await tx.comprobante.create({
        data: {
          pedidoId: pedido.id,
          cajeroId,
          tipo: dto.tipo,
          serie,
          numeroCorrelativo,
          clienteNombre: dto.clienteNombre?.trim() || (dto.tipo === TipoComprobante.BOLETA ? 'Clientes Varios' : 'Cliente Empresa'),
          clienteDocumento: dto.clienteDocumento?.trim() || null,
          subtotal,
          igv,
          total,
          estado: EstadoComprobante.EMITIDO,
          pagos: {
            create: dto.pagos.map((p) => ({
              metodoPago: p.metodoPago,
              monto: p.monto,
              montoRecibido: p.montoRecibido || null,
              vuelto: p.vuelto || null,
              referencia: p.referencia || null,
            })),
          },
        },
        include: {
          pagos: true,
          cajero: { select: { id: true, nombre: true, email: true } },
        },
      });

      // 6. Marcar Pedido como PAGADO y registrar fecha de cierre
      const pedidoActualizado = await tx.pedido.update({
        where: { id: pedido.id },
        data: {
          estado: EstadoPedido.PAGADO,
          fechaCierre: new Date(),
        },
        include: { mesa: true },
      });

      // 7. Liberar la mesa si no hay otros pedidos abiertos en ella (RF-14)
      const otrosPedidosAbiertos = await tx.pedido.count({
        where: {
          mesaId: pedido.mesaId,
          estado: { notIn: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO] },
          id: { not: pedido.id },
        },
      });

      let mesaLiberada = null;
      if (otrosPedidosAbiertos === 0) {
        mesaLiberada = await tx.mesa.update({
          where: { id: pedido.mesaId },
          data: { estado: EstadoMesa.DISPONIBLE },
        });
      }

      // 8. Emitir notificaciones WebSocket en tiempo real
      this.pedidosGateway.notificarActualizacionEstado(pedidoActualizado);
      if (mesaLiberada) {
        this.pedidosGateway.notificarMesaActualizada(mesaLiberada);
      }

      return {
        success: true,
        message: `${dto.tipo === TipoComprobante.FACTURA ? 'Factura' : 'Boleta'} ${serie}-${String(numeroCorrelativo).padStart(6, '0')} emitida exitosamente`,
        comprobante,
        pedido: pedidoActualizado,
        mesaLiberada,
      };
    });
  }
}
