import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ReceitaModule } from './receita/receita.module';

@Module({
  imports: [ReceitaModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
