import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentoDuplicadoException } from '../../common/exceptions/documento-duplicado.exception';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { TipoVinculo } from './enums/tipo-vinculo.enum';

interface MockUsuarioRepository {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockRepository: MockUsuarioRepository;

  // Cria um dublê das funções do banco de dados
  const mockUsuarioRepository: MockUsuarioRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuarioRepository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    mockRepository = module.get<MockUsuarioRepository>(getRepositoryToken(Usuario));
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpa a memória entre um teste e outro
  });

  describe('criarUsuarioBase', () => {
    const dtoBase = {
      tipoVinculo: TipoVinculo.ESTUDANTE,
      email: 'teste@atlus.test',
      senha: 'senha123',
      nome: 'Usuário Teste',
      rga: '1234567890',
      termoVersao: '1.0',
    };

    it('deve lançar DocumentoDuplicadoException se o email já estiver cadastrado', async () => {
      // Simula que o e-mail já existe no banco apenas para esta chamada
      mockRepository.findOne.mockResolvedValueOnce({ id: 'id-existente' });

      // Valida o tipo de erro e mensagem conforme regra das seções 4 e 5
      await expect(service.criarUsuarioBase(dtoBase)).rejects.toThrow(
        new DocumentoDuplicadoException('Email já cadastrado'),
      );
    });

    it('deve criar um estudante com sucesso e retornar a entidade persistida', async () => {
      // Força o banco falso a não achar conflitos
      mockRepository.findOne.mockResolvedValue(null);

      // Simula o retorno do banco ao salvar
      const usuarioSalvo = {
        id: 'uuid-123',
        ...dtoBase,
        senhaHash: 'hash_falso',
        cpfCifrado: null,
      };

      mockRepository.create.mockReturnValue(usuarioSalvo);
      mockRepository.save.mockResolvedValue(usuarioSalvo);

      const resultado = await service.criarUsuarioBase(dtoBase);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: dtoBase.email },
      });
      expect(mockRepository.save).toHaveBeenCalled();

      // O Service retorna a Entidade bruta — a blindagem de saída (omissão de
      // senhaHash/cpfCifrado) é responsabilidade do Controller via plainToInstance.
      // Teste de blindagem está no e2e spec (usuarios.e2e-spec.ts).
      expect(resultado.id).toBe('uuid-123');
      expect(resultado.email).toBe(dtoBase.email);
    });
  });
});

