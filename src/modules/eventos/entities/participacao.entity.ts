import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Role } from '../../usuarios/enums/role.enum';
import { StatusParticipacao } from '../enums/status-participacao.enum';
import { Evento } from './evento.entity';

@Entity({ name: 'participacoes' })
@Index('idx_participacoes_usuario_data', ['usuarioId', 'criadoEm'])
@Index('uq_participacoes_evento_usuario', ['eventoId', 'usuarioId'], {
  unique: true,
  where: `"status" = 'CONFIRMADA'`,
})
@Check(
  'chk_participacoes_valores',
  '"preco_final" >= 0 AND "preco_final" <= "preco_base"',
)
export class Participacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evento_id', type: 'uuid' })
  eventoId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({
    type: 'enum',
    enum: StatusParticipacao,
    enumName: 'status_participacao',
    default: StatusParticipacao.CONFIRMADA,
  })
  status: StatusParticipacao;

  @Column({
    name: 'papel_aplicado',
    type: 'enum',
    enum: Role,
    enumName: 'role',
  })
  papelAplicado: Role;

  @Column({ name: 'preco_base', type: 'numeric', precision: 10, scale: 2 })
  precoBase: string;

  @Column({
    name: 'desconto_percentual',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  descontoPercentual: string;

  @Column({ name: 'preco_final', type: 'numeric', precision: 10, scale: 2 })
  precoFinal: string;

  @Column({ name: 'cancelado_em', type: 'timestamptz', nullable: true })
  canceladoEm: Date | null;

  @CreateDateColumn({
    name: 'criado_em',
    type: 'timestamptz',
    default: () => 'now()',
  })
  criadoEm: Date;

  @ManyToOne(() => Evento, (evento) => evento.participacoes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'evento_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_participacoes_evento',
  })
  evento: Evento;

  @ManyToOne(() => Usuario, (usuario) => usuario.participacoes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'usuario_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_participacoes_usuario',
  })
  usuario: Usuario;
}
