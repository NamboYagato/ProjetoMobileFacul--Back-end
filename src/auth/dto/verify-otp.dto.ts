import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Por favor, forneça um endereço de e-mail válido.' })
  @IsNotEmpty({ message: 'O campo e-mail não pode estar vazio.' })
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'O campo OTP não pode estar vazio.' })
  @IsString({ message: 'O OTP deve ser uma string.'})
  @Length(6, 8, { message: 'O OTP deve ter entre 6 e 8 caracteres.' }) // Ajuste o tamanho conforme sua implementação
  otp: string;
}
