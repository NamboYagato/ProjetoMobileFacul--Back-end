import { Injectable, UnauthorizedException, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly BCRYPT_SALT_ROUNDS = 10;
  private readonly OTP_LENGTH = 6;
  private readonly OTP_MINUTES = 15; // OTP expires in 15 min
  private readonly SESSION_TOKEN_MINUTES = 5; // Time to change password

  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private generateOtp(length: number = this.OTP_LENGTH): string {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return otp;
  }

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }
  
  async register(data: CreateUsuarioDto) {

    data.senha = await bcrypt.hash(data.senha, this.BCRYPT_SALT_ROUNDS);

    const user = await this.usuarioService.create(data);
    const payload = { nome: user.nome, email: user.email };

    return {
      ...payload
    };
  }

  async login(data: LoginDto) {
    const user = await this.usuarioService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas Email');
    }

    const isPasswordValid = await bcrypt.compare(data.senha, user.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas Senha');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
      user: {
        email: user.email,
      }
    };
  }

  async logout(token: string): Promise<void> {
    if (!token) {
      this.logger.warn('Tentativa de logout sem fornecer um token.');
      throw new BadRequestException('Token não fornecido.');
    }

    try {
      const decodedToken = this.jwtService.decode(token) as { exp: number; [key: string]: any };

      if (!decodedToken || !decodedToken.exp) {
        const now = new Date();
        const fallbackExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

        await this.prisma.blockedToken.create({
          data: {
            token: token,
            expiresAt: fallbackExpiresAt
          },
        });
        this.logger.log(`Token (potencialmente inválido) adicionado à blocklist com expiração de fallback.`);
        return;
      }
      const expiresAt = new Date(decodedToken.exp * 1000);

      if (expiresAt < new Date()) {
        this.logger.log(`Tentativa de logout com token já expirado: ${token.substring(0, 20)}...`);
        return;
      }
      await this.prisma.blockedToken.create({
        data: {
          token: token,
          expiresAt: expiresAt,
        },
      });
      this.logger.log(`Token ${token.substring(0, 20)}... adicionado à blocklist. Expira em: ${expiresAt.toISOString()}`);
    } catch (error) {
      if (error.code === 'P2002') {
        this.logger.warn(`Token ${token.substring(0, 20)}... já está na blocklist.`);
        return;
      }
      this.logger.error(`Erro ao adicionar token à blocklist: ${error.message}`, error.stack);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usuarioService.findByEmail(email);

    if (!user) {
      this.logger.warn(`Tentativa de redefinição de senha para e-mail não cadastrado: ${email}`);
      return;
    }

    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);


    try {
      await this.usuarioService.update(user.id, {
        resetPasswordOtp: hashedOtp,
        resetPasswordOtpExpires: expiresAt,
      });
    } catch (dbError) {
      this.logger.error(`Falha ao salvar Otp de reset para ${email}`, dbError.stack);
      return
    }

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Redefinição de senha solicitada',
        template: './password-reset',
        context: {
          name: user.nome,
          otpCode: otp,
          otpTime: this.OTP_MINUTES,
        },
      });
      this.logger.log(`e-mail enviado para ${user.email}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail de redefinição para ${user.email}`, error.stack);
    }
  }

  async verifyOtp(email: string, userOtp: string): Promise<{ passwordChangeSessionToken: string }> {
    const user = await this.usuarioService.findByEmail(email);

    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      this.logger.warn('Tentativa de verificação de OTP falhou, usuário ou OTP não encontrado.');
      throw new BadRequestException('OTO inválido ou expirado.');
    }

    const hashedUserOto = this.hashOtp(userOtp);

    if (user.resetPasswordOtp < hashedUserOto) {
      this.logger.warn(`Hash do OTP incorreto.`);
      throw new BadRequestException('Código de verificação inválido.');
    }

    if (user.resetPasswordOtpExpires < new Date()) {
      this.logger.warn(`Código expirado.`);
      await this.usuarioService.update(user.id, {
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
      });
      throw new BadRequestException('Código de verificação expirado. Por favor, solicite um novo.');
    }

    const sessionToken = randomBytes(32).toString('hex');
    const sessionTokenExpiresAt = new Date();
    sessionTokenExpiresAt.setMinutes(sessionTokenExpiresAt.getMinutes() + this.SESSION_TOKEN_MINUTES);

    try {
      await this.usuarioService.update(user.id, {
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
        passwordChangeSessionToken: sessionToken,
        passwordChangeSessionTokenExpires: sessionTokenExpiresAt,
      });
    } catch (dbError: any) {
      this.logger.error(`Falha ao criar token de sessão para ${email}: ${dbError.stack || dbError.message}`);
      throw new InternalServerErrorException('Erro ao processar sua solicitação.');
    }

    this.logger.log(`OTP verificado e token de sessão criado para ${email}`);
    return { passwordChangeSessionToken: sessionToken };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { passwordChangeSessionToken, novaSenha } = resetPasswordDto;

    if (!passwordChangeSessionToken || !novaSenha) {
      throw new BadRequestException('Token de sessão e nova senha são obrigatórios.');
    }

    const user = await this.usuarioService.findByFields({
      passwordChangeSessionToken: passwordChangeSessionToken,
    });

    if (!user || !user.passwordChangeSessionTokenExpires) {
      this.logger.warn(`Token de sessão inválido ${passwordChangeSessionToken.substring(0,10)}...`);
      throw new BadRequestException('Sessão de redefinição de senha inválida ou expirada.');
    }

    if (user.passwordChangeSessionTokenExpires < new Date()) {
      this.logger.warn(`Token de sessão expirado para usuário ${user.id}`);
      await this.usuarioService.update(user.id, {
        passwordChangeSessionToken: null,
        passwordChangeSessionTokenExpires: null,
      });
      throw new BadRequestException('Sua sessão para redefinir senha expirou. Inicie o processo novamente.');
    }

    const hashedPassword = await bcrypt.hash(novaSenha, this.BCRYPT_SALT_ROUNDS);

    try {
      await this.usuarioService.update(user.id, {
        senha: hashedPassword,
        passwordChangeSessionToken: null,
        passwordChangeSessionTokenExpires: null
      });
      this.logger.log(`Senha redefinida com sucesso`);
    } catch (dbError: any) {
      this.logger.error(`Falha ao finalizar reset de senha para usuário: ${dbError.stack || dbError.message}`);
      throw new InternalServerErrorException('Ocorreu um erro ao redefinir sua senha.');
    }
  }

  async changePasswordLoggedUser(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { senhaAtual, novaSenha, confirmarNovaSenha } = changePasswordDto;

    if (novaSenha !== confirmarNovaSenha) {
      throw new BadRequestException('A nova senha e a confirmação não conferem.');
    }

    const user = await this.usuarioService.findOne(userId);
    if (!user) {
      this.logger.error(`Usuário não encontrado para mudança de senha: Id ${userId}`);
      throw new NotFoundException('Usuário não encontrado.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
    if (!isCurrentPasswordValid) {
      this.logger.warn(`Tentativa de mudança de senha falhou para usuário ID ${userId}: Senha atual incorreta.`);
      throw new UnauthorizedException('A senha atual fornecida está incorreta.');
    }

    if (await bcrypt.compare(novaSenha, user.senha)) {
      throw new BadRequestException('A nova senha não pode ser igual à senha atual.');
    }

    const hashedNewPassword = await bcrypt.hash(novaSenha, this.BCRYPT_SALT_ROUNDS);

    try {
      await this.usuarioService.update(userId, {
        senha: hashedNewPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
        passwordChangeSessionToken: null,
        passwordChangeSessionTokenExpires: null
      });
      this.logger.log(`Senha alterada com sucesso pelo usuário logado ID: ${userId}`);
    } catch (dbError: any) {
      this.logger.error(`Falha ao atualizar senha para ID ${userId}: ${dbError.stack || dbError.message}`);
      throw new InternalServerErrorException('Ocorreu um erro ao tentar alterar sua senha.');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Executando limpeza de tokens bloqueados expirados...');
    try {
      const now = new Date();
      const result = await this.prisma.blockedToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      this.logger.log(`Limpeza concluída. ${result.count} tokens bloqueados expirados foram removidos.`);
    } catch (error) {
      this.logger.error('Falha ao limpar tokens bloqueados expirados.', error.stack);
    }
  }
}
