import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PapelAtletica } from '../enums/papel-atletica.enum';
import { StatusVinculo } from '../enums/status-vinculo.enum';
import { Diretoria } from '../../diretorias/entities/diretoria.entity';
import { Socio } from '../../socios/entities/socio.entity';
import { Usuario } from './usuario.entity';

@Entity({ name: 'usuario_diretoria' })
@Unique('uq_usuario_diretoria_usuario_diretoria', ['usuarioId', 'diretoriaId'])
@Index('idx_usuario_diretoria_fila', ['diretoriaId', 'status'])
@Index('uq_usuario_diretoria_principal', ['usuarioId'], {
  unique: true,
  where: '"principal"',
})
export class UsuarioDiretoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @Column({
    type: 'enum',
    enum: PapelAtletica,
    enumName: 'papel_atletica',
    default: PapelAtletica.MEMBRO,
  })
  papel: PapelAtletica;

  @Column({
    type: 'enum',
    enum: StatusVinculo,
    enumName: 'status_vinculo',
    default: StatusVinculo.PENDENTE,
  })
  status: StatusVinculo;

  @Column({ type: 'boolean', default: false })
  principal: boolean;

  @Column({ name: 'decidido_por_id', type: 'uuid', nullable: true })
  decididoPorId: string | null;

  @Column({ name: 'decidido_em', type: 'timestamptz', nullable: true })
  decididoEm: Date | null;

  @CreateDateColumn({
    name: 'criado_em',
    type: 'timestamptz',
    default: () => 'now()',
  })
  criadoEm: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.vinculos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'usuario_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_usuario_diretoria_usuario',
  })
  usuario: Usuario;

  @ManyToOne(() => Diretoria, (diretoria) => diretoria.vinculos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'diretoria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_usuario_diretoria_diretoria',
  })
  diretoria: Diretoria;

  @ManyToOne(() => Usuario, (usuario) => usuario.vinculosDecididos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'decidido_por_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_usuario_diretoria_decidido_por',
  })
  decididoPor: Usuario | null;

  @OneToMany(() => Socio, (socio) => socio.vinculo)
  socios: Socio[];
}
