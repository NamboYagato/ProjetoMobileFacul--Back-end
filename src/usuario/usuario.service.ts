import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUsuarioDto) {
    return await this.prisma.usuario.create({
      data,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com id ${id} não encontrado.`);
    }

    return usuario;
  }

  async findByEmail(email: string) {
    return await this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async update(id: number, data: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);

    const updateData: any = {
      nome: data.nome ?? usuario.nome,
      email: data.email ?? usuario.email,
    };

    if (data.novaSenha) {
      if (data.novaSenha !== data.confirmarNovaSenha) {
        throw new Error('A confirmação da nova senha não confere.');
      }
      updateData.senha = data.novaSenha;
    }

    return await this.prisma.usuario.update({
      where: { id },
      data: updateData,
    });
  }
}
