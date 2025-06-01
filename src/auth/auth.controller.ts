import { Controller, Post, Body, HttpCode, HttpStatus, Patch, BadGatewayException, BadRequestException, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePasswordLoggedIn(@Req() requestWithUser: any, @Body()changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const userId = requestWithUser.user.id;

    if (!userId) {
      throw new UnauthorizedException('ID do usuário nã encontrado no token.');
    }
    await this.authService.changePasswordLoggedUser(userId, changePasswordDto);
    return { message: 'Sua senha foi alterada com sucesso.'};
  }
}
