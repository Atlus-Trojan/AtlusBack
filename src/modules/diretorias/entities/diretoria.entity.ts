import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Curso } from './curso.entity';
import { Evento } from '../../eventos/entities/evento.entity';
import { Pedido } from '../../loja/entities/pedido.entity';
import { Produto } from '../../loja/entities/produto.entity';
import { Socio } from '../../socios/entities/socio.entity';
import { UsuarioDiretoria } from '../../usuarios/entities/usuario-diretoria.entity';

@Entity({ name: 'diretorias' })
@Index('uq_diretorias_email', ['email'], { unique: true })
@Check(
  'chk_diretorias_desconto',
  '"desconto_socio" >= 0 AND "desconto_socio" <= 100',
)
export class Diretoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'citext' })
  email: string;

  @Column({
    name: 'desconto_socio',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  descontoSocio: string;

  @Column({ name: 'exige_aprovacao', type: 'boolean', default: true })
  exigeAprovacao: boolean;

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

  @OneToMany(() => Curso, (curso) => curso.diretoria)
  cursos: Curso[];

  @OneToMany(() => UsuarioDiretoria, (vinculo) => vinculo.diretoria)
  vinculos: UsuarioDiretoria[];

  @OneToMany(() => Socio, (socio) => socio.diretoria)
  socios: Socio[];

  @OneToMany(() => Produto, (produto) => produto.diretoria)
  produtos: Produto[];

  @OneToMany(() => Pedido, (pedido) => pedido.diretoria)
  pedidos: Pedido[];

  @OneToMany(() => Evento, (evento) => evento.diretoria)
  eventos: Evento[];
}
