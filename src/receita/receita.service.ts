import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { TipoReceita } from '@prisma/client';
import { contains } from 'class-validator';

@Injectable()
export class ReceitaService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, type?: TipoReceita, userId?: number) {
    const receitas = await this.prisma.receita.findMany({
      where: {
        AND: [ search ? { titulo: { contains: search, mode: 'insensitive'} } : {}, type ? { tipo: type } : {}, ],
      },
      include: {
        autor: {
          select: { id: true, nome: true, email: true, criadoEm: true}
        },
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
        _count: {
          select: { curtidas: true, favoritos: true},
        },
        curtidas: userId ? { where: { usuarioId: userId } } : false,
        favoritos: userId ? { where: { usuarioId: userId } } : false,
      },
      orderBy: { criadoEm: 'desc' },
    });
    return receitas.map(r => ({
      ...r,
      likeCount: r._count.curtidas,
      favoriteCount: r._count.favoritos,
      liked: Array.isArray(r.curtidas) && r.curtidas.length > 0,
      favorited: Array.isArray(r.favoritos) && r.favoritos.length > 0
    }));
  }

  async findOne(id: number, userId?: number) {
    const receita = await this.prisma.receita.findUnique({
      where: { id },
      include: {
        autor: {
          select: { id: true, nome: true, email: true, criadoEm: true}
        },
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
        _count: {
          select: { curtidas: true, favoritos: true },
        },
        curtidas: userId ? { where: { usuarioId: userId } } : false,
        favoritos: userId ? { where: { usuarioId: userId } } : false,
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

  async update(id: number, data: UpdateReceitaDto, userId: number,) {
    const receita = await this.prisma.receita.findUnique({ where: { id } });
    if (!receita) throw new NotFoundException('Receita não encontrada.');
    if (receita.autorId !== userId) throw new ForbiddenException('Você não pode editar esta receita.');

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
        autor: true,
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
      },
    });
  }

  async delete(id: number, userId: number) {
    const receita = await this.prisma.receita.findUnique({ where: { id } });
    if (!receita) throw new NotFoundException('Receita não encontrada.');
    if (receita.autorId !== userId) throw new ForbiddenException('Você não pode apagar esta receita.');
    return await this.prisma.receita.delete({
        where: { id },
    });
  }
  
  // Func para verificar se o usuário já curtiu a receita
  async hasLiked(receitaId: number, userId: number) {
    const existing = await this.prisma.curtida.findUnique({
      where: { usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId } }
    });
    return !!existing;
  }

  // Func que utiliza a "hasLiked" para dar toggle na curtida
  async toggleLike(receitaId: number, userId: number) {
    const liked = await this.hasLiked(receitaId, userId);
    if (liked) {
      await this.prisma.curtida.delete({
        where: { usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId } }
      });
      return { liked: false };
    } else {
      await this.prisma.curtida.create({
        data: { receitaId, usuarioId: userId }
      });
      return { liked: true };
    }
  }

  // Func para verificar se o usuário já favoritou a receita
  async hasFavorited(receitaId: number, userId: number) {
    const existing = await this.prisma.favorito.findUnique({
      where: { usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId } }
    });
    return !!existing;
  }

  // Func que utiliza a "hasFavorited" para dar toggle no favorito
  async toggleFavorite(receitaId: number, userId: number) {
    const favorited = await this.hasFavorited(receitaId, userId);
    if (favorited) {
      await this.prisma.favorito.delete({
        where: { usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId } }
      });
      return { favorited: false };
    } else {
      await this.prisma.favorito.create({
        data: { receitaId, usuarioId: userId }
      });
      return { favorited: true };
    }
  }
} 
