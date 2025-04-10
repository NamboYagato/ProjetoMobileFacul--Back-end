import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseIntPipe,
  } from '@nestjs/common';
  import { ReceitaService } from './receita.service';
  import { CreateReceitaDto } from './dto/create-receita.dto';
  import { UpdateReceitaDto } from './dto/update-receita.dto';
  
  @Controller('receitas')
  export class ReceitaController {
    constructor(private readonly receitaService: ReceitaService) {}
  
    @Get()
    findAll() {
      return this.receitaService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.receitaService.findOne(id);
    }
  
    @Post()
    create(@Body() createReceitaDto: CreateReceitaDto) {
      return this.receitaService.create(createReceitaDto);
    }
  
    @Put(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateReceitaDto: UpdateReceitaDto,
    ) {
      return this.receitaService.update(id, updateReceitaDto);
    }
  
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
      return this.receitaService.delete(id);
    }
}
  