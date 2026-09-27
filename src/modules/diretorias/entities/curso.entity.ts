import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Diretoria } from './diretoria.entity';

@Entity({ name: 'cursos' })
@Index('idx_cursos_diretoria', ['diretoriaId'])
@Index('uq_cursos_codigo', ['codigo'], { unique: true })
export class Curso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  codigo: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nome: string | null;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @CreateDateColumn({
    name: 'criado_em',
    type: 'timestamptz',
    default: () => 'now()',
  })
  criadoEm: Date;

  @UpdateDateColumn({
    name: 'atualizado_em',
    type: 'timestamptz',
    default: () => 'now()',
  })
  atualizadoEm: Date;

  @ManyToOne(() => Diretoria, (diretoria) => diretoria.cursos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'diretoria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_cursos_diretoria',
  })
  diretoria: Diretoria;
}
