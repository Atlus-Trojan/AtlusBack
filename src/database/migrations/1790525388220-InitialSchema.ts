import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790525388220 implements MigrationInterface {
  name = 'InitialSchema1790525388220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensões do PostgreSQL
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "citext"
    `);

    // Enums
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_vinculo"
      AS ENUM ('ESTUDANTE', 'NAO_ESTUDANTE')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."papel_atletica"
      AS ENUM ('DIRETORIA', 'MEMBRO')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."status_vinculo"
      AS ENUM ('PENDENTE', 'ATIVO', 'REJEITADO')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."role"
      AS ENUM ('DIRETORIA', 'SOCIO', 'ALUNO')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."status_pedido"
      AS ENUM ('CONFIRMADO', 'CANCELADO')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."status_participacao"
      AS ENUM ('CONFIRMADA', 'CANCELADA')
    `);

    // Tenant e acesso
    await queryRunner.query(`
      CREATE TABLE "diretorias" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nome" character varying(120) NOT NULL,
        "email" citext NOT NULL,
        "desconto_socio" numeric(5,2) NOT NULL DEFAULT '0',
        "exige_aprovacao" boolean NOT NULL DEFAULT true,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "chk_diretorias_desconto"
          CHECK ("desconto_socio" >= 0 AND "desconto_socio" <= 100),
        CONSTRAINT "PK_9c847202a23c632ce6e8a03a133"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cursos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "codigo" character varying(20) NOT NULL,
        "nome" character varying(120),
        "diretoria_id" uuid NOT NULL,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_391c5a635ef6b4bd0a46cb75653"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tipo_vinculo" "public"."tipo_vinculo" NOT NULL,
        "rga" character varying(20),
        "cpf_hash" character(64),
        "cpf_cifrado" bytea,
        "email" citext NOT NULL,
        "email_verificado_em" TIMESTAMP WITH TIME ZONE,
        "senha_hash" character varying(72) NOT NULL,
        "nome" character varying(150) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "consentimento_em" TIMESTAMP WITH TIME ZONE NOT NULL,
        "termo_versao" character varying(20) NOT NULL,
        "anonimizado_em" TIMESTAMP WITH TIME ZONE,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "chk_usuarios_documento" CHECK (
          "anonimizado_em" IS NOT NULL
          OR (
            (
              "tipo_vinculo" = 'ESTUDANTE'
              AND "rga" IS NOT NULL
              AND "cpf_hash" IS NULL
              AND "cpf_cifrado" IS NULL
            )
            OR (
              "tipo_vinculo" = 'NAO_ESTUDANTE'
              AND "rga" IS NULL
              AND "cpf_hash" IS NOT NULL
              AND "cpf_cifrado" IS NOT NULL
            )
          )
        ),
        CONSTRAINT "PK_d7281c63c176e152e4c531594a8"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "usuario_diretoria" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id" uuid NOT NULL,
        "diretoria_id" uuid NOT NULL,
        "papel" "public"."papel_atletica" NOT NULL DEFAULT 'MEMBRO',
        "status" "public"."status_vinculo" NOT NULL DEFAULT 'PENDENTE',
        "principal" boolean NOT NULL DEFAULT false,
        "decidido_por_id" uuid,
        "decidido_em" TIMESTAMP WITH TIME ZONE,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_usuario_diretoria_usuario_diretoria"
          UNIQUE ("usuario_id", "diretoria_id"),
        CONSTRAINT "PK_02bb5c76341417212c94850708b"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "socios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id" uuid NOT NULL,
        "diretoria_id" uuid NOT NULL,
        "valido_de" date NOT NULL DEFAULT ('now'::text)::date,
        "valido_ate" date,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_socios_usuario_diretoria"
          UNIQUE ("usuario_id", "diretoria_id"),
        CONSTRAINT "PK_19aa081436e91864ec86a4bf912"
          PRIMARY KEY ("id")
      )
    `);

    // Loja
    await queryRunner.query(`
      CREATE TABLE "produtos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "diretoria_id" uuid NOT NULL,
        "nome" character varying(150) NOT NULL,
        "descricao" text,
        "preco" numeric(10,2) NOT NULL,
        "estoque" integer NOT NULL DEFAULT '0',
        "imagem_url" text,
        "ativo" boolean NOT NULL DEFAULT true,
        "versao" integer NOT NULL,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_produtos_id_diretoria"
          UNIQUE ("id", "diretoria_id"),
        CONSTRAINT "chk_produtos_preco"
          CHECK ("preco" >= 0),
        CONSTRAINT "chk_produtos_estoque"
          CHECK ("estoque" >= 0),
        CONSTRAINT "PK_a5d976312809192261ed96174f3"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "pedidos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "diretoria_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "status" "public"."status_pedido" NOT NULL DEFAULT 'CONFIRMADO',
        "papel_aplicado" "public"."role" NOT NULL,
        "desconto_percentual" numeric(5,2) NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        "desconto_valor" numeric(10,2) NOT NULL,
        "total" numeric(10,2) NOT NULL,
        "cancelado_em" TIMESTAMP WITH TIME ZONE,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "uq_pedidos_id_diretoria"
          UNIQUE ("id", "diretoria_id"),
        CONSTRAINT "chk_pedidos_valores" CHECK (
          "desconto_percentual" >= 0
          AND "subtotal" >= 0
          AND "desconto_valor" >= 0
          AND "total" >= 0
          AND "total" = "subtotal" - "desconto_valor"
        ),
        CONSTRAINT "PK_ebb5680ed29a24efdc586846725"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "itens_pedido" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "pedido_id" uuid NOT NULL,
        "diretoria_id" uuid NOT NULL,
        "produto_id" uuid NOT NULL,
        "produto_nome" character varying(150) NOT NULL,
        "quantidade" integer NOT NULL,
        "preco_unitario" numeric(10,2) NOT NULL,
        "preco_unitario_final" numeric(10,2) NOT NULL,
        CONSTRAINT "chk_itens_quantidade"
          CHECK ("quantidade" > 0),
        CONSTRAINT "chk_itens_valores" CHECK (
          "preco_unitario_final" >= 0
          AND "preco_unitario_final" <= "preco_unitario"
        ),
        CONSTRAINT "PK_34ba752329a604381e367c431ff"
          PRIMARY KEY ("id")
      )
    `);

    // Eventos
    await queryRunner.query(`
      CREATE TABLE "eventos" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "diretoria_id" uuid NOT NULL,
        "nome" character varying(150) NOT NULL,
        "descricao" text,
        "data_hora" TIMESTAMP WITH TIME ZONE NOT NULL,
        "local" character varying(200),
        "preco_base" numeric(10,2) NOT NULL DEFAULT '0',
        "vagas" integer,
        "vagas_ocupadas" integer NOT NULL DEFAULT '0',
        "banner_url" text,
        "ativo" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "chk_eventos_preco"
          CHECK ("preco_base" >= 0),
        CONSTRAINT "chk_eventos_vagas" CHECK (
          "vagas" IS NULL
          OR (
            "vagas" > 0
            AND "vagas_ocupadas" <= "vagas"
          )
        ),
        CONSTRAINT "chk_eventos_ocupadas"
          CHECK ("vagas_ocupadas" >= 0),
        CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e"
          PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "participacoes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "evento_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "status" "public"."status_participacao" NOT NULL DEFAULT 'CONFIRMADA',
        "papel_aplicado" "public"."role" NOT NULL,
        "preco_base" numeric(10,2) NOT NULL,
        "desconto_percentual" numeric(5,2) NOT NULL,
        "preco_final" numeric(10,2) NOT NULL,
        "cancelado_em" TIMESTAMP WITH TIME ZONE,
        "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "chk_participacoes_valores" CHECK (
          "preco_final" >= 0
          AND "preco_final" <= "preco_base"
        ),
        CONSTRAINT "PK_c03daf910b5b6a2fc4c5b11c189"
          PRIMARY KEY ("id")
      )
    `);

    // Índices de tenant e acesso
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_diretorias_email"
      ON "diretorias" ("email")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_cursos_codigo"
      ON "cursos" ("codigo")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_cursos_diretoria"
      ON "cursos" ("diretoria_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_usuarios_email"
      ON "usuarios" ("email")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_usuarios_cpf_hash"
      ON "usuarios" ("cpf_hash")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_usuarios_rga"
      ON "usuarios" ("rga")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_usuario_diretoria_principal"
      ON "usuario_diretoria" ("usuario_id")
      WHERE "principal"
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_usuario_diretoria_fila"
      ON "usuario_diretoria" ("diretoria_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_socios_diretoria"
      ON "socios" ("diretoria_id")
    `);

    // Índices da loja
    await queryRunner.query(`
      CREATE INDEX "idx_produtos_diretoria_ativo"
      ON "produtos" ("diretoria_id", "ativo")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_diretoria_data"
      ON "pedidos" ("diretoria_id", "criado_em")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_usuario_data"
      ON "pedidos" ("usuario_id", "criado_em")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_itens_pedido_pedido"
      ON "itens_pedido" ("pedido_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_itens_pedido_produto"
      ON "itens_pedido" ("produto_id")
    `);

    // Índices de eventos
    await queryRunner.query(`
      CREATE INDEX "idx_eventos_diretoria_data"
      ON "eventos" ("diretoria_id", "data_hora")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_participacoes_evento_usuario"
      ON "participacoes" ("evento_id", "usuario_id")
      WHERE "status" = 'CONFIRMADA'
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_participacoes_usuario_data"
      ON "participacoes" ("usuario_id", "criado_em")
    `);

    // Foreign keys de tenant e acesso
    await queryRunner.query(`
      ALTER TABLE "cursos"
      ADD CONSTRAINT "fk_cursos_diretoria"
      FOREIGN KEY ("diretoria_id")
      REFERENCES "diretorias" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_diretoria"
      ADD CONSTRAINT "fk_usuario_diretoria_usuario"
      FOREIGN KEY ("usuario_id")
      REFERENCES "usuarios" ("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_diretoria"
      ADD CONSTRAINT "fk_usuario_diretoria_diretoria"
      FOREIGN KEY ("diretoria_id")
      REFERENCES "diretorias" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_diretoria"
      ADD CONSTRAINT "fk_usuario_diretoria_decidido_por"
      FOREIGN KEY ("decidido_por_id")
      REFERENCES "usuarios" ("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "socios"
      ADD CONSTRAINT "fk_socios_usuario"
      FOREIGN KEY ("usuario_id")
      REFERENCES "usuarios" ("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "socios"
      ADD CONSTRAINT "fk_socios_diretoria"
      FOREIGN KEY ("diretoria_id")
      REFERENCES "diretorias" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "socios"
      ADD CONSTRAINT "fk_socios_usuario_diretoria"
      FOREIGN KEY ("usuario_id", "diretoria_id")
      REFERENCES "usuario_diretoria" ("usuario_id", "diretoria_id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Foreign keys da loja
    await queryRunner.query(`
      ALTER TABLE "produtos"
      ADD CONSTRAINT "fk_produtos_diretoria"
      FOREIGN KEY ("diretoria_id")
      REFERENCES "diretorias" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD CONSTRAINT "fk_pedidos_diretoria"
      FOREIGN KEY ("diretoria_id")
      REFERENCES "diretorias" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD CONSTRAINT "fk_pedidos_usuario"
      FOREIGN KEY ("usuario_id")
      REFERENCES "usuarios" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD CONSTRAINT "fk_itens_pedido_pedido"
      FOREIGN KEY ("pedido_id", "diretoria_id")
      REFERENCES "pedidos" ("id", "diretoria_id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD CONSTRAINT "fk_itens_pedido_produto"
      FOREIGN KEY ("produto_id", "diretoria_id")
      REFERENCES "produtos" ("id", "diretoria_id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    // Foreign keys de eventos
    await queryRunner.query(`
      ALTER TABLE "eventos"
      ADD CONSTRAINT "fk_eventos_diretoria"
      FOREIGN KEY ("diretoria_id")
      REFERENCES "diretorias" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "participacoes"
      ADD CONSTRAINT "fk_participacoes_evento"
      FOREIGN KEY ("evento_id")
      REFERENCES "eventos" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "participacoes"
      ADD CONSTRAINT "fk_participacoes_usuario"
      FOREIGN KEY ("usuario_id")
      REFERENCES "usuarios" ("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign keys de eventos
    await queryRunner.query(`
      ALTER TABLE "participacoes"
      DROP CONSTRAINT "fk_participacoes_usuario"
    `);

    await queryRunner.query(`
      ALTER TABLE "participacoes"
      DROP CONSTRAINT "fk_participacoes_evento"
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos"
      DROP CONSTRAINT "fk_eventos_diretoria"
    `);

    // Foreign keys da loja
    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      DROP CONSTRAINT "fk_itens_pedido_produto"
    `);

    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      DROP CONSTRAINT "fk_itens_pedido_pedido"
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      DROP CONSTRAINT "fk_pedidos_usuario"
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      DROP CONSTRAINT "fk_pedidos_diretoria"
    `);

    await queryRunner.query(`
      ALTER TABLE "produtos"
      DROP CONSTRAINT "fk_produtos_diretoria"
    `);

    // Foreign keys de tenant e acesso
    await queryRunner.query(`
      ALTER TABLE "socios"
      DROP CONSTRAINT "fk_socios_usuario_diretoria"
    `);

    await queryRunner.query(`
      ALTER TABLE "socios"
      DROP CONSTRAINT "fk_socios_diretoria"
    `);

    await queryRunner.query(`
      ALTER TABLE "socios"
      DROP CONSTRAINT "fk_socios_usuario"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_diretoria"
      DROP CONSTRAINT "fk_usuario_diretoria_decidido_por"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_diretoria"
      DROP CONSTRAINT "fk_usuario_diretoria_diretoria"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario_diretoria"
      DROP CONSTRAINT "fk_usuario_diretoria_usuario"
    `);

    await queryRunner.query(`
      ALTER TABLE "cursos"
      DROP CONSTRAINT "fk_cursos_diretoria"
    `);

    // Índices de eventos
    await queryRunner.query(`
      DROP INDEX "public"."idx_participacoes_usuario_data"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_participacoes_evento_usuario"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_eventos_diretoria_data"
    `);

    // Índices da loja
    await queryRunner.query(`
      DROP INDEX "public"."idx_itens_pedido_produto"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_itens_pedido_pedido"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_pedidos_usuario_data"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_pedidos_diretoria_data"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_produtos_diretoria_ativo"
    `);

    // Índices de tenant e acesso
    await queryRunner.query(`
      DROP INDEX "public"."idx_socios_diretoria"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_usuario_diretoria_fila"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_usuario_diretoria_principal"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_usuarios_rga"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_usuarios_cpf_hash"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_usuarios_email"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."idx_cursos_diretoria"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_cursos_codigo"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."uq_diretorias_email"
    `);

    // Tabelas, na ordem inversa de dependência
    await queryRunner.query(`DROP TABLE "participacoes"`);
    await queryRunner.query(`DROP TABLE "eventos"`);
    await queryRunner.query(`DROP TABLE "itens_pedido"`);
    await queryRunner.query(`DROP TABLE "pedidos"`);
    await queryRunner.query(`DROP TABLE "produtos"`);
    await queryRunner.query(`DROP TABLE "socios"`);
    await queryRunner.query(`DROP TABLE "usuario_diretoria"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "cursos"`);
    await queryRunner.query(`DROP TABLE "diretorias"`);

    // Enums, na ordem inversa de dependência
    await queryRunner.query(`DROP TYPE "public"."status_participacao"`);
    await queryRunner.query(`DROP TYPE "public"."status_pedido"`);
    await queryRunner.query(`DROP TYPE "public"."role"`);
    await queryRunner.query(`DROP TYPE "public"."status_vinculo"`);
    await queryRunner.query(`DROP TYPE "public"."papel_atletica"`);
    await queryRunner.query(`DROP TYPE "public"."tipo_vinculo"`);
  }
}
