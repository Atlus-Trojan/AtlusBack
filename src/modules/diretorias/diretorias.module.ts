import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curso } from './entities/curso.entity';
import { Diretoria } from './entities/diretoria.entity';
import { DiretoriasController } from './diretorias.controller';
import { DiretoriasService } from './diretorias.service';

@Module({
  imports: [TypeOrmModule.forFeature([Diretoria, Curso])],
  controllers: [DiretoriasController],
  providers: [DiretoriasService],
  exports: [TypeOrmModule, DiretoriasService],
})
export class DiretoriasModule {}
