import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diretoria } from './entities/diretoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Diretoria])],
  exports: [TypeOrmModule],
})
export class DiretoriasModule {}
