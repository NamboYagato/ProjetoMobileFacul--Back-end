import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReceitaService {
    constructor(private prisma: PrismaService) {}
    
    findAll() {
        return this.prisma.receita.findMany({
            include: {
                autor: true,
                imagens: true,
                ingredientes: true,
                passo_a_passo: true,
            },
            orderBy: { criadoEm: 'desc'},
        });
    }

    findOne(id: number) {
        return this.prisma.receita.findUnique({
            where: { id },
            include: {
                autor: true,
                imagens: true,
                ingredientes: true,
                passo_a_passo: true,
            },
        });
    }

    create(data: any) {
        return this.prisma.receita.create({
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
        })
    }

    async update(id: number, data: any) {
        await this.prisma.imagem.
    }
}
