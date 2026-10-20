import { Module } from '@nestjs/common';
import { PlatosController } from './platos.controller.js';
import { PlatosService } from './platos.service.js';

@Module({ controllers: [PlatosController], providers: [PlatosService] })
export class PlatosModule {}