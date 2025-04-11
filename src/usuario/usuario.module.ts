// src/usuario/usuario.module.ts
import { Module } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { PrismaModule } from 'src/prisma/prisma.module'; // importe o PrismaModule

@Module({
  imports: [PrismaModule], // adicione aqui o PrismaModule para que o PrismaService esteja disponível
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
