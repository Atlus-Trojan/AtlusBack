import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsuariosController } from './../src/modules/usuarios/usuarios.controller';
import { UsuariosService } from './../src/modules/usuarios/usuarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './../src/modules/usuarios/entities/usuario.entity';
import { DomainExceptionFilter } from './../src/common/exceptions/domain-exception.filter';

interface UsuarioResponseHttp {
  id: string;
  email: string;
  nome: string;
  senhaHash?: string;
  cpfHash?: string;
  cpfCifrado?: unknown;
}

describe('UsuariosController (e2e)', () => {
  let app: INestApplication<App>;

  // O mock simula o banco retornando a entidade bruta (com campos sensíveis
  // presentes). O Controller deve omiti-los via plainToInstance antes de
  // enviar a resposta — esse é o comportamento que o teste valida.
  const mockUsuarioRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto: Partial<Usuario>) => ({
      id: 'mock-id-1234',
      senhaHash: 'hash_nunca_deve_aparecer',
      cpfHash: null,
      cpfCifrado: null,
      ativo: true,
      consentimentoEm: new Date(),
      criadoEm: new Date(),
      ...dto,
    })),
    save: jest
      .fn()
      .mockImplementation((usuario: Usuario) => Promise.resolve(usuario)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuarioRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<INestApplication<App>>();
    // Registra os mesmos pipes e filtros do main.ts para o teste ser fiel
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/usuarios (POST) - Deve retornar 400 se faltarem dados obrigatórios', () => {
    return request(app.getHttpServer())
      .post('/usuarios')
      .send({ nome: 'Incompleto' }) // Sem email, senha, etc.
      .expect(400);
  });

  it('/usuarios (POST) - Deve criar um usuário estudante, retornar 201 e não vazar dados sensíveis', () => {
    const novoEstudante = {
      tipoVinculo: 'ESTUDANTE',
      rga: `RGA-TESTE-${Date.now()}`,
      email: `teste-${Date.now()}@atlus.test`,
      senha: 'senha_valida_123',
      nome: 'Usuário Teste Automatizado',
      termoVersao: '1.0',
    };

    return request(app.getHttpServer())
      .post('/usuarios')
      .send(novoEstudante)
      .expect(201)
      .expect((res: { body: UsuarioResponseHttp }) => {
        const body = res.body;

        // Campos públicos obrigatórios devem estar presentes
        expect(body).toHaveProperty('id');
        expect(body.email).toBe(novoEstudante.email);
        expect(body.nome).toBe(novoEstudante.nome);

        // Campos sensíveis NUNCA devem aparecer na resposta HTTP
        expect(body.senhaHash).toBeUndefined();
        expect(body.cpfHash).toBeUndefined();
        expect(body.cpfCifrado).toBeUndefined();
        expect(body).not.toHaveProperty('senhaHash');
        expect(body).not.toHaveProperty('cpfHash');
        expect(body).not.toHaveProperty('cpfCifrado');
      });
  });
});
