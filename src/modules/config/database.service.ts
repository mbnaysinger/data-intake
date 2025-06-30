import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createServiceLogger } from './logger.service';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(private dataSource: DataSource) {}

  private logger = createServiceLogger('database-service');

  async onModuleDestroy() {
    try {
      await this.dataSource.destroy();
      this.logger.info('Conexao com banco de dados fechada');
    } catch (error) {
      this.logger.error('Erro ao fechar conexao com banco de dados', error);
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  async testConnection(): Promise<void> {
    try {
      await this.dataSource.query('SELECT 1 FROM DUAL');
      this.logger.debug('Conexao com banco de dados verificada');
    } catch (error) {
      this.logger.warn(
        'Erro de conexao com o banco, tentando reconectar',
        error,
      );
      await this.dataSource.destroy();
      await this.dataSource.initialize();
      this.logger.info('Reconexao com banco de dados bem-sucedida');
    }
  }
}
