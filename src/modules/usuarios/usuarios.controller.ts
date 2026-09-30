import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // Garante o retorno 201
  async criarUsuario(@Body() criarUsuarioDto: CriarUsuarioDto) {
    // 1. O NestJS executa o DTO automaticamente antes de chegar aqui (disparando o 400 se faltar algo)
    // 2. Chama o Service, que faz a auditoria de duplicidade (409) e o hash da senha
    // 3. Retorna o objeto limpo (sem senha e CPF cifrado) para o cliente
    return await this.usuariosService.criarUsuarioBase(criarUsuarioDto);
  }
}