import assert from 'node:assert/strict';
import { QueryRunner } from 'typeorm';
import dataSource from './data-source';

const expectedColumns: Record<string, Record<string, string>> = {
  diretorias: {
    id: 'uuid',
    nome: 'character varying(120)',
    email: 'citext',
    desconto_socio: 'numeric(5,2)',
    exige_aprovacao: 'boolean',
    ativo: 'boolean',
    criado_em: 'timestamp with time zone',
    atualizado_em: 'timestamp with time zone',
  },
  cursos: {
    id: 'uuid',
    codigo: 'character varying(20)',
    nome: 'character varying(120)',
    diretoria_id: 'uuid',
    criado_em: 'timestamp with time zone',
    atualizado_em: 'timestamp with time zone',
  },
  usuarios: {
    id: 'uuid',
    tipo_vinculo: 'tipo_vinculo',
    rga: 'character varying(20)',
    cpf_hash: 'character(64)',
    cpf_cifrado: 'bytea',
    email: 'citext',
    email_verificado_em: 'timestamp with time zone',
    senha_hash: 'character varying(72)',
    nome: 'character varying(150)',
    ativo: 'boolean',
    consentimento_em: 'timestamp with time zone',
    termo_versao: 'character varying(20)',
    anonimizado_em: 'timestamp with time zone',
    criado_em: 'timestamp with time zone',
    atualizado_em: 'timestamp with time zone',
  },
  usuario_diretoria: {
    id: 'uuid',
    usuario_id: 'uuid',
    diretoria_id: 'uuid',
    papel: 'papel_atletica',
    status: 'status_vinculo',
    principal: 'boolean',
    decidido_por_id: 'uuid',
    decidido_em: 'timestamp with time zone',
    criado_em: 'timestamp with time zone',
  },
  socios: {
    id: 'uuid',
    usuario_id: 'uuid',
    diretoria_id: 'uuid',
    valido_de: 'date',
    valido_ate: 'date',
    ativo: 'boolean',
    criado_em: 'timestamp with time zone',
    atualizado_em: 'timestamp with time zone',
  },
  produtos: {
    id: 'uuid',
    diretoria_id: 'uuid',
    nome: 'character varying(150)',
    descricao: 'text',
    preco: 'numeric(10,2)',
    estoque: 'integer',
    imagem_url: 'text',
    ativo: 'boolean',
    versao: 'integer',
    criado_em: 'timestamp with time zone',
    atualizado_em: 'timestamp with time zone',
  },
  pedidos: {
    id: 'uuid',
    diretoria_id: 'uuid',
    usuario_id: 'uuid',
    status: 'status_pedido',
    papel_aplicado: 'role',
    desconto_percentual: 'numeric(5,2)',
    subtotal: 'numeric(10,2)',
    desconto_valor: 'numeric(10,2)',
    total: 'numeric(10,2)',
    cancelado_em: 'timestamp with time zone',
    criado_em: 'timestamp with time zone',
  },
  itens_pedido: {
    id: 'uuid',
    pedido_id: 'uuid',
    diretoria_id: 'uuid',
    produto_id: 'uuid',
    produto_nome: 'character varying(150)',
    quantidade: 'integer',
    preco_unitario: 'numeric(10,2)',
    preco_unitario_final: 'numeric(10,2)',
  },
  eventos: {
    id: 'uuid',
    diretoria_id: 'uuid',
    nome: 'character varying(150)',
    descricao: 'text',
    data_hora: 'timestamp with time zone',
    local: 'character varying(200)',
    preco_base: 'numeric(10,2)',
    vagas: 'integer',
    vagas_ocupadas: 'integer',
    banner_url: 'text',
    ativo: 'boolean',
    criado_em: 'timestamp with time zone',
    atualizado_em: 'timestamp with time zone',
  },
  participacoes: {
    id: 'uuid',
    evento_id: 'uuid',
    usuario_id: 'uuid',
    status: 'status_participacao',
    papel_aplicado: 'role',
    preco_base: 'numeric(10,2)',
    desconto_percentual: 'numeric(5,2)',
    preco_final: 'numeric(10,2)',
    cancelado_em: 'timestamp with time zone',
    criado_em: 'timestamp with time zone',
  },
};

const expectedEnums: Record<string, string[]> = {
  tipo_vinculo: ['ESTUDANTE', 'NAO_ESTUDANTE'],
  papel_atletica: ['DIRETORIA', 'MEMBRO'],
  status_vinculo: ['PENDENTE', 'ATIVO', 'REJEITADO'],
  role: ['DIRETORIA', 'SOCIO', 'ALUNO'],
  status_pedido: ['CONFIRMADO', 'CANCELADO'],
  status_participacao: ['CONFIRMADA', 'CANCELADA'],
};

const expectedIndexes = [
  'idx_cursos_diretoria',
  'idx_eventos_diretoria_data',
  'idx_itens_pedido_pedido',
  'idx_itens_pedido_produto',
  'idx_participacoes_usuario_data',
  'idx_pedidos_diretoria_data',
  'idx_pedidos_usuario_data',
  'idx_produtos_diretoria_ativo',
  'idx_socios_diretoria',
  'idx_usuario_diretoria_fila',
  'uq_cursos_codigo',
  'uq_diretorias_email',
  'uq_participacoes_evento_usuario',
  'uq_usuario_diretoria_principal',
  'uq_usuarios_cpf_hash',
  'uq_usuarios_email',
  'uq_usuarios_rga',
];

const expectedConstraints = [
  'chk_diretorias_desconto',
  'chk_eventos_ocupadas',
  'chk_eventos_preco',
  'chk_eventos_vagas',
  'chk_itens_quantidade',
  'chk_itens_valores',
  'chk_participacoes_valores',
  'chk_pedidos_valores',
  'chk_produtos_estoque',
  'chk_produtos_preco',
  'chk_usuarios_documento',
  'fk_cursos_diretoria',
  'fk_eventos_diretoria',
  'fk_itens_pedido_pedido',
  'fk_itens_pedido_produto',
  'fk_participacoes_evento',
  'fk_participacoes_usuario',
  'fk_pedidos_diretoria',
  'fk_pedidos_usuario',
  'fk_produtos_diretoria',
  'fk_socios_diretoria',
  'fk_socios_usuario',
  'fk_socios_usuario_diretoria',
  'fk_usuario_diretoria_decidido_por',
  'fk_usuario_diretoria_diretoria',
  'fk_usuario_diretoria_usuario',
  'uq_pedidos_id_diretoria',
  'uq_produtos_id_diretoria',
  'uq_socios_usuario_diretoria',
  'uq_usuario_diretoria_usuario_diretoria',
];

function sorted(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

async function queryRows<T extends Record<string, unknown>>(
  query: string,
  parameters: unknown[] = [],
): Promise<T[]> {
  const result: unknown = await dataSource.query(query, parameters);
  assert.ok(
    Array.isArray(result),
    'A consulta ao catálogo deve retornar uma lista',
  );
  return result as T[];
}

async function validateCatalog(): Promise<void> {
  const tableNames = Object.keys(expectedColumns);
  const tables = await queryRows<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       AND table_name <> 'migrations'
     ORDER BY table_name`,
  );

  assert.deepEqual(
    tables.map(({ table_name }) => table_name),
    sorted(tableNames),
    'A lista de tabelas diverge do documento',
  );

  const columns = await queryRows<{
    table_name: string;
    column_name: string;
    data_type: string;
  }>(
    `SELECT c.relname AS table_name,
            a.attname AS column_name,
            format_type(a.atttypid, a.atttypmod) AS data_type
     FROM pg_attribute a
     JOIN pg_class c ON c.oid = a.attrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = ANY($1::text[])
       AND a.attnum > 0
       AND NOT a.attisdropped
     ORDER BY c.relname, a.attnum`,
    [tableNames],
  );

  const actualColumns: Record<string, Record<string, string>> = {};
  for (const column of columns) {
    actualColumns[column.table_name] ??= {};
    actualColumns[column.table_name][column.column_name] = column.data_type;
  }
  assert.deepEqual(
    actualColumns,
    expectedColumns,
    'Colunas ou tipos divergem do documento',
  );

  const enums = await queryRows<{ enum_name: string; enum_value: string }>(
    `SELECT t.typname AS enum_name, e.enumlabel AS enum_value
     FROM pg_type t
     JOIN pg_enum e ON e.enumtypid = t.oid
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
       AND t.typname = ANY($1::text[])
     ORDER BY t.typname, e.enumsortorder`,
    [Object.keys(expectedEnums)],
  );

  const actualEnums: Record<string, string[]> = {};
  for (const entry of enums) {
    actualEnums[entry.enum_name] ??= [];
    actualEnums[entry.enum_name].push(entry.enum_value);
  }
  assert.deepEqual(actualEnums, expectedEnums, 'Enums divergem do documento');

  const indexes = await queryRows<{ indexname: string }>(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname = ANY($1::text[])
     ORDER BY indexname`,
    [expectedIndexes],
  );
  assert.deepEqual(
    indexes.map(({ indexname }) => indexname),
    sorted(expectedIndexes),
    'Índices esperados não foram encontrados',
  );

  const constraints = await queryRows<{ conname: string }>(
    `SELECT conname
     FROM pg_constraint
     WHERE connamespace = 'public'::regnamespace
       AND conname = ANY($1::text[])
     ORDER BY conname`,
    [expectedConstraints],
  );
  assert.deepEqual(
    constraints.map(({ conname }) => conname),
    sorted(expectedConstraints),
    'Constraints esperadas não foram encontradas',
  );

  const partialIndexes = await queryRows<{
    indexname: string;
    indexdef: string;
  }>(
    `SELECT indexname, indexdef
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname IN ('uq_usuario_diretoria_principal', 'uq_participacoes_evento_usuario')
     ORDER BY indexname`,
  );
  assert.equal(
    partialIndexes.length,
    2,
    'Os dois índices únicos parciais são obrigatórios',
  );
  for (const index of partialIndexes) {
    assert.match(index.indexdef, /UNIQUE INDEX/i);
    assert.match(index.indexdef, /WHERE/i);
  }
}

async function expectSqlState(
  queryRunner: QueryRunner,
  sqlState: string,
  query: string,
  parameters: unknown[] = [],
): Promise<void> {
  await queryRunner.query('SAVEPOINT schema_validation_case');
  try {
    await queryRunner.query(query, parameters);
    assert.fail(`A consulta deveria falhar com SQLSTATE ${sqlState}`);
  } catch (error) {
    const receivedCode =
      (error as { code?: string; driverError?: { code?: string } }).driverError
        ?.code ?? (error as { code?: string }).code;
    assert.equal(receivedCode, sqlState, `SQLSTATE inesperado para: ${query}`);
  } finally {
    await queryRunner.query('ROLLBACK TO SAVEPOINT schema_validation_case');
    await queryRunner.query('RELEASE SAVEPOINT schema_validation_case');
  }
}

async function insertUsuario(
  queryRunner: QueryRunner,
  suffix: string,
): Promise<string> {
  const [usuario] = (await queryRunner.query(
    `INSERT INTO usuarios
      (tipo_vinculo, rga, email, senha_hash, nome, consentimento_em, termo_versao)
     VALUES ('ESTUDANTE', $1, $2, 'hash', $3, now(), '1.0')
     RETURNING id`,
    [`RGA-${suffix}`, `usuario-${suffix}@atlus.test`, `Usuário ${suffix}`],
  )) as Array<{ id: string }>;
  return usuario.id;
}

