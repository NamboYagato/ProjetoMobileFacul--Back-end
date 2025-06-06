import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  BadGatewayException,
  BadRequestException,
  UseGuards,
  UnauthorizedException,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUsuarioDto: CreateUsuarioDto) {
    return await this.authService.register(createUsuarioDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request) {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.substring(7);
      await this.authService.logout(token);
      return { message: 'Logout bem-sucedido.' };
    }
    return {
      message:
        'Logout processado (token não extraído explicitamente no controller, mas o guard atuou).',
    };
  }

  @Post('request-password')
  @HttpCode(HttpStatus.OK)
  async requestPassword(
    @Body() requestOtpDto: RequestOtpDto,
  ): Promise<{ message: string }> {
    if (!requestOtpDto || !requestOtpDto.email) {
      throw new BadRequestException('O e-mail é obrigatório.');
    }
    await this.authService.requestPasswordReset(requestOtpDto.email);
    return {
      message: 'Código de verificação enviado.',
    };
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; passwordChangeSessionToken: string }> {
    if (!verifyOtpDto || !verifyOtpDto.email || !verifyOtpDto.otp) {
      throw new BadRequestException(
        'E-mail e código de verificação são obrigatórios.',
      );
    }
    const { passwordChangeSessionToken } = await this.authService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
    return {
      message: 'Código verifica com sucesso',
      passwordChangeSessionToken,
    };
  }

  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Sua senha foi redefinida com sucesso.' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePasswordLoggedIn(
    @Req() requestWithUser: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = requestWithUser.user.id;

    if (!userId) {
      throw new UnauthorizedException('ID do usuário nã encontrado no token.');
    }
    await this.authService.changePasswordLoggedUser(userId, changePasswordDto);
    return { message: 'Sua senha foi alterada com sucesso.' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('validate-token')
  @HttpCode(HttpStatus.OK)
  async validateTokenAndGetUser(@Req() request: any): Promise<boolean> {
    const payload = request.user as { id: number; email: string };
    return await this.authService.validateTokenAndGetUser(payload.id);
  }
}
