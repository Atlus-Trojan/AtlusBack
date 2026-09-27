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
import { TipoVinculo } from '../enums/tipo-vinculo.enum';
import { Participacao } from '../../eventos/entities/participacao.entity';
import { Pedido } from '../../loja/entities/pedido.entity';
import { Socio } from '../../socios/entities/socio.entity';
import { UsuarioDiretoria } from './usuario-diretoria.entity';

@Entity({ name: 'usuarios' })
@Index('uq_usuarios_rga', ['rga'], { unique: true })
@Index('uq_usuarios_cpf_hash', ['cpfHash'], { unique: true })
@Index('uq_usuarios_email', ['email'], { unique: true })
@Check(
  'chk_usuarios_documento',
  `"anonimizado_em" IS NOT NULL OR
  (
    ("tipo_vinculo" = 'ESTUDANTE' AND "rga" IS NOT NULL AND "cpf_hash" IS NULL AND "cpf_cifrado" IS NULL)
    OR
    ("tipo_vinculo" = 'NAO_ESTUDANTE' AND "rga" IS NULL AND "cpf_hash" IS NOT NULL AND "cpf_cifrado" IS NOT NULL)
  )`,
)
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'tipo_vinculo',
    type: 'enum',
    enum: TipoVinculo,
    enumName: 'tipo_vinculo',
  })
  tipoVinculo: TipoVinculo;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rga: string | null;

  @Column({
    name: 'cpf_hash',
    type: 'char',
    length: 64,
    nullable: true,
  })
  cpfHash: string | null;

  @Column({ name: 'cpf_cifrado', type: 'bytea', nullable: true })
  cpfCifrado: Buffer | null;

  @Column({ type: 'citext' })
  email: string;

  @Column({ name: 'email_verificado_em', type: 'timestamptz', nullable: true })
  emailVerificadoEm: Date | null;

  @Column({ name: 'senha_hash', type: 'varchar', length: 72 })
  senhaHash: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'consentimento_em', type: 'timestamptz' })
  consentimentoEm: Date;

  @Column({ name: 'termo_versao', type: 'varchar', length: 20 })
  termoVersao: string;

  @Column({ name: 'anonimizado_em', type: 'timestamptz', nullable: true })
  anonimizadoEm: Date | null;

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

  @OneToMany(() => UsuarioDiretoria, (vinculo) => vinculo.usuario)
  vinculos: UsuarioDiretoria[];

  @OneToMany(() => UsuarioDiretoria, (vinculo) => vinculo.decididoPor)
  vinculosDecididos: UsuarioDiretoria[];

  @OneToMany(() => Socio, (socio) => socio.usuario)
  associacoes: Socio[];

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos: Pedido[];

  @OneToMany(() => Participacao, (participacao) => participacao.usuario)
  participacoes: Participacao[];
}
