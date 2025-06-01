import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsEmail({}, { message: 'Por favor, forneça um endereço de e-mail válido.' })
  @IsNotEmpty({ message: 'O campo e-mail não pode estar vazio.' })
  @IsString()
  email: string;
}
