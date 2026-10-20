import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.mesa.findMany({ orderBy: { numero: 'asc' } });
  }

  async findOne(id: number) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id },
      include: {
        pedidos: {
          where: { estado: { notIn: ['ENTREGADO', 'CANCELADO'] } },
          include: { detalles: { include: { plato: true } } }
        }
      }
    });
    if (!mesa) throw new NotFoundException(`Mesa #${id} no encontrada`);
    return mesa;
  }

  create(data: any) {
    return this.prisma.mesa.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.mesa.update({ where: { id }, data });
  }
}