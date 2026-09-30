import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioDiretoria } from './entities/usuario-diretoria.entity';
import { Usuario } from './entities/usuario.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, UsuarioDiretoria])],
  controllers: [UsuariosController], // Liberta a rota /usuarios
  providers: [UsuariosService],      // Ativa a lógica de negócio
  exports: [TypeOrmModule, UsuariosService],
})
export class UsuariosModule {}