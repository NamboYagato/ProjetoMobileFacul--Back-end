import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsNotEmpty({ message: 'O token é obrigatório.' })
    @IsString()
    passwordChangeSessionToken: string;

    @IsNotEmpty({ message: 'A nova senha é obrigatória.' })
    @IsString()
    @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
    novaSenha: string;
}
