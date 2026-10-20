import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { MesasModule } from './mesas/mesas.module.js';
import { PlatosModule } from './platos/platos.module.js';
import { InsumosModule } from './insumos/insumos.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { ProveedoresModule } from './proveedores/proveedores.module.js';
import { ComprasModule } from './compras/compras.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    MesasModule,
    CategoriasModule,
    InsumosModule,
    PlatosModule,
    PedidosModule,
    ProveedoresModule,
    ComprasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}