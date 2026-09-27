import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Diretoria } from '../../diretorias/entities/diretoria.entity';
import { UsuarioDiretoria } from '../../usuarios/entities/usuario-diretoria.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity({ name: 'socios' })
@Unique('uq_socios_usuario_diretoria', ['usuarioId', 'diretoriaId'])
@Index('idx_socios_diretoria', ['diretoriaId'])
export class Socio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @Column({ name: 'valido_de', type: 'date', default: () => 'CURRENT_DATE' })
  validoDe: string;

  @Column({ name: 'valido_ate', type: 'date', nullable: true })
  validoAte: string | null;

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

  @ManyToOne(() => Usuario, (usuario) => usuario.associacoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'usuario_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_socios_usuario',
  })
  usuario: Usuario;

  @ManyToOne(() => Diretoria, (diretoria) => diretoria.socios, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'diretoria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_socios_diretoria',
  })
  diretoria: Diretoria;

  @ManyToOne(() => UsuarioDiretoria, (vinculo) => vinculo.socios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'usuario_id',
      referencedColumnName: 'usuarioId',
      foreignKeyConstraintName: 'fk_socios_usuario_diretoria',
    },
    { name: 'diretoria_id', referencedColumnName: 'diretoriaId' },
  ])
  vinculo: UsuarioDiretoria;
}
