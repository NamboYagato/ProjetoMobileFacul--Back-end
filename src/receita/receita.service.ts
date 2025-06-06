import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReceitaDto } from './dto/create-receita.dto';
import { UpdateReceitaDto } from './dto/update-receita.dto';
import { TipoReceita } from '@prisma/client';
import { contains } from 'class-validator';
import { arrayBuffer } from 'stream/consumers';
import * as sharp from 'sharp';

@Injectable()
export class ReceitaService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, type?: TipoReceita, userId?: number) {
    const receitas = await this.prisma.receita.findMany({
      where: {
        AND: [
          search ? { titulo: { contains: search, mode: 'insensitive' } } : {},
          type ? { tipo: type } : {},
        ],
      },
      include: {
        autor: {
          select: { id: true, nome: true, email: true, criadoEm: true },
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
      orderBy: { criadoEm: 'desc' },
    });
    return receitas.map((r) => ({
      ...r,
      likeCount: r._count.curtidas,
      favoriteCount: r._count.favoritos,
      liked: Array.isArray(r.curtidas) && r.curtidas.length > 0,
      favorited: Array.isArray(r.favoritos) && r.favoritos.length > 0,
    }));
  }

  async findRecipeByUserId(userId: number) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario não encontrado.');
    }
    const userRecipes = await this.prisma.receita.findMany({
      where: {
        autorId: userId,
      },
    });
    return userRecipes ?? [];
  }

  async findAllPublicRecipe(search?: string, type?: TipoReceita) {
    const whereConditions: any = {
      publicada: true,
    };

    if (search) {
      whereConditions.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      whereConditions.tipo = type;
    }

    return this.prisma.receita.findMany({
      where: whereConditions,
      select: {
        id: true,
        titulo: true,
        descricao: true,
        tipo: true,
        autor: {
          select: {
            id: true,
            nome: true,
          },
        },
        imagens: true,
        criadoEm: true,
        atualizadaEm: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });
  }

  async findOne(id: number, userId?: number) {
    const receita = await this.prisma.receita.findUnique({
      where: { id },
      include: {
        autor: {
          select: { id: true, nome: true, email: true, criadoEm: true },
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

  private parseDataUrl(dataUrl: string) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error(
        'Invalid data URL format:',
        dataUrl.substring(0, 50) + '...',
      );
      throw new Error('Invalid data URL format');
    }

    return {
      mime: matches[1],
      buffer: Buffer.from(matches[2], 'base64'),
    };
  }

  async create(data: CreateReceitaDto & { autorId: number }) {
    console.log('Dados recebidos no service:', {
      ...data,
      imagensBase64: data.imagensBase64?.length || 0,
    });

    // ――― converte e comprime cada imagem ―――
    let imagensPrisma: any = [];

    if (data.imagensBase64 && data.imagensBase64.length > 0) {
      console.log('Processando', data.imagensBase64.length, 'imagens...');

      try {
        imagensPrisma = await Promise.all(
          data.imagensBase64.map(async (img, index) => {
            console.log(
              `Processando imagem ${index + 1}:`,
              img.substring(0, 50) + '...',
            );

            const { mime, buffer } = this.parseDataUrl(img);
            console.log(
              `Imagem ${index + 1} - Tipo: ${mime}, Tamanho buffer: ${buffer.length}`,
            );

            const resized = await sharp(buffer)
              .resize({ width: 800, withoutEnlargement: true })
              .jpeg({ quality: 80 })
              .toBuffer();

            console.log(
              `Imagem ${index + 1} redimensionada - Novo tamanho: ${resized.length}`,
            );

            return {
              contentType: mime,
              dataBase64: `data:${mime};base64,${resized.toString('base64')}`,
            };
          }),
        );

        console.log(
          'Todas as imagens processadas com sucesso:',
          imagensPrisma.length,
        );
      } catch (error) {
        console.error('Erro ao processar imagens:', error);
        throw new Error(`Erro ao processar imagens: ${error.message}`);
      }
    } else {
      console.log('Nenhuma imagem para processar');
    }

    console.log('Criando receita no banco com:', {
      titulo: data.titulo,
      descricao: data.descricao || '',
      tipo: data.tipo,
      publicada: data.publicada ?? false,
      autorId: data.autorId,
      imagensCount: imagensPrisma.length,
      ingredientesCount: data.ingredientes.length,
      passosCount: data.passo_a_passo.length,
    });

    const receita = await this.prisma.receita.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipo: data.tipo,
        publicada: data.publicada ?? false,
        autor: { connect: { id: data.autorId } },
        ...(imagensPrisma.length > 0 && {
          imagens: { create: imagensPrisma },
        }),
        ingredientes: { create: data.ingredientes },
        passo_a_passo: { create: data.passo_a_passo },
      },
      include: {
        autor: true,
        imagens: true,
        ingredientes: true,
        passo_a_passo: true,
      },
    });

    console.log('Receita criada com sucesso:', {
      id: receita.id,
      titulo: receita.titulo,
      imagensCount: receita.imagens.length,
      ingredientesCount: receita.ingredientes.length,
      passosCount: receita.passo_a_passo.length,
    });

    return receita;
  }

  async update(
    id: number,
    data: UpdateReceitaDto,
    userId: number,
    imagens: Express.Multer.File[],
  ) {
    const receita = await this.prisma.receita.findUnique({ where: { id } });
    if (!receita) throw new NotFoundException('Receita não encontrada.');
    if (receita.autorId !== userId)
      throw new ForbiddenException('Você não pode editar esta receita.');

    const updateData: any = {};
    if (data.titulo) updateData.titulo = data.titulo;
    if (data.descricao) updateData.descricao = data.descricao;
    if (data.tipo) updateData.tipo = data.tipo;
    if (typeof data.publicada !== 'undefined')
      updateData.publicada = data.publicada;

    if (imagens && imagens.length > 0) {
      await this.prisma.imagem.deleteMany({ where: { receitaId: id } });
      const imagensPrisma = await Promise.all(
        imagens.map(async (file) => {
          const bufferComprimido = await sharp(file.buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

          const base64 = bufferComprimido.toString('base64');
          const dataUri = `data:image/jpeg;base64,${base64}`;

          return {
            contentType: 'image/jpeg',
            dataBase64: dataUri,
          };
        }),
      );
      updateData.imagens = { create: imagensPrisma };
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
    if (receita.autorId !== userId)
      throw new ForbiddenException('Você não pode apagar esta receita.');
    return await this.prisma.receita.delete({
      where: { id },
    });
  }

  // Func para verificar se o usuário já curtiu a receita
  async hasLiked(receitaId: number, userId: number) {
    const existing = await this.prisma.curtida.findUnique({
      where: {
        usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId },
      },
    });
    return !!existing;
  }

  // Func que utiliza a "hasLiked" para dar toggle na curtida
  async toggleLike(receitaId: number, userId: number) {
    const liked = await this.hasLiked(receitaId, userId);
    if (liked) {
      await this.prisma.curtida.delete({
        where: {
          usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId },
        },
      });
      return { liked: false };
    } else {
      await this.prisma.curtida.create({
        data: { receitaId, usuarioId: userId },
      });
      return { liked: true };
    }
  }

  // Func para verificar se o usuário já favoritou a receita
  async hasFavorited(receitaId: number, userId: number) {
    const existing = await this.prisma.favorito.findUnique({
      where: {
        usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId },
      },
    });
    return !!existing;
  }

  // Func que utiliza a "hasFavorited" para dar toggle no favorito
  async toggleFavorite(receitaId: number, userId: number) {
    const favorited = await this.hasFavorited(receitaId, userId);
    if (favorited) {
      await this.prisma.favorito.delete({
        where: {
          usuarioId_receitaId: { usuarioId: userId, receitaId: receitaId },
        },
      });
      return { favorited: false };
    } else {
      await this.prisma.favorito.create({
        data: { receitaId, usuarioId: userId },
      });
      return { favorited: true };
    }
  }
}
