import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usuariosService: UsuariosService, private jwtService: JwtService) {}

  async login(email: string, pass: string) {
    const user = await this.usuariosService.findByEmail(email);
    if (!user) throw new UnauthorizedException('credenciales invalidas');
    
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('credenciales invalidas');

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    return { access_token: this.jwtService.sign(payload), usuario: { nombre: user.nombre, rol: user.rol } };
  }
}