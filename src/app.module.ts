import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ReceitasModule } from './receitas/receitas.module';

@Module({
  imports: [PrismaModule, ReceitasModule],
})
export class AppModule {}
