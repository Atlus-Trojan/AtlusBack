import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDiretorias1790504149765 implements MigrationInterface {
    name = 'CreateDiretorias1790504149765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "diretorias" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(120) NOT NULL, "email" citext NOT NULL, "desconto_socio" numeric(5,2) NOT NULL DEFAULT '0', "exige_aprovacao" boolean NOT NULL DEFAULT true, "ativo" boolean NOT NULL DEFAULT true, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_50d76c8a4cfe4fa70b1a7d216b2" UNIQUE ("email"), CONSTRAINT "chk_diretorias_desconto" CHECK ("desconto_socio" BETWEEN 0 AND 100), CONSTRAINT "PK_9c847202a23c632ce6e8a03a133" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "diretorias"`);
    }

}
