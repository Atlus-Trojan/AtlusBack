import { Module, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Module({})
export class DatabaseModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    if (!this.dataSource.isInitialized) {
      throw new Error('Database connection failed to initialize');
    }
    this.logger.log('Database connected');
  }
}
