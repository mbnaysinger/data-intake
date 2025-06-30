import { Injectable } from '@nestjs/common';
import pino from 'pino';
import { ConfigServerService } from './config.service';

@Injectable()
export class LoggerService {
  private logger: pino.Logger;

  constructor(private configService: ConfigServerService) {
    this.logger = pino({
      level: this.configService.get('config.logging.level', 'info'),
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  createServiceLogger(serviceName: string): pino.Logger {
    return this.logger.child({ service: serviceName });
  }

  createJobLogger(jobName: string): pino.Logger {
    return this.logger.child({
      service: 'job',
      job: jobName,
      transactionId: this.generateTransactionId(),
    });
  }

  createAssinaturaLogger(
    assinaturaId: number,
    transactionId: string,
  ): pino.Logger {
    return this.logger.child({
      service: 'assinatura',
      assinaturaId,
      transactionId,
    });
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getLogger(): pino.Logger {
    return this.logger;
  }
}

// Funções de conveniência para manter compatibilidade com código existente
export function createServiceLogger(serviceName: string): pino.Logger {
  const configService = new ConfigServerService();
  const loggerService = new LoggerService(configService);
  return loggerService.createServiceLogger(serviceName);
}

export function createJobLogger(jobName: string): pino.Logger {
  const configService = new ConfigServerService();
  const loggerService = new LoggerService(configService);
  return loggerService.createJobLogger(jobName);
}

export function createAssinaturaLogger(
  assinaturaId: number,
  transactionId: string,
): pino.Logger {
  const configService = new ConfigServerService();
  const loggerService = new LoggerService(configService);
  return loggerService.createAssinaturaLogger(assinaturaId, transactionId);
}
