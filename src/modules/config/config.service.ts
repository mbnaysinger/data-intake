import { Injectable } from '@nestjs/common';
import * as yaml from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import pino from 'pino';

@Injectable()
export class ConfigServerService {
  private logger: pino.Logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  });

  private config: Record<string, any> = {};
  private configLoaded = false;

  constructor() {
    if (this.configLoaded) {
      this.logger.info('Configurations already loaded. Skipping.');
      return;
    }
    if (process.env.NODE_ENV === 'test') {
      this.logger.info('Test context, ignoring application config.');
      return;
    }
    this.loadConfigurationsSync();
    this.configLoaded = true;
  }

  get(key: string, defaultValue?: any): any {
    const keys = key.split('.');
    let result = this.config;

    for (const k of keys) {
      result = result ? result[k] : undefined;
    }

    return result !== undefined ? result : defaultValue;
  }

  getConfig(): Record<string, any> {
    return this.config;
  }

  private loadConfigurationsSync() {
    const isConfigServerDisabled = process.env.NODE_ENV === 'local';

    if (isConfigServerDisabled) {
      try {
        const path = join(process.cwd(), '.env.yml');
        this.logger.info(`Loading configurations from ${path} file.`);
        const yamlConfig = readFileSync(path, 'utf8');
        this.config = yaml.parse(yamlConfig);
        this.logger.info(
          'Configurations loaded from .env.yml file successfully.',
        );
      } catch (error) {
        this.logger.error(
          'Failed to load configurations from .env.yml file: ',
          error.message,
        );
        throw new Error('Could not load configurations from .env.yml file');
      }
    } else {
      // Carregar do Config Server
      const configServerUrl = process.env.CONFIG_SERVER_URL;
      this.logger.info(
        `Loading configurations from Config Server: ${configServerUrl}`,
      );
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const request = require('sync-request');
        this.logger.info(
          `Conteudo do request: ${request('GET', configServerUrl).getBody('utf8')}`,
        );
        const response = request('GET', configServerUrl);
        this.logger.info(`Conteudo do response: ${response.getBody('utf8')}`);
        try {
          this.config = yaml.parse(response.getBody('utf8'));
          this.logger.info(
            `Conteudo do parse: ${yaml.parse(response.getBody('utf8'))}`,
          );
        } catch (parseError) {
          const responseBody = response.getBody('utf8');
          this.logger.info(
            `Failed to parse YAML from Config Server response: ${parseError.message} com o conteudo ${responseBody}`,
          );
          this.logger.error(
            `Response content that failed to parse: ${responseBody}`,
          );
          throw new Error('Could not parse YAML from Config Server response');
        }
        this.logger.info(
          'Configurations loaded from Config Server successfully.',
        );
      } catch (error) {
        this.logger.error(
          `Failed to load configurations from Config Server: ${error.message}`,
        );
        throw new Error('Could not load configurations from Config Server');
      }
    }
  }
}
