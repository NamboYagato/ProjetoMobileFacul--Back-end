import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards, Req,
    Query
  } from '@nestjs/common';
  import { Request } from 'express';
  import { ReceitaService } from './receita.service';
  import { CreateReceitaDto } from './dto/create-receita.dto';
  import { UpdateReceitaDto } from './dto/update-receita.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TipoReceita } from '@prisma/client';
import { JwtSecretRequestType } from '@nestjs/jwt';
  
  @Controller('receitas')
  export class ReceitaController {
    constructor(private readonly receitaService: ReceitaService) {}
    
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Req() req: Request, @Query('search') search?: string, @Query('type') type?: TipoReceita,) {
      return this.receitaService.findAll(search, type, (req as any).user.id);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
      const userId = (req as any)?.user?.id;
      return this.receitaService.findOne(id, userId);
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

    // CURTIDAS
    @UseGuards(JwtAuthGuard)
    @Post(':id/curtir')
    async toggleLike(@Req() req: Request, @Param('id', ParseIntPipe) receitaId: number) {
      const userId = (req as any).user.id;
      return this.receitaService.toggleLike(receitaId, userId);
    }

    // FAVORITOS
    @UseGuards(JwtAuthGuard)
    @Post(':id/favoritar')
    async toggleFavorite(@Req() req: Request, @Param('id', ParseIntPipe) receitaId: number) {
      const userId = (req as any).user.id;
      return this.receitaService.toggleFavorite(receitaId, userId);
    }
}
