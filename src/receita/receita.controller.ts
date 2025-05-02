import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards, Req
  } from '@nestjs/common';
  import { Request } from 'express';
  import { ReceitaService } from './receita.service';
  import { CreateReceitaDto } from './dto/create-receita.dto';
  import { UpdateReceitaDto } from './dto/update-receita.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  
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
  
    @UseGuards(JwtAuthGuard)
    @Post('create')
    async create(@Req() req: Request, @Body() dto: CreateReceitaDto) {
      const autorId = (req as any).user.id;
      const data = {
        ...dto,
        autorId,
      };

      return await this.receitaService.create(data);
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
  