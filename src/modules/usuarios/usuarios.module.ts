import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioDiretoria } from './entities/usuario-diretoria.entity';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, UsuarioDiretoria])],
  exports: [TypeOrmModule],
})
export class UsuariosModule {}
