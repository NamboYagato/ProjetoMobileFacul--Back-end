// src/receita/receita.module.ts
import { Module } from '@nestjs/common';
import { ReceitaService } from './receita.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Adiciona o PrismaModule aqui para que o PrismaService esteja disponível
  providers: [ReceitaService],
  exports: [ReceitaService],
})
export class ReceitaModule {}
