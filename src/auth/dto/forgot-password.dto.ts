import { IsEmail, isNotEmpty, IsNotEmpty, IsString } from "class-validator";

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Por favor, forneça um e-mail válido.' })
    @IsNotEmpty({ message: 'O e-mail não pode ser vazio.' })
    @IsString()
    email: string;
}