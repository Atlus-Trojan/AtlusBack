import { Expose } from 'class-transformer';

/**
 * DTO de saída da criação de usuário.
 *
 * Contém apenas as propriedades públicas e seguras que podem ser expostas ao
 * cliente. Campos sensíveis (senhaHash, cpfHash, cpfCifrado) nunca aparecem
 * aqui — eles estão marcados com @Exclude() na entidade e nunca são declarados
 * neste DTO, garantindo dupla proteção contra vazamento.
 *
 * Transformação: plainToInstance(UsuarioResponseDto, entidade, { excludeExtraneousValues: true })
 */
export class UsuarioResponseDto {
  @Expose()
  id!: string;

  @Expose()
  nome!: string;

  @Expose()
  email!: string;

  @Expose()
  tipoVinculo!: string;

  @Expose()
  ativo!: boolean;

  @Expose()
  termoVersao!: string;

  @Expose()
  consentimentoEm!: Date;

  @Expose()
  criadoEm!: Date;
}
