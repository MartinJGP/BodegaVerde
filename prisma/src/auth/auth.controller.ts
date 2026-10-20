import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usuariosService: UsuariosService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  // solo para crear los primeros usuarios
  @Post('register')
  register(@Body() body: any) {
    return this.usuariosService.create(body);
  }
}