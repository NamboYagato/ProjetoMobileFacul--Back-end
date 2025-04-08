import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ReceitasService } from './receitas.service';

@Controller('receitas')
export class ReceitasController {
  constructor(private readonly receitasService: ReceitasService) {}

  @Get()
  findAll() {
    return this.receitasService.findAll();
  }

  @Get('/:id')
  findId(@Param('id') id: string) {
    const idToNumber = Number(id);
    return this.receitasService.findId(idToNumber);
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

  @Put('/:id')
  updateReceita(@Param('id') id: String, @Body() data: any) {
    const idToNumber = Number(id);
    return this.receitasService.updateReceita(idToNumber, data);
  }
}