async function validateIntegrity(): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const [diretoriaA] = (await queryRunner.query(
      `INSERT INTO diretorias (nome, email, desconto_socio)
       VALUES ('Diretoria A', 'diretoria-a@atlus.test', 10)
       RETURNING id`,
    )) as Array<{ id: string }>;
    const [diretoriaB] = (await queryRunner.query(
      `INSERT INTO diretorias (nome, email, desconto_socio)
       VALUES ('Diretoria B', 'diretoria-b@atlus.test', 5)
       RETURNING id`,
    )) as Array<{ id: string }>;

    await expectSqlState(
      queryRunner,
      '23514',
      `INSERT INTO diretorias (nome, email, desconto_socio)
       VALUES ('Inválida', 'invalida@atlus.test', 101)`,
    );
    await expectSqlState(
      queryRunner,
      '23505',
      `INSERT INTO diretorias (nome, email)
       VALUES ('Duplicada', 'DIRETORIA-A@ATLUS.TEST')`,
    );
    await expectSqlState(
      queryRunner,
      '23514',
      `INSERT INTO usuarios
        (tipo_vinculo, email, senha_hash, nome, consentimento_em, termo_versao)
       VALUES ('ESTUDANTE', 'sem-rga@atlus.test', 'hash', 'Sem RGA', now(), '1.0')`,
    );

    const usuarioA = await insertUsuario(queryRunner, 'A');
    const usuarioB = await insertUsuario(queryRunner, 'B');
    const usuarioDecisor = await insertUsuario(queryRunner, 'DECISOR');

    await queryRunner.query(
      `INSERT INTO usuario_diretoria
        (usuario_id, diretoria_id, papel, status, principal)
       VALUES ($1, $2, 'DIRETORIA', 'ATIVO', true)`,
      [usuarioA, diretoriaA.id],
    );
    await expectSqlState(
      queryRunner,
      '23505',
      `INSERT INTO usuario_diretoria
        (usuario_id, diretoria_id, papel, status, principal)
       VALUES ($1, $2, 'MEMBRO', 'ATIVO', true)`,
      [usuarioA, diretoriaB.id],
    );
    await queryRunner.query(
      `INSERT INTO usuario_diretoria
        (usuario_id, diretoria_id, papel, status, principal, decidido_por_id)
       VALUES ($1, $2, 'MEMBRO', 'ATIVO', false, $3)`,
      [usuarioA, diretoriaB.id, usuarioDecisor],
    );
    await queryRunner.query('DELETE FROM usuarios WHERE id = $1', [
      usuarioDecisor,
    ]);
    const [decisao] = (await queryRunner.query(
      `SELECT decidido_por_id
       FROM usuario_diretoria
       WHERE usuario_id = $1 AND diretoria_id = $2`,
      [usuarioA, diretoriaB.id],
    )) as Array<{ decidido_por_id: string | null }>;
    assert.equal(
      decisao.decidido_por_id,
      null,
      'ON DELETE SET NULL não foi aplicado',
    );

    await expectSqlState(
      queryRunner,
      '23503',
      `INSERT INTO socios (usuario_id, diretoria_id)
       VALUES ($1, $2)`,
      [usuarioB, diretoriaA.id],
    );
    await queryRunner.query(
      `INSERT INTO usuario_diretoria
        (usuario_id, diretoria_id, papel, status)
       VALUES ($1, $2, 'MEMBRO', 'ATIVO')`,
      [usuarioB, diretoriaA.id],
    );
    await queryRunner.query(
      `INSERT INTO socios (usuario_id, diretoria_id)
       VALUES ($1, $2)`,
      [usuarioB, diretoriaA.id],
    );
    await queryRunner.query(
      `DELETE FROM usuario_diretoria
       WHERE usuario_id = $1 AND diretoria_id = $2`,
      [usuarioB, diretoriaA.id],
    );
    const [sociosDepoisDoCascade] = (await queryRunner.query(
      `SELECT count(*) AS total FROM socios WHERE usuario_id = $1`,
      [usuarioB],
    )) as Array<{ total: string }>;
    assert.equal(
      sociosDepoisDoCascade.total,
      '0',
      'ON DELETE CASCADE do vínculo falhou',
    );

    const [produtoA] = (await queryRunner.query(
      `INSERT INTO produtos (diretoria_id, nome, preco, estoque, versao)
       VALUES ($1, 'Produto A', 100, 5, 1)
       RETURNING id`,
      [diretoriaA.id],
    )) as Array<{ id: string }>;
    const [produtoB] = (await queryRunner.query(
      `INSERT INTO produtos (diretoria_id, nome, preco, estoque, versao)
       VALUES ($1, 'Produto B', 50, 5, 1)
       RETURNING id`,
      [diretoriaB.id],
    )) as Array<{ id: string }>;
    await expectSqlState(
      queryRunner,
      '23514',
      `INSERT INTO produtos (diretoria_id, nome, preco, estoque, versao)
       VALUES ($1, 'Estoque inválido', 10, -1, 1)`,
      [diretoriaA.id],
    );

    const [pedido] = (await queryRunner.query(
      `INSERT INTO pedidos
        (diretoria_id, usuario_id, papel_aplicado, desconto_percentual,
         subtotal, desconto_valor, total)
       VALUES ($1, $2, 'DIRETORIA', 10, 100, 10, 90)
       RETURNING id`,
      [diretoriaA.id, usuarioA],
    )) as Array<{ id: string }>;
    await expectSqlState(
      queryRunner,
      '23503',
      `INSERT INTO itens_pedido
        (pedido_id, diretoria_id, produto_id, produto_nome, quantidade,
         preco_unitario, preco_unitario_final)
       VALUES ($1, $2, $3, 'Produto B', 1, 50, 45)`,
      [pedido.id, diretoriaA.id, produtoB.id],
    );
    const [item] = (await queryRunner.query(
      `INSERT INTO itens_pedido
        (pedido_id, diretoria_id, produto_id, produto_nome, quantidade,
         preco_unitario, preco_unitario_final)
       VALUES ($1, $2, $3, 'Produto A', 1, 100, 90)
       RETURNING id`,
      [pedido.id, diretoriaA.id, produtoA.id],
    )) as Array<{ id: string }>;
    await expectSqlState(
      queryRunner,
      '23503',
      'DELETE FROM produtos WHERE id = $1',
      [produtoA.id],
    );
    await queryRunner.query('DELETE FROM pedidos WHERE id = $1', [pedido.id]);
    const [itemDepoisDoCascade] = (await queryRunner.query(
      'SELECT count(*) AS total FROM itens_pedido WHERE id = $1',
      [item.id],
    )) as Array<{ total: string }>;
    assert.equal(
      itemDepoisDoCascade.total,
      '0',
      'ON DELETE CASCADE do pedido falhou',
    );

    const [evento] = (await queryRunner.query(
      `INSERT INTO eventos
        (diretoria_id, nome, data_hora, preco_base, vagas, vagas_ocupadas)
       VALUES ($1, 'Evento A', now(), 100, 1, 0)
       RETURNING id`,
      [diretoriaA.id],
    )) as Array<{ id: string }>;
    await expectSqlState(
      queryRunner,
      '23514',
      `INSERT INTO eventos
        (diretoria_id, nome, data_hora, preco_base, vagas, vagas_ocupadas)
       VALUES ($1, 'Lotação inválida', now(), 10, 1, 2)`,
      [diretoriaA.id],
    );

    await queryRunner.query(
      `INSERT INTO participacoes
        (evento_id, usuario_id, papel_aplicado, preco_base,
         desconto_percentual, preco_final)
       VALUES ($1, $2, 'DIRETORIA', 100, 10, 90)`,
      [evento.id, usuarioA],
    );
    await expectSqlState(
      queryRunner,
      '23505',
      `INSERT INTO participacoes
        (evento_id, usuario_id, papel_aplicado, preco_base,
         desconto_percentual, preco_final)
       VALUES ($1, $2, 'DIRETORIA', 100, 10, 90)`,
      [evento.id, usuarioA],
    );
    await queryRunner.query(
      `INSERT INTO participacoes
        (evento_id, usuario_id, status, papel_aplicado, preco_base,
         desconto_percentual, preco_final, cancelado_em)
       VALUES ($1, $2, 'CANCELADA', 'DIRETORIA', 100, 10, 90, now())`,
      [evento.id, usuarioA],
    );

    await expectSqlState(
      queryRunner,
      '23503',
      'DELETE FROM usuarios WHERE id = $1',
      [usuarioA],
    );
    await expectSqlState(
      queryRunner,
      '23503',
      'DELETE FROM diretorias WHERE id = $1',
      [diretoriaA.id],
    );
  } finally {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await validateCatalog();
    await validateIntegrity();
    process.stdout.write(
      'Schema validado: 10 tabelas, 6 enums, índices, constraints e regras de integridade.\n',
    );
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
