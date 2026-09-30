import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UsuariosController } from './../src/modules/usuarios/usuarios.controller';
import { UsuariosService } from './../src/modules/usuarios/usuarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './../src/modules/usuarios/entities/usuario.entity';
import { CriarUsuarioDto } from './../src/modules/usuarios/dto/criar-usuario.dto';

describe('UsuariosController (e2e)', () => {
  let app: INestApplication;

  const mockUsuarioRepository = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto: CriarUsuarioDto) => ({
      id: 'mock-id-1234',
      ...dto,
    })),
    save: jest.fn().mockImplementation((usuario: Usuario) => Promise.resolve(usuario)),
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

    app = moduleFixture.createNestApplication();
    // Ativa o pipe idêntico ao do main.ts para o teste ser fiel à realidade
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/usuarios (POST) - Deve retornar 400 se faltarem dados obrigatórios', () => {
    return request(app.getHttpServer())
      .post('/usuarios')
      .send({ nome: 'Incompleto' }) // Sem email, senha, etc.
      .expect(400)
      .expect((res) => {
        expect((res.body as { message: string }).message).toContain('Campo obrigatório ausente');
      });
  });

  it('/usuarios (POST) - Deve criar um usuário estudante e retornar 201', () => {
    const novoEstudante = {
      tipoVinculo: 'ESTUDANTE',
      rga: `RGA-TESTE-${Date.now()}`, // Usa Date.now() para garantir RGA único no teste
      email: `teste-${Date.now()}@atlus.test`, // E-mail único
      senha: 'senha_valida_123',
      nome: 'Usuário Teste Automatizado',
      termoVersao: '1.0',
    };

    return request(app.getHttpServer())
      .post('/usuarios')
      .send(novoEstudante)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect((res.body as { email: string }).email).toBe(novoEstudante.email);
        // Garante que a senha não vazou na resposta
        expect(res.body).not.toHaveProperty('senhaHash');
      });
  });
});
