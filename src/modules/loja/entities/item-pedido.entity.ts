import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { Produto } from './produto.entity';

@Entity({ name: 'itens_pedido' })
@Index('idx_itens_pedido_produto', ['produtoId'])
@Index('idx_itens_pedido_pedido', ['pedidoId'])
@Check(
  'chk_itens_valores',
  '"preco_unitario_final" >= 0 AND "preco_unitario_final" <= "preco_unitario"',
)
@Check('chk_itens_quantidade', '"quantidade" > 0')
export class ItemPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id', type: 'uuid' })
  pedidoId: string;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @Column({ name: 'produto_id', type: 'uuid' })
  produtoId: string;

  @Column({ name: 'produto_nome', type: 'varchar', length: 150 })
  produtoNome: string;

  @Column({ type: 'integer' })
  quantidade: number;

  @Column({ name: 'preco_unitario', type: 'numeric', precision: 10, scale: 2 })
  precoUnitario: string;

  @Column({
    name: 'preco_unitario_final',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  precoUnitarioFinal: string;

  @ManyToOne(() => Pedido, (pedido) => pedido.itens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'pedido_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_itens_pedido_pedido',
    },
    { name: 'diretoria_id', referencedColumnName: 'diretoriaId' },
  ])
  pedido: Pedido;

  @ManyToOne(() => Produto, (produto) => produto.itensPedido, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn([
    {
      name: 'produto_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_itens_pedido_produto',
    },
    { name: 'diretoria_id', referencedColumnName: 'diretoriaId' },
  ])
  produto: Produto;
}
