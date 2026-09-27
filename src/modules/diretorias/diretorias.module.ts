import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './entities/curso.entity';
import { Diretoria } from './entities/diretoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Diretoria, Curso])],
  exports: [TypeOrmModule],
})
export class DiretoriasModule {}
