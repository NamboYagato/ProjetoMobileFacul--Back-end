import { Controller, Post, Body, Get, Res, HttpCode, HttpStatus, Param, Patch, BadGatewayException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { verify } from 'crypto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly mailerService: MailerService,) {}

  @Post('register')
  async register(@Body() createUsuarioDto: CreateUsuarioDto) {
    return await this.authService.register(createUsuarioDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('request-password')
  @HttpCode(HttpStatus.OK)
  async requestPassword(@Body() requestOtpDto: RequestOtpDto): Promise<{ message: string }> {
    if (!requestOtpDto || !requestOtpDto.email) {
      throw new BadRequestException('O e-mail é obrigatório.');
    }
    await this.authService.requestPasswordReset(requestOtpDto.email);
    return {
      message: 'Código de verificação enviado.'
    };
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ message: string; passwordChangeSessionToken: string }> {
    if (!verifyOtpDto || !verifyOtpDto.email || !verifyOtpDto.otp) {
      throw new BadRequestException('E-mail e código de verificação são obrigatórios.');
    }
    const { passwordChangeSessionToken } = await this.authService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp
    );
    return {
      message: 'Código verifica com sucesso',
      passwordChangeSessionToken
    };
  }

  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Sua senha foi redefinida com sucesso.' };
  }
}
