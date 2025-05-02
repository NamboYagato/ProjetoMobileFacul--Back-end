import {
    IsString,
    IsBoolean,
    IsEnum,
    IsArray,
    IsInt,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  export enum TipoReceita {
    BEBIDAS = 'BEBIDAS',
    BOLOS = 'BOLOS',
    DOCES_E_SOBREMESAS = 'DOCES_E_SOBREMESAS',
    FITNES = 'FITNES',
    LANCHES = 'LANCHES',
    MASSAS = 'MASSAS',
    SALGADOS = 'SALGADOS',
    SAUDAVEL = 'SAUDAVEL',
    SOPAS = 'SOPAS',
  }
  
  class ImagemDto {
    @IsString()
    url: string;
  
    @IsString()
    tipo: string;
  }
  
  class IngredienteDto {
    @IsString()
    nome: string;
  
    @IsString()
    quantidade: string;
  }
  
  class PreparoDto {
    @IsInt()
    ordemEtapa: number;
  
    @IsString()
    texto: string;
  }
  
  export class CreateReceitaDto {
    @IsString()
    titulo: string;
  
    @IsString()
    descricao: string;
  
    @IsEnum(TipoReceita)
    tipo: TipoReceita;
  
    @IsBoolean()
    publicada: boolean;
  
    // @IsInt()
    // autorId: number;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImagemDto)
    imagens: ImagemDto[];
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredienteDto)
    ingredientes: IngredienteDto[];
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PreparoDto)
    passo_a_passo: PreparoDto[];
  }
