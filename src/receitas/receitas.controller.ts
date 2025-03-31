import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ReceitasService } from './receitas.service';

@Controller('receitas')
export class ReceitasController {
  constructor(private readonly receitasService: ReceitasService) {}

  @Get()
  findAll() {
    return this.receitasService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.receitasService.create(data);
  }

  @Delete('/:id')
  deleteReceita(@Param('id') id: String) {
    const idToNumber = Number(id);
    return this.receitasService.deleteReceita(idToNumber);
  }
}
