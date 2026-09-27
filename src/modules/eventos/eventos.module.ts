import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './entities/evento.entity';
import { Participacao } from './entities/participacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evento, Participacao])],
  exports: [TypeOrmModule],
})
export class EventosModule {}
