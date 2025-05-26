import { Module } from '@nestjs/common';
import { ReceitaService } from './receita.service';
import { ReceitaController } from './receita.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Adiciona o PrismaModule aqui para que o PrismaService esteja disponível
  controllers: [ReceitaController],
  providers: [ReceitaService],
  exports: [ReceitaService],
})
export class ReceitaModule {}
