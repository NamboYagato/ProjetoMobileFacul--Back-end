import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';

@Injectable()
export class ReceitaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.receita.findMany({
      include: {
        autor: true,
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: number) {
    const receita = await this.prisma.receita.findUnique({
      where: { id },
      include: {
        autor: true,
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
      },
    });

    if (!receita) {
      throw new NotFoundException(`Receita com id ${id} não encontrada.`);
    }

    return receita;
  }

  async create(data: CreateReceitaDto & { autorId: number }) {
    return await this.prisma.receita.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        publicada: data.publicada ?? false,
        autor: { connect: { id: data.autorId } },
        imagens: {
          create: data.imagens,
        },
        ingredientes: {
          create: data.ingredientes,
        },
        passo_a_passo: {
          create: data.passo_a_passo,
        },
      },
      include: {
        autor: true,
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
      },
    });
  }

  async update(id: number, data: UpdateReceitaDto) {
    const updateData: any = {};

    if (data.titulo) updateData.titulo = data.titulo;
    if (data.descricao) updateData.descricao = data.descricao;
    if (data.tipo) updateData.tipo = data.tipo;
    if (typeof data.publicada !== 'undefined') updateData.publicada = data.publicada;

    if (data.imagens) {
      await this.prisma.imagem.deleteMany({ where: { receitaId: id } });
      updateData.imagens = { create: data.imagens };
    }

    if (data.ingredientes) {
      await this.prisma.ingrediente.deleteMany({ where: { receitaId: id } });
      updateData.ingredientes = { create: data.ingredientes };
    }

    if (data.passo_a_passo) {
      await this.prisma.preparo.deleteMany({ where: { receitaId: id } });
      updateData.passo_a_passo = { create: data.passo_a_passo };
    }

    return await this.prisma.receita.update({
      where: { id },
      data: updateData,
      include: {
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
      },
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return await this.prisma.receita.delete({
        where: { id },
    });
  }
} 
