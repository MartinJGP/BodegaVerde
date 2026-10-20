import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.categoria.findMany({
      include: { platos: true },
      orderBy: { nombre: 'asc' }
    });
  }

  findOne(id: number) {
    return this.prisma.categoria.findUnique({
      where: { id },
      include: { platos: true }
    });
  }

  create(data: any) {
    return this.prisma.categoria.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.categoria.update({ where: { id }, data });
  }
}
