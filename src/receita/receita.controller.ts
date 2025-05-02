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
  
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceitaDto,) {
      const userId = (req as any).user.id;
      return await this.receitaService.update(id, dto, userId);
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async delete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
      const userId = (req as any).user.id;
      return await this.receitaService.delete(id, userId);
    }
}
  