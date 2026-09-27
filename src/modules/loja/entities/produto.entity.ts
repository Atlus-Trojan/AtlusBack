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
  UpdateDateColumn,
} from 'typeorm';
import { Diretoria } from '../../diretorias/entities/diretoria.entity';
import { ItemPedido } from './item-pedido.entity';

@Entity({ name: 'produtos' })
@Unique('uq_produtos_id_diretoria', ['id', 'diretoriaId'])
@Index('idx_produtos_diretoria_ativo', ['diretoriaId', 'ativo'])
@Check('chk_produtos_estoque', '"estoque" >= 0')
@Check('chk_produtos_preco', '"preco" >= 0')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'diretoria_id', type: 'uuid' })
  diretoriaId: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  preco: string;

  @Column({ type: 'integer', default: 0 })
  estoque: number;

  @Column({ name: 'imagem_url', type: 'text', nullable: true })
  imagemUrl: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'integer' })
  versao: number;

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

  @ManyToOne(() => Diretoria, (diretoria) => diretoria.produtos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'diretoria_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_produtos_diretoria',
  })
  diretoria: Diretoria;

  @OneToMany(() => ItemPedido, (item) => item.produto)
  itensPedido: ItemPedido[];
}
