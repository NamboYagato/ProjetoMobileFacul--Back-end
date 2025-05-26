import { Injectable, UnauthorizedException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Usuario } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: CreateUsuarioDto) {
    // Hasheia a senha antes de salvar o usuário

    data.senha = await bcrypt.hash(data.senha, this.BCRYPT_SALT_ROUNDS);

    const user = await this.usuarioService.create(data);
    const payload = { sub: user.id, email: user.email };

    return {
      user,
      token: this.jwtService.sign(payload),
    };
  }

  async login(data: LoginDto) {
    const user = await this.usuarioService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(data.senha, user.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      user,
      token: this.jwtService.sign(payload),
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usuarioService.findByEmail(email);

    if (!user) {
      this.logger.warn(`Tentativa de redefinição de senha para e-mail não cadastrado: ${email}`);
      return;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const hashedToken = createHash('sha256').update(token).digest('hex');

    try {
      await this.usuarioService.update(user.id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      });
    } catch (dbError) {
      this.logger.error(`Falha ao salvar token de reset para ${email}`, dbError.stack);
      return
    }

    const frontEndBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL') || 'http://localhost:3000';
    const resetLink = `${frontEndBaseUrl}/resetar-senha?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Redefinição de senha solicitada',
        template: './password-reset',
        context: {
          name: user.nome,
          resetLink,
        },
      });
      this.logger.log(`Link de redefinição de senha enviado para ${user.email}`);
    } catch (emailError) {
      this.logger.error(`Falha ao enviar e-mail de redefinição para ${user.email}`, emailError.stack);
    }
  }

  async verifyResetToken(token: string): Promise<Usuario | null> {
    if (!token) {
      throw new BadRequestException('Token não fornecido.');
    }
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.usuarioService.findByFields({
      resetPasswordToken: hashedToken,
    });

    if (!user || !user.resetPasswordToken) {
      throw new BadRequestException('Token inválido ou já utilizado.');
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      await this.clearResetToken(user.id);
      throw new BadRequestException('Token expirado.');
    }
    return user;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, password } = resetPasswordDto;

    let user: Usuario;
    try {
      user = await this.verifyResetToken(token);
    } catch (error) {
      this.logger.warn(`Tentativa de reset de senha falhou: ${error.message}`);
      throw error;
    }

    if (!user) {
      throw new BadRequestException('Token inválido ou expirado.');
    }
    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);

    try {
      await this.usuarioService.update(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      this.logger.log(`Senha redefinida com sucesso para o usuário ID: ${user.id}`);
    } catch (dbError) {
      this.logger.error(`Falha ao atualizar senha para usuário ID: ${user.id}`, dbError.stack);
      throw new InternalServerErrorException('Ocorreu um erro ao redefinir sua senha. Tente novamente.');
    }
  }

  private async clearResetToken(userId: string | number): Promise<void> {
    try {
      await this.usuarioService.update(userId, {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    } catch (error) {
      this.logger.error(`Falha ao limpar token de reset para usuário ID: ${userId}`, error.stack);
    }
  }
}
