// src/auth/dto/change-password.dto.ts
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  senhaAtual: string;

  @IsNotEmpty()
  @MinLength(6)
  novaSenha: string;

  @IsNotEmpty()
  @MinLength(6)
  confirmarNovaSenha: string;
}
