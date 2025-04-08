import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReceitasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.receita.findMany({ orderBy: { criadoEm: 'desc' } });
  }

  findId(id: number) {
    return this.prisma.receita.findUnique({ where: { id }});
  }

  create(data: Prisma.ReceitaCreateInput) {
    return this.prisma.receita.create({ data });
  }

  deleteReceita(id: number) {
    return this.prisma.receita.delete({ where: { id }});
  }

  updateReceita(id: number, data: Prisma.ReceitaUpdateInput) {
    return this.prisma.receita.update({ where: { id }, data, });
  }
}
