// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { addMinutes } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async register(data: CreateUsuarioDto) {
    // Hasheia a senha antes de salvar o usuário
    const saltRounds = 10;
    data.senha = await bcrypt.hash(data.senha, saltRounds);

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

  async forgotPassword(email: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email não encontrado');

    const token = randomUUID();
    const expiresAt = addMinutes(new Date(), 15);

    await this.prisma.passwordResetToken.create({
      data: {
        email, token, expiresAt
      },
    });

    const link = `https://localhost/esqueci-senha?token=${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Redefinição de senha',
      text: `Clique no link para redefinir sua senha: ${link}`
    });

    return { message: 'Instruções enviadas para seu e-mail.' };
  }

  async resetPassword(token: string, novaSenha: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const user = await this.usuarioService.findByEmail(record.email);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const hashed = await bcrypt.hash(novaSenha, 10);
    await this.usuarioService.updatePassword(user.id, hashed);

    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });

    return { message: 'Senha redefinida com sucesso!' };
  }

  async changePassword(userId: number, senhaAtual: string, novaSenha: string) {
    const user = await this.usuarioService.findOne(userId);
    const isMatch = await bcrypt.compare(senhaAtual, user.senha);
    if (!isMatch) throw new UnauthorizedException('Senha atual incorreta');
  
    const hashed = await bcrypt.hash(novaSenha, 10);
    await this.usuarioService.updatePassword(userId, hashed);
  
    return { message: 'Senha atualizada com sucesso' };
  }
  
}
