### [Sprint 1] Configurar backend NestJS containerizado no Render
<!-- sdd-bot:meta id="BL-001" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-57" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Inicializar projeto NestJS com estrutura modular padrão (AppModule, main.ts com ValidationPipe global), criar Dockerfile multi-stage (build e runtime com node:20-alpine), docker-compose.yml para desenvolvimento local com serviço PostgreSQL, e configurar deploy do container no Render apontando para o Dockerfile, expondo a porta 3000 via variável de ambiente PORT.

**Comportamento esperado:**
O endpoint GET /health responde HTTP 200 com corpo {"status":"ok"} tanto ao rodar `docker run` localmente na porta 3000 quanto na URL pública gerada pelo Render após o deploy.

**Critérios de aceite:**
- [ ] Quando o comando `docker build` é executado na raiz do projeto, então a imagem é gerada sem erros e contém o build de produção do NestJS (pasta dist).
- [ ] Quando o container é iniciado com `docker run -p 3000:3000`, então GET /health retorna HTTP 200 com {"status":"ok"} em até 5 segundos após o start.
- [ ] Quando a variável de ambiente DATABASE_URL não é fornecida ao container, então a aplicação encerra o processo com código de saída diferente de 0 e loga mensagem de erro indicando a variável ausente.
- [ ] Quando o push é feito na branch configurada no Render, então o serviço realiza o deploy automático e a URL pública responde HTTP 200 em GET /health.

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `PORT`, `DATABASE_URL`, `/health`
- Limites: 5 segundos para health check responder após start do container
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-57 (ver requirements.json)

---

### [Sprint 1] Criar controllers REST dos módulos de negócio
<!-- sdd-bot:meta id="BL-002" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-58" dependsOn="REQ-57" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-57

**Descrição:**
Implementar os controllers AuthController, DiretoriasController, SociosController, LojaController, EventosController e AtleticaController como classes decoradas com @Controller() no NestJS, cada um em seu respectivo módulo (AuthModule, DiretoriasModule, SociosModule, LojaModule, EventosModule, AtleticaModule), registrando rotas HTTP básicas (mínimo GET de listagem) e delegando a lógica para os services correspondentes, sem lógica de negócio no controller.

**Comportamento esperado:**
Cada endpoint raiz dos 6 módulos (ex.: GET /auth, GET /diretorias, GET /socios, GET /loja, GET /eventos, GET /atletica) responde HTTP 200 com um array JSON (vazio ou populado), sem lançar exceção 500.

**Critérios de aceite:**
- [ ] Quando uma requisição GET é feita para /diretorias, então a resposta é HTTP 200 com Content-Type application/json e corpo do tipo array.
- [ ] Quando os 6 módulos (Auth, Diretorias, Socios, Loja, Eventos, Atletica) são registrados no AppModule, então a rota GET /health e as 6 rotas raiz aparecem no log de bootstrap do NestJS (RouterExplorer).
- [ ] Quando uma requisição é feita para um endpoint inexistente como GET /naoexiste, então a resposta é HTTP 404 com corpo JSON contendo o campo "message".
- [ ] Quando um controller recebe uma requisição, então ele não executa nenhuma query ou regra de negócio diretamente, delegando a chamada ao service injetado via construtor.

**Especificidade técnica:**
- Códigos HTTP: 200, 404
- Campos: `/auth`, `/diretorias`, `/socios`, `/loja`, `/eventos`, `/atletica`
- Precisa de esclarecimento: sim — Não há definição de quais rotas além da listagem (GET) cada controller deve expor nesta sprint (ex.: POST/PUT/DELETE); assumido apenas GET de listagem como escopo mínimo.

**Rastreabilidade:** REQ-58 (ver requirements.json)

---

### [Sprint 1] Implementar services AuthService, LojaService e EventosService
<!-- sdd-bot:meta id="BL-003" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-59" dependsOn="REQ-58" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-58

**Descrição:**
Criar as classes AuthService, LojaService e EventosService decoradas com @Injectable(), registradas nos módulos correspondentes (AuthModule, LojaModule, EventosModule), contendo os métodos de regra de negócio (ex.: AuthService.validateUser, LojaService.findAll, EventosService.findAll) e injetando os repositories via construtor para acesso a dados, mantendo os controllers como camada fina que apenas invoca esses métodos.

**Comportamento esperado:**
O endpoint GET /loja retorna a lista de produtos processada pelo LojaService (aplicando eventuais filtros/ordenação definidos no serviço) e o endpoint GET /eventos retorna a lista de eventos processada pelo EventosService, ambos em HTTP 200 com array JSON.

**Critérios de aceite:**
- [ ] Quando LojaController.findAll() é chamado, então ele delega para LojaService.findAll() e retorna HTTP 200 com array de produtos vindos do repository.
- [ ] Quando EventosService.findAll() é chamado sem eventos cadastrados no banco, então retorna um array vazio [] e o controller responde HTTP 200.
- [ ] Quando AuthService.validateUser recebe credenciais inexistentes no banco, então lança UnauthorizedException e o endpoint correspondente responde HTTP 401 com mensagem "Credenciais inválidas".
- [ ] Quando um teste unitário instancia LojaService com um repository mockado, então é possível verificar que o método do repository foi chamado exatamente uma vez, sem dependência de banco real.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `AuthService.validateUser`, `LojaService.findAll`, `EventosService.findAll`, `message: "Credenciais inválidas"`
- Precisa de esclarecimento: sim — O requisito não especifica as regras de negócio exatas de cada service (ex.: critérios de validação de login, filtros de produtos/eventos); assumido escopo mínimo de listagem e autenticação básica para esta sprint.

**Rastreabilidade:** REQ-59 (ver requirements.json)

---

### [Sprint 1] Implementar repositories TypeORM para entidades do domínio
<!-- sdd-bot:meta id="BL-004" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-64" dependsOn="REQ-57" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-57

**Descrição:**
Configurar o TypeORM no NestJS via TypeOrmModule.forRootAsync com conexão ao PostgreSQL, definir as entidades Diretoria, Usuario e UsuarioDiretoria com decorators @Entity/@Column/@ManyToOne/@OneToMany conforme o modelo de dados inicial, e injetar os Repository<T> correspondentes (via @InjectRepository) nos services, substituindo qualquer acesso direto a query raw por métodos do Repository (find, findOne, save, delete).

**Comportamento esperado:**
Ao executar as migrations, as tabelas diretoria, usuario e usuario_diretoria são criadas no PostgreSQL com as colunas e chaves estrangeiras do modelo, e chamadas como usuarioRepository.save() persistem um registro consultável em seguida via find().

**Critérios de aceite:**
- [ ] Quando as migrations do TypeORM são executadas contra um banco PostgreSQL vazio, então as tabelas diretoria, usuario e usuario_diretoria são criadas com as colunas e foreign keys definidas nas entidades.
- [ ] Quando usuarioRepository.save() é chamado com um objeto Usuario válido, então o registro é persistido e um GET subsequente via usuarioRepository.findOne() retorna o mesmo registro com id gerado.
- [ ] Quando usuarioDiretoriaRepository.save() é chamado referenciando um usuarioId ou diretoriaId inexistente, então o TypeORM lança uma exceção de violação de foreign key e a operação não é persistida.
- [ ] Quando diretoriaRepository.findOne() é chamado com um id que não existe na tabela, então o método retorna null em vez de lançar exceção.
- [ ] Quando dois registros de usuario são salvos com o mesmo valor no campo email (marcado como unique), então o segundo save() lança QueryFailedError de violação de constraint única.

**Especificidade técnica:**
- Campos: `Diretoria`, `Usuario`, `UsuarioDiretoria`, `usuarioRepository.save`, `usuarioRepository.findOne`, `email`
- Precisa de esclarecimento: sim — O requisito não detalha as colunas exatas de cada entidade (tipos, obrigatoriedade, tamanho de campos como email/nome); assumido apenas que email é único em Usuario e que UsuarioDiretoria possui foreign keys para Usuario e Diretoria.

**Rastreabilidade:** REQ-64 (ver requirements.json)

---

### [Sprint 1] Provisionar PostgreSQL 14+ gerenciado no Render
<!-- sdd-bot:meta id="BL-005" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-71" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Provisionar uma instância de banco de dados PostgreSQL versão 14 ou superior utilizando o serviço gerenciado do Render, configurar a connection string (host, porta, usuário, senha, database) como variável de ambiente DATABASE_URL no backend NestJS, e validar a conectividade via TypeORM/Prisma na inicialização da aplicação.

**Comportamento esperado:**
A aplicação NestJS conecta-se ao banco PostgreSQL gerenciado pelo Render ao iniciar, sem erros de conexão nos logs de bootstrap.

**Critérios de aceite:**
- [ ] Quando a variável de ambiente DATABASE_URL contiver as credenciais válidas da instância Render, então a aplicação estabelece conexão ao subir e loga 'Database connected' no console.
- [ ] Quando a versão do PostgreSQL provisionado for consultada via 'SELECT version()', então o resultado deve indicar versão 14.0 ou superior.
- [ ] Quando DATABASE_URL estiver ausente ou mal formatada, então a aplicação deve falhar o bootstrap com erro explícito 'Invalid or missing DATABASE_URL' e código de saída diferente de 0.
- [ ] Quando a conexão com o Render estiver indisponível (timeout de rede), então a aplicação deve registrar erro de conexão nos logs e não iniciar o servidor HTTP.

**Especificidade técnica:**
- Campos: `DATABASE_URL`
- Limites: PostgreSQL 14+
- Precisa de esclarecimento: sim — Não foi especificado se a conexão deve usar SSL obrigatório (comum no Render) nem o ORM exato (TypeORM, Prisma, Sequelize) a ser configurado.

**Rastreabilidade:** REQ-71 (ver requirements.json)

---

### [Sprint 1] Criar migrations das 9 tabelas do modelo de dados
<!-- sdd-bot:meta id="BL-006" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-72" dependsOn="REQ-71" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-71

**Descrição:**
Criar migrations (via TypeORM ou Prisma) que definam as tabelas diretorias, usuarios, usuario_diretoria, socios, produtos, vendas, eventos, participacoes e loja no schema do PostgreSQL, incluindo chaves primárias, chaves estrangeiras entre as tabelas relacionadas (ex.: usuario_diretoria referenciando usuarios e diretorias) e constraints de integridade básicas.

**Comportamento esperado:**
Ao executar as migrations, as 9 tabelas são criadas no banco com suas colunas, tipos e relacionamentos, verificáveis via consulta ao schema information_schema.tables.

**Critérios de aceite:**
- [ ] Quando o comando de migration for executado em um banco vazio, então as 9 tabelas (diretorias, usuarios, usuario_diretoria, socios, produtos, vendas, eventos, participacoes, loja) devem existir no schema public.
- [ ] Quando a tabela usuario_diretoria for consultada, então ela deve conter foreign keys válidas para usuarios.id e diretorias.id.
- [ ] Quando a migration for executada novamente sobre um banco já migrado, então o processo deve ser idempotente e não gerar erro de tabela duplicada.
- [ ] Quando a migration for revertida (rollback), então todas as 9 tabelas devem ser removidas sem deixar constraints órfãs.
- [ ] Quando uma tentativa de inserção violar uma foreign key (ex.: usuario_diretoria com diretoria_id inexistente), então o banco deve rejeitar a operação com erro de violação de chave estrangeira.

**Especificidade técnica:**
- Campos: `diretorias`, `usuarios`, `usuario_diretoria`, `socios`, `produtos`, `vendas`, `eventos`, `participacoes`, `loja`
- Precisa de esclarecimento: sim — Colunas detalhadas de socios, produtos, vendas, eventos, participacoes e loja não foram especificadas neste requisito; apenas a entidade Diretoria (REQ-76) tem campos definidos.

**Rastreabilidade:** REQ-72 (ver requirements.json)

---

### [Sprint 1] Estruturar backend em camadas Controller/Service/Repository
<!-- sdd-bot:meta id="BL-007" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-73" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Organizar o código do backend NestJS em módulos separados por camada: Controllers (recebem requisições HTTP e delegam), Services (contêm lógica de negócio) e Repositories (encapsulam acesso a dados via TypeORM/Prisma), seguindo a estrutura padrão de módulos do NestJS (@Controller, @Injectable para services, e repositórios injetados via DI).

**Comportamento esperado:**
Cada módulo de negócio (ex.: Diretoria, Usuario) possui arquivos separados controller.ts, service.ts e repository.ts (ou equivalente), sem lógica de negócio dentro de controllers nem queries SQL diretas dentro de services.

**Critérios de aceite:**
- [ ] Quando um novo módulo for criado, então ele deve conter no mínimo os arquivos *.controller.ts, *.service.ts e *.module.ts organizados em pasta própria.
- [ ] Quando um controller for inspecionado, então ele não deve conter chamadas diretas ao ORM/repositório, apenas chamadas a métodos do service injetado.
- [ ] Quando um service precisar acessar dados, então ele deve fazer isso exclusivamente através de uma classe repository injetada via construtor (DI do NestJS).
- [ ] Quando a aplicação for iniciada, então o NestJS deve resolver todas as dependências entre camadas sem erros de injeção (ex.: 'Nest can't resolve dependencies').

**Especificidade técnica:**
- Campos: `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.module.ts`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-73 (ver requirements.json)

---

### [Sprint 1] Modelar entidade Diretoria com campos de tenant
<!-- sdd-bot:meta id="BL-008" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-76" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Criar a entidade/classe Diretoria (ex.: diretoria.entity.ts) mapeada para a tabela diretorias no PostgreSQL, com os campos id (chave primária, UUID ou serial), nome (string), email (string), codigoCurso (string), desconto (numeric), ativo (boolean), criadoEm (timestamp, default now) e atualizadoEm (timestamp, atualizado automaticamente).

**Comportamento esperado:**
A entidade Diretoria é persistida na tabela diretorias com todos os 8 campos mapeados, respeitando tipos e valores default definidos.

**Critérios de aceite:**
- [ ] Quando uma Diretoria for criada com nome, email, codigoCurso e desconto válidos, então o registro deve ser salvo com id gerado automaticamente, ativo=true por padrão e criadoEm preenchido com a data/hora atual.
- [ ] Quando uma Diretoria for atualizada, então o campo atualizadoEm deve ser automaticamente atualizado para a data/hora da operação.
- [ ] Quando o campo email for informado em formato inválido (sem '@' ou domínio), então a entidade deve rejeitar a persistência com erro de validação 'email inválido'.
- [ ] Quando o campo desconto for informado como valor negativo, então a operação deve ser rejeitada com erro de validação 'desconto não pode ser negativo'.
- [ ] Quando o campo email já existir em outra Diretoria, então a inserção deve ser rejeitada por violação de constraint UNIQUE, retornando erro de conflito de chave duplicada.

**Especificidade técnica:**
- Campos: `id`, `nome`, `email`, `codigoCurso`, `desconto`, `ativo`, `criadoEm`, `atualizadoEm`
- Precisa de esclarecimento: sim — Não foi especificado o tipo exato do campo desconto (percentual 0-100 ou valor decimal) nem se email deve ter constraint UNIQUE explícita na modelagem.

**Rastreabilidade:** REQ-76 (ver requirements.json)

---

### [Sprint 1] Garantir unicidade de email e codigoCurso em Diretoria
<!-- sdd-bot:meta id="BL-009" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-77" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Adicionar constraint UNIQUE nas colunas email e codigoCurso da tabela diretoria (entidade Diretoria via TypeORM), com decorators @Column({ unique: true }) e migration correspondente criando índices únicos. O DiretoriaService deve capturar a violação de constraint (QueryFailedError, código 23505 do Postgres) na criação/atualização e traduzi-la em uma exceção de domínio.

**Comportamento esperado:**
Ao tentar persistir uma Diretoria com email ou codigoCurso já existentes no banco, a operação é rejeitada antes de gravar duplicidade e a API retorna erro específico ao cliente.

**Critérios de aceite:**
- [ ] Quando POST /diretorias é chamado com email e codigoCurso inéditos, então retorna 201 Created e o registro é persistido.
- [ ] Quando POST /diretorias é chamado com email já cadastrado em outra Diretoria, então retorna 409 Conflict com mensagem 'Email já cadastrado'.
- [ ] Quando POST /diretorias é chamado com codigoCurso já cadastrado em outra Diretoria, então retorna 409 Conflict com mensagem 'Código de curso já cadastrado'.
- [ ] Quando PUT /diretorias/:id é chamado alterando email para um valor já usado por outra Diretoria, então retorna 409 Conflict sem alterar o registro original.
- [ ] Quando a migration é executada em uma tabela diretoria já populada com duplicados, então a migration falha e não é aplicada, preservando o estado anterior.

**Especificidade técnica:**
- Códigos HTTP: 201, 409
- Campos: `email`, `codigoCurso`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-77 (ver requirements.json)

---

### [Sprint 1] Relacionar Diretoria a Usuários como diretoria principal
<!-- sdd-bot:meta id="BL-010" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-80" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Implementar relação @OneToMany na entidade Diretoria apontando para Usuario, e @ManyToOne com foreign key diretoriaPrincipalId na entidade Usuario, criando a coluna e constraint FK na tabela usuario via migration TypeORM. O DiretoriaRepository deve expor método para buscar usuários vinculados por diretoriaPrincipalId.

**Comportamento esperado:**
Um registro de Diretoria pode ser associado a diversos Usuários simultaneamente através do campo diretoriaPrincipalId, e a consulta da Diretoria retorna a lista de usuários vinculados quando solicitada.

**Critérios de aceite:**
- [ ] Quando um Usuario é criado com diretoriaPrincipalId referenciando uma Diretoria existente, então o vínculo é persistido e retornado ao consultar GET /diretorias/:id/usuarios.
- [ ] Quando múltiplos Usuarios são vinculados à mesma Diretoria, então GET /diretorias/:id/usuarios retorna todos eles em um array.
- [ ] Quando um Usuario é criado com diretoriaPrincipalId inexistente, então retorna 400 Bad Request com mensagem 'Diretoria principal não encontrada'.
- [ ] Quando uma Diretoria é excluída e possui Usuarios vinculados como diretoria principal, então a exclusão é bloqueada retornando 409 Conflict com mensagem 'Diretoria possui usuários vinculados'.

**Especificidade técnica:**
- Códigos HTTP: 400, 409
- Campos: `diretoriaPrincipalId`
- Precisa de esclarecimento: sim — Não está definido se a exclusão de Diretoria com usuários vinculados deve ser bloqueada (RESTRICT) ou se deve haver cascade/set null; assumido RESTRICT até confirmação.

**Rastreabilidade:** REQ-80 (ver requirements.json)

---

### [Sprint 1] Relacionar Diretoria a múltiplos registros UsuarioDiretoria
<!-- sdd-bot:meta id="BL-011" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-81" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Implementar relação @OneToMany na entidade Diretoria para UsuarioDiretoria e @ManyToOne inverso em UsuarioDiretoria com foreign key diretoriaId, incluindo migration para criar a coluna e constraint FK na tabela usuario_diretoria. Configurar cascade de leitura via eager/lazy loading conforme uso no UsuarioDiretoriaRepository.

**Comportamento esperado:**
Uma Diretoria pode ter vários registros de UsuarioDiretoria associados, permitindo consultar todos os vínculos usuário-diretoria a partir da entidade Diretoria.

**Critérios de aceite:**
- [ ] Quando um UsuarioDiretoria é criado com diretoriaId referenciando uma Diretoria existente, então o registro é persistido com a FK preenchida.
- [ ] Quando uma Diretoria possui múltiplos registros UsuarioDiretoria, então consultar a Diretoria com relations retorna todos os registros associados em um array.
- [ ] Quando um UsuarioDiretoria é criado com diretoriaId inexistente, então retorna 400 Bad Request com mensagem 'Diretoria não encontrada'.
- [ ] Quando uma Diretoria é excluída e possui registros UsuarioDiretoria associados, então a exclusão é bloqueada retornando 409 Conflict com mensagem 'Diretoria possui vínculos UsuarioDiretoria'.

**Especificidade técnica:**
- Códigos HTTP: 400, 409
- Campos: `diretoriaId`
- Precisa de esclarecimento: sim — Não está definido o comportamento de exclusão da Diretoria (RESTRICT vs CASCADE) para registros UsuarioDiretoria vinculados; assumido RESTRICT até confirmação.

**Rastreabilidade:** REQ-81 (ver requirements.json)

---

### [Sprint 1] Relacionar Diretoria a múltiplos Sócios
<!-- sdd-bot:meta id="BL-012" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-82" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Implementar relação @OneToMany na entidade Diretoria apontando para a entidade Socio e @ManyToOne inverso em Socio com foreign key diretoriaId, incluindo migration para criar a coluna e constraint FK na tabela socio. Expor método no DiretoriaRepository/SocioRepository para buscar Sócios por diretoriaId.

**Comportamento esperado:**
Uma Diretoria pode ter vários Sócios associados, permitindo consultar todos os Sócios vinculados a partir da entidade Diretoria.

**Critérios de aceite:**
- [ ] Quando um Socio é criado com diretoriaId referenciando uma Diretoria existente, então o registro é persistido com a FK preenchida.
- [ ] Quando uma Diretoria possui múltiplos Sócios, então GET /diretorias/:id/socios retorna todos eles em um array.
- [ ] Quando um Socio é criado com diretoriaId inexistente, então retorna 400 Bad Request com mensagem 'Diretoria não encontrada'.
- [ ] Quando uma Diretoria é excluída e possui Sócios vinculados, então a exclusão é bloqueada retornando 409 Conflict com mensagem 'Diretoria possui sócios vinculados'.

**Especificidade técnica:**
- Códigos HTTP: 400, 409
- Campos: `diretoriaId`
- Precisa de esclarecimento: sim — A entidade Socio e seu esquema não foram detalhados no requisito nem em REQ-76; assume-se que já exista ou será criada com campo diretoriaId, e o comportamento de exclusão (RESTRICT vs CASCADE) precisa ser confirmado.

**Rastreabilidade:** REQ-82 (ver requirements.json)

---

### [Sprint 1] Modelar relação 1:N entre Diretoria e Produto
<!-- sdd-bot:meta id="BL-013" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-83" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Adicionar entidade Produto (ou ajustar existente) com coluna diretoriaId (FK) referenciando Diretoria.id na tabela produtos, e configurar relação @OneToMany/@ManyToOne no TypeORM entre as entidades Diretoria e Produto, incluindo migration correspondente.

**Comportamento esperado:**
Ao consultar uma Diretoria via repository (findOne com relations: ['produtos']), o campo produtos retorna um array contendo todos os registros da tabela produtos cujo diretoriaId corresponda ao id da diretoria consultada.

**Critérios de aceite:**
- [ ] Quando um Produto for criado com diretoriaId válido, então o registro é persistido na tabela produtos com a FK preenchida e status 201 retornado pelo endpoint de criação.
- [ ] Quando uma Diretoria for buscada com relations: ['produtos'], então o array retornado contém todos os produtos vinculados, incluindo o caso de array vazio quando não houver produtos.
- [ ] Quando um Produto for criado com diretoriaId inexistente, então a API retorna 400 com mensagem 'Diretoria não encontrada' e nenhum registro é inserido.
- [ ] Quando uma Diretoria com produtos vinculados for excluída, então a operação respeita a constraint de integridade referencial definida (RESTRICT ou CASCADE, a especificar).

**Especificidade técnica:**
- Códigos HTTP: 201, 400
- Campos: `diretoriaId`, `produtos`
- Precisa de esclarecimento: sim — Não foi definido o comportamento de integridade referencial (ON DELETE CASCADE, RESTRICT ou SET NULL) ao excluir uma Diretoria com Produtos vinculados.

**Rastreabilidade:** REQ-83 (ver requirements.json)

---

### [Sprint 1] Modelar relação 1:N entre Diretoria e Evento
<!-- sdd-bot:meta id="BL-014" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-84" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Adicionar entidade Evento com coluna diretoriaId (FK) referenciando Diretoria.id na tabela eventos, e configurar relação @OneToMany/@ManyToOne no TypeORM entre as entidades Diretoria e Evento, incluindo migration correspondente.

**Comportamento esperado:**
Ao consultar uma Diretoria via repository (findOne com relations: ['eventos']), o campo eventos retorna um array contendo todos os registros da tabela eventos cujo diretoriaId corresponda ao id da diretoria consultada.

**Critérios de aceite:**
- [ ] Quando um Evento for criado com diretoriaId válido, então o registro é persistido na tabela eventos com a FK preenchida e status 201 retornado pelo endpoint de criação.
- [ ] Quando uma Diretoria for buscada com relations: ['eventos'], então o array retornado contém todos os eventos vinculados, incluindo o caso de array vazio quando não houver eventos.
- [ ] Quando um Evento for criado com diretoriaId inexistente, então a API retorna 400 com mensagem 'Diretoria não encontrada' e nenhum registro é inserido.
- [ ] Quando uma Diretoria com eventos vinculados for excluída, então a operação respeita a constraint de integridade referencial definida (RESTRICT ou CASCADE, a especificar).

**Especificidade técnica:**
- Códigos HTTP: 201, 400
- Campos: `diretoriaId`, `eventos`
- Precisa de esclarecimento: sim — Não foi definido o comportamento de integridade referencial (ON DELETE CASCADE, RESTRICT ou SET NULL) ao excluir uma Diretoria com Eventos vinculados.

**Rastreabilidade:** REQ-84 (ver requirements.json)

---

### [Sprint 1] Modelar relação 1:1 entre Diretoria e Loja
<!-- sdd-bot:meta id="BL-015" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-85" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Adicionar entidade Loja com coluna diretoriaId (FK, UNIQUE) referenciando Diretoria.id na tabela lojas, e configurar relação @OneToOne no TypeORM entre as entidades Diretoria e Loja, incluindo constraint UNIQUE na coluna diretoriaId e migration correspondente.

**Comportamento esperado:**
Ao consultar uma Diretoria via repository (findOne com relations: ['loja']), o campo loja retorna um único objeto Loja vinculado, nunca um array, refletindo a cardinalidade 1:1.

**Critérios de aceite:**
- [ ] Quando uma Loja for criada com diretoriaId de uma Diretoria que ainda não possui Loja vinculada, então o registro é persistido na tabela lojas e a API retorna 201.
- [ ] Quando uma segunda Loja for criada com diretoriaId já vinculado a outra Loja, então a API retorna 409 com mensagem 'Diretoria já possui uma Loja associada'.
- [ ] Quando uma Diretoria for buscada com relations: ['loja'], então o campo loja retorna null se nenhuma Loja estiver vinculada, ou o objeto único correspondente.
- [ ] Quando uma Loja for criada com diretoriaId inexistente, então a API retorna 400 com mensagem 'Diretoria não encontrada'.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `diretoriaId`, `loja`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-85 (ver requirements.json)

---

### [Sprint 1] Criar entidade Usuario com campos de vínculo e autenticação
<!-- sdd-bot:meta id="BL-016" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-86" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Criar a entidade Usuario no TypeORM mapeando a tabela usuarios com colunas id (uuid, PK), tipoVinculo (enum/string), rga (string), cpf (string), cpfVerificado (boolean), email (string, unique), senha (string, hash), nome (string), role (enum/string), diretoriaId (FK para Diretoria.id) e ativo (boolean), incluindo migration de criação da tabela.

**Comportamento esperado:**
Ao inserir um Usuario com todos os campos obrigatórios preenchidos, o repository persiste o registro na tabela usuarios com os valores fornecidos e retorna o objeto criado incluindo o id gerado.

**Critérios de aceite:**
- [ ] Quando um Usuario for criado com email ainda não cadastrado e todos os campos obrigatórios válidos, então o registro é persistido e a API retorna 201 com o objeto contendo id, email, nome, role, ativo=true por padrão.
- [ ] Quando um Usuario for criado com email já existente na tabela usuarios, então a API retorna 409 com mensagem 'Email já cadastrado' e nenhum registro é inserido.
- [ ] Quando um Usuario for criado sem cpf ou sem email (campos obrigatórios ausentes), então a API retorna 400 com mensagem 'Campo obrigatório ausente' listando o(s) campo(s) faltante(s).
- [ ] Quando um Usuario for criado com diretoriaId inexistente, então a API retorna 400 com mensagem 'Diretoria não encontrada'.
- [ ] Quando o campo senha for persistido, então o valor armazenado na coluna senha é um hash (ex.: bcrypt) e nunca a senha em texto plano.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `id`, `tipoVinculo`, `rga`, `cpf`, `cpfVerificado`, `email`, `senha`, `nome`, `role`, `diretoriaId`, `ativo`
- Precisa de esclarecimento: sim — Não foram definidos os valores possíveis (enum) para tipoVinculo e role, o formato/algoritmo de hash da senha, nem se cpf e rga possuem constraint de unicidade.

**Rastreabilidade:** REQ-86 (ver requirements.json)

---

### [Sprint 1] Adicionar enum tipoVinculo na entidade Usuario
<!-- sdd-bot:meta id="BL-017" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-87" dependsOn="REQ-86" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-86

**Descrição:**
Criar enum TipoVinculo (ESTUDANTE, NAO_ESTUDANTE) e adicionar o campo tipoVinculo na entidade/tabela Usuario, com valor padrão ESTUDANTE definido no schema do banco (PostgreSQL) e no decorator da entidade (TypeORM/Prisma, conforme ORM adotado). Atualizar migration correspondente para incluir a coluna com default 'ESTUDANTE' e constraint de enum no PostgreSQL.

**Comportamento esperado:**
Ao criar um Usuario sem informar tipoVinculo, o registro é salvo com tipoVinculo = ESTUDANTE. Ao informar um valor válido (ESTUDANTE ou NAO_ESTUDANTE), o registro é salvo com o valor informado.

**Critérios de aceite:**
- [ ] Quando um Usuario é criado sem enviar o campo tipoVinculo, então o valor persistido no banco é ESTUDANTE.
- [ ] Quando um Usuario é criado com tipoVinculo = NAO_ESTUDANTE, então o valor persistido é NAO_ESTUDANTE.
- [ ] Quando é enviado um valor fora do enum (ex.: 'PROFESSOR') no campo tipoVinculo, então a API retorna 400 Bad Request com mensagem de erro indicando valores permitidos.
- [ ] Quando a migration é executada, então a coluna tipoVinculo é criada no PostgreSQL com tipo enum e default 'ESTUDANTE'.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `tipoVinculo`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-87 (ver requirements.json)

---

### [Sprint 1] Adicionar enum role na entidade Usuario
<!-- sdd-bot:meta id="BL-018" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-88" dependsOn="REQ-86" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-86

**Descrição:**
Criar enum Role (DIRETORIA, SOCIO, ALUNO) e adicionar o campo role na entidade/tabela Usuario, incluindo migration para criar a coluna com tipo enum no PostgreSQL. Definir se há valor padrão ou se o campo é obrigatório na criação do usuário.

**Comportamento esperado:**
Ao criar um Usuario informando um dos valores válidos de role (DIRETORIA, SOCIO, ALUNO), o registro é salvo com o papel correspondente.

**Critérios de aceite:**
- [ ] Quando um Usuario é criado com role = ALUNO, então o valor persistido no banco é ALUNO.
- [ ] Quando é enviado um valor fora do enum (ex.: 'ADMIN') no campo role, então a API retorna 400 Bad Request com mensagem de erro indicando valores permitidos.
- [ ] Quando a migration é executada, então a coluna role é criada no PostgreSQL com tipo enum contendo exatamente os valores DIRETORIA, SOCIO e ALUNO.
- [ ] Quando o campo role não é informado na criação e não há valor padrão definido, então a API retorna 400 Bad Request indicando campo obrigatório.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `role`
- Precisa de esclarecimento: sim — Não está definido se o campo role possui valor padrão (como no REQ-87) ou se é obrigatório sem default; necessário decidir o comportamento na ausência de envio do campo.

**Rastreabilidade:** REQ-88 (ver requirements.json)

---

### [Sprint 1] Tornar campos rga e cpf nullable na entidade Usuario
<!-- sdd-bot:meta id="BL-019" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-89" dependsOn="REQ-86" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-86

**Descrição:**
Alterar a entidade/tabela Usuario para que as colunas rga e cpf aceitem valor nulo (NULL) no PostgreSQL, removendo constraint NOT NULL existente e ajustando o decorator/schema do ORM e a migration correspondente. Ajustar validação da camada de DTO/service para não exigir esses campos obrigatoriamente.

**Comportamento esperado:**
Ao criar ou atualizar um Usuario sem informar rga e/ou cpf, o registro é salvo com esses campos nulos, sem erro de validação ou de constraint no banco.

**Critérios de aceite:**
- [ ] Quando um Usuario é criado sem os campos rga e cpf, então o registro é persistido com ambos os campos NULL, retornando 201 Created.
- [ ] Quando um Usuario é criado apenas com cpf preenchido e rga omitido, então o registro é persistido com rga NULL e cpf com o valor informado.
- [ ] Quando a migration é executada em uma tabela existente com dados, então as colunas rga e cpf passam a permitir NULL sem falha de migração.
- [ ] Quando um Usuario existente é atualizado removendo o valor de cpf (enviando null), então o campo cpf é atualizado para NULL no banco.

**Especificidade técnica:**
- Códigos HTTP: 201
- Campos: `rga`, `cpf`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-89 (ver requirements.json)

---

### [Sprint 1] Adicionar campo cpfVerificado na entidade Usuario
<!-- sdd-bot:meta id="BL-020" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-90" dependsOn="REQ-86" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-86

**Descrição:**
Adicionar o campo booleano cpfVerificado na entidade/tabela Usuario para armazenar o status de verificação do CPF, com migration criando a coluna no PostgreSQL com tipo boolean e valor padrão false.

**Comportamento esperado:**
Ao criar um Usuario, o campo cpfVerificado é persistido com valor false por padrão, podendo ser atualizado posteriormente para true por um processo de verificação.

**Critérios de aceite:**
- [ ] Quando um Usuario é criado sem informar cpfVerificado, então o valor persistido no banco é false.
- [ ] Quando um Usuario é criado explicitamente com cpfVerificado = true, então o valor persistido é true.
- [ ] Quando é enviado um valor não booleano (ex.: string 'sim') no campo cpfVerificado, então a API retorna 400 Bad Request com mensagem de erro de tipo inválido.
- [ ] Quando a migration é executada, então a coluna cpfVerificado é criada no PostgreSQL com tipo boolean e default false.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `cpfVerificado`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-90 (ver requirements.json)

---

### [Sprint 1] Modelar entidade UsuarioDiretoria (vínculo N:N)
<!-- sdd-bot:meta id="BL-021" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-92" dependsOn="REQ-76,REQ-86" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76, REQ-86

**Descrição:**
Criar a entidade TypeORM UsuarioDiretoria representando a tabela usuario_diretoria, com campos id (PK, uuid), usuarioId (FK para tabela usuario), diretoriaId (FK para tabela diretoria) e adicionadoEm (timestamp, default now()). Implementar o repository UsuarioDiretoriaRepository para persistência e o service correspondente na camada de negócio, seguindo a arquitetura em camadas (controller/service/repository) já adotada no projeto.

**Comportamento esperado:**
O vínculo entre um usuário e uma diretoria fica registrado de forma persistente no banco, permitindo consultar quais diretorias um usuário integra e quais usuários compõem uma diretoria.

**Critérios de aceite:**
- [ ] Quando um registro válido de UsuarioDiretoria é criado com usuarioId e diretoriaId existentes, então a tabela usuario_diretoria armazena o registro com id gerado e adicionadoEm preenchido automaticamente.
- [ ] Quando usuarioId ou diretoriaId referenciam registros inexistentes, então a operação retorna erro 400 com mensagem "Usuario ou Diretoria não encontrados" e nenhum registro é persistido.
- [ ] Quando já existe um vínculo ativo para o mesmo par usuarioId e diretoriaId, então a operação retorna erro 409 com mensagem "Vínculo já existente" e não cria duplicata.
- [ ] Quando um vínculo é consultado por diretoriaId, então a lista retornada contém todos os usuarioId associados àquela diretoria.
- [ ] Quando a migration da tabela usuario_diretoria é executada, então as colunas usuarioId e diretoriaId são criadas como foreign keys com constraint de unicidade composta.

**Especificidade técnica:**
- Códigos HTTP: 400, 409
- Campos: `id`, `usuarioId`, `diretoriaId`, `adicionadoEm`
- Precisa de esclarecimento: sim — Não está definido se a constraint de unicidade composta (usuarioId+diretoriaId) deve impedir reativação de vínculo removido ou se há soft-delete envolvido.

**Rastreabilidade:** REQ-92 (ver requirements.json)

---

### [Sprint 1] Modelar entidade Socio vinculada a usuário e diretoria
<!-- sdd-bot:meta id="BL-022" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-93" dependsOn="REQ-76,REQ-86" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-76, REQ-86

**Descrição:**
Criar a entidade TypeORM Socio representando a tabela socio, com campos id (PK, uuid), usuarioId (FK para usuario), diretoriaId (FK para diretoria), nome (varchar) e email (varchar). Implementar SocioRepository e SocioService na camada de negócio, seguindo o padrão em camadas do projeto, incluindo a migration correspondente.

**Comportamento esperado:**
Dados de sócio ficam persistidos e recuperáveis vinculados a um usuário e uma diretoria específicos, servindo de base para os módulos de negócio subsequentes.

**Critérios de aceite:**
- [ ] Quando um Socio é criado com usuarioId, diretoriaId, nome e email válidos, então o registro é persistido na tabela socio e retornado com id gerado.
- [ ] Quando o campo email não segue o formato de e-mail válido (ex.: ausência de @), então a criação retorna erro 400 com mensagem "Email inválido".
- [ ] Quando usuarioId ou diretoriaId referenciam registros inexistentes, então a criação retorna erro 400 com mensagem "Usuario ou Diretoria não encontrados" e nenhum registro é persistido.
- [ ] Quando o campo nome é enviado vazio ou nulo, então a criação retorna erro 400 com mensagem "Nome é obrigatório".
- [ ] Quando um Socio é consultado por id existente, então a resposta retorna código 200 com os campos id, usuarioId, diretoriaId, nome e email.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `id`, `usuarioId`, `diretoriaId`, `nome`, `email`
- Precisa de esclarecimento: sim — Não está definido se email deve ter constraint de unicidade global ou por diretoria, nem o tamanho máximo permitido para os campos nome e email.

**Rastreabilidade:** REQ-93 (ver requirements.json)

---

### [Sprint 1] Configurar stack base do backend com NestJS e TypeORM
<!-- sdd-bot:meta id="BL-023" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-118" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Inicializar o projeto backend utilizando NestJS versão 9 ou superior, TypeScript 4.9 ou superior, Node.js 18 ou superior, TypeORM 0.3 ou superior e PostgreSQL 14 ou superior, configurando o módulo de conexão TypeOrmModule no AppModule e o arquivo package.json com as versões mínimas fixadas nas dependências.

**Comportamento esperado:**
O projeto backend inicializa e se conecta ao banco PostgreSQL utilizando as versões especificadas das tecnologias, sem erros de incompatibilidade.

**Critérios de aceite:**
- [ ] Quando o comando npm install é executado, então as versões instaladas de @nestjs/core, typescript, typeorm e pg atendem aos mínimos nestjs@9, typescript@4.9, typeorm@0.3 e node@18.
- [ ] Quando a aplicação é iniciada com npm run start, então a conexão TypeOrmModule com PostgreSQL 14+ é estabelecida sem lançar exceção de versão incompatível.
- [ ] Quando o comando node -v é executado no ambiente de execução, então a versão exibida é 18.x ou superior.
- [ ] Quando uma versão de dependência abaixo do mínimo especificado é instalada manualmente, então o npm install falha por violar o range definido no package.json (ex.: "^9.0.0").

**Especificidade técnica:**
- Campos: `@nestjs/core`, `typescript`, `typeorm`, `pg`, `node`
- Limites: NestJS>=9, TypeScript>=4.9, Node.js>=18, TypeORM>=0.3, PostgreSQL>=14
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-118 (ver requirements.json)

---

### [Sprint 1] Carregar configurações sensíveis via variáveis de ambiente
<!-- sdd-bot:meta id="BL-024" epic="Deployment" layer="backend" requirementIds="REQ-327" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar o módulo ConfigModule do NestJS (@nestjs/config) para carregar e validar as variáveis de ambiente DATABASE_URL, JWT_SECRET, JWT_EXPIRATION, NODE_ENV, LOG_LEVEL, CPF_ENCRYPTION_KEY e EMAIL_OTP_PROVIDER_KEY a partir de um arquivo .env, disponibilizando-as via ConfigService injetável nos demais módulos, com validação de schema (ex.: Joi) na inicialização.

**Comportamento esperado:**
A aplicação lê os valores das variáveis de ambiente na inicialização e os disponibiliza para os módulos que dependem delas (conexão com banco, autenticação JWT, criptografia de CPF, provedor de OTP), sem valores hardcoded no código.

**Critérios de aceite:**
- [ ] Quando todas as variáveis obrigatórias (DATABASE_URL, JWT_SECRET, JWT_EXPIRATION, NODE_ENV, LOG_LEVEL, CPF_ENCRYPTION_KEY, EMAIL_OTP_PROVIDER_KEY) estão definidas no .env, então a aplicação inicializa e o ConfigService retorna os valores correspondentes via get().
- [ ] Quando a variável DATABASE_URL está ausente ou vazia, então a aplicação falha na inicialização com erro de validação indicando "DATABASE_URL is required".
- [ ] Quando a variável JWT_SECRET está ausente, então a aplicação falha na inicialização com erro de validação indicando "JWT_SECRET is required" e o servidor não sobe.
- [ ] Quando NODE_ENV não é um dos valores permitidos (development, production, test), então a validação de schema rejeita a inicialização com mensagem de erro específica.
- [ ] Quando o ConfigService é injetado em um serviço (ex.: DatabaseModule), então o valor de DATABASE_URL retornado é idêntico ao definido na variável de ambiente do processo.

**Especificidade técnica:**
- Campos: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `NODE_ENV`, `LOG_LEVEL`, `CPF_ENCRYPTION_KEY`, `EMAIL_OTP_PROVIDER_KEY`
- Precisa de esclarecimento: sim — Não está definido o conjunto de valores válidos para LOG_LEVEL nem o formato/tamanho esperado para CPF_ENCRYPTION_KEY e JWT_EXPIRATION (ex.: segundos vs string tipo "1d").

**Rastreabilidade:** REQ-327 (ver requirements.json)

---

### [Sprint 2] Implementar isolamento multi-tenant por atlética no backend
<!-- sdd-bot:meta id="BL-025" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-1" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar coluna tenant_id (referência à tabela de atléticas) em todas as tabelas que armazenam dados sensíveis a tenant, e implementar um mecanismo de resolução de tenant (middleware/interceptor) que extrai o tenant do contexto autenticado (ex.: claim do JWT) e aplica filtro automático tenant_id nas queries do ORM/repositório em todos os endpoints que acessam esses dados.

**Comportamento esperado:**
Ao autenticar-se, o usuário só consegue ler, criar, atualizar ou excluir registros vinculados ao tenant_id associado à sua conta; requisições que tentem acessar recursos de outro tenant não retornam dados nem confirmam existência do recurso.

**Critérios de aceite:**
- [ ] Quando um usuário da atlética A lista um recurso (ex.: GET /members), então apenas registros com tenant_id da atlética A são retornados.
- [ ] Quando um usuário da atlética A tenta acessar por ID um recurso pertencente à atlética B (ex.: GET /members/{id}), então a API retorna 404 Not Found.
- [ ] Quando um novo registro é criado, então o tenant_id é preenchido automaticamente a partir do contexto do usuário autenticado, ignorando qualquer tenant_id enviado no payload.
- [ ] Quando uma query é executada sem contexto de tenant resolvido (ex.: token inválido ou ausente), então a API retorna 401 Unauthorized antes de acessar a base de dados.
- [ ] Quando um teste de integração tenta forçar um tenant_id diferente via payload em PUT/PATCH, então a API retorna 403 Forbidden e o registro não é alterado.

**Especificidade técnica:**
- Códigos HTTP: 401, 403, 404
- Campos: `tenant_id`
- Precisa de esclarecimento: sim — Definir se o isolamento será via filtro aplicado em cada repositório/query (application-level) ou via Row-Level Security no banco de dados (ex.: PostgreSQL RLS), e listar exaustivamente quais tabelas recebem tenant_id.

**Rastreabilidade:** REQ-1 (ver requirements.json)

---

### [Sprint 2] Implementar RBAC com roles DIRETORIA, SOCIO e ALUNO
<!-- sdd-bot:meta id="BL-026" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-3" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Criar enum/tabela de roles (DIRETORIA, SOCIO, ALUNO), associar cada usuário a exatamente uma role no momento do cadastro/atualização, incluir a role como claim no JWT emitido pelo serviço de autenticação, e implementar um guard/decorator (ex.: @Roles()) reutilizável nos controllers para validar a role antes de executar o handler da rota.

**Comportamento esperado:**
Cada usuário autenticado carrega sua role no token de sessão, e rotas protegidas por guard de role só são executadas se a role do token estiver na lista de roles permitidas para aquele endpoint.

**Critérios de aceite:**
- [ ] Quando um usuário é criado ou atualizado, então sua role deve ser uma das três válidas (DIRETORIA, SOCIO, ALUNO), rejeitando qualquer outro valor.
- [ ] Quando um usuário faz login, então o JWT emitido contém a claim 'role' com o valor correspondente ao seu cadastro.
- [ ] Quando uma rota protegida por @Roles(DIRETORIA) recebe uma requisição de um usuário com role SOCIO ou ALUNO, então a API retorna 403 Forbidden.
- [ ] Quando uma rota protegida por @Roles(DIRETORIA) recebe uma requisição de um usuário com role DIRETORIA, então o handler é executado normalmente e retorna 200.
- [ ] Quando o payload de criação/atualização de usuário não envia o campo role, então a API retorna 400 Bad Request com mensagem indicando campo obrigatório.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403
- Campos: `role`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-3 (ver requirements.json)

---

### [Sprint 2] Mapear permissões específicas por role nos endpoints
<!-- sdd-bot:meta id="BL-027" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-4" dependsOn="REQ-3" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-3

**Descrição:**
Definir uma matriz de permissões por recurso e ação (create/read/update/delete) para cada role (DIRETORIA, SOCIO, ALUNO), e aplicar essa matriz via decorator/guard (ex.: @Permissions()) em cada endpoint do backend, distinguindo o nível de acesso de cada role além da simples validação binária de role implementada no REQ-3.

**Comportamento esperado:**
Cada role acessa apenas as ações e recursos definidos na matriz de permissões, com DIRETORIA tendo acesso administrativo amplo, SOCIO acesso intermediário e ALUNO acesso restrito a leitura/ações próprias.

**Critérios de aceite:**
- [ ] Quando um usuário com role ALUNO tenta executar DELETE em um recurso administrativo (ex.: DELETE /members/{id}), então a API retorna 403 Forbidden.
- [ ] Quando um usuário com role DIRETORIA executa qualquer ação CRUD em um recurso mapeado na matriz, então a API executa a ação e retorna o código de sucesso correspondente (200/201/204).
- [ ] Quando um usuário com role SOCIO acessa um endpoint de leitura permitido (ex.: GET /events), então a API retorna 200 com os dados esperados.
- [ ] Quando um endpoint não possui nenhuma role autorizada na matriz de permissões para a ação solicitada, então a API retorna 403 Forbidden para todas as roles.
- [ ] Quando a matriz de permissões é alterada (ex.: nova permissão adicionada a SOCIO), então o guard reflete a mudança sem exigir alteração no código do controller.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 204, 403
- Campos: `role`, `resource`, `action`
- Precisa de esclarecimento: sim — Falta a matriz completa de permissões (quais recursos e ações cada role pode executar); precisa ser definida com o time de produto/negócio antes da implementação final.

**Rastreabilidade:** REQ-4 (ver requirements.json)

---

### [Sprint 2] Adicionar testes e guard de segurança para isolamento entre tenants
<!-- sdd-bot:meta id="BL-028" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-46" dependsOn="REQ-1" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-1

**Descrição:**
Implementar um guard de tenant (TenantGuard) aplicado globalmente a todas as rotas autenticadas, que valida a consistência entre o tenant_id do contexto e o tenant_id de qualquer recurso referenciado na URL/payload antes de delegar ao controller, complementando o filtro de queries do REQ-1 com uma camada de verificação explícita de segurança, e adicionar suíte de testes automatizados de isolamento entre tenants (unit/integration) executada no pipeline de CI.

**Comportamento esperado:**
Nenhuma requisição autenticada consegue ler, modificar ou vazar dados de um tenant diferente do seu, mesmo em casos de IDs manipulados manualmente na URL ou no corpo da requisição, e a suíte de testes de isolamento falha o build caso alguma rota exponha esse vazamento.

**Critérios de aceite:**
- [ ] Quando o TenantGuard identifica que o tenant_id de um recurso referenciado na URL diverge do tenant_id do usuário autenticado, então a requisição é bloqueada com 404 Not Found antes de chegar ao controller.
- [ ] Quando a suíte de testes automatizados de isolamento é executada no pipeline de CI, então ela cobre cenários de tentativa de acesso cross-tenant em pelo menos os endpoints de listagem, detalhe, criação e atualização.
- [ ] Quando um teste de isolamento detecta vazamento de dado entre tenants, então o pipeline de CI marca o build como falho e impede o merge/deploy.
- [ ] Quando duas atléticas distintas possuem recursos com o mesmo ID relativo (ex.: ambas têm um membro de id=1 em suas respectivas tabelas), então cada requisição retorna apenas o recurso correspondente ao tenant do solicitante.
- [ ] Quando um usuário sem tenant associado (ex.: conta corrompida ou super-admin não configurado) faz uma requisição, então a API retorna 403 Forbidden em vez de aplicar um filtro vazio ou nulo.

**Especificidade técnica:**
- Códigos HTTP: 403, 404
- Campos: `tenant_id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-46 (ver requirements.json)

---

### [Sprint 2] Implementar JwtGuard para validação de token JWT
<!-- sdd-bot:meta id="BL-029" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-66" dependsOn="REQ-57" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-57

**Descrição:**
Criar um Guard NestJS (JwtGuard) implementando CanActivate que extrai o token do header Authorization (formato 'Bearer <token>'), valida a assinatura e expiração usando o JwtService/JwtStrategy configurado no REQ-57, e anexa o payload decodificado (ex.: userId, diretoriaId, role) ao objeto request (request.user). O guard deve ser aplicável via decorator (@UseGuards(JwtGuard)) em controllers/rotas protegidas, com suporte a rotas públicas via decorator @Public() e reflector do NestJS.

**Comportamento esperado:**
Requisições a rotas protegidas com token JWT válido são processadas normalmente e o handler recebe request.user preenchido; requisições sem token, com token expirado ou inválido são bloqueadas antes de chegar ao handler.

**Critérios de aceite:**
- [ ] Quando uma requisição incluir um JWT válido e não expirado no header Authorization, então o JwtGuard permite a execução do handler e popula request.user com o payload decodificado.
- [ ] Quando o header Authorization estiver ausente, então o JwtGuard retorna HTTP 401 com mensagem 'Token não fornecido'.
- [ ] Quando o token JWT estiver expirado ou com assinatura inválida, então o JwtGuard retorna HTTP 401 com mensagem 'Token inválido ou expirado'.
- [ ] Quando a rota estiver marcada com o decorator @Public(), então o JwtGuard permite o acesso sem exigir token.
- [ ] Quando o token estiver malformado (não segue o padrão 'Bearer <token>'), então o JwtGuard retorna HTTP 401 sem lançar exceção não tratada.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `Authorization`, `request.user`, `@Public()`
- Precisa de esclarecimento: sim — Não há definição de qual estratégia de expiração/refresh token será usada nem o formato exato do payload JWT (claims obrigatórias) — depende da implementação definida em REQ-57.

**Rastreabilidade:** REQ-66 (ver requirements.json)

---

### [Sprint 2] Implementar TenantGuard para validar diretoria da requisição
<!-- sdd-bot:meta id="BL-030" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-67" dependsOn="REQ-66" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-66

**Descrição:**
Criar um Guard NestJS (TenantGuard) implementando CanActivate que executa após o JwtGuard, extrai o diretoriaId do request.user (populado pelo JWT) e/ou de um parâmetro de rota/header (ex.: X-Tenant-Id), e valida que o usuário autenticado tem vínculo ativo com essa diretoria. O guard deve anexar o diretoriaId validado ao request (request.tenantId) para uso posterior por services e queries.

**Comportamento esperado:**
Requisições de um usuário autenticado para recursos da própria diretoria são liberadas com request.tenantId definido; requisições que tentam acessar dados de outra diretoria são bloqueadas.

**Critérios de aceite:**
- [ ] Quando o diretoriaId do token do usuário corresponder à diretoria alvo da requisição, então o TenantGuard permite a execução e define request.tenantId.
- [ ] Quando o usuário tentar acessar um recurso de uma diretoria diferente da associada ao seu token, então o TenantGuard retorna HTTP 403 com mensagem 'Acesso negado à diretoria'.
- [ ] Quando request.user não contiver diretoriaId (guard executado sem JwtGuard prévio ou payload incompleto), então o TenantGuard retorna HTTP 401.
- [ ] Quando a diretoria informada não existir ou estiver inativa, então o TenantGuard retorna HTTP 404 com mensagem 'Diretoria não encontrada'.

**Especificidade técnica:**
- Códigos HTTP: 401, 403, 404
- Campos: `request.user.diretoriaId`, `request.tenantId`, `X-Tenant-Id`
- Precisa de esclarecimento: sim — Não está definido se o diretoriaId alvo vem de parâmetro de rota, header customizado ou body, nem se um usuário pode estar vinculado a múltiplas diretorias simultaneamente.

**Rastreabilidade:** REQ-67 (ver requirements.json)

---

### [Sprint 2] Garantir isolamento multi-tenant via diretoria_id nas queries
<!-- sdd-bot:meta id="BL-031" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-74" dependsOn="REQ-72" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-72

**Descrição:**
Adicionar a condição WHERE diretoria_id = :tenantId em todas as queries TypeORM (Repositories/QueryBuilders) das entidades multi-tenant, utilizando o request.tenantId propagado pelo TenantGuard (REQ-67). Implementar esse escopo preferencialmente via subscriber/interceptor global do TypeORM ou um repository base compartilhado, evitando duplicação manual da cláusula em cada service, e garantindo que inserts/updates também gravem o diretoria_id correto.

**Comportamento esperado:**
Toda operação de leitura, escrita ou atualização em entidades multi-tenant fica restrita aos registros da diretoria do usuário autenticado, sem exigir que cada service implemente o filtro manualmente.

**Critérios de aceite:**
- [ ] Quando um usuário da diretoria A executar uma query de listagem, então apenas registros com diretoria_id igual ao seu tenant são retornados.
- [ ] Quando um usuário tentar buscar por ID um registro pertencente a outra diretoria, então a API retorna HTTP 404 (não expõe existência do recurso de outro tenant).
- [ ] Quando um novo registro for criado, então o campo diretoria_id é preenchido automaticamente com o tenantId da requisição, sem exigir que o payload do cliente o informe.
- [ ] Quando uma query for executada sem request.tenantId definido (ex.: contexto sem TenantGuard), então a operação é bloqueada ou lança erro, prevenindo vazamento de dados entre tenants.
- [ ] Quando um usuário tentar atualizar ou deletar um registro de outra diretoria, então a operação retorna HTTP 404 e nenhum dado é alterado.

**Especificidade técnica:**
- Códigos HTTP: 404
- Campos: `diretoria_id`, `request.tenantId`
- Precisa de esclarecimento: sim — Não foi especificado se o isolamento será feito por interceptor/subscriber global do TypeORM, por repository base customizado, ou manualmente em cada service, nem a lista completa de entidades consideradas multi-tenant.

**Rastreabilidade:** REQ-74 (ver requirements.json)

---

### [Sprint 2] Injetar Repositories TypeORM via @InjectRepository nos Services
<!-- sdd-bot:meta id="BL-032" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-75" dependsOn="REQ-64" -->
**Tipo:** refactor
**Prioridade:** must
**Depende de:** REQ-64

**Descrição:**
Refatorar os Services do backend para utilizarem o decorator @InjectRepository(Entity) do NestJS/TypeORM na injeção de Repositories, registrando as entidades correspondentes via TypeOrmModule.forFeature([...]) nos módulos, em vez de instanciar ou obter repositories manualmente (ex.: via getRepository ou connection.getRepository).

**Comportamento esperado:**
Todos os Services que acessam entidades do banco recebem seus Repositories via injeção de dependência nativa do NestJS no construtor, sem chamadas manuais a métodos de obtenção de repository.

**Critérios de aceite:**
- [ ] Quando um Service for instanciado pelo NestJS, então seu Repository é injetado automaticamente via construtor usando @InjectRepository(Entity).
- [ ] Quando um módulo declarar um Service que depende de um Repository, então esse módulo importa TypeOrmModule.forFeature([Entity]) correspondente.
- [ ] Quando o código for revisado, então não deve haver chamadas manuais a getRepository ou connection.getRepository nos Services refatorados.
- [ ] Quando um Service com dependência de Repository não declarado no módulo for carregado, então o NestJS lança erro de resolução de dependência na inicialização da aplicação (fail-fast).

**Especificidade técnica:**
- Campos: `@InjectRepository`, `TypeOrmModule.forFeature`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-75 (ver requirements.json)

---

### [Sprint 2] Validar RGA único e obrigatório para estudantes
<!-- sdd-bot:meta id="BL-033" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-96" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar coluna rga na tabela users (nullable), com constraint UNIQUE no banco. Implementar validação condicional na camada de serviço/DTO de criação e atualização de usuário: quando tipoVinculo = ESTUDANTE, rga é obrigatório e deve ser único; quando tipoVinculo != ESTUDANTE, rga deve ser null/ignorado. Criar migration correspondente.

**Comportamento esperado:**
Usuários do tipo ESTUDANTE só são persistidos com um RGA válido e não duplicado; usuários NAO_ESTUDANTE não exigem RGA.

**Critérios de aceite:**
- [ ] Quando tipoVinculo for ESTUDANTE e rga for enviado e não existir no banco, então o usuário é criado com status 201 e rga persistido.
- [ ] Quando tipoVinculo for ESTUDANTE e rga não for enviado ou for vazio, então a API retorna 400 com mensagem de erro no campo 'rga' (ex.: 'rga é obrigatório para tipoVinculo ESTUDANTE').
- [ ] Quando tipoVinculo for ESTUDANTE e rga já existir em outro usuário, então a API retorna 409 com mensagem indicando conflito (ex.: 'rga já cadastrado').
- [ ] Quando tipoVinculo for NAO_ESTUDANTE e rga for enviado, então a API ignora ou rejeita o campo com 400, conforme decisão de design (a definir).
- [ ] Quando tipoVinculo for NAO_ESTUDANTE e rga não for enviado, então o usuário é criado normalmente com rga nulo.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `rga`, `tipoVinculo`
- Precisa de esclarecimento: sim — Não está definido se o backend deve rejeitar (400) ou apenas ignorar silenciosamente o campo 'rga' quando enviado para um usuário NAO_ESTUDANTE.

**Rastreabilidade:** REQ-96 (ver requirements.json)

---

### [Sprint 2] Criptografar e validar unicidade do CPF de não-estudantes
<!-- sdd-bot:meta id="BL-034" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-97" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar coluna cpf (armazenada criptografada em repouso, ex. AES-256 via pgcrypto ou criptografia na camada de aplicação) na tabela users, com índice único calculado sobre o valor criptografado ou hash determinístico auxiliar para garantir unicidade. Implementar validação condicional no serviço/DTO: quando tipoVinculo = NAO_ESTUDANTE, cpf é obrigatório, validado quanto ao formato (11 dígitos) e único antes de ser criptografado e persistido.

**Comportamento esperado:**
CPFs de usuários NAO_ESTUDANTE são armazenados de forma ilegível em texto puro no banco e nunca duplicados; usuários ESTUDANTE não exigem CPF.

**Critérios de aceite:**
- [ ] Quando tipoVinculo for NAO_ESTUDANTE e cpf válido (11 dígitos) e inédito for enviado, então o usuário é criado com status 201 e o valor armazenado no banco está criptografado, não em texto puro.
- [ ] Quando tipoVinculo for NAO_ESTUDANTE e cpf não for enviado ou vazio, então a API retorna 400 com mensagem no campo 'cpf' (ex.: 'cpf é obrigatório para tipoVinculo NAO_ESTUDANTE').
- [ ] Quando tipoVinculo for NAO_ESTUDANTE e cpf já existir cadastrado (mesmo valor descriptografado), então a API retorna 409 com mensagem de conflito (ex.: 'cpf já cadastrado').
- [ ] Quando cpf enviado não tiver 11 dígitos numéricos, então a API retorna 400 com mensagem de formato inválido.
- [ ] Quando tipoVinculo for ESTUDANTE, então o campo cpf não é exigido e pode ser omitido sem erro.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `cpf`, `tipoVinculo`
- Limites: 11 dígitos
- Precisa de esclarecimento: sim — Não está definido o mecanismo exato de criptografia (aplicação vs. pgcrypto no banco) nem como garantir busca/unicidade eficiente sobre dado criptografado (uso de hash determinístico adicional, ex. cpf_hash indexado).

**Rastreabilidade:** REQ-97 (ver requirements.json)

---

### [Sprint 2] Validar e-mail único e obrigatório no cadastro de usuário
<!-- sdd-bot:meta id="BL-035" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-100" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar constraint UNIQUE e NOT NULL na coluna email da tabela users. Implementar validação de formato de e-mail e checagem de unicidade na camada de serviço/DTO antes da persistência, retornando erro apropriado em caso de violação.

**Comportamento esperado:**
Todo usuário cadastrado possui um e-mail válido e não há dois usuários com o mesmo e-mail no sistema.

**Critérios de aceite:**
- [ ] Quando um e-mail válido e inédito for enviado no cadastro, então o usuário é criado com status 201 e o e-mail persistido.
- [ ] Quando o campo email não for enviado ou estiver vazio, então a API retorna 400 com mensagem no campo 'email' (ex.: 'email é obrigatório').
- [ ] Quando o e-mail enviado já existir em outro usuário, então a API retorna 409 com mensagem de conflito (ex.: 'email já cadastrado').
- [ ] Quando o e-mail enviado não seguir formato válido (ex.: sem '@' ou domínio), então a API retorna 400 com mensagem de formato inválido.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `email`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-100 (ver requirements.json)

---

### [Sprint 2] Armazenar senha do usuário com hash bcrypt
<!-- sdd-bot:meta id="BL-036" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-101" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Substituir/implementar no serviço de criação e atualização de usuário o hashing da senha via bcrypt (ex. biblioteca bcrypt/bcryptjs) antes de persistir na coluna password_hash da tabela users, com salt rounds configurável (ex. variável de ambiente BCRYPT_SALT_ROUNDS). Garantir que a senha em texto puro nunca seja gravada nem logada.

**Comportamento esperado:**
A senha do usuário é armazenada apenas como hash bcrypt no banco, tornando impossível recuperar o valor original a partir do dado persistido.

**Critérios de aceite:**
- [ ] Quando um usuário for criado com senha válida, então o valor gravado em password_hash é um hash bcrypt (prefixo $2a$/$2b$) e não corresponde ao texto puro enviado.
- [ ] Quando a senha enviada tiver menos que o tamanho mínimo definido, então a API retorna 400 com mensagem de validação no campo 'senha'.
- [ ] Quando o login for realizado com a senha correta, então a comparação via bcrypt.compare retorna sucesso e autentica o usuário.
- [ ] Quando o login for realizado com senha incorreta, então a API retorna 401 sem revelar detalhes sobre o hash armazenado.

**Especificidade técnica:**
- Códigos HTTP: 400, 401
- Campos: `password_hash`, `senha`
- Precisa de esclarecimento: sim — Não está definido o número mínimo de caracteres exigido para a senha nem o valor de salt rounds do bcrypt a ser utilizado.

**Rastreabilidade:** REQ-101 (ver requirements.json)

---

### [Sprint 2] Adicionar campo role enumerado na entidade Usuario
<!-- sdd-bot:meta id="BL-037" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-102" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar coluna 'role' na tabela usuarios, do tipo enum (ADMIN, DIRETORIA, ALUNO), com valor default 'ALUNO' e constraint NOT NULL. Atualizar o DTO de criação de usuário e o serializador de resposta para expor o campo 'role'. Criar migração de banco de dados para aplicar a alteração em tabelas existentes, preenchendo registros legados com 'ALUNO'.

**Comportamento esperado:**
Ao criar um usuário sem informar role, o campo é persistido como 'ALUNO' e retornado no payload de resposta com esse valor. Ao informar um valor fora do enum, a API responde 400 com mensagem 'role inválido'.

**Critérios de aceite:**
- [ ] Quando um usuário é criado sem o campo role, então o registro é salvo com role='ALUNO' e a resposta HTTP 201 inclui 'role: ALUNO'.
- [ ] Quando um usuário é criado com role='DIRETORIA' ou 'ADMIN', então o registro é persistido com o valor informado.
- [ ] Quando um usuário é criado com role='GESTOR' (valor fora do enum), então a API retorna HTTP 400 com mensagem de erro 'role inválido'.
- [ ] Quando a migração é executada em uma base com usuários já existentes, então todos os registros legados passam a ter role='ALUNO' sem erro de constraint NOT NULL.
- [ ] Quando um usuário existente tem seu role atualizado via endpoint de edição, então o novo valor é validado contra o enum antes da persistência.

**Especificidade técnica:**
- Códigos HTTP: 201, 400
- Campos: `role`, `ADMIN`, `DIRETORIA`, `ALUNO`
- Precisa de esclarecimento: sim — O requisito não especifica o endpoint exato (ex.: POST /usuarios) nem o conjunto completo de valores do enum de role — assumido ADMIN/DIRETORIA/ALUNO com base no contexto de RBAC de três papéis do sprint, mas precisa confirmação.

**Rastreabilidade:** REQ-102 (ver requirements.json)

---

### [Sprint 2] Adicionar flag booleana de ativação na entidade Usuario
<!-- sdd-bot:meta id="BL-038" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-107" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar coluna 'ativo' (boolean, NOT NULL, default true) na tabela usuarios. Criar migração para aplicar a alteração em tabelas existentes, definindo ativo=true para registros legados. Atualizar DTOs de criação e resposta do usuário para incluir o campo 'ativo', e ajustar o guard de autenticação para rejeitar login de usuários com ativo=false.

**Comportamento esperado:**
Um usuário criado sem informar o campo 'ativo' é persistido com ativo=true e esse valor aparece no payload de resposta HTTP 201. Um usuário com ativo=false recebe HTTP 401 com mensagem 'usuário inativo' ao tentar autenticar.

**Critérios de aceite:**
- [ ] Quando um usuário é criado sem informar 'ativo', então o registro é salvo com ativo=true e retornado na resposta HTTP 201 com esse valor.
- [ ] Quando um usuário com ativo=false tenta autenticar via endpoint de login, então a API retorna HTTP 401 com mensagem 'usuário inativo'.
- [ ] Quando um administrador desativa um usuário via endpoint de atualização (ativo=false), então requisições subsequentes desse usuário autenticado são rejeitadas com HTTP 401.
- [ ] Quando a migração é executada em base com usuários existentes, então todos os registros legados passam a ter ativo=true sem violar a constraint NOT NULL.

**Especificidade técnica:**
- Códigos HTTP: 201, 401
- Campos: `ativo`
- Precisa de esclarecimento: sim — O requisito não especifica o endpoint de atualização de status nem se usuários inativos devem ser bloqueados apenas no login ou em toda requisição autenticada (via guard). Assumido bloqueio no login e em requisições subsequentes, mas precisa confirmação do comportamento do guard JWT.

**Rastreabilidade:** REQ-107 (ver requirements.json)

---

### [Sprint 2] Criar índices compostos por diretoria nas tabelas multi-tenant
<!-- sdd-bot:meta id="BL-039" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-113" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Criar migração de banco de dados adicionando índices compostos nas tabelas usuarios, socios, produtos e eventos usando diretoria_id como coluna líder. Incluir colunas adicionais no índice quando aplicável: usuarios (diretoria_id, role), eventos (diretoria_id, data). Os índices devem ser criados via CREATE INDEX CONCURRENTLY (ou equivalente) para evitar lock de tabela em produção.

**Comportamento esperado:**
Consultas filtradas por diretoria_id nas quatro tabelas passam a usar índice (visível via EXPLAIN ANALYZE como Index Scan) em vez de Seq Scan, reduzindo o tempo de execução em tabelas com grande volume de registros.

**Critérios de aceite:**
- [ ] Quando a migração é executada, então os índices idx_usuarios_diretoria_role, idx_socios_diretoria, idx_produtos_diretoria e idx_eventos_diretoria_data são criados sem erro.
- [ ] Quando uma consulta filtra usuarios por diretoria_id e role, então o plano de execução (EXPLAIN) mostra uso do índice composto em vez de Seq Scan.
- [ ] Quando uma consulta filtra eventos por diretoria_id e intervalo de data, então o plano de execução mostra uso do índice idx_eventos_diretoria_data.
- [ ] Quando a migração é aplicada em uma tabela com registros existentes em produção, então a criação do índice não bloqueia escritas concorrentes na tabela.
- [ ] Quando a migração é revertida (rollback), então todos os índices criados são removidos sem afetar dados das tabelas.

**Especificidade técnica:**
- Campos: `diretoria_id`, `role`, `data`, `usuarios`, `socios`, `produtos`, `eventos`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-113 (ver requirements.json)

---

### [Sprint 2] Implementar guard de tenant para isolamento por diretoria
<!-- sdd-bot:meta id="BL-040" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-126" dependsOn="REQ-66" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-66

**Descrição:**
Implementar um TenantGuard (interceptor/guard no backend) que, após o JwtAuthGuard validar o token, extrai o diretoria_id do usuário autenticado (via payload do JWT ou consulta ao registro do usuário) e injeta esse valor no contexto da requisição. Aplicar o guard globalmente ou nos controllers que acessam dados de socios, produtos e eventos, filtrando automaticamente todas as queries por diretoria_id e bloqueando acesso a recursos de diretoria_id diferente do usuário autenticado.

**Comportamento esperado:**
Uma requisição autenticada que tenta acessar ou modificar um recurso (sócio, produto ou evento) pertencente a uma diretoria_id diferente da do usuário recebe HTTP 403 com mensagem 'acesso não permitido para este tenant'. Requisições para recursos da própria diretoria são processadas normalmente.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado solicita um recurso (ex.: GET /produtos/:id) cujo diretoria_id difere do seu, então a API retorna HTTP 403 com mensagem 'acesso não permitido para este tenant'.
- [ ] Quando um usuário autenticado solicita um recurso da própria diretoria, então a API retorna HTTP 200 com os dados do recurso.
- [ ] Quando uma requisição chega ao TenantGuard sem um token JWT previamente validado (JwtAuthGuard não executado), então a API retorna HTTP 401 antes de qualquer verificação de tenant.
- [ ] Quando uma listagem é solicitada (ex.: GET /socios), então apenas registros com diretoria_id igual ao do usuário autenticado são retornados, mesmo existindo registros de outras diretorias no banco.
- [ ] Quando um usuário tenta criar um recurso informando diretoria_id diferente do seu no corpo da requisição, então a API ignora o valor informado e usa o diretoria_id do usuário autenticado, retornando HTTP 201 com o valor correto.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 401, 403
- Campos: `diretoria_id`
- Precisa de esclarecimento: sim — O requisito não especifica se o guard deve ser aplicado globalmente (todos os endpoints) ou apenas em controllers específicos, nem a origem exata do diretoria_id (claim no JWT vs. consulta ao banco). Depende da implementação de REQ-66 (guard JWT) para definir o formato do payload.

**Rastreabilidade:** REQ-126 (ver requirements.json)

---

### [Sprint 2] Modularizar backend por domínios de negócio
<!-- sdd-bot:meta id="BL-041" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-131" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Reorganizar o backend em módulos NestJS independentes, um por domínio: DiretoriasModule, UsuariosModule, UsuarioDiretoriaModule, SociosModule, LojaModule e EventosModule. Cada módulo deve encapsular seus próprios controllers, services, entities/DTOs e repositórios, expondo apenas o necessário via exports do módulo, sem imports cruzados diretos de camadas internas entre domínios.

**Comportamento esperado:**
A estrutura de pastas do backend reflete um módulo por domínio (diretorias/, usuarios/, usuario-diretoria/, socios/, loja/, eventos/), cada um registrado no AppModule e compilando/inicializando a aplicação sem erros de dependência circular.

**Critérios de aceite:**
- [ ] Quando a aplicação é iniciada, então os 6 módulos (diretorias, usuarios, usuario-diretoria, socios, loja, eventos) são carregados sem erro de resolução de dependências.
- [ ] Quando um módulo precisa de um provider de outro domínio, então o acesso ocorre exclusivamente via export/import explícito do módulo, nunca por import direto de arquivo interno de outro domínio.
- [ ] Quando o projeto é buildado (tsc/nest build), então não há dependência circular entre módulos (validável via madge ou equivalente).
- [ ] Quando um novo endpoint é adicionado a um domínio existente, então ele reside dentro da pasta/módulo correspondente, sem misturar responsabilidades de outro domínio no mesmo controller.

**Especificidade técnica:**
- Campos: `DiretoriasModule`, `UsuariosModule`, `UsuarioDiretoriaModule`, `SociosModule`, `LojaModule`, `EventosModule`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-131 (ver requirements.json)

---

### [Sprint 2] Substituir prisma.service.ts por TypeORM DataSource
<!-- sdd-bot:meta id="BL-042" epic="Estrutura de diretórios - database/" layer="backend" requirementIds="REQ-172" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Remover o prisma.service.ts e implementar um DataSource do TypeORM configurado em database/data-source.ts, com conexão via variáveis de ambiente (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME), registrado no AppModule via TypeOrmModule.forRootAsync. Migrar entidades e repositórios que dependiam do PrismaClient para usar Repository<Entity> do TypeORM.

**Comportamento esperado:**
A aplicação conecta ao banco de dados exclusivamente via TypeORM DataSource, sem nenhuma referência restante ao PrismaClient ou prisma.service.ts no código-fonte.

**Critérios de aceite:**
- [ ] Quando a aplicação inicia, então o TypeORM DataSource estabelece conexão com o banco usando as variáveis de ambiente definidas, sem instanciar PrismaClient.
- [ ] Quando o código-fonte é buscado por referências a 'PrismaClient' ou 'prisma.service', então nenhuma ocorrência é encontrada fora de arquivos de migração histórica ou changelog.
- [ ] Quando uma query de repositório é executada (ex.: findOne, save), então utiliza Repository<Entity> do TypeORM e retorna os dados no mesmo formato consumido pelos services existentes.
- [ ] Quando a variável de ambiente DB_HOST ou DB_NAME está ausente, então a aplicação falha a inicialização com erro explícito de configuração, em vez de conexão silenciosa incorreta.

**Especificidade técnica:**
- Campos: `data-source.ts`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `TypeOrmModule.forRootAsync`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-172 (ver requirements.json)

---

### [Sprint 2] Isolar dados por diretoria_id em queries multi-tenant
<!-- sdd-bot:meta id="BL-043" epic="8.3 Isolamento de Tenant" layer="backend" requirementIds="REQ-243" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar isolamento row-level multi-tenant adicionando a coluna diretoria_id (foreign key para Diretorias) nas tabelas de domínio aplicáveis (usuarios, socios, loja, eventos, usuario_diretoria), e aplicar filtro automático por diretoria_id em todas as queries de leitura/escrita dos repositórios TypeORM, via um subscriber/query builder wrapper ou escopo de repositório que injeta o diretoria_id do contexto da requisição (request-scoped) em todo SELECT, UPDATE e DELETE.

**Comportamento esperado:**
Toda consulta a dados tenant-específicos retorna e afeta somente registros pertencentes à diretoria_id do usuário autenticado, mesmo sem o filtro ser passado explicitamente pelo chamador.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado na diretoria A consulta um recurso (ex.: GET /socios), então apenas registros com diretoria_id = A são retornados.
- [ ] Quando um usuário tenta acessar por ID um recurso pertencente a outra diretoria, então a API retorna 404 Not Found (não 403), evitando confirmar a existência do registro em outro tenant.
- [ ] Quando um registro é criado via POST, então o diretoria_id é preenchido automaticamente a partir do contexto da requisição, ignorando qualquer diretoria_id enviado no corpo da requisição.
- [ ] Quando uma query é executada sem contexto de diretoria_id disponível (ex.: job sem tenant definido), então a operação é bloqueada com erro explícito em vez de retornar dados de todas as diretorias.
- [ ] Quando um UPDATE ou DELETE é solicitado para um registro de outra diretoria, então a operação não afeta nenhuma linha e retorna 404.

**Especificidade técnica:**
- Códigos HTTP: 404
- Campos: `diretoria_id`
- Precisa de esclarecimento: sim — Falta definir o mecanismo técnico exato de injeção automática do filtro diretoria_id (TypeORM subscriber, custom repository base class, ou query builder middleware) e se o isolamento será reforçado também por Row Level Security no PostgreSQL como camada adicional.

**Rastreabilidade:** REQ-243 (ver requirements.json)

---

### [Sprint 2] Validar diretoriaAtiva contra directorias do usuário no TenantGuard
<!-- sdd-bot:meta id="BL-044" epic="8.3 Isolamento de Tenant" layer="backend" requirementIds="REQ-244" dependsOn="REQ-243" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-243

**Descrição:**
Implementar TenantGuard (NestJS CanActivate) que, após o JwtAuthGuard, extrai a diretoriaAtiva do header/claim da requisição e verifica se esse valor está presente no array user.directorias do payload JWT/registro do usuário. O guard deve ser aplicado globalmente ou via decorator @UseGuards(TenantGuard) nas rotas que dependem de contexto de diretoria, e popular request.diretoriaId para uso pelo isolamento row-level (REQ-243).

**Comportamento esperado:**
Requisições cuja diretoriaAtiva não pertence ao conjunto de diretorias do usuário autenticado são rejeitadas antes de chegar ao controller, e requisições válidas seguem com o diretoriaId disponível no contexto.

**Critérios de aceite:**
- [ ] Quando a diretoriaAtiva informada está contida em user.directorias, então a requisição prossegue e request.diretoriaId é definido com esse valor.
- [ ] Quando a diretoriaAtiva informada não está em user.directorias, então a API retorna 403 Forbidden com mensagem 'Acesso negado à diretoria informada'.
- [ ] Quando a requisição não informa diretoriaAtiva em rota que exige TenantGuard, então a API retorna 400 Bad Request indicando o campo ausente.
- [ ] Quando o TenantGuard é executado sem que o JwtAuthGuard tenha previamente autenticado o usuário, então a requisição é rejeitada com 401 Unauthorized.
- [ ] Quando user.directorias está vazio (usuário sem diretorias vinculadas), então qualquer diretoriaAtiva informada resulta em 403 Forbidden.

**Especificidade técnica:**
- Códigos HTTP: 400, 401, 403
- Campos: `diretoriaAtiva`, `user.directorias`, `request.diretoriaId`
- Precisa de esclarecimento: sim — Falta definir se diretoriaAtiva é enviada via header customizado (ex.: X-Diretoria-Id), query param ou claim dentro do próprio JWT, o que muda a implementação de extração no guard.

**Rastreabilidade:** REQ-244 (ver requirements.json)

---

### [Sprint 2] Containerizar backend com Docker node:18-alpine
<!-- sdd-bot:meta id="BL-045" epic="Deployment" layer="backend" requirementIds="REQ-324" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Criar Dockerfile na raiz do backend baseado na imagem node:18-alpine, com etapas: (1) copiar package.json e package-lock.json, (2) instalar dependências de produção via `npm ci --omit=dev` (ou equivalente), (3) copiar código-fonte, (4) executar `npm run build` para gerar artefatos compilados (ex.: pasta dist), (5) definir CMD para iniciar o servidor a partir dos artefatos buildados.

**Comportamento esperado:**
Ao executar `docker build -t backend .`, a imagem é criada com tag 'backend' sem erros, a pasta dist é gerada dentro do container e `docker run backend` inicia o processo Node sem lançar exceção de módulo ausente.

**Critérios de aceite:**
- [ ] Quando o comando `docker build -t backend .` é executado na raiz do projeto, então a imagem é construída retornando exit code 0.
- [ ] Quando a imagem é inspecionada, então a base utilizada é node:18-alpine (verificável via `docker history` ou FROM no Dockerfile).
- [ ] Quando o build ocorre, então apenas dependências de produção são instaladas (devDependencies ausentes em node_modules dentro da imagem final).
- [ ] Quando o build finaliza, então a pasta/artefato de build (ex.: dist) está presente na imagem antes do CMD ser executado.
- [ ] Quando o package.json não existir no contexto de build, então `docker build` falha com erro de arquivo não encontrado antes de tentar instalar dependências.

**Especificidade técnica:**
- Campos: `Dockerfile`, `package.json`, `package-lock.json`, `dist`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-324 (ver requirements.json)

---

### [Sprint 2] Expor porta 3000 no container do backend
<!-- sdd-bot:meta id="BL-046" epic="Deployment" layer="backend" requirementIds="REQ-325" dependsOn="REQ-324" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-324

**Descrição:**
Adicionar a instrução EXPOSE 3000 no Dockerfile do backend e garantir que a aplicação Node escute na porta 3000 (via variável de ambiente PORT ou valor fixo), permitindo mapeamento de porta no `docker run -p`.

**Comportamento esperado:**
Ao rodar o container com `docker run -p 3000:3000 backend`, requisições HTTP para localhost:3000 alcançam o servidor Node e recebem resposta do endpoint de health check.

**Critérios de aceite:**
- [ ] Quando o Dockerfile é inspecionado, então contém a instrução `EXPOSE 3000`.
- [ ] Quando o container é iniciado com `docker run -p 3000:3000 backend`, então uma requisição GET para http://localhost:3000/health retorna status 200.
- [ ] Quando a variável de ambiente PORT não é definida, então a aplicação assume a porta 3000 como padrão.
- [ ] Quando o container é iniciado sem mapear a porta (`docker run backend` sem -p), então o servidor ainda escuta internamente na porta 3000, mas a porta não fica acessível externamente.

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `EXPOSE`, `PORT`, `/health`
- Limites: porta 3000
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-325 (ver requirements.json)

---

### [Sprint 2] Iniciar backend em modo produção via start:prod
<!-- sdd-bot:meta id="BL-047" epic="Deployment" layer="backend" requirementIds="REQ-326" dependsOn="REQ-324" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-324

**Descrição:**
Adicionar script `start:prod` no package.json que executa o servidor a partir dos artefatos compilados (ex.: `node dist/main.js`), configurando NODE_ENV=production, e definir este script como CMD padrão no Dockerfile.

**Comportamento esperado:**
Ao executar `npm run start:prod`, o processo Node inicia a partir do arquivo compilado em dist, com NODE_ENV=production, sem depender de compilação em tempo real (sem ts-node ou nodemon).

**Critérios de aceite:**
- [ ] Quando `npm run start:prod` é executado após o build, então o processo inicia lendo o arquivo compilado (ex.: dist/main.js) e permanece ativo.
- [ ] Quando o script start:prod roda, então a variável NODE_ENV é definida como 'production' no processo.
- [ ] Quando o script start:prod é executado sem que o build (dist) tenha sido gerado previamente, então o processo falha com erro 'Cannot find module' apontando para o arquivo ausente.
- [ ] Quando o container é iniciado, então o CMD do Dockerfile invoca `npm run start:prod` (ou equivalente direto `node dist/main.js`) como comando de entrada.

**Especificidade técnica:**
- Campos: `start:prod`, `NODE_ENV`, `dist/main.js`, `CMD`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-326 (ver requirements.json)

---

### [Sprint 2] Automatizar pipeline CI/CD de deploy no push à main
<!-- sdd-bot:meta id="BL-048" epic="Deployment" layer="backend" requirementIds="REQ-330" dependsOn="REQ-324" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-324

**Descrição:**
Configurar workflow de CI/CD (ex.: GitHub Actions) disparado em push na branch main, com etapas sequenciais: (1) executar migrações do banco de dados (ex.: `prisma migrate deploy` ou equivalente ORM), (2) construir a imagem Docker do backend, (3) publicar a imagem em um registry (ex.: Docker Hub ou GitHub Container Registry), (4) acionar deploy no Render via API/deploy hook, interrompendo o pipeline se qualquer etapa anterior falhar.

**Comportamento esperado:**
Ao realizar push na branch main, o pipeline executa as 4 etapas em sequência e, ao final, a nova versão do backend fica disponível em produção no Render com o schema de banco atualizado, visível na aba Actions do repositório com status 'success'.

**Critérios de aceite:**
- [ ] Quando um push é feito na branch main, então o workflow de CI/CD é disparado automaticamente sem intervenção manual.
- [ ] Quando a etapa de migrações roda contra o banco de produção, então o schema aplicado corresponde à última migração presente no diretório de migrations do repositório.
- [ ] Quando a etapa de build Docker é concluída, então a imagem é publicada no registry com uma tag correspondente ao commit SHA ou 'latest'.
- [ ] Quando todas as etapas anteriores são concluídas, então o deploy hook do Render é chamado e o status HTTP retornado pela chamada ao Render é 200 ou 201.
- [ ] Quando a etapa de migração falha (ex.: erro de sintaxe SQL ou conflito de schema), então o pipeline interrompe a execução com status de falha e as etapas de build/publish/deploy não são executadas.
- [ ] Quando o push ocorre em uma branch diferente de main, então o pipeline de deploy não é disparado.

**Especificidade técnica:**
- Códigos HTTP: 200, 201
- Campos: `main`, `migrate deploy`, `deploy hook`, `registry`
- Precisa de esclarecimento: sim — Não especifica qual registry de imagens (Docker Hub, GHCR, etc.) nem o mecanismo exato de acionamento do deploy no Render (deploy hook HTTP vs integração nativa via render.yaml), decisão técnica pendente de definição.

**Rastreabilidade:** REQ-330 (ver requirements.json)

---

### [Sprint 2] Executar migrações TypeORM automaticamente no deploy
<!-- sdd-bot:meta id="BL-049" epic="Deployment" layer="backend" requirementIds="REQ-331" dependsOn="REQ-330" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-330

**Descrição:**
Adicionar ao pipeline de CI/CD (etapa de deploy do container backend) a execução do comando `typeorm migration:run` (ou script npm equivalente, ex.: `npm run migration:run`) contra o banco de dados de produção antes de o container da aplicação iniciar/receber tráfego. O comando deve rodar como step isolado no Dockerfile (entrypoint/script de bootstrap) ou no workflow de CI/CD (ex.: GitHub Actions), lendo as variáveis de ambiente de conexão (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) já configuradas no REQ-330. O processo de deploy deve falhar (exit code != 0) e abortar o rollout se alguma migração falhar, impedindo que o container siga para o próximo estágio.

**Comportamento esperado:**
Ao disparar um novo deploy, as migrações pendentes são aplicadas ao banco automaticamente antes da aplicação ficar disponível, sem intervenção manual, e o deploy é bloqueado caso qualquer migração falhe.

**Critérios de aceite:**
- [ ] Quando o pipeline de deploy é executado com migrações pendentes no diretório de migrations, então o comando migration:run é executado e as migrações são aplicadas ao banco antes do container da aplicação ficar disponível para tráfego.
- [ ] Quando não há migrações pendentes, então o step de migração é executado sem erro e o deploy prossegue normalmente sem reaplicar migrações já registradas na tabela migrations do TypeORM.
- [ ] Quando uma migração falha durante a execução (ex.: erro de SQL ou conflito de schema), então o pipeline de deploy retorna código de saída diferente de zero, aborta o rollout e o container antigo permanece ativo.
- [ ] Quando as variáveis de conexão com o banco (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) estão ausentes ou inválidas, então o step de migração falha imediatamente com mensagem de erro de conexão e o deploy é interrompido antes de iniciar a aplicação.
- [ ] Quando o step de migração é executado em ambiente com múltiplas réplicas iniciando simultaneamente, então apenas uma execução aplica as migrações, evitando execução concorrente duplicada.

**Especificidade técnica:**
- Campos: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `migrations (tabela TypeORM)`
- Precisa de esclarecimento: sim — Não está definido se a execução das migrações ocorrerá via step do workflow de CI/CD (ex.: job separado no GitHub Actions antes do deploy) ou via entrypoint do container no startup, nem como será garantida a exclusão mútua entre réplicas concorrentes (lock distribuído, job único de migração, ou init container). Essa decisão de arquitetura de deploy precisa ser definida antes da implementação.

**Rastreabilidade:** REQ-331 (ver requirements.json)

---

### [Sprint 3] Autenticar estudante via RGA e senha
<!-- sdd-bot:meta id="BL-050" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-7" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /auth/login/estudante que recebe campos 'rga' e 'senha', consulta a tabela de usuários filtrando por rga, valida a senha com bcrypt.compare contra o hash armazenado e, em caso de sucesso, gera um JWT assinado contendo userId, role e atleticaId no payload, com expiração configurável (ex.: 24h).

**Comportamento esperado:**
O estudante recebe um token JWT válido e os dados básicos do seu perfil ao informar RGA e senha corretos; recebe erro apropriado quando as credenciais são inválidas.

**Critérios de aceite:**
- [ ] Quando um estudante enviar RGA e senha válidos cadastrados no sistema, então a API retorna HTTP 200 com um JWT no campo 'token' e dados do usuário (id, nome, role, atleticaId).
- [ ] Quando o RGA informado não existir na base, então a API retorna HTTP 401 com mensagem 'Credenciais inválidas' sem indicar se o RGA existe.
- [ ] Quando a senha informada não corresponder ao hash bcrypt armazenado, então a API retorna HTTP 401 com mensagem 'Credenciais inválidas'.
- [ ] Quando o campo 'rga' ou 'senha' estiver ausente ou vazio no corpo da requisição, então a API retorna HTTP 400 com mensagem indicando o campo obrigatório faltante.
- [ ] Quando o login for validado, então o token JWT gerado expira em 24 horas a partir da emissão.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 401
- Campos: `rga`, `senha`, `token`, `userId`, `role`, `atleticaId`
- Limites: expiração do JWT em 24 horas
- Precisa de esclarecimento: sim — Não há definição do tempo exato de expiração do JWT nem da política de rate limiting/bloqueio após tentativas falhas; valor de 24h foi assumido como padrão e precisa ser confirmado.

**Rastreabilidade:** REQ-7 (ver requirements.json)

---

### [Sprint 3] Autenticar usuário não-estudante via CPF e senha
<!-- sdd-bot:meta id="BL-051" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-8" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /auth/login/nao-estudante que recebe campos 'cpf' e 'senha', consulta a tabela de usuários filtrando por cpf (removendo máscara/formatação antes da query), valida a senha com bcrypt.compare contra o hash armazenado e gera um JWT assinado com userId, role e atleticaId (quando vinculado).

**Comportamento esperado:**
O usuário não-estudante recebe um token JWT válido e dados básicos do perfil ao informar CPF e senha corretos; recebe erro apropriado quando as credenciais são inválidas ou o CPF é malformado.

**Critérios de aceite:**
- [ ] Quando um usuário não-estudante enviar CPF (com ou sem máscara) e senha válidos, então a API retorna HTTP 200 com um JWT no campo 'token' e dados do usuário (id, nome, role, atleticaId).
- [ ] Quando o CPF informado não existir na base, então a API retorna HTTP 401 com mensagem 'Credenciais inválidas'.
- [ ] Quando a senha informada não corresponder ao hash bcrypt armazenado, então a API retorna HTTP 401 com mensagem 'Credenciais inválidas'.
- [ ] Quando o CPF informado não seguir o formato de 11 dígitos numéricos (com ou sem pontuação), então a API retorna HTTP 400 com mensagem 'CPF inválido'.
- [ ] Quando o campo 'cpf' ou 'senha' estiver ausente no corpo da requisição, então a API retorna HTTP 400 com mensagem indicando o campo obrigatório faltante.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 401
- Campos: `cpf`, `senha`, `token`, `userId`, `role`, `atleticaId`
- Limites: CPF com 11 dígitos numéricos
- Precisa de esclarecimento: sim — Não está definido se haverá validação de dígito verificador do CPF (algoritmo completo) além do formato de 11 dígitos, nem o tempo de expiração do JWT para este fluxo.

**Rastreabilidade:** REQ-8 (ver requirements.json)

---

### [Sprint 3] Extrair código de curso do RGA e vincular à atlética
<!-- sdd-bot:meta id="BL-052" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-9" dependsOn="REQ-7" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-7

**Descrição:**
Implementar lógica de parsing no serviço de autenticação que extrai o segmento correspondente ao código do curso a partir da string do RGA do estudante (posição/padrão definido no formato institucional do RGA), consulta a tabela de atléticas pelo campo codigoCurso e associa o atleticaId retornado ao usuário autenticado, persistindo essa vinculação no registro do estudante durante o processo de login ou cadastro.

**Comportamento esperado:**
O estudante é automaticamente associado à atlética correspondente ao seu curso assim que autentica, sem necessidade de seleção manual.

**Critérios de aceite:**
- [ ] Quando o RGA do estudante contiver um código de curso correspondente a uma atlética cadastrada, então o campo atleticaId do usuário é preenchido com o id dessa atlética e retornado no payload do login.
- [ ] Quando o código de curso extraído do RGA não corresponder a nenhuma atlética cadastrada na tabela, então a API retorna HTTP 200 com login válido mas atleticaId nulo e um campo 'avisoAtletica' indicando 'Atlética não encontrada para o curso'.
- [ ] Quando o RGA não seguir o padrão de formato esperado (tamanho ou estrutura inválida) para extração do código de curso, então a API retorna HTTP 400 com mensagem 'Formato de RGA inválido'.
- [ ] Quando a extração e vinculação forem concluídas, então o atleticaId é persistido no registro do estudante no banco de dados, evitando reprocessamento em logins futuros.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `rga`, `atleticaId`, `codigoCurso`, `avisoAtletica`
- Precisa de esclarecimento: sim — Falta especificar o padrão exato de formato do RGA (quantidade de dígitos, posição do código do curso na string) usado pela instituição para realizar o parsing correto.

**Rastreabilidade:** REQ-9 (ver requirements.json)

---

### [Sprint 3] Vincular não-estudante à atlética por código no cadastro
<!-- sdd-bot:meta id="BL-053" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-10" dependsOn="REQ-8" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-8

**Descrição:**
Adicionar campo 'codigoAtletica' ao endpoint de cadastro de usuários não-estudantes (POST /usuarios/cadastro ou equivalente), que consulta a tabela de atléticas pelo campo codigoAtletica, valida a existência do código e associa o atleticaId retornado ao registro do novo usuário antes da persistência no banco.

**Comportamento esperado:**
O usuário não-estudante informa um código no cadastro e é vinculado à atlética correspondente, ficando apto a acessar recursos restritos a essa atlética após o login.

**Critérios de aceite:**
- [ ] Quando o cadastro informar um 'codigoAtletica' existente na tabela de atléticas, então o usuário é criado com o campo atleticaId preenchido e a API retorna HTTP 201.
- [ ] Quando o 'codigoAtletica' informado não corresponder a nenhuma atlética cadastrada, então a API retorna HTTP 404 com mensagem 'Atlética não encontrada'.
- [ ] Quando o campo 'codigoAtletica' estiver ausente no corpo da requisição, então a API retorna HTTP 400 com mensagem 'Código da atlética é obrigatório'.
- [ ] Quando o cadastro for concluído, então o campo atleticaId do usuário criado é retornado no corpo da resposta HTTP 201 junto aos demais dados do perfil.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 404
- Campos: `codigoAtletica`, `atleticaId`
- Precisa de esclarecimento: sim — Não há definição do formato/tamanho exato do código da atlética (alfanumérico, quantidade de caracteres) nem se o código é case-sensitive.

**Rastreabilidade:** REQ-10 (ver requirements.json)

---

### [Sprint 3] Validar CPF por dígito verificador e confirmar e-mail
<!-- sdd-bot:meta id="BL-054" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-11" dependsOn="REQ-8" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-8

**Descrição:**
No endpoint de cadastro (ex.: POST /api/auth/cadastro), implementar validação do campo `cpf` calculando os dois dígitos verificadores conforme algoritmo oficial da Receita Federal (módulo 11), rejeitando CPFs com sequências repetidas (ex.: 111.111.111-11). Após validação estrutural, gerar um token de confirmação de e-mail (armazenado em tabela `email_confirmation_tokens` com expiração) e enviar e-mail com link/código para o endereço informado em `email`. O usuário só deve ser marcado como `ativo=true` após confirmar o e-mail via endpoint dedicado (ex.: GET /api/auth/confirmar-email?token=).

**Comportamento esperado:**
Cadastros com CPF inválido são recusados antes da persistência, e o usuário só consegue autenticar-se após confirmar o e-mail recebido.

**Critérios de aceite:**
- [ ] Quando o CPF informado tiver dígitos verificadores inconsistentes com o algoritmo módulo 11, então a API retorna 422 com campo `errors.cpf` = 'CPF inválido'.
- [ ] Quando o CPF for uma sequência repetida (ex.: 000.000.000-00), então a API retorna 422 com a mesma mensagem de erro de CPF inválido.
- [ ] Quando o cadastro for aceito com CPF válido, então o sistema cria o usuário com `ativo=false` e envia e-mail de confirmação contendo token único com expiração de 24 horas.
- [ ] Quando o usuário acessar o link de confirmação com token válido e não expirado, então o sistema atualiza `ativo=true` e retorna 200.
- [ ] Quando o token de confirmação estiver expirado ou inválido, então o endpoint de confirmação retorna 400 com `errors.token` = 'Token inválido ou expirado'.
- [ ] Quando um usuário com `ativo=false` tentar realizar login, então a API retorna 403 com mensagem 'E-mail não confirmado'.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403, 422
- Campos: `cpf`, `email`, `errors.cpf`, `errors.token`, `ativo`, `email_confirmation_tokens`
- Limites: Expiração do token de confirmação de e-mail: 24 horas
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-11 (ver requirements.json)

---

### [Sprint 3] Implementar PermissionService para avaliação de permissões
<!-- sdd-bot:meta id="BL-055" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-61" dependsOn="REQ-59" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-59

**Descrição:**
Criar a classe/serviço `PermissionService` no backend, expondo método(s) como `hasPermission(usuarioId, recurso, acao)` que consulta as roles do usuário (via tabela `usuarios_roles` ou equivalente) e a matriz de permissões por role definida no sistema, retornando um booleano. O serviço deve ser injetado como dependência (guard/middleware) nos endpoints protegidos, substituindo verificações de permissão espalhadas no código por uma fonte única de verdade.

**Comportamento esperado:**
Endpoints protegidos consultam o PermissionService para decidir se o usuário autenticado pode executar a ação solicitada, retornando 403 quando não autorizado.

**Critérios de aceite:**
- [ ] Quando `PermissionService.hasPermission` for chamado com uma role que possui a permissão para o recurso/ação, então o método retorna `true`.
- [ ] Quando a role do usuário não possuir a permissão solicitada, então o método retorna `false` e o middleware responde 403 com `errors.message` = 'Permissão insuficiente'.
- [ ] Quando o `usuarioId` informado não existir na base, então o serviço lança exceção tratada que resulta em resposta 404.
- [ ] Quando um usuário possuir múltiplas roles, então o serviço deve considerar a união de permissões de todas as roles vinculadas antes de negar acesso.
- [ ] Quando o middleware de permissão for aplicado a uma rota sem usuário autenticado (token ausente), então a API retorna 401 antes de chamar o PermissionService.

**Especificidade técnica:**
- Códigos HTTP: 401, 403, 404
- Campos: `usuarioId`, `recurso`, `acao`, `usuarios_roles`, `errors.message`
- Precisa de esclarecimento: sim — A matriz de permissões por role (quais roles têm acesso a quais recursos/ações) não está definida no requisito; é necessário especificar a fonte de dados (tabela estática, config em código, ou tabela `permissoes` dinâmica) antes da implementação.

**Rastreabilidade:** REQ-61 (ver requirements.json)

---

### [Sprint 3] Implementar UsuarioDiretoriaService para vínculo com diretoria
<!-- sdd-bot:meta id="BL-056" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-62" dependsOn="REQ-59" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-59

**Descrição:**
Criar a classe `UsuarioDiretoriaService` responsável por gerenciar registros na tabela `usuario_diretoria` (relação N:N entre `usuarios` e `diretorias`), com métodos para auto-discovery de diretoria a partir do RGA do usuário (consultando tabela/serviço externo que mapeia RGA para diretoria) e para vinculação manual via código de diretoria informado pelo usuário (ex.: endpoint POST /api/usuarios/{id}/diretoria com body `{codigoDiretoria}`).

**Comportamento esperado:**
O usuário é vinculado automaticamente à diretoria correspondente ao seu RGA no cadastro, ou pode ser vinculado manualmente informando um código de diretoria válido quando o auto-discovery não encontrar correspondência.

**Critérios de aceite:**
- [ ] Quando o RGA do usuário corresponder a uma diretoria conhecida na base de mapeamento, então o serviço cria automaticamente o vínculo em `usuario_diretoria` sem intervenção manual.
- [ ] Quando o auto-discovery não encontrar diretoria correspondente ao RGA, então o usuário permanece sem vínculo e a API expõe esse estado (ex.: `diretoria: null`) até vinculação manual.
- [ ] Quando o usuário enviar POST /api/usuarios/{id}/diretoria com `codigoDiretoria` válido, então o serviço cria o vínculo e retorna 201 com os dados da diretoria vinculada.
- [ ] Quando o `codigoDiretoria` informado não existir na tabela `diretorias`, então a API retorna 404 com `errors.codigoDiretoria` = 'Diretoria não encontrada'.
- [ ] Quando o usuário já possuir vínculo ativo com uma diretoria e tentar vincular-se a outra, então a API retorna 409 com mensagem 'Usuário já vinculado a uma diretoria'.

**Especificidade técnica:**
- Códigos HTTP: 201, 404, 409
- Campos: `rga`, `codigoDiretoria`, `usuario_diretoria`, `diretorias`, `errors.codigoDiretoria`
- Precisa de esclarecimento: sim — Não está definida a fonte do mapeamento RGA→diretoria para o auto-discovery (tabela interna pré-carregada, regra de prefixo do RGA, ou integração externa), nem se um usuário pode ter vínculo com mais de uma diretoria simultaneamente.

**Rastreabilidade:** REQ-62 (ver requirements.json)

---

### [Sprint 3] Implementar CpfVerificationService para validação de CPF
<!-- sdd-bot:meta id="BL-057" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-63" dependsOn="REQ-59" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-59

**Descrição:**
Criar a classe `CpfVerificationService`, isolando a lógica de cálculo dos dígitos verificadores de CPF (algoritmo módulo 11) e detecção de sequências inválidas (todos os dígitos iguais), expondo método `verificar(cpf: string): boolean` reutilizável por outros módulos (ex.: cadastro, atualização de perfil), removendo duplicação de validação de CPF em múltiplos endpoints.

**Comportamento esperado:**
Qualquer módulo do backend que precise validar CPF utiliza `CpfVerificationService.verificar`, obtendo resultado consistente sem reimplementar o algoritmo.

**Critérios de aceite:**
- [ ] Quando `verificar` for chamado com um CPF cujos dígitos verificadores sejam consistentes com o algoritmo módulo 11, então o método retorna `true`.
- [ ] Quando `verificar` for chamado com um CPF cujo segundo ou primeiro dígito verificador não confira, então o método retorna `false`.
- [ ] Quando `verificar` for chamado com uma sequência de 11 dígitos iguais (ex.: '11111111111'), então o método retorna `false` mesmo que a fórmula matemática coincida.
- [ ] Quando `verificar` for chamado com uma string de tamanho diferente de 11 dígitos numéricos (após remover máscara), então o método retorna `false` sem lançar exceção.
- [ ] Quando `verificar` for chamado com valor nulo ou vazio, então o método retorna `false`.

**Especificidade técnica:**
- Campos: `cpf`, `verificar`
- Limites: CPF deve conter exatamente 11 dígitos numéricos após remoção de máscara
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-63 (ver requirements.json)

---

### [Sprint 3] Criar Repository de UsuarioDiretoria
<!-- sdd-bot:meta id="BL-058" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-65" dependsOn="REQ-64" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-64

**Descrição:**
Implementar a classe UsuarioDiretoriaRepository na camada de acesso a dados, responsável por encapsular as operações de persistência sobre a tabela usuario_diretoria (relação N:N entre Usuario e Diretoria). O repository deve expor métodos como findByUsuarioId, findByDiretoriaId, findByUsuarioEDiretoria (busca composta pela chave usuario_id + diretoria_id), create e delete, utilizando o ORM já configurado no projeto (ex.: TypeORM/Prisma) e reaproveitando a entidade UsuarioDiretoria definida em REQ-64.

**Comportamento esperado:**
Ao chamar os métodos do repository, o sistema retorna os registros de vínculo usuário-diretoria persistidos no banco, permitindo consultar, criar e remover vínculos sem acesso direto ao ORM em outras camadas.

**Critérios de aceite:**
- [ ] Quando findByUsuarioId(usuarioId) for chamado com um usuário que possui vínculos, então o repository retorna a lista de registros UsuarioDiretoria correspondentes.
- [ ] Quando findByUsuarioEDiretoria(usuarioId, diretoriaId) for chamado com uma combinação existente, então retorna o registro único correspondente.
- [ ] Quando create(usuarioId, diretoriaId) for chamado para um par já existente, então o repository lança exceção de violação de chave única (constraint UQ_usuario_diretoria) sem duplicar o registro.
- [ ] Quando delete(usuarioId, diretoriaId) for chamado para um vínculo inexistente, então o método retorna 0 linhas afetadas sem lançar erro.
- [ ] Quando findByDiretoriaId(diretoriaId) for chamado para uma diretoria sem usuários vinculados, então retorna array vazio.

**Especificidade técnica:**
- Campos: `usuario_id`, `diretoria_id`, `UsuarioDiretoriaRepository`, `UQ_usuario_diretoria`
- Precisa de esclarecimento: sim — Não foi especificado o ORM/tecnologia de persistência utilizado no backend (TypeORM, Prisma, Sequelize etc.), necessário para definir a assinatura exata dos métodos do repository.

**Rastreabilidade:** REQ-65 (ver requirements.json)

---

### [Sprint 3] Implementar Global Exception Filter centralizado
<!-- sdd-bot:meta id="BL-059" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-69" dependsOn="REQ-57" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-57

**Descrição:**
Implementar um filtro global de exceções (ex.: ExceptionFilter no NestJS ou middleware equivalente) registrado na inicialização da aplicação, interceptando todas as exceções não tratadas lançadas pelos controllers e services. O filtro deve mapear exceções conhecidas (ex.: HttpException, erros de validação, erros de constraint do ORM) para respostas HTTP padronizadas com body { statusCode, message, error, timestamp, path }, e capturar exceções não mapeadas como erro 500 genérico, registrando o stack trace em log.

**Comportamento esperado:**
Ao ocorrer qualquer exceção durante o processamento de uma requisição, a API responde com um corpo JSON padronizado e código HTTP apropriado, em vez de expor stack traces ou respostas inconsistentes entre endpoints.

**Critérios de aceite:**
- [ ] Quando uma HttpException com status 400 for lançada em um controller, então a resposta contém body { statusCode: 400, message, error, timestamp, path } e o mesmo código HTTP.
- [ ] Quando uma exceção não tratada (ex.: erro de runtime) ocorrer, então a resposta retorna status 500 com message genérica 'Internal server error' e o stack trace é registrado no log do servidor.
- [ ] Quando um erro de violação de constraint do banco ocorrer (ex.: chave única duplicada), então o filtro mapeia para status 409 com message descritiva do conflito.
- [ ] Quando o filtro captura qualquer exceção, então o campo path da resposta corresponde à URL da requisição original e timestamp está em formato ISO 8601.
- [ ] Quando uma requisição é processada sem erros, então o filtro não interfere na resposta normal do endpoint.

**Especificidade técnica:**
- Códigos HTTP: 400, 409, 500
- Campos: `statusCode`, `message`, `error`, `timestamp`, `path`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-69 (ver requirements.json)

---

### [Sprint 3] Implementar autenticação via JWT no login
<!-- sdd-bot:meta id="BL-060" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-119" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar o fluxo de emissão e validação de tokens JWT no endpoint de autenticação (ex.: POST /auth/login), assinando o token com uma chave secreta (JWT_SECRET via variável de ambiente) e incluindo no payload claims como sub (id do usuário), role e diretoriaId. Implementar guard/middleware (ex.: JwtAuthGuard) para validar o token no header Authorization: Bearer <token> em rotas protegidas, decodificando e verificando assinatura e expiração.

**Comportamento esperado:**
Ao autenticar com credenciais válidas, o usuário recebe um token JWT que, quando enviado no header Authorization das requisições subsequentes, autoriza o acesso às rotas protegidas conforme a role e diretoria contidas no payload.

**Critérios de aceite:**
- [ ] Quando POST /auth/login for chamado com credenciais válidas (RGA/CPF + senha), então a resposta 200 contém um accessToken JWT assinado com payload contendo sub, role e diretoriaId.
- [ ] Quando uma rota protegida for acessada com um token JWT válido e não expirado no header Authorization, então a requisição é processada normalmente.
- [ ] Quando uma rota protegida for acessada sem o header Authorization ou com token ausente, então a resposta retorna 401 com message 'Token não fornecido'.
- [ ] Quando uma rota protegida for acessada com token expirado ou assinatura inválida, então a resposta retorna 401 com message 'Token inválido ou expirado'.
- [ ] Quando o token JWT expira, então seu tempo de vida corresponde ao valor configurado em JWT_EXPIRES_IN (ex.: variável de ambiente), não sendo aceito após esse período.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `accessToken`, `sub`, `role`, `diretoriaId`, `Authorization`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- Precisa de esclarecimento: sim — O tempo de expiração do token JWT (JWT_EXPIRES_IN) não foi especificado no requisito e precisa ser definido (ex.: 1h, 8h, 7d) antes da implementação.

**Rastreabilidade:** REQ-119 (ver requirements.json)

---

### [Sprint 3] Aplicar hashing bcrypt nas senhas de usuário
<!-- sdd-bot:meta id="BL-061" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-120" dependsOn="REQ-101" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-101

**Descrição:**
Integrar a biblioteca bcrypt no fluxo de criação/atualização de senha do usuário, substituindo qualquer armazenamento em texto plano ou hash mais fraco. A senha deve ser hasheada com bcrypt.hash(senha, saltRounds) antes de ser persistida na coluna senha_hash da tabela usuario, e a validação no login deve usar bcrypt.compare(senhaFornecida, senha_hash) em vez de comparação direta de strings.

**Comportamento esperado:**
Ao cadastrar ou autenticar um usuário, a senha nunca é armazenada nem comparada em texto plano; a validação de login aceita a senha correta e rejeita qualquer senha incorreta com base no hash bcrypt armazenado.

**Critérios de aceite:**
- [ ] Quando um usuário for cadastrado com uma senha, então o valor persistido na coluna senha_hash é um hash bcrypt (prefixo $2b$) e não a senha em texto plano.
- [ ] Quando o login for tentado com a senha correta, então bcrypt.compare retorna true e a autenticação prossegue.
- [ ] Quando o login for tentado com senha incorreta, então bcrypt.compare retorna false e a resposta é 401 com message 'Credenciais inválidas'.
- [ ] Quando o hashing for executado, então o saltRounds utilizado é de no mínimo 10, conforme configuração do serviço.
- [ ] Quando duas senhas idênticas forem hasheadas para usuários diferentes, então os hashes resultantes são distintos devido ao salt único gerado por bcrypt.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `senha_hash`, `bcrypt.hash`, `bcrypt.compare`
- Limites: saltRounds mínimo de 10
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-120 (ver requirements.json)

---

### [Sprint 3] Criar DTO de validação para payload de login
<!-- sdd-bot:meta id="BL-062" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-129" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar a classe LoginDTO no backend com decorators de validação (class-validator) para os campos de entrada do endpoint de autenticação: identificador (RGA ou CPF, string) e senha (string). O DTO deve ser utilizado no controller de autenticação para validar o corpo da requisição antes de chamar o AuthService.

**Comportamento esperado:**
Quando o payload de login não contém os campos exigidos ou contém tipos inválidos, a requisição é rejeitada antes de chegar à lógica de negócio, retornando a lista de campos inválidos na resposta.

**Critérios de aceite:**
- [ ] Quando o campo 'identificador' está ausente no corpo da requisição, então a API retorna HTTP 400 com mensagem 'identificador é obrigatório' no array de erros.
- [ ] Quando o campo 'senha' está ausente ou é uma string vazia, então a API retorna HTTP 400 com mensagem 'senha é obrigatório'.
- [ ] Quando 'identificador' e 'senha' são strings não vazias válidas, então o DTO é validado sem erros e a requisição prossegue para o AuthService.
- [ ] Quando campos extras não previstos no DTO são enviados no payload, então esses campos são removidos automaticamente (whitelist) antes de chegar ao service.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `identificador`, `senha`
- Precisa de esclarecimento: sim — Não há definição de limite mínimo/máximo de tamanho para os campos 'identificador' e 'senha' no requisito original; assumir validação apenas de presença e tipo string até definição de política de senha.

**Rastreabilidade:** REQ-129 (ver requirements.json)

---

### [Sprint 3] Detectar tipo de identificador (RGA ou CPF) no login
<!-- sdd-bot:meta id="BL-063" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-133" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar no AuthService uma função de detecção que analisa a string 'identificador' recebida no LoginDTO e classifica como RGA (padrão numérico) ou CPF (11 dígitos, com ou sem máscara), roteando a chamada para o fluxo de validação correspondente (SIA para RGA, local/bcrypt para CPF).

**Comportamento esperado:**
Quando o identificador informado corresponde ao padrão de RGA, o AuthService invoca o fluxo de validação via SIA; quando corresponde ao padrão de CPF, invoca o fluxo de validação local.

**Critérios de aceite:**
- [ ] Quando o identificador é composto apenas por dígitos com quantidade compatível com RGA (ex.: '20231234'), então o AuthService classifica o tipo como 'RGA' e chama o fluxo de validação SIA.
- [ ] Quando o identificador possui 11 dígitos numéricos (com ou sem pontuação, ex.: '123.456.789-00'), então o AuthService classifica o tipo como 'CPF' e chama o fluxo de validação local.
- [ ] Quando o identificador não corresponde a nenhum dos dois padrões (ex.: contém letras ou quantidade de dígitos inválida), então o AuthService retorna erro HTTP 400 com mensagem 'identificador inválido' sem chamar nenhum fluxo de validação.
- [ ] Quando o identificador é uma string vazia, então o AuthService retorna HTTP 400 com mensagem 'identificador inválido' antes de tentar qualquer detecção de padrão.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `identificador`
- Limites: CPF: 11 dígitos
- Precisa de esclarecimento: sim — O padrão exato de tamanho/formato do RGA (quantidade de dígitos, prefixo de ano) não está especificado no requisito; necessário confirmar regex de RGA com a área de negócio.

**Rastreabilidade:** REQ-133 (ver requirements.json)

---

### [Sprint 3] Validar credenciais via SIA (RGA) ou bcrypt local (CPF)
<!-- sdd-bot:meta id="BL-064" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-134" dependsOn="REQ-133" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-133

**Descrição:**
Implementar no AuthService a chamada ao serviço externo SIA para autenticação de usuários identificados por RGA, e a comparação de hash bcrypt (bcrypt.compare) contra o campo 'senhaHash' armazenado na tabela de usuários para autenticação de usuários identificados por CPF. O roteamento entre os dois fluxos depende do resultado da detecção implementada no REQ-133.

**Comportamento esperado:**
Quando as credenciais informadas conferem com o SIA (para RGA) ou com o hash bcrypt armazenado (para CPF), o AuthService emite um token JWT válido; quando não conferem, nenhum token é emitido e a tentativa é rejeitada com HTTP 401.

**Critérios de aceite:**
- [ ] Quando um usuário com RGA envia senha que o SIA confirma como válida, então o AuthService gera um JWT contendo o id e a role do usuário com HTTP 200.
- [ ] Quando um usuário com CPF envia senha cujo bcrypt.compare contra 'senhaHash' retorna true, então o AuthService gera um JWT com HTTP 200.
- [ ] Quando o SIA retorna indisponibilidade (timeout ou erro 5xx) para um login por RGA, então o AuthService retorna HTTP 503 com mensagem 'serviço de autenticação indisponível'.
- [ ] Quando a senha informada por um usuário com CPF não confere com o hash armazenado, então o AuthService retorna HTTP 401 com mensagem 'credenciais inválidas' sem revelar qual campo está incorreto.
- [ ] Quando o identificador (RGA ou CPF) não existe na base de usuários, então o AuthService retorna HTTP 401 com a mesma mensagem genérica 'credenciais inválidas'.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 503
- Campos: `senhaHash`
- Precisa de esclarecimento: sim — Não há especificação do contrato (endpoint, payload, timeout) do serviço SIA nem do custo (salt rounds) do bcrypt a ser usado; necessário definir com o time de infraestrutura antes da implementação.

**Rastreabilidade:** REQ-134 (ver requirements.json)

---

### [Sprint 3] Resolver diretoria principal a partir do código do RGA
<!-- sdd-bot:meta id="BL-065" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-135" dependsOn="REQ-133" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-133

**Descrição:**
Implementar no AuthService a extração do trecho do RGA que identifica o código da diretoria (conforme posição/formato definido no SIA) e a busca dessa diretoria na tabela 'diretorias' para vincular automaticamente ao usuário autenticado, apenas quando o campo 'tipo' do usuário for igual a 'ESTUDANTE'.

**Comportamento esperado:**
Quando o login é concluído por um usuário do tipo ESTUDANTE, o registro de usuário passa a ter o campo 'diretoriaPrincipalId' preenchido com o id da diretoria correspondente ao código extraído do RGA, sem exigir vinculação manual.

**Critérios de aceite:**
- [ ] Quando um usuário do tipo ESTUDANTE autentica com RGA cujo código extraído corresponde a uma diretoria cadastrada na tabela 'diretorias', então o campo 'diretoriaPrincipalId' do usuário é atualizado com o id dessa diretoria.
- [ ] Quando o usuário autenticado não é do tipo ESTUDANTE (ex.: PROFESSOR ou ADMIN), então o AuthService não executa a extração de código nem altera o campo 'diretoriaPrincipalId'.
- [ ] Quando o código extraído do RGA não corresponde a nenhuma diretoria cadastrada, então o AuthService mantém 'diretoriaPrincipalId' como null e registra log de auditoria com o código não encontrado, sem bloquear o login.
- [ ] Quando o RGA do estudante não segue o formato esperado para extração do código de diretoria, então o AuthService retorna 'diretoriaPrincipalId' como null e permite o login normalmente, sem retornar erro HTTP ao cliente.

**Especificidade técnica:**
- Campos: `diretoriaPrincipalId`, `tipo`
- Precisa de esclarecimento: sim — Não está definida a posição/quantidade de dígitos do RGA que representa o código da diretoria, nem se a vinculação automática deve sobrescrever uma diretoria já vinculada manualmente em login anterior.

**Rastreabilidade:** REQ-135 (ver requirements.json)

---

### [Sprint 3] Usar diretoriaId vinculada no login de não estudante
<!-- sdd-bot:meta id="BL-066" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-136" dependsOn="REQ-133" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-133

**Descrição:**
No AuthService, ao autenticar um usuário com tipo NAO_ESTUDANTE, ler o campo diretoriaId já persistido no registro do usuário (tabela usuario) e utilizá-lo diretamente na montagem do contexto de autenticação, sem executar o fluxo de auto-discovery por RGA aplicado a estudantes.

**Comportamento esperado:**
O objeto de autenticação retornado para um usuário NAO_ESTUDANTE contém exatamente o diretoriaId gravado no cadastro do usuário, sem chamadas ao mecanismo de auto-discovery por RGA.

**Critérios de aceite:**
- [ ] Quando um usuário do tipo NAO_ESTUDANTE com diretoriaId=5 faz login, então o token/contexto gerado contém diretoriaId=5 idêntico ao valor persistido no cadastro.
- [ ] Quando o usuário é do tipo NAO_ESTUDANTE, então o AuthService não executa a lógica de auto-discovery por RGA usada para ESTUDANTE.
- [ ] Quando um usuário do tipo NAO_ESTUDANTE possui diretoriaId nulo no cadastro, então o login retorna HTTP 422 com mensagem de erro "diretoriaId não vinculada ao usuário".
- [ ] Quando um usuário do tipo ESTUDANTE faz login, então o fluxo de diretoriaId vinculada de NAO_ESTUDANTE não é acionado.

**Especificidade técnica:**
- Códigos HTTP: 422
- Campos: `diretoriaId`, `tipoUsuario`, `NAO_ESTUDANTE`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-136 (ver requirements.json)

---

### [Sprint 3] Buscar diretorias extras vinculadas no login
<!-- sdd-bot:meta id="BL-067" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-137" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
No fluxo de login do AuthService, adicionar uma consulta à tabela usuario_diretoria filtrando por usuarioId para recuperar registros de vinculação adicional entre usuário e diretorias, agregando os diretoriaId retornados ao conjunto de diretorias do usuário autenticado.

**Comportamento esperado:**
O resultado da consulta a usuario_diretoria retorna a lista completa de diretoriaId extras associados ao usuarioId, e essa lista fica disponível na estrutura de dados do login antes da geração do token.

**Critérios de aceite:**
- [ ] Quando o usuarioId possui 3 registros na tabela usuario_diretoria, então a consulta retorna uma lista com os 3 diretoriaId correspondentes.
- [ ] Quando o usuarioId não possui nenhum registro em usuario_diretoria, então a consulta retorna uma lista vazia sem lançar exceção.
- [ ] Quando a consulta a usuario_diretoria falha por indisponibilidade do banco, então o login retorna HTTP 500 com mensagem "erro ao consultar diretorias vinculadas".
- [ ] Quando existem registros duplicados de diretoriaId para o mesmo usuarioId em usuario_diretoria, então a lista final não contém diretoriaId repetidos.

**Especificidade técnica:**
- Códigos HTTP: 500
- Campos: `usuario_diretoria`, `usuarioId`, `diretoriaId`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-137 (ver requirements.json)

---

### [Sprint 3] Incluir todas as diretorias do usuário no payload do JWT
<!-- sdd-bot:meta id="BL-068" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-138" dependsOn="REQ-135,REQ-136,REQ-137" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-135, REQ-136, REQ-137

**Descrição:**
No AuthService, após consolidar a diretoriaId principal (auto-discovery por RGA ou vínculo direto para NAO_ESTUDANTE) com as diretorias extras obtidas de usuario_diretoria, montar o payload do JWT incluindo um claim "diretorias" como array contendo todos os diretoriaId associados ao usuário, e assinar o token conforme a chave/algoritmo configurados no serviço.

**Comportamento esperado:**
O JWT emitido no login contém no payload decodificado um array "diretorias" com todos os diretoriaId do usuário, sem duplicatas e sem omissão de nenhuma diretoria vinculada.

**Critérios de aceite:**
- [ ] Quando um usuário possui 1 diretoria principal e 2 diretorias extras, então o claim "diretorias" do JWT decodificado contém exatamente 3 diretoriaId distintos.
- [ ] Quando um usuário possui apenas a diretoria principal e nenhuma extra, então o claim "diretorias" contém um array com 1 elemento.
- [ ] Quando a etapa de consolidação de diretorias falha (ex.: erro na busca de usuario_diretoria), então o endpoint de login retorna HTTP 500 e nenhum token é emitido.
- [ ] Quando o token é gerado, então ele é assinado com a chave/algoritmo configurados, permitindo validação posterior de assinatura.

**Especificidade técnica:**
- Códigos HTTP: 500
- Campos: `diretorias`, `diretoriaId`, `JWT`, `payload`
- Precisa de esclarecimento: sim — Faltam detalhes sobre o algoritmo/chave de assinatura (ex.: HS256 vs RS256) e o tempo de expiração do token, necessários para especificar a geração completa do JWT.

**Rastreabilidade:** REQ-138 (ver requirements.json)

---

### [Sprint 3] Validar assinatura do JWT na verificação de token
<!-- sdd-bot:meta id="BL-069" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-145" dependsOn="REQ-138" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-138

**Descrição:**
No endpoint/middleware de validação de token do AuthService, executar a verificação criptográfica da assinatura do JWT recebido utilizando a chave/segredo configurado, rejeitando tokens cuja assinatura não corresponda ao conteúdo do payload antes de prosseguir com qualquer checagem de expiração ou claims.

**Comportamento esperado:**
Uma requisição com JWT de assinatura inválida é rejeitada com HTTP 401 antes de qualquer leitura dos claims do payload, enquanto um JWT com assinatura válida prossegue para as demais validações.

**Critérios de aceite:**
- [ ] Quando um JWT válido, assinado com a chave configurada, é enviado à validação de token, então a resposta é HTTP 200 e os claims do payload ficam disponíveis para o restante do fluxo.
- [ ] Quando um JWT tem a assinatura alterada (payload modificado sem reassinar), então a validação retorna HTTP 401 com mensagem "assinatura inválida".
- [ ] Quando um JWT é assinado com uma chave diferente da configurada no serviço, então a validação retorna HTTP 401 sem processar os claims.
- [ ] Quando o token enviado está ausente ou malformado (não é um JWT válido), então a validação retorna HTTP 400 com mensagem "token malformado".

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 400
- Campos: `Authorization`, `token`, `assinatura`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-145 (ver requirements.json)

---

### [Sprint 3] Retornar payload decodificado ao validar token JWT
<!-- sdd-bot:meta id="BL-070" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-146" dependsOn="REQ-145" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-145

**Descrição:**
Implementar no AuthService (backend) um método de validação de token JWT que, após verificar assinatura e expiração via biblioteca JWT (ex.: jsonwebtoken), decodifica o payload e o retorna como objeto ao chamador, em vez de apenas retornar um booleano de validade. O método deve ser reutilizado pelos middlewares de autenticação/autorização que dependem dos claims do usuário (id, RGA/CPF, role, tipoVinculo).

**Comportamento esperado:**
Ao chamar o método de validação com um token válido, a resposta contém o objeto payload decodificado com os claims do usuário; ao chamar com token inválido, expirado ou malformado, o método rejeita a chamada sem retornar payload.

**Critérios de aceite:**
- [ ] Quando um token JWT válido e não expirado é validado, então o método retorna o payload decodificado contendo os claims originais (ex.: userId, role, tipoVinculo) sem alterações.
- [ ] Quando o token está expirado, então o método lança/retorna erro específico (ex.: TokenExpiredError) e não retorna payload.
- [ ] Quando o token possui assinatura inválida (adulterado), então o método lança/retorna erro (ex.: JsonWebTokenError) e não retorna payload.
- [ ] Quando o token está ausente ou é uma string vazia/malformada, então o método rejeita a chamada com erro de validação sem lançar exceção não tratada.
- [ ] Quando o payload decodificado é retornado, então ele não deve conter campos sensíveis adicionais além dos claims definidos na geração do token (ex.: sem senha/hash).

**Especificidade técnica:**
- Campos: `payload`, `userId`, `role`, `tipoVinculo`
- Precisa de esclarecimento: sim — O requisito não especifica quais claims exatos compõem o payload do JWT nem o nome/formato do erro a ser lançado para token inválido/expirado; assumir a estrutura definida no REQ-145 (geração do token).

**Rastreabilidade:** REQ-146 (ver requirements.json)

---

### [Sprint 3] Tratar role independente de tipoVinculo no PermissionService
<!-- sdd-bot:meta id="BL-071" epic="5.3 Services Principais - LojaService, EventosService, PriceCalculationService, PermissionService" layer="backend" requirementIds="REQ-163" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Ajustar o modelo de dados e a lógica do PermissionService (e serviços consumidores: LojaService, EventosService, PriceCalculationService) para tratar os atributos role (DIRETORIA/SOCIO/ALUNO) e tipoVinculo (ESTUDANTE/NAO_ESTUDANTE) como colunas independentes na entidade de usuário, sem regra de exclusão mútua ou derivação de um a partir do outro. Remover qualquer validação ou lógica condicional existente que restrinja combinações (ex.: bloquear role=ALUNO quando tipoVinculo=NAO_ESTUDANTE).

**Comportamento esperado:**
Um usuário pode ter qualquer combinação de role e tipoVinculo (ex.: role=SOCIO com tipoVinculo=NAO_ESTUDANTE) sem erro de validação, e os serviços consumidores aplicam suas regras de negócio considerando os dois atributos de forma independente.

**Critérios de aceite:**
- [ ] Quando um usuário com tipoVinculo=NAO_ESTUDANTE recebe role=SOCIO, então o sistema persiste a combinação sem erro de validação.
- [ ] Quando um usuário com tipoVinculo=NAO_ESTUDANTE recebe role=ALUNO, então o sistema persiste a combinação sem erro de validação.
- [ ] Quando o PermissionService calcula permissões, então ele consulta role e tipoVinculo como campos independentes, sem lógica que derive um valor a partir do outro.
- [ ] Quando LojaService, EventosService ou PriceCalculationService aplicam regras dependentes de tipoVinculo (ex.: precificação para não estudante), então o resultado não é afetado pelo valor de role do mesmo usuário.
- [ ] Quando uma combinação role/tipoVinculo previamente bloqueada é submetida, então nenhuma exceção de regra de negócio de incompatibilidade é lançada.

**Especificidade técnica:**
- Campos: `role`, `tipoVinculo`
- Precisa de esclarecimento: sim — Não há detalhe sobre existência prévia de constraint (DB ou aplicação) acoplando role e tipoVinculo; é preciso confirmar se há migração de schema necessária ou apenas remoção de validação em código.

**Rastreabilidade:** REQ-163 (ver requirements.json)

---

### [Sprint 3] Retornar todas as permissões para role DIRETORIA
<!-- sdd-bot:meta id="BL-072" epic="5.3 Services Principais - LojaService, EventosService, PriceCalculationService, PermissionService" layer="backend" requirementIds="REQ-167" dependsOn="REQ-163" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-163

**Descrição:**
No PermissionService, implementar a regra que, ao calcular as permissões de um usuário com role=DIRETORIA, retorna o conjunto completo de permissões do sistema (todas as ações registradas para LojaService, EventosService e PriceCalculationService), sem aplicar filtros de tipoVinculo ou outras restrições contextuais.

**Comportamento esperado:**
Ao consultar as permissões de um usuário com role=DIRETORIA, a resposta contém a lista completa de permissões disponíveis no sistema, independentemente do tipoVinculo desse usuário.

**Critérios de aceite:**
- [ ] Quando um usuário com role=DIRETORIA solicita suas permissões, então o PermissionService retorna a lista contendo todas as permissões cadastradas no sistema.
- [ ] Quando o mesmo usuário DIRETORIA possui tipoVinculo=ESTUDANTE ou NAO_ESTUDANTE, então o conjunto de permissões retornado é idêntico em ambos os casos.
- [ ] Quando novas permissões são adicionadas ao catálogo do sistema, então usuários DIRETORIA passam a recebê-las automaticamente sem necessidade de alteração manual na regra de DIRETORIA.
- [ ] Quando um usuário com role diferente de DIRETORIA é consultado, então o conjunto retornado não é igual ao conjunto completo de permissões (a menos que coincida por regra própria).

**Especificidade técnica:**
- Campos: `role`, `permissions`
- Precisa de esclarecimento: sim — O catálogo exato de permissões (nomes/identificadores) não está definido no requisito; assumir que existe uma lista/enum central de permissões a ser referenciada integralmente para DIRETORIA.

**Rastreabilidade:** REQ-167 (ver requirements.json)

---

### [Sprint 3] Retornar permissões limitadas para roles SOCIO e ALUNO
<!-- sdd-bot:meta id="BL-073" epic="5.3 Services Principais - LojaService, EventosService, PriceCalculationService, PermissionService" layer="backend" requirementIds="REQ-168" dependsOn="REQ-163" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-163

**Descrição:**
No PermissionService, implementar a regra que, ao calcular permissões para usuários com role=SOCIO ou role=ALUNO, retorna um subconjunto restrito de permissões (distinto do conjunto completo aplicado a DIRETORIA no REQ-167), definido por mapeamento fixo role→permissões nos serviços LojaService, EventosService e PriceCalculationService.

**Comportamento esperado:**
Ao consultar as permissões de um usuário com role=SOCIO ou role=ALUNO, a resposta contém apenas as permissões do subconjunto definido para essa role, excluindo ações administrativas reservadas à DIRETORIA.

**Critérios de aceite:**
- [ ] Quando um usuário com role=SOCIO solicita suas permissões, então o PermissionService retorna apenas o subconjunto de permissões mapeado para SOCIO, sem incluir permissões administrativas de DIRETORIA.
- [ ] Quando um usuário com role=ALUNO solicita suas permissões, então o PermissionService retorna apenas o subconjunto de permissões mapeado para ALUNO.
- [ ] Quando os conjuntos de SOCIO e ALUNO são comparados, então ambos são subconjuntos estritos do conjunto completo retornado para DIRETORIA (REQ-167).
- [ ] Quando o tipoVinculo do usuário SOCIO ou ALUNO varia (ESTUDANTE/NAO_ESTUDANTE), então o conjunto de permissões retornado pela role permanece o mesmo, conforme a ortogonalidade definida no REQ-163.
- [ ] Quando um usuário com role SOCIO ou ALUNO tenta acessar uma ação fora de seu subconjunto de permissões, então a verificação de permissão retorna negado.

**Especificidade técnica:**
- Códigos HTTP: 403
- Campos: `role`, `permissions`
- Precisa de esclarecimento: sim — O requisito não define quais permissões específicas compõem o subconjunto de SOCIO e de ALUNO; é necessário mapear a lista exata de ações permitidas por role junto ao time de produto/SDD.

**Rastreabilidade:** REQ-168 (ver requirements.json)

---

### [Sprint 3] Criar endpoint POST /auth/login com RGA ou CPF
<!-- sdd-bot:meta id="BL-074" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-202" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /auth/login no serviço de autenticação que recebe no corpo da requisição os campos identificador (RGA ou CPF) e senha. O serviço deve buscar o usuário pelo identificador, comparar a senha informada com o hash bcrypt armazenado e, em caso de correspondência, gerar um access_token JWT.

**Comportamento esperado:**
Requisição válida retorna status 200 com JSON contendo access_token e objeto usuario; credenciais inválidas retornam 401 com mensagem de erro padronizada.

**Critérios de aceite:**
- [ ] Quando identificador e senha corretos são enviados, então a resposta é 200 com corpo {access_token, usuario}
- [ ] Quando a senha não corresponde ao hash bcrypt armazenado, então a resposta é 401 com body {"error":"Credenciais inválidas"}
- [ ] Quando o identificador (RGA ou CPF) não existe na base, então a resposta é 401 com body {"error":"Credenciais inválidas"}, sem indicar qual campo está incorreto
- [ ] Quando o corpo da requisição não contém identificador ou senha, então a resposta é 400 com body {"error":"Campos obrigatórios ausentes"}
- [ ] Quando o login é bem-sucedido, então o campo access_token retornado é um JWT válido decodificável e não vazio

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 400
- Campos: `identificador`, `senha`, `access_token`, `usuario`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-202 (ver requirements.json)

---

### [Sprint 3] Criar endpoint POST /auth/logout de encerramento de sessão
<!-- sdd-bot:meta id="BL-075" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-203" dependsOn="REQ-202" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-202

**Descrição:**
Implementar endpoint POST /auth/logout que invalida a sessão/token atual do usuário autenticado (via header Authorization Bearer) e retorna confirmação da operação.

**Comportamento esperado:**
Requisição autenticada com token válido retorna status 200 com mensagem confirmando o logout.

**Critérios de aceite:**
- [ ] Quando o endpoint é chamado com um token JWT válido no header Authorization, então a resposta é 200 com body {"message":"Logout realizado"}
- [ ] Quando o endpoint é chamado sem header Authorization ou com token ausente, então a resposta é 401 com body {"error":"Token não fornecido"}
- [ ] Quando o endpoint é chamado com um token JWT expirado ou inválido, então a resposta é 401 com body {"error":"Token inválido"}

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `Authorization`, `message`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-203 (ver requirements.json)

---

### [Sprint 3] Incluir tipoVinculo, role e permissões no payload do JWT
<!-- sdd-bot:meta id="BL-076" epic="8.1 Autenticação" layer="backend" requirementIds="REQ-236" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Alterar a rotina de geração do JWT (usada em /auth/login) para incluir no payload os claims: tipoVinculo, role, diretoriaAtiva, desconto, directorias (lista de diretorias vinculadas) e permissions (lista de permissões consolidadas da role).

**Comportamento esperado:**
O JWT emitido no login, ao ser decodificado, contém todos os seis claims preenchidos com os valores correspondentes ao usuário autenticado.

**Critérios de aceite:**
- [ ] Quando um usuário faz login, então o JWT decodificado contém os claims tipoVinculo, role, diretoriaAtiva, desconto, directorias e permissions
- [ ] Quando o usuário possui vínculo com múltiplas diretorias, então o claim directorias contém um array com todos os códigos de diretoria vinculados
- [ ] Quando o usuário não possui diretoria ativa definida, então o claim diretoriaAtiva é retornado como null, sem omitir a chave do payload
- [ ] Quando a role do usuário é alterada e um novo login é realizado, então o claim permissions reflete a lista de permissões atualizada da nova role

**Especificidade técnica:**
- Campos: `tipoVinculo`, `role`, `diretoriaAtiva`, `desconto`, `directorias`, `permissions`
- Precisa de esclarecimento: sim — Não está definido o formato exato do claim permissions (array de strings de código de permissão vs. objeto por recurso/ação) nem a fonte da consolidação de permissões por role.

**Rastreabilidade:** REQ-236 (ver requirements.json)

---

### [Sprint 3] Corrigir exposição de CPF no payload do JWT
<!-- sdd-bot:meta id="BL-077" epic="8.1 Autenticação" layer="backend" requirementIds="REQ-237" dependsOn="REQ-236" -->
**Tipo:** bug
**Prioridade:** must
**Depende de:** REQ-236

**Descrição:**
A rotina de geração do JWT inclui o campo CPF diretamente no payload. É necessário remover o CPF do payload e substituí-lo pelo identificador interno do usuário (ex.: id/uuid da tabela usuarios), mantendo o CPF acessível apenas via consulta ao banco quando necessário.

**Passos para reproduzir:**
1. Realizar login via POST /auth/login com credenciais válidas
2. Copiar o access_token retornado
3. Decodificar o JWT (ex.: via jwt.io ou biblioteca de decodificação) sem validar assinatura
4. Inspecionar os claims do payload decodificado

**Comportamento esperado:**
O JWT emitido nunca contém o claim cpf ou qualquer valor no formato de CPF; apenas o id interno do usuário está presente para identificação.

**Critérios de aceite:**
- [ ] Quando o JWT é decodificado após login, então o payload não contém a chave cpf nem nenhum valor correspondente ao CPF do usuário
- [ ] Quando o JWT é decodificado após login, então o payload contém o claim de identificador interno (ex.: userId) com o id da tabela usuarios
- [ ] Quando o código do serviço de autenticação é revisado, então nenhuma referência ao campo cpf permanece na função de geração do payload do JWT

**Especificidade técnica:**
- Campos: `cpf`, `userId`
- Precisa de esclarecimento: sim — Não foi especificado o nome exato do claim de identificador interno a ser usado (ex.: userId, sub, id); assumir necessidade de definição alinhada ao padrão já usado nos demais claims.

**Rastreabilidade:** REQ-237 (ver requirements.json)

---

### [Sprint 3] Consolidar checagem de permissões via @RequirePermission()
<!-- sdd-bot:meta id="BL-078" epic="8.2 Autorização" layer="backend" requirementIds="REQ-241" dependsOn="REQ-3" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-3

**Descrição:**
Refatorar todos os endpoints e middlewares do backend para que a checagem de autorização ocorra exclusivamente através do decorador @RequirePermission(), removendo qualquer verificação de permissão feita diretamente em controllers, services ou middlewares customizados (ex.: checagens manuais de role, tipoVinculo ou flags de acesso fora do decorador). O decorador deve receber como parâmetro a(s) permissão(ões) exigida(s) e ser aplicado nas rotas/handlers que hoje possuem lógica de autorização dispersa.

**Comportamento esperado:**
Toda rota protegida do backend tem sua autorização decidida unicamente pelo @RequirePermission(), sem lógica de permissão duplicada ou paralela em outras camadas do código.

**Critérios de aceite:**
- [ ] Quando uma rota decorada com @RequirePermission('X') é chamada por um usuário com a permissão X, então a requisição prossegue e retorna HTTP 200 (ou o status de sucesso do endpoint).
- [ ] Quando uma rota decorada com @RequirePermission('X') é chamada por um usuário sem a permissão X, então o sistema retorna HTTP 403 com mensagem 'Permissão insuficiente' antes de executar a lógica do handler.
- [ ] Quando o código do backend é inspecionado (revisão/lint), então nenhum controller, service ou middleware fora do decorador contém checagem condicional de role ou permissão (ex.: `if (user.role === ...)`).
- [ ] Quando uma rota não possui o decorador @RequirePermission() aplicado, então ela é tratada como pública/sem restrição de permissão, e isso deve ser explícito na definição da rota.
- [ ] Quando o token JWT enviado na requisição é inválido ou ausente, então o sistema retorna HTTP 401 antes de avaliar a permissão via decorador.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `RequirePermission`, `role`, `tipoVinculo`
- Precisa de esclarecimento: sim — Não foi especificado o formato de definição das permissões (strings livres, enum, ou lista de escopos por role) nem a estrutura de mapeamento role->permissão consumida pelo decorador; é necessário definir esse contrato antes da implementação.

**Rastreabilidade:** REQ-241 (ver requirements.json)

---

### [Sprint 3] Remover tipoVinculo das regras de autorização
<!-- sdd-bot:meta id="BL-079" epic="8.2 Autorização" layer="backend" requirementIds="REQ-242" dependsOn="REQ-241" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-241

**Descrição:**
Eliminar qualquer uso do campo tipoVinculo em lógicas de checagem de permissão no backend (dentro ou fora do decorador @RequirePermission()), restringindo seu uso exclusivamente aos fluxos de autenticação (ex.: login por RGA/CPF, auto-discovery de diretoria) e à exibição de dados de perfil do usuário (ex.: endpoint de perfil/GET /me).

**Comportamento esperado:**
O valor de tipoVinculo não influencia em nenhum momento a decisão de autorizar ou negar acesso a um recurso; ele aparece apenas em respostas de autenticação e de consulta de perfil.

**Critérios de aceite:**
- [ ] Quando um usuário com tipoVinculo diferente é autenticado, então o sistema calcula suas permissões exclusivamente com base na role, sem consultar tipoVinculo.
- [ ] Quando o código do decorador @RequirePermission() e das rotas protegidas é revisado, então nenhuma referência a tipoVinculo é encontrada na lógica de autorização.
- [ ] Quando o endpoint de perfil (ex.: GET /me) é chamado, então tipoVinculo é retornado no payload apenas como dado informativo de exibição, sem afetar o status HTTP da resposta.
- [ ] Quando o fluxo de login por RGA/CPF é executado, então tipoVinculo é utilizado para o auto-discovery de diretoria e vinculação, conforme já definido no fluxo de autenticação.

**Especificidade técnica:**
- Campos: `tipoVinculo`, `RequirePermission`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-242 (ver requirements.json)

---

### [Sprint 4] Adicionar flag cpfVerificado na entidade Usuario
<!-- sdd-bot:meta id="BL-080" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-98" dependsOn="REQ-97" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-97

**Descrição:**
Adicionar coluna booleana cpfVerificado (default false) na tabela usuario e no model/entidade Usuario, expondo o campo no DTO de resposta do usuário. O valor deve ser atualizado por um processo de verificação de CPF (dependente de REQ-97) e persistido no banco.

**Comportamento esperado:**
O campo cpfVerificado é retornado na resposta da API de consulta de usuário e reflete o estado atual de verificação do CPF.

**Critérios de aceite:**
- [ ] Quando um novo usuário é cadastrado, então o campo cpfVerificado é persistido com valor default false no banco de dados.
- [ ] Quando o CPF de um usuário é verificado pelo processo definido em REQ-97, então o campo cpfVerificado é atualizado para true na tabela usuario.
- [ ] Quando a API GET /usuarios/{id} é chamada, então a resposta JSON inclui o campo "cpfVerificado" com valor booleano.
- [ ] Quando um usuário do tipo ESTUDANTE não possui CPF cadastrado, então o campo cpfVerificado permanece false por padrão.

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `cpfVerificado`, `tabela usuario`
- Precisa de esclarecimento: sim — Não há especificação de qual serviço/endpoint dispara a verificação do CPF (síncrono no cadastro ou assíncrono via integração externa); depende da definição em REQ-97.

**Rastreabilidade:** REQ-98 (ver requirements.json)

---

### [Sprint 4] Adicionar constraint de exclusividade entre RGA e CPF
<!-- sdd-bot:meta id="BL-081" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-99" dependsOn="REQ-96,REQ-97" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-96, REQ-97

**Descrição:**
Criar constraint CHECK na tabela usuario garantindo que, conforme o valor de tipoVinculo (ESTUDANTE exige rga preenchido e cpf nulo; NAO_ESTUDANTE exige cpf preenchido e rga nulo), exatamente um dos campos rga ou cpf esteja preenchido. Implementar validação equivalente no DTO de cadastro (CadastroUsuarioDTO) antes da persistência, retornando erro de validação quando a regra for violada.

**Comportamento esperado:**
O cadastro de usuário é aceito somente quando o campo preenchido (rga ou cpf) corresponde ao tipoVinculo informado, e é rejeitado com erro de validação nos demais casos.

**Critérios de aceite:**
- [ ] Quando tipoVinculo é ESTUDANTE e o campo rga é preenchido com cpf nulo, então o cadastro é persistido com status HTTP 201.
- [ ] Quando tipoVinculo é NAO_ESTUDANTE e o campo cpf é preenchido com rga nulo, então o cadastro é persistido com status HTTP 201.
- [ ] Quando ambos rga e cpf são preenchidos simultaneamente, então a API retorna HTTP 400 com mensagem de erro "Apenas um entre RGA e CPF deve ser preenchido".
- [ ] Quando nenhum dos campos rga ou cpf é preenchido, então a API retorna HTTP 400 com mensagem de erro "RGA ou CPF é obrigatório de acordo com o tipo de vínculo".
- [ ] Quando uma tentativa de INSERT/UPDATE direto no banco viola a regra de exclusividade, então a constraint CHECK rejeita a operação, independentemente da validação da camada de aplicação.

**Especificidade técnica:**
- Códigos HTTP: 201, 400
- Campos: `rga`, `cpf`, `tipoVinculo`, `CadastroUsuarioDTO`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-99 (ver requirements.json)

---

### [Sprint 4] Atribuir diretoria principal por RGA no cadastro
<!-- sdd-bot:meta id="BL-082" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-103" dependsOn="REQ-96" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-96

**Descrição:**
No fluxo de cadastro de usuário ESTUDANTE (serviço de cadastro dependente de REQ-96), implementar lógica que consulta a tabela/entidade de mapeamento RGA-diretoria (ou serviço externo indicado por REQ-96) a partir do rga informado, e atribui automaticamente o valor resultante ao campo diretoriaPrincipal do usuário antes da persistência.

**Comportamento esperado:**
O usuário estudante é cadastrado com o campo diretoriaPrincipal já preenchido, sem necessidade de entrada manual, refletindo o vínculo correspondente ao RGA informado.

**Critérios de aceite:**
- [ ] Quando um usuário ESTUDANTE é cadastrado com um rga que possui diretoria correspondente mapeada, então o campo diretoriaPrincipal é persistido automaticamente com esse valor.
- [ ] Quando o cadastro é concluído para um ESTUDANTE, então a resposta HTTP 201 inclui o campo diretoriaPrincipal preenchido no corpo da resposta.
- [ ] Quando o rga informado não corresponde a nenhuma diretoria mapeada, então a API retorna HTTP 422 com mensagem de erro "Não foi possível determinar a diretoria principal para o RGA informado".
- [ ] Quando o campo diretoriaPrincipal é enviado manualmente no payload de cadastro de um ESTUDANTE, então esse valor é ignorado e sobrescrito pelo resultado da atribuição automática por RGA.

**Especificidade técnica:**
- Códigos HTTP: 201, 422
- Campos: `rga`, `diretoriaPrincipal`, `tipoVinculo`
- Precisa de esclarecimento: sim — Não há definição de qual é a fonte de mapeamento RGA→diretoria (tabela própria, faixas de RGA ou serviço externo integrado em REQ-96); necessário confirmar a estrutura de dados usada na consulta.

**Rastreabilidade:** REQ-103 (ver requirements.json)

---

### [Sprint 4] Permitir diretoria manual no cadastro de não-estudante
<!-- sdd-bot:meta id="BL-083" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-104" dependsOn="REQ-97" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-97

**Descrição:**
No DTO e serviço de cadastro de usuário, habilitar o campo diretoriaPrincipal como editável e obrigatório apenas quando tipoVinculo for NAO_ESTUDANTE, validando o valor recebido contra a lista de diretorias existentes (tabela diretoria) antes de persistir no registro do usuário.

**Comportamento esperado:**
O cadastro de um usuário NAO_ESTUDANTE permite informar explicitamente a diretoria principal no payload, e esse valor é persistido conforme enviado.

**Critérios de aceite:**
- [ ] Quando tipoVinculo é NAO_ESTUDANTE e o campo diretoriaPrincipal é informado com um id de diretoria existente, então o cadastro é persistido com HTTP 201 e o valor informado é gravado no registro.
- [ ] Quando tipoVinculo é NAO_ESTUDANTE e o campo diretoriaPrincipal não é informado, então a API retorna HTTP 400 com mensagem de erro "diretoriaPrincipal é obrigatório para usuários não-estudantes".
- [ ] Quando tipoVinculo é NAO_ESTUDANTE e o id de diretoriaPrincipal informado não existe na tabela diretoria, então a API retorna HTTP 404 com mensagem de erro "Diretoria não encontrada".
- [ ] Quando tipoVinculo é ESTUDANTE e o campo diretoriaPrincipal é enviado manualmente no payload, então esse valor é rejeitado ou ignorado, pois a atribuição é automática conforme REQ-103.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 404
- Campos: `diretoriaPrincipal`, `tipoVinculo`, `tabela diretoria`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-104 (ver requirements.json)

---

### [Sprint 4] Relacionar usuário à diretoria principal com cascade delete
<!-- sdd-bot:meta id="BL-084" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-105" dependsOn="REQ-103,REQ-104" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-103, REQ-104

**Descrição:**
Adicionar coluna diretoria_principal_id (FK) na tabela usuario referenciando a tabela diretoria, com constraint ON DELETE CASCADE. Atualizar a entidade/model Usuario e o serviço de criação/atualização de usuário para exigir e persistir essa referência.

**Comportamento esperado:**
Todo usuário criado ou atualizado passa a ter uma diretoria principal associada e persistida no banco, refletida na resposta do endpoint correspondente.

**Critérios de aceite:**
- [ ] Quando um usuário é criado com diretoria_principal_id válido, então o registro é persistido com a FK preenchida e retornado com status 201.
- [ ] Quando a diretoria referenciada é excluída, então todos os usuários vinculados a ela são excluídos em cascata automaticamente no banco.
- [ ] Quando um usuário é criado sem diretoria_principal_id, então a API retorna 400 com mensagem de erro "diretoria_principal_id é obrigatório".
- [ ] Quando diretoria_principal_id referencia uma diretoria inexistente, então a API retorna 404 com mensagem "Diretoria não encontrada".
- [ ] Quando um usuário existente tem sua diretoria_principal_id atualizada para uma diretoria válida, então a alteração é persistida e retornada com status 200.

**Especificidade técnica:**
- Códigos HTTP: 201, 200, 400, 404
- Campos: `diretoria_principal_id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-105 (ver requirements.json)

---

### [Sprint 4] Criar entidade de associação usuario_diretoria multi-vínculo
<!-- sdd-bot:meta id="BL-085" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-106" dependsOn="REQ-105" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-105

**Descrição:**
Criar tabela/entidade usuario_diretoria com colunas usuario_id (FK) e diretoria_id (FK), representando um relacionamento N:N além do vínculo de diretoria principal já existente (REQ-105). Implementar endpoints ou métodos de serviço para adicionar e remover vínculos de um usuário a diretorias secundárias.

**Comportamento esperado:**
Um usuário pode estar associado a mais de uma diretoria simultaneamente, sem substituir sua diretoria principal, e essas associações podem ser consultadas, criadas e removidas.

**Critérios de aceite:**
- [ ] Quando um vínculo usuario_id + diretoria_id é criado via endpoint, então o registro é persistido na tabela usuario_diretoria com status 201.
- [ ] Quando um usuário já possui a diretoria principal definida, então ele pode ser vinculado a diretorias adicionais sem alterar diretoria_principal_id.
- [ ] Quando se tenta criar um vínculo duplicado (mesmo usuario_id e diretoria_id), então a API retorna 409 com mensagem "Usuário já vinculado a esta diretoria".
- [ ] Quando um vínculo é removido, então o registro correspondente é excluído da tabela usuario_diretoria e a API retorna 204.
- [ ] Quando usuario_id ou diretoria_id não existem, então a API retorna 404 com mensagem indicando qual entidade não foi encontrada.

**Especificidade técnica:**
- Códigos HTTP: 201, 204, 404, 409
- Campos: `usuario_id`, `diretoria_id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-106 (ver requirements.json)

---

### [Sprint 4] Marcar usuário NAO_ESTUDANTE como inativo até aprovação
<!-- sdd-bot:meta id="BL-086" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-108" dependsOn="REQ-97,REQ-107" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-97, REQ-107

**Descrição:**
No fluxo de criação de usuário, quando o tipo for NAO_ESTUDANTE, definir os campos ativo=false e status_aprovacao='PENDENTE' por padrão na tabela usuario. Implementar endpoint para a DIRETORIA aprovar ou rejeitar o cadastro, alterando ativo para true e status_aprovacao para 'APROVADO' ou 'REJEITADO'.

**Comportamento esperado:**
Usuários NAO_ESTUDANTE recém-criados permanecem inativos e sem acesso ao sistema até que um usuário com papel DIRETORIA aprove o cadastro explicitamente.

**Critérios de aceite:**
- [ ] Quando um usuário é criado com tipo NAO_ESTUDANTE, então ele é persistido com ativo=false e status_aprovacao='PENDENTE', retornando status 201.
- [ ] Quando um usuário com papel DIRETORIA aprova o cadastro via endpoint PATCH /usuarios/{id}/aprovacao, então ativo passa para true e status_aprovacao para 'APROVADO', retornando 200.
- [ ] Quando um usuário sem papel DIRETORIA tenta aprovar um cadastro, então a API retorna 403 com mensagem "Permissão insuficiente".
- [ ] Quando um usuário NAO_ESTUDANTE com status PENDENTE tenta autenticar-se, então a API retorna 403 com mensagem "Cadastro aguardando aprovação".
- [ ] Quando a DIRETORIA rejeita o cadastro, então status_aprovacao é definido como 'REJEITADO' e ativo permanece false, retornando 200.

**Especificidade técnica:**
- Códigos HTTP: 201, 200, 403
- Campos: `ativo`, `status_aprovacao`, `tipo`
- Precisa de esclarecimento: sim — Não está definido o endpoint exato de aprovação/rejeição, os valores permitidos para status_aprovacao (enum) nem se rejeição exclui ou apenas marca o cadastro.

**Rastreabilidade:** REQ-108 (ver requirements.json)

---

### [Sprint 4] Criar índices em usuario_id e diretoria_id na tabela associação
<!-- sdd-bot:meta id="BL-087" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-114" dependsOn="REQ-106" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-106

**Descrição:**
Criar migration que adiciona índices B-tree nas colunas usuario_id e diretoria_id da tabela usuario_diretoria (criada no REQ-106), individualmente ou como índice composto, para otimizar queries de listagem multi-atlética por usuário ou por diretoria.

**Comportamento esperado:**
Consultas que filtram usuario_diretoria por usuario_id ou diretoria_id utilizam índice em vez de full table scan, reduzindo o tempo de execução em tabelas com grande volume de registros.

**Critérios de aceite:**
- [ ] Quando a migration é executada, então os índices em usuario_id e diretoria_id são criados na tabela usuario_diretoria sem erros.
- [ ] Quando um EXPLAIN é executado em uma query filtrando por usuario_id, então o plano de execução mostra uso do índice criado em vez de sequential scan.
- [ ] Quando um EXPLAIN é executado em uma query filtrando por diretoria_id, então o plano de execução mostra uso do índice criado em vez de sequential scan.
- [ ] Quando a migration é revertida (rollback), então os índices são removidos sem afetar os dados da tabela.

**Especificidade técnica:**
- Campos: `usuario_id`, `diretoria_id`
- Precisa de esclarecimento: sim — Não está definido se os índices devem ser individuais, compostos, ou se deve haver constraint UNIQUE composta para evitar duplicidade de vínculo (relacionado ao REQ-106).

**Rastreabilidade:** REQ-114 (ver requirements.json)

---

### [Sprint 4] Criar índice na coluna rga da tabela usuarios
<!-- sdd-bot:meta id="BL-088" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-115" dependsOn="REQ-96" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-96

**Descrição:**
Adicionar uma migration no backend que cria um índice (CREATE INDEX) na coluna rga da tabela usuarios, garantindo que a busca por RGA no fluxo de login de estudantes utilize acesso indexado em vez de full table scan. A migration deve ser versionada junto ao schema atual e aplicada via ferramenta de migração do ORM em uso.

**Comportamento esperado:**
Consultas que filtram usuarios por rga passam a usar o índice criado, reduzindo o tempo de resposta do login de estudantes em bases com grande volume de registros.

**Critérios de aceite:**
- [ ] Quando a migration for executada, então um índice deve existir na coluna rga da tabela usuarios (verificável via EXPLAIN/consulta ao catálogo do banco).
- [ ] Quando uma query de login filtrar usuarios por rga, então o plano de execução deve indicar uso do índice (index scan) em vez de sequential scan.
- [ ] Quando a migration for revertida (rollback), então o índice deve ser removido sem afetar dados da tabela usuarios.
- [ ] Quando a migration for aplicada em ambiente onde o índice já existir, então a operação deve falhar de forma controlada ou ser idempotente, sem quebrar o deploy.

**Especificidade técnica:**
- Campos: `rga`
- Precisa de esclarecimento: sim — Não foi especificado se o índice deve ser único (UNIQUE) — decisão necessária pois RGA provavelmente é identificador único de estudante — nem qual ORM/ferramenta de migration (TypeORM, Prisma, Knex) está em uso.

**Rastreabilidade:** REQ-115 (ver requirements.json)

---

### [Sprint 4] Criar índice na coluna cpf da tabela usuarios
<!-- sdd-bot:meta id="BL-089" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-116" dependsOn="REQ-97" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-97

**Descrição:**
Adicionar uma migration no backend que cria um índice (CREATE INDEX) na coluna cpf da tabela usuarios, garantindo que a busca por CPF no fluxo de login de não-estudantes utilize acesso indexado em vez de full table scan. A migration deve ser versionada junto ao schema atual e aplicada via ferramenta de migração do ORM em uso.

**Comportamento esperado:**
Consultas que filtram usuarios por cpf passam a usar o índice criado, reduzindo o tempo de resposta do login de não-estudantes em bases com grande volume de registros.

**Critérios de aceite:**
- [ ] Quando a migration for executada, então um índice deve existir na coluna cpf da tabela usuarios (verificável via EXPLAIN/consulta ao catálogo do banco).
- [ ] Quando uma query de login filtrar usuarios por cpf, então o plano de execução deve indicar uso do índice (index scan) em vez de sequential scan.
- [ ] Quando a migration for revertida (rollback), então o índice deve ser removido sem afetar dados da tabela usuarios.
- [ ] Quando a migration for aplicada em ambiente onde o índice já existir, então a operação deve falhar de forma controlada ou ser idempotente, sem quebrar o deploy.

**Especificidade técnica:**
- Campos: `cpf`
- Precisa de esclarecimento: sim — Não foi especificado se o índice deve ser único (UNIQUE) — decisão necessária pois CPF provavelmente é identificador único de usuário não-estudante — nem qual ORM/ferramenta de migration está em uso.

**Rastreabilidade:** REQ-116 (ver requirements.json)

---

### [Sprint 4] Criar índice na coluna codigo_curso da tabela diretorias
<!-- sdd-bot:meta id="BL-090" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-117" dependsOn="REQ-103" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-103

**Descrição:**
Adicionar uma migration no backend que cria um índice (CREATE INDEX) na coluna codigo_curso da tabela diretorias, garantindo que o processo de auto-roteamento de cadastro (associação automática de usuário à diretoria correspondente ao seu curso) utilize acesso indexado em vez de full table scan.

**Comportamento esperado:**
Consultas que filtram diretorias por codigo_curso durante o cadastro de usuários passam a usar o índice criado, reduzindo o tempo de resposta do auto-roteamento em bases com grande volume de diretorias.

**Critérios de aceite:**
- [ ] Quando a migration for executada, então um índice deve existir na coluna codigo_curso da tabela diretorias (verificável via EXPLAIN/consulta ao catálogo do banco).
- [ ] Quando o serviço de cadastro buscar a diretoria por codigo_curso, então o plano de execução deve indicar uso do índice (index scan) em vez de sequential scan.
- [ ] Quando a migration for revertida (rollback), então o índice deve ser removido sem afetar dados da tabela diretorias.
- [ ] Quando a migration for aplicada em ambiente onde o índice já existir, então a operação deve falhar de forma controlada ou ser idempotente, sem quebrar o deploy.

**Especificidade técnica:**
- Campos: `codigo_curso`
- Precisa de esclarecimento: sim — Não foi especificado se codigo_curso é único por diretoria (índice UNIQUE) ou se uma diretoria pode agrupar múltiplos códigos de curso; nem qual ORM/ferramenta de migration está em uso.

**Rastreabilidade:** REQ-117 (ver requirements.json)

---

### [Sprint 4] Adotar class-validator/class-transformer em DTOs de entrada
<!-- sdd-bot:meta id="BL-091" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-121" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Configurar o backend para usar class-validator e class-transformer na validação e transformação de payloads recebidos pelos endpoints (ex.: cadastro de usuário, login). Isso inclui: habilitar o ValidationPipe global (ou equivalente) com whitelist e forbidNonWhitelisted ativos, criar/ajustar DTOs com decorators de validação (@IsEmail, @IsNotEmpty, @Length, @Matches, etc.) e aplicar @Type/@Transform do class-transformer para conversão de tipos de campos recebidos no corpo da requisição.

**Comportamento esperado:**
Requisições com payload inválido ou campos não mapeados no DTO são rejeitadas automaticamente pelo pipeline de validação antes de chegar à lógica de negócio, e campos válidos chegam ao controller já convertidos para os tipos esperados (número, data, boolean).

**Critérios de aceite:**
- [ ] Quando um endpoint receber um payload com todos os campos obrigatórios válidos, então a requisição deve prosseguir para o controller com os dados transformados nos tipos declarados no DTO.
- [ ] Quando um campo obrigatório estiver ausente ou com formato inválido (ex.: e-mail sem @, CPF fora do padrão), então a API deve responder 400 Bad Request com mensagem indicando o campo e a regra violada.
- [ ] Quando o payload contiver campos não declarados no DTO, então esses campos devem ser removidos automaticamente (whitelist) ou a requisição deve ser rejeitada com 400 Bad Request (forbidNonWhitelisted).
- [ ] Quando um campo numérico ou de data for enviado como string no JSON, então class-transformer deve convertê-lo para o tipo declarado no DTO antes da validação.
- [ ] Quando múltiplos campos forem inválidos simultaneamente, então a resposta 400 deve listar todos os erros de validação, não apenas o primeiro encontrado.

**Especificidade técnica:**
- Códigos HTTP: 400
- Precisa de esclarecimento: sim — Não foi especificado o formato exato do corpo de erro (estrutura JSON da resposta 400), nem quais DTOs específicos devem ser criados/ajustados nesta sprint (cadastro, login, ambos) além da configuração global do ValidationPipe.

**Rastreabilidade:** REQ-121 (ver requirements.json)

---

### [Sprint 4] Validar dígito verificador de CPF no cadastro
<!-- sdd-bot:meta id="BL-092" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-122" dependsOn="REQ-97" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-97

**Descrição:**
Implementar validação de CPF combinando cálculo local do dígito verificador (algoritmo mod 11, dois dígitos) com a biblioteca cpf-cnpj-validator no backend. A validação deve ser aplicada como regra de negócio antes da persistência do usuário, rejeitando CPFs com formato inválido, dígitos verificadores incorretos ou sequências repetidas (ex.: 111.111.111-11).

**Comportamento esperado:**
Ao submeter um cadastro com CPF cujo dígito verificador não confere, o sistema rejeita a operação retornando erro específico; CPFs válidos (formatados ou não) são aceitos e normalizados para persistência.

**Critérios de aceite:**
- [ ] Quando um CPF válido (com dígitos verificadores corretos) é informado, então o cadastro prossegue e o CPF é persistido em formato normalizado (somente dígitos).
- [ ] Quando um CPF com dígito verificador incorreto é informado, então a API retorna HTTP 400 com mensagem de erro 'CPF inválido'.
- [ ] Quando um CPF com sequência repetida (ex.: 000.000.000-00) é informado, então o sistema rejeita mesmo que o cálculo mod 11 resulte tecnicamente válido para o padrão da lib.
- [ ] Quando o campo CPF é omitido na requisição, então a API retorna HTTP 400 indicando campo obrigatório ausente.
- [ ] Quando o CPF informado já está cadastrado em outro usuário, então a API retorna HTTP 409 com mensagem 'CPF já cadastrado'.

**Especificidade técnica:**
- Códigos HTTP: 400, 409
- Campos: `cpf`, `cpf-cnpj-validator`
- Limites: CPF com 11 dígitos numéricos
- Precisa de esclarecimento: sim — O requisito não define o nome exato do campo/DTO nem a mensagem de erro padronizada a ser retornada; assumido 'cpf' e mensagem genérica até confirmação com o time.

**Rastreabilidade:** REQ-122 (ver requirements.json)

---

### [Sprint 4] Criar serviço de parsing de RGA na autenticação
<!-- sdd-bot:meta id="BL-093" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-123" dependsOn="REQ-96" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-96

**Descrição:**
Implementar um serviço dedicado (ex.: RgaParserService) responsável por interpretar e extrair informações estruturadas do RGA (Registro Geral Acadêmico) informado durante o cadastro/autenticação de estudantes, separando essa lógica do AuthService principal para reuso e testabilidade.

**Comportamento esperado:**
Ao processar um cadastro ou login de estudante, o sistema extrai e valida a estrutura do RGA informado, disponibilizando os dados interpretados (ex.: ano, dígito, campus quando aplicável) para as demais etapas do fluxo de autenticação.

**Critérios de aceite:**
- [ ] Quando um RGA em formato válido é informado, então o serviço retorna a estrutura interpretada sem lançar exceção.
- [ ] Quando um RGA com formato inválido (fora do padrão esperado) é informado, então o serviço lança uma exceção específica capturada pela camada de cadastro, retornando HTTP 400.
- [ ] Quando o campo RGA está ausente em um cadastro de tipoVinculo ESTUDANTE, então a requisição é rejeitada com HTTP 400 indicando campo obrigatório.
- [ ] Quando o parsing é bem-sucedido, então o resultado é reutilizável por outros módulos (ex.: associação à diretoria) sem necessidade de reprocessamento.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `rga`
- Precisa de esclarecimento: sim — O requisito não especifica o formato/padrão exato do RGA (quantidade de dígitos, máscara, presença de dígito verificador ou código de campus), impedindo definir as regras de parsing com precisão.

**Rastreabilidade:** REQ-123 (ver requirements.json)

---

### [Sprint 4] Criar DTOs de cadastro por tipoVinculo (estudante/não)
<!-- sdd-bot:meta id="BL-094" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-128" dependsOn="REQ-99" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-99

**Descrição:**
Criar dois DTOs distintos de registro — um para tipoVinculo ESTUDANTE e outro para NAO_ESTUDANTE — cada um com suas próprias regras de validação de campos obrigatórios (ex.: RGA exigido apenas para estudante; dados adicionais exigidos apenas para não-estudante), aplicadas via decorators/validators na camada de entrada da API de cadastro.

**Comportamento esperado:**
Ao submeter um cadastro, o backend seleciona e aplica o conjunto de validações correspondente ao tipoVinculo informado, rejeitando payloads que misturem ou omitam campos obrigatórios do tipo escolhido.

**Critérios de aceite:**
- [ ] Quando tipoVinculo é ESTUDANTE e o campo rga está presente e válido, então o cadastro é aceito para as demais etapas de validação.
- [ ] Quando tipoVinculo é ESTUDANTE e o campo rga está ausente, então a API retorna HTTP 400 com mensagem indicando 'rga é obrigatório para estudante'.
- [ ] Quando tipoVinculo é NAO_ESTUDANTE e os campos obrigatórios específicos desse tipo estão ausentes, então a API retorna HTTP 400 detalhando os campos faltantes.
- [ ] Quando tipoVinculo informado não corresponde a nenhum valor válido (ESTUDANTE ou NAO_ESTUDANTE), então a API retorna HTTP 400 com mensagem 'tipoVinculo inválido'.
- [ ] Quando o payload de um DTO de estudante é enviado contendo campos exclusivos do DTO de não-estudante, então esses campos extras são ignorados ou rejeitados conforme estratégia de whitelist configurada na validação.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `tipoVinculo`, `rga`, `RegisterEstudanteDto`, `RegisterNaoEstudanteDto`
- Precisa de esclarecimento: sim — O requisito não lista quais campos são exclusivamente obrigatórios para o DTO de não-estudante nem a estratégia de tratamento de campos extras (rejeitar vs. ignorar/whitelist).

**Rastreabilidade:** REQ-128 (ver requirements.json)

---

### [Sprint 4] Validar dígito de CPF no registro de não-estudante
<!-- sdd-bot:meta id="BL-095" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-139" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
No AuthService, aplicar a validação de dígito verificador de CPF (mod 11) especificamente no fluxo de registro de usuários com tipoVinculo NAO_ESTUDANTE, antes da criação da entidade de usuário e persistência no banco.

**Comportamento esperado:**
Ao registrar um usuário NAO_ESTUDANTE, o AuthService recusa a criação quando o CPF informado possui dígito verificador incorreto, interrompendo o fluxo antes de qualquer persistência.

**Critérios de aceite:**
- [ ] Quando um usuário NAO_ESTUDANTE é registrado com CPF de dígito verificador correto, então o AuthService prossegue com a criação do usuário.
- [ ] Quando um usuário NAO_ESTUDANTE é registrado com CPF de dígito verificador incorreto, então o AuthService lança exceção de validação e a API retorna HTTP 400 sem persistir o registro.
- [ ] Quando o registro é de tipoVinculo ESTUDANTE, então esta validação específica de NAO_ESTUDANTE não é aplicada (comportamento coberto por outro requisito).
- [ ] Quando o CPF informado tem menos ou mais de 11 dígitos, então o AuthService rejeita com HTTP 400 antes mesmo de calcular o dígito verificador.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `cpf`, `tipoVinculo`, `AuthService`
- Limites: CPF com exatamente 11 dígitos
- Precisa de esclarecimento: sim — Não está definido se esta validação no AuthService reutiliza o mesmo mecanismo do REQ-122 (evitando duplicação) ou é uma implementação separada específica do fluxo de registro NAO_ESTUDANTE.

**Rastreabilidade:** REQ-139 (ver requirements.json)

---

### [Sprint 4] Validar unicidade de CPF e e-mail no cadastro
<!-- sdd-bot:meta id="BL-096" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-140" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar, no AuthService, validação de unicidade dos campos cpf e email contra a tabela Usuario antes de persistir um novo registro do tipo NAO_ESTUDANTE. A verificação deve ocorrer via consulta ao repositório (ex.: UsuarioRepository.existsByCpf / existsByEmail) dentro do fluxo de registro, retornando erro antes de qualquer escrita no banco.

**Comportamento esperado:**
O endpoint de cadastro rejeita a requisição quando CPF ou e-mail já existem em outro usuário, sem criar novo registro.

**Critérios de aceite:**
- [ ] Quando um CPF ainda não cadastrado é enviado no payload de registro, então o sistema prossegue com a criação do usuário.
- [ ] Quando o CPF informado já existe em outro registro de Usuario, então a API retorna HTTP 409 com corpo {"error":"CPF_JA_CADASTRADO"} e nenhum novo registro é criado.
- [ ] Quando o e-mail informado já existe em outro registro de Usuario, então a API retorna HTTP 409 com corpo {"error":"EMAIL_JA_CADASTRADO"} e nenhum novo registro é criado.
- [ ] Quando CPF e e-mail já existem simultaneamente, então a API retorna HTTP 409 priorizando a mensagem {"error":"CPF_JA_CADASTRADO"}.

**Especificidade técnica:**
- Códigos HTTP: 409
- Campos: `cpf`, `email`
- Precisa de esclarecimento: sim — Não está definido se a checagem de unicidade deve ser case-insensitive/normalizada para e-mail (ex.: lowercase) nem qual mensagem de erro exata usar em caso de conflito simultâneo; assumido código de erro padronizado a confirmar com o time.

**Rastreabilidade:** REQ-140 (ver requirements.json)

---

### [Sprint 4] Buscar diretoria pelo código de curso no cadastro
<!-- sdd-bot:meta id="BL-097" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-141" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar no AuthService uma consulta ao repositório de Diretoria (ex.: DiretoriaRepository.findByCodigoCurso) usando o campo codigoCurso recebido no payload de cadastro, para associar o usuário à diretoria correspondente durante o fluxo de registro.

**Comportamento esperado:**
O sistema localiza e retorna a diretoria vinculada ao código de curso informado, disponibilizando-a para associação ao usuário em criação.

**Critérios de aceite:**
- [ ] Quando o codigoCurso informado corresponde a uma Diretoria existente, então o serviço retorna a entidade Diretoria correspondente para uso no fluxo de cadastro.
- [ ] Quando o codigoCurso informado não corresponde a nenhuma Diretoria cadastrada, então a API retorna HTTP 404 com corpo {"error":"DIRETORIA_NAO_ENCONTRADA"}.
- [ ] Quando o campo codigoCurso está ausente ou vazio no payload, então a API retorna HTTP 400 com corpo {"error":"CODIGO_CURSO_OBRIGATORIO"}.

**Especificidade técnica:**
- Códigos HTTP: 404, 400
- Campos: `codigoCurso`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-141 (ver requirements.json)

---

### [Sprint 4] Criar usuário NAO_ESTUDANTE com status pendente de aprovação
<!-- sdd-bot:meta id="BL-098" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-142" dependsOn="REQ-139,REQ-140,REQ-141" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-139, REQ-140, REQ-141

**Descrição:**
No fluxo de registro do AuthService, após validação de unicidade (REQ-140) e resolução da diretoria (REQ-141), persistir um novo registro na tabela Usuario com tipo=NAO_ESTUDANTE, cpfVerificado=false, ativo=false e aprovacaoPendente=true, associando a diretoria encontrada.

**Comportamento esperado:**
O registro de Usuario criado no banco reflete exatamente os valores tipo=NAO_ESTUDANTE, cpfVerificado=false, ativo=false, aprovacaoPendente=true e diretoriaId preenchido.

**Critérios de aceite:**
- [ ] Quando os dados de cadastro são válidos e a diretoria é encontrada, então o registro criado em Usuario possui tipo=NAO_ESTUDANTE, cpfVerificado=false, ativo=false e aprovacaoPendente=true.
- [ ] Quando o usuário é criado, então o campo diretoriaId do registro corresponde ao id da Diretoria retornada por REQ-141.
- [ ] Quando a criação do registro falha por violação de constraint no banco (ex.: unique de CPF/e-mail não capturada previamente), então a API retorna HTTP 409 e nenhuma alteração parcial permanece persistida.
- [ ] Quando os dados obrigatórios do usuário (nome, cpf, email) estão ausentes, então a API retorna HTTP 400 com corpo {"error":"DADOS_OBRIGATORIOS_AUSENTES"} e o registro não é criado.

**Especificidade técnica:**
- Códigos HTTP: 409, 400
- Campos: `tipo`, `cpfVerificado`, `ativo`, `aprovacaoPendente`, `diretoriaId`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-142 (ver requirements.json)

---

### [Sprint 4] Disparar e-mail de confirmação nível 2 no cadastro não estudante
<!-- sdd-bot:meta id="BL-099" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-143" dependsOn="REQ-142" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-142

**Descrição:**
Após a criação do registro de Usuario NAO_ESTUDANTE (REQ-142), invocar o serviço de envio de e-mail (ex.: EmailService.enviarConfirmacaoNivel2) para disparar mensagem de confirmação de verificação nível 2, contendo link/token de validação vinculado ao usuário recém-criado.

**Comportamento esperado:**
O usuário recém-cadastrado recebe, na caixa de entrada do e-mail informado, uma mensagem de confirmação de nível 2 com link de verificação válido.

**Critérios de aceite:**
- [ ] Quando o registro de Usuario NAO_ESTUDANTE é criado, então o EmailService é chamado com o e-mail do usuário e um token de verificação nível 2 gerado.
- [ ] Quando o envio do e-mail é aceito pelo provedor, então a API de cadastro retorna HTTP 201 e o corpo indica status "CONFIRMACAO_ENVIADA", sem expor o token.
- [ ] Quando o serviço de e-mail falha ao enviar (timeout ou erro do provedor), então a API retorna HTTP 201 para o cadastro já persistido, o erro de envio é registrado em log com o usuarioId, e a criação do usuário não é revertida.
- [ ] Quando o token de verificação nível 2 é gerado, então ele é armazenado associado ao usuário com um campo de data de expiração preenchido.

**Especificidade técnica:**
- Códigos HTTP: 201
- Campos: `email`, `tokenVerificacao`
- Precisa de esclarecimento: sim — Não há definição do prazo de expiração do token de verificação nível 2 nem do mecanismo de reenvio/reprocessamento em caso de falha do provedor de e-mail; necessário definir esses parâmetros com o time.

**Rastreabilidade:** REQ-143 (ver requirements.json)

---

### [Sprint 4] Emitir token JWT com expiração de 24 horas no login
<!-- sdd-bot:meta id="BL-100" epic="8.1 Autenticação" layer="backend" requirementIds="REQ-238" dependsOn="REQ-236" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-236

**Descrição:**
No endpoint de login (POST /auth/login), ao gerar o token JWT via biblioteca de assinatura (ex.: jsonwebtoken), configurar o claim 'exp' para 24 horas (86400 segundos) a partir do momento da emissão ('iat'). O middleware de autenticação deve validar o claim 'exp' em cada requisição protegida e rejeitar tokens expirados.

**Comportamento esperado:**
O token JWT retornado no login contém o claim 'exp' com timestamp igual a 'iat' + 86400 segundos. Requisições feitas com token cujo 'exp' já passou retornam HTTP 401 com corpo {"error":"token expirado"}.

**Critérios de aceite:**
- [ ] Quando o login é bem-sucedido, então o JWT retornado possui claim 'exp' = 'iat' + 86400 segundos.
- [ ] Quando uma requisição autenticada usa token com 'exp' no passado, então a API retorna HTTP 401 com mensagem "token expirado".
- [ ] Quando uma requisição autenticada usa token com 'exp' válido (menos de 24h desde emissão), então a API processa a requisição e retorna HTTP 200.
- [ ] Quando o token é decodificado, então o payload contém os claims 'iat' e 'exp' em formato Unix timestamp.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `exp`, `iat`, `token`
- Limites: 24 horas (86400 segundos)
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-238 (ver requirements.json)

---

### [Sprint 4] Validar credenciais de login via SIA ou bcrypt
<!-- sdd-bot:meta id="BL-101" epic="9.1 Fluxo de Login com Auto-Atletica" layer="backend" requirementIds="REQ-258" dependsOn="REQ-7" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-7

**Descrição:**
No endpoint POST /auth/login, implementar lógica que determina o tipo de usuário (estudante vs. não-estudante) e roteia a validação de credenciais: para estudantes, chamar o serviço de integração com o SIA (Sistema de Informações Acadêmicas) enviando RGA/matrícula e senha; para não-estudantes, comparar a senha informada com o hash armazenado na tabela de usuários usando bcrypt.compare(). O resultado de ambos os fluxos converge para a emissão do JWT (REQ-238) quando a validação é positiva.

**Comportamento esperado:**
Login de estudante com credenciais válidas no SIA retorna HTTP 200 com token JWT. Login de não-estudante cuja senha corresponde ao hash bcrypt armazenado retorna HTTP 200 com token JWT. Credenciais que não correspondem em nenhum dos dois fluxos retornam HTTP 401 com {"error":"credenciais inválidas"}.

**Critérios de aceite:**
- [ ] Quando um estudante envia RGA e senha que o SIA reconhece como válidos, então a API responde HTTP 200 com token JWT.
- [ ] Quando um não-estudante envia e-mail e senha cujo hash bcrypt corresponde ao armazenado, então a API responde HTTP 200 com token JWT.
- [ ] Quando a senha informada não corresponde ao hash bcrypt armazenado, então a API retorna HTTP 401 com {"error":"credenciais inválidas"}.
- [ ] Quando o serviço SIA não responde ou retorna erro de comunicação, então a API retorna HTTP 503 com {"error":"serviço de autenticação indisponível"}.
- [ ] Quando o RGA informado não existe na base do SIA, então a API retorna HTTP 401 com {"error":"credenciais inválidas"}.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 503
- Campos: `rga`, `senha`, `email`, `error`
- Precisa de esclarecimento: sim — Não está definido como o sistema diferencia estudante de não-estudante na requisição de login (campo específico ou tentativa em cascata SIA→bcrypt) nem o timeout aceitável para a chamada ao SIA.

**Rastreabilidade:** REQ-258 (ver requirements.json)

---

### [Sprint 4] Extrair código do curso a partir do RGA do estudante
<!-- sdd-bot:meta id="BL-102" epic="9.1 Fluxo de Login com Auto-Atletica" layer="backend" requirementIds="REQ-259" dependsOn="REQ-258" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-258

**Descrição:**
Implementar função de parsing que recebe a string do RGA validada pelo SIA (REQ-258) e extrai a substring correspondente ao código do curso, conforme posição/máscara definida no padrão de RGA da instituição. O código extraído é armazenado no campo 'codigoCurso' do registro de usuário para uso posterior na associação à diretoria (REQ-260).

**Comportamento esperado:**
Dado um RGA no formato válido, a função retorna uma string contendo apenas os dígitos do código do curso, e esse valor fica gravado no campo 'codigoCurso' associado ao usuário autenticado.

**Critérios de aceite:**
- [ ] Quando um RGA no formato válido é processado, então a função retorna a substring correspondente ao código do curso na posição definida pela máscara do RGA.
- [ ] Quando o código do curso é extraído, então ele é gravado no campo 'codigoCurso' do registro do usuário.
- [ ] Quando o RGA recebido tem tamanho diferente do esperado pela máscara, então a API retorna HTTP 422 com {"error":"RGA em formato inválido"}.
- [ ] Quando o RGA está vazio ou nulo, então a API retorna HTTP 422 com {"error":"RGA não informado"} sem executar a extração.

**Especificidade técnica:**
- Códigos HTTP: 422
- Campos: `rga`, `codigoCurso`, `error`
- Precisa de esclarecimento: sim — O SDD não especifica a máscara/posição exata dos dígitos do código do curso dentro do RGA (quantidade de caracteres e offset), necessária para implementar o parsing.

**Rastreabilidade:** REQ-259 (ver requirements.json)

---

### [Sprint 4] Associar usuário à diretoria automaticamente pelo código do curso
<!-- sdd-bot:meta id="BL-103" epic="9.1 Fluxo de Login com Auto-Atletica" layer="backend" requirementIds="REQ-260" dependsOn="REQ-259" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-259

**Descrição:**
Após a extração do código do curso (REQ-259), consultar a tabela 'diretorias' (coluna 'codigoCurso') para localizar o registro correspondente e vincular o ID da diretoria encontrada ao campo 'diretoriaId' do usuário, persistindo essa associação no banco de dados durante o fluxo de login/cadastro.

**Comportamento esperado:**
Ao concluir a extração do código do curso, o campo 'diretoriaId' do usuário é preenchido com o ID da diretoria cujo 'codigoCurso' corresponde exatamente ao extraído do RGA, e o valor fica persistido na tabela de usuários.

**Critérios de aceite:**
- [ ] Quando o código do curso extraído corresponde a um registro existente em 'diretorias', então o campo 'diretoriaId' do usuário é atualizado com o ID dessa diretoria e a operação retorna HTTP 200.
- [ ] Quando o código do curso extraído não corresponde a nenhuma diretoria cadastrada, então o campo 'diretoriaId' permanece nulo e a API retorna HTTP 200 com {"warning":"diretoria não encontrada para o curso"}.
- [ ] Quando mais de uma diretoria está cadastrada com o mesmo 'codigoCurso', então a API retorna HTTP 409 com {"error":"conflito: múltiplas diretorias para o mesmo código de curso"}.
- [ ] Quando a consulta à tabela 'diretorias' falha por erro de conexão com o banco, então a API retorna HTTP 500 com {"error":"falha ao consultar diretorias"}.

**Especificidade técnica:**
- Códigos HTTP: 200, 409, 500
- Campos: `codigoCurso`, `diretoriaId`, `warning`, `error`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-260 (ver requirements.json)

---

### [Sprint 4] Listar diretorias vinculadas ao usuário no login
<!-- sdd-bot:meta id="BL-104" epic="9.1 Fluxo de Login com Auto-Atletica" layer="backend" requirementIds="REQ-261" dependsOn="REQ-258" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-258

**Descrição:**
Implementar consulta na camada de serviço de autenticação que, após validação de credenciais, busca na tabela de vínculos (ex.: usuario_diretoria) todas as diretorias associadas ao usuário autenticado, retornando lista para ser incluída no payload de resposta do login.

**Comportamento esperado:**
A resposta do endpoint de login inclui um array 'diretorias' com id, nome e cargo/papel do usuário em cada diretoria vinculada; se não houver vínculos, o array retorna vazio ([]).

**Critérios de aceite:**
- [ ] Quando um usuário com 2 diretorias vinculadas realizar login, então o array 'diretorias' na resposta contém exatamente 2 objetos com os campos id, nome e cargo.
- [ ] Quando um usuário não possuir nenhuma diretoria vinculada, então o array 'diretorias' é retornado vazio ([]) sem erro.
- [ ] Quando a consulta ao banco falhar (ex.: timeout de conexão), então o endpoint retorna HTTP 500 com mensagem 'Erro ao consultar diretorias vinculadas'.
- [ ] Quando o usuário estiver vinculado a uma diretoria inativa, então essa diretoria não é incluída no array retornado.

**Especificidade técnica:**
- Códigos HTTP: 500
- Campos: `diretorias`, `id`, `nome`, `cargo`
- Precisa de esclarecimento: sim — Não está definido se diretorias inativas devem ou não ser filtradas da listagem; assumido que sim, mas requer confirmação do time de negócio.

**Rastreabilidade:** REQ-261 (ver requirements.json)

---

### [Sprint 4] Retornar access_token e dados do usuário no login
<!-- sdd-bot:meta id="BL-105" epic="9.1 Fluxo de Login com Auto-Atletica" layer="backend" requirementIds="REQ-262" dependsOn="REQ-236,REQ-260,REQ-261" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-236, REQ-260, REQ-261

**Descrição:**
Alterar o endpoint de login (ex.: POST /auth/login) para, após autenticação bem-sucedida e obtenção das diretorias vinculadas (REQ-261), gerar um JWT (access_token) e montar o corpo de resposta consolidando token, dados do usuário e lista de diretorias.

**Comportamento esperado:**
A resposta HTTP 200 do endpoint /auth/login contém um JSON com os campos 'access_token' (string JWT), 'user' (objeto com id, nome, email, tipo) e 'diretorias' (array), permitindo ao frontend persistir a sessão sem chamadas adicionais.

**Critérios de aceite:**
- [ ] Quando as credenciais forem válidas, então o endpoint retorna HTTP 200 com JSON contendo 'access_token', 'user' e 'diretorias' preenchidos.
- [ ] Quando o access_token for decodificado, então ele contém claims 'sub' (id do usuário) e 'exp' (expiração) válidos.
- [ ] Quando as credenciais forem inválidas (email ou senha incorretos), então o endpoint retorna HTTP 401 com mensagem 'Credenciais inválidas' e nenhum token é gerado.
- [ ] Quando o campo 'email' ou 'senha' estiver ausente no corpo da requisição, então o endpoint retorna HTTP 400 com mensagem 'Campos obrigatórios não informados'.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 401
- Campos: `access_token`, `user`, `diretorias`, `email`, `senha`, `sub`, `exp`
- Precisa de esclarecimento: sim — Tempo de expiração (exp) do access_token não foi especificado no requisito; precisa ser definido junto ao time de segurança.

**Rastreabilidade:** REQ-262 (ver requirements.json)

---

### [Sprint 4] Validar RGA do estudante via consulta ao SIA no login
<!-- sdd-bot:meta id="BL-106" epic="Troubleshooting" layer="backend" requirementIds="REQ-350" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar chamada de integração ao sistema SIA (Sistema de Informações Acadêmicas) durante o fluxo de login de usuários do tipo estudante, enviando o RGA informado no cadastro/login e validando o retorno da consulta antes de permitir a conclusão da autenticação.

**Comportamento esperado:**
Quando o RGA informado existir e estiver ativo no SIA, o login prossegue e emite o token; quando o RGA não for encontrado ou o SIA retornar matrícula inativa, o login é bloqueado com HTTP 422 ou 403 e mensagem de erro específica.

**Critérios de aceite:**
- [ ] Quando o SIA retornar o RGA como ativo, então o fluxo de login prossegue e o token é emitido conforme REQ-262.
- [ ] Quando o RGA não existir na base do SIA, então o endpoint retorna HTTP 422 com mensagem 'RGA não encontrado no SIA'.
- [ ] Quando o SIA indicar matrícula inativa/trancada para o RGA, então o endpoint retorna HTTP 403 com mensagem 'Matrícula inativa no SIA'.
- [ ] Quando a integração com o SIA estiver indisponível (timeout ou erro de conexão), então o endpoint retorna HTTP 503 com mensagem 'Serviço do SIA indisponível, tente novamente mais tarde'.
- [ ] Quando o campo 'rga' estiver ausente na requisição de login de estudante, então o endpoint retorna HTTP 400 com mensagem 'RGA é obrigatório para login de estudante'.

**Especificidade técnica:**
- Códigos HTTP: 400, 403, 422, 503
- Campos: `rga`
- Precisa de esclarecimento: sim — Não há detalhes sobre o contrato da API do SIA (endpoint, formato de resposta, timeout configurado); precisa ser definido com a equipe responsável pela integração.

**Rastreabilidade:** REQ-350 (ver requirements.json)

---

### [Sprint 5] Permitir vínculo de usuário a múltiplas diretorias
<!-- sdd-bot:meta id="BL-107" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-14" dependsOn="REQ-1" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-1

**Descrição:**
Criar tabela de associação (ex.: user_diretoria) do tipo many-to-many entre a entidade User e a entidade Diretoria, substituindo qualquer relação 1:1 existente. Ajustar o AuthService e o mecanismo de emissão de token/sessão para carregar a lista de diretorias vinculadas ao usuário autenticado, em vez de uma referência única. Ajustar queries e middlewares de autorização que hoje assumem diretoria_id único no usuário.

**Comportamento esperado:**
Um usuário autenticado consegue ter registros de vínculo com duas ou mais diretorias simultaneamente e o sistema retorna todas elas ao consultar seu perfil.

**Critérios de aceite:**
- [ ] Quando um usuário é vinculado a uma segunda diretoria via endpoint de vínculo, então o registro na tabela user_diretoria é criado sem remover o vínculo existente.
- [ ] Quando o endpoint GET /users/{id}/diretorias é chamado, então retorna 200 com um array contendo todas as diretorias vinculadas ao usuário.
- [ ] Quando se tenta vincular o usuário a uma diretoria à qual ele já está vinculado, então o sistema retorna 409 Conflict com mensagem "Usuário já vinculado a esta diretoria".
- [ ] Quando se tenta vincular um usuário a uma diretoria inexistente, então o sistema retorna 404 Not Found com mensagem "Diretoria não encontrada".
- [ ] Quando o usuário é removido de todas as diretorias, então consultas subsequentes ao seu perfil retornam array vazio em vez de erro.

**Especificidade técnica:**
- Códigos HTTP: 200, 404, 409
- Campos: `user_diretoria`, `GET /users/{id}/diretorias`, `diretoria_id`
- Precisa de esclarecimento: sim — Não há definição do endpoint exato para criar/remover o vínculo (rota, verbo HTTP) nem se há limite máximo de diretorias por usuário; assumiu-se estrutura baseada em padrão REST a confirmar com o time.

**Rastreabilidade:** REQ-14 (ver requirements.json)

---

### [Sprint 5] Implementar CRUD de diretorias (atléticas)
<!-- sdd-bot:meta id="BL-108" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-17" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Criar endpoints REST para a entidade Diretoria: POST /diretorias, GET /diretorias, GET /diretorias/{id}, PUT /diretorias/{id} e DELETE /diretorias/{id}, com o respectivo DiretoriaService e schema de tabela diretorias contendo campos básicos (id, nome, descrição, ativo). Implementar exclusão lógica (soft delete via flag ativo) em vez de remoção física, para preservar histórico de vínculos e aprovações associadas.

**Comportamento esperado:**
É possível criar, listar, consultar, atualizar e desativar diretorias via API, com os dados persistidos e recuperáveis conforme as operações executadas.

**Critérios de aceite:**
- [ ] Quando POST /diretorias é chamado com campo "nome" válido, então o sistema retorna 201 Created com o objeto da diretoria criada.
- [ ] Quando POST /diretorias é chamado sem o campo "nome", então o sistema retorna 400 Bad Request com mensagem "Campo nome é obrigatório".
- [ ] Quando GET /diretorias/{id} é chamado com id existente, então retorna 200 com os dados da diretoria.
- [ ] Quando GET /diretorias/{id} é chamado com id inexistente, então retorna 404 Not Found.
- [ ] Quando DELETE /diretorias/{id} é chamado, então a diretoria tem o campo "ativo" definido como false e deixa de aparecer em GET /diretorias por padrão, sem ser removida da tabela.
- [ ] Quando PUT /diretorias/{id} é chamado com id de diretoria já desativada, então o sistema retorna 409 Conflict com mensagem "Diretoria inativa não pode ser editada".

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 404, 409
- Campos: `nome`, `descrição`, `ativo`, `POST /diretorias`, `GET /diretorias/{id}`, `PUT /diretorias/{id}`, `DELETE /diretorias/{id}`
- Precisa de esclarecimento: sim — Não há definição de quais campos além de nome são obrigatórios nem de regras de unicidade (ex.: nome único); assumiu-se soft delete por ausência de indicação contrária, a validar com o time.

**Rastreabilidade:** REQ-17 (ver requirements.json)

---

### [Sprint 5] Associar código de curso à diretoria para auto-discovery
<!-- sdd-bot:meta id="BL-109" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-18" dependsOn="REQ-17,REQ-9" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-17, REQ-9

**Descrição:**
Adicionar coluna codigo_curso à tabela diretorias e expor esse campo nos endpoints de criação/atualização (POST/PUT /diretorias) do CRUD existente. Utilizar esse campo no serviço de auto-discovery (REQ-9) para localizar automaticamente a diretoria correspondente ao curso do usuário durante o cadastro.

**Comportamento esperado:**
Ao cadastrar ou consultar uma diretoria, o campo codigo_curso é persistido e retornado, e o serviço de auto-discovery consegue localizar a diretoria correta a partir do código de curso informado pelo usuário.

**Critérios de aceite:**
- [ ] Quando POST /diretorias é chamado com campo "codigo_curso" preenchido, então o valor é persistido e retornado no objeto de resposta com status 201.
- [ ] Quando o serviço de auto-discovery recebe um codigo_curso existente, então retorna a diretoria associada com status 200.
- [ ] Quando o serviço de auto-discovery recebe um codigo_curso que não corresponde a nenhuma diretoria, então retorna 404 Not Found com mensagem "Nenhuma diretoria encontrada para este código de curso".
- [ ] Quando se tenta criar uma diretoria com codigo_curso já associado a outra diretoria, então o sistema retorna 409 Conflict com mensagem "Código de curso já associado a outra diretoria".

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 404, 409
- Campos: `codigo_curso`, `POST /diretorias`, `PUT /diretorias/{id}`
- Precisa de esclarecimento: sim — Não há definição do formato/tamanho do código de curso nem se uma diretoria pode ter múltiplos códigos de curso associados; assumiu-se relação 1:1 a confirmar com o time.

**Rastreabilidade:** REQ-18 (ver requirements.json)

---

### [Sprint 5] Notificar diretoria sobre cadastro pendente de aprovação
<!-- sdd-bot:meta id="BL-110" epic="5.3 Services Principais - AuthService" layer="backend" requirementIds="REQ-144" dependsOn="REQ-142" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-142

**Descrição:**
No AuthService, ao concluir o cadastro de um usuário não-estudante (evento subsequente ao fluxo de REQ-142), disparar um evento/chamada ao NotificationService para enviar notificação (e-mail e/ou notificação in-app) aos membros com papel DIRETORIA vinculados à atlética correspondente, informando que há um novo cadastro pendente de aprovação. Persistir registro do envio para permitir auditoria e evitar duplicidade de notificação para o mesmo cadastro.

**Comportamento esperado:**
Os usuários com papel DIRETORIA da atlética recebem uma notificação assim que um cadastro de não-estudante é submetido, direcionando-os à tela de aprovações pendentes.

**Critérios de aceite:**
- [ ] Quando um cadastro de não-estudante é criado com status pendente, então todos os usuários com papel DIRETORIA vinculados à diretoria correspondente recebem a notificação em até 1 minuto após a submissão.
- [ ] Quando a diretoria correspondente não possui nenhum usuário com papel DIRETORIA vinculado, então o sistema registra log de alerta "Nenhum aprovador disponível" e não lança exceção não tratada.
- [ ] Quando a notificação para um mesmo cadastro já foi enviada anteriormente, então uma nova tentativa de disparo para o mesmo cadastro não gera notificação duplicada.
- [ ] Quando o serviço de envio de notificação (e-mail) falha, então o sistema registra o erro em log e não impede a conclusão do cadastro do usuário.

**Especificidade técnica:**
- Campos: `status`, `papel DIRETORIA`, `cadastro_id`
- Limites: 1 minuto
- Precisa de esclarecimento: sim — Não há definição do canal exato de notificação (e-mail, push, in-app) nem do template/conteúdo da mensagem; assumiu-se necessidade de confirmação com o time sobre o(s) canal(is) suportado(s) pelo NotificationService.

**Rastreabilidade:** REQ-144 (ver requirements.json)

---

### [Sprint 5] Normalizar CPF removendo pontuação antes da validação
<!-- sdd-bot:meta id="BL-111" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-147" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar no CpfVerificationService (backend) uma etapa de pré-processamento que remove caracteres não numéricos (pontos, hífen, espaços) do CPF recebido antes de qualquer validação de formato ou dígito verificador. A normalização deve ocorrer no início do fluxo de verificação, produzindo uma string contendo apenas dígitos para as etapas seguintes.

**Comportamento esperado:**
O serviço aceita CPFs digitados com ou sem máscara e processa ambos os formatos de forma equivalente nas etapas subsequentes de validação.

**Critérios de aceite:**
- [ ] Quando o CPF de entrada for "123.456.789-09", então o serviço normaliza para "12345678909" antes de validar.
- [ ] Quando o CPF de entrada já estiver sem pontuação ("12345678909"), então o serviço mantém o valor inalterado após normalização.
- [ ] Quando o CPF contiver espaços em branco intercalados (" 123.456.789-09 "), então o serviço remove espaços e pontuação, retornando "12345678909".
- [ ] Quando o CPF normalizado tiver menos de 11 dígitos após remoção de pontuação, então o serviço retorna erro de formato inválido com código "CPF_INVALID_LENGTH" (HTTP 400).
- [ ] Quando o CPF contiver letras ou outros caracteres não numéricos além de pontuação (ex.: "123.abc.789-09"), então o serviço retorna erro "CPF_INVALID_FORMAT" (HTTP 400).

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `CPF_INVALID_LENGTH`, `CPF_INVALID_FORMAT`
- Limites: 11 dígitos
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-147 (ver requirements.json)

---

### [Sprint 5] Validar dígitos verificadores do CPF via algoritmo mod 11
<!-- sdd-bot:meta id="BL-112" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-148" dependsOn="REQ-147" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-147

**Descrição:**
Adicionar ao CpfVerificationService a validação dos dois dígitos verificadores do CPF (já normalizado pelo REQ-147) utilizando o algoritmo mod 11: cálculo dos pesos sobre os 9 primeiros dígitos para obter o primeiro dígito verificador, e sobre os 10 primeiros dígitos para obter o segundo, comparando os valores calculados com os dois últimos dígitos informados.

**Comportamento esperado:**
CPFs com dígitos verificadores matematicamente inconsistentes são rejeitados, enquanto CPFs com dígitos corretos são aceitos na etapa de validação.

**Critérios de aceite:**
- [ ] Quando o CPF normalizado for "52998224725" (dígitos verificadores corretos), então o serviço retorna o CPF como válido.
- [ ] Quando o CPF normalizado for "52998224700" (dígitos verificadores incorretos), então o serviço retorna erro "CPF_INVALID_CHECK_DIGIT" (HTTP 400).
- [ ] Quando apenas o primeiro dígito verificador estiver correto mas o segundo estiver incorreto, então o serviço retorna erro "CPF_INVALID_CHECK_DIGIT" (HTTP 400).
- [ ] Quando o CPF normalizado tiver exatamente 11 dígitos numéricos mas não passar no cálculo mod 11, então o serviço não avança para camadas seguintes de negócio e interrompe o fluxo com erro.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `CPF_INVALID_CHECK_DIGIT`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-148 (ver requirements.json)

---

### [Sprint 5] Rejeitar CPFs com sequências de dígitos repetidos
<!-- sdd-bot:meta id="BL-113" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-149" dependsOn="REQ-147" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-147

**Descrição:**
Incluir no CpfVerificationService uma checagem que compara o CPF normalizado contra a lista das 10 sequências conhecidas de dígitos repetidos (000.000.000-00 até 999.999.999-99), rejeitando-as antes ou independentemente do cálculo mod 11, já que essas sequências podem passar matematicamente na validação de dígito verificador.

**Comportamento esperado:**
CPFs formados por um único dígito repetido 11 vezes são recusados mesmo quando aritmeticamente satisfazem o cálculo do dígito verificador.

**Critérios de aceite:**
- [ ] Quando o CPF normalizado for "11111111111", então o serviço retorna erro "CPF_REPEATED_SEQUENCE" (HTTP 400).
- [ ] Quando o CPF normalizado for "00000000000", então o serviço retorna erro "CPF_REPEATED_SEQUENCE" (HTTP 400).
- [ ] Quando o CPF normalizado for uma sequência válida não repetida, como "52998224725", então o serviço não aplica a rejeição por sequência repetida e prossegue para o cálculo mod 11.
- [ ] Quando o CPF normalizado for "99999999999", então o serviço retorna erro "CPF_REPEATED_SEQUENCE" (HTTP 400) mesmo que os dígitos verificadores calculados coincidam com os informados.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `CPF_REPEATED_SEQUENCE`
- Limites: 10 sequências conhecidas (000...999)
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-149 (ver requirements.json)

---

### [Sprint 5] Validar código OTP de confirmação de posse de e-mail
<!-- sdd-bot:meta id="BL-114" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-150" dependsOn="REQ-143" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-143

**Descrição:**
Implementar no backend a verificação do código OTP enviado ao e-mail do usuário (gerado conforme REQ-143), comparando o código submetido pelo usuário com o valor armazenado associado ao e-mail, considerando prazo de expiração e número de tentativas permitidas antes de invalidar o código.

**Comportamento esperado:**
O e-mail do usuário é marcado como confirmado somente quando o código OTP submetido corresponde ao código gerado e ainda está dentro do prazo de validade.

**Critérios de aceite:**
- [ ] Quando o usuário submeter o código OTP correto dentro do prazo de expiração, então o sistema marca o e-mail como confirmado e retorna HTTP 200.
- [ ] Quando o usuário submeter um código OTP incorreto, então o sistema retorna erro "OTP_INVALID_CODE" (HTTP 400) sem confirmar o e-mail.
- [ ] Quando o usuário submeter o código OTP após o prazo de expiração, então o sistema retorna erro "OTP_EXPIRED" (HTTP 400) e exige nova solicitação de código.
- [ ] Quando não existir código OTP pendente para o e-mail informado, então o sistema retorna erro "OTP_NOT_FOUND" (HTTP 404).
- [ ] Quando o número de tentativas inválidas consecutivas atingir o limite configurado, então o sistema invalida o código e retorna erro "OTP_MAX_ATTEMPTS_EXCEEDED" (HTTP 429).

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 404, 429
- Campos: `OTP_INVALID_CODE`, `OTP_EXPIRED`, `OTP_NOT_FOUND`, `OTP_MAX_ATTEMPTS_EXCEEDED`
- Precisa de esclarecimento: sim — O requisito não especifica o tempo de expiração do OTP nem o número máximo de tentativas permitidas; essas definições dependem do REQ-143 (geração do OTP) e precisam ser confirmadas antes da implementação.

**Rastreabilidade:** REQ-150 (ver requirements.json)

---

### [Sprint 5] Marcar e-mail como verificado após confirmação de OTP
<!-- sdd-bot:meta id="BL-115" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-151" dependsOn="REQ-150" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-150

**Descrição:**
No CpfVerificationService, ao processar a confirmação do código OTP de e-mail, persistir a atualização do campo cpfVerificado do registro do usuário para true no banco de dados, no mesmo fluxo de validação do código OTP.

**Comportamento esperado:**
O campo cpfVerificado do usuário reflete true imediatamente após a confirmação do OTP ser processada.

**Critérios de aceite:**
- [ ] Quando o usuário informa o OTP de e-mail correto e dentro do prazo de validade, então o campo cpfVerificado do usuário é atualizado para true no banco.
- [ ] Quando o campo cpfVerificado é atualizado para true, então uma consulta subsequente ao registro do usuário retorna cpfVerificado=true sem exigir nova ação do usuário.
- [ ] Quando o OTP informado é inválido ou expirado, então o campo cpfVerificado permanece false e a API retorna 400 com mensagem 'OTP inválido ou expirado'.
- [ ] Quando o campo cpfVerificado já está true e o usuário tenta confirmar o OTP novamente, então a API retorna 409 com mensagem 'E-mail já verificado'.

**Especificidade técnica:**
- Códigos HTTP: 400, 409
- Campos: `cpfVerificado`, `OTP inválido ou expirado`, `E-mail já verificado`
- Precisa de esclarecimento: sim — O prazo de validade do OTP de e-mail (em minutos) não foi especificado no requisito; depende da definição feita em REQ-150.

**Rastreabilidade:** REQ-151 (ver requirements.json)

---

### [Sprint 5] Validar role DIRETORIA do aprovador antes de aprovar cadastro
<!-- sdd-bot:meta id="BL-116" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-152" dependsOn="REQ-144" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-144

**Descrição:**
No fluxo de aprovação do CpfVerificationService, antes de processar a aprovação de um cadastro pendente, consultar o vínculo do aprovador (UsuarioDiretoria) e verificar se ele possui a role DIRETORIA associada à mesma diretoria do cadastro em aprovação.

**Comportamento esperado:**
A aprovação só é processada quando o aprovador possui role DIRETORIA vinculada à diretoria correspondente ao cadastro; caso contrário, a operação é bloqueada.

**Critérios de aceite:**
- [ ] Quando o aprovador possui role DIRETORIA vinculada à mesma diretoria do cadastro pendente, então a aprovação prossegue para a etapa de ativação do usuário.
- [ ] Quando o aprovador não possui vínculo com a diretoria do cadastro, então a API retorna 403 com mensagem 'Aprovador não pertence à diretoria'.
- [ ] Quando o aprovador possui vínculo com a diretoria mas não possui a role DIRETORIA, então a API retorna 403 com mensagem 'Permissão insuficiente para aprovar cadastro'.
- [ ] Quando o cadastro a ser aprovado não está com status aprovacaoPendente=true, então a API retorna 409 com mensagem 'Cadastro não está pendente de aprovação'.

**Especificidade técnica:**
- Códigos HTTP: 403, 409
- Campos: `role`, `DIRETORIA`, `aprovacaoPendente`, `Aprovador não pertence à diretoria`, `Permissão insuficiente para aprovar cadastro`, `Cadastro não está pendente de aprovação`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-152 (ver requirements.json)

---

### [Sprint 5] Ativar usuário e limpar aprovação pendente após aprovação
<!-- sdd-bot:meta id="BL-117" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-153" dependsOn="REQ-152" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-152

**Descrição:**
No CpfVerificationService, ao concluir a aprovação de um cadastro pela diretoria, persistir a atualização dos campos ativo para true e aprovacaoPendente para false no registro do usuário, na mesma transação da operação de aprovação.

**Comportamento esperado:**
Após a aprovação, o registro do usuário reflete ativo=true e aprovacaoPendente=false, permitindo o acesso normal do usuário ao sistema.

**Critérios de aceite:**
- [ ] Quando a aprovação do cadastro é processada por um aprovador válido, então os campos ativo e aprovacaoPendente do usuário são atualizados para true e false, respectivamente, no banco.
- [ ] Quando a atualização dos campos ativo e aprovacaoPendente é concluída, então uma consulta subsequente ao usuário retorna ativo=true e aprovacaoPendente=false.
- [ ] Quando ocorre falha ao persistir a atualização dos campos, então a transação é revertida e o registro do usuário mantém ativo=false e aprovacaoPendente=true, retornando 500 com mensagem 'Falha ao ativar usuário'.
- [ ] Quando o usuário já está com ativo=true, então a API retorna 409 com mensagem 'Usuário já está ativo'.

**Especificidade técnica:**
- Códigos HTTP: 500, 409
- Campos: `ativo`, `aprovacaoPendente`, `Falha ao ativar usuário`, `Usuário já está ativo`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-153 (ver requirements.json)

---

### [Sprint 5] Buscar diretoria por código ao vincular usuário
<!-- sdd-bot:meta id="BL-118" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-156" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
No UsuarioDiretoriaService, implementar consulta que busca a entidade Diretoria pelo campo codigoCurso informado ao criar um novo vínculo UsuarioDiretoria para o usuário autenticado, retornando a diretoria correspondente antes de persistir o vínculo.

**Comportamento esperado:**
Ao informar um código de curso válido, o sistema localiza a diretoria correspondente e a utiliza para criar o vínculo com o usuário.

**Critérios de aceite:**
- [ ] Quando o código de curso informado corresponde a uma diretoria cadastrada, então o sistema localiza a diretoria e cria o vínculo UsuarioDiretoria para o usuário autenticado, retornando 201.
- [ ] Quando o código de curso informado não corresponde a nenhuma diretoria cadastrada, então a API retorna 404 com mensagem 'Diretoria não encontrada para o código informado'.
- [ ] Quando o campo codigoCurso não é informado na requisição, então a API retorna 400 com mensagem 'Código do curso é obrigatório'.
- [ ] Quando o usuário já possui vínculo ativo com a diretoria encontrada, então a API retorna 409 com mensagem 'Usuário já vinculado a esta diretoria'.

**Especificidade técnica:**
- Códigos HTTP: 201, 404, 400, 409
- Campos: `codigoCurso`, `Diretoria não encontrada para o código informado`, `Código do curso é obrigatório`, `Usuário já vinculado a esta diretoria`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-156 (ver requirements.json)

---

### [Sprint 5] Validar vínculo duplicado antes de criar usuario_diretoria
<!-- sdd-bot:meta id="BL-119" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-157" dependsOn="REQ-156" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-156

**Descrição:**
Implementar, no UsuarioDiretoriaService, verificação prévia à criação de vínculo: consultar a tabela usuario_diretoria pela combinação (usuario_id, diretoria_id) antes de inserir novo registro. Se já existir registro ativo para esse par, bloquear a operação antes de chegar na camada de persistência.

**Comportamento esperado:**
Ao tentar vincular um usuário a uma diretoria à qual ele já possui acesso, o sistema rejeita a operação retornando erro de conflito, sem alterar dados existentes.

**Critérios de aceite:**
- [ ] Quando o usuário não possui vínculo prévio com a diretoria informada, então a validação passa e o fluxo segue para criação do vínculo (REQ-158).
- [ ] Quando já existe registro ativo em usuario_diretoria para o par (usuario_id, diretoria_id), então a API retorna HTTP 409 com mensagem 'Usuário já possui acesso a esta diretoria'.
- [ ] Quando o diretoria_id informado não existe na base, então a API retorna HTTP 404 com mensagem 'Diretoria não encontrada'.
- [ ] Quando o usuario_id informado não existe na base, então a API retorna HTTP 404 com mensagem 'Usuário não encontrado'.

**Especificidade técnica:**
- Códigos HTTP: 409, 404
- Campos: `usuario_id`, `diretoria_id`, `usuario_diretoria`
- Precisa de esclarecimento: sim — Não está definido se vínculos podem existir em estado 'inativo'/'removido' (soft delete) e, nesse caso, se a validação de duplicidade deve considerar apenas vínculos ativos.

**Rastreabilidade:** REQ-157 (ver requirements.json)

---

### [Sprint 5] Criar registro usuario_diretoria ao vincular usuário
<!-- sdd-bot:meta id="BL-120" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-158" dependsOn="REQ-157" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-157

**Descrição:**
Implementar no UsuarioDiretoriaService a persistência do vínculo entre usuário e diretoria: inserir novo registro na tabela usuario_diretoria contendo usuario_id, diretoria_id e metadados de criação (data_criacao), executado após a validação de duplicidade (REQ-157) ter sido aprovada.

**Comportamento esperado:**
Após a validação prévia, o vínculo entre usuário e diretoria passa a existir na base de dados e é retornado na resposta da API com status de sucesso.

**Critérios de aceite:**
- [ ] Quando a validação de duplicidade (REQ-157) é aprovada, então a API cria o registro em usuario_diretoria e retorna HTTP 201 com o objeto criado contendo usuario_id, diretoria_id e data_criacao.
- [ ] Quando o registro é criado, então uma consulta subsequente à listagem de diretorias do usuário deve incluir a nova diretoria vinculada.
- [ ] Quando faltar o campo diretoria_id no payload da requisição, então a API retorna HTTP 400 com mensagem 'diretoria_id é obrigatório'.
- [ ] Quando ocorrer falha na escrita ao banco (ex.: violação de constraint), então a API retorna HTTP 500 e nenhum registro parcial é persistido.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 500
- Campos: `usuario_id`, `diretoria_id`, `data_criacao`, `usuario_diretoria`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-158 (ver requirements.json)

---

### [Sprint 5] Bloquear remoção da diretoria principal do usuário
<!-- sdd-bot:meta id="BL-121" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-160" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar no UsuarioDiretoriaService validação executada antes da exclusão de um vínculo: verificar se o diretoria_id a ser removido corresponde à diretoria marcada como principal do usuário (campo diretoria_principal_id em usuario, ou flag equivalente em usuario_diretoria). Se coincidir, impedir a chamada de exclusão.

**Comportamento esperado:**
Ao tentar remover o vínculo referente à diretoria principal do usuário, o sistema recusa a operação e mantém o vínculo intacto.

**Critérios de aceite:**
- [ ] Quando o diretoria_id a remover não é a diretoria principal do usuário, então a validação passa e o fluxo segue para exclusão do vínculo (REQ-161).
- [ ] Quando o diretoria_id a remover é a diretoria principal do usuário, então a API retorna HTTP 409 com mensagem 'Não é possível remover a diretoria principal do usuário'.
- [ ] Quando o vínculo usuario_diretoria informado não existe, então a API retorna HTTP 404 com mensagem 'Vínculo não encontrado'.
- [ ] Quando a validação bloqueia a remoção, então o registro em usuario_diretoria permanece inalterado no banco.

**Especificidade técnica:**
- Códigos HTTP: 409, 404
- Campos: `diretoria_id`, `diretoria_principal_id`, `usuario_diretoria`
- Precisa de esclarecimento: sim — Não está definido em qual campo/tabela reside a marcação de 'diretoria principal' (ex.: coluna em usuario vs. flag booleana em usuario_diretoria), necessário para implementar a consulta de comparação.

**Rastreabilidade:** REQ-160 (ver requirements.json)

---

### [Sprint 5] Remover registro usuario_diretoria ao desvincular usuário
<!-- sdd-bot:meta id="BL-122" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-161" dependsOn="REQ-160" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-160

**Descrição:**
Implementar no UsuarioDiretoriaService a exclusão do vínculo: deletar o registro correspondente da tabela usuario_diretoria pela chave (usuario_id, diretoria_id), executado após a validação de proteção da diretoria principal (REQ-160) ter sido aprovada.

**Comportamento esperado:**
Após a validação prévia, o vínculo entre usuário e diretoria deixa de existir na base de dados e não é mais retornado nas consultas de diretorias do usuário.

**Critérios de aceite:**
- [ ] Quando a validação REQ-160 é aprovada, então a API remove o registro de usuario_diretoria e retorna HTTP 204 sem corpo de resposta.
- [ ] Quando o registro é removido, então uma consulta subsequente à listagem de diretorias do usuário não deve mais incluir a diretoria removida.
- [ ] Quando o vínculo informado (usuario_id, diretoria_id) não existe na base, então a API retorna HTTP 404 com mensagem 'Vínculo não encontrado'.
- [ ] Quando a diretoria removida era a atlética ativa selecionada na sessão do usuário, então o sistema deve tratar essa inconsistência conforme regra a ser definida.

**Especificidade técnica:**
- Códigos HTTP: 204, 404
- Campos: `usuario_id`, `diretoria_id`, `usuario_diretoria`
- Precisa de esclarecimento: sim — Não está definido o comportamento esperado quando a diretoria removida é a atlética/diretoria atualmente ativa na sessão do usuário — se deve trocar automaticamente para outra diretoria vinculada ou exigir nova seleção.

**Rastreabilidade:** REQ-161 (ver requirements.json)

---

### [Sprint 5] Criar endpoint POST /auth/register/estudante
<!-- sdd-bot:meta id="BL-123" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-204" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /auth/register/estudante que recebe payload JSON com rga, senha, nome e email. O serviço deve persistir o usuário na tabela de usuários com papel 'estudante', aplicar hash na senha antes de gravar, e verificar unicidade de rga e email antes da inserção.

**Comportamento esperado:**
Ao enviar dados válidos e inéditos, a API retorna 201 com o objeto do usuário criado (sem o campo senha). Ao enviar rga ou email já cadastrados, a API retorna 409 com mensagem de conflito.

**Critérios de aceite:**
- [ ] Quando enviado rga, senha, nome e email válidos e inéditos, então a API retorna 201 com o usuário criado e sem o campo senha no corpo da resposta.
- [ ] Quando o rga informado já existir na base, então a API retorna 409 com mensagem de erro indicando conflito de rga.
- [ ] Quando o email informado já existir na base, então a API retorna 409 com mensagem de erro indicando conflito de email.
- [ ] Quando a senha for persistida, então o valor salvo na tabela de usuários deve estar em formato hash, nunca em texto plano.

**Especificidade técnica:**
- Códigos HTTP: 201, 409
- Campos: `rga`, `senha`, `nome`, `email`
- Precisa de esclarecimento: sim — O requisito não especifica algoritmo de hash de senha, tamanho mínimo/máximo dos campos (rga, senha, nome, email) nem o formato exato da mensagem de erro 409. Necessário definir política de senha e algoritmo de hash antes da implementação.

**Rastreabilidade:** REQ-204 (ver requirements.json)

---

### [Sprint 5] Criar endpoint POST /auth/register/nao-estudante
<!-- sdd-bot:meta id="BL-124" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-205" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /auth/register/nao-estudante que recebe cpf, codigoCurso, nome, email e senha. O serviço deve criar o usuário com papel 'não-estudante' e flag aprovacaoPendente=true, associando-o ao curso via codigoCurso, sem liberar acesso até aprovação da diretoria via fluxo OTP.

**Comportamento esperado:**
Ao enviar dados válidos, a API retorna 201 com o usuário criado contendo aprovacaoPendente=true. Requisições com dados inválidos, curso inexistente ou dados duplicados retornam 400, 404 ou 409 respectivamente.

**Critérios de aceite:**
- [ ] Quando enviado cpf, codigoCurso, nome, email e senha válidos e inéditos, então a API retorna 201 com o usuário criado contendo aprovacaoPendente=true.
- [ ] Quando algum campo obrigatório estiver ausente ou em formato inválido, então a API retorna 400 com mensagem indicando o campo inválido.
- [ ] Quando o codigoCurso informado não existir, então a API retorna 404 com mensagem indicando curso não encontrado.
- [ ] Quando cpf ou email já estiverem cadastrados, então a API retorna 409 com mensagem de conflito.
- [ ] Quando o usuário for criado com aprovacaoPendente=true, então ele não deve conseguir autenticar-se até ser aprovado pela diretoria.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 404, 409
- Campos: `cpf`, `codigoCurso`, `nome`, `email`, `senha`, `aprovacaoPendente`
- Precisa de esclarecimento: sim — Falta definir o formato exato das mensagens de erro para cada caso (400/404/409), regras de validação de nome/email (tamanho, formato) e se o campo aprovacaoPendente é retornado diretamente ou dentro de um objeto de status.

**Rastreabilidade:** REQ-205 (ver requirements.json)

---

### [Sprint 5] Validar formato de CPF no registro de não-estudante
<!-- sdd-bot:meta id="BL-125" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-206" dependsOn="REQ-205" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-205

**Descrição:**
Adicionar validação de CPF (formato e dígitos verificadores) no fluxo do endpoint POST /auth/register/nao-estudante, executada antes da persistência do usuário, retornando erro quando o CPF não passar na validação.

**Comportamento esperado:**
Ao enviar um CPF com formato ou dígitos verificadores inválidos, a API retorna 400 com mensagem específica indicando CPF inválido, sem criar o usuário.

**Critérios de aceite:**
- [ ] Quando o CPF informado tiver dígitos verificadores inválidos, então a API retorna 400 com mensagem indicando 'CPF inválido'.
- [ ] Quando o CPF informado tiver formato inválido (quantidade de dígitos diferente de 11 ou caracteres não numéricos após limpeza), então a API retorna 400.
- [ ] Quando o CPF informado for válido, então a validação não bloqueia o fluxo de criação do usuário no endpoint POST /auth/register/nao-estudante.
- [ ] Quando a validação de CPF falhar, então nenhum registro deve ser persistido na base de dados.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `cpf`
- Limites: 11 dígitos
- Precisa de esclarecimento: sim — Não foi especificado o texto exato da mensagem de erro nem se a validação deve rejeitar CPFs com todos os dígitos iguais (ex: 111.111.111-11), caso comum de validação de dígito verificador.

**Rastreabilidade:** REQ-206 (ver requirements.json)

---

### [Sprint 5] Validar existência do código do curso no registro
<!-- sdd-bot:meta id="BL-126" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-207" dependsOn="REQ-205" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-205

**Descrição:**
Adicionar verificação de existência do codigoCurso informado no endpoint POST /auth/register/nao-estudante, consultando a tabela/serviço de cursos antes da persistência do usuário, retornando erro quando o código não for encontrado.

**Comportamento esperado:**
Ao enviar um codigoCurso que não exista na base de cursos, a API retorna 404 com mensagem específica indicando curso não encontrado, sem criar o usuário.

**Critérios de aceite:**
- [ ] Quando o codigoCurso informado não existir na tabela de cursos, então a API retorna 404 com mensagem indicando 'Curso não encontrado'.
- [ ] Quando o codigoCurso informado existir, então a validação não bloqueia o fluxo de criação do usuário no endpoint POST /auth/register/nao-estudante.
- [ ] Quando a validação de curso falhar, então nenhum registro de usuário deve ser persistido na base de dados.
- [ ] Quando o codigoCurso estiver ausente ou vazio, então a API retorna 400 em vez de 404, diferenciando ausência de valor inválido.

**Especificidade técnica:**
- Códigos HTTP: 404, 400
- Campos: `codigoCurso`
- Precisa de esclarecimento: sim — Não foi especificado o texto exato da mensagem de erro nem se a comparação de codigoCurso deve ser case-sensitive ou considerar cursos inativos/desativados como inválidos.

**Rastreabilidade:** REQ-207 (ver requirements.json)

---

### [Sprint 5] Criar endpoint de confirmação de e-mail via OTP
<!-- sdd-bot:meta id="BL-127" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-208" dependsOn="REQ-204,REQ-205" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-204, REQ-205

**Descrição:**
Implementar endpoint POST /auth/confirmar-email que recebe no corpo da requisição os campos usuarioId e codigoOtp, consulta o registro de OTP vinculado ao usuário (gerado conforme REQ-204/REQ-205), compara o código informado com o armazenado (considerando expiração) e atualiza o campo de e-mail confirmado do usuário quando válido.

**Comportamento esperado:**
Ao enviar usuarioId e codigoOtp válidos e dentro do prazo de expiração, a API retorna 200 com confirmação do e-mail; ao enviar código inválido, expirado ou usuarioId inexistente, a API retorna 400 com mensagem de erro específica.

**Critérios de aceite:**
- [ ] Quando usuarioId e codigoOtp corretos e não expirados são enviados, então a resposta é 200 com corpo { "emailConfirmado": true }.
- [ ] Quando codigoOtp não corresponde ao registrado para o usuarioId, então a resposta é 400 com { "erro": "OTP_INVALIDO" }.
- [ ] Quando o codigoOtp está expirado (fora da janela definida em REQ-204/REQ-205), então a resposta é 400 com { "erro": "OTP_EXPIRADO" }.
- [ ] Quando usuarioId não existe na base, então a resposta é 400 com { "erro": "USUARIO_NAO_ENCONTRADO" }.
- [ ] Quando usuarioId ou codigoOtp estão ausentes no corpo da requisição, então a resposta é 400 com { "erro": "CAMPO_OBRIGATORIO_AUSENTE" }.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `usuarioId`, `codigoOtp`, `emailConfirmado`, `erro`
- Precisa de esclarecimento: sim — O tempo de expiração do OTP não foi especificado neste requisito nem confirmado nas dependências (REQ-204/REQ-205); definir o valor exato em minutos antes da implementação.

**Rastreabilidade:** REQ-208 (ver requirements.json)

---

### [Sprint 5] Validar formato de CPF via CpfVerificationService
<!-- sdd-bot:meta id="BL-128" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-288" dependsOn="REQ-205" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-205

**Descrição:**
Implementar no backend a validação de formato do CPF através do CpfVerificationService, aplicando checagem de máscara/dígitos (11 dígitos numéricos e validação dos dígitos verificadores conforme algoritmo padrão de CPF) antes de prosseguir com o fluxo de cadastro/verificação que depende de REQ-205.

**Comportamento esperado:**
Ao receber um CPF com formato e dígitos verificadores válidos, o serviço retorna sucesso na validação; ao receber um CPF com formato inválido, o serviço rejeita a entrada informando o motivo.

**Critérios de aceite:**
- [ ] Quando o CPF possui 11 dígitos numéricos e dígitos verificadores válidos, então CpfVerificationService.validar() retorna true.
- [ ] Quando o CPF possui menos ou mais de 11 dígitos, então o serviço retorna false com erro "CPF_FORMATO_INVALIDO".
- [ ] Quando o CPF contém caracteres não numéricos além de pontuação padrão (ex.: letras), então o serviço retorna false com erro "CPF_FORMATO_INVALIDO".
- [ ] Quando os dígitos verificadores do CPF não conferem com o algoritmo de validação, então o serviço retorna false com erro "CPF_DIGITO_VERIFICADOR_INVALIDO".
- [ ] Quando o CPF é composto por todos os dígitos iguais (ex.: 111.111.111-11), então o serviço retorna false com erro "CPF_FORMATO_INVALIDO".

**Especificidade técnica:**
- Campos: `cpf`
- Limites: 11 dígitos
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-288 (ver requirements.json)

---

### [Sprint 5] Validar OTP e marcar CPF como verificado
<!-- sdd-bot:meta id="BL-129" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-295" dependsOn="REQ-208" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-208

**Descrição:**
Implementar lógica de validação do código OTP associado à verificação de CPF (fluxo dependente de REQ-208), comparando o código informado com o registrado e, em caso de correspondência dentro do prazo de expiração, atualizar o campo cpfVerificado do usuário para true na base de dados.

**Comportamento esperado:**
Ao informar o OTP correto dentro do prazo, o campo cpfVerificado do usuário passa a ser true; ao informar OTP incorreto ou expirado, o campo cpfVerificado permanece false e a operação é rejeitada.

**Critérios de aceite:**
- [ ] Quando o OTP informado corresponde ao registrado e está dentro do prazo de validade, então cpfVerificado é atualizado para true e a operação retorna sucesso.
- [ ] Quando o OTP informado não corresponde ao registrado, então cpfVerificado permanece false e a operação retorna erro "OTP_INVALIDO".
- [ ] Quando o OTP informado está expirado, então cpfVerificado permanece false e a operação retorna erro "OTP_EXPIRADO".
- [ ] Quando o usuário já possui cpfVerificado igual a true, então uma nova tentativa de validação retorna erro "CPF_JA_VERIFICADO" sem alterar o registro.

**Especificidade técnica:**
- Campos: `cpfVerificado`, `codigoOtp`
- Precisa de esclarecimento: sim — O tempo de expiração do OTP e o número máximo de tentativas permitidas não foram especificados; definir esses valores antes da implementação.

**Rastreabilidade:** REQ-295 (ver requirements.json)

---

### [Sprint 5] Listar cadastros pendentes de aprovação por diretoria
<!-- sdd-bot:meta id="BL-130" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-296" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint GET /diretorias/:id/aprovacoes-pendentes que consulta os cadastros de usuários não-estudantes vinculados à diretoria informada e ainda não aprovados/ativados, retornando a lista em formato JSON.

**Comportamento esperado:**
Ao consultar o endpoint com o id de uma diretoria existente, a API retorna 200 com a lista de cadastros pendentes daquela diretoria; ao consultar com id inexistente, a API retorna 404.

**Critérios de aceite:**
- [ ] Quando o id da diretoria existe e possui cadastros pendentes, então a resposta é 200 com um array de objetos contendo ao menos usuarioId, nome e dataCadastro.
- [ ] Quando o id da diretoria existe mas não possui cadastros pendentes, então a resposta é 200 com um array vazio [].
- [ ] Quando o id da diretoria não existe na base, então a resposta é 404 com { "erro": "DIRETORIA_NAO_ENCONTRADA" }.
- [ ] Quando o parâmetro :id não é um identificador válido (formato incorreto), então a resposta é 400 com { "erro": "ID_INVALIDO" }.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 404
- Campos: `id`, `usuarioId`, `nome`, `dataCadastro`
- Precisa de esclarecimento: sim — O formato exato de identificação de diretoria (UUID, numérico) e os campos completos retornados na listagem não foram especificados no requisito.

**Rastreabilidade:** REQ-296 (ver requirements.json)

---

### [Sprint 5] Criar endpoint de aprovação de cadastro pendente
<!-- sdd-bot:meta id="BL-131" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-298" dependsOn="REQ-296" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-296

**Descrição:**
Implementar rota POST /diretorias/:id/aprovacoes/:usuarioId/aprovar no backend. O handler deve validar que o :id corresponde a uma diretoria existente e que :usuarioId possui um registro de aprovação pendente vinculado a essa diretoria, verificar que o usuário autenticado pertence à diretoria e possui permissão de aprovação, e então acionar a atualização de status do cadastro (delegando a ativação conforme REQ-299). A operação deve ser idempotente em relação a tentativas concorrentes, retornando conflito se já aprovado.

**Comportamento esperado:**
Ao chamar o endpoint com credenciais válidas de diretoria e um usuarioId pendente, a API retorna 200 com o payload do usuário atualizado (status: 'ativo'). Chamadas subsequentes ao mesmo endpoint para o mesmo usuário retornam 409.

**Critérios de aceite:**
- [ ] Quando um usuário da diretoria com permissão de aprovação chama POST /diretorias/:id/aprovacoes/:usuarioId/aprovar para um cadastro pendente existente, então a API retorna 200 com o campo status do usuário igual a 'ativo'.
- [ ] Quando :id não corresponde a nenhuma diretoria cadastrada, então a API retorna 404 com mensagem 'Diretoria não encontrada'.
- [ ] Quando :usuarioId não possui aprovação pendente para a diretoria informada, então a API retorna 404 com mensagem 'Aprovação pendente não encontrada'.
- [ ] Quando o usuário autenticado não pertence à diretoria informada em :id ou não possui permissão de aprovação, então a API retorna 403 com mensagem 'Permissão insuficiente'.
- [ ] Quando o cadastro referenciado por :usuarioId já foi aprovado anteriormente, então a API retorna 409 com mensagem 'Cadastro já aprovado'.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404, 409
- Campos: `/diretorias/:id/aprovacoes/:usuarioId/aprovar`, `status`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-298 (ver requirements.json)

---

### [Sprint 5] Ativar usuário e remover flag de aprovação pendente
<!-- sdd-bot:meta id="BL-132" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-299" dependsOn="REQ-298" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-298

**Descrição:**
Implementar a lógica de persistência acionada pela aprovação (REQ-298) que atualiza o registro do usuário na tabela usuarios, alterando o campo de status/ativo para true e removendo/limpando o registro ou flag correspondente em aprovacoes_pendentes (ex.: exclusão da linha ou campo aprovado_em preenchido). A operação deve ocorrer em transação única para garantir consistência entre as duas tabelas.

**Comportamento esperado:**
Após a execução, o registro do usuário em usuarios apresenta ativo=true e não há mais entrada correspondente (ou está marcada como resolvida) na tabela/flag de aprovações pendentes para esse usuário.

**Critérios de aceite:**
- [ ] Quando a transação de ativação é executada para um usuarioId com aprovação pendente, então o campo ativo do usuário é persistido como true no banco.
- [ ] Quando a transação de ativação é executada, então o registro correspondente em aprovacoes_pendentes é removido ou marcado com aprovado_em preenchido, deixando de aparecer em consultas de pendências.
- [ ] Quando ocorre falha ao atualizar qualquer uma das duas tabelas dentro da transação, então nenhuma alteração é persistida (rollback completo) e o status permanece pendente.
- [ ] Quando a operação é chamada para um usuarioId que já está ativo, então nenhuma alteração adicional é feita e a operação retorna indicação de estado já ativo sem duplicar registros.

**Especificidade técnica:**
- Campos: `usuarios.ativo`, `aprovacoes_pendentes.aprovado_em`
- Precisa de esclarecimento: sim — Não está definido se a remoção da pendência é feita por DELETE físico na tabela aprovacoes_pendentes ou por soft-delete via campo aprovado_em/status; decisão de modelagem pendente.

**Rastreabilidade:** REQ-299 (ver requirements.json)

---

### [Sprint 5] Restringir acesso à AprovacoesPage por permissão de diretoria
<!-- sdd-bot:meta id="BL-133" epic="Troubleshooting" layer="backend" requirementIds="REQ-363" dependsOn="REQ-361" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-361

**Descrição:**
Adicionar verificação de autorização no endpoint/rota que alimenta a AprovacoesPage (ex.: GET /diretorias/:id/aprovacoes), validando via middleware que o usuário autenticado possui vínculo ativo com a diretoria :id e a permissão específica de aprovação (ex.: papel/role com flag pode_aprovar). A verificação deve ocorrer antes de qualquer consulta aos dados de aprovações pendentes.

**Comportamento esperado:**
Usuários da diretoria com a permissão adequada conseguem carregar a AprovacoesPage e visualizar a lista de pendências; usuários sem vínculo ou sem permissão são bloqueados com resposta 403 e a página exibe mensagem de acesso negado.

**Critérios de aceite:**
- [ ] Quando um usuário com vínculo ativo na diretoria e permissão pode_aprovar acessa GET /diretorias/:id/aprovacoes, então a API retorna 200 com a lista de aprovações pendentes.
- [ ] Quando um usuário sem vínculo com a diretoria :id acessa o endpoint, então a API retorna 403 com mensagem 'Acesso não autorizado a esta diretoria'.
- [ ] Quando um usuário possui vínculo com a diretoria mas não tem a permissão pode_aprovar, então a API retorna 403 com mensagem 'Permissão insuficiente para aprovações'.
- [ ] Quando a requisição não contém token de autenticação válido, então a API retorna 401 antes de qualquer verificação de permissão.
- [ ] Quando o frontend recebe 403 da API, então a AprovacoesPage exibe mensagem de acesso negado em vez de renderizar a lista.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `/diretorias/:id/aprovacoes`, `pode_aprovar`
- Precisa de esclarecimento: sim — Não está especificado o nome exato do papel/permissão que autoriza aprovação (ex.: role admin vs. flag pode_aprovar) nem se múltiplos papéis podem ter esse acesso; decisão de modelo de permissões pendente.

**Rastreabilidade:** REQ-363 (ver requirements.json)

---

### [Sprint 6] Restringir gestão de usuários/produtos/eventos por atlética
<!-- sdd-bot:meta id="BL-134" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-2" dependsOn="REQ-1" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-1

**Descrição:**
Implementar controle de autorização por escopo de diretoria (atlética) nos endpoints de CRUD de usuários, produtos e eventos, restringindo que um admin de diretoria só opere sobre registros vinculados à sua própria atlética. Adicionar middleware/guard que valida, a partir do vínculo do usuário autenticado com a diretoria (UsuarioDiretoria) e do campo diretoriaId presente nas entidades Usuario, Produto e Evento, se o admin possui permissão de acesso ao recurso solicitado antes de permitir a operação.

**Comportamento esperado:**
Um admin autenticado consegue criar, listar, editar e excluir usuários, produtos e eventos apenas da diretoria à qual está vinculado como admin; tentativas de operar sobre recursos de outra diretoria são bloqueadas.

**Critérios de aceite:**
- [ ] Quando um admin da diretoria A cria um produto/evento/usuário, então o registro é salvo com diretoriaId igual ao da diretoria A.
- [ ] Quando um admin da diretoria A tenta editar (PUT/PATCH) um recurso com diretoriaId da diretoria B, então a API retorna 403 Forbidden com mensagem 'Acesso negado ao recurso de outra diretoria'.
- [ ] Quando um admin da diretoria A lista usuários/produtos/eventos (GET), então a resposta contém apenas registros com diretoriaId igual ao da diretoria A.
- [ ] Quando um usuário sem vínculo de admin em nenhuma diretoria tenta acessar qualquer endpoint de gestão, então a API retorna 403 Forbidden.
- [ ] Quando um admin da diretoria A tenta excluir (DELETE) um recurso de diretoriaId da diretoria B, então a API retorna 403 Forbidden e o recurso não é removido.

**Especificidade técnica:**
- Códigos HTTP: 200, 403
- Campos: `diretoriaId`, `UsuarioDiretoria`
- Precisa de esclarecimento: sim — Não está definido se o papel de 'admin' é um enum específico na tabela UsuarioDiretoria (ex.: role='ADMIN') nem quais endpoints exatos (rotas) de usuários/produtos/eventos serão cobertos pelo guard.

**Rastreabilidade:** REQ-2 (ver requirements.json)

---

### [Sprint 6] Aplicar desconto percentual por atlética para sócios no checkout
<!-- sdd-bot:meta id="BL-135" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-5" dependsOn="REQ-1" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-1

**Descrição:**
Adicionar campo de percentual de desconto configurável na entidade Diretoria (ex.: descontoSocio) e implementar lógica no serviço de checkout/carrinho que, ao calcular o valor final da compra, verifica se o usuário é sócio da atlética vinculada ao produto/evento e aplica o percentual de desconto correspondente sobre o subtotal antes de gerar o total a pagar.

**Comportamento esperado:**
No fechamento do pedido, o valor exibido e cobrado do usuário sócio reflete automaticamente o desconto percentual configurado pela diretoria, sem intervenção manual do usuário.

**Critérios de aceite:**
- [ ] Quando um usuário sócio de uma diretoria com descontoSocio=10 finaliza a compra de um produto dessa diretoria, então o total é calculado como subtotal * (1 - 0.10).
- [ ] Quando um usuário não sócio compra o mesmo produto, então nenhum desconto é aplicado e o total é igual ao subtotal.
- [ ] Quando a diretoria não possui descontoSocio configurado (valor nulo ou 0), então o checkout prossegue sem aplicar desconto.
- [ ] Quando o percentual de desconto configurado é inválido (menor que 0 ou maior que 100), então a API retorna 400 Bad Request ao tentar salvar a configuração da diretoria.
- [ ] Quando um sócio compra itens de múltiplas diretorias no mesmo carrinho, então o desconto de cada diretoria é aplicado apenas aos itens correspondentes a ela.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `descontoSocio`, `diretoriaId`
- Limites: percentual entre 0 e 100
- Precisa de esclarecimento: sim — Não está especificado como o sistema determina se um usuário é 'sócio' (tabela/flag de associação) nem o nome exato do campo de desconto e do endpoint de configuração da diretoria.

**Rastreabilidade:** REQ-5 (ver requirements.json)

---

### [Sprint 6] Buscar diretorias associadas a um usuário no UsuarioDiretoriaService
<!-- sdd-bot:meta id="BL-136" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-162" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar método no UsuarioDiretoriaService que realiza consulta na tabela de associação UsuarioDiretoria filtrando por usuarioId e retorna a lista de diretorias (join com a tabela Diretoria) vinculadas a esse usuário, incluindo dados básicos de cada diretoria.

**Comportamento esperado:**
Ao invocar o método do service com um usuarioId válido, é retornada uma lista contendo todas as diretorias às quais o usuário está associado.

**Critérios de aceite:**
- [ ] Quando o usuarioId informado possui vínculo com 2 ou mais diretorias, então o método retorna um array com todas elas.
- [ ] Quando o usuarioId informado não possui nenhum vínculo, então o método retorna um array vazio [].
- [ ] Quando o usuarioId informado não existe na base, então o método retorna um array vazio [] sem lançar exceção.
- [ ] Quando o usuarioId informado é nulo ou inválido (não numérico/UUID), então o método lança uma exceção de validação com mensagem 'usuarioId inválido'.

**Especificidade técnica:**
- Campos: `usuarioId`, `UsuarioDiretoria`, `Diretoria`
- Precisa de esclarecimento: sim — Não está definido o tipo exato do identificador de usuário (UUID ou numérico) nem os campos específicos da diretoria que devem compor o retorno (DTO).

**Rastreabilidade:** REQ-162 (ver requirements.json)

---

### [Sprint 6] Criar endpoint GET /atletica para listar diretorias do usuário
<!-- sdd-bot:meta id="BL-137" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-209" dependsOn="REQ-202" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-202

**Descrição:**
Criar rota GET /atletica protegida por autenticação (middleware/guard de token) que extrai o usuarioId do contexto da requisição autenticada e delega a consulta ao UsuarioDiretoriaService (REQ-162), retornando a lista de diretorias vinculadas em formato JSON.

**Comportamento esperado:**
Um cliente autenticado que faz GET /atletica recebe a lista de diretorias associadas ao próprio usuário logado.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado com vínculo a diretorias faz GET /atletica, então a API retorna 200 com um array JSON contendo as diretorias.
- [ ] Quando um usuário autenticado sem nenhum vínculo faz GET /atletica, então a API retorna 200 com um array vazio [].
- [ ] Quando a requisição é feita sem token de autenticação ou com token inválido, então a API retorna 401 Unauthorized.
- [ ] Quando o token é válido mas expirado, então a API retorna 401 Unauthorized com mensagem de token expirado.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `/atletica`
- Precisa de esclarecimento: sim — Não está especificado o formato exato do payload de resposta (campos da diretoria retornados) nem o mecanismo de autenticação utilizado (JWT, sessão, etc.).

**Rastreabilidade:** REQ-209 (ver requirements.json)

---

### [Sprint 6] Criar endpoint POST /atletica para vincular diretoria
<!-- sdd-bot:meta id="BL-138" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-210" dependsOn="REQ-202" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-202

**Descrição:**
Implementar endpoint POST /atletica, protegido por autenticação, que recebe no corpo o campo codigoCurso, localiza a diretoria correspondente e cria o vínculo entre o usuário autenticado e essa diretoria na tabela de relacionamento usuário-diretoria.

**Comportamento esperado:**
Ao enviar um codigoCurso válido de uma diretoria à qual o usuário ainda não está vinculado, o vínculo é criado e a API responde 201 com os dados da diretoria vinculada.

**Critérios de aceite:**
- [ ] Quando o usuário autenticado envia POST /atletica com codigoCurso válido e ainda não vinculado, então o sistema cria o vínculo e retorna 201 com os dados da diretoria.
- [ ] Quando o codigoCurso informado não corresponde a nenhuma diretoria cadastrada, então o sistema retorna 404.
- [ ] Quando o usuário já possui vínculo ativo com a diretoria do codigoCurso informado, então o sistema retorna 409 sem duplicar o registro.
- [ ] Quando a requisição não possui token de autenticação válido, então o sistema retorna 401.

**Especificidade técnica:**
- Códigos HTTP: 201, 401, 404, 409
- Campos: `codigoCurso`, `POST /atletica`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-210 (ver requirements.json)

---

### [Sprint 6] Criar endpoint DELETE /atletica/:diretoriaId para desvincular
<!-- sdd-bot:meta id="BL-139" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-211" dependsOn="REQ-202" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-202

**Descrição:**
Implementar endpoint DELETE /atletica/:diretoriaId, protegido por autenticação, que remove da tabela de relacionamento usuário-diretoria o registro que associa o usuário autenticado ao diretoriaId informado no path.

**Comportamento esperado:**
Ao informar um diretoriaId de vínculo existente do usuário, o registro é removido e a API responde 200 confirmando a remoção.

**Critérios de aceite:**
- [ ] Quando o usuário autenticado envia DELETE /atletica/:diretoriaId com um vínculo existente, então o sistema remove o registro e retorna 200.
- [ ] Quando o diretoriaId informado não corresponde a nenhum vínculo do usuário, então o sistema retorna 404.
- [ ] Quando o diretoriaId informado é inválido (formato incorreto, ex.: não numérico/UUID malformado), então o sistema retorna 400.
- [ ] Quando a requisição não possui token de autenticação válido, então o sistema retorna 401.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 401, 404
- Campos: `diretoriaId`, `DELETE /atletica/:diretoriaId`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-211 (ver requirements.json)

---

### [Sprint 6] Criar endpoint PUT /atletica/ativa/:diretoriaId
<!-- sdd-bot:meta id="BL-140" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-212" dependsOn="REQ-202" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-202

**Descrição:**
Implementar endpoint PUT /atletica/ativa/:diretoriaId, protegido por autenticação, que atualiza o campo de diretoria ativa do usuário autenticado (ex.: usuario.diretoriaAtivaId) para o diretoriaId informado, validando que o usuário possui vínculo com essa diretoria antes de efetuar a troca.

**Comportamento esperado:**
Ao informar um diretoriaId ao qual o usuário está vinculado, a diretoria ativa do usuário é atualizada e a API responde 200 confirmando a nova diretoria ativa.

**Critérios de aceite:**
- [ ] Quando o usuário autenticado envia PUT /atletica/ativa/:diretoriaId para uma diretoria à qual está vinculado, então o sistema atualiza a diretoria ativa e retorna 200.
- [ ] Quando o usuário tenta definir como ativa uma diretoria à qual não está vinculado, então o sistema retorna 403.
- [ ] Quando o diretoriaId informado não existe, então o sistema retorna 404.
- [ ] Quando a requisição não possui token de autenticação válido, então o sistema retorna 401.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403, 404
- Campos: `diretoriaId`, `PUT /atletica/ativa/:diretoriaId`, `diretoriaAtivaId`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-212 (ver requirements.json)

---

### [Sprint 6] Criar endpoint GET /diretorias restrito a admin
<!-- sdd-bot:meta id="BL-141" epic="Introdução (parte 6)" layer="backend" requirementIds="REQ-213" dependsOn="REQ-202" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-202

**Descrição:**
Implementar endpoint GET /diretorias, protegido por autenticação e middleware de autorização que restringe o acesso a usuários com papel/role de administrador, retornando a lista completa de registros da tabela de diretorias.

**Comportamento esperado:**
Ao ser chamado por um usuário administrador autenticado, o endpoint responde 200 com a lista de todas as diretorias cadastradas.

**Critérios de aceite:**
- [ ] Quando um usuário administrador autenticado chama GET /diretorias, então o sistema retorna 200 com um array contendo todas as diretorias cadastradas.
- [ ] Quando um usuário autenticado sem papel de administrador chama GET /diretorias, então o sistema retorna 403.
- [ ] Quando a requisição não possui token de autenticação válido, então o sistema retorna 401.
- [ ] Quando não há diretorias cadastradas, então o sistema retorna 200 com um array vazio.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `GET /diretorias`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-213 (ver requirements.json)

---

### [Sprint 6] Criar endpoint POST /diretorias para cadastro
<!-- sdd-bot:meta id="BL-142" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-214" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /diretorias no backend, protegido por autenticação (middleware de auth exigindo token válido). O payload deve conter os campos nome (string), email (string), codigoCurso (string) e desconto (number), persistindo um novo registro na tabela/coleção diretorias.

**Comportamento esperado:**
Ao enviar uma requisição autenticada com nome, email, codigoCurso e desconto válidos, o sistema cria a diretoria e retorna 201 com o objeto criado, incluindo o id gerado.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado envia POST /diretorias com nome, email, codigoCurso e desconto válidos, então o sistema retorna 201 com o registro criado contendo id, nome, email, codigoCurso e desconto.
- [ ] Quando a requisição não possui token de autenticação, então o sistema retorna 401.
- [ ] Quando algum campo obrigatório (nome, email, codigoCurso ou desconto) está ausente, então o sistema retorna 400 com mensagem de erro indicando o campo faltante.
- [ ] Quando o campo email não está em formato válido, então o sistema retorna 400 com mensagem de erro de validação.
- [ ] Quando o campo desconto é enviado como valor negativo, então o sistema retorna 400 com mensagem de erro de validação.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 401
- Campos: `nome`, `email`, `codigoCurso`, `desconto`
- Precisa de esclarecimento: sim — Não há definição do range válido para o campo desconto (ex.: 0 a 100%) nem se é percentual ou valor fixo; necessário confirmar com o time de produto/SDD.

**Rastreabilidade:** REQ-214 (ver requirements.json)

---

### [Sprint 6] Retornar 409 ao criar diretoria com código de curso repetido
<!-- sdd-bot:meta id="BL-143" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-215" dependsOn="REQ-214" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-214

**Descrição:**
Adicionar validação no endpoint POST /diretorias que verifica, antes da persistência, se já existe um registro na tabela diretorias com o mesmo valor de codigoCurso (comparação exata, considerando unicidade no banco via constraint ou query prévia).

**Comportamento esperado:**
Ao tentar criar uma diretoria com um codigoCurso já cadastrado em outro registro, o sistema rejeita a criação e retorna 409 com mensagem informando o conflito.

**Critérios de aceite:**
- [ ] Quando o codigoCurso enviado já existe em outra diretoria cadastrada, então o sistema retorna 409 com mensagem de erro indicando "codigoCurso já cadastrado".
- [ ] Quando o codigoCurso enviado é inédito no sistema, então a diretoria é criada normalmente com status 201.
- [ ] Quando duas requisições concorrentes tentam criar diretorias com o mesmo codigoCurso, então apenas uma delas é persistida e a outra recebe 409 (garantido por constraint única no banco).

**Especificidade técnica:**
- Códigos HTTP: 409, 201
- Campos: `codigoCurso`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-215 (ver requirements.json)

---

### [Sprint 6] Atualizar parcialmente diretoria via PATCH /diretorias/:id
<!-- sdd-bot:meta id="BL-144" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-216" dependsOn="REQ-214" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-214

**Descrição:**
Implementar endpoint PATCH /diretorias/:id, protegido por autenticação, que busca a diretoria pelo id na tabela diretorias e atualiza somente os campos enviados no corpo da requisição (nome, email, codigoCurso e/ou desconto), sem exigir o payload completo.

**Comportamento esperado:**
Ao enviar um PATCH autenticado com um ou mais campos válidos para um id existente, o sistema atualiza apenas os campos informados e retorna 200 com o objeto atualizado.

**Critérios de aceite:**
- [ ] Quando o id informado corresponde a uma diretoria existente e o body contém apenas o campo desconto, então somente esse campo é atualizado e os demais permanecem inalterados, retornando 200.
- [ ] Quando o id informado não existe na base, então o sistema retorna 404 com mensagem de erro indicando diretoria não encontrada.
- [ ] Quando a requisição não possui token de autenticação, então o sistema retorna 401.
- [ ] Quando o body enviado contém um codigoCurso já usado por outra diretoria, então o sistema retorna 409, mantendo a consistência da regra do REQ-215.
- [ ] Quando o body enviado está vazio ou contém apenas campos inválidos, então o sistema retorna 400.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 401, 404, 409
- Campos: `nome`, `email`, `codigoCurso`, `desconto`, `id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-216 (ver requirements.json)

---

### [Sprint 6] Excluir diretoria via DELETE /diretorias/:id
<!-- sdd-bot:meta id="BL-145" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-217" dependsOn="REQ-214" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-214

**Descrição:**
Implementar endpoint DELETE /diretorias/:id, protegido por autenticação, que remove o registro da tabela diretorias após verificar existência do id e ausência de usuários vinculados (checagem de integridade referencial na tabela/relacionamento usuarios-diretoria).

**Comportamento esperado:**
Ao solicitar exclusão de uma diretoria existente e sem usuários associados, o sistema remove o registro e retorna 204 sem corpo de resposta.

**Critérios de aceite:**
- [ ] Quando o id informado corresponde a uma diretoria existente sem usuários vinculados, então o sistema exclui o registro e retorna 204.
- [ ] Quando o id informado não existe na base, então o sistema retorna 404 com mensagem de erro indicando diretoria não encontrada.
- [ ] Quando a diretoria possui um ou mais usuários associados, então o sistema retorna 409 com mensagem de erro indicando que há usuários vinculados.
- [ ] Quando a requisição não possui token de autenticação, então o sistema retorna 401.

**Especificidade técnica:**
- Códigos HTTP: 204, 401, 404, 409
- Campos: `id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-217 (ver requirements.json)

---

### [Sprint 6] Validar vínculo do usuário à diretoria antes da troca
<!-- sdd-bot:meta id="BL-146" epic="9.2 Fluxo de Trocar Atletica" layer="backend" requirementIds="REQ-268" dependsOn="REQ-212" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-212

**Descrição:**
Implementar validação no endpoint de troca de atlética ativa (ex.: PATCH /users/me/diretoria-ativa) que verifica se o id da diretoria destino enviado no payload está presente na coleção user.directorias associada ao usuário autenticado, antes de permitir qualquer alteração de estado.

**Comportamento esperado:**
Quando a diretoria destino não está em user.directorias, a API retorna HTTP 403 com mensagem de erro 'Usuário não vinculado a esta diretoria' e nenhuma alteração é persistida.

**Critérios de aceite:**
- [ ] Quando o usuário solicita troca para uma diretoria presente em user.directorias, então a validação passa e o fluxo prossegue para atualização do estado.
- [ ] Quando o usuário solicita troca para uma diretoria ausente em user.directorias, então a API retorna HTTP 403 com mensagem 'Usuário não vinculado a esta diretoria'.
- [ ] Quando o campo diretoria_id não é enviado no payload, então a API retorna HTTP 400 com mensagem 'diretoria_id é obrigatório'.
- [ ] Quando o id da diretoria destino não existe na tabela de diretorias, então a API retorna HTTP 404 com mensagem 'Diretoria não encontrada'.

**Especificidade técnica:**
- Códigos HTTP: 400, 403, 404
- Campos: `diretoria_id`, `user.directorias`
- Precisa de esclarecimento: sim — O nome exato do endpoint e o formato do payload de troca de atlética ativa não foram especificados no requisito nem na dependência REQ-212 referenciada.

**Rastreabilidade:** REQ-268 (ver requirements.json)

---

### [Sprint 6] Persistir diretoria ativa selecionada no registro do usuário
<!-- sdd-bot:meta id="BL-147" epic="9.2 Fluxo de Trocar Atletica" layer="backend" requirementIds="REQ-269" dependsOn="REQ-268" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-268

**Descrição:**
Após validação bem-sucedida do vínculo (REQ-268), implementar a atualização do campo diretoria_id na tabela users, persistindo a nova diretoria ativa em uma operação transacional que só é executada se a validação prévia for aprovada.

**Comportamento esperado:**
Quando a atualização é concluída, o campo diretoria_id do usuário no banco passa a refletir o id da diretoria destino e a resposta da API retorna HTTP 200 com o objeto do usuário atualizado contendo o novo diretoria_id.

**Critérios de aceite:**
- [ ] Quando a validação de vínculo é aprovada, então o campo diretoria_id do usuário no banco é atualizado para o id da diretoria destino e a API retorna HTTP 200.
- [ ] Quando a atualização é persistida, então uma consulta subsequente ao registro do usuário retorna o novo valor de diretoria_id.
- [ ] Quando ocorre falha na escrita no banco (ex.: timeout de conexão), então a API retorna HTTP 500 e o campo diretoria_id permanece com o valor anterior.
- [ ] Quando a validação de vínculo do REQ-268 falha, então nenhuma atualização é executada no campo diretoria_id.

**Especificidade técnica:**
- Códigos HTTP: 200, 500
- Campos: `diretoria_id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-269 (ver requirements.json)

---

### [Sprint 6] Filtrar Dashboard, Loja e Eventos pela diretoria ativa
<!-- sdd-bot:meta id="BL-148" epic="9.2 Fluxo de Trocar Atletica" layer="backend" requirementIds="REQ-271" dependsOn="REQ-270,REQ-243" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-270, REQ-243

**Descrição:**
Adicionar cláusula de filtro por diretoria_id (obtido da diretoria ativa do usuário autenticado, conforme REQ-269) nas queries dos endpoints/serviços que alimentam Dashboard, Loja e Eventos, garantindo que apenas registros associados à diretoria ativa sejam retornados.

**Comportamento esperado:**
Quando o usuário consulta os endpoints de Dashboard, Loja ou Eventos, a resposta contém somente registros cujo diretoria_id corresponde à diretoria ativa atual do usuário, excluindo dados de outras diretorias às quais ele também esteja vinculado.

**Critérios de aceite:**
- [ ] Quando o usuário com diretoria ativa X consulta a Loja, então a resposta contém apenas produtos com diretoria_id = X.
- [ ] Quando o usuário com diretoria ativa X consulta Eventos, então a resposta contém apenas eventos com diretoria_id = X.
- [ ] Quando o usuário com diretoria ativa X consulta o Dashboard, então os dados agregados exibidos consideram somente registros com diretoria_id = X.
- [ ] Quando o usuário troca a diretoria ativa de X para Y, então consultas subsequentes a Dashboard, Loja e Eventos retornam apenas dados com diretoria_id = Y.
- [ ] Quando não há registros associados à diretoria ativa do usuário, então os endpoints retornam HTTP 200 com lista vazia, sem erro.

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `diretoria_id`
- Precisa de esclarecimento: sim — Os nomes exatos dos endpoints/serviços de Dashboard, Loja e Eventos (REQ-270, REQ-243) não foram detalhados, impedindo especificar rotas exatas a alterar.

**Rastreabilidade:** REQ-271 (ver requirements.json)

---

### [Sprint 6] Integrar cálculo de desconto ao PriceCalculationService no checkout
<!-- sdd-bot:meta id="BL-149" epic="Troubleshooting" layer="backend" requirementIds="REQ-358" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
No fluxo de checkout, invocar o PriceCalculationService passando os itens do carrinho e a diretoria ativa do usuário para que o serviço aplique o percentual/valor de desconto configurado para aquela diretoria sobre o preço base, retornando o preço final calculado.

**Comportamento esperado:**
Quando o checkout é processado, o preço final exibido e cobrado reflete o valor base menos o desconto configurado para a diretoria ativa do usuário, calculado pelo PriceCalculationService.

**Critérios de aceite:**
- [ ] Quando a diretoria ativa possui desconto configurado, então o PriceCalculationService retorna o preço final igual ao preço base menos o valor do desconto aplicado.
- [ ] Quando a diretoria ativa não possui desconto configurado, então o PriceCalculationService retorna o preço final igual ao preço base, sem alteração.
- [ ] Quando o percentual de desconto configurado é inválido (ex.: negativo ou maior que 100%), então o serviço retorna erro HTTP 422 com mensagem 'Configuração de desconto inválida' e não aplica o desconto.
- [ ] Quando o item do carrinho não possui preço base definido, então o serviço retorna HTTP 400 com mensagem 'Preço base ausente para o item'.

**Especificidade técnica:**
- Códigos HTTP: 400, 422
- Campos: `PriceCalculationService`, `preço base`, `desconto`
- Limites: percentual de desconto entre 0% e 100%
- Precisa de esclarecimento: sim — O requisito não especifica se o desconto é percentual ou valor fixo, nem onde/como é configurado por diretoria; assumido percentual para fins de limite, mas precisa confirmação.

**Rastreabilidade:** REQ-358 (ver requirements.json)

---

### [Sprint 6] Validar role do usuário antes de aplicar desconto
<!-- sdd-bot:meta id="BL-150" epic="Troubleshooting" layer="backend" requirementIds="REQ-359" dependsOn="REQ-358" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-358

**Descrição:**
Implementar verificação de autorização no serviço de checkout/inscrição que consulta a role do usuário autenticado (ex.: campo role na tabela usuarios ou claim do JWT) antes de acionar a lógica de cálculo de desconto por diretoria (REQ-358). A validação deve ocorrer no backend, no endpoint responsável pelo cálculo/aplicação do desconto, rejeitando a aplicação quando a role não estiver entre as permitidas (ex.: 'membro_diretoria', 'admin').

**Comportamento esperado:**
Quando o usuário possui role autorizada, o desconto configurado é aplicado ao valor final; quando a role não é autorizada, o sistema ignora o desconto e retorna o valor cheio ou erro conforme o fluxo.

**Critérios de aceite:**
- [ ] Quando um usuário com role 'membro_diretoria' realiza a compra, então o desconto configurado para sua diretoria é aplicado ao valor final.
- [ ] Quando um usuário com role sem permissão de desconto (ex.: 'convidado') tenta finalizar a compra, então a API retorna HTTP 403 com mensagem 'role_nao_autorizada_para_desconto' e o valor cheio é cobrado.
- [ ] Quando o token de autenticação não contém informação de role, então a API retorna HTTP 401 e nenhum desconto é aplicado.
- [ ] Quando a role do usuário é alterada após login mas antes da checkout, então a validação usa a role atual persistida no banco, não a do token expirado.

**Especificidade técnica:**
- Códigos HTTP: 401, 403
- Campos: `role`, `usuario_id`
- Precisa de esclarecimento: sim — Não há definição de quais roles específicas têm direito a desconto (lista fechada de valores permitidos) nem se a validação usa claim do JWT ou consulta direta ao banco.

**Rastreabilidade:** REQ-359 (ver requirements.json)

---

### [Sprint 6] Aplicar desconto configurado da diretoria no checkout
<!-- sdd-bot:meta id="BL-151" epic="Troubleshooting" layer="backend" requirementIds="REQ-360" dependsOn="REQ-358" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-358

**Descrição:**
Implementar no serviço de checkout/inscrição a leitura do percentual/valor de desconto configurado na entidade Diretoria (campo desconto associado à diretoria do usuário) e aplicá-lo sobre o valor total do pedido antes da confirmação do pagamento, integrando com a validação de role (REQ-359).

**Comportamento esperado:**
O valor final cobrado no checkout reflete o desconto da diretoria vinculada ao usuário, exibido separadamente do valor original na tela de confirmação.

**Critérios de aceite:**
- [ ] Quando o usuário pertence a uma diretoria com desconto de 10% configurado, então o valor final do pedido é calculado como valor_original - (valor_original * 0.10).
- [ ] Quando a diretoria do usuário não possui desconto configurado (campo desconto nulo ou zero), então o valor cobrado é igual ao valor original sem alteração.
- [ ] Quando o usuário não está vinculado a nenhuma diretoria, então nenhum desconto é aplicado e o pedido segue com valor integral.
- [ ] Quando o desconto aplicado resultaria em valor final negativo ou zero, então o sistema rejeita a operação com HTTP 400 e mensagem 'valor_final_invalido'.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `desconto`, `diretoria_id`, `valor_original`, `valor_final`
- Precisa de esclarecimento: sim — Não há definição do formato do desconto (percentual vs. valor fixo) nem do limite máximo permitido para configuração de desconto por diretoria.

**Rastreabilidade:** REQ-360 (ver requirements.json)

---

### [Sprint 6] Criar diretoria com código de curso via painel admin
<!-- sdd-bot:meta id="BL-152" epic="Operações Comuns" layer="backend" requirementIds="REQ-364" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /diretorias (ou equivalente) que recebe payload com nome, codigo_curso e demais atributos da diretoria, persiste na tabela diretorias validando unicidade do codigo_curso, e restringe a criação a usuários com role de administrador.

**Comportamento esperado:**
Ao submeter o formulário/requisição com dados válidos, uma nova diretoria é criada no banco e retornada com id gerado e status ativa.

**Critérios de aceite:**
- [ ] Quando um administrador envia POST /diretorias com nome e codigo_curso válidos e únicos, então a API retorna HTTP 201 com o objeto da diretoria criada incluindo id.
- [ ] Quando o codigo_curso informado já está associado a outra diretoria, então a API retorna HTTP 409 com mensagem 'codigo_curso_ja_cadastrado'.
- [ ] Quando o campo codigo_curso está ausente ou vazio no payload, então a API retorna HTTP 400 com mensagem 'codigo_curso_obrigatorio'.
- [ ] Quando um usuário sem role de administrador tenta criar a diretoria, então a API retorna HTTP 403.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 403, 409
- Campos: `nome`, `codigo_curso`, `id`, `ativa`
- Precisa de esclarecimento: sim — Não há definição do formato/tamanho esperado do codigo_curso (numérico, alfanumérico, quantidade de caracteres).

**Rastreabilidade:** REQ-364 (ver requirements.json)

---

### [Sprint 6] Validar código de curso antes de associar aluno à atlética
<!-- sdd-bot:meta id="BL-153" epic="Operações Comuns" layer="backend" requirementIds="REQ-366" dependsOn="REQ-364" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-364

**Descrição:**
Implementar validação no endpoint de associação de aluno à diretoria (ex.: POST /alunos/{id}/associar-diretoria) que consulta a tabela diretorias pelo campo codigo_curso informado pelo aluno, confirmando existência e status ativo antes de gravar o vínculo.

**Comportamento esperado:**
Quando o código informado corresponde a uma diretoria ativa, o aluno é vinculado a ela; quando não corresponde, a associação é bloqueada e o aluno recebe mensagem de erro.

**Critérios de aceite:**
- [ ] Quando o aluno informa um codigo_curso existente e vinculado a uma diretoria ativa, então o vínculo aluno-diretoria é criado com HTTP 200/201.
- [ ] Quando o codigo_curso informado não existe em nenhuma diretoria cadastrada, então a API retorna HTTP 404 com mensagem 'codigo_curso_nao_encontrado'.
- [ ] Quando o codigo_curso corresponde a uma diretoria desativada, então a API retorna HTTP 400 com mensagem 'diretoria_inativa' e a associação não é criada.
- [ ] Quando o campo codigo_curso é enviado vazio ou nulo, então a API retorna HTTP 400 com mensagem 'codigo_curso_obrigatorio'.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 404
- Campos: `codigo_curso`, `diretoria_id`, `ativa`, `aluno_id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-366 (ver requirements.json)

---

### [Sprint 6] Criar registro usuario_diretoria ao vincular aluno
<!-- sdd-bot:meta id="BL-154" epic="Operações Comuns" layer="backend" requirementIds="REQ-367" dependsOn="REQ-366" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-366

**Descrição:**
Implementar no serviço de vínculo aluno-atlética a criação de um registro na tabela usuario_diretoria (campos: usuario_id, diretoria_id, data_vinculo, status) no momento em que a associação entre usuário e atlética é confirmada, dentro da mesma transação da operação de associação.

**Comportamento esperado:**
Quando um aluno é associado a uma atlética, a tabela usuario_diretoria passa a conter um registro com usuario_id, diretoria_id preenchidos e status igual a 'ativo', consultável imediatamente após a operação.

**Critérios de aceite:**
- [ ] Quando um aluno é associado a uma atlética existente, então um registro é inserido em usuario_diretoria com usuario_id e diretoria_id correspondentes.
- [ ] Quando o registro é criado, então o campo data_vinculo é preenchido com a data/hora UTC da operação.
- [ ] Quando a associação falha por diretoria_id inexistente, então a API retorna HTTP 404 com mensagem 'Diretoria não encontrada' e nenhum registro é inserido.
- [ ] Quando já existe um vínculo ativo entre o mesmo usuario_id e diretoria_id, então a API retorna HTTP 409 com mensagem 'Vínculo já existente' e nenhum novo registro é criado.
- [ ] Quando a inserção em usuario_diretoria falha por erro de banco, então a transação da associação é revertida (rollback) e a API retorna HTTP 500.

**Especificidade técnica:**
- Códigos HTTP: 404, 409, 500
- Campos: `usuario_id`, `diretoria_id`, `data_vinculo`, `status`, `usuario_diretoria`
- Precisa de esclarecimento: sim — Não há definição de quais valores o campo status pode assumir além de 'ativo', nem do endpoint exato responsável pela associação (herdado de REQ-366).

**Rastreabilidade:** REQ-367 (ver requirements.json)

---

### [Sprint 6] Aplicar novo percentual de desconto em compras futuras
<!-- sdd-bot:meta id="BL-155" epic="Operações Comuns" layer="backend" requirementIds="REQ-369" dependsOn="REQ-368,REQ-358" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-368, REQ-358

**Descrição:**
Alterar o serviço de checkout/inscrição para ler o valor de desconto vigente diretamente da tabela diretorias (campo desconto_percentual) no momento do cálculo do preço final, em vez de usar valor cacheado ou snapshot anterior, garantindo que qualquer alteração feita via endpoint de atualização de diretoria (REQ-368) seja refletida sem necessidade de deploy ou reindexação.

**Comportamento esperado:**
Quando o desconto de uma diretoria é alterado de 10% para 20% e um usuário vinculado a essa diretoria realiza uma nova compra, o preço final exibido e cobrado no checkout reflete o desconto de 20%, sem afetar pedidos já finalizados anteriormente.

**Critérios de aceite:**
- [ ] Quando o campo desconto_percentual de uma diretoria é atualizado, então a próxima requisição de checkout de um usuário vinculado a essa diretoria calcula o preço final usando o novo percentual.
- [ ] Quando um pedido já foi finalizado (status='pago') antes da alteração do desconto, então seu valor total permanece inalterado após a mudança.
- [ ] Quando o usuário não possui vínculo ativo em usuario_diretoria com nenhuma diretoria, então o checkout aplica desconto_percentual igual a 0 e retorna HTTP 200 com o preço cheio.
- [ ] Quando o campo desconto_percentual da diretoria está nulo ou inválido (fora do intervalo 0-100), então o checkout retorna HTTP 422 com mensagem 'Desconto inválido' e a compra não é processada.

**Especificidade técnica:**
- Códigos HTTP: 200, 422
- Campos: `desconto_percentual`, `status`, `diretoria_id`
- Limites: 0 a 100 (percentual)
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-369 (ver requirements.json)

---

### [Sprint 6] Desativar atlética via flag ativo=false
<!-- sdd-bot:meta id="BL-156" epic="Operações Comuns" layer="backend" requirementIds="REQ-370" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint PATCH /diretorias/{id}/status (ou equivalente) que altera o campo ativo da tabela diretorias para false, restrito a usuários com papel administrador, sem excluir o registro nem os vínculos usuario_diretoria associados.

**Comportamento esperado:**
Quando um administrador desativa uma diretoria, o registro correspondente na tabela diretorias passa a ter ativo=false e deixa de ser retornado nas listagens públicas de diretorias ativas, mas permanece consultável via endpoint administrativo.

**Critérios de aceite:**
- [ ] Quando um administrador envia PATCH /diretorias/{id}/status com ativo=false para uma diretoria existente e ativa, então a API retorna HTTP 200 e o campo ativo é persistido como false.
- [ ] Quando um usuário sem papel administrador tenta desativar uma diretoria, então a API retorna HTTP 403 com mensagem 'Permissão insuficiente'.
- [ ] Quando o id da diretoria informado não existe, então a API retorna HTTP 404 com mensagem 'Diretoria não encontrada'.
- [ ] Quando uma diretoria já está com ativo=false e a mesma operação de desativação é repetida, então a API retorna HTTP 200 sem alterar o estado (operação idempotente).
- [ ] Quando a diretoria é desativada, então os registros em usuario_diretoria vinculados a ela não são excluídos nem alterados.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404
- Campos: `ativo`, `diretoria_id`
- Precisa de esclarecimento: sim — Não há definição do path/verbo exato do endpoint de desativação nem se a operação é feita via PATCH parcial ou endpoint dedicado (ex.: /diretorias/{id}/desativar).

**Rastreabilidade:** REQ-370 (ver requirements.json)

---

### [Sprint 6] Bloquear troca de atlética ativa para diretoria desativada
<!-- sdd-bot:meta id="BL-157" epic="Operações Comuns" layer="backend" requirementIds="REQ-371" dependsOn="REQ-370" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-370

**Descrição:**
Adicionar validação no serviço responsável pela troca de atlética ativa do usuário (endpoint de troca de contexto/diretoria) que verifica o campo ativo da diretoria destino antes de efetivar a mudança, rejeitando a operação quando ativo=false.

**Comportamento esperado:**
Quando um usuário tenta trocar sua atlética ativa para uma diretoria com ativo=false, a troca não é efetivada e o contexto do usuário permanece na diretoria anterior.

**Critérios de aceite:**
- [ ] Quando um usuário solicita troca para uma diretoria com ativo=true, então a API retorna HTTP 200 e o contexto ativo do usuário é atualizado para a nova diretoria.
- [ ] Quando um usuário solicita troca para uma diretoria com ativo=false, então a API retorna HTTP 409 com mensagem 'Diretoria desativada' e o contexto ativo do usuário não é alterado.
- [ ] Quando o id da diretoria destino não existe, então a API retorna HTTP 404 com mensagem 'Diretoria não encontrada'.
- [ ] Quando a diretoria destino é desativada entre a listagem e a tentativa de troca, então a API retorna HTTP 409 no momento da troca, refletindo o estado atual do banco.

**Especificidade técnica:**
- Códigos HTTP: 200, 404, 409
- Campos: `ativo`, `diretoria_id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-371 (ver requirements.json)

---

### [Sprint 7] Implementar CRUD de sócios para DIRETORIA
<!-- sdd-bot:meta id="BL-158" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-21" dependsOn="REQ-3" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-3

**Descrição:**
Criar endpoints REST (POST /socios, GET /socios, GET /socios/{id}, PUT /socios/{id}, DELETE /socios/{id}) na camada backend, persistindo os dados na tabela socios. Cada endpoint deve validar que o usuário autenticado possui role DIRETORIA (via middleware de autorização já existente em REQ-3) antes de executar a operação. O DELETE deve realizar exclusão lógica (soft delete, campo deleted_at) para preservar histórico de associações.

**Comportamento esperado:**
Ao chamar POST /socios com nome, cpf e tipo_vinculo válidos, a API retorna 201 com o objeto sócio criado incluindo id gerado. Ao chamar GET /socios, retorna lista paginada de sócios ativos em JSON. Ao chamar PUT/DELETE em um sócio existente, retorna 200 com os dados atualizados ou confirmação de exclusão lógica.

**Critérios de aceite:**
- [ ] Quando um usuário com role DIRETORIA envia POST /socios com dados válidos, então a API retorna 201 e o registro é persistido na tabela socios.
- [ ] Quando um usuário sem role DIRETORIA tenta qualquer operação de escrita (POST, PUT, DELETE), então a API retorna 403 com mensagem 'Acesso negado: requer role DIRETORIA'.
- [ ] Quando GET /socios é chamado, então retorna 200 com array de sócios não excluídos (deleted_at IS NULL).
- [ ] Quando PUT /socios/{id} é chamado com id inexistente, então a API retorna 404 com mensagem 'Sócio não encontrado'.
- [ ] Quando POST /socios é enviado sem o campo obrigatório cpf, então a API retorna 400 com mensagem 'Campo cpf é obrigatório'.
- [ ] Quando DELETE /socios/{id} é chamado em sócio existente, então o registro tem deleted_at preenchido e deixa de aparecer em GET /socios, retornando 200.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 403, 404
- Campos: `nome`, `cpf`, `tipo_vinculo`, `deleted_at`, `/socios`, `/socios/{id}`
- Precisa de esclarecimento: sim — O SDD não especifica os campos obrigatórios completos do sócio nem regras de unicidade de CPF; assumido cpf como identificador único a confirmar.

**Rastreabilidade:** REQ-21 (ver requirements.json)

---

### [Sprint 7] Associar usuário a sócio independente do tipo de vínculo
<!-- sdd-bot:meta id="BL-159" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-23" dependsOn="REQ-21" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-21

**Descrição:**
Criar endpoint POST /socios/{id}/usuarios (ou tabela de junção usuario_socio) que vincula um registro de usuário a um sócio sem validar ou restringir com base no campo tipo_vinculo (estudante/não-estudante). A lógica de associação deve aceitar qualquer valor válido desse campo já definido em REQ-21, garantindo que a regra de preço por role (usada no checkout) não dependa do tipo de vínculo para permitir a associação.

**Comportamento esperado:**
Ao associar um usuário estudante ou não-estudante a um sócio, o vínculo é criado e retornado com status 201, aparecendo na consulta GET /socios/{id}/usuarios independentemente do tipo_vinculo.

**Critérios de aceite:**
- [ ] Quando um usuário com tipo_vinculo 'estudante' é associado a um sócio, então a API retorna 201 e o vínculo é persistido na tabela usuario_socio.
- [ ] Quando um usuário com tipo_vinculo 'nao-estudante' é associado a um sócio, então a API retorna 201 com o mesmo comportamento, sem restrição adicional.
- [ ] Quando o usuario_id informado já possui vínculo ativo com o mesmo socio_id, então a API retorna 409 com mensagem 'Usuário já associado a este sócio'.
- [ ] Quando o socio_id informado não existe ou está excluído (deleted_at preenchido), então a API retorna 404 com mensagem 'Sócio não encontrado'.

**Especificidade técnica:**
- Códigos HTTP: 201, 404, 409
- Campos: `usuario_id`, `socio_id`, `tipo_vinculo`, `usuario_socio`
- Precisa de esclarecimento: sim — Não está definido se um usuário pode ter múltiplos sócios simultaneamente ou apenas um vínculo ativo por vez; necessário confirmar a cardinalidade da relação usuario-sócio.

**Rastreabilidade:** REQ-23 (ver requirements.json)

---

### [Sprint 7] Implementar CRUD de produtos da loja para DIRETORIA
<!-- sdd-bot:meta id="BL-160" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-24" dependsOn="REQ-3" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-3

**Descrição:**
Criar endpoints REST (POST /produtos, GET /produtos, GET /produtos/{id}, PUT /produtos/{id}, DELETE /produtos/{id}) persistindo na tabela produtos, com campos nome, preco_base, percentual_desconto_socio e estoque. Middleware de autorização (reaproveitado de REQ-3) deve restringir POST, PUT e DELETE à role DIRETORIA. DELETE realiza exclusão lógica via campo deleted_at para preservar integridade referencial com pedidos/histórico já vinculados.

**Comportamento esperado:**
Ao chamar POST /produtos com dados válidos, a API retorna 201 com o produto criado. GET /produtos retorna a lista de produtos ativos em JSON. PUT e DELETE em produto existente retornam 200 confirmando a atualização ou a exclusão lógica.

**Critérios de aceite:**
- [ ] Quando um usuário com role DIRETORIA envia POST /produtos com nome e preco_base válidos, então a API retorna 201 e o produto é persistido na tabela produtos.
- [ ] Quando um usuário sem role DIRETORIA tenta POST, PUT ou DELETE em /produtos, então a API retorna 403 com mensagem 'Acesso negado: requer role DIRETORIA'.
- [ ] Quando POST /produtos é enviado com preco_base menor ou igual a 0, então a API retorna 400 com mensagem 'preco_base deve ser maior que zero'.
- [ ] Quando PUT /produtos/{id} é chamado com id inexistente, então a API retorna 404 com mensagem 'Produto não encontrado'.
- [ ] Quando DELETE /produtos/{id} é chamado em produto existente, então deleted_at é preenchido, o produto some de GET /produtos e a API retorna 200.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 403, 404
- Campos: `nome`, `preco_base`, `percentual_desconto_socio`, `estoque`, `deleted_at`, `/produtos`, `/produtos/{id}`
- Precisa de esclarecimento: sim — O SDD não detalha o schema completo do produto (ex.: se há categoria, SKU, unidade de estoque) nem regra de unicidade de nome; assumido estrutura mínima a confirmar.

**Rastreabilidade:** REQ-24 (ver requirements.json)

---

### [Sprint 7] Manter carrinho de compras vinculado à sessão do usuário
<!-- sdd-bot:meta id="BL-161" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-26" dependsOn="REQ-24" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-24

**Descrição:**
Implementar armazenamento de carrinho por sessão (chave session_id ou vinculado ao token do usuário autenticado) em store persistente (ex.: tabela carrinho_itens ou cache Redis com TTL), expondo endpoints POST /carrinho/itens (adicionar), GET /carrinho (consultar), PUT /carrinho/itens/{produto_id} (atualizar quantidade) e DELETE /carrinho/itens/{produto_id} (remover). Cada item referencia produto_id (validado contra tabela produtos de REQ-24) e quantidade.

**Comportamento esperado:**
Ao adicionar um produto ao carrinho via POST /carrinho/itens, a API retorna 201 e o item passa a constar em GET /carrinho para a mesma sessão. Itens adicionados persistem entre requisições subsequentes na mesma sessão até checkout ou remoção explícita.

**Critérios de aceite:**
- [ ] Quando POST /carrinho/itens é chamado com produto_id existente e quantidade igual a 2, então a API retorna 201 e GET /carrinho subsequente na mesma sessão lista esse item com quantidade 2.
- [ ] Quando POST /carrinho/itens é chamado com produto_id inexistente, então a API retorna 404 com mensagem 'Produto não encontrado'.
- [ ] Quando POST /carrinho/itens é chamado com quantidade igual a 0 ou negativa, então a API retorna 400 com mensagem 'quantidade deve ser maior que zero'.
- [ ] Quando DELETE /carrinho/itens/{produto_id} é chamado para item existente no carrinho, então o item deixa de constar em GET /carrinho e a API retorna 200.
- [ ] Quando GET /carrinho é chamado sem sessão válida (sem token/session_id), então a API retorna 401 com mensagem 'Sessão inválida ou expirada'.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 401, 404
- Campos: `produto_id`, `quantidade`, `session_id`, `/carrinho`, `/carrinho/itens`, `/carrinho/itens/{produto_id}`
- Precisa de esclarecimento: sim — Não está definido o tempo de expiração (TTL) do carrinho nem o mecanismo de persistência (banco relacional vs. cache); necessário decidir tecnologia de armazenamento e política de expiração da sessão.

**Rastreabilidade:** REQ-26 (ver requirements.json)

---

### [Sprint 7] Aplicar desconto automático no processamento do checkout
<!-- sdd-bot:meta id="BL-162" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-27" dependsOn="REQ-26,REQ-5" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-26, REQ-5

**Descrição:**
Implementar no endpoint de checkout (ex.: POST /checkout) a chamada ao PriceCalculationService para recalcular o preço de cada item do carrinho no momento da confirmação da compra, aplicando o desconto de sócio conforme o role do usuário autenticado (REQ-164/REQ-165), e persistindo o valor final (unitário e total) na ordem de compra gerada.

**Comportamento esperado:**
O total da compra exibido na confirmação do checkout reflete o preço já descontado para sócios ou o preço base para não sócios, sem exigir ação manual do usuário.

**Critérios de aceite:**
- [ ] Quando um usuário com role SOCIO finalizar o checkout de um carrinho com itens elegíveis a desconto, então o total da ordem gerada deve refletir o preço com desconto aplicado a cada item.
- [ ] Quando um usuário sem role SOCIO finalizar o checkout, então o total da ordem gerada deve usar o preço base sem desconto.
- [ ] Quando o checkout for concluído, então a API deve responder com HTTP 201 e o payload contendo o id da ordem, itens com preço unitário aplicado e valor total.
- [ ] Quando o carrinho estiver vazio no momento do checkout, então a API deve responder com HTTP 400 e mensagem de erro "CART_EMPTY".
- [ ] Quando um produto do carrinho não existir mais ou estiver inativo, então a API deve responder com HTTP 409 e mensagem de erro "PRODUCT_UNAVAILABLE", sem criar a ordem.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `POST /checkout`, `CART_EMPTY`, `PRODUCT_UNAVAILABLE`
- Precisa de esclarecimento: sim — Não há definição do endpoint exato de checkout, do formato do payload de resposta nem das mensagens de erro padronizadas; assumidos nomes provisórios até confirmação.

**Rastreabilidade:** REQ-27 (ver requirements.json)

---

### [Sprint 7] Persistir e listar histórico de compras do usuário
<!-- sdd-bot:meta id="BL-163" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-28" dependsOn="REQ-27" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-27

**Descrição:**
Criar tabela/entidade de ordens de compra (associada ao checkout do REQ-27) e endpoint GET /compras/historico que retorna as ordens do usuário autenticado, ordenadas por data decrescente, com itens, preços aplicados e status.

**Comportamento esperado:**
O usuário autenticado consegue consultar a lista de suas compras anteriores com detalhes de itens e valores pagos, em ordem cronológica reversa.

**Critérios de aceite:**
- [ ] Quando o usuário autenticado possuir ao menos uma compra registrada, então GET /compras/historico deve responder HTTP 200 com a lista de ordens ordenada da mais recente para a mais antiga.
- [ ] Quando o usuário autenticado não possuir nenhuma compra registrada, então GET /compras/historico deve responder HTTP 200 com lista vazia.
- [ ] Quando a requisição for feita sem token de autenticação válido, então a API deve responder HTTP 401.
- [ ] Quando o histórico for retornado, então cada item da lista deve conter id da ordem, data, itens comprados, preço unitário aplicado e valor total.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `GET /compras/historico`
- Precisa de esclarecimento: sim — Não há definição de paginação para o histórico (limite de itens por página); assumir retorno completo até confirmação de necessidade de paginação.

**Rastreabilidade:** REQ-28 (ver requirements.json)

---

### [Sprint 7] Aplicar desconto de sócio no cálculo de preço de produto
<!-- sdd-bot:meta id="BL-164" epic="5.3 Services Principais - LojaService, EventosService, PriceCalculationService, PermissionService" layer="backend" requirementIds="REQ-164" dependsOn="REQ-163" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-163

**Descrição:**
No PriceCalculationService, implementar a lógica que, ao receber o preço base do produto e o role do usuário obtido via PermissionService, aplica o percentual de desconto configurado para role SOCIO e retorna o preço final calculado.

**Comportamento esperado:**
O preço retornado pelo serviço para um usuário SOCIO é menor que o preço base, refletindo o percentual de desconto vigente.

**Critérios de aceite:**
- [ ] Quando o role do usuário for SOCIO e o preço base do produto for informado, então o serviço deve retornar o preço com o percentual de desconto de sócio subtraído do preço base.
- [ ] Quando o preço base for zero, então o serviço deve retornar zero sem aplicar cálculo de desconto.
- [ ] Quando o preço calculado com desconto for retornado, então o valor deve manter duas casas decimais.
- [ ] Quando o preço base informado for negativo, então o serviço deve rejeitar o cálculo retornando erro "INVALID_PRICE".

**Especificidade técnica:**
- Campos: `PriceCalculationService`, `PermissionService`, `INVALID_PRICE`
- Precisa de esclarecimento: sim — O percentual exato do desconto de sócio não foi informado no requisito; necessário definir o valor (ex.: 10%, 15%) antes da implementação.

**Rastreabilidade:** REQ-164 (ver requirements.json)

---

### [Sprint 7] Retornar preço base sem desconto para não sócio
<!-- sdd-bot:meta id="BL-165" epic="5.3 Services Principais - LojaService, EventosService, PriceCalculationService, PermissionService" layer="backend" requirementIds="REQ-165" dependsOn="REQ-163" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-163

**Descrição:**
No PriceCalculationService, garantir que, quando o role do usuário obtido via PermissionService for diferente de SOCIO, o método de cálculo retorne o preço base do produto sem aplicar nenhuma redução percentual.

**Comportamento esperado:**
O preço retornado pelo serviço para um usuário não sócio é idêntico ao preço base cadastrado do produto.

**Critérios de aceite:**
- [ ] Quando o role do usuário não for SOCIO e o preço base do produto for informado, então o serviço deve retornar exatamente o preço base, sem subtração de desconto.
- [ ] Quando o usuário não possuir role atribuído (role nulo ou ausente), então o serviço deve tratar como não sócio e retornar o preço base.
- [ ] Quando o preço base informado for negativo, então o serviço deve rejeitar o cálculo retornando erro "INVALID_PRICE".
- [ ] Quando o preço retornado for calculado, então o valor deve manter duas casas decimais, igual ao formato usado no cálculo com desconto.

**Especificidade técnica:**
- Campos: `PriceCalculationService`, `PermissionService`, `INVALID_PRICE`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-165 (ver requirements.json)

---

### [Sprint 7] Retornar detalhamento de preço no cálculo por role
<!-- sdd-bot:meta id="BL-166" epic="5.3 Services Principais - LojaService, EventosService, PriceCalculationService, PermissionService" layer="backend" requirementIds="REQ-166" dependsOn="REQ-164,REQ-165" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-164, REQ-165

**Descrição:**
No PriceCalculationService, estruturar o objeto de retorno do método de cálculo de preço para incluir os campos precoFinal (number), desconto (number, percentual ou valor aplicado conforme role) e economia (number, diferença entre preço base e precoFinal). Esse serviço é consumido pelo LojaService ao montar a resposta do grid de produtos e do checkout, portanto a estrutura deve ser reutilizável nesses dois fluxos.

**Comportamento esperado:**
Ao chamar o cálculo de preço para um produto e uma role de usuário, a resposta contém um objeto com precoFinal, desconto e economia preenchidos consistentemente com a regra de desconto da role.

**Critérios de aceite:**
- [ ] Quando o cálculo é executado para uma role com desconto configurado, então precoFinal = precoBase - desconto e economia = precoBase - precoFinal.
- [ ] Quando a role não possui desconto (ex.: não-sócio), então desconto = 0, economia = 0 e precoFinal = precoBase.
- [ ] Quando o preço base do produto é 0 ou negativo, então o serviço retorna erro de validação em vez de calcular valores negativos.
- [ ] Quando o objeto de retorno é serializado, então os três campos (precoFinal, desconto, economia) estão sempre presentes, mesmo que com valor 0.

**Especificidade técnica:**
- Campos: `precoFinal`, `desconto`, `economia`
- Precisa de esclarecimento: sim — Não está definido se 'desconto' é retornado como percentual (ex.: 0.1) ou valor monetário absoluto, nem o tratamento de arredondamento (casas decimais).

**Rastreabilidade:** REQ-166 (ver requirements.json)

---

### [Sprint 7] Listar sócios com filtro por diretoriaId
<!-- sdd-bot:meta id="BL-167" epic="Endpoints de Socios" layer="backend" requirementIds="REQ-222" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint GET /socios no controller de sócios, consultando a tabela/entidade Socios e aplicando filtro opcional via query param diretoriaId quando presente na requisição.

**Comportamento esperado:**
Ao chamar GET /socios, a API retorna a lista de sócios cadastrados, restrita à diretoria informada quando o parâmetro diretoriaId é enviado.

**Critérios de aceite:**
- [ ] Quando GET /socios é chamado sem query params, então retorna 200 com todos os sócios cadastrados.
- [ ] Quando GET /socios?diretoriaId=X é chamado, então retorna 200 apenas com sócios vinculados à diretoria X.
- [ ] Quando diretoriaId informado não corresponde a nenhuma diretoria existente, então retorna 200 com lista vazia [].
- [ ] Quando diretoriaId é enviado em formato inválido (não numérico/UUID conforme tipo esperado), então retorna 400 com mensagem de erro de validação.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `diretoriaId`
- Precisa de esclarecimento: sim — Não especificado o tipo de dado de diretoriaId (UUID, inteiro) nem se há paginação na listagem.

**Rastreabilidade:** REQ-222 (ver requirements.json)

---

### [Sprint 7] Criar sócio via POST /socios
<!-- sdd-bot:meta id="BL-168" epic="Endpoints de Socios" layer="backend" requirementIds="REQ-223" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint POST /socios que recebe usuarioId, nome e email no corpo da requisição, valida os campos obrigatórios e persiste um novo registro na tabela/entidade Socios vinculado ao usuarioId.

**Comportamento esperado:**
Ao enviar POST /socios com dados válidos, um novo sócio é criado e retornado na resposta com os dados persistidos.

**Critérios de aceite:**
- [ ] Quando POST /socios é chamado com usuarioId, nome e email válidos, então retorna 201 com o sócio criado, incluindo id gerado.
- [ ] Quando algum campo obrigatório (usuarioId, nome ou email) está ausente, então retorna 400 com mensagem indicando o campo faltante.
- [ ] Quando email informado tem formato inválido, então retorna 400 com erro de validação de formato.
- [ ] Quando já existe um sócio com o mesmo usuarioId, então retorna 409 indicando conflito de sócio já cadastrado.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 409
- Campos: `usuarioId`, `nome`, `email`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-223 (ver requirements.json)

---

### [Sprint 7] Atualizar parcialmente sócio via PATCH /socios/:id
<!-- sdd-bot:meta id="BL-169" epic="Endpoints de Socios" layer="backend" requirementIds="REQ-224" dependsOn="REQ-223" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-223

**Descrição:**
Implementar endpoint PATCH /socios/:id que busca o sócio pelo id na tabela/entidade Socios e aplica atualização parcial (merge) apenas dos campos enviados no corpo da requisição, sem exigir o payload completo.

**Comportamento esperado:**
Ao enviar PATCH /socios/:id com um subconjunto de campos, apenas esses campos são atualizados no sócio existente, mantendo os demais inalterados.

**Critérios de aceite:**
- [ ] Quando PATCH /socios/:id é chamado com id existente e campos válidos (ex.: nome), então retorna 200 com o sócio atualizado refletindo apenas os campos enviados.
- [ ] Quando id informado não corresponde a nenhum sócio cadastrado, então retorna 404 com mensagem de sócio não encontrado.
- [ ] Quando o corpo da requisição contém um campo com valor de formato inválido (ex.: email malformado), então retorna 400 com erro de validação sem persistir alterações.
- [ ] Quando o corpo da requisição está vazio, então retorna 400 indicando que ao menos um campo deve ser fornecido.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 404
- Campos: `id`, `nome`, `email`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-224 (ver requirements.json)

---

### [Sprint 7] Remover sócio via DELETE /socios/:id
<!-- sdd-bot:meta id="BL-170" epic="Endpoints de Socios" layer="backend" requirementIds="REQ-225" dependsOn="REQ-223" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-223

**Descrição:**
Implementar endpoint DELETE /socios/:id no backend, que busca o sócio pelo id na tabela socios e, se existente, executa a exclusão do registro (hard ou soft delete conforme padrão já adotado nos demais endpoints de Socios). Validar previamente a existência do registro antes de tentar remover.

**Comportamento esperado:**
Ao remover um sócio existente, o registro deixa de aparecer nas consultas subsequentes de listagem/detalhe de sócios.

**Critérios de aceite:**
- [ ] Quando DELETE /socios/:id for chamado com um id existente, então a API retorna 200 ou 204 e o sócio é removido da base.
- [ ] Quando DELETE /socios/:id for chamado com um id inexistente, então a API retorna 404 com mensagem indicando que o sócio não foi encontrado.
- [ ] Quando o id informado não for um formato válido (ex.: não numérico/UUID inválido), então a API retorna 400 com mensagem de erro de validação.
- [ ] Quando o sócio removido possuir vínculos dependentes (ex.: compras associadas), então o comportamento de integridade referencial deve ser definido explicitamente (bloqueio com 409 ou remoção em cascata).

**Especificidade técnica:**
- Códigos HTTP: 200, 204, 400, 404, 409
- Campos: `id`
- Precisa de esclarecimento: sim — Não está definido se a exclusão é lógica (soft delete) ou física, nem o comportamento quando o sócio possui compras/vínculos associados (bloquear com 409 ou cascata).

**Rastreabilidade:** REQ-225 (ver requirements.json)

---

### [Sprint 7] Listar produtos disponíveis via GET /loja/produtos
<!-- sdd-bot:meta id="BL-171" epic="Endpoints de Loja" layer="backend" requirementIds="REQ-226" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint GET /loja/produtos no backend, que consulta a tabela de produtos da loja e retorna a lista de produtos ativos/disponíveis para venda, incluindo campos como id, nome, preço base e estoque (quando aplicável).

**Comportamento esperado:**
A requisição retorna um array JSON com os produtos disponíveis na loja, sem exigir autenticação prévia.

**Critérios de aceite:**
- [ ] Quando GET /loja/produtos for chamado, então a API retorna 200 com um array JSON contendo os produtos disponíveis (id, nome, preco, estoque).
- [ ] Quando não houver produtos cadastrados, então a API retorna 200 com um array vazio [].

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `id`, `nome`, `preco`, `estoque`
- Precisa de esclarecimento: sim — Não está especificado se produtos inativos/sem estoque devem ser filtrados da listagem, nem se há paginação para grandes volumes de produtos.

**Rastreabilidade:** REQ-226 (ver requirements.json)

---

### [Sprint 7] Registrar compra de produto pelo usuário autenticado
<!-- sdd-bot:meta id="BL-172" epic="Endpoints de Loja" layer="backend" requirementIds="REQ-227" dependsOn="REQ-226" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-226

**Descrição:**
Implementar endpoint POST /loja/compras (ou equivalente) protegido por autenticação, que recebe produtoId e quantidade no corpo da requisição, valida a existência do produto e disponibilidade de estoque, calcula o preço final aplicando desconto (via lógica de REQ-228), registra a compra no histórico do usuário e retorna preço final, desconto aplicado e mensagem de confirmação.

**Comportamento esperado:**
O usuário autenticado recebe uma resposta com o preço final calculado, o valor/percentual de desconto aplicado e uma mensagem de sucesso da compra.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado enviar produtoId e quantidade válidos, então a API retorna 201 com precoFinal, desconto e mensagem de sucesso.
- [ ] Quando produtoId não existir na base, então a API retorna 404 com mensagem 'Produto não encontrado'.
- [ ] Quando quantidade for menor ou igual a zero ou não for informada, então a API retorna 400 com mensagem de validação.
- [ ] Quando o estoque do produto for insuficiente para a quantidade solicitada, então a API retorna 409 com mensagem 'Estoque insuficiente'.
- [ ] Quando a requisição não possuir token de autenticação válido, então a API retorna 401.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 401, 404, 409
- Campos: `produtoId`, `quantidade`, `precoFinal`, `desconto`, `mensagem`
- Precisa de esclarecimento: sim — Não está definido o valor mínimo/máximo de quantidade por compra nem se há débito automático de estoque ao confirmar a compra.

**Rastreabilidade:** REQ-227 (ver requirements.json)

---

### [Sprint 7] Calcular desconto na compra por role do usuário
<!-- sdd-bot:meta id="BL-173" epic="Endpoints de Loja" layer="backend" requirementIds="REQ-228" dependsOn="REQ-227" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-227

**Descrição:**
Implementar na lógica de checkout (usada por REQ-227) o cálculo do preço final aplicando o percentual de desconto correspondente ao role/diretoria do usuário autenticado, obtido a partir do token/sessão ou de uma tabela de mapeamento role→desconto, aplicado sobre o preço base do produto multiplicado pela quantidade.

**Comportamento esperado:**
O preço final retornado na compra reflete o preço base do produto reduzido pelo percentual de desconto vinculado ao role do usuário que realiza a compra.

**Critérios de aceite:**
- [ ] Quando um usuário com role que possui desconto configurado comprar um produto, então o precoFinal retornado é igual a (preco * quantidade) menos o percentual de desconto do role.
- [ ] Quando um usuário com role sem desconto configurado (ex.: sócio comum) comprar um produto, então o precoFinal é igual ao preço base multiplicado pela quantidade, sem redução.
- [ ] Quando o role do usuário não estiver mapeado na tabela de descontos, então o sistema aplica desconto zero e retorna a compra normalmente, sem erro.
- [ ] Quando o cálculo for realizado, então o campo desconto retornado reflete o percentual ou valor exato aplicado, coerente com o role do usuário.

**Especificidade técnica:**
- Campos: `role`, `desconto`, `precoFinal`
- Precisa de esclarecimento: sim — Não estão definidos os percentuais de desconto por role/diretoria nem onde essa tabela de mapeamento é armazenada (configuração fixa no código, tabela no banco ou variável de ambiente).

**Rastreabilidade:** REQ-228 (ver requirements.json)

---

### [Sprint 7] Listar histórico de compras do usuário autenticado
<!-- sdd-bot:meta id="BL-174" epic="Endpoints de Loja" layer="backend" requirementIds="REQ-229" dependsOn="REQ-227" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-227

**Descrição:**
Criar endpoint GET /loja/minhas-compras que consulta a tabela de compras filtrando por usuarioId extraído do token JWT da sessão autenticada, retornando lista ordenada por data decrescente com produto, quantidade, preço pago e data da compra.

**Comportamento esperado:**
O usuário autenticado visualiza apenas as próprias compras, sem acesso a compras de outros usuários.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado com compras registradas chama GET /loja/minhas-compras, então a API retorna 200 com um array de objetos contendo produtoId, nome, quantidade, precoPago e dataCompra.
- [ ] Quando o usuário autenticado não possui nenhuma compra registrada, então a API retorna 200 com array vazio [].
- [ ] Quando a requisição não contém token de autenticação válido, então a API retorna 401 com mensagem 'Não autorizado'.
- [ ] Quando o token é válido, então a listagem inclui somente registros cujo usuarioId corresponde ao id extraído do token, nunca compras de terceiros.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `produtoId`, `nome`, `quantidade`, `precoPago`, `dataCompra`, `usuarioId`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-229 (ver requirements.json)

---

### [Sprint 7] Listar vendas e dados analíticos para role DIRETORIA
<!-- sdd-bot:meta id="BL-175" epic="Endpoints de Loja" layer="backend" requirementIds="REQ-230" dependsOn="REQ-227" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-227

**Descrição:**
Criar endpoint GET /loja/vendas protegido por guard de role que restringe acesso a usuários com role DIRETORIA, agregando dados da tabela de compras: total de vendas (soma de precoPago), quantidade de transações e lista detalhada de vendas com filtros opcionais de período.

**Comportamento esperado:**
Somente usuários com role DIRETORIA visualizam o total consolidado de vendas, a lista completa de transações e os dados analíticos agregados.

**Critérios de aceite:**
- [ ] Quando um usuário com role DIRETORIA chama GET /loja/vendas, então a API retorna 200 com objeto contendo totalVendas (número), quantidadeVendas (inteiro) e array vendas com detalhes de cada transação.
- [ ] Quando um usuário autenticado sem role DIRETORIA chama GET /loja/vendas, então a API retorna 403 com mensagem 'Acesso restrito a diretoria'.
- [ ] Quando não existem vendas registradas no período consultado, então a API retorna 200 com totalVendas igual a 0, quantidadeVendas igual a 0 e vendas como array vazio.
- [ ] Quando a requisição não contém token de autenticação válido, então a API retorna 401 com mensagem 'Não autorizado'.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `totalVendas`, `quantidadeVendas`, `vendas`, `role`
- Precisa de esclarecimento: sim — O requisito não especifica quais filtros de período/paginação o endpoint analítico deve suportar nem quais campos exatos compõem 'dados analíticos' além do total.

**Rastreabilidade:** REQ-230 (ver requirements.json)

---

### [Sprint 7] Expor endpoint POST /loja/comprar para confirmar compra
<!-- sdd-bot:meta id="BL-176" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-276" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Criar rota POST /loja/comprar no controller de loja que recebe produtoId e quantidade no corpo da requisição, valida autenticação via guard JWT e delega o processamento ao LojaService.comprar, retornando o resultado da transação criada.

**Comportamento esperado:**
A requisição de compra é aceita, validada e processada, retornando confirmação com os dados da transação registrada.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado envia POST /loja/comprar com produtoId e quantidade válidos, então a API retorna 201 com o objeto da compra criada contendo id, produtoId, quantidade e precoPago.
- [ ] Quando o corpo da requisição não contém produtoId ou quantidade, então a API retorna 400 com mensagem 'produtoId e quantidade são obrigatórios'.
- [ ] Quando quantidade é menor ou igual a 0, então a API retorna 400 com mensagem 'quantidade deve ser maior que zero'.
- [ ] Quando a requisição não contém token de autenticação válido, então a API retorna 401 com mensagem 'Não autorizado'.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 401
- Campos: `produtoId`, `quantidade`, `precoPago`
- Limites: quantidade deve ser maior que 0
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-276 (ver requirements.json)

---

### [Sprint 7] Implementar LojaService.comprar para orquestrar transação
<!-- sdd-bot:meta id="BL-177" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-277" dependsOn="REQ-276" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-276

**Descrição:**
Implementar método comprar(usuarioId, produtoId, quantidade) em LojaService que busca o produto e o role do usuário, calcula o preço aplicando o desconto correspondente ao role, verifica saldo/estoque disponível, decrementa o estoque e persiste um novo registro na tabela de compras dentro de uma transação de banco de dados.

**Comportamento esperado:**
A compra é processada de forma consistente: preço calculado conforme role, estoque atualizado e registro de compra persistido, ou nenhuma alteração ocorre em caso de falha.

**Critérios de aceite:**
- [ ] Quando o produto existe e há estoque suficiente, então LojaService.comprar calcula o precoPago aplicando o percentual de desconto do role do usuário e retorna o registro de compra persistido.
- [ ] Quando o produtoId informado não corresponde a nenhum produto existente, então LojaService.comprar lança exceção que resulta em resposta 404 com mensagem 'Produto não encontrado'.
- [ ] Quando a quantidade solicitada excede o estoque disponível do produto, então LojaService.comprar lança exceção que resulta em resposta 409 com mensagem 'Estoque insuficiente'.
- [ ] Quando a persistência da compra ou o decremento do estoque falha durante a transação, então nenhuma alteração é gravada no banco e o estoque permanece com o valor anterior à tentativa.

**Especificidade técnica:**
- Códigos HTTP: 404, 409
- Campos: `usuarioId`, `produtoId`, `quantidade`, `precoPago`, `estoque`, `role`
- Precisa de esclarecimento: sim — O requisito não define os percentuais de desconto por role nem a estrutura exata da tabela de estoque/produtos usada para validação de disponibilidade.

**Rastreabilidade:** REQ-277 (ver requirements.json)

---

### [Sprint 7] Calcular preço final do produto por role do usuário
<!-- sdd-bot:meta id="BL-178" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-278" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar no serviço de precificação (ex.: PricingService) a lógica que recebe o preço base do produto e o role do usuário autenticado (ex.: SOCIO, PADRAO) e calcula o preço final aplicando o percentual de desconto correspondente ao role, consultando uma tabela/config de desconto por role (ex.: RoleDiscountConfig). O cálculo deve ser usado como base para o registro de venda (REQ-279).

**Comportamento esperado:**
Ao solicitar o preço de um produto para um usuário com role SOCIO, o sistema retorna o preço final já com o desconto do role aplicado, junto com o valor do desconto calculado.

**Critérios de aceite:**
- [ ] Quando um usuário com role SOCIO consultar o preço de um produto com preço base R$100,00 e desconto configurado de 10%, então o sistema deve retornar preço final R$90,00 e desconto R$10,00.
- [ ] Quando um usuário com role sem desconto configurado (ex.: PADRAO) consultar o preço, então o sistema deve retornar preço final igual ao preço base e desconto R$0,00.
- [ ] Quando o role do usuário não existir na tabela de configuração de descontos, então o sistema deve aplicar desconto 0% e retornar HTTP 200 sem erro.
- [ ] Quando o preço base do produto for nulo ou menor ou igual a zero, então o sistema deve retornar HTTP 422 com mensagem de erro 'invalid_product_price'.
- [ ] Quando o percentual de desconto calculado resultar em preço final negativo, então o sistema deve retornar HTTP 422 com mensagem de erro 'invalid_discount_calculation'.

**Especificidade técnica:**
- Códigos HTTP: 200, 422
- Campos: `preço base`, `preço final`, `desconto`, `role`, `invalid_product_price`, `invalid_discount_calculation`
- Precisa de esclarecimento: sim — Não há definição dos percentuais de desconto por role nem da fonte/tabela de configuração (fixa em código, tabela no banco ou parametrizável via admin); necessário definir antes da implementação.

**Rastreabilidade:** REQ-278 (ver requirements.json)

---

### [Sprint 7] Criar registro de venda com preço e desconto aplicados
<!-- sdd-bot:meta id="BL-179" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-279" dependsOn="REQ-278" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-278

**Descrição:**
Implementar no endpoint/serviço de checkout a persistência de um registro na tabela Venda contendo os campos usuario_id, produto_id, preco_com_desconto, desconto e total, utilizando o resultado do cálculo de preço por role (REQ-278) no momento da confirmação da compra.

**Comportamento esperado:**
Ao confirmar uma compra, o sistema grava na tabela Venda um registro com o usuário, produto, preço com desconto, valor do desconto e total calculados, disponível para consulta posterior no histórico de compras.

**Critérios de aceite:**
- [ ] Quando a compra for confirmada com usuário SOCIO e produto de preço base R$100,00 e desconto 10%, então o sistema deve criar um registro em Venda com preco_com_desconto=90.00, desconto=10.00 e total=90.00.
- [ ] Quando a compra envolver quantidade maior que 1, então o campo total deve ser igual a preco_com_desconto multiplicado pela quantidade informada.
- [ ] Quando o usuario_id ou produto_id informado não existir na base, então o sistema deve retornar HTTP 404 com mensagem 'user_not_found' ou 'product_not_found', sem criar o registro de Venda.
- [ ] Quando a quantidade informada for igual a zero, então o sistema deve retornar HTTP 422 com mensagem 'invalid_quantity' e não criar o registro de Venda.

**Especificidade técnica:**
- Códigos HTTP: 404, 422
- Campos: `usuario_id`, `produto_id`, `preco_com_desconto`, `desconto`, `total`, `user_not_found`, `product_not_found`, `invalid_quantity`
- Limites: quantidade mínima 1
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-279 (ver requirements.json)

---

### [Sprint 7] Decrementar estoque do produto após confirmação da compra
<!-- sdd-bot:meta id="BL-180" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-280" dependsOn="REQ-279" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-279

**Descrição:**
Implementar no fluxo de confirmação de compra (após criação do registro de Venda, REQ-279) a atualização do campo quantidade_estoque na tabela Produto, subtraindo a quantidade comprada, de forma atômica/transacional junto com a criação da Venda para evitar inconsistência em concorrência.

**Comportamento esperado:**
Ao confirmar a compra, a quantidade em estoque do produto é reduzida no valor exato da quantidade comprada, refletindo o novo saldo disponível imediatamente.

**Critérios de aceite:**
- [ ] Quando um produto com quantidade_estoque=50 for comprado em quantidade 3, então o sistema deve atualizar quantidade_estoque para 47 após a confirmação.
- [ ] Quando a quantidade solicitada for maior que a quantidade_estoque disponível, então o sistema deve retornar HTTP 409 com mensagem 'insufficient_stock' e não criar a Venda nem decrementar o estoque.
- [ ] Quando a quantidade_estoque do produto for igual a zero, então qualquer tentativa de compra deve retornar HTTP 409 com mensagem 'insufficient_stock'.
- [ ] Quando duas compras simultâneas do mesmo produto ocorrerem, então a operação de decremento deve ser executada de forma atômica, impedindo que a quantidade_estoque fique negativa.

**Especificidade técnica:**
- Códigos HTTP: 409
- Campos: `quantidade_estoque`, `insufficient_stock`
- Limites: estoque não pode ficar negativo (mínimo 0)
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-280 (ver requirements.json)

---

### [Sprint 7] Retornar status, preço final e desconto ao concluir compra
<!-- sdd-bot:meta id="BL-181" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-281" dependsOn="REQ-277" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-277

**Descrição:**
Implementar no endpoint de checkout (ex.: POST /compras) o payload de resposta retornado após a conclusão do fluxo de compra (cálculo de preço, criação da Venda e baixa de estoque), incluindo os campos status, preco_final e desconto_aplicado no corpo da resposta JSON.

**Comportamento esperado:**
Ao finalizar a chamada de checkout, a resposta HTTP contém um JSON com o status da operação, o preço final cobrado e o valor do desconto aplicado na compra.

**Critérios de aceite:**
- [ ] Quando a compra for concluída com produto de preço base R$100,00 e desconto de 10%, então a resposta deve ser HTTP 201 com JSON {"status":"completed","preco_final":90.00,"desconto_aplicado":10.00}.
- [ ] Quando a compra falhar por estoque insuficiente (REQ-280), então a resposta deve ser HTTP 409 com JSON {"status":"failed","error":"insufficient_stock"} sem os campos preco_final e desconto_aplicado.
- [ ] Quando a compra for concluída sem desconto aplicável ao role do usuário, então a resposta deve conter desconto_aplicado igual a 0.00 e preco_final igual ao preço base do produto.
- [ ] Quando o corpo da requisição de checkout não incluir produto_id, então a resposta deve ser HTTP 422 com JSON {"status":"failed","error":"missing_product_id"}.

**Especificidade técnica:**
- Códigos HTTP: 201, 409, 422
- Campos: `status`, `preco_final`, `desconto_aplicado`, `error`, `insufficient_stock`, `missing_product_id`
- Precisa de esclarecimento: sim — O requisito cita dependência de REQ-277, que não foi fornecido no contexto atual; não é possível confirmar se há campos adicionais esperados na resposta vindos desse requisito.

**Rastreabilidade:** REQ-281 (ver requirements.json)

---

### [Sprint 8] Implementar CRUD de eventos para diretoria
<!-- sdd-bot:meta id="BL-182" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-30" dependsOn="REQ-3" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-3

**Descrição:**
Criar endpoints REST no serviço de eventos: POST /events, GET /events, GET /events/:id, PUT /events/:id e DELETE /events/:id, protegidos por guard de role que exige DIRETORIA. Persistir dados na tabela events (campos: id, title, description, date, location, capacity, createdBy) via ORM. Aplicar validação de payload (title e date obrigatórios, capacity inteiro >=1) e checagem de existência do registro antes de update/delete.

**Comportamento esperado:**
Usuários com role DIRETORIA conseguem criar, listar, atualizar e excluir eventos via API; usuários sem essa role recebem erro de autorização.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA envia POST /events com title, date e capacity válidos, então a API retorna 201 com o objeto do evento criado e o registro é persistido na tabela events.
- [ ] Quando um usuário sem role DIRETORIA chama qualquer endpoint de escrita (POST, PUT, DELETE) em /events, então a API retorna 403 com mensagem 'Acesso restrito à diretoria'.
- [ ] Quando GET /events é chamado, então a API retorna 200 com a lista paginada de eventos existentes, independente da role do solicitante.
- [ ] Quando PUT /events/:id é chamado com um id inexistente, então a API retorna 404 com mensagem 'Evento não encontrado'.
- [ ] Quando POST /events é enviado sem o campo title ou sem o campo date, então a API retorna 400 com mensagem indicando o campo obrigatório ausente.
- [ ] Quando DELETE /events/:id é chamado com um id existente por usuário DIRETORIA, então a API retorna 204 e o registro é removido da tabela events.

**Especificidade técnica:**
- Códigos HTTP: 201, 403, 404, 400, 204, 200
- Campos: `title`, `description`, `date`, `location`, `capacity`, `createdBy`
- Limites: capacity inteiro >= 1
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-30 (ver requirements.json)

---

### [Sprint 8] Implementar inscrição de usuários em eventos
<!-- sdd-bot:meta id="BL-183" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-32" dependsOn="REQ-30" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-30

**Descrição:**
Criar endpoint POST /events/:id/inscricoes que cria um registro na tabela participacoes (colunas: id, userId, eventId, status, createdAt) vinculando o usuário autenticado ao evento via ManyToOne. Validar capacidade máxima do evento (campo capacity) antes de inserir, e impedir inscrição duplicada do mesmo usuário no mesmo evento por meio de constraint única (eventId, userId).

**Comportamento esperado:**
Usuário autenticado consegue se inscrever em um evento existente e passa a constar na lista de participantes daquele evento.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado envia POST /events/:id/inscricoes para um evento com vagas disponíveis, então a API retorna 201 e cria um registro em participacoes com status 'confirmado'.
- [ ] Quando o usuário tenta se inscrever em um evento no qual já possui inscrição ativa, então a API retorna 409 com mensagem 'Usuário já inscrito neste evento'.
- [ ] Quando o evento já atingiu o limite definido em capacity, então a API retorna 422 com mensagem 'Capacidade máxima do evento atingida'.
- [ ] Quando o eventId informado não existe na tabela events, então a API retorna 404 com mensagem 'Evento não encontrado'.
- [ ] Quando a requisição não possui token de autenticação válido no header Authorization, então a API retorna 401 com mensagem 'Token inválido ou ausente'.

**Especificidade técnica:**
- Códigos HTTP: 201, 409, 422, 404, 401
- Campos: `userId`, `eventId`, `status`, `createdAt`
- Limites: capacidade máxima definida pelo campo capacity do evento
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-32 (ver requirements.json)

---

### [Sprint 8] Registrar e exibir histórico de participação em eventos
<!-- sdd-bot:meta id="BL-184" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-34" dependsOn="REQ-32" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-32

**Descrição:**
Criar endpoint GET /users/:id/participacoes que consulta a tabela participacoes filtrando por userId, retornando os eventos associados via join com a tabela events (title, date, location, status). Restringir acesso para que o usuário só consulte o próprio histórico, salvo quando a role for DIRETORIA.

**Comportamento esperado:**
Usuário visualiza a lista de eventos em que já se inscreveu, com status de cada participação, ordenada pela data do evento.

**Critérios de aceite:**
- [ ] Quando o usuário autenticado chama GET /users/:id/participacoes com seu próprio id, então a API retorna 200 com a lista de participações ordenada por date decrescente.
- [ ] Quando um usuário sem role DIRETORIA tenta consultar o histórico de outro userId, então a API retorna 403 com mensagem 'Acesso não autorizado ao histórico de outro usuário'.
- [ ] Quando o usuário consultado não possui nenhuma participação registrada, então a API retorna 200 com um array vazio.
- [ ] Quando um usuário com role DIRETORIA consulta GET /users/:id/participacoes de qualquer userId, então a API retorna 200 com a lista de participações correspondente ao userId informado.
- [ ] Quando o userId informado na URL não existe na tabela users, então a API retorna 404 com mensagem 'Usuário não encontrado'.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404
- Campos: `userId`, `eventId`, `status`, `title`, `date`, `location`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-34 (ver requirements.json)

---

### [Sprint 8] Modelar entidades ORM Produto, Venda, Evento, Participacao e Loja
<!-- sdd-bot:meta id="BL-185" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-94" dependsOn="REQ-76" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-76

**Descrição:**
Criar as classes de entidade Produto, Venda, Evento, Participacao e Loja no módulo de persistência, aplicando decorators @Entity, @Column e @ManyToOne/@OneToMany conforme o padrão já usado nas entidades existentes (seguindo REQ-76). Mapear relacionamentos: Venda ManyToOne Produto e ManyToOne Loja; Participacao ManyToOne Evento e ManyToOne User; Produto ManyToOne Loja. Preservar nomes de colunas, tipos e índices já definidos no modelo relacional atual (ex.: índice único em Participacao(eventId, userId)).

**Comportamento esperado:**
As migrations geradas a partir das entidades criam as tabelas produtos, vendas, eventos, participacoes e lojas com colunas e índices idênticos ao modelo relacional de referência.

**Critérios de aceite:**
- [ ] Quando a migration é executada, então as tabelas produtos, vendas, eventos, participacoes e lojas são criadas com os mesmos nomes de coluna do modelo relacional original.
- [ ] Quando a entidade Participacao é inspecionada, então ela possui índice único composto em (eventId, userId) refletido na migration gerada.
- [ ] Quando a entidade Venda é carregada via ORM, então o relacionamento ManyToOne com Produto e com Loja retorna os objetos relacionados sem lançar exceção de mapeamento.
- [ ] Quando uma coluna obrigatória do modelo relacional original (ex.: capacity em Evento) está ausente na entidade, então a build falha na etapa de validação de schema do ORM.
- [ ] Quando o dry-run da migration é executado sem que a tabela de referência users já exista, então o processo retorna erro explícito de foreign key não resolvida.

**Especificidade técnica:**
- Campos: `Produto`, `Venda`, `Evento`, `Participacao`, `Loja`, `eventId`, `userId`, `capacity`
- Precisa de esclarecimento: sim — Faltam as definições completas de colunas e tipos de cada entidade (ex.: campos de Venda e Loja) presentes no modelo relacional original citado no SDD; sem esse detalhamento não é possível listar todas as colunas e índices exatos a preservar.

**Rastreabilidade:** REQ-94 (ver requirements.json)

---

### [Sprint 8] Listar eventos cadastrados via GET /eventos
<!-- sdd-bot:meta id="BL-186" epic="Endpoints de Eventos" layer="backend" requirementIds="REQ-231" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint GET /eventos no backend, consultando a tabela de eventos e retornando a lista completa de registros cadastrados em formato JSON. O endpoint não exige autenticação e serve como base para as demais operações do módulo de eventos.

**Comportamento esperado:**
Ao chamar GET /eventos, o cliente recebe um array JSON com os eventos cadastrados, incluindo seus atributos (id, nome, descrição, dataHora, local, precoBase, vagas).

**Critérios de aceite:**
- [ ] Quando existirem eventos cadastrados, então GET /eventos retorna 200 com um array JSON contendo todos os eventos e seus campos (id, nome, descricao, dataHora, local, precoBase, vagas).
- [ ] Quando não houver nenhum evento cadastrado, então GET /eventos retorna 200 com um array vazio [].
- [ ] Quando a chamada for feita sem autenticação, então o endpoint responde normalmente com 200, pois a listagem é pública.
- [ ] Quando ocorrer falha de conexão com o banco de dados, então o endpoint retorna 500 com mensagem de erro genérica sem expor detalhes internos.

**Especificidade técnica:**
- Códigos HTTP: 200, 500
- Campos: `/eventos`, `id`, `nome`, `descricao`, `dataHora`, `local`, `precoBase`, `vagas`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-231 (ver requirements.json)

---

### [Sprint 8] Criar evento restrito a usuários DIRETORIA
<!-- sdd-bot:meta id="BL-187" epic="Endpoints de Eventos" layer="backend" requirementIds="REQ-232" dependsOn="REQ-231" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-231

**Descrição:**
Implementar endpoint POST /eventos protegido por verificação de role, aceitando payload com nome, descricao, dataHora, local, precoBase e vagas. O middleware de autorização deve checar se o usuário autenticado possui role DIRETORIA antes de persistir o novo registro na tabela de eventos.

**Comportamento esperado:**
Usuários com role DIRETORIA conseguem criar um evento enviando os dados obrigatórios e recebem o evento criado como resposta; usuários sem essa role são bloqueados.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA enviar POST /eventos com nome, descricao, dataHora, local, precoBase e vagas válidos, então o sistema retorna 201 com o evento criado incluindo seu id.
- [ ] Quando um usuário autenticado sem role DIRETORIA tentar criar um evento, então o sistema retorna 403 com mensagem de erro indicando permissão insuficiente.
- [ ] Quando o payload estiver faltando algum campo obrigatório (nome, descricao, dataHora, local, precoBase ou vagas), então o sistema retorna 400 com mensagem indicando o(s) campo(s) inválido(s).
- [ ] Quando vagas for enviado com valor menor ou igual a zero, então o sistema retorna 400 com mensagem de erro de validação.
- [ ] Quando a requisição não possuir token de autenticação, então o sistema retorna 401.

**Especificidade técnica:**
- Códigos HTTP: 201, 400, 401, 403
- Campos: `/eventos`, `nome`, `descricao`, `dataHora`, `local`, `precoBase`, `vagas`, `role`
- Limites: vagas deve ser maior que 0
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-232 (ver requirements.json)

---

### [Sprint 8] Inscrever usuário em evento com cálculo de desconto
<!-- sdd-bot:meta id="BL-188" epic="Endpoints de Eventos" layer="backend" requirementIds="REQ-233" dependsOn="REQ-231" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-231

**Descrição:**
Implementar endpoint POST /eventos/{id}/inscricoes que registra a participação do usuário autenticado no evento, aplicando regra de cálculo de precoFinal a partir do precoBase e do percentual de desconto vinculado ao perfil/role do usuário (ex.: sócio), persistindo o registro na tabela de participações vinculado ao usuário e ao evento.

**Comportamento esperado:**
O usuário autenticado consegue se inscrever em um evento existente e recebe confirmação com o preço final calculado já considerando o desconto aplicável ao seu perfil.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado se inscrever em um evento existente com vagas disponíveis, então o sistema retorna 201 com o registro de participação contendo precoBase, desconto e precoFinal calculados.
- [ ] Quando o usuário possuir perfil elegível a desconto (ex.: sócio), então o precoFinal retornado reflete a aplicação do percentual de desconto sobre o precoBase.
- [ ] Quando o usuário não possuir desconto aplicável, então o precoFinal retornado é igual ao precoBase do evento.
- [ ] Quando o eventoId informado não existir, então o sistema retorna 404 com mensagem de evento não encontrado.
- [ ] Quando o evento não possuir vagas disponíveis, então o sistema retorna 409 com mensagem indicando esgotamento de vagas.
- [ ] Quando o usuário já estiver inscrito no mesmo evento, então o sistema retorna 409 com mensagem de inscrição duplicada.

**Especificidade técnica:**
- Códigos HTTP: 201, 404, 409
- Campos: `/eventos/{id}/inscricoes`, `precoBase`, `desconto`, `precoFinal`, `eventoId`, `usuarioId`
- Precisa de esclarecimento: sim — O requisito não especifica o percentual de desconto nem quais roles/perfis são elegíveis a ele; é necessário definir a tabela/regra de desconto por perfil antes da implementação.

**Rastreabilidade:** REQ-233 (ver requirements.json)

---

### [Sprint 8] Listar participações de evento para DIRETORIA
<!-- sdd-bot:meta id="BL-189" epic="Endpoints de Eventos" layer="backend" requirementIds="REQ-234" dependsOn="REQ-232" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-232

**Descrição:**
Implementar endpoint GET /eventos/{id}/participacoes protegido por verificação de role DIRETORIA, consultando a tabela de participações filtradas pelo eventoId e retornando os dados dos usuários inscritos junto com precoFinal e status da inscrição.

**Comportamento esperado:**
Usuários com role DIRETORIA conseguem visualizar a lista de participantes inscritos em um evento específico; usuários sem essa role são bloqueados.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA chamar GET /eventos/{id}/participacoes de um evento com inscrições, então o sistema retorna 200 com array das participações contendo dados do usuário, precoFinal e data de inscrição.
- [ ] Quando o evento não possuir nenhuma inscrição, então o sistema retorna 200 com array vazio [].
- [ ] Quando um usuário autenticado sem role DIRETORIA tentar acessar o endpoint, então o sistema retorna 403 com mensagem de permissão insuficiente.
- [ ] Quando o eventoId informado não existir, então o sistema retorna 404 com mensagem de evento não encontrado.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404
- Campos: `/eventos/{id}/participacoes`, `eventoId`, `usuarioId`, `precoFinal`, `dataInscricao`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-234 (ver requirements.json)

---

### [Sprint 8] Listar eventos inscritos do usuário autenticado
<!-- sdd-bot:meta id="BL-190" epic="Endpoints de Eventos" layer="backend" requirementIds="REQ-235" dependsOn="REQ-233" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-233

**Descrição:**
Implementar endpoint GET /eventos/meus que consulta a tabela de inscrições (event_registrations) filtrando pelo user_id extraído do token JWT/sessão do usuário autenticado, retornando o join com a tabela de eventos correspondente. Requer middleware de autenticação já existente (REQ-233) para extração do usuário.

**Comportamento esperado:**
Usuário autenticado recebe a lista de eventos em que possui inscrição ativa, em ordem cronológica pela data do evento.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado com ao menos uma inscrição chama GET /eventos/meus, então a API retorna 200 com um array JSON contendo os eventos inscritos (id, nome, data, local, status_inscricao).
- [ ] Quando um usuário autenticado não possui nenhuma inscrição, então a API retorna 200 com array vazio [].
- [ ] Quando a requisição não possui token de autenticação válido, então a API retorna 401 com mensagem de erro 'Não autorizado'.
- [ ] Quando um usuário possui inscrições canceladas e ativas, então apenas inscrições com status ativo/confirmado são retornadas na listagem, exceto se um parâmetro de filtro explícito for informado.
- [ ] Quando o token é válido mas o usuário foi removido do sistema, então a API retorna 404 com mensagem 'Usuário não encontrado'.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 404
- Campos: `GET /eventos/meus`, `event_registrations`, `status_inscricao`
- Precisa de esclarecimento: sim — Não está definido se inscrições canceladas devem ser incluídas por padrão na listagem ou se há necessidade de parâmetro de query (ex.: ?status=) para filtrar por status de inscrição.

**Rastreabilidade:** REQ-235 (ver requirements.json)

---

### [Sprint 8] Implementar paginação via page e limit em GET /loja/produtos
<!-- sdd-bot:meta id="BL-191" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-305" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar suporte a query params page e limit no endpoint GET /loja/produtos, aplicando OFFSET/LIMIT (ou equivalente do ORM) na consulta à tabela de produtos, e retornar metadados de paginação (total de itens, total de páginas, página atual) no payload de resposta.

**Comportamento esperado:**
Requisições a GET /loja/produtos com page e limit retornam apenas o subconjunto de produtos correspondente à página solicitada, junto com metadados de paginação.

**Critérios de aceite:**
- [ ] Quando GET /loja/produtos?page=1&limit=10 é chamado, então a API retorna 200 com até 10 produtos e objeto meta contendo total, totalPages e currentPage.
- [ ] Quando nenhum parâmetro page ou limit é informado, então a API aplica valores default definidos (a serem confirmados) e retorna 200.
- [ ] Quando page ou limit recebem valor não numérico ou negativo, então a API retorna 400 com mensagem 'Parâmetros de paginação inválidos'.
- [ ] Quando limit excede o valor máximo permitido, então a API retorna 400 com mensagem indicando o limite máximo permitido.
- [ ] Quando page solicitada excede o total de páginas disponíveis, então a API retorna 200 com array de produtos vazio e os metadados de paginação refletindo o total real.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `GET /loja/produtos`, `page`, `limit`, `total`, `totalPages`, `currentPage`
- Precisa de esclarecimento: sim — Não foi definido o valor default de page/limit nem o valor máximo permitido para limit; esses limites numéricos precisam ser especificados antes da implementação.

**Rastreabilidade:** REQ-305 (ver requirements.json)

---

### [Sprint 9] Garantir p95 de resposta abaixo de 200ms na API
<!-- sdd-bot:meta id="BL-192" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-42" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Instrumentar os endpoints do backend com métricas de latência (ex.: middleware de tracing/APM) para medir o percentil 95 do tempo de resposta por rota. Configurar dashboards e alertas (ex.: Prometheus/Grafana ou serviço equivalente) que capturam a distribuição de latência sob carga real e de teste, incluindo tempo de query ao banco, serialização e overhead de middlewares (auth, validação).

**Comportamento esperado:**
Sob carga de teste equivalente ao volume esperado em produção, o painel de métricas reporta p95 < 200ms para as rotas críticas (autenticação, cadastro, navbar/atlética), e alertas disparam quando o p95 excede o limite.

**Critérios de aceite:**
- [ ] Quando um teste de carga com volume nominal é executado, então o p95 de latência das rotas monitoradas fica abaixo de 200ms.
- [ ] Quando o p95 de uma rota excede 200ms por mais de 5 minutos consecutivos, então um alerta é disparado no sistema de monitoramento.
- [ ] Quando uma requisição individual excede 200ms mas está dentro do percentil aceitável (acima do p95), então ela não gera alerta, apenas é registrada na métrica.
- [ ] Quando o banco de dados apresenta lentidão simulada (ex.: query lenta injetada em teste), então o dashboard evidencia o componente responsável pelo aumento de latência.

**Especificidade técnica:**
- Limites: p95 < 200ms
- Precisa de esclarecimento: sim — Falta definir a ferramenta de APM/monitoramento (ex.: Prometheus, Datadog, New Relic) e o volume/perfil de carga (usuários simultâneos, req/s) usado como baseline para o teste de p95.

**Rastreabilidade:** REQ-42 (ver requirements.json)

---

### [Sprint 9] Garantir disponibilidade de 99.5% do backend
<!-- sdd-bot:meta id="BL-193" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-43" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Configurar infraestrutura de alta disponibilidade (health checks, restart automático de instâncias, redundância/replicação) e monitoramento de uptime (ex.: healthcheck endpoint /health consumido por serviço externo de status) para acompanhar continuamente a disponibilidade do backend. Definir política de deploy (rolling/blue-green) que evite downtime durante releases.

**Comportamento esperado:**
O serviço de monitoramento de uptime registra disponibilidade mensal igual ou superior a 99.5% (equivalente a até ~3h36min de indisponibilidade por mês), com relatórios acessíveis para auditoria.

**Critérios de aceite:**
- [ ] Quando o endpoint de healthcheck (ex.: GET /health) responde 200 OK, então a instância é considerada disponível pelo monitor de uptime.
- [ ] Quando uma instância falha no healthcheck 3 vezes consecutivas, então o orquestrador reinicia ou substitui a instância automaticamente.
- [ ] Quando um deploy é realizado, então não há indisponibilidade percebida pelos clientes (deploy sem downtime via rolling update).
- [ ] Quando o uptime mensal calculado fica abaixo de 99.5%, então o relatório de SLA sinaliza violação com o período e causa registrada.

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `/health`
- Limites: uptime >= 99.5% mensal
- Precisa de esclarecimento: sim — Falta definir a infraestrutura de hospedagem/orquestração (ex.: Kubernetes, ECS, PaaS) e a ferramenta de monitoramento de uptime a ser usada para calcular o SLA.

**Rastreabilidade:** REQ-43 (ver requirements.json)

---

### [Sprint 9] Suportar 1000+ requisições por segundo no backend
<!-- sdd-bot:meta id="BL-194" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-44" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Dimensionar a infraestrutura do backend (escalonamento horizontal, pool de conexões do banco, cache de leituras frequentes) e realizar testes de carga (ex.: k6, JMeter, Gatling) simulando 1000+ req/s distribuídas entre os endpoints principais (auth, cadastro, navbar de atlética). Ajustar configurações de connection pooling, rate limiting e balanceamento de carga conforme os resultados dos testes.

**Comportamento esperado:**
Durante o teste de carga com 1000 req/s sustentadas, o sistema mantém taxa de erro abaixo de 1% e não apresenta degradação de latência acima dos limites definidos no SLA de p95.

**Critérios de aceite:**
- [ ] Quando o sistema recebe carga sustentada de 1000 req/s por pelo menos 5 minutos, então a taxa de erros (5xx/timeout) permanece abaixo de 1%.
- [ ] Quando a carga excede a capacidade configurada (ex.: acima de 1000 req/s), então o sistema aplica rate limiting retornando 429 em vez de falhar com erro 500.
- [ ] Quando o teste de carga é interrompido, então as instâncias escaladas automaticamente retornam ao estado normal (auto-scale down).
- [ ] Quando o pool de conexões do banco atinge o limite configurado sob carga, então requisições excedentes aguardam na fila em vez de falhar imediatamente.

**Especificidade técnica:**
- Códigos HTTP: 429, 500
- Limites: 1000 req/s, taxa de erro < 1%
- Precisa de esclarecimento: sim — Falta definir a ferramenta de teste de carga, a arquitetura de escalonamento (auto-scaling horizontal) e o limite exato do pool de conexões do banco de dados.

**Rastreabilidade:** REQ-44 (ver requirements.json)

---

### [Sprint 9] Implementar autenticação JWT, hash bcrypt e anti-SQL injection
<!-- sdd-bot:meta id="BL-195" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-45" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar geração e validação de tokens JWT no fluxo de login (endpoint POST /auth/login), com assinatura via chave secreta/algoritmo definido (ex.: HS256) e expiração configurada. Armazenar senhas de usuários com hash bcrypt (custo/salt configurável) no lugar de texto plano ou hash fraco. Garantir que todas as queries ao banco usem parametrização/prepared statements (via ORM ou driver com bind parameters) para eliminar vetores de SQL injection nos endpoints de autenticação e cadastro.

**Comportamento esperado:**
Usuários autenticam-se recebendo um JWT válido, senhas nunca são armazenadas ou logadas em texto plano, e tentativas de injeção de SQL nos campos de entrada não alteram o comportamento das queries nem retornam dados não autorizados.

**Critérios de aceite:**
- [ ] Quando um usuário faz login com credenciais válidas em POST /auth/login, então a API retorna 200 com um JWT assinado contendo claims de identificação e expiração.
- [ ] Quando um usuário se cadastra, então a senha é persistida no banco como hash bcrypt e nunca em texto plano.
- [ ] Quando um JWT expirado ou com assinatura inválida é enviado em uma rota protegida, então a API retorna 401 com mensagem de erro "Token inválido ou expirado".
- [ ] Quando um payload contendo tentativa de SQL injection (ex.: `' OR '1'='1`) é enviado em campo de login ou cadastro, então a query é executada de forma parametrizada e a operação falha com 401/400 sem expor dados de outros usuários.
- [ ] Quando credenciais inválidas são enviadas em POST /auth/login, então a API retorna 401 sem revelar se o erro foi usuário ou senha incorretos.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 400
- Campos: `POST /auth/login`, `JWT`, `bcrypt hash`
- Precisa de esclarecimento: sim — Falta definir o algoritmo de assinatura JWT (ex.: HS256 vs RS256), o tempo de expiração do token e o custo (rounds) do bcrypt a ser usado.

**Rastreabilidade:** REQ-45 (ver requirements.json)

---

### [Sprint 9] Tornar backend stateless para escalar horizontalmente
<!-- sdd-bot:meta id="BL-196" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-47" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Remover armazenamento de estado de sessão em memória local do processo backend (ex.: sessões HTTP, cache local não compartilhado) e migrar autenticação para JWT sem sessão server-side, garantindo que qualquer instância do backend possa atender qualquer requisição sem afinidade de sessão (sticky session). Configurações e caches compartilhados, se necessários, devem residir em armazenamento externo (ex.: Redis) e não em memória local do processo.

**Comportamento esperado:**
O sistema atende requisições de um mesmo usuário de forma equivalente independentemente de qual instância do backend processa cada requisição, sem exigir roteamento fixo por sessão.

**Critérios de aceite:**
- [ ] Quando duas instâncias distintas do backend processam requisições consecutivas do mesmo usuário autenticado via JWT, então ambas retornam HTTP 200 com o mesmo payload de dados do usuário sem erro de sessão inválida.
- [ ] Quando uma instância do backend é reiniciada ou removida, então requisições subsequentes autenticadas com o mesmo JWT continuam sendo processadas por outra instância com HTTP 200, sem exigir novo login.
- [ ] Quando o balanceador de carga distribui requisições sem sticky session entre 2 ou mais instâncias, então nenhuma requisição retorna HTTP 401 ou HTTP 500 por ausência de estado local (ex.: 'session not found').
- [ ] Quando o código é inspecionado, então não há variáveis de instância ou cache em memória do processo usadas para armazenar estado de sessão de usuário entre requisições.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 500
- Precisa de esclarecimento: sim — Não está definido se haverá cache compartilhado externo (ex.: Redis) para outros dados de aplicação, nem o mecanismo de balanceamento de carga a ser usado em produção.

**Rastreabilidade:** REQ-47 (ver requirements.json)

---

### [Sprint 9] Criptografar CPF em repouso no banco de dados
<!-- sdd-bot:meta id="BL-197" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-50" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar criptografia do campo CPF antes de persistir no banco de dados (ex.: coluna 'cpf' na tabela de usuários), usando algoritmo de criptografia simétrica autenticada (ex.: AES-256-GCM) com chave gerenciada fora do código-fonte (variável de ambiente ou serviço de gerenciamento de chaves). O valor armazenado no banco deve ser o ciphertext, e a decriptação deve ocorrer apenas em memória, sob demanda, no momento de uso pela aplicação.

**Comportamento esperado:**
O CPF nunca é gravado em texto plano no banco de dados; qualquer consulta direta à tabela retorna apenas o valor criptografado.

**Critérios de aceite:**
- [ ] Quando um novo usuário é cadastrado com CPF válido, então o valor persistido na coluna 'cpf' da tabela de usuários é o ciphertext AES-256-GCM, não o CPF em texto plano.
- [ ] Quando a API retorna os dados do usuário autenticado (ex.: endpoint GET /usuarios/me), então o CPF é decriptado em memória e retornado em texto plano ao cliente autorizado com HTTP 200.
- [ ] Quando a chave de criptografia configurada está ausente ou inválida no momento do cadastro, então o sistema retorna HTTP 500 e não persiste o registro sem criptografia.
- [ ] Quando um dump ou consulta SQL direta é feita na tabela de usuários, então o campo 'cpf' não corresponde ao formato de CPF (000.000.000-00) em nenhum registro.

**Especificidade técnica:**
- Códigos HTTP: 200, 500
- Campos: `cpf`
- Precisa de esclarecimento: sim — Não foi especificado o algoritmo de criptografia exato nem o mecanismo de gerenciamento de chaves (KMS, variável de ambiente, HashiCorp Vault); assumido AES-256-GCM como referência a confirmar.

**Rastreabilidade:** REQ-50 (ver requirements.json)

---

### [Sprint 9] Mascarar CPF em mensagens de log da aplicação
<!-- sdd-bot:meta id="BL-198" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-51" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar filtro/interceptador no serviço de logging (ex.: middleware de log ou formatter do logger da aplicação) que detecta valores de CPF em mensagens de log — seja por nome de campo ('cpf') ou por padrão regex de formato de CPF (000.000.000-00 ou 00000000000) — e substitui os dígitos centrais por máscara antes de a mensagem ser escrita em disco ou enviada a serviço externo de log.

**Comportamento esperado:**
Nenhuma entrada de log gravada pela aplicação contém o CPF completo em texto plano; o valor aparece parcialmente oculto.

**Critérios de aceite:**
- [ ] Quando o backend registra um log contendo o campo 'cpf' com valor '123.456.789-00', então a entrada gravada exibe '123.***.**9-00' (ou máscara equivalente ocultando os 6 dígitos centrais).
- [ ] Quando uma exceção não tratada inclui o CPF no stack trace ou payload da requisição, então o logger aplica a mesma máscara antes de persistir o log.
- [ ] Quando um log não contém CPF, então a mensagem é gravada sem nenhuma alteração pelo filtro de mascaramento.
- [ ] Quando os arquivos de log são inspecionados via grep pelo padrão de CPF completo (\d{3}\.\d{3}\.\d{3}-\d{2}), então nenhuma ocorrência é encontrada.

**Especificidade técnica:**
- Campos: `cpf`
- Precisa de esclarecimento: sim — Não está definido o formato exato da máscara (quantos dígitos ocultar) nem se o mascaramento deve cobrir CPF sem formatação (apenas 11 dígitos numéricos).

**Rastreabilidade:** REQ-51 (ver requirements.json)

---

### [Sprint 9] Documentar e aplicar base legal LGPD para dados pessoais
<!-- sdd-bot:meta id="BL-199" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-52" dependsOn="" -->
**Tipo:** docs
**Prioridade:** must

**Descrição:**
Criar documento formal (ex.: arquivo 'BASE_LEGAL_LGPD.md' ou seção no SDD) descrevendo, para cada categoria de dado pessoal tratado pelo sistema (ex.: CPF, e-mail, nome), a base legal aplicável conforme art. 7º da LGPD (ex.: execução de contrato, consentimento, cumprimento de obrigação legal), a finalidade do tratamento e o tempo de retenção. Aplicar essa base legal no fluxo de cadastro, vinculando a coleta de CPF a uma finalidade explícita registrada no momento do consentimento (ex.: checkbox de aceite de termos no formulário de registro).

**Comportamento esperado:**
Existe documentação rastreável associando cada dado pessoal coletado a uma base legal específica, e o cadastro de usuário exige registro do consentimento antes de persistir o CPF.

**Critérios de aceite:**
- [ ] Quando o documento de base legal é consultado, então ele lista, para o campo CPF, a base legal aplicável, a finalidade do tratamento e o prazo de retenção definidos.
- [ ] Quando um usuário realiza o cadastro sem marcar o checkbox de aceite dos termos de tratamento de dados, então o endpoint de registro retorna HTTP 400 com mensagem de erro indicando consentimento obrigatório e não persiste o CPF.
- [ ] Quando um usuário conclui o cadastro com o checkbox de aceite marcado, então o registro do consentimento (data/hora e versão dos termos aceitos) é persistido junto ao cadastro do usuário.
- [ ] Quando a documentação é revisada por um auditor, então cada campo de dado pessoal coletado no formulário de registro tem uma base legal correspondente documentada, sem campos órfãos.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `cpf`, `aceite_termos`
- Precisa de esclarecimento: sim — Não foi definida a base legal específica a ser adotada (consentimento vs. execução de contrato) nem o prazo de retenção dos dados, o que precisa ser decidido com jurídico/DPO antes da implementação.

**Rastreabilidade:** REQ-52 (ver requirements.json)

---

### [Sprint 9] Criar endpoint de exclusão de dados pessoais (LGPD)
<!-- sdd-bot:meta id="BL-200" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-53" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar endpoint DELETE /api/users/me/dados-pessoais (ou /api/users/{id} conforme padrão de rotas existente) que, mediante autenticação JWT do próprio titular, remove ou anonimiza os dados pessoais do usuário nas tabelas relacionadas (users, cpf, endereço, etc.), registrando log de auditoria da operação com timestamp e id do solicitante. A exclusão deve respeitar vínculos com registros que exigem retenção legal (ex.: histórico financeiro), aplicando anonimização nesses casos em vez de exclusão física.

**Comportamento esperado:**
Usuário autenticado consegue solicitar a exclusão dos próprios dados pessoais e recebe confirmação de que a operação foi processada, sem conseguir mais acessar o próprio perfil com os dados originais.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado envia DELETE para /api/users/me/dados-pessoais com JWT válido, então o sistema retorna 200 com corpo { "status": "processado" } e os dados pessoais (nome, CPF, e-mail, endereço) são removidos ou anonimizados no banco.
- [ ] Quando a requisição não possui JWT válido, então o sistema retorna 401 Unauthorized.
- [ ] Quando o usuário tenta excluir dados de outro usuário (id diferente do titular do token), então o sistema retorna 403 Forbidden.
- [ ] Quando existem registros vinculados que exigem retenção legal, então o sistema anonimiza os campos identificadores nesses registros em vez de excluí-los fisicamente e retorna 200 informando essa condição no corpo da resposta.
- [ ] Quando a exclusão é concluída, então o sistema grava um registro de auditoria contendo userId, timestamp e ação executada.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `/api/users/me/dados-pessoais`, `userId`, `timestamp`
- Precisa de esclarecimento: sim — Não está definido se a exclusão deve ser física (hard delete) ou anonimização, e quais tabelas/registros têm retenção legal obrigatória (ex.: dados financeiros, logs de transação). É necessário mapear o modelo de dados para decidir a estratégia por tabela.

**Rastreabilidade:** REQ-53 (ver requirements.json)

---

### [Sprint 9] Impor HTTPS e autenticação JWT em todas as rotas da API
<!-- sdd-bot:meta id="BL-201" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-55" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Configurar o servidor backend para aceitar apenas conexões via HTTPS (redirecionar ou rejeitar requisições HTTP), e implementar middleware de verificação de token JWT (assinatura, expiração e claims) aplicado a todas as rotas protegidas, integrando com o serviço de emissão de token já existente/planejado no fluxo de login (bcrypt para hash de senha).

**Comportamento esperado:**
Toda comunicação entre frontend e backend ocorre exclusivamente sobre HTTPS, e requisições a rotas protegidas só são processadas quando acompanhadas de um JWT válido no header Authorization.

**Critérios de aceite:**
- [ ] Quando uma requisição chega ao servidor via HTTP puro, então o sistema redireciona para HTTPS (301) ou rejeita a conexão, conforme configuração do ambiente.
- [ ] Quando uma rota protegida recebe um JWT válido e não expirado no header 'Authorization: Bearer <token>', então a requisição é processada normalmente e retorna o status esperado da rota.
- [ ] Quando o JWT está ausente, então o sistema retorna 401 Unauthorized com mensagem 'Token não fornecido'.
- [ ] Quando o JWT está expirado ou possui assinatura inválida, então o sistema retorna 401 Unauthorized com mensagem 'Token inválido ou expirado'.
- [ ] Quando o JWT é válido mas o usuário não tem permissão para o recurso solicitado, então o sistema retorna 403 Forbidden.

**Especificidade técnica:**
- Códigos HTTP: 301, 401, 403
- Campos: `Authorization`, `Bearer <token>`
- Precisa de esclarecimento: sim — Não está definido o tempo de expiração do JWT nem se haverá refresh token; é preciso decidir o TTL do access token e a estratégia de renovação.

**Rastreabilidade:** REQ-55 (ver requirements.json)

---

### [Sprint 9] Coletar consentimento LGPD e finalidade no cadastro
<!-- sdd-bot:meta id="BL-202" epic="8.4 Proteção de Dado Pessoal Sensível (CPF)" layer="backend" requirementIds="REQ-248" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar ao endpoint de cadastro (POST /api/auth/register ou equivalente) um campo obrigatório consentimentoLgpd (boolean) que registra a aceitação explícita do usuário, vinculado a um texto de finalidade de uso de dados pessoais (especialmente CPF) armazenado versionado na tabela de consentimentos, associando a aceitação ao userId, timestamp e versão do texto de política aceito.

**Comportamento esperado:**
O usuário só consegue concluir o cadastro após marcar explicitamente o consentimento para uso de seus dados pessoais, e o sistema mantém registro auditável dessa aceitação.

**Critérios de aceite:**
- [ ] Quando o cadastro é enviado com consentimentoLgpd = true, então o sistema cria o usuário e grava um registro em consent_log com userId, timestamp e versão da política aceita.
- [ ] Quando o cadastro é enviado sem o campo consentimentoLgpd ou com valor false, então o sistema retorna 400 Bad Request com mensagem 'Consentimento para uso de dados pessoais é obrigatório'.
- [ ] Quando o cadastro é bem-sucedido, então a resposta 201 inclui a data e versão da política de finalidade que o usuário aceitou.
- [ ] Quando o usuário consulta seu perfil após o cadastro, então o sistema expõe o histórico de consentimento (data e versão aceita) via endpoint GET /api/users/me/consentimento.

**Especificidade técnica:**
- Códigos HTTP: 201, 400
- Campos: `consentimentoLgpd`, `consent_log`, `userId`, `GET /api/users/me/consentimento`
- Precisa de esclarecimento: sim — Não está definido o texto exato da finalidade de uso do CPF nem o mecanismo de versionamento da política de privacidade (ex.: tabela separada com versões incrementais). É necessário definir junto à área jurídica/produto o conteúdo e formato de versionamento.

**Rastreabilidade:** REQ-248 (ver requirements.json)

---

### [Sprint 10] Mascarar CPF em logs registrando apenas userId
<!-- sdd-bot:meta id="BL-203" epic="8.4 Proteção de Dado Pessoal Sensível (CPF)" layer="backend" requirementIds="REQ-246" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar um interceptor/logger customizado no backend (camada de logging estruturado) que substitui qualquer campo 'cpf' presente em payloads, params, query strings ou objetos de erro antes da gravação no log, registrando exclusivamente o campo 'userId' do usuário associado. Deve haver uma função utilitária de sanitização (ex.: sanitizeLogPayload) aplicada em todos os pontos de log (requests, responses, exceptions) que percorre o objeto recursivamente e remove/mascara chaves sensíveis como 'cpf', 'CPF', 'documento'.

**Comportamento esperado:**
Nenhum log gerado pelo sistema contém o CPF em texto claro; todos os registros de log relacionados a operações de usuário exibem apenas o userId.

**Critérios de aceite:**
- [ ] Quando uma requisição contém o campo 'cpf' no body, então o log gerado registra apenas 'userId' e o campo 'cpf' é omitido ou substituído por '***'.
- [ ] Quando ocorre uma exceção durante o processamento de dados do usuário, então a stack trace e o log de erro não exibem o valor do CPF em nenhum formato.
- [ ] Quando o CPF aparece aninhado em objetos complexos (ex.: dentro de um array de usuários), então a sanitização recursiva também mascara esses valores antes do log.
- [ ] Quando um log não possui nenhum dado de usuário, então o comportamento de logging permanece inalterado, sem impacto em performance perceptível.

**Especificidade técnica:**
- Campos: `cpf`, `userId`
- Precisa de esclarecimento: sim — Não foi definido se o mascaramento deve ser total (remoção do campo) ou parcial (ex.: exibir últimos 2 dígitos); decisão técnica de padrão de mascaramento pendente.

**Rastreabilidade:** REQ-246 (ver requirements.json)

---

### [Sprint 10] Anonimizar dados do titular com histórico financeiro
<!-- sdd-bot:meta id="BL-204" epic="8.4 Proteção de Dado Pessoal Sensível (CPF)" layer="backend" requirementIds="REQ-250" dependsOn="REQ-53" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-53

**Descrição:**
No serviço/endpoint responsável pela exclusão de usuário (dependente de REQ-53), implementar lógica que, antes de executar a exclusão física, verifica na tabela de vendas/transações e na tabela de participações se existem registros vinculados ao userId. Caso existam, substituir os campos de identificação pessoal (nome, CPF, e-mail, telefone) por valores anonimizados (ex.: hash irreversível ou placeholder 'ANONIMIZADO') via UPDATE na tabela de usuários, mantendo o registro e suas chaves estrangeiras íntegras para preservar o histórico financeiro. Caso não existam vínculos, prosseguir com a exclusão física (DELETE) do registro.

**Comportamento esperado:**
Usuários com histórico financeiro permanecem no banco com dados pessoais irreconhecíveis, enquanto usuários sem histórico são removidos definitivamente do banco.

**Critérios de aceite:**
- [ ] Quando o usuário a ser excluído possui ao menos uma venda ou participação vinculada, então o sistema anonimiza os campos nome, CPF, e-mail e telefone em vez de executar DELETE.
- [ ] Quando o usuário a ser excluído não possui nenhum histórico financeiro, então o sistema executa a exclusão física do registro na tabela de usuários.
- [ ] Quando a anonimização é concluída, então uma nova tentativa de busca do usuário pelo CPF original retorna 404 Not Found, mas o histórico de vendas permanece consultável via userId.
- [ ] Quando o processo de anonimização falha por erro de banco (ex.: violação de constraint), então a operação é revertida via transação e retorna 500 Internal Server Error sem deixar dado parcialmente anonimizado.

**Especificidade técnica:**
- Códigos HTTP: 404, 500
- Campos: `nome`, `cpf`, `email`, `telefone`, `userId`
- Precisa de esclarecimento: sim — Não foi especificado o algoritmo/formato exato de anonimização (hash SHA-256, placeholder fixo, etc.) nem se e-mail/telefone entram no escopo além do CPF citado no SDD.

**Rastreabilidade:** REQ-250 (ver requirements.json)

---

### [Sprint 10] Parametrizar queries do TypeORM contra SQL Injection
<!-- sdd-bot:meta id="BL-205" epic="8.5 Proteção contra Ataques Comuns" layer="backend" requirementIds="REQ-251" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Revisar todos os repositórios e serviços do backend que executam consultas ao banco, substituindo qualquer uso de query raw com concatenação de string por QueryBuilder do TypeORM ou métodos da Repository API (find, findOne, save, etc.) com parâmetros bindados (ex.: .where('cpf = :cpf', { cpf })). Adicionar regra de lint (ex.: eslint rule customizada ou revisão manual) para impedir merge de código com template strings interpoladas diretamente em métodos query()/manager.query().

**Comportamento esperado:**
Nenhuma consulta SQL no sistema é construída por concatenação de string; todas aceitam entrada de usuário apenas via parâmetros bindados, eliminando a superfície de injeção de SQL.

**Critérios de aceite:**
- [ ] Quando um endpoint recebe um parâmetro de busca contendo caracteres típicos de SQL Injection (ex.: ' OR '1'='1), então a query é executada de forma parametrizada e não altera o comportamento esperado da consulta.
- [ ] Quando o código é revisado, então nenhuma ocorrência de manager.query() ou query() com template string interpolando variável de entrada do usuário é encontrada no repositório.
- [ ] Quando uma consulta usa QueryBuilder, então os valores dinâmicos são passados via objeto de parâmetros (ex.: setParameter) e não via concatenação direta na string SQL.
- [ ] Quando um teste automatizado simula payload malicioso em um campo de filtro, então a resposta retorna 200 ou 400 conforme validação de negócio, nunca expõe dados fora do escopo autorizado.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `QueryBuilder`, `Repository API`, `manager.query()`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-251 (ver requirements.json)

---

### [Sprint 10] Configurar CORS e JWT stateless contra CSRF
<!-- sdd-bot:meta id="BL-206" epic="8.5 Proteção contra Ataques Comuns" layer="backend" requirementIds="REQ-252" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Configurar o middleware de CORS no backend (ex.: pacote cors do NestJS/Express) para restringir origin a domínios explicitamente permitidos, com credentials desabilitado por padrão, e garantir que a autenticação seja feita exclusivamente via header Authorization: Bearer <JWT>, sem uso de cookies de sessão. Remover qualquer configuração existente que dependa de cookies para autenticação (ex.: session middleware, cookie-parser usado para auth) e validar que nenhum endpoint aceita token via cookie.

**Comportamento esperado:**
Requisições autenticadas dependem exclusivamente do header Authorization com JWT, e requisições de origens não autorizadas são bloqueadas pela política de CORS, eliminando o vetor de ataque CSRF baseado em cookies.

**Critérios de aceite:**
- [ ] Quando uma requisição é feita a partir de uma origem não listada na whitelist de CORS, então o servidor retorna 403 Forbidden ou bloqueia a resposta via cabeçalho Access-Control-Allow-Origin ausente.
- [ ] Quando um cliente autenticado envia o JWT via header Authorization, então a requisição é processada normalmente com 200 OK.
- [ ] Quando uma requisição tenta autenticar via cookie de sessão (sem header Authorization), então o servidor retorna 401 Unauthorized.
- [ ] Quando uma requisição OPTIONS de preflight é enviada, então o servidor responde com os headers CORS configurados (Access-Control-Allow-Methods, Access-Control-Allow-Headers) sem expor credentials para origens não confiáveis.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `Authorization`, `Access-Control-Allow-Origin`, `JWT`
- Precisa de esclarecimento: sim — Lista exata de domínios/origens permitidas no whitelist de CORS não foi especificada no requisito.

**Rastreabilidade:** REQ-252 (ver requirements.json)

---

### [Sprint 10] Sanitizar renderização React e validar entradas com Zod
<!-- sdd-bot:meta id="BL-207" epic="8.5 Proteção contra Ataques Comuns" layer="backend" requirementIds="REQ-253" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar sanitização de conteúdo dinâmico renderizado no frontend React (evitando uso de dangerouslySetInnerHTML sem sanitização, escapando HTML/JS em campos exibidos a partir de dados de usuário) e adicionar schemas Zod para validação de todos os payloads de entrada nos endpoints do backend antes do processamento, rejeitando dados que não conformem ao schema.

**Comportamento esperado:**
Conteúdo malicioso injetado em campos de texto (ex: <script>alert(1)</script>) não é executado ao ser renderizado na interface, e requisições com payload fora do schema Zod são rejeitadas antes de chegar à lógica de negócio.

**Critérios de aceite:**
- [ ] Quando um usuário submete um campo de texto contendo tag <script> ou atributo onerror, então o valor é renderizado como texto literal na tela, sem execução de script.
- [ ] Quando uma requisição chega a um endpoint com um campo obrigatório ausente no schema Zod, então a API retorna 400 com corpo {"error": "ValidationError", "details": [...]}.
- [ ] Quando uma requisição chega com um campo de tipo incorreto (ex: string onde se espera number), então a API retorna 400 com a mensagem do campo específico que falhou na validação.
- [ ] Quando o payload está em conformidade com o schema Zod, então a requisição prossegue normalmente para a camada de serviço.
- [ ] Quando dados vindos de API são exibidos em componentes React via interpolação de string, então nenhum HTML é interpretado, apenas texto puro.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `error`, `details`
- Precisa de esclarecimento: sim — Não foi especificado se a sanitização adicional deve usar biblioteca como DOMPurify para casos onde HTML é intencionalmente permitido (ex: editor rich text), nem a lista completa de endpoints que devem receber schema Zod.

**Rastreabilidade:** REQ-253 (ver requirements.json)

---

### [Sprint 10] Aplicar rate limiting nos endpoints de login e registro
<!-- sdd-bot:meta id="BL-208" epic="8.5 Proteção contra Ataques Comuns" layer="backend" requirementIds="REQ-254" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar middleware de rate limiting nos endpoints /auth/login e /auth/register/* que rastreia número de requisições por IP (ou por identificador de conta) em uma janela de tempo deslizante, bloqueando temporariamente requisições excedentes para mitigar ataques de força bruta.

**Comportamento esperado:**
Após exceder o limite de tentativas configurado dentro da janela de tempo, novas requisições ao mesmo endpoint retornam erro de limite excedido até a janela expirar.

**Critérios de aceite:**
- [ ] Quando um IP realiza requisições dentro do limite permitido na janela de tempo, então as requisições são processadas normalmente.
- [ ] Quando um IP excede o limite de requisições configurado para /auth/login dentro da janela de tempo, então a API retorna 429 com corpo {"error": "TooManyRequests"} e header Retry-After.
- [ ] Quando um IP excede o limite em /auth/register, então a mesma resposta 429 com Retry-After é aplicada de forma independente ao contador de /auth/login.
- [ ] Quando a janela de tempo expira, então o contador de requisições do IP é reiniciado e novas tentativas são aceitas normalmente.

**Especificidade técnica:**
- Códigos HTTP: 429
- Campos: `error`, `Retry-After`
- Precisa de esclarecimento: sim — Não foi definido o número máximo de tentativas permitidas nem o tamanho da janela de tempo (ex: 5 tentativas por 15 minutos) — decisão técnica pendente de definição com o time.

**Rastreabilidade:** REQ-254 (ver requirements.json)

---

### [Sprint 10] Armazenar senhas com hash bcrypt de 10 rounds
<!-- sdd-bot:meta id="BL-209" epic="8.5 Proteção contra Ataques Comuns" layer="backend" requirementIds="REQ-255" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Substituir/garantir que o fluxo de criação e atualização de senha utilize bcrypt com fator de custo (salt rounds) igual a 10 para gerar o hash armazenado na coluna de senha da tabela de usuários, eliminando qualquer caminho de código que grave senha em texto plano.

**Comportamento esperado:**
A senha do usuário nunca é persistida em texto plano no banco de dados; apenas o hash bcrypt gerado com 10 rounds é armazenado e utilizado na autenticação.

**Critérios de aceite:**
- [ ] Quando um usuário é cadastrado com uma senha, então o valor armazenado na coluna de senha corresponde a um hash bcrypt gerado com 10 rounds (prefixo $2b$10$).
- [ ] Quando um usuário atualiza sua senha, então o novo valor também é armazenado como hash bcrypt com 10 rounds, substituindo o hash anterior.
- [ ] Quando um login é tentado, então a senha informada é comparada usando bcrypt.compare contra o hash armazenado, e credenciais corretas retornam 200 com token de autenticação.
- [ ] Quando uma senha incorreta é informada no login, então a API retorna 401 com corpo {"error": "InvalidCredentials"}.
- [ ] Quando o banco de dados é inspecionado diretamente, então nenhuma senha em texto plano é encontrada em nenhuma tabela ou log.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `error`
- Limites: 10 rounds
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-255 (ver requirements.json)

---

### [Sprint 10] Forçar HTTPS obrigatório com certificado válido em produção
<!-- sdd-bot:meta id="BL-210" epic="8.6 HTTPS" layer="backend" requirementIds="REQ-256" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Configurar o servidor/proxy reverso em produção para redirecionar todo tráfego HTTP para HTTPS (redirect 301) e instalar/renovar certificado SSL/TLS válido, além de adicionar header HSTS (Strict-Transport-Security) nas respostas para reforçar o uso exclusivo de conexão segura.

**Comportamento esperado:**
Todas as requisições feitas via HTTP em produção são redirecionadas automaticamente para HTTPS, e a conexão é estabelecida com certificado SSL/TLS válido reconhecido pelo navegador, sem avisos de segurança.

**Critérios de aceite:**
- [ ] Quando uma requisição é feita para http://dominio em produção, então o servidor responde com 301 e header Location apontando para a versão https do mesmo recurso.
- [ ] Quando uma requisição é feita via HTTPS, então a resposta inclui o header Strict-Transport-Security com diretiva max-age configurada.
- [ ] Quando o certificado SSL/TLS é verificado por ferramenta como SSL Labs ou pelo navegador, então nenhum aviso de certificado inválido, expirado ou autoassinado é exibido.
- [ ] Quando o certificado está próximo da expiração, então o processo de renovação automática (ex: via Let's Encrypt/Certbot) é acionado antes do vencimento.

**Especificidade técnica:**
- Códigos HTTP: 301
- Campos: `Location`, `Strict-Transport-Security`
- Precisa de esclarecimento: sim — Não foi especificado o provedor de certificado (Let's Encrypt, ACM, etc.) nem o valor de max-age do header HSTS a ser utilizado.

**Rastreabilidade:** REQ-256 (ver requirements.json)

---

### [Sprint 10] Migrar banco de produção para PostgreSQL gerenciado
<!-- sdd-bot:meta id="BL-211" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-312" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** must

**Descrição:**
Provisionar instância de PostgreSQL gerenciado (ex.: RDS, Cloud SQL ou equivalente) para o ambiente de produção, configurar a connection string do backend (variável DATABASE_URL) apontando para a instância gerenciada, habilitar SSL na conexão e migrar o schema/dados existentes via scripts de migration já presentes no projeto.

**Comportamento esperado:**
O backend em produção conecta-se exclusivamente à instância PostgreSQL gerenciada, sem uso de banco local ou não gerenciado, e todas as queries são executadas por essa conexão.

**Critérios de aceite:**
- [ ] Quando o backend inicializar em produção, então a variável DATABASE_URL deve apontar para o host da instância PostgreSQL gerenciada e não para localhost ou container local.
- [ ] Quando a conexão for estabelecida, então deve usar SSL (sslmode=require) e recusar conexões sem criptografia.
- [ ] Quando as migrations forem executadas contra a instância gerenciada, então todas as tabelas do schema atual devem existir com a mesma estrutura da versão anterior local.
- [ ] Quando a instância gerenciada estiver indisponível, então o backend deve responder o endpoint /health com status 503 em até 5 segundos.

**Especificidade técnica:**
- Códigos HTTP: 503
- Campos: `DATABASE_URL`, `/health`
- Limites: timeout de 5 segundos para health check
- Precisa de esclarecimento: sim — Não foi especificado o provedor exato (AWS RDS, GCP Cloud SQL, Azure Database, etc.) nem a versão do PostgreSQL a ser usada.

**Rastreabilidade:** REQ-312 (ver requirements.json)

---

### [Sprint 10] Mapear violação de constraint única para HTTP 409
<!-- sdd-bot:meta id="BL-212" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-315" dependsOn="REQ-69" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69

**Descrição:**
Implementar um exception filter (ou middleware de tratamento de erros) que intercepte QueryFailedError do TypeORM/driver de banco, verifique o código de erro do PostgreSQL (23505 - unique_violation) e traduza a resposta HTTP para status 409 Conflict com corpo JSON padronizado, em vez de propagar o erro 500 padrão.

**Comportamento esperado:**
Ao tentar inserir ou atualizar um registro que viole uma constraint única (ex.: CPF ou e-mail duplicado), a API responde com status 409 e uma mensagem de erro identificando o campo conflitante.

**Critérios de aceite:**
- [ ] Quando uma requisição POST tentar criar um registro com um valor já existente em campo com constraint UNIQUE, então a API deve retornar 409 com corpo {"statusCode":409,"message":"Registro duplicado","field":"<nome_do_campo>"}.
- [ ] Quando o QueryFailedError tiver código PostgreSQL diferente de 23505, então o filtro não deve convertê-lo para 409, mantendo o status 500 padrão.
- [ ] Quando a violação de constraint ocorrer em uma atualização (PUT/PATCH), então a resposta também deve ser 409 com o mesmo formato de corpo.
- [ ] Quando o erro 409 for retornado, então o log estruturado deve registrar a query original sem incluir o valor de CPF em texto plano.

**Especificidade técnica:**
- Códigos HTTP: 409, 500
- Campos: `statusCode`, `message`, `field`, `QueryFailedError`, `23505`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-315 (ver requirements.json)

---

### [Sprint 10] Retornar 400 para validação, CPF inválido ou campo ausente
<!-- sdd-bot:meta id="BL-213" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-316" dependsOn="REQ-69" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69

**Descrição:**
Configurar o pipe/validator global (ex.: ValidationPipe do NestJS ou middleware equivalente) para interceptar falhas de validação de DTO, incluindo regra customizada de validação de CPF (dígito verificador) e checagem de campos obrigatórios, retornando resposta padronizada com status 400 em vez de deixar a exceção propagar sem tratamento.

**Comportamento esperado:**
Requisições com CPF em formato ou dígito verificador inválido, ou com campos obrigatórios ausentes/nulos, recebem resposta 400 com lista dos campos que falharam na validação.

**Critérios de aceite:**
- [ ] Quando o campo CPF enviado tiver dígito verificador inválido, então a API deve retornar 400 com corpo {"statusCode":400,"message":"Validação falhou","errors":[{"field":"cpf","reason":"CPF inválido"}]}.
- [ ] Quando um campo obrigatório do DTO estiver ausente ou null, então a API deve retornar 400 listando o nome do campo ausente em errors[].field.
- [ ] Quando todos os campos obrigatórios forem enviados com formato válido, então a API deve retornar o status de sucesso da rota (200 ou 201) e não 400.
- [ ] Quando múltiplos campos falharem na validação simultaneamente, então o array errors deve conter uma entrada para cada campo inválido, não apenas o primeiro.

**Especificidade técnica:**
- Códigos HTTP: 400, 200, 201
- Campos: `statusCode`, `message`, `errors`, `cpf`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-316 (ver requirements.json)

---

### [Sprint 10] Retornar 401 para JWT inválido ou credenciais incorretas
<!-- sdd-bot:meta id="BL-214" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-317" dependsOn="REQ-69" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69

**Descrição:**
Configurar o guard de autenticação (ex.: JwtAuthGuard) para capturar falhas de verificação de assinatura/expiração do token JWT e o serviço de login para capturar falha na comparação de hash de senha, retornando ambos com status HTTP 401 e corpo de erro padronizado, sem detalhar qual credencial especificamente está incorreta.

**Comportamento esperado:**
Requisições com token JWT ausente, expirado ou com assinatura inválida, bem como tentativas de login com e-mail/senha incorretos, recebem resposta 401 com mensagem genérica de não autorizado.

**Critérios de aceite:**
- [ ] Quando o header Authorization contiver um JWT com assinatura inválida, então a API deve retornar 401 com corpo {"statusCode":401,"message":"Não autorizado"}.
- [ ] Quando o JWT estiver expirado (campo exp menor que o timestamp atual), então a API deve retornar 401 com a mesma estrutura de corpo.
- [ ] Quando o login for feito com e-mail existente e senha incorreta, então a API deve retornar 401 sem indicar se o e-mail existe na base.
- [ ] Quando o header Authorization estiver ausente em rota protegida, então a API deve retornar 401 e não 403 ou 500.
- [ ] Quando as credenciais de login estiverem corretas, então a API deve retornar 200 com o token JWT no corpo da resposta.

**Especificidade técnica:**
- Códigos HTTP: 401, 200
- Campos: `statusCode`, `message`, `Authorization`, `exp`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-317 (ver requirements.json)

---

### [Sprint 10] Retornar 403 em acesso negado ou tenant cruzado
<!-- sdd-bot:meta id="BL-215" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-318" dependsOn="REQ-69" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69

**Descrição:**
Implementar middleware/handler global de tratamento de exceções de autorização no backend que intercepte falhas de permissão (RBAC) e tentativas de acesso a recursos de outro tenant, retornando status HTTP 403 com corpo JSON padronizado {"error": "Forbidden", "message": string, "code": "FORBIDDEN"}. Deve reutilizar a camada de autenticação/autorização de REQ-69 para identificar o tenant do usuário autenticado e compará-lo ao tenant do recurso solicitado antes de liberar a operação.

**Comportamento esperado:**
Requisições de usuários sem permissão adequada ou que tentem acessar dados de outro tenant recebem resposta 403 com corpo JSON contendo campo "code": "FORBIDDEN".

**Critérios de aceite:**
- [ ] Quando um usuário autenticado tenta acessar um recurso pertencente a outro tenant, então a API retorna 403 com corpo {"error":"Forbidden","code":"FORBIDDEN"}
- [ ] Quando um usuário autenticado não possui a permissão exigida para a operação (ex.: role incompatível), então a API retorna 403 com o mesmo formato de corpo
- [ ] Quando um usuário autenticado acessa um recurso do próprio tenant com permissão adequada, então a API retorna o status de sucesso original do endpoint (200/201) sem interferência do middleware
- [ ] Quando a requisição não possui token de autenticação válido, então a API retorna 401 Unauthorized e não 403, garantindo que os dois status não sejam confundidos

**Especificidade técnica:**
- Códigos HTTP: 403, 401, 200, 201
- Campos: `error`, `message`, `code`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-318 (ver requirements.json)

---

### [Sprint 10] Retornar 404 para recurso ou atlética inexistente
<!-- sdd-bot:meta id="BL-216" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-319" dependsOn="REQ-69" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69

**Descrição:**
Implementar tratamento centralizado no backend para exceções de "recurso não encontrado", disparadas quando uma consulta por ID/código (incluindo código de atlética) não retorna registro no banco. O handler deve capturar essa exceção em nível de controller/service e responder com status HTTP 404 e corpo JSON padronizado {"error": "Not Found", "message": string, "code": "NOT_FOUND"}, reutilizando a infraestrutura de tratamento de erros de REQ-69.

**Comportamento esperado:**
Requisições que referenciam um ID ou código de atlética inexistente no banco recebem resposta 404 com corpo JSON contendo campo "code": "NOT_FOUND".

**Critérios de aceite:**
- [ ] Quando uma requisição GET busca um recurso por ID que não existe na tabela correspondente, então a API retorna 404 com corpo {"error":"Not Found","code":"NOT_FOUND"}
- [ ] Quando uma requisição referencia um código de atlética inexistente, então a API retorna 404 com o mesmo formato de corpo
- [ ] Quando o recurso existe e pertence ao tenant do usuário, então a API retorna 200 com os dados do recurso
- [ ] Quando o ID informado tem formato inválido (ex.: não numérico onde esperado), então a API retorna 400 Bad Request em vez de 404, distinguindo erro de formato de erro de existência

**Especificidade técnica:**
- Códigos HTTP: 404, 200, 400
- Campos: `error`, `message`, `code`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-319 (ver requirements.json)

---

### [Sprint 10] Retornar 409 em duplicidade de CPF, RGA, e-mail ou estado inválido
<!-- sdd-bot:meta id="BL-217" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-320" dependsOn="REQ-69,REQ-315" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69, REQ-315

**Descrição:**
Implementar tratamento de exceções de conflito no backend, capturando violações de constraint de unicidade (CPF, RGA, e-mail) na camada de persistência e transições de estado inválidas na camada de serviço (conforme regras de máquina de estado de REQ-315). O handler deve mapear essas exceções para status HTTP 409 e corpo JSON padronizado {"error": "Conflict", "message": string, "code": "CONFLICT", "field": string}, indicando no campo "field" qual atributo causou o conflito quando aplicável.

**Comportamento esperado:**
Requisições de criação/atualização com CPF, RGA ou e-mail já cadastrado, ou que violem uma transição de estado válida, recebem resposta 409 com corpo JSON identificando o campo ou motivo do conflito.

**Critérios de aceite:**
- [ ] Quando uma requisição de cadastro envia um CPF já existente no banco, então a API retorna 409 com corpo {"error":"Conflict","code":"CONFLICT","field":"cpf"}
- [ ] Quando uma requisição de cadastro envia um RGA já existente, então a API retorna 409 com "field":"rga"
- [ ] Quando uma requisição de cadastro envia um e-mail já existente, então a API retorna 409 com "field":"email"
- [ ] Quando uma requisição tenta transicionar um recurso para um estado não permitido pela máquina de estados definida em REQ-315, então a API retorna 409 com "code":"CONFLICT" e mensagem descrevendo a transição inválida
- [ ] Quando os dados enviados não colidem com nenhum registro existente e o estado é válido, então a API processa a operação e retorna 201 na criação ou 200 na atualização

**Especificidade técnica:**
- Códigos HTTP: 409, 201, 200
- Campos: `error`, `message`, `code`, `field`, `cpf`, `rga`, `email`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-320 (ver requirements.json)

---

### [Sprint 10] Retornar 500 para exceções não tratadas na API
<!-- sdd-bot:meta id="BL-218" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-321" dependsOn="REQ-69" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-69

**Descrição:**
Implementar um handler global de exceções (fallback) no backend que capture qualquer erro não previsto pelos handlers específicos (403, 404, 409, 400 etc.) e responda com status HTTP 500 e corpo JSON padronizado {"error": "Internal Server Error", "message": "Ocorreu um erro inesperado", "code": "INTERNAL_ERROR"}, sem expor stack trace, mensagem de exceção interna ou dados sensíveis (ex.: CPF) no corpo da resposta. O erro completo deve ser registrado no log estruturado do serviço para investigação.

**Comportamento esperado:**
Qualquer exceção não mapeada por um handler específico resulta em resposta 500 com corpo JSON genérico, sem detalhes internos, enquanto o log do servidor registra o erro completo.

**Critérios de aceite:**
- [ ] Quando ocorre uma exceção não tratada por nenhum handler específico (ex.: NullPointerException, falha de conexão com banco), então a API retorna 500 com corpo {"error":"Internal Server Error","code":"INTERNAL_ERROR"}
- [ ] Quando a resposta 500 é gerada, então o corpo da resposta não contém stack trace, nome de classe de exceção nem CPF ou outros dados sensíveis do usuário
- [ ] Quando a resposta 500 é gerada, então o log estruturado do servidor registra o stack trace completo e o contexto da requisição em nível ERROR
- [ ] Quando uma exceção é mapeada por um handler específico (403, 404, 409, 400), então esse handler responde com o status específico e o fallback de 500 não é acionado

**Especificidade técnica:**
- Códigos HTTP: 500, 403, 404, 409, 400
- Campos: `error`, `message`, `code`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-321 (ver requirements.json)

---

### [Sprint 10] Implementar logging estruturado com níveis log/warn/error
<!-- sdd-bot:meta id="BL-219" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-322" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Integrar biblioteca de logging estruturado (ex.: winston/pino) no backend, configurando os níveis log (info), warn e error. Cada entrada de log deve ser emitida em formato JSON contendo timestamp, nível, mensagem e contexto (módulo/rota de origem). Substituir chamadas de console.log/console.error existentes pelo novo logger em todos os módulos do backend.

**Comportamento esperado:**
Ao executar qualquer rota do backend, as saídas de log aparecem no stdout/arquivo de log como objetos JSON contendo os campos timestamp, level (info/warn/error) e message, sem uso de console.log direto no código.

**Critérios de aceite:**
- [ ] Quando uma operação normal é executada (ex.: requisição GET processada), então é gerado um log com level="info" e campo message preenchido.
- [ ] Quando ocorre uma condição anômala não fatal (ex.: retry de conexão), então é gerado um log com level="warn".
- [ ] Quando uma exceção não tratada ocorre no backend, então é gerado um log com level="error" contendo stack trace no campo details.
- [ ] Quando o log é emitido, então seu formato é um objeto JSON válido com os campos timestamp (ISO 8601), level e message.
- [ ] Quando o código-fonte do backend é inspecionado, então não existem chamadas diretas a console.log ou console.error fora do módulo de logging.

**Especificidade técnica:**
- Campos: `timestamp`, `level`, `message`, `details`
- Precisa de esclarecimento: sim — Não foi especificada a biblioteca de logging a ser adotada (ex.: winston, pino, bunyan) nem o destino final dos logs (arquivo, stdout, serviço externo como ELK/Datadog).

**Rastreabilidade:** REQ-322 (ver requirements.json)

---

### [Sprint 10] Mascarar CPF em texto claro nos logs do backend
<!-- sdd-bot:meta id="BL-220" epic="11. Tratamento de Erros" layer="backend" requirementIds="REQ-323" dependsOn="REQ-322" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-322

**Descrição:**
Adicionar sanitização/mascaramento no logger estruturado (dependente de REQ-322) para interceptar campos identificados como CPF em objetos de log e substituí-los por valor mascarado (ex.: exibindo apenas os 3 últimos dígitos) antes da escrita do log. Aplicar essa sanitização em todos os pontos onde payloads de requisição/resposta ou entidades de usuário são logados.

**Comportamento esperado:**
Ao inspecionar qualquer entrada de log gerada pelo backend, o campo cpf nunca aparece com os 11 dígitos completos em texto claro; aparece mascarado como "***.***.***-XX", mantendo apenas os 2 últimos dígitos visíveis.

**Critérios de aceite:**
- [ ] Quando um objeto contendo o campo cpf é passado ao logger, então o log gravado exibe o valor no formato "***.***.***-XX" com apenas os 2 últimos dígitos visíveis.
- [ ] Quando uma exceção envolvendo dados de usuário é logada em nível error, então o campo cpf no stack/contexto também é mascarado, não apenas em logs de nível info.
- [ ] Quando o CPF é mascarado, então o log resultante continua sendo um JSON válido conforme formato definido em REQ-322.
- [ ] Quando um objeto de log não contém o campo cpf, então nenhuma alteração é aplicada aos demais campos.

**Especificidade técnica:**
- Campos: `cpf`
- Limites: 2 últimos dígitos visíveis
- Precisa de esclarecimento: sim — Não foi definido o padrão exato de mascaramento (quantos dígitos exibir) nem se outros campos sensíveis (e-mail, telefone) também devem ser mascarados nesta mesma rotina.

**Rastreabilidade:** REQ-323 (ver requirements.json)

---

### [Sprint 10] Criptografar CPF armazenado com chave CPF_ENCRYPTION_KEY
<!-- sdd-bot:meta id="BL-221" epic="Deployment" layer="backend" requirementIds="REQ-328" dependsOn="REQ-327" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-327

**Descrição:**
Configurar variável de ambiente CPF_ENCRYPTION_KEY e implementar camada de criptografia simétrica (ex.: AES-256-GCM) aplicada ao campo cpf antes da persistência na tabela de usuários, com descriptografia automática na leitura via serviço/repositório correspondente. A chave não deve ser hardcoded no código-fonte nem versionada em repositório.

**Comportamento esperado:**
Ao consultar diretamente a tabela de usuários no banco de dados, o valor armazenado no campo cpf está em formato criptografado (não legível como número de 11 dígitos), e ao recuperar o dado via serviço da aplicação, o CPF retorna descriptografado e idêntico ao valor original informado no cadastro.

**Critérios de aceite:**
- [ ] Quando um usuário é cadastrado com CPF válido, então o valor persistido na coluna cpf do banco está cifrado e distinto do valor em texto claro original.
- [ ] Quando o serviço de usuário lê um registro existente, então o CPF retornado pela API é igual ao valor original informado no cadastro, após descriptografia.
- [ ] Quando a variável de ambiente CPF_ENCRYPTION_KEY não está definida na inicialização do backend, então a aplicação falha ao subir e registra log de nível error indicando a ausência da chave.
- [ ] Quando dois registros diferentes possuem o mesmo CPF, então os valores criptografados armazenados no banco são distintos entre si (uso de IV/nonce único por operação).

**Especificidade técnica:**
- Campos: `cpf`, `CPF_ENCRYPTION_KEY`
- Precisa de esclarecimento: sim — Não foi especificado o algoritmo de criptografia (ex.: AES-256-GCM) nem o tamanho exigido da chave (ex.: 256 bits) a ser usado para CPF_ENCRYPTION_KEY.

**Rastreabilidade:** REQ-328 (ver requirements.json)

---

### [Sprint 10] Integrar envio de OTP por e-mail via provedor externo
<!-- sdd-bot:meta id="BL-222" epic="Deployment" layer="backend" requirementIds="REQ-329" dependsOn="REQ-327" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-327

**Descrição:**
Implementar cliente HTTP no backend para comunicação com um provedor externo de envio de e-mail transacional (ex.: SendGrid/SES), utilizando chave de API lida de variável de ambiente configurável (ex.: OTP_EMAIL_API_KEY), para disparar o código OTP gerado no fluxo de autenticação/verificação ao endereço de e-mail do usuário.

**Comportamento esperado:**
Ao solicitar um código OTP para um e-mail válido, o usuário recebe uma mensagem no e-mail informado contendo o código dentro do prazo de validade configurado, e o endpoint responsável retorna HTTP 200 confirmando o envio.

**Critérios de aceite:**
- [ ] Quando o endpoint de solicitação de OTP é chamado com um e-mail válido cadastrado, então o backend retorna HTTP 200 e o provedor externo recebe a requisição de envio contendo o código gerado.
- [ ] Quando o provedor externo de e-mail responde com erro (ex.: timeout ou status de falha), então o endpoint retorna HTTP 502 com mensagem "Falha ao enviar código de verificação".
- [ ] Quando a variável de API key do provedor não está configurada na inicialização, então a aplicação registra log de nível error e o endpoint de OTP retorna HTTP 500 com mensagem "Serviço de OTP indisponível".
- [ ] Quando o e-mail informado na requisição está em formato inválido (sem @ ou domínio), então o endpoint retorna HTTP 400 com mensagem "E-mail inválido" sem chamar o provedor externo.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 500, 502
- Campos: `OTP_EMAIL_API_KEY`, `email`, `code`
- Precisa de esclarecimento: sim — Não foi especificado qual provedor externo utilizar (SendGrid, AWS SES, Mailgun etc.), o tempo de expiração do código OTP nem o nome exato da variável de ambiente para a chave de API.

**Rastreabilidade:** REQ-329 (ver requirements.json)

---

### [Sprint 10] Instrumentar latência de requisições por endpoint
<!-- sdd-bot:meta id="BL-223" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-336" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar middleware de instrumentação no backend que mede o tempo decorrido (ms) entre o recebimento da requisição HTTP e o envio da resposta, registrando a métrica com labels de método, rota e código de status em um sistema de métricas (ex.: Prometheus/StatsD) exposto via endpoint /metrics.

**Comportamento esperado:**
Cada requisição processada gera um registro de latência em milissegundos consultável no dashboard de monitoramento, segmentado por rota e método HTTP.

**Critérios de aceite:**
- [ ] Quando uma requisição GET /api/v1/pacientes for concluída, então o middleware registra a métrica http_request_duration_ms com labels method=GET, route=/api/v1/pacientes e status=200.
- [ ] Quando o endpoint /metrics for consultado, então a métrica http_request_duration_ms deve estar presente no formato exposto pelo coletor (ex.: Prometheus text format).
- [ ] Quando a requisição resultar em erro 500, então a métrica de duração ainda deve ser registrada com status=500, sem interromper o middleware.
- [ ] Quando o middleware falhar ao registrar a métrica (ex.: coletor indisponível), então a requisição original deve prosseguir e retornar sua resposta ao cliente sem gerar exceção adicional.

**Especificidade técnica:**
- Códigos HTTP: 200, 500
- Campos: `http_request_duration_ms`, `method`, `route`, `status`, `/metrics`
- Precisa de esclarecimento: sim — Não foi definido qual sistema de métricas (Prometheus, StatsD, CloudWatch) e granularidade de buckets/histograma a usar.

**Rastreabilidade:** REQ-336 (ver requirements.json)

---

### [Sprint 10] Calcular taxa de erro por janela de tempo nas requisições
<!-- sdd-bot:meta id="BL-224" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-337" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar contador de requisições por código de status HTTP no middleware de instrumentação e calcular a taxa de erro (%) como razão entre requisições com status >= 500 (ou 4xx configurável) e o total de requisições em uma janela deslizante, expondo o valor via métrica http_error_rate_percent no endpoint /metrics.

**Comportamento esperado:**
O dashboard de monitoramento exibe a porcentagem de requisições com erro em relação ao total processado na janela de tempo configurada.

**Critérios de aceite:**
- [ ] Quando 100 requisições forem processadas na janela e 5 retornarem status 500, então a métrica http_error_rate_percent deve reportar o valor 5.0.
- [ ] Quando nenhuma requisição ocorrer na janela de tempo, então a métrica http_error_rate_percent deve retornar 0 em vez de erro de divisão por zero.
- [ ] Quando todas as requisições da janela retornarem status 2xx, então a métrica http_error_rate_percent deve reportar o valor 0.0.
- [ ] Quando o endpoint /metrics for consultado, então a métrica http_error_rate_percent deve estar disponível junto com o contador bruto de requisições por status.

**Especificidade técnica:**
- Códigos HTTP: 500, 4xx, 2xx
- Campos: `http_error_rate_percent`, `/metrics`
- Precisa de esclarecimento: sim — Não foi definida a duração da janela deslizante (ex.: 1 min, 5 min) nem se 4xx conta como erro para o cálculo.

**Rastreabilidade:** REQ-337 (ver requirements.json)

---

### [Sprint 10] Detectar e registrar violações de isolamento entre tenants
<!-- sdd-bot:meta id="BL-225" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-340" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar verificação no middleware/camada de acesso a dados que compara o tenant_id do usuário autenticado (extraído do token/sessão) com o tenant_id do recurso solicitado antes de retornar dados; ao detectar divergência, registrar log estruturado de violação com userId, tenantId esperado, tenantId acessado e endpoint, e incrementar métrica tenant_isolation_violation_total.

**Comportamento esperado:**
Toda tentativa de acesso a dados de outro tenant é bloqueada e gera um registro de auditoria consultável, sem expor os dados do tenant alvo.

**Critérios de aceite:**
- [ ] Quando um usuário do tenant A requisitar um recurso pertencente ao tenant B, então a API retorna 403 Forbidden e o corpo da resposta não contém dados do recurso solicitado.
- [ ] Quando ocorrer uma violação de isolamento, então um log estruturado em JSON é gravado contendo os campos userId, tenantIdEsperado, tenantIdAcessado, endpoint e timestamp.
- [ ] Quando uma violação for registrada, então a métrica tenant_isolation_violation_total é incrementada em 1 para o par de tenants envolvido.
- [ ] Quando o usuário acessar um recurso do próprio tenant, então nenhuma entrada de violação é registrada e a requisição retorna o recurso normalmente com status 200.

**Especificidade técnica:**
- Códigos HTTP: 403, 200
- Campos: `userId`, `tenantIdEsperado`, `tenantIdAcessado`, `endpoint`, `tenant_isolation_violation_total`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-340 (ver requirements.json)

---

### [Sprint 10] Disparar alerta ao ultrapassar 5% de taxa de erro
<!-- sdd-bot:meta id="BL-226" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-342" dependsOn="REQ-337" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-337

**Descrição:**
Configurar regra de alerta no sistema de monitoramento (baseada na métrica http_error_rate_percent do REQ-337) que dispara notificação quando o valor ultrapassar o limite de 5% dentro da janela de avaliação configurada, enviando o alerta ao canal definido (ex.: e-mail, Slack, PagerDuty).

**Comportamento esperado:**
A equipe responsável recebe uma notificação automática assim que a taxa de erro do sistema excede 5%, permitindo ação imediata.

**Critérios de aceite:**
- [ ] Quando http_error_rate_percent ultrapassar 5% durante a janela de avaliação, então um alerta é disparado para o canal configurado contendo o valor atual da taxa e o horário da ocorrência.
- [ ] Quando http_error_rate_percent estiver exatamente em 5.0%, então nenhum alerta deve ser disparado, pois a condição exige valor estritamente maior que 5%.
- [ ] Quando a taxa de erro retornar para valor igual ou abaixo de 5% após um alerta ativo, então o alerta correspondente deve ser marcado como resolvido automaticamente.
- [ ] Quando o canal de notificação estiver indisponível no momento do disparo, então o sistema deve registrar a falha de envio em log e reter o alerta como pendente, sem interromper a avaliação da regra.

**Especificidade técnica:**
- Campos: `http_error_rate_percent`
- Limites: 5%
- Precisa de esclarecimento: sim — Não foi definido o canal de notificação (e-mail, Slack, PagerDuty) nem a duração da janela de avaliação do alerta.

**Rastreabilidade:** REQ-342 (ver requirements.json)

---

### [Sprint 10] Alertar quando latência de resposta exceder 500ms
<!-- sdd-bot:meta id="BL-227" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-343" dependsOn="REQ-336" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-336

**Descrição:**
Implementar monitor de latência no backend que mede o tempo de resposta de cada requisição HTTP (middleware de medição) e, ao detectar tempo superior a 500ms, dispara um alerta via serviço de monitoramento (integração dependente de REQ-336) registrando endpoint, timestamp e duração medida.

**Comportamento esperado:**
Alertas de latência elevada são emitidos automaticamente sempre que uma requisição excede o limiar configurado, sem intervenção manual.

**Critérios de aceite:**
- [ ] Quando uma requisição responde em 501ms ou mais, então um alerta é disparado com os campos endpoint, timestamp e duração em ms.
- [ ] Quando uma requisição responde em 500ms ou menos, então nenhum alerta é disparado.
- [ ] Quando o serviço de alerta (REQ-336) está indisponível, então o sistema registra a falha de envio em log estruturado com nível ERROR sem interromper a requisição original.
- [ ] Quando múltiplas requisições excedem 500ms dentro do mesmo minuto, então cada ocorrência gera um alerta individual, sem deduplicação.

**Especificidade técnica:**
- Campos: `endpoint`, `timestamp`, `duration_ms`
- Limites: 500ms
- Precisa de esclarecimento: sim — Não foi especificado o canal de envio do alerta (e-mail, Slack, webhook) nem se deve haver throttling/deduplicação de alertas repetidos no mesmo período.

**Rastreabilidade:** REQ-343 (ver requirements.json)

---

### [Sprint 10] Alertar quando espaço em disco disponível ficar abaixo de 10%
<!-- sdd-bot:meta id="BL-228" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-345" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Criar rotina de verificação periódica (job agendado no backend) que consulta o espaço livre em disco do servidor e, quando o percentual disponível for inferior a 10%, dispara um alerta via serviço de monitoramento informando percentual livre, partição/volume e timestamp da checagem.

**Comportamento esperado:**
Alertas de espaço em disco baixo são emitidos automaticamente sem necessidade de checagem manual pelo operador.

**Critérios de aceite:**
- [ ] Quando o espaço livre em disco cai para 9% ou menos, então um alerta é disparado contendo percentual livre, partição e timestamp.
- [ ] Quando o espaço livre em disco está em 10% ou mais, então nenhum alerta é disparado.
- [ ] Quando a consulta ao espaço em disco falha (ex.: partição inacessível), então o sistema registra erro em log estruturado com nível ERROR e não dispara alerta falso.
- [ ] Quando o espaço volta a ficar acima de 10% após um alerta ter sido disparado, então nenhum alerta adicional de recuperação é exigido por este requisito.

**Especificidade técnica:**
- Campos: `percentual_livre`, `particao`, `timestamp`
- Limites: 10%
- Precisa de esclarecimento: sim — Não foi definida a frequência do job de verificação (ex.: a cada 5 minutos) nem o canal de envio do alerta.

**Rastreabilidade:** REQ-345 (ver requirements.json)

---

### [Sprint 10] Executar backup manual do PostgreSQL via pg_dump
<!-- sdd-bot:meta id="BL-229" epic="Backup manual" layer="backend" requirementIds="REQ-346" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar endpoint/comando administrativo no backend que invoca a ferramenta pg_dump apontando para a instância PostgreSQL configurada, capturando stdout/stderr do processo e retornando status da execução para o solicitante.

**Comportamento esperado:**
Um operador autorizado consegue iniciar um backup do banco a qualquer momento e recebe confirmação do resultado da execução.

**Critérios de aceite:**
- [ ] Quando um usuário com permissão de administrador aciona o backup manual, então o processo pg_dump é executado e a API retorna HTTP 200 com um identificador do backup gerado.
- [ ] Quando um usuário sem permissão de administrador tenta acionar o backup, então a API retorna HTTP 403 com mensagem 'Permissão insuficiente para executar backup'.
- [ ] Quando o processo pg_dump falha (ex.: banco inacessível), então a API retorna HTTP 500 com mensagem de erro e o evento é registrado em log estruturado com nível ERROR.
- [ ] Quando já existe um backup em execução, então uma nova solicitação retorna HTTP 409 com mensagem 'Backup já em andamento'.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 500, 409
- Campos: `backup_id`, `status`, `mensagem_erro`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-346 (ver requirements.json)

---

### [Sprint 10] Gerar arquivo SQL de dump completo do atlus_db
<!-- sdd-bot:meta id="BL-230" epic="Backup manual" layer="backend" requirementIds="REQ-347" dependsOn="REQ-346" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-346

**Descrição:**
Configurar o pg_dump (invocado pelo backup manual do REQ-346) para gerar saída em formato .sql contendo o dump completo do banco atlus_db, salvando o arquivo em diretório de armazenamento de backups com nome padronizado incluindo timestamp.

**Comportamento esperado:**
Ao final da execução do backup manual, um arquivo .sql com o conteúdo íntegro do banco atlus_db fica disponível para download ou consulta.

**Critérios de aceite:**
- [ ] Quando o backup manual do atlus_db é concluído, então um arquivo com extensão .sql e nome no formato 'atlus_db_backup_{timestamp}.sql' é criado no diretório de backups.
- [ ] Quando o arquivo gerado é aberto, então ele contém instruções SQL correspondentes a todas as tabelas e dados do banco atlus_db no momento da execução.
- [ ] Quando a geração do arquivo SQL falha por espaço em disco insuficiente, então a API retorna HTTP 500 com mensagem 'Falha ao gerar arquivo de backup: espaço insuficiente' e nenhum arquivo parcial é mantido.
- [ ] Quando o dump gerado tem tamanho igual a 0 bytes, então o sistema registra erro em log estruturado, marca o backup como falho e a API retorna HTTP 500.

**Especificidade técnica:**
- Códigos HTTP: 500
- Campos: `nome_arquivo`, `atlus_db_backup_{timestamp}.sql`, `mensagem_erro`
- Precisa de esclarecimento: sim — Não foi especificado o diretório/serviço de armazenamento final do arquivo (local, S3, etc.) nem política de retenção dos backups gerados.

**Rastreabilidade:** REQ-347 (ver requirements.json)

---

### [Sprint 10] Autenticar usuário antes de conectar ao banco remoto
<!-- sdd-bot:meta id="BL-231" epic="Backup manual" layer="backend" requirementIds="REQ-348" dependsOn="REQ-346" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-346

**Descrição:**
Implementar etapa de autenticação no serviço de backup responsável por conectar ao banco de dados remoto hospedado em db.render.com. Antes de iniciar o processo de backup, o serviço deve ler credenciais (usuário, senha e connection string) a partir de variáveis de ambiente/secrets configurados no ambiente de execução, validar sua presença e formato, e utilizá-las para abrir a conexão via driver do banco (ex.: pg client para PostgreSQL). A conexão deve ocorrer exclusivamente via HTTPS/SSL (sslmode=require), conforme diretriz de HTTPS obrigatório da sprint. Falhas de autenticação retornadas pelo servidor remoto devem ser capturadas e interromper o fluxo de backup antes de qualquer operação de leitura/escrita no banco.

**Comportamento esperado:**
Quando as credenciais configuradas são válidas, o processo de backup consegue estabelecer conexão com db.render.com e prossegue para a etapa de extração dos dados; quando inválidas ou ausentes, o backup é abortado antes de qualquer tentativa de leitura do banco, com log estruturado do erro (sem expor senha ou CPF) e código de saída/erro distinto de sucesso.

**Critérios de aceite:**
- [ ] Quando as variáveis de ambiente DB_HOST, DB_USER, DB_PASSWORD e DB_NAME estão presentes e corretas, então a conexão SSL com db.render.com é estabelecida e o processo de backup avança para a etapa de dump dos dados.
- [ ] Quando DB_USER ou DB_PASSWORD está ausente no ambiente, então o processo é interrompido antes de tentar conectar e retorna código de saída 1 com log 'Credenciais de banco ausentes: variável X não configurada'.
- [ ] Quando o servidor remoto rejeita as credenciais (erro de autenticação do driver, ex.: código 28P01 do PostgreSQL), então o backup é abortado, nenhuma query de leitura é executada e o log registra 'Falha de autenticação ao conectar em db.render.com' sem incluir a senha usada.
- [ ] Quando a conexão é tentada sem sslmode=require, então o serviço rejeita a tentativa e força reconexão apenas via canal criptografado, registrando log de violação de política HTTPS.
- [ ] Quando a autenticação é bem-sucedida mas a conexão cai antes do término do backup, então o processo registra timeout/erro de conexão perdida e encerra com código de saída diferente de 0, sem deixar o backup marcado como concluído.

**Especificidade técnica:**
- Campos: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `sslmode`
- Precisa de esclarecimento: sim — Não está definido qual driver/SGBD remoto (PostgreSQL, MySQL etc.) e qual mecanismo exato de secret management (variáveis de ambiente, vault, arquivo .pgpass) deve ser usado para armazenar as credenciais em produção; assumiu-se PostgreSQL via variáveis de ambiente como exemplo ilustrativo.

**Rastreabilidade:** REQ-348 (ver requirements.json)

---

### [Sprint 11] Configurar percentual de desconto por diretoria
<!-- sdd-bot:meta id="BL-232" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-19" dependsOn="REQ-17,REQ-5" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-17, REQ-5

**Descrição:**
Adicionar campo `discount_percentage` (decimal) na tabela/entidade `diretoria` e expor endpoint(s) de gerenciamento (ex.: PATCH /diretorias/{id}/discount) para que administradores configurem o percentual de desconto aplicável a sócios vinculados a cada diretoria. Persistir o valor e validar faixa permitida antes de gravar.

**Comportamento esperado:**
Um administrador consegue definir e atualizar o percentual de desconto de uma diretoria específica, e esse valor fica disponível para consumo por outras funcionalidades (ex.: desconto automático em eventos).

**Critérios de aceite:**
- [ ] Quando um admin enviar PATCH /diretorias/{id}/discount com discount_percentage=15, então o sistema retorna 200 e persiste o valor 15 na diretoria.
- [ ] Quando o valor enviado for menor que 0 ou maior que 100, então o sistema retorna 400 com mensagem 'discount_percentage deve estar entre 0 e 100'.
- [ ] Quando o id da diretoria não existir, então o sistema retorna 404 com mensagem 'Diretoria não encontrada'.
- [ ] Quando um usuário sem permissão de administração tentar configurar o desconto, então o sistema retorna 403.
- [ ] Quando o campo discount_percentage não for enviado no payload, então o sistema retorna 400 indicando campo obrigatório ausente.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403, 404
- Campos: `discount_percentage`, `diretoria_id`
- Limites: 0 a 100 (percentual)
- Precisa de esclarecimento: sim — Não foi especificado o endpoint exato, se o desconto é percentual único por diretoria ou pode variar por tipo de evento, nem a granularidade decimal (ex.: 2 casas decimais).

**Rastreabilidade:** REQ-19 (ver requirements.json)

---

### [Sprint 11] Fornecer endpoint de analytics de vendas para diretoria
<!-- sdd-bot:meta id="BL-233" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-29" dependsOn="REQ-27" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-27

**Descrição:**
Criar endpoint GET /diretoria/analytics/vendas que agrega dados de transações/vendas (ex.: tabela `orders`/`sales`) e retorna métricas consolidadas (total vendido, ticket médio, volume por período) restritas a usuários com papel DIRETORIA, consumindo os dados já disponíveis via REQ-27.

**Comportamento esperado:**
Um usuário com papel DIRETORIA consegue visualizar um relatório agregado de vendas via API, com dados filtráveis por período.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA chamar GET /diretoria/analytics/vendas, então o sistema retorna 200 com JSON contendo total_vendas, ticket_medio e quantidade_transacoes.
- [ ] Quando forem informados os parâmetros de período (ex.: data_inicio e data_fim), então o retorno reflete apenas vendas dentro do intervalo informado.
- [ ] Quando um usuário sem papel DIRETORIA chamar o endpoint, então o sistema retorna 403.
- [ ] Quando não houver nenhuma venda registrada no período consultado, então o sistema retorna 200 com os totais zerados em vez de erro.
- [ ] Quando os parâmetros de data forem inválidos (ex.: data_fim anterior a data_inicio), então o sistema retorna 400 com mensagem de erro descritiva.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403
- Campos: `total_vendas`, `ticket_medio`, `quantidade_transacoes`, `data_inicio`, `data_fim`
- Precisa de esclarecimento: sim — Não foi definido o conjunto exato de métricas exigidas, granularidade temporal (diária/mensal), nem o formato de agrupamento (por evento, por diretoria, total geral).

**Rastreabilidade:** REQ-29 (ver requirements.json)

---

### [Sprint 11] Aplicar desconto automático de sócio na inscrição em evento
<!-- sdd-bot:meta id="BL-234" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-33" dependsOn="REQ-32,REQ-5" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-32, REQ-5

**Descrição:**
No fluxo de criação de inscrição em evento (ex.: serviço/endpoint POST /eventos/{id}/inscricoes), verificar se o usuário possui status de sócio ativo vinculado a uma diretoria e, em caso positivo, calcular o valor final aplicando o `discount_percentage` configurado na diretoria (REQ-19) sobre o preço base do evento antes de gerar a cobrança.

**Comportamento esperado:**
Sócios ativos recebem automaticamente o desconto da sua diretoria no valor cobrado ao se inscreverem em um evento, sem precisar inserir cupom manualmente.

**Critérios de aceite:**
- [ ] Quando um sócio ativo com desconto de 20% se inscrever em um evento de R$100, então o valor final da inscrição é calculado como R$80.
- [ ] Quando um usuário não-sócio se inscrever no mesmo evento, então o valor cobrado é o preço integral, sem aplicação de desconto.
- [ ] Quando um sócio estiver com status inativo/suspenso, então nenhum desconto é aplicado na inscrição.
- [ ] Quando a diretoria do sócio não tiver discount_percentage configurado (valor nulo ou zero), então o valor cobrado é o preço integral do evento.
- [ ] Quando o cálculo do desconto resultar em valor negativo ou inválido, então o sistema rejeita a inscrição com 400 e não gera cobrança.

**Especificidade técnica:**
- Códigos HTTP: 200, 400
- Campos: `discount_percentage`, `preco_base`, `valor_final`, `status_socio`
- Precisa de esclarecimento: sim — Não foi especificado como determinar 'sócio ativo' (campo/status exato), nem se o desconto se aplica sobre todos os eventos ou apenas alguns tipos.

**Rastreabilidade:** REQ-33 (ver requirements.json)

---

### [Sprint 11] Fornecer endpoint de analytics de inscrições em eventos
<!-- sdd-bot:meta id="BL-235" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-35" dependsOn="REQ-32" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-32

**Descrição:**
Criar endpoint GET /diretoria/analytics/inscricoes que agrega dados da tabela/serviço de registrations de eventos (dependência REQ-32) e retorna métricas como total de inscritos, taxa de ocupação por evento e distribuição por status (confirmada/cancelada), restrito a usuários com papel DIRETORIA.

**Comportamento esperado:**
Um usuário com papel DIRETORIA consegue visualizar um relatório agregado de inscrições em eventos via API, filtrável por evento e período.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA chamar GET /diretoria/analytics/inscricoes, então o sistema retorna 200 com JSON contendo total_inscricoes, inscricoes_confirmadas e inscricoes_canceladas.
- [ ] Quando for informado o parâmetro evento_id, então o retorno reflete apenas inscrições daquele evento específico.
- [ ] Quando um usuário sem papel DIRETORIA chamar o endpoint, então o sistema retorna 403.
- [ ] Quando o evento_id informado não existir, então o sistema retorna 404 com mensagem 'Evento não encontrado'.
- [ ] Quando não houver inscrições registradas no filtro aplicado, então o sistema retorna 200 com os totais zerados em vez de erro.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404
- Campos: `total_inscricoes`, `inscricoes_confirmadas`, `inscricoes_canceladas`, `evento_id`
- Precisa de esclarecimento: sim — Não foi definido o conjunto exato de métricas exigidas nem se o relatório deve incluir dados históricos consolidados ou apenas eventos futuros/ativos.

**Rastreabilidade:** REQ-35 (ver requirements.json)

---

### [Sprint 11] Implementar PriceCalculationService de preços
<!-- sdd-bot:meta id="BL-236" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-60" dependsOn="REQ-59" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-59

**Descrição:**
Criar o serviço PriceCalculationService no backend, responsável por centralizar a lógica de cálculo de preços de eventos/inscrições (valor base, aplicação de descontos e taxas). O serviço deve expor um método público (ex.: calculatePrice(eventoId, usuarioId)) consumido pelos endpoints de inscrição/checkout, retornando o valor final e o detalhamento (subtotal, descontos aplicados, total). Depende de REQ-59 (regras/dados de origem do preço base).

**Comportamento esperado:**
Ao chamar o serviço com um evento e usuário válidos, o valor final calculado reflete o preço base menos os descontos aplicáveis, exibido no endpoint de inscrição/checkout.

**Critérios de aceite:**
- [ ] Quando calculatePrice for chamado com um eventoId existente e usuário sem desconto aplicável, então retorna total igual ao preço base cadastrado no evento, sem alterações.
- [ ] Quando o usuário possuir desconto elegível (ex.: sócio), então o total retornado é igual a (preço base - valor do desconto), com o campo 'descontos' detalhando o valor aplicado.
- [ ] Quando eventoId não existir na base, então o serviço lança exceção/retorna erro com código HTTP 404 e mensagem 'Evento não encontrado'.
- [ ] Quando o preço base do evento for igual a zero, então o serviço retorna total igual a zero sem aplicar cálculo de desconto.
- [ ] Quando o parâmetro eventoId ou usuarioId estiver ausente na chamada, então o serviço retorna erro HTTP 400 com mensagem 'Parâmetros obrigatórios ausentes'.

**Especificidade técnica:**
- Códigos HTTP: 400, 404
- Campos: `eventoId`, `usuarioId`, `subtotal`, `descontos`, `total`
- Precisa de esclarecimento: sim — Não foi especificado o formato exato do payload de retorno nem as regras completas de composição de descontos/taxas além do desconto para sócios; necessário definir com o time responsável por REQ-59.

**Rastreabilidade:** REQ-60 (ver requirements.json)

---

### [Sprint 11] Implementar PermissionGuard para validação de permissões
<!-- sdd-bot:meta id="BL-237" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-68" dependsOn="REQ-61,REQ-66" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-61, REQ-66

**Descrição:**
Criar o PermissionGuard no backend, aplicado via decorator/middleware às rotas protegidas, que intercepta a requisição, extrai as permissões do usuário autenticado (a partir do payload do JWT ou serviço de permissões) e compara com as permissões exigidas pelo endpoint (metadata da rota). Depende de REQ-61 (autenticação) e REQ-66 (definição de permissões/roles).

**Comportamento esperado:**
Ao acessar um endpoint protegido, a requisição só prossegue se o usuário possuir a permissão exigida; caso contrário é bloqueada antes de chegar ao controller.

**Critérios de aceite:**
- [ ] Quando o usuário autenticado possuir a permissão exigida pelo endpoint, então a requisição prossegue para o controller e retorna o status HTTP correspondente à operação (ex.: 200).
- [ ] Quando o usuário autenticado não possuir a permissão exigida, então o guard bloqueia a requisição retornando HTTP 403 com mensagem 'Permissão insuficiente'.
- [ ] Quando a requisição não contiver token JWT válido, então o guard retorna HTTP 401 antes de avaliar permissões.
- [ ] Quando o endpoint não declarar nenhuma permissão exigida (metadata ausente), então o guard permite a passagem da requisição sem bloqueio.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `permissions`, `requiredPermissions`, `Authorization`
- Precisa de esclarecimento: sim — Não foi especificado o mecanismo exato de declaração de permissões por rota (decorator @RequirePermissions ou metadata) nem a lista de permissões definidas em REQ-66.

**Rastreabilidade:** REQ-68 (ver requirements.json)

---

### [Sprint 11] Implementar guard de controle de acesso por papel (role)
<!-- sdd-bot:meta id="BL-238" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-127" dependsOn="REQ-102,REQ-66" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-102, REQ-66

**Descrição:**
Criar um RoleGuard no backend que valide, a partir do payload do JWT, se o role/papel do usuário (ex.: diretoria, sócio, não-sócio) corresponde aos roles autorizados declarados no endpoint via metadata/decorator. Deve ser aplicado nas rotas de dashboard analítico e demais funcionalidades restritas por papel. Depende de REQ-102 (definição de roles) e REQ-66 (permissões).

**Comportamento esperado:**
Ao acessar um endpoint restrito por role, a requisição só prossegue se o role do usuário estiver na lista de roles autorizados do endpoint.

**Critérios de aceite:**
- [ ] Quando o role do usuário estiver presente na lista de roles autorizados do endpoint, então a requisição prossegue e retorna o status HTTP correspondente à operação (ex.: 200).
- [ ] Quando o role do usuário não estiver na lista de roles autorizados, então o guard retorna HTTP 403 com mensagem 'Acesso não autorizado para este papel'.
- [ ] Quando o JWT não contiver o claim de role, então o guard retorna HTTP 401 com mensagem 'Token inválido ou sem papel definido'.
- [ ] Quando o endpoint não declarar roles exigidos, então o guard permite acesso a qualquer usuário autenticado.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `role`, `requiredRoles`
- Precisa de esclarecimento: sim — Não foi especificada a lista completa de roles do sistema (ex.: diretoria, sócio, não-sócio) nem o decorator exato para declarar roles exigidos por rota; depende da definição em REQ-102.

**Rastreabilidade:** REQ-127 (ver requirements.json)

---

### [Sprint 11] Implementar TenantGuard baseado no payload do JWT
<!-- sdd-bot:meta id="BL-239" epic="5.4 Guards" layer="backend" requirementIds="REQ-170" dependsOn="REQ-145" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-145

**Descrição:**
Criar o TenantGuard no backend que extraia o identificador de tenant (ex.: tenantId) diretamente do payload do JWT decodificado, sem depender do campo tipoVinculo do usuário, e valide se o recurso acessado pertence ao mesmo tenant da requisição, bloqueando acesso cruzado entre tenants. Depende de REQ-145 (estrutura do JWT/tenant).

**Comportamento esperado:**
Ao acessar um recurso de outro tenant, a requisição é bloqueada independentemente do tipoVinculo do usuário; ao acessar recurso do próprio tenant, a requisição prossegue normalmente.

**Critérios de aceite:**
- [ ] Quando o tenantId do JWT corresponder ao tenant do recurso solicitado, então a requisição prossegue para o controller normalmente.
- [ ] Quando o tenantId do JWT não corresponder ao tenant do recurso solicitado, então o guard retorna HTTP 403 com mensagem 'Recurso não pertence ao tenant do usuário'.
- [ ] Quando o payload do JWT não contiver o claim tenantId, então o guard retorna HTTP 401 com mensagem 'Token inválido: tenant não identificado'.
- [ ] Quando o usuário possuir tipoVinculo diferente (ex.: sócio, não-sócio, diretoria), então o guard aplica a mesma validação de tenantId sem distinção de comportamento por tipoVinculo.

**Especificidade técnica:**
- Códigos HTTP: 401, 403
- Campos: `tenantId`, `tipoVinculo`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-170 (ver requirements.json)

---

### [Sprint 11] Criar PermissionGuard baseado em payload do JWT
<!-- sdd-bot:meta id="BL-240" epic="5.4 Guards" layer="backend" requirementIds="REQ-171" dependsOn="REQ-145,REQ-167,REQ-168" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-145, REQ-167, REQ-168

**Descrição:**
Implementar um PermissionGuard no backend (NestJS) que intercepte requisições autenticadas e extraia claims de permissão diretamente do payload do JWT (ex.: campo 'role' ou 'permissions'), sem consultar ou depender do campo tipoVinculo do usuário no banco. O guard deve ser aplicável via decorator em controllers/rotas (ex.: @RequirePermission('DIRETORIA')) e comparar as permissões exigidas pela rota com as presentes no token decodificado.

**Comportamento esperado:**
Rotas protegidas pelo PermissionGuard permitem acesso apenas a usuários cujo JWT contenha a permissão exigida, independentemente do tipoVinculo associado ao usuário.

**Critérios de aceite:**
- [ ] Quando um usuário autenticado envia um JWT contendo a permissão exigida pela rota (ex.: 'DIRETORIA'), então a requisição prossegue para o handler com status 200.
- [ ] Quando o JWT não contém a permissão exigida pela rota, então o guard retorna 403 Forbidden com mensagem 'Permissão insuficiente'.
- [ ] Quando a requisição não possui um JWT válido (ausente ou expirado), então o guard retorna 401 Unauthorized antes de avaliar permissões.
- [ ] Quando dois usuários com o mesmo valor de permissão no JWT mas tipoVinculo diferentes acessam a mesma rota protegida, então ambos recebem o mesmo resultado de autorização (200 ou 403), comprovando independência do tipoVinculo.
- [ ] Quando o payload do JWT não contém o campo de permissões esperado, então o guard retorna 403 Forbidden em vez de lançar exceção não tratada.

**Especificidade técnica:**
- Códigos HTTP: 200, 401, 403
- Campos: `JWT payload.permissions`, `@RequirePermission decorator`
- Precisa de esclarecimento: sim — Não está definido o nome exato do claim de permissão no payload do JWT (ex.: 'role', 'permissions', 'scopes') nem a lista de valores possíveis; precisa ser definido alinhado ao REQ-145/REQ-167/REQ-168.

**Rastreabilidade:** REQ-171 (ver requirements.json)

---

### [Sprint 11] Listar cadastros pendentes de aprovação por diretoria
<!-- sdd-bot:meta id="BL-241" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-218" dependsOn="REQ-214" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-214

**Descrição:**
Criar endpoint GET no controller de Diretorias (ex.: GET /diretorias/:id/aprovacoes-pendentes) que consulta a tabela de usuários filtrando por status de aprovação PENDENTE e pela diretoria associada, protegido por PermissionGuard exigindo papel DIRETORIA. A query deve retornar apenas usuários vinculados à diretoria informada no parâmetro de rota.

**Comportamento esperado:**
Usuários com permissão DIRETORIA recebem a lista de usuários com cadastro pendente de aprovação restrita à diretoria consultada.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA autenticado chama GET /diretorias/:id/aprovacoes-pendentes com uma diretoria válida contendo cadastros pendentes, então a resposta retorna 200 com array de usuários com status PENDENTE.
- [ ] Quando a diretoria informada não possui nenhum usuário pendente, então a resposta retorna 200 com array vazio [].
- [ ] Quando o :id da diretoria não existe, então a resposta retorna 404 com mensagem 'Diretoria não encontrada'.
- [ ] Quando um usuário sem permissão DIRETORIA chama o endpoint, então a resposta retorna 403 Forbidden.
- [ ] Quando a listagem é retornada, então cada item não deve incluir usuários com status diferente de PENDENTE (ex.: APROVADO ou REJEITADO).

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404
- Campos: `GET /diretorias/:id/aprovacoes-pendentes`, `status=PENDENTE`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-218 (ver requirements.json)

---

### [Sprint 11] Aprovar cadastro pendente de usuário pela diretoria
<!-- sdd-bot:meta id="BL-242" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-219" dependsOn="REQ-218" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-218

**Descrição:**
Criar endpoint PATCH (ex.: PATCH /diretorias/aprovacoes/:usuarioId/aprovar) protegido por PermissionGuard exigindo papel DIRETORIA, que atualiza o status do usuário de PENDENTE para APROVADO na tabela de usuários e dispara o fluxo de notificação (e-mail) ao usuário aprovado.

**Comportamento esperado:**
O status do usuário pendente é alterado para APROVADO e o usuário passa a ter acesso liberado ao sistema conforme seu tipoVinculo.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA chama PATCH /diretorias/aprovacoes/:usuarioId/aprovar para um usuárioId existente com status PENDENTE, então a resposta retorna 200 e o status do usuário é atualizado para APROVADO no banco.
- [ ] Quando o usuárioId informado não existe, então a resposta retorna 404 com mensagem 'Usuário não encontrado'.
- [ ] Quando o usuárioId existe mas já está com status APROVADO ou REJEITADO, então a resposta retorna 409 Conflict com mensagem 'Cadastro não está pendente de aprovação'.
- [ ] Quando um usuário sem permissão DIRETORIA chama o endpoint, então a resposta retorna 403 Forbidden.
- [ ] Quando a aprovação é concluída e o status é alterado para APROVADO, então um evento de notificação por e-mail é enfileirado para o usuário aprovado.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404, 409
- Campos: `PATCH /diretorias/aprovacoes/:usuarioId/aprovar`, `status=APROVADO`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-219 (ver requirements.json)

---

### [Sprint 11] Rejeitar cadastro pendente de usuário pela diretoria
<!-- sdd-bot:meta id="BL-243" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-220" dependsOn="REQ-218" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-218

**Descrição:**
Criar endpoint PATCH (ex.: PATCH /diretorias/aprovacoes/:usuarioId/rejeitar) protegido por PermissionGuard exigindo papel DIRETORIA, que atualiza o status do usuário de PENDENTE para REJEITADO na tabela de usuários e dispara o fluxo de notificação (e-mail) informando a rejeição.

**Comportamento esperado:**
O status do usuário pendente é alterado para REJEITADO e o acesso ao sistema permanece bloqueado para esse usuário.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA chama PATCH /diretorias/aprovacoes/:usuarioId/rejeitar para um usuárioId existente com status PENDENTE, então a resposta retorna 200 e o status do usuário é atualizado para REJEITADO no banco.
- [ ] Quando o usuárioId informado não existe, então a resposta retorna 404 com mensagem 'Usuário não encontrado'.
- [ ] Quando o usuárioId existe mas já está com status APROVADO ou REJEITADO, então a resposta retorna 409 Conflict com mensagem 'Cadastro não está pendente de aprovação'.
- [ ] Quando um usuário sem permissão DIRETORIA chama o endpoint, então a resposta retorna 403 Forbidden.
- [ ] Quando a rejeição é concluída e o status é alterado para REJEITADO, então um evento de notificação por e-mail é enfileirado informando o usuário sobre a rejeição do cadastro.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404, 409
- Campos: `PATCH /diretorias/aprovacoes/:usuarioId/rejeitar`, `status=REJEITADO`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-220 (ver requirements.json)

---

### [Sprint 11] Revisar manualmente: Restrição de perfil DIRETORIA nas aprovações
<!-- sdd-bot:meta id="BL-244" epic="Endpoints de Diretorias" layer="backend" requirementIds="REQ-221" dependsOn="REQ-218,REQ-219,REQ-220" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-218, REQ-219, REQ-220

**Descrição:**
A geração automática deste item esgotou as tentativas de correção de qualidade. Requisito original: O sistema deve restringir as operações de listar, aprovar e rejeitar cadastros apenas a usuários com perfil DIRETORIA.

**Comportamento esperado:**
Revisar o requisito original e preencher descrição, comportamento esperado e critérios de aceite manualmente antes de publicar.

**Critérios de aceite:**
- [ ] Revisão manual concluída antes da publicação desta issue.

**Especificidade técnica:**
- Precisa de esclarecimento: sim — Geração automática falhou: critério 1 usa "com sucesso": não é verificável. Reescreva como "Quando X, então Y" com valores concretos.

**Rastreabilidade:** REQ-221 (ver requirements.json)

---

### [Sprint 11] Revisar manualmente: Criação de usuário não-estudante pendente
<!-- sdd-bot:meta id="BL-245" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-290" dependsOn="REQ-288,REQ-156" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-288, REQ-156

**Descrição:**
A geração automática deste item esgotou as tentativas de correção de qualidade. Requisito original: O sistema deve criar o Usuario com tipoVinculo NAO_ESTUDANTE, associado à diretoria, inativo e com aprovação e verificação de CPF pendentes.

**Comportamento esperado:**
Revisar o requisito original e preencher descrição, comportamento esperado e critérios de aceite manualmente antes de publicar.

**Critérios de aceite:**
- [ ] Revisão manual concluída antes da publicação desta issue.

**Especificidade técnica:**
- Precisa de esclarecimento: sim — Geração automática falhou: critério 1 usa "com sucesso": não é verificável. Reescreva como "Quando X, então Y" com valores concretos.

**Rastreabilidade:** REQ-290 (ver requirements.json)

---

### [Sprint 11] Revisar manualmente: Envio de OTP por e-mail
<!-- sdd-bot:meta id="BL-246" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-291" dependsOn="REQ-290" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-290

**Descrição:**
A geração automática deste item esgotou as tentativas de correção de qualidade. Requisito original: O sistema deve disparar um e-mail com código OTP para confirmação de cadastro.

**Comportamento esperado:**
Revisar o requisito original e preencher descrição, comportamento esperado e critérios de aceite manualmente antes de publicar.

**Critérios de aceite:**
- [ ] Revisão manual concluída antes da publicação desta issue.

**Especificidade técnica:**
- Precisa de esclarecimento: sim — Geração automática falhou: critério 1 usa "com sucesso": não é verificável. Reescreva como "Quando X, então Y" com valores concretos.

**Rastreabilidade:** REQ-291 (ver requirements.json)

---

### [Sprint 11] Revisar manualmente: Notificação de cadastro pendente à diretoria
<!-- sdd-bot:meta id="BL-247" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-292" dependsOn="REQ-290" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-290

**Descrição:**
A geração automática deste item esgotou as tentativas de correção de qualidade. Requisito original: O sistema deve notificar a DIRETORIA sobre um novo cadastro pendente de aprovação.

**Comportamento esperado:**
Revisar o requisito original e preencher descrição, comportamento esperado e critérios de aceite manualmente antes de publicar.

**Critérios de aceite:**
- [ ] Revisão manual concluída antes da publicação desta issue.

**Especificidade técnica:**
- Precisa de esclarecimento: sim — Geração automática falhou: critério 1 usa "com sucesso": não é verificável. Reescreva como "Quando X, então Y" com valores concretos.

**Rastreabilidade:** REQ-292 (ver requirements.json)

---

### [Sprint 11] Restaurar banco PostgreSQL a partir de arquivo SQL via psql
<!-- sdd-bot:meta id="BL-248" epic="Restore" layer="backend" requirementIds="REQ-349" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar script/comando (ex.: scripts/restore-db.sh) que invoque o binário psql para restaurar o banco de dados PostgreSQL a partir de um arquivo de backup .sql fornecido como parâmetro, utilizando as variáveis de conexão (host, porta, usuário, database) já configuradas no ambiente (.env). O script deve encerrar/desconectar conexões ativas ao banco alvo antes da restauração e propagar o exit code do psql para o chamador.

**Comportamento esperado:**
Ao executar o comando de restauração informando um arquivo .sql válido, o banco de dados é recriado com os dados e schema do backup, e o processo retorna código de saída 0 ao final.

**Critérios de aceite:**
- [ ] Quando o comando é executado com um caminho de arquivo .sql válido e existente, então o psql processa o arquivo e o script retorna exit code 0.
- [ ] Quando o comando é executado sem informar o parâmetro do arquivo de backup, então o script aborta imediatamente com mensagem de erro 'Arquivo de backup não informado' e exit code 1, sem tentar conectar ao banco.
- [ ] Quando o arquivo informado não existe no caminho especificado, então o script retorna erro 'Arquivo de backup não encontrado: <caminho>' e exit code 1 antes de invocar o psql.
- [ ] Quando o psql retorna erro durante a execução do restore (ex.: SQL inválido ou falha de conexão), então o script propaga o exit code não-zero do psql e exibe a mensagem de erro original no console.
- [ ] Quando existem conexões ativas ao banco alvo no momento da restauração, então o script as encerra antes de iniciar o restore para evitar falha por 'database is being accessed by other users'.

**Especificidade técnica:**
- Campos: `arquivo de backup (.sql)`, `variáveis DB_HOST/DB_PORT/DB_USER/DB_NAME`
- Precisa de esclarecimento: sim — Não foi definido se o restore deve ser executado via script shell dedicado, comando npm/make, ou endpoint administrativo protegido; e se há confirmação obrigatória (flag --force) para evitar restauração acidental em produção.

**Rastreabilidade:** REQ-349 (ver requirements.json)

---

### [Sprint 11] Validar senha do usuário via comparação de hash bcrypt
<!-- sdd-bot:meta id="BL-249" epic="Troubleshooting" layer="backend" requirementIds="REQ-351" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Implementar/garantir no serviço de autenticação (AuthService) o uso da função bcrypt.compare(senhaTexto, hashArmazenado) para validar a senha informada no login contra o hash salvo no campo password_hash da tabela de usuários, substituindo qualquer comparação de texto puro. O hash armazenado deve ter sido gerado previamente com bcrypt.hash usando salt rounds configurado (ex.: 10).

**Comportamento esperado:**
Ao submeter credenciais no endpoint de login, o sistema aceita a autenticação apenas quando a senha em texto claro corresponde ao hash bcrypt armazenado, rejeitando qualquer senha incorreta.

**Critérios de aceite:**
- [ ] Quando o usuário informa email e senha corretos, então bcrypt.compare retorna true e o login prossegue para geração do token JWT.
- [ ] Quando o usuário informa uma senha incorreta para um email existente, então a API retorna 401 Unauthorized com mensagem 'Credenciais inválidas', sem indicar se o email existe.
- [ ] Quando o campo password_hash do usuário está vazio ou nulo no banco, então a validação falha e a API retorna 401 Unauthorized em vez de lançar exceção não tratada.
- [ ] Quando o hash armazenado não segue o formato bcrypt válido (ex.: corrompido), então bcrypt.compare lança erro tratado e a API retorna 401 Unauthorized, registrando o erro em log interno.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `password_hash`, `mensagem 'Credenciais inválidas'`
- Precisa de esclarecimento: sim — Não foi especificado o número de salt rounds usado na geração do hash nem o endpoint exato de login (ex.: POST /auth/login) a ser afetado.

**Rastreabilidade:** REQ-351 (ver requirements.json)

---

### [Sprint 11] Validar JWT secret configurado ao gerar e verificar tokens
<!-- sdd-bot:meta id="BL-250" epic="Troubleshooting" layer="backend" requirementIds="REQ-352" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Adicionar validação na inicialização do módulo de autenticação (AuthModule/JwtModule) que verifique se a variável de ambiente JWT_SECRET está definida e atende a um tamanho mínimo antes de permitir a geração (jwt.sign) ou verificação (jwt.verify) de tokens. Se ausente ou inválida, a aplicação deve falhar de forma explícita no bootstrap em vez de operar com secret indefinido ou fallback inseguro.

**Comportamento esperado:**
A aplicação recusa-se a iniciar (ou o endpoint de autenticação retorna erro controlado) quando JWT_SECRET está ausente ou não atende ao critério mínimo, impedindo emissão de tokens com chave insegura.

**Critérios de aceite:**
- [ ] Quando JWT_SECRET está definida e válida no ambiente, então jwt.sign gera o token normalmente e jwt.verify o valida sem erros.
- [ ] Quando JWT_SECRET não está definida na inicialização da aplicação, então o processo de bootstrap lança erro fatal 'JWT_SECRET não configurado' e encerra a aplicação sem subir o servidor HTTP.
- [ ] Quando JWT_SECRET está definida com tamanho inferior ao mínimo exigido, então o bootstrap rejeita a configuração com erro 'JWT_SECRET inválido: tamanho mínimo não atendido' e não inicia o servidor.
- [ ] Quando um token é verificado com jwt.verify usando secret divergente do usado na assinatura, então a API retorna 401 Unauthorized com código de erro 'invalid_token'.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `JWT_SECRET`, `invalid_token`
- Precisa de esclarecimento: sim — Não foi definido o tamanho mínimo (número de caracteres) exigido para JWT_SECRET nem se a validação deve ocorrer apenas no bootstrap ou também em cada request.

**Rastreabilidade:** REQ-352 (ver requirements.json)

---

### [Sprint 11] Aplicar TenantGuard para isolar tenant no login do estudante
<!-- sdd-bot:meta id="BL-251" epic="Troubleshooting" layer="backend" requirementIds="REQ-353" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
Registrar o TenantGuard no endpoint de login do estudante (ex.: POST /auth/student/login) para validar que o tenant_id resolvido pela requisição (via subdomínio, header X-Tenant-Id ou parâmetro) corresponde ao tenant_id associado ao registro do estudante na tabela students antes de permitir a emissão do token, impedindo autenticação cruzada entre tenants distintos.

**Comportamento esperado:**
O login de um estudante só é concluído quando o tenant identificado na requisição coincide com o tenant ao qual o estudante pertence; tentativas de login cruzado entre tenants são bloqueadas.

**Critérios de aceite:**
- [ ] Quando o estudante faz login informando credenciais válidas e o tenant da requisição corresponde ao seu tenant_id cadastrado, então o TenantGuard permite a passagem e o login retorna 200 com o token JWT.
- [ ] Quando o estudante tenta login em um tenant diferente do seu tenant_id cadastrado, então o TenantGuard bloqueia a requisição e a API retorna 403 Forbidden com mensagem 'Acesso não permitido para este tenant'.
- [ ] Quando a requisição não contém identificação de tenant (header/subdomínio ausente), então o TenantGuard rejeita a requisição com 400 Bad Request antes de consultar as credenciais.
- [ ] Quando o tenant informado na requisição não existe na tabela de tenants, então a API retorna 404 Not Found com mensagem 'Tenant não encontrado', sem revelar detalhes do estudante.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403, 404
- Campos: `tenant_id`, `X-Tenant-Id`, `mensagem 'Acesso não permitido para este tenant'`, `mensagem 'Tenant não encontrado'`
- Precisa de esclarecimento: sim — Não foi especificado o mecanismo exato de identificação do tenant na requisição (subdomínio vs. header vs. corpo da requisição), necessário para implementar o TenantGuard corretamente.

**Rastreabilidade:** REQ-353 (ver requirements.json)

---

### [Sprint 11] Validar cpfVerificado no login de não-estudante
<!-- sdd-bot:meta id="BL-252" epic="Troubleshooting" layer="backend" requirementIds="REQ-354" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
No fluxo de autenticação (endpoint de login), antes de emitir o JWT para usuário com perfil não-estudante, adicionar verificação do campo cpfVerificado no registro do usuário. Se o valor for false, bloquear a emissão do token e retornar erro sem prosseguir para geração da sessão.

**Comportamento esperado:**
Usuário não-estudante com cpfVerificado=false não consegue autenticar e recebe mensagem indicando que o CPF ainda não foi verificado.

**Critérios de aceite:**
- [ ] Quando um usuário não-estudante com cpfVerificado=true faz login com credenciais corretas, então o sistema retorna 200 com o JWT emitido.
- [ ] Quando um usuário não-estudante com cpfVerificado=false tenta login, então o sistema retorna 403 com mensagem de erro "CPF_NAO_VERIFICADO".
- [ ] Quando um usuário estudante faz login, então a validação de cpfVerificado não é aplicada (regra exclusiva para não-estudante).
- [ ] Quando o campo cpfVerificado está ausente/null no registro do usuário, então o sistema trata como não verificado e retorna 403.

**Especificidade técnica:**
- Códigos HTTP: 200, 403
- Campos: `cpfVerificado`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-354 (ver requirements.json)

---

### [Sprint 11] Bloquear login com aprovação pendente para não-estudante
<!-- sdd-bot:meta id="BL-253" epic="Troubleshooting" layer="backend" requirementIds="REQ-355" dependsOn="" -->
**Tipo:** feature
**Prioridade:** must

**Descrição:**
No mesmo fluxo de autenticação, adicionar verificação do campo aprovacaoPendente do usuário não-estudante antes de emitir o JWT. Se o valor for true, interromper o processo de login e retornar erro específico distinto do erro de CPF não verificado.

**Comportamento esperado:**
Usuário não-estudante com aprovacaoPendente=true não consegue autenticar e recebe mensagem indicando que a aprovação da diretoria ainda está pendente.

**Critérios de aceite:**
- [ ] Quando um usuário não-estudante com aprovacaoPendente=false e cpfVerificado=true faz login, então o sistema retorna 200 com o JWT emitido.
- [ ] Quando um usuário não-estudante com aprovacaoPendente=true tenta login, então o sistema retorna 403 com mensagem de erro "APROVACAO_PENDENTE".
- [ ] Quando ambos aprovacaoPendente=true e cpfVerificado=false ocorrem simultaneamente, então o sistema retorna o erro de CPF não verificado com prioridade sobre o de aprovação pendente (ordem de validação definida).
- [ ] Quando o campo aprovacaoPendente está ausente/null, então o sistema trata como pendente e bloqueia o login.

**Especificidade técnica:**
- Códigos HTTP: 200, 403
- Campos: `aprovacaoPendente`
- Precisa de esclarecimento: sim — Falta definir a ordem de precedência entre as validações de cpfVerificado (REQ-354) e aprovacaoPendente (REQ-355) quando ambas falham, e o texto exato da mensagem de erro a ser retornada.

**Rastreabilidade:** REQ-355 (ver requirements.json)

---

### [Sprint 11] Incluir lista de diretorias no payload do JWT
<!-- sdd-bot:meta id="BL-254" epic="Troubleshooting" layer="backend" requirementIds="REQ-356" dependsOn="REQ-352" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-352

**Descrição:**
No serviço de geração de token (mesmo ponto que consome dados do usuário definidos em REQ-352), adicionar o campo directorias[] ao payload do JWT, populado a partir do vínculo do usuário com as diretorias das atléticas em que atua, incluindo o identificador de cada diretoria.

**Comportamento esperado:**
O JWT emitido após login contém o array directorias[] com os identificadores das diretorias associadas ao usuário, consumível por middlewares de autorização.

**Critérios de aceite:**
- [ ] Quando um usuário vinculado a uma ou mais diretorias faz login, então o payload do JWT decodificado contém o campo directorias[] com os respectivos identificadores.
- [ ] Quando um usuário não possui vínculo com nenhuma diretoria, então o campo directorias[] é retornado como array vazio no JWT.
- [ ] Quando o usuário está vinculado a múltiplas diretorias de atléticas distintas, então todos os identificadores aparecem em directorias[] sem duplicidade.
- [ ] Quando o token é decodificado e validado, então a estrutura de directorias[] segue o formato definido em REQ-352 (lista de objetos/IDs consistente com o schema esperado).

**Especificidade técnica:**
- Campos: `directorias`
- Precisa de esclarecimento: sim — Falta definir o formato exato de cada item de directorias[] (apenas ID da diretoria/atlética ou objeto com id+nome+papel) para alinhar com o schema produzido em REQ-352.

**Rastreabilidade:** REQ-356 (ver requirements.json)

---

### [Sprint 11] Retornar 403 se diretoriaAtiva não estiver no JWT
<!-- sdd-bot:meta id="BL-255" epic="Troubleshooting" layer="backend" requirementIds="REQ-357" dependsOn="REQ-356" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-356

**Descrição:**
No middleware/guard de autorização que intercepta requisições a recursos de uma atlética, comparar o valor de diretoriaAtiva enviado na requisição (header/param) com a lista directorias[] extraída do JWT do usuário (REQ-356). Interromper a requisição antes de chegar ao controller caso não haja correspondência.

**Comportamento esperado:**
Requisições a recursos de atlética cuja diretoriaAtiva não conste em directorias[] do JWT são bloqueadas antes do processamento, sem acesso aos dados do recurso.

**Critérios de aceite:**
- [ ] Quando diretoriaAtiva do usuário está presente em directorias[] do JWT, então a requisição prossegue normalmente ao controller do recurso.
- [ ] Quando diretoriaAtiva não está presente em directorias[] do JWT, então o middleware retorna 403 com mensagem de erro "DIRETORIA_NAO_AUTORIZADA" e a requisição não chega ao controller.
- [ ] Quando o JWT não contém o campo directorias[] (ausente ou malformado), então o sistema retorna 403 por falta de autorização.
- [ ] Quando diretoriaAtiva não é informado na requisição, então o sistema retorna 403 por ausência do parâmetro obrigatório.

**Especificidade técnica:**
- Códigos HTTP: 403
- Campos: `diretoriaAtiva`, `directorias`
- Precisa de esclarecimento: sim — Falta definir se diretoriaAtiva é enviado via header, query param ou path param na requisição, para especificar o ponto exato de extração no middleware.

**Rastreabilidade:** REQ-357 (ver requirements.json)

---

### [Sprint 11] Rejeitar requisições via TenantGuard para diretoria inativa
<!-- sdd-bot:meta id="BL-256" epic="Operações Comuns" layer="backend" requirementIds="REQ-372" dependsOn="REQ-370,REQ-353" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-370, REQ-353

**Descrição:**
Implementar verificação de status no TenantGuard (guard/middleware do backend responsável por validar o contexto multi-tenant): antes de permitir a passagem para o handler da rota, o guard deve consultar o campo `active` da entidade Diretoria/Tenant associada ao `tenantId` extraído do token de autenticação e interromper a cadeia de execução caso o valor seja `false`. Atualmente o TenantGuard valida apenas a existência do tenant, sem checar seu status de ativação, permitindo que diretorias desativadas continuem servindo requisições a recursos protegidos (ex.: eventos, sócios, dashboard).

**Comportamento esperado:**
Requisições a qualquer endpoint protegido por TenantGuard cujo tenant esteja com `active = false` são rejeitadas com HTTP 403 e corpo `{"error": "TENANT_INACTIVE"}`, sem executar a lógica do controller/handler da rota.

**Critérios de aceite:**
- [ ] Quando uma requisição autenticada é feita para um recurso protegido de uma diretoria com status "active" = true, então o TenantGuard permite a passagem e o handler da rota é executado normalmente.
- [ ] Quando uma requisição autenticada é feita para um recurso protegido de uma diretoria com status "active" = false, então o TenantGuard bloqueia a requisição retornando HTTP 403 com corpo {"error": "TENANT_INACTIVE"} antes de qualquer lógica de negócio ser executada.
- [ ] Quando o tenantId presente no token/contexto de requisição não corresponde a nenhuma diretoria existente na tabela tenants, então o TenantGuard retorna HTTP 404 com corpo {"error": "TENANT_NOT_FOUND"}.
- [ ] Quando a requisição não possui tenantId no contexto (ex.: token malformado ou ausente), então o TenantGuard retorna HTTP 401 com corpo {"error": "TENANT_CONTEXT_MISSING"} sem consultar o banco de dados.
- [ ] Quando a diretoria é reativada (active = true) após estar inativa, então requisições subsequentes para a mesma diretoria voltam a ser permitidas pelo TenantGuard sem necessidade de reinício do serviço.

**Especificidade técnica:**
- Códigos HTTP: 401, 403, 404
- Campos: `active`, `tenantId`, `TENANT_INACTIVE`, `TENANT_NOT_FOUND`, `TENANT_CONTEXT_MISSING`
- Precisa de esclarecimento: sim — Não está definido se a resposta 403 deve incluir informações adicionais (ex.: data de desativação) nem se o guard deve emitir log/auditoria da tentativa de acesso negada. Também não está claro se o guard deve consultar o status do tenant em cache (com TTL) ou sempre diretamente no banco, o que impacta o critério de reativação imediata.

**Rastreabilidade:** REQ-372 (ver requirements.json)

---

### [Sprint 12] Permitir aprovação manual de não-estudante pela diretoria
<!-- sdd-bot:meta id="BL-257" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-12" dependsOn="REQ-8" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-8

**Descrição:**
Adicionar fluxo de aprovação opcional para usuários não-estudantes no backend: novo campo de status (ex.: approvalStatus: PENDING/APPROVED/REJECTED) na entidade de usuário/cadastro não-estudante, endpoint restrito ao papel DIRETORIA (ex.: PATCH /api/directories/{directoryId}/non-student-users/{userId}/approval) que atualiza esse status, e bloqueio de liberação de acesso (login/uso de recursos) enquanto approvalStatus for PENDING. Depende do cadastro de não-estudante implementado em REQ-8.

**Comportamento esperado:**
A diretoria consegue visualizar usuários não-estudantes pendentes e aprovar ou rejeitar seu acesso; usuários não aprovados permanecem bloqueados até decisão explícita.

**Critérios de aceite:**
- [ ] Quando um usuário DIRETORIA envia PATCH /api/directories/{directoryId}/non-student-users/{userId}/approval com body {"status":"APPROVED"}, então a API retorna 200 e o campo approvalStatus do usuário é atualizado para APPROVED.
- [ ] Quando o approvalStatus de um usuário não-estudante é PENDING, então tentativas de login/uso de recursos protegidos retornam 403 com mensagem 'Acesso aguardando aprovação da diretoria'.
- [ ] Quando um usuário sem papel DIRETORIA tenta acessar o endpoint de aprovação, então a API retorna 403 com mensagem 'Permissão insuficiente'.
- [ ] Quando a diretoria envia status inválido (fora de PENDING/APPROVED/REJECTED), então a API retorna 400 com mensagem 'Status de aprovação inválido'.
- [ ] Quando a diretoria rejeita um usuário (status=REJECTED), então o acesso permanece bloqueado e o usuário é notificado do motivo, se fornecido.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403
- Campos: `approvalStatus`, `status`, `directoryId`, `userId`
- Precisa de esclarecimento: sim — Não foi definido se a aprovação é por diretoria específica ou global, nem o mecanismo de notificação ao usuário rejeitado (e-mail, in-app).

**Rastreabilidade:** REQ-12 (ver requirements.json)

---

### [Sprint 12] Adicionar status ativo/inativo para diretorias
<!-- sdd-bot:meta id="BL-258" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-20" dependsOn="REQ-17" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-17

**Descrição:**
Adicionar campo isActive (boolean) na tabela/entidade de diretoria e endpoint PATCH /api/directories/{id}/status para alternar esse valor, restrito a papéis administrativos. Diretorias inativas devem ser filtradas das listagens públicas e ter suas operações de negócio bloqueadas (ex.: não podem aprovar novos usuários conforme REQ-17).

**Comportamento esperado:**
Um administrador consegue ativar ou inativar uma diretoria, e diretorias inativas deixam de aparecer/operar nas funcionalidades dependentes.

**Critérios de aceite:**
- [ ] Quando um administrador envia PATCH /api/directories/{id}/status com body {"isActive":false}, então a API retorna 200 e o campo isActive da diretoria é atualizado para false.
- [ ] Quando uma diretoria tem isActive=false, então ela não aparece na listagem GET /api/directories retornada para usuários finais.
- [ ] Quando uma diretoria inativa tenta executar ações restritas a diretorias ativas (ex.: aprovações de REQ-17), então a API retorna 409 com mensagem 'Diretoria inativa'.
- [ ] Quando um usuário sem permissão administrativa tenta alterar o status, então a API retorna 403 com mensagem 'Permissão insuficiente'.
- [ ] Quando o id da diretoria informado não existe, então a API retorna 404 com mensagem 'Diretoria não encontrada'.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404, 409
- Campos: `isActive`, `id`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-20 (ver requirements.json)

---

### [Sprint 12] Implementar cache Redis para sessões e descontos
<!-- sdd-bot:meta id="BL-259" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-48" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Integrar cliente Redis ao backend para armazenar (1) dados de sessão de usuário autenticado, substituindo ou complementando o armazenamento atual de sessão/JWT, e (2) dados de desconto (regras/valores aplicáveis) consultados com frequência, com chaves nomeadas (ex.: session:{userId}, discount:{code}) e TTL configurável para cada tipo de dado.

**Comportamento esperado:**
Consultas repetidas de sessão e desconto são atendidas pelo Redis sem nova consulta ao banco primário, reduzindo latência, e os dados expiram automaticamente conforme o TTL configurado.

**Critérios de aceite:**
- [ ] Quando uma sessão é criada após login, então uma chave session:{userId} é gravada no Redis com o TTL configurado e os dados são recuperáveis por essa chave.
- [ ] Quando uma regra de desconto é consultada pela segunda vez dentro do TTL, então a resposta é servida do Redis sem query ao banco primário, verificável via log/cache-hit.
- [ ] Quando o TTL de uma chave de sessão expira, então requisições subsequentes usando aquela sessão retornam 401 e exigem novo login.
- [ ] Quando a conexão com Redis falha ou está indisponível, então o sistema recorre (fallback) à consulta direta ao banco primário sem retornar erro 5xx ao cliente.
- [ ] Quando um desconto é atualizado/removido, então a chave discount:{code} correspondente é invalidada/atualizada no Redis para evitar dado obsoleto.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `session:{userId}`, `discount:{code}`
- Precisa de esclarecimento: sim — Não foi especificado o valor do TTL para sessões e para descontos, nem a estratégia de invalidação (event-driven vs polling) quando um desconto é alterado.

**Rastreabilidade:** REQ-48 (ver requirements.json)

---

### [Sprint 12] Servir imagens do sistema via CDN Cloudflare
<!-- sdd-bot:meta id="BL-260" epic="Introdução (parte 1)" layer="backend" requirementIds="REQ-49" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Configurar Cloudflare como CDN na frente do serviço/bucket de armazenamento de imagens do backend, ajustando as URLs geradas pela API (ex.: campo imageUrl retornado nos endpoints de perfil, eventos, produtos) para apontar ao domínio CDN em vez de servir diretamente do storage de origem, incluindo cabeçalhos de cache apropriados (Cache-Control) nas respostas de origem.

**Comportamento esperado:**
Requisições de imagens são atendidas pelos edge servers da Cloudflare, reduzindo carga no servidor de origem e latência de entrega ao usuário final.

**Critérios de aceite:**
- [ ] Quando uma imagem é solicitada via URL retornada pela API, então a resposta contém o cabeçalho indicando entrega via Cloudflare (ex.: cf-cache-status).
- [ ] Quando uma imagem é requisitada pela segunda vez dentro da janela de cache, então cf-cache-status retorna HIT em vez de MISS.
- [ ] Quando uma imagem é atualizada/substituída no storage de origem, então a URL/CDN reflete a nova versão após purge de cache ou uso de cache-busting (ex.: query param de versão).
- [ ] Quando o domínio CDN está indisponível, então a resposta ao cliente não retorna erro 5xx sem tratamento, havendo fallback ou mensagem de erro tratada.
- [ ] Quando uma imagem solicitada não existe no storage de origem, então a CDN repassa o erro 404 da origem ao cliente.

**Especificidade técnica:**
- Códigos HTTP: 404
- Campos: `imageUrl`, `Cache-Control`, `cf-cache-status`
- Precisa de esclarecimento: sim — Não foi definido o tempo de cache (Cache-Control max-age) nem a estratégia de invalidação/purge ao atualizar uma imagem existente.

**Rastreabilidade:** REQ-49 (ver requirements.json)

---

### [Sprint 12] Suportar API Gateway opcional para rate limit e auth
<!-- sdd-bot:meta id="BL-261" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-56" dependsOn="REQ-55" -->
**Tipo:** feature
**Prioridade:** could
**Depende de:** REQ-55

**Descrição:**
Adicionar camada de configuração no backend que permita habilitar/desabilitar via variável de ambiente (ex.: API_GATEWAY_ENABLED) o roteamento das requisições através de um API Gateway externo responsável por rate limiting e verificação de token JWT antes de encaminhar ao serviço de aplicação. Quando desabilitado, o backend deve continuar processando autenticação e limites internamente sem depender do gateway.

**Comportamento esperado:**
O sistema opera normalmente com ou sem o API Gateway ativo, aplicando rate limiting e verificação de autenticação em ambos os cenários sem duplicar ou pular validações.

**Critérios de aceite:**
- [ ] Quando API_GATEWAY_ENABLED=true e o gateway envia um header de identidade validado (ex.: X-Gateway-Auth), então o backend confia nessa validação e não reexecuta a verificação completa do JWT.
- [ ] Quando API_GATEWAY_ENABLED=false, então o backend aplica rate limiting e verificação de JWT internamente, como no fluxo atual.
- [ ] Quando uma requisição chega sem o header esperado do gateway e API_GATEWAY_ENABLED=true, então o backend responde 401 Unauthorized.
- [ ] Quando o número de requisições de um cliente excede o limite configurado, então o sistema (gateway ou backend, conforme modo ativo) responde 429 Too Many Requests.
- [ ] Quando a variável API_GATEWAY_ENABLED não está definida, então o sistema assume false como padrão e mantém o comportamento atual.

**Especificidade técnica:**
- Códigos HTTP: 401, 429
- Campos: `API_GATEWAY_ENABLED`, `X-Gateway-Auth`
- Precisa de esclarecimento: sim — Não há definição do produto de API Gateway a ser usado (ex.: Kong, AWS API Gateway, Nginx), do formato exato do header de identidade repassado, nem do valor numérico do limite de requisições (rate limit).

**Rastreabilidade:** REQ-56 (ver requirements.json)

---

### [Sprint 12] Implementar middleware de logging de requisições HTTP
<!-- sdd-bot:meta id="BL-262" epic="Introdução (parte 2)" layer="backend" requirementIds="REQ-70" dependsOn="REQ-57" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-57

**Descrição:**
Criar middleware no pipeline do backend que intercepta todas as requisições HTTP e registra método, path, status code de resposta, tempo de processamento (ms) e identificador do usuário autenticado (quando presente), gravando essas informações em formato estruturado (JSON) no stdout ou arquivo de log configurado.

**Comportamento esperado:**
Cada requisição processada pelo backend gera automaticamente uma entrada de log com os dados da chamada, sem exigir instrumentação manual em cada rota.

**Critérios de aceite:**
- [ ] Quando uma requisição GET /api/qualquer-rota é processada e retorna 200, então uma entrada de log é criada contendo method, path, statusCode e durationMs.
- [ ] Quando uma requisição falha com erro 500, então o log registra statusCode 500 e o corpo da mensagem de erro não expõe stack trace completo no log de produção.
- [ ] Quando o usuário está autenticado via JWT, então o log inclui o campo userId extraído do token.
- [ ] Quando o usuário não está autenticado, então o log registra userId como null sem interromper a requisição.
- [ ] Quando o middleware está ativo, então o tempo adicional de processamento por requisição não excede 5ms em média.

**Especificidade técnica:**
- Códigos HTTP: 200, 500
- Campos: `method`, `path`, `statusCode`, `durationMs`, `userId`
- Limites: 5ms de overhead médio por requisição
- Precisa de esclarecimento: sim — Não está definido o destino final dos logs (stdout, arquivo local, serviço externo como ELK/Datadog) nem a política de retenção.

**Rastreabilidade:** REQ-70 (ver requirements.json)

---

### [Sprint 12] Definir valor padrão 0.0 no campo desconto da Diretoria
<!-- sdd-bot:meta id="BL-263" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-78" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-76

**Descrição:**
Alterar a definição da coluna desconto na tabela/modelo Diretoria (migration de banco de dados e schema do ORM) para incluir DEFAULT 0.0, garantindo que inserções sem valor explícito para esse campo não resultem em NULL.

**Comportamento esperado:**
Registros de Diretoria criados sem informar o campo desconto são persistidos com o valor numérico 0.0 automaticamente.

**Critérios de aceite:**
- [ ] Quando uma nova Diretoria é criada via endpoint POST /diretorias sem o campo desconto no payload, então o registro é salvo com desconto = 0.0.
- [ ] Quando uma nova Diretoria é criada informando desconto = 15.5, então o valor 15.5 é persistido sem ser sobrescrito pelo padrão.
- [ ] Quando a migration é aplicada em uma tabela já existente com registros contendo desconto NULL, então esses registros não são alterados retroativamente, apenas novas inserções passam a usar o default.
- [ ] Quando o campo desconto é enviado como valor negativo (ex.: -5.0), então o sistema rejeita a criação com 400 Bad Request.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `desconto`
- Limites: valor padrão 0.0, mínimo permitido 0.0
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-78 (ver requirements.json)

---

### [Sprint 12] Definir valor padrão true no campo ativo da Diretoria
<!-- sdd-bot:meta id="BL-264" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-79" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-76

**Descrição:**
Alterar a definição da coluna ativo na tabela/modelo Diretoria (migration de banco de dados e schema do ORM) para incluir DEFAULT true, garantindo que inserções sem valor explícito para esse campo sejam persistidas como ativas.

**Comportamento esperado:**
Registros de Diretoria criados sem informar o campo ativo são persistidos com o valor booleano true automaticamente.

**Critérios de aceite:**
- [ ] Quando uma nova Diretoria é criada via endpoint POST /diretorias sem o campo ativo no payload, então o registro é salvo com ativo = true.
- [ ] Quando uma nova Diretoria é criada informando ativo = false, então o valor false é persistido sem ser sobrescrito pelo padrão.
- [ ] Quando a migration é aplicada em uma tabela já existente com registros contendo ativo NULL, então esses registros não são alterados retroativamente, apenas novas inserções passam a usar o default.
- [ ] Quando o campo ativo é enviado com um tipo inválido (ex.: string "sim" em vez de booleano), então o sistema rejeita a criação com 400 Bad Request.

**Especificidade técnica:**
- Códigos HTTP: 400
- Campos: `ativo`
- Limites: valor padrão true
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-79 (ver requirements.json)

---

### [Sprint 12] Criar índices para diretoriaId, rga e cpf em Usuario
<!-- sdd-bot:meta id="BL-265" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-91" dependsOn="REQ-86" -->
**Tipo:** tech-debt
**Prioridade:** should
**Depende de:** REQ-86

**Descrição:**
Adicionar índices de banco de dados (índices simples ou compostos, conforme suportado pelo SGBD) nas colunas diretoriaId, rga e cpf da tabela/entidade Usuario, via migration, para reduzir o custo de consultas que filtram ou ordenam por esses campos.

**Comportamento esperado:**
Consultas que filtram Usuario por diretoriaId, rga ou cpf utilizam os índices criados, reduzindo o tempo de execução em relação ao plano de execução sem índice (full table scan).

**Critérios de aceite:**
- [ ] Quando a migration for aplicada, então devem existir índices distintos nas colunas diretoriaId, rga e cpf da tabela Usuario.
- [ ] Quando uma consulta filtrar Usuario por cpf, então o plano de execução (EXPLAIN) deve indicar uso de index scan em vez de sequential/table scan.
- [ ] Quando a migration for revertida (rollback), então os três índices devem ser removidos sem afetar dados existentes na tabela Usuario.
- [ ] Quando um cpf ou rga já existente for inserido novamente sem constraint de unicidade definida neste requisito, então a criação do índice não deve impedir a inserção, pois este requisito não define unicidade, apenas performance de busca.

**Especificidade técnica:**
- Campos: `diretoriaId`, `rga`, `cpf`
- Precisa de esclarecimento: sim — Não está definido se os índices devem ser simples ou compostos, nem se algum desses campos deve ter constraint UNIQUE além do índice.

**Rastreabilidade:** REQ-91 (ver requirements.json)

---

### [Sprint 12] Registrar criadoEm e atualizadoEm automaticamente em Diretoria
<!-- sdd-bot:meta id="BL-266" epic="Introdução (parte 3)" layer="backend" requirementIds="REQ-95" dependsOn="REQ-76" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-76

**Descrição:**
Configurar os campos criadoEm e atualizadoEm da entidade Diretoria como timestamps gerenciados automaticamente pelo ORM/banco (ex.: @CreatedDate/@UpdatedDate ou equivalente, ou trigger de banco), sem exigir preenchimento manual na criação/atualização do registro.

**Comportamento esperado:**
O campo criadoEm é preenchido no momento da inserção do registro de Diretoria e permanece imutável; o campo atualizadoEm é atualizado automaticamente a cada UPDATE no registro.

**Critérios de aceite:**
- [ ] Quando uma nova Diretoria for criada, então o campo criadoEm deve ser preenchido automaticamente com a data/hora atual em formato ISO 8601.
- [ ] Quando uma Diretoria existente for atualizada, então o campo atualizadoEm deve ser sobrescrito com a data/hora atual, mantendo criadoEm inalterado.
- [ ] Quando uma requisição de criação enviar valor manual para criadoEm ou atualizadoEm, então esse valor deve ser ignorado e sobrescrito pelo valor gerado automaticamente pelo sistema.
- [ ] Quando uma Diretoria for criada e nenhuma atualização subsequente ocorrer, então criadoEm e atualizadoEm devem conter o mesmo valor inicial.

**Especificidade técnica:**
- Campos: `criadoEm`, `atualizadoEm`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-95 (ver requirements.json)

---

### [Sprint 12] Registrar timestamps de criação e atualização em Usuario
<!-- sdd-bot:meta id="BL-267" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-109" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Configurar os campos de data de criação e data de última atualização da entidade Usuario como timestamps gerenciados automaticamente pelo ORM/banco (ex.: @CreatedDate/@UpdatedDate ou equivalente), populados na persistência do registro.

**Comportamento esperado:**
O campo de data de criação é preenchido no momento do INSERT do usuário e permanece imutável; o campo de data de atualização é reescrito automaticamente a cada UPDATE do registro.

**Critérios de aceite:**
- [ ] Quando um novo Usuario for criado, então o campo de data de criação deve ser preenchido automaticamente com a data/hora atual em formato ISO 8601.
- [ ] Quando um Usuario existente for atualizado, então o campo de data de última atualização deve ser sobrescrito com a data/hora atual do momento do UPDATE.
- [ ] Quando uma requisição de criação enviar valor manual para o campo de data de criação, então esse valor deve ser ignorado e substituído pelo valor gerado automaticamente pelo sistema.
- [ ] Quando um Usuario for criado e nenhuma atualização subsequente ocorrer, então o campo de data de criação e o de última atualização devem conter o mesmo valor inicial.

**Especificidade técnica:**
- Campos: `criadoEm`, `atualizadoEm`
- Precisa de esclarecimento: sim — O requisito não especifica os nomes exatos dos campos (ex.: criadoEm/atualizadoEm vs createdAt/updatedAt); assumido alinhamento com nomenclatura usada em REQ-95 para consistência.

**Rastreabilidade:** REQ-109 (ver requirements.json)

---

### [Sprint 12] Relacionar Usuario aos seus registros de Socio
<!-- sdd-bot:meta id="BL-268" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-110" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Modelar um relacionamento (um-para-muitos ou um-para-um, conforme regra de negócio) entre a entidade Usuario e a entidade Socio, incluindo chave estrangeira usuarioId na tabela Socio e mapeamento no ORM para permitir navegação bidirecional (usuario.socios / socio.usuario).

**Comportamento esperado:**
Ao consultar um Usuario, é possível obter seus registros de Socio associados via relacionamento mapeado, sem necessidade de query manual adicional por parte do código chamador.

**Critérios de aceite:**
- [ ] Quando um Usuario possuir registros de Socio vinculados, então a consulta do Usuario deve permitir carregar a lista de Socio associados via relacionamento mapeado no ORM.
- [ ] Quando um Socio for criado com um usuarioId inexistente na tabela Usuario, então a operação deve falhar com erro de violação de chave estrangeira (constraint FK).
- [ ] Quando um Usuario sem nenhum Socio vinculado for consultado, então a lista de socios retornada deve ser vazia, não nula.
- [ ] Quando um Usuario for excluído e existirem registros de Socio vinculados a ele, então a exclusão deve respeitar a regra de integridade referencial definida (restrição ou cascade), impedindo exclusão órfã inconsistente.

**Especificidade técnica:**
- Campos: `usuarioId`
- Precisa de esclarecimento: sim — Não está definido se a cardinalidade é um-para-um ou um-para-muitos, nem se a exclusão de Usuario deve ser bloqueada (RESTRICT) ou propagada (CASCADE) para os registros de Socio.

**Rastreabilidade:** REQ-110 (ver requirements.json)

---

### [Sprint 12] Relacionar entidade Venda ao usuário comprador
<!-- sdd-bot:meta id="BL-269" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-111" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Adicionar coluna userId (foreign key) na tabela/entidade Venda referenciando a tabela User, criando relação 1:N (um usuário possui várias vendas). Atualizar o ORM (entity/model Sale) com o mapeamento de relacionamento (@ManyToOne/@BelongsTo) e criar migration para adicionar a coluna e a constraint de FK com ON DELETE RESTRICT ou SET NULL a definir. Expor o relacionamento nos endpoints de consulta de vendas (ex.: GET /users/{id}/sales) para retornar as vendas vinculadas ao usuário.

**Comportamento esperado:**
Ao consultar um usuário via GET /users/{id}/sales, a API retorna a lista de vendas associadas a ele; ao criar uma venda sem userId válido, a operação é rejeitada.

**Critérios de aceite:**
- [ ] Quando uma venda é criada com um userId de usuário existente, então o registro é persistido com a FK preenchida e retorna 201.
- [ ] Quando GET /users/{id}/sales é chamado para um usuário com vendas, então a resposta 200 contém a lista de vendas vinculadas a esse usuário.
- [ ] Quando uma venda é criada com userId inexistente, então a API retorna 400 (ou 404) com mensagem 'Usuário não encontrado'.
- [ ] Quando uma venda é criada sem o campo userId, então a API retorna 400 com mensagem 'userId é obrigatório'.
- [ ] Quando a migration é executada em uma base já populada, então vendas existentes sem userId não quebram a constraint (campo nullable ou valor de migração definido).

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 404
- Campos: `userId`, `GET /users/{id}/sales`
- Precisa de esclarecimento: sim — Definir a política de exclusão (ON DELETE CASCADE, SET NULL ou RESTRICT) para vendas quando o usuário associado for removido, e se o campo userId será nullable para vendas legadas.

**Rastreabilidade:** REQ-111 (ver requirements.json)

---

### [Sprint 12] Relacionar participações em eventos ao usuário
<!-- sdd-bot:meta id="BL-270" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-112" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Adicionar coluna userId (foreign key) na tabela/entidade EventParticipation referenciando a tabela User, criando relação 1:N. Atualizar o ORM (entity/model EventParticipation) com o mapeamento de relacionamento e criar migration para a coluna e constraint de FK. Expor endpoint GET /users/{id}/participations retornando as participações do usuário, incluindo dados do evento associado via join/relacionamento.

**Comportamento esperado:**
Ao consultar GET /users/{id}/participations, a API retorna a lista de eventos em que o usuário participou; ao registrar participação sem userId válido, a operação é rejeitada.

**Critérios de aceite:**
- [ ] Quando uma participação é criada com userId de usuário existente e eventId válido, então o registro é persistido e retorna 201.
- [ ] Quando GET /users/{id}/participations é chamado para um usuário com participações registradas, então a resposta 200 lista os eventos associados.
- [ ] Quando uma participação é criada com userId inexistente, então a API retorna 404 com mensagem 'Usuário não encontrado'.
- [ ] Quando uma participação é criada sem o campo userId, então a API retorna 400 com mensagem 'userId é obrigatório'.
- [ ] Quando o usuário não possui nenhuma participação registrada, então GET /users/{id}/participations retorna 200 com lista vazia.

**Especificidade técnica:**
- Códigos HTTP: 200, 201, 400, 404
- Campos: `userId`, `eventId`, `GET /users/{id}/participations`
- Precisa de esclarecimento: sim — Definir se pode haver múltiplas participações do mesmo usuário no mesmo evento (constraint de unicidade userId+eventId) e a política de exclusão em cascata.

**Rastreabilidade:** REQ-112 (ver requirements.json)

---

### [Sprint 12] Padronizar DTO de resposta de autenticação
<!-- sdd-bot:meta id="BL-271" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-130" dependsOn="REQ-119" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-119

**Descrição:**
Criar classe AuthResponseDto no módulo de autenticação contendo os campos padronizados retornados após login/refresh (ex.: accessToken, refreshToken, expiresIn, user resumido). Aplicar esse DTO como tipo de retorno nos endpoints POST /auth/login e POST /auth/refresh (dependência REQ-119), substituindo respostas ad-hoc atualmente retornadas pelos controllers, garantindo serialização consistente via class-transformer ou equivalente.

**Comportamento esperado:**
Toda resposta bem-sucedida de autenticação segue o mesmo formato de campos, independentemente do endpoint (login ou refresh) que a gerou.

**Critérios de aceite:**
- [ ] Quando POST /auth/login é chamado com credenciais válidas, então a resposta 200 contém exatamente os campos accessToken, refreshToken, expiresIn e user, no formato AuthResponseDto.
- [ ] Quando POST /auth/refresh é chamado com refreshToken válido, então a resposta 200 segue o mesmo formato AuthResponseDto usado no login.
- [ ] Quando as credenciais de login são inválidas, então a API retorna 401 com mensagem 'Credenciais inválidas', sem expor campos do AuthResponseDto.
- [ ] Quando um campo sensível não previsto no DTO (ex.: senha, hash) está presente na entidade User, então ele não aparece na resposta serializada.

**Especificidade técnica:**
- Códigos HTTP: 200, 401
- Campos: `accessToken`, `refreshToken`, `expiresIn`, `user`, `AuthResponseDto`
- Precisa de esclarecimento: sim — Definir a estrutura exata do campo 'user' resumido (quais atributos incluir) e o formato/unidade de expiresIn (segundos vs timestamp ISO).

**Rastreabilidade:** REQ-130 (ver requirements.json)

---

### [Sprint 12] Criar módulo shared com guards, decorators e filters comuns
<!-- sdd-bot:meta id="BL-272" epic="Introdução (parte 4)" layer="backend" requirementIds="REQ-132" dependsOn="REQ-66,REQ-126,REQ-127" -->
**Tipo:** tech-debt
**Prioridade:** should
**Depende de:** REQ-66, REQ-126, REQ-127

**Descrição:**
Criar módulo SharedModule no backend agrupando artefatos reutilizáveis entre módulos de domínio: guards de autenticação/autorização (dependentes de REQ-126/REQ-127), decorators customizados (ex.: @CurrentUser, @Roles), exception filters globais (ex.: HttpExceptionFilter) e middleware comuns (ex.: logging, correlation-id), integrando com a infraestrutura definida em REQ-66. Refatorar módulos existentes que hoje duplicam essas implementações para importar do SharedModule em vez de manter cópias locais.

**Comportamento esperado:**
Guards, decorators e filters passam a ser importados de um único módulo compartilhado, sem duplicação de código entre módulos de domínio.

**Critérios de aceite:**
- [ ] Quando um módulo de domínio importa SharedModule, então ele tem acesso aos guards, decorators e filters exportados sem redeclará-los localmente.
- [ ] Quando uma requisição não autenticada atinge uma rota protegida pelo guard compartilhado, então a API retorna 401 de forma consistente em todos os módulos que o utilizam.
- [ ] Quando uma exceção não tratada ocorre em qualquer módulo, então o filter global do SharedModule captura e retorna resposta padronizada com status e mensagem de erro.
- [ ] Após a refatoração, nenhuma implementação duplicada de guard/decorator/filter permanece nos módulos de domínio (verificável por busca no código).
- [ ] Quando o SharedModule é removido ou não importado por um módulo que depende dele, então o build/testes desse módulo falham indicando a dependência ausente.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `SharedModule`, `@CurrentUser`, `@Roles`, `HttpExceptionFilter`
- Precisa de esclarecimento: sim — Definir a lista final de guards/decorators/filters/middleware a migrar, já que depende da conclusão de REQ-66, REQ-126 e REQ-127, ainda não detalhados aqui.

**Rastreabilidade:** REQ-132 (ver requirements.json)

---

### [Sprint 12] Configurar exigência de aprovação manual por atlética
<!-- sdd-bot:meta id="BL-273" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-154" dependsOn="REQ-152" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-152

**Descrição:**
Adicionar campo booleano (ex.: exige_aprovacao_manual) na entidade/tabela Atletica, expor endpoint de atualização (ex.: PATCH /atleticas/{id}/configuracoes) restrito a ADMIN/DIRETORIA da própria atlética, e alterar o CpfVerificationService/fluxo de liberação de benefícios de sócio para consultar essa flag antes de liberar automaticamente os benefícios após validação de CPF.

**Comportamento esperado:**
Quando a flag exige_aprovacao_manual estiver ativa para uma atlética, o cadastro do sócio permanece em status pendente até aprovação explícita da DIRETORIA; quando desativada, os benefícios são liberados automaticamente após a validação de CPF.

**Critérios de aceite:**
- [ ] Quando um ADMIN/DIRETORIA da atlética envia PATCH /atleticas/{id}/configuracoes com exige_aprovacao_manual=true, então o sistema retorna 200 e persiste o valor na tabela Atletica.
- [ ] Quando exige_aprovacao_manual=true e um usuário conclui a validação de CPF, então os benefícios de sócio permanecem com status PENDENTE_APROVACAO até ação manual da DIRETORIA.
- [ ] Quando exige_aprovacao_manual=false (ou não configurado) e a validação de CPF é concluída, então os benefícios são liberados automaticamente sem intervenção manual.
- [ ] Quando um usuário sem papel DIRETORIA/ADMIN da atlética tenta alterar a configuração, então o sistema retorna 403 com mensagem 'Permissão insuficiente para alterar configuração da atlética'.
- [ ] Quando a atlética informada em {id} não existe, então o sistema retorna 404 com mensagem 'Atlética não encontrada'.

**Especificidade técnica:**
- Códigos HTTP: 200, 403, 404
- Campos: `exige_aprovacao_manual`, `PATCH /atleticas/{id}/configuracoes`, `status PENDENTE_APROVACAO`
- Precisa de esclarecimento: sim — Não está definido o nome exato do campo/coluna e do endpoint na API atual, nem o enum de status usado para benefícios de sócio; assumidos valores plausíveis a confirmar com o time.

**Rastreabilidade:** REQ-154 (ver requirements.json)

---

### [Sprint 12] Desacoplar CpfVerificationService para validação nível 3 futura
<!-- sdd-bot:meta id="BL-274" epic="5.3 Services Principais - CpfVerificationService" layer="backend" requirementIds="REQ-155" dependsOn="REQ-148" -->
**Tipo:** tech-debt
**Prioridade:** could
**Depende de:** REQ-148

**Descrição:**
Refatorar o CpfVerificationService introduzindo uma interface/abstração (ex.: CpfValidationProvider) com implementação atual (nível 2, validação local/algorítmica) desacoplada da lógica de negócio, e projetar o schema de dados (tabela de verificação de CPF) com campos genéricos (ex.: nivel_validacao, provedor, resposta_bruta em formato JSON) para acomodar futura integração com Receita Federal/Serpro sem migração estrutural.

**Comportamento esperado:**
Quando uma nova implementação de validação nível 3 (Serpro) for adicionada futuramente, ela pode ser plugada via configuração/injeção de dependência sem alterar o schema do banco nem o contrato do serviço existente.

**Critérios de aceite:**
- [ ] Quando o CpfVerificationService é invocado, então ele opera através da interface CpfValidationProvider, sem acoplamento direto à implementação concreta de validação nível 2.
- [ ] Quando a tabela de verificação de CPF é consultada, então ela contém colunas genéricas (nivel_validacao, provedor, resposta_bruta) capazes de armazenar dados de qualquer provedor sem alteração de schema.
- [ ] Quando uma nova implementação de provider nível 3 for registrada, então o sistema a seleciona por configuração (ex.: variável de ambiente ou tabela de configuração) sem exigir deploy de migração de banco.
- [ ] Quando testes de integração são executados com a implementação nível 2 atual, então o comportamento de validação de CPF permanece inalterado após a refatoração.

**Especificidade técnica:**
- Campos: `CpfValidationProvider`, `nivel_validacao`, `provedor`, `resposta_bruta`
- Precisa de esclarecimento: sim — Requisito é arquitetural (could); não há definição de quais campos exatos o Serpro retornaria nem o mecanismo de seleção de provider (config vs. feature flag) — decisão técnica pendente de definição com o time.

**Rastreabilidade:** REQ-155 (ver requirements.json)

---

### [Sprint 12] Reaproveitar fluxo de adição de diretoria no cadastro NAO_ESTUDANTE
<!-- sdd-bot:meta id="BL-275" epic="5.3 Services Principais - UsuarioDiretoriaService" layer="backend" requirementIds="REQ-159" dependsOn="REQ-158,REQ-141" -->
**Tipo:** refactor
**Prioridade:** should
**Depende de:** REQ-158, REQ-141

**Descrição:**
No UsuarioDiretoriaService, extrair a lógica de vinculação usuário-diretoria (atualmente usada no fluxo de 'adicionar membro à diretoria') em um método reutilizável, e invocar esse mesmo método no fluxo de cadastro de usuário do tipo NAO_ESTUDANTE, eliminando duplicação de código de criação do vínculo inicial.

**Comportamento esperado:**
Quando um usuário se cadastra como NAO_ESTUDANTE vinculado a uma diretoria, o vínculo inicial é criado usando exatamente a mesma rotina de validação e persistência do fluxo já existente de adição de membro à diretoria.

**Critérios de aceite:**
- [ ] Quando um usuário NAO_ESTUDANTE completa o cadastro informando uma atlética/diretoria válida, então o vínculo é criado reutilizando o método extraído de UsuarioDiretoriaService, com os mesmos registros de auditoria do fluxo original.
- [ ] Quando o método reutilizável é chamado tanto pelo fluxo de cadastro quanto pelo fluxo de adição manual de membro, então ambos produzem o mesmo resultado de persistência para entradas equivalentes (mesma estrutura de dados no banco).
- [ ] Quando o usuário já possui vínculo ativo com a diretoria informada, então o sistema retorna 409 com mensagem 'Usuário já vinculado a esta diretoria'.
- [ ] Quando a diretoria/atlética informada no cadastro não existe, então o sistema retorna 404 com mensagem 'Diretoria não encontrada' e o cadastro não é concluído.

**Especificidade técnica:**
- Códigos HTTP: 404, 409
- Campos: `UsuarioDiretoriaService`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-159 (ver requirements.json)

---

### [Sprint 12] Notificar usuário sobre aprovação de cadastro
<!-- sdd-bot:meta id="BL-276" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-300" dependsOn="REQ-299" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-299

**Descrição:**
No fluxo de aprovação de cadastro (dependente de REQ-299), adicionar disparo de notificação (e-mail e/ou notificação in-app) ao usuário quando o status do cadastro transicionar para APROVADO, informando que o login com CPF e senha já está disponível.

**Comportamento esperado:**
Quando o cadastro do usuário é aprovado pela DIRETORIA/ADMIN, o usuário recebe uma notificação informando a aprovação e passa a conseguir autenticar-se com CPF e senha no endpoint de login.

**Critérios de aceite:**
- [ ] Quando o status do cadastro muda para APROVADO, então o sistema envia notificação (e-mail) ao endereço cadastrado pelo usuário contendo confirmação de aprovação.
- [ ] Quando o usuário recebe a notificação de aprovação e tenta login com CPF e senha corretos, então o sistema retorna 200 com token de autenticação válido.
- [ ] Quando a tentativa de envio de notificação falha (ex.: erro no serviço de e-mail), então o sistema registra a falha em log e não reverte a aprovação do cadastro já persistida.
- [ ] Quando o cadastro é reprovado (status diferente de APROVADO), então nenhuma notificação de aprovação é enviada e o login com CPF/senha permanece bloqueado.

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `status APROVADO`, `CPF`, `senha`
- Precisa de esclarecimento: sim — Não está definido o canal exato da notificação (e-mail, push, in-app) nem o template/conteúdo da mensagem; assumido e-mail como canal principal a confirmar com o time.

**Rastreabilidade:** REQ-300 (ver requirements.json)

---

### [Sprint 12] Configurar aprovação manual opcional por atlética
<!-- sdd-bot:meta id="BL-277" epic="Introdução (parte 9)" layer="backend" requirementIds="REQ-301" dependsOn="REQ-295,REQ-299" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-295, REQ-299

**Descrição:**
Adicionar campo booleano `aprovacao_manual_obrigatoria` na tabela `atleticas` (default true), configurável via endpoint PATCH /atleticas/{id}/configuracoes. Ajustar o fluxo de confirmação de e-mail (REQ-295/REQ-299) para verificar essa flag: se false, o status do usuário muda automaticamente de `pendente` para `ativo` no evento de confirmação de e-mail, sem gerar solicitação de aprovação para a diretoria; se true, mantém o fluxo atual de fila de aprovação manual.

**Comportamento esperado:**
A diretoria consegue alternar a exigência de aprovação manual na tela de configurações da atlética, e o comportamento do cadastro de novos membros muda imediatamente conforme a configuração salva.

**Critérios de aceite:**
- [ ] Quando a diretoria envia PATCH /atleticas/{id}/configuracoes com {"aprovacao_manual_obrigatoria": false} e possui permissão de admin na atlética, então a API retorna 200 e o valor é persistido na tabela atleticas.
- [ ] Quando um usuário confirma o e-mail e a atlética tem aprovacao_manual_obrigatoria=false, então o status do usuário é alterado de pendente para ativo automaticamente, sem criar registro na fila de aprovação.
- [ ] Quando um usuário confirma o e-mail e a atlética tem aprovacao_manual_obrigatoria=true, então o status permanece pendente e um registro é criado na fila de aprovação para a diretoria.
- [ ] Quando um usuário sem papel de admin na atlética envia PATCH /atleticas/{id}/configuracoes, então a API retorna 403 com mensagem "Permissão insuficiente para alterar configurações da atlética".
- [ ] Quando o campo aprovacao_manual_obrigatoria é omitido no payload do PATCH, então a API retorna 400 com mensagem "Campo aprovacao_manual_obrigatoria é obrigatório" sem alterar o valor atual.

**Especificidade técnica:**
- Códigos HTTP: 200, 400, 403
- Campos: `aprovacao_manual_obrigatoria`, `PATCH /atleticas/{id}/configuracoes`
- Precisa de esclarecimento: não

**Rastreabilidade:** REQ-301 (ver requirements.json)

---

### [Sprint 12] Migrar armazenamento de sessão para cache Redis
<!-- sdd-bot:meta id="BL-278" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-302" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** should

**Descrição:**
Substituir o mecanismo atual de persistência de sessão (memória local ou tabela de banco) por armazenamento em Redis, usando chaves no formato `session:{session_id}` com serialização JSON do payload de sessão e TTL configurável via variável de ambiente SESSION_TTL_SECONDS. Implementar fallback de leitura/escrita e reconexão automática em caso de indisponibilidade do Redis.

**Comportamento esperado:**
As sessões de usuário são lidas e gravadas no Redis em vez do mecanismo anterior, com expiração automática após o TTL configurado e sem perda de sessões ativas durante o deploy da mudança.

**Critérios de aceite:**
- [ ] Quando um usuário realiza login, então a sessão é gravada no Redis com chave session:{session_id} e TTL igual ao valor de SESSION_TTL_SECONDS.
- [ ] Quando uma requisição autenticada chega com um session_id válido dentro do TTL, então o middleware recupera os dados da sessão do Redis e permite o acesso.
- [ ] Quando o TTL da sessão expira no Redis, então requisições subsequentes com esse session_id retornam 401 com mensagem "Sessão expirada".
- [ ] Quando a conexão com o Redis está indisponível no momento da autenticação, então a API retorna 503 com mensagem "Serviço de sessão indisponível" em vez de lançar exceção não tratada.
- [ ] Quando um usuário faz logout, então a chave session:{session_id} correspondente é removida do Redis imediatamente.

**Especificidade técnica:**
- Códigos HTTP: 401, 503
- Campos: `session:{session_id}`, `SESSION_TTL_SECONDS`
- Precisa de esclarecimento: sim — O requisito não define o valor do TTL de sessão nem o mecanismo de armazenamento atualmente em uso (para planejar a migração/fallback); esses valores devem ser definidos com o time antes da implementação.

**Rastreabilidade:** REQ-302 (ver requirements.json)

---

### [Sprint 12] Cachear consultas de diretorias por código de curso
<!-- sdd-bot:meta id="BL-279" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-303" dependsOn="REQ-302" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-302

**Descrição:**
Implementar cache Redis para o resultado de consultas de diretoria filtradas por código_curso, usando chave `diretoria:codigo_curso:{codigo_curso}` com serialização JSON e TTL configurável via variável DIRETORIA_CACHE_TTL_SECONDS. Invalidar (deletar) a chave correspondente sempre que houver criação, atualização ou remoção de diretoria vinculada ao mesmo código_curso.

**Comportamento esperado:**
Consultas repetidas de diretoria pelo mesmo código_curso são respondidas a partir do Redis, sem nova consulta ao banco, até que o TTL expire ou os dados sejam alterados.

**Critérios de aceite:**
- [ ] Quando a diretoria de um código_curso é consultada pela primeira vez, então o resultado é armazenado no Redis na chave diretoria:codigo_curso:{codigo_curso} com o TTL de DIRETORIA_CACHE_TTL_SECONDS.
- [ ] Quando a mesma consulta de código_curso é repetida antes do TTL expirar, então a resposta é servida do Redis e nenhuma query é executada no banco de dados.
- [ ] Quando uma diretoria vinculada a um código_curso é criada, atualizada ou removida, então a chave diretoria:codigo_curso:{codigo_curso} correspondente é invalidada no Redis.
- [ ] Quando o código_curso informado não corresponde a nenhuma diretoria cadastrada, então a API retorna 404 com mensagem "Diretoria não encontrada para o código de curso informado" e nenhum valor é cacheado.
- [ ] Quando o Redis está indisponível durante a consulta, então o sistema busca os dados diretamente no banco sem retornar erro ao usuário.

**Especificidade técnica:**
- Códigos HTTP: 404
- Campos: `diretoria:codigo_curso:{codigo_curso}`, `DIRETORIA_CACHE_TTL_SECONDS`, `codigo_curso`
- Precisa de esclarecimento: sim — O requisito não especifica o valor do TTL do cache de diretorias; deve ser definido com base na frequência esperada de alterações de diretoria.

**Rastreabilidade:** REQ-303 (ver requirements.json)

---

### [Sprint 12] Cachear permissões associadas a cada role
<!-- sdd-bot:meta id="BL-280" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-304" dependsOn="REQ-302" -->
**Tipo:** feature
**Prioridade:** should
**Depende de:** REQ-302

**Descrição:**
Implementar cache Redis para a lista de permissões vinculadas a cada role, usando chave `permissoes:role:{role_id}` com serialização JSON e TTL configurável via variável PERMISSOES_CACHE_TTL_SECONDS. Invalidar a chave correspondente sempre que houver alteração (adição/remoção de permissão) na role via endpoint de gestão de roles.

**Comportamento esperado:**
Verificações de permissão de um usuário consultam o Redis para obter as permissões da role em vez de consultar o banco a cada requisição, até que o TTL expire ou a role seja alterada.

**Critérios de aceite:**
- [ ] Quando as permissões de uma role são consultadas pela primeira vez, então o resultado é armazenado no Redis na chave permissoes:role:{role_id} com TTL de PERMISSOES_CACHE_TTL_SECONDS.
- [ ] Quando as permissões da mesma role são consultadas novamente antes do TTL expirar, então a resposta é lida do Redis e nenhuma query ao banco é executada.
- [ ] Quando uma permissão é adicionada ou removida de uma role via endpoint de gestão de roles, então a chave permissoes:role:{role_id} correspondente é invalidada no Redis imediatamente.
- [ ] Quando o role_id informado não existe na base, então a API retorna 404 com mensagem "Role não encontrada" e nenhum valor é cacheado.
- [ ] Quando o Redis está indisponível durante a verificação de permissão, então o sistema consulta as permissões diretamente no banco sem bloquear a requisição.

**Especificidade técnica:**
- Códigos HTTP: 404
- Campos: `permissoes:role:{role_id}`, `PERMISSOES_CACHE_TTL_SECONDS`, `role_id`
- Precisa de esclarecimento: sim — O requisito não especifica o valor do TTL do cache de permissões; deve ser definido considerando o impacto de atrasos na propagação de mudanças de permissão.

**Rastreabilidade:** REQ-304 (ver requirements.json)

---

### [Sprint 12] Criar índices compostos em (diretoriaId, field)
<!-- sdd-bot:meta id="BL-281" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-306" dependsOn="" -->
**Tipo:** tech-debt
**Prioridade:** should

**Descrição:**
Adicionar migrations criando índices compostos nas tabelas que filtram por diretoriaId combinado com outros campos frequentemente usados em cláusulas WHERE/ORDER BY (ex.: diretoriaId+status, diretoriaId+createdAt), reduzindo full table scans nas consultas do backend.

**Comportamento esperado:**
Consultas que filtram por diretoriaId em conjunto com outro campo indexado passam a usar o índice composto em vez de scan sequencial, reduzindo o tempo de execução da query.

**Critérios de aceite:**
- [ ] Quando uma migration for aplicada, então os índices compostos (diretoriaId, field) devem existir nas tabelas identificadas como críticas (ex.: membros, permissoes, eventos)
- [ ] Quando EXPLAIN for executado em uma query que filtra por diretoriaId + campo indexado, então o plano de execução deve indicar uso do índice (Index Scan) e não Seq Scan
- [ ] Quando a migration for revertida (rollback), então os índices devem ser removidos sem afetar dados existentes
- [ ] Quando um índice já existir com o mesmo nome, então a migration deve falhar de forma controlada sem corromper o schema

**Especificidade técnica:**
- Campos: `diretoriaId`
- Precisa de esclarecimento: sim — É necessário definir exatamente quais tabelas e quais campos secundários compõem cada índice composto (o requisito cita 'field' genericamente).

**Rastreabilidade:** REQ-306 (ver requirements.json)

---

### [Sprint 12] Habilitar EXPLAIN ANALYZE para diagnóstico de queries
<!-- sdd-bot:meta id="BL-282" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-307" dependsOn="REQ-306" -->
**Tipo:** tech-debt
**Prioridade:** could
**Depende de:** REQ-306

**Descrição:**
Disponibilizar mecanismo (script CLI ou endpoint restrito a ambiente de desenvolvimento) que execute EXPLAIN ANALYZE sobre queries do ORM/repositório configuradas, registrando plano de execução, tempo total e uso de índices para diagnóstico de queries lentas.

**Comportamento esperado:**
Desenvolvedores conseguem obter o plano de execução (EXPLAIN ANALYZE) de uma query específica e visualizar tempo de execução, custo estimado e se índices foram utilizados.

**Critérios de aceite:**
- [ ] Quando o comando/endpoint de diagnóstico for executado com uma query válida, então o resultado deve incluir plano de execução, tempo real (actual time) e custo estimado retornados pelo PostgreSQL
- [ ] Quando a query não usar nenhum índice disponível, então o output deve exibir 'Seq Scan' de forma identificável no plano retornado
- [ ] Quando o mecanismo for acionado em ambiente de produção sem flag de autorização, então o acesso deve ser negado com HTTP 403
- [ ] Quando a query fornecida for inválida (erro de sintaxe SQL), então o sistema deve retornar erro descritivo sem expor stack trace completo do banco

**Especificidade técnica:**
- Códigos HTTP: 403
- Precisa de esclarecimento: sim — Não está definido se o mecanismo será um endpoint HTTP, script de linha de comando, ou integração com ferramenta de APM; isso muda a forma de autorização e resposta.

**Rastreabilidade:** REQ-307 (ver requirements.json)

---

### [Sprint 12] Tornar backend stateless para múltiplas instâncias
<!-- sdd-bot:meta id="BL-283" epic="10. Performance e Escalabilidade" layer="backend" requirementIds="REQ-311" dependsOn="REQ-302" -->
**Tipo:** tech-debt
**Prioridade:** must
**Depende de:** REQ-302

**Descrição:**
Remover armazenamento de estado em memória local do processo backend (sessões, cache de permissões, filas em memória), migrando esses dados para armazenamento compartilhado externo (Redis) conforme REQ-302, permitindo que qualquer instância do backend atenda qualquer requisição sem afinidade de sessão (sticky session).

**Comportamento esperado:**
Múltiplas instâncias do backend rodando simultaneamente atrás de um load balancer processam requisições de um mesmo usuário de forma intercambiável, sem perda de sessão ou inconsistência de permissões.

**Critérios de aceite:**
- [ ] Quando duas ou mais instâncias do backend estiverem em execução e uma requisição autenticada for roteada para uma instância diferente da que criou a sessão, então a sessão deve permanecer válida via Redis
- [ ] Quando uma instância do backend for reiniciada ou finalizada, então as sessões ativas de outras instâncias não devem ser afetadas
- [ ] Quando o load balancer distribuir requisições sem sticky session, então nenhum dado de estado necessário para a requisição deve depender de memória local do processo
- [ ] Quando o Redis estiver indisponível, então o sistema deve responder com HTTP 503 em vez de falhar silenciosamente com estado corrompido

**Especificidade técnica:**
- Códigos HTTP: 503
- Precisa de esclarecimento: sim — Falta definir quais componentes específicos do backend hoje mantêm estado em memória (ex.: filas, contadores, cache local) para escopo completo da migração para Redis.

**Rastreabilidade:** REQ-311 (ver requirements.json)

---

### [Sprint 12] Monitorar uso do pool de conexões do banco
<!-- sdd-bot:meta id="BL-284" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-338" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Instrumentar o pool de conexões do banco de dados (ex.: via biblioteca de métricas do ORM/driver) expondo métricas de conexões ativas, ociosas, em espera e total configurado, integradas a um endpoint de métricas (ex.: /metrics) ou dashboard de observabilidade, com alerta quando o uso se aproximar do limite configurado.

**Comportamento esperado:**
Equipe de operação visualiza em tempo real o número de conexões ativas/ociosas/em espera do pool e recebe alerta quando a utilização ultrapassar um limiar definido.

**Critérios de aceite:**
- [ ] Quando o endpoint /metrics for consultado, então deve retornar HTTP 200 com os valores atuais de conexões ativas, ociosas e em espera do pool
- [ ] Quando o número de conexões ativas atingir 80% do limite máximo configurado do pool, então um alerta deve ser disparado para o canal de monitoramento configurado
- [ ] Quando o pool atingir 100% de utilização e novas requisições precisarem de conexão, então essas requisições devem entrar em fila em vez de falhar imediatamente, e essa fila também deve ser exposta como métrica
- [ ] Quando o serviço de métricas estiver indisponível, então isso não deve impactar o funcionamento das conexões de banco (falha isolada do subsistema de observabilidade)

**Especificidade técnica:**
- Códigos HTTP: 200
- Campos: `/metrics`
- Limites: 80% do limite configurado do pool como limiar de alerta
- Precisa de esclarecimento: sim — Não está definida a ferramenta de monitoramento/alerta a integrar (ex.: Prometheus/Grafana, Datadog) nem o valor exato do limite máximo de conexões do pool.

**Rastreabilidade:** REQ-338 (ver requirements.json)

---

### [Sprint 12] Monitorar falhas de validação de tokens JWT
<!-- sdd-bot:meta id="BL-285" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-339" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Instrumentar o middleware de autenticação JWT para capturar e registrar métricas de falhas de validação (token expirado, assinatura inválida, token malformado, token ausente), incrementando contadores por tipo de erro em um sistema de métricas (ex.: Prometheus counter `jwt_validation_failures_total` com label `reason`) e emitindo log estruturado com timestamp, endpoint acessado e motivo da falha a cada ocorrência.

**Comportamento esperado:**
Ao ocorrer uma falha de validação JWT em qualquer endpoint protegido, o evento é registrado no sistema de métricas com o motivo categorizado, permitindo consulta de volume de falhas por período e tipo através do dashboard de monitoramento.

**Critérios de aceite:**
- [ ] Quando um token JWT expirado é enviado em uma requisição, então o contador `jwt_validation_failures_total{reason="expired"}` é incrementado e um log estruturado é gravado com o endpoint e timestamp.
- [ ] Quando um token JWT com assinatura inválida é enviado, então o contador é incrementado com label `reason="invalid_signature"`.
- [ ] Quando uma requisição não envia token JWT em endpoint protegido, então a falha é registrada com `reason="missing_token"` e a resposta HTTP 401 é retornada normalmente sem impacto na latência acima de 50ms.
- [ ] Quando uma validação JWT é bem-sucedida, então nenhum incremento de falha é registrado nas métricas.
- [ ] Quando o volume de falhas de um mesmo motivo ultrapassa um limiar configurável em uma janela de tempo, então um alerta é disparado no sistema de monitoramento.

**Especificidade técnica:**
- Códigos HTTP: 401
- Campos: `jwt_validation_failures_total`, `reason`, `expired`, `invalid_signature`, `missing_token`
- Precisa de esclarecimento: sim — Falta definir a ferramenta de métricas/alertas a ser usada (Prometheus, Datadog, CloudWatch) e o limiar/janela de tempo para disparo de alerta de volume anômalo de falhas.

**Rastreabilidade:** REQ-339 (ver requirements.json)

---

### [Sprint 12] Monitorar taxa de aprovação/rejeição de cadastros não-estudante
<!-- sdd-bot:meta id="BL-286" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-341" dependsOn="" -->
**Tipo:** feature
**Prioridade:** should

**Descrição:**
Adicionar instrumentação no serviço/endpoint responsável pela decisão de aprovação de cadastros de usuários não-estudantes (ex.: `PATCH /admin/registrations/:id/approve` e `/reject`), registrando cada decisão como métrica categorizada (ex.: `registration_decision_total` com label `status` = `approved`/`rejected`) e calculando a taxa (aprovados/total) em janela configurável para exibição em dashboard.

**Comportamento esperado:**
A cada decisão de aprovação ou rejeição de cadastro não-estudante, o sistema registra o evento nas métricas, permitindo visualizar no dashboard de monitoramento a taxa de aprovação e rejeição acumulada e por período.

**Critérios de aceite:**
- [ ] Quando um cadastro não-estudante é aprovado, então o contador `registration_decision_total{status="approved"}` é incrementado.
- [ ] Quando um cadastro não-estudante é rejeitado, então o contador `registration_decision_total{status="rejected"}` é incrementado.
- [ ] Quando não há nenhuma decisão registrada em um período, então a taxa de aprovação exibida no dashboard é 0/0 tratada como indefinida (não gera erro de divisão por zero).
- [ ] Quando uma tentativa de decisão é feita por usuário sem permissão de administrador, então a métrica não é incrementada e a API retorna HTTP 403.
- [ ] Quando o mesmo cadastro é aprovado ou rejeitado mais de uma vez, então apenas a decisão final válida é contabilizada, evitando duplicidade na métrica.

**Especificidade técnica:**
- Códigos HTTP: 403
- Campos: `registration_decision_total`, `status`, `approved`, `rejected`
- Precisa de esclarecimento: sim — Falta definir o endpoint exato de aprovação/rejeição já existente no sistema e a janela de tempo padrão usada para cálculo da taxa exibida no dashboard.

**Rastreabilidade:** REQ-341 (ver requirements.json)

---

### [Sprint 12] Disparar alerta de indisponibilidade do banco de dados
<!-- sdd-bot:meta id="BL-287" epic="Operação e Manutenção" layer="backend" requirementIds="REQ-344" dependsOn="REQ-338" -->
**Tipo:** feature
**Prioridade:** must
**Depende de:** REQ-338

**Descrição:**
Implementar health check periódico de conectividade com o banco de dados (ex.: query leve tipo `SELECT 1` no pool de conexões monitorado no REQ-338) e integrar com sistema de alertas para notificar equipe de operação (ex.: e-mail, Slack ou PagerDuty) quando o health check falhar por N tentativas consecutivas configuráveis.

**Comportamento esperado:**
Quando o banco de dados fica inacessível, um alerta é disparado automaticamente para o canal de notificação configurado, informando o horário da falha e o serviço afetado, sem exigir verificação manual.

**Critérios de aceite:**
- [ ] Quando o health check de conexão com o banco falha por 3 tentativas consecutivas, então um alerta é enviado ao canal configurado com timestamp e mensagem indicando indisponibilidade.
- [ ] Quando a conexão com o banco é restabelecida após uma falha, então uma notificação de recuperação é enviada ao mesmo canal.
- [ ] Quando o banco está disponível e responde ao health check dentro do timeout configurado, então nenhum alerta é disparado.
- [ ] Quando o disparo do alerta falha (ex.: canal de notificação indisponível), então o erro é registrado em log sem interromper o loop de health check.
- [ ] Quando múltiplas falhas ocorrem dentro da janela de supressão configurada, então alertas duplicados não são reenviados repetidamente.

**Especificidade técnica:**
- Campos: `health_check`, `database_unavailable_alert`
- Limites: 3 tentativas consecutivas de falha antes do disparo do alerta
- Precisa de esclarecimento: sim — Falta definir o canal de notificação (e-mail, Slack, PagerDuty) e o timeout do health check, já que o requisito não especifica a ferramenta de alerta a integrar.

**Rastreabilidade:** REQ-344 (ver requirements.json)

---