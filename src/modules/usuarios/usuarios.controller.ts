import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criarUsuario(
    @Body() criarUsuarioDto: CriarUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    // O Service executa as regras de negócio e retorna a Entidade bruta.
    // A transformação para o shape de saída (DTO público) é responsabilidade
    // exclusiva do Controller — o Service permanece 100% agnóstico de HTTP e
    // de formato de apresentação.
    const entidade =
      await this.usuariosService.criarUsuarioBase(criarUsuarioDto);

    // excludeExtraneousValues: true garante que apenas os campos decorados com
    // @Expose() no UsuarioResponseDto sejam incluídos na resposta,
    // eliminando qualquer risco de vazamento de dados sensíveis.
    return plainToInstance(UsuarioResponseDto, entidade, {
      excludeExtraneousValues: true,
    });
  }
}
