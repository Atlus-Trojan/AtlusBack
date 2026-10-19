import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/exceptions/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
  });
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

bootstrap().catch((error: Error) => {
  Logger.error(
    `Application failed to start: ${error.message}`,
    error.stack,
    'Bootstrap',
  );
  process.exit(1);
});
