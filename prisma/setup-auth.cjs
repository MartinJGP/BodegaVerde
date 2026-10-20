const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src');

const files = {
  // USUARIOS
  'usuarios/usuarios.module.ts': `import { Module } from '@nestjs/common';\nimport { UsuariosService } from './usuarios.service';\n\n@Module({ providers: [UsuariosService], exports: [UsuariosService] })\nexport class UsuariosModule {}`,
  'usuarios/usuarios.service.ts': `import { Injectable } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport * as bcrypt from 'bcrypt';\n\n@Injectable()\nexport class UsuariosService {\n  constructor(private prisma: PrismaService) {}\n  \n  async findByEmail(email: string) {\n    return this.prisma.usuario.findUnique({ where: { email } });\n  }\n  \n  async create(data: any) {\n    const passwordHash = await bcrypt.hash(data.password, 10);\n    return this.prisma.usuario.create({\n      data: { nombre: data.nombre, email: data.email, rol: data.rol, passwordHash },\n      select: { id: true, nombre: true, email: true, rol: true } // nunca devolvemos el hash\n    });\n  }\n}`,

  // AUTH
  'auth/auth.module.ts': `import { Module } from '@nestjs/common';\nimport { JwtModule } from '@nestjs/jwt';\nimport { PassportModule } from '@nestjs/passport';\nimport { AuthService } from './auth.service';\nimport { AuthController } from './auth.controller';\nimport { UsuariosModule } from '../usuarios/usuarios.module';\nimport { JwtStrategy } from './jwt.strategy';\n\n@Module({\n  imports: [\n    UsuariosModule,\n    PassportModule,\n    JwtModule.register({ secret: process.env.JWT_SECRET || 'super-secreto-bodega', signOptions: { expiresIn: '12h' } })\n  ],\n  controllers: [AuthController],\n  providers: [AuthService, JwtStrategy]\n})\nexport class AuthModule {}`,
  'auth/auth.service.ts': `import { Injectable, UnauthorizedException } from '@nestjs/common';\nimport { UsuariosService } from '../usuarios/usuarios.service';\nimport { JwtService } from '@nestjs/jwt';\nimport * as bcrypt from 'bcrypt';\n\n@Injectable()\nexport class AuthService {\n  constructor(private usuariosService: UsuariosService, private jwtService: JwtService) {}\n\n  async login(email: string, pass: string) {\n    const user = await this.usuariosService.findByEmail(email);\n    if (!user) throw new UnauthorizedException('credenciales invalidas');\n    \n    const isMatch = await bcrypt.compare(pass, user.passwordHash);\n    if (!isMatch) throw new UnauthorizedException('credenciales invalidas');\n\n    const payload = { sub: user.id, email: user.email, rol: user.rol };\n    return { access_token: this.jwtService.sign(payload), usuario: { nombre: user.nombre, rol: user.rol } };\n  }\n}`,
  'auth/auth.controller.ts': `import { Controller, Post, Body } from '@nestjs/common';\nimport { AuthService } from './auth.service';\nimport { UsuariosService } from '../usuarios/usuarios.service';\n\n@Controller('auth')\nexport class AuthController {\n  constructor(private authService: AuthService, private usuariosService: UsuariosService) {}\n\n  @Post('login')\n  login(@Body() body: any) {\n    return this.authService.login(body.email, body.password);\n  }\n\n  // solo para crear los primeros usuarios\n  @Post('register')\n  register(@Body() body: any) {\n    return this.usuariosService.create(body);\n  }\n}`,
  'auth/jwt.strategy.ts': `import { ExtractJwt, Strategy } from 'passport-jwt';\nimport { PassportStrategy } from '@nestjs/passport';\nimport { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class JwtStrategy extends PassportStrategy(Strategy) {\n  constructor() {\n    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: process.env.JWT_SECRET || 'super-secreto-bodega' });\n  }\n  async validate(payload: any) { return { userId: payload.sub, email: payload.email, rol: payload.rol }; }\n}`
};

Object.keys(files).forEach(filePath => {
  const fullPath = path.join(basePath, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[filePath]);
});

// Actualizar app.module.ts
const appModulePath = path.join(basePath, 'app.module.ts');
let appModuleContent = fs.readFileSync(appModulePath, 'utf8');
if (!appModuleContent.includes('AuthModule')) {
  appModuleContent = appModuleContent.replace("import { Module } from '@nestjs/common';", "import { Module } from '@nestjs/common';\\nimport { AuthModule } from './auth/auth.module';\\nimport { UsuariosModule } from './usuarios/usuarios.module';");
  appModuleContent = appModuleContent.replace("imports: [", "imports: [\\n    AuthModule,\\n    UsuariosModule,");
  fs.writeFileSync(appModulePath, appModuleContent);
}
console.log('Auth y Usuarios generados!');
