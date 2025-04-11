// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { CreateUsuarioDto } from 'src/usuario/dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
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
}
