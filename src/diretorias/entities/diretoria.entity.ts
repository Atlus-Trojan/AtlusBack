import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('diretorias')
@Check('chk_diretorias_desconto', '"desconto_socio" BETWEEN 0 AND 100')
export class Diretoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'citext', unique: true })
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

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;
}
