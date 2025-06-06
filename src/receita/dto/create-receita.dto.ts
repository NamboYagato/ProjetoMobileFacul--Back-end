// src/receitas/dto/create-receita.dto.ts
import {
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/* ---------- Enum exatamente como no seu domínio ---------- */
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

/* ---------- DTOs auxiliares ---------- */
export class IngredienteDto {
  @IsString()
  nome: string;

  @IsString()
  quantidade: string;
}

export class PreparoDto {
  @IsInt()
  @Type(() => Number) // transforma string → number
  ordemEtapa: number;

  @IsString()
  texto: string;
}

/* ---------- DTO principal ---------- */
export class CreateReceitaDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao: string;

  @IsEnum(TipoReceita)
  tipo: TipoReceita;

  @IsBoolean()
  @IsOptional()
  publicada: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredienteDto)
  ingredientes: IngredienteDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreparoDto)
  passo_a_passo: PreparoDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imagensBase64: string[];
}
