import { Module } from '@nestjs/common';
import { ReceitasController } from './receitas.controller';
import { ReceitasService } from './receitas.service';

@Module({
  controllers: [ReceitasController],
  providers: [ReceitasService]
})
export class ReceitasModule {}
