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
    Query,
    UnauthorizedException,
    UseInterceptors,
    UploadedFiles
  } from '@nestjs/common';
  import { Request } from 'express';
  import { ReceitaService } from './receita.service';
  import { CreateReceitaDto } from './dto/create-receita.dto';
  import { UpdateReceitaDto } from './dto/update-receita.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TipoReceita } from '@prisma/client';
import { JwtSecretRequestType } from '@nestjs/jwt';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
  
  @Controller('receitas')
  export class ReceitaController {
    constructor(private readonly receitaService: ReceitaService) {}
    
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Req() req: Request, @Query('search') search?: string, @Query('type') type?: TipoReceita,) {
      return this.receitaService.findAll(search, type, (req as any).user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('publicas')
    async findAllPublicRecipes(@Query('search') search?: string, @Query('type') type?: TipoReceita) {
      return this.receitaService.findAllPublicRecipe(search, type);
    }

    @UseGuards(JwtAuthGuard)
    @Get('privadas')
    async findRecipesByUserId(@Req() req: Request) {
      const userId = (req as any).user.id;
      if (!userId) throw new UnauthorizedException('UserId não encontrado.');
      return await this.receitaService.findRecipeByUserId(userId);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
      const userId = (req as any)?.user?.id;
      return this.receitaService.findOne(id, userId);
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('create')
    @UseInterceptors(FilesInterceptor('imagens'))
    async create(@Req() req: Request, @Body() dto: CreateReceitaDto, @UploadedFiles() imagens: Express.Multer.File[]) {
      const autorId = (req as any).user.id;
      const data = {
        ...dto,
        autorId,
      };
      return await this.receitaService.create(data, imagens);
    }
  
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    @UseInterceptors(FilesInterceptor('imagens'))
    async update(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceitaDto, @UploadedFiles() imagens: Express.Multer.File[]) {
      const userId = (req as any).user.id;
      return await this.receitaService.update(id, dto, userId, imagens);
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
