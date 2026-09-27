import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Diretoria } from '../../diretorias/entities/diretoria.entity';
import { Participacao } from './participacao.entity';

@Entity({ name: 'eventos' })
@Index('idx_eventos_diretoria_data', ['diretoriaId', 'dataHora'])
@Check('chk_eventos_ocupadas', '"vagas_ocupadas" >= 0')
@Check(
  'chk_eventos_vagas',
  '"vagas" IS NULL OR ("vagas" > 0 AND "vagas_ocupadas" <= "vagas")',
)
@Check('chk_eventos_preco', '"preco_base" >= 0')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ name: 'data_hora', type: 'timestamptz' })
  dataHora: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  local: string | null;

  @Column({
    name: 'preco_base',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  precoBase: string;

  @Column({ type: 'integer', nullable: true })
  vagas: number | null;

  @Column({ name: 'vagas_ocupadas', type: 'integer', default: 0 })
  vagasOcupadas: number;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

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

  @ManyToOne(() => Diretoria, (diretoria) => diretoria.eventos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'diretoria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_eventos_diretoria',
  })
  diretoria: Diretoria;

  @OneToMany(() => Participacao, (participacao) => participacao.evento)
  participacoes: Participacao[];
}
