import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateDiretoriaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  @Min(0, { message: 'Desconto mínimo é 0%' })
  @Max(100, { message: 'Desconto máximo é 100%' })
  descontoSocio?: number;

  @IsOptional()
  @IsBoolean()
  exigeAprovacao?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
