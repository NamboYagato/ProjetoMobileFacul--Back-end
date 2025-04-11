import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ReceitaModule } from './receita/receita.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ReceitaModule, UsuarioModule, AuthModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
