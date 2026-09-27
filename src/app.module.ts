import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { envValidationSchema } from './config/env.validation';
import { DATABASE_ENTITIES } from './database/entities';
import { EventosModule } from './modules/eventos/eventos.module';
import { LojaModule } from './modules/loja/loja.module';
import { SociosModule } from './modules/socios/socios.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { DiretoriasModule } from './modules/diretorias/diretorias.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        uuidExtension: 'pgcrypto',
        entities: DATABASE_ENTITIES,
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    DiretoriasModule,
    UsuariosModule,
    SociosModule,
    LojaModule,
    EventosModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
