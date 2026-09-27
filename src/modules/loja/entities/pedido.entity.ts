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
  Unique,
} from 'typeorm';
import { Diretoria } from '../../diretorias/entities/diretoria.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Role } from '../../usuarios/enums/role.enum';
import { StatusPedido } from '../enums/status-pedido.enum';
import { ItemPedido } from './item-pedido.entity';

@Entity({ name: 'pedidos' })
@Unique('uq_pedidos_id_diretoria', ['id', 'diretoriaId'])
@Index('idx_pedidos_usuario_data', ['usuarioId', 'criadoEm'])
@Index('idx_pedidos_diretoria_data', ['diretoriaId', 'criadoEm'])
@Check(
  'chk_pedidos_valores',
  `"desconto_percentual" >= 0
  AND "subtotal" >= 0
  AND "desconto_valor" >= 0
  AND "total" >= 0
  AND "total" = "subtotal" - "desconto_valor"`,
)
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({
    type: 'enum',
    enum: StatusPedido,
    enumName: 'status_pedido',
    default: StatusPedido.CONFIRMADO,
  })
  status: StatusPedido;

  @Column({
    name: 'papel_aplicado',
    type: 'enum',
    enum: Role,
    enumName: 'role',
  })
  papelAplicado: Role;

  @Column({
    name: 'desconto_percentual',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  descontoPercentual: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: string;

  @Column({ name: 'desconto_valor', type: 'numeric', precision: 10, scale: 2 })
  descontoValor: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total: string;

  @Column({ name: 'cancelado_em', type: 'timestamptz', nullable: true })
  canceladoEm: Date | null;

  @CreateDateColumn({
    name: 'criado_em',
    type: 'timestamptz',
    default: () => 'now()',
  })
  criadoEm: Date;

  @ManyToOne(() => Diretoria, (diretoria) => diretoria.pedidos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'diretoria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_pedidos_diretoria',
  })
  diretoria: Diretoria;

  @ManyToOne(() => Usuario, (usuario) => usuario.pedidos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'usuario_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_pedidos_usuario',
  })
  usuario: Usuario;

  @OneToMany(() => ItemPedido, (item) => item.pedido)
  itens: ItemPedido[];
}
