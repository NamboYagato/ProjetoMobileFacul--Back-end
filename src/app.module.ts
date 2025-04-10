import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ReceitaModule } from './receita/receita.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [ReceitaModule, UsuarioModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
