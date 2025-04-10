import { Module } from '@nestjs/common';
import { ReceitaService } from './receita.service';
import { ReceitaController } from './receita.controller';

@Module({
  providers: [ReceitaService],
  controllers: [ReceitaController]
})
export class ReceitaModule {}
