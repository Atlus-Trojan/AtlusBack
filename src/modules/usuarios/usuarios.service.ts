import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Usuario } from './entities/usuario.entity';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { TipoVinculo } from './enums/tipo-vinculo.enum';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  // Remove o retorno Promise<Usuario> para não prometer a Entidade bruta
  async criarUsuarioBase(criarUsuarioDto: CriarUsuarioDto) {
    const { email, senha, nome, tipoVinculo, termoVersao, rga, cpf } = criarUsuarioDto;

    // 1. Auditoria de E-mail
    const usuarioExistente = await this.usuarioRepository.findOne({ where: { email } });
    if (usuarioExistente) {
      throw new ConflictException('Email já cadastrado');
    }

    let cpfHash: string | null = null;
    let cpfCifrado: Buffer | null = null;

    // 2. Processamento de Documentos e Validação de Duplicidade
    if (tipoVinculo === TipoVinculo.ESTUDANTE && rga) {
      const rgaExistente = await this.usuarioRepository.findOne({ where: { rga } });
      if (rgaExistente) throw new ConflictException('RGA já cadastrado');
    } 
    else if (tipoVinculo === TipoVinculo.NAO_ESTUDANTE && cpf) {
      // O banco exige char(64) para a unicidade do CPF
      cpfHash = crypto.createHash('sha256').update(cpf).digest('hex');
      
      const cpfExistente = await this.usuarioRepository.findOne({ where: { cpfHash } });
      if (cpfExistente) throw new ConflictException('CPF já cadastrado');

      // (Stub temporário): A cifra AES-256 real exigirá uma chave no .env futuro.
      // Uso de Buffer para satisfazer a constraint NOT NULL do banco.
      cpfCifrado = Buffer.from(cpf, 'utf8');
    }

    // 3. Segurança da Senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // 4. Montagem da Entidade
    const novoUsuario = this.usuarioRepository.create({
      email,
      senhaHash,
      nome,
      tipoVinculo,
      termoVersao,
      rga: tipoVinculo === TipoVinculo.ESTUDANTE ? rga : null,
      cpfHash,
      cpfCifrado,
      consentimentoEm: new Date(),
    });

    // 5. Persistência
    const usuarioSalvo = await this.usuarioRepository.save(novoUsuario);

    // 6. Blindagem de Saída (Exclui dados sensíveis antes de retornar)
    const { senhaHash: _, cpfCifrado: __, ...usuarioLimpo } = usuarioSalvo;
    
    return usuarioLimpo;
  }
}