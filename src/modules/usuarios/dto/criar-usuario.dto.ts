import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, ValidateIf } from 'class-validator';
import { TipoVinculo } from '../enums/tipo-vinculo.enum';

export class CriarUsuarioDto {
  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsEnum(TipoVinculo, { message: 'Tipo de vínculo inválido' })
  tipoVinculo!: TipoVinculo;

  // Garante que o CPF seja exigido para não-estudantes
  @ValidateIf((o: CriarUsuarioDto) => o.tipoVinculo === TipoVinculo.NAO_ESTUDANTE)
  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsString()
  cpf?: string;

  // Garante que o RGA seja exigido para estudantes
  @ValidateIf((o: CriarUsuarioDto) => o.tipoVinculo === TipoVinculo.ESTUDANTE)
  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsString()
  rga?: string;

  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email!: string;

  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha!: string;

  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsString()
  nome!: string;

  @IsNotEmpty({ message: 'Campo obrigatório ausente' })
  @IsString()
  termoVersao!: string;
}