import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { TipoVinculo } from './enums/tipo-vinculo.enum';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockRepository: any;

  // Cria um dublê das funções do banco de dados
  const mockUsuarioRepository = {
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
    mockRepository = module.get(getRepositoryToken(Usuario));
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

    it('deve lançar ConflictException se o email já estiver cadastrado', async () => {
      // Simula que o e-mail já existe no banco apenas para esta chamada
      mockRepository.findOne.mockResolvedValueOnce({ id: 'id-existente' });

      // Valida o tipo de erro e a mensagem exata na mesma asserção
      await expect(service.criarUsuarioBase(dtoBase)).rejects.toThrow(
        new ConflictException('Email já cadastrado')
      );
    });
    
    it('deve criar um estudante com sucesso e não retornar dados sensíveis', async () => {
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
      
      // Valida a regra de blindagem
      expect(resultado).not.toHaveProperty('senhaHash');
      expect(resultado).not.toHaveProperty('cpfCifrado');
      expect(resultado.id).toBe('uuid-123');
    });
  });
});