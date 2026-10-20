import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.proveedor.findMany({
      orderBy: { razonSocial: 'asc' },
      include: { ordenes: true }
    });
  }

  async findOne(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: { ordenes: true }
    });
    if (!proveedor) throw new NotFoundException(`Proveedor #${id} no encontrado`);
    return proveedor;
  }

  create(data: any) {
    return this.prisma.proveedor.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.proveedor.update({ where: { id }, data });
  }
}
