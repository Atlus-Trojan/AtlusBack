import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from './entities';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Invalid or missing DATABASE_URL');
}

const appDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  uuidExtension: 'pgcrypto',
  entities: DATABASE_ENTITIES,
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
  synchronize: false,
});

export default appDataSource;
