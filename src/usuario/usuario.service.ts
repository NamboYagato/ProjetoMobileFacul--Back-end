import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Usuario } from '@prisma/client';

@Injectable()
export class UsuarioService {
  private readonly BCRYPT_SALT_ROUNDS = 10;
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUsuarioDto): Promise<Usuario> {
    return await this.prisma.usuario.create({
      data,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    // if (!usuario) {
    //   throw new NotFoundException(`Usuário com id ${id} não encontrado.`);
    // }

    return usuario;
  }

  async findByEmail(email: string) {
    return await this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async update(id: number, data: Prisma.UsuarioUpdateInput): Promise<Usuario> {
    const userExists = await this.prisma.usuario.findUnique({ where: { id } });
    if (!userExists) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado para atualização.`);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
    });
  }

  async findByFields(where: Prisma.UsuarioWhereInput): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({
        where
    });
  }
}
