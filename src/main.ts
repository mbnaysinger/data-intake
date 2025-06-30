import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigServerService } from './modules/config/config.service';
import { createServiceLogger } from './modules/config/logger.service';

async function bootstrap() {
  const appLogger = createServiceLogger('nestjs-app');

  try {
    appLogger.info('Iniciando aplicacao Data Intake com NestJS');

    const app = await NestFactory.create(AppModule);

    // Obter o ConfigServerService da aplicação
    const configService = app.get(ConfigServerService);

    // Configuracao do Swagger
    const config = new DocumentBuilder()
      .setTitle('Data Intake API - Extração e Chunking')
      .setDescription(
        'API para extração, chunking e busca semântica de documentos usando LangChain, OpenAI e ChromaDB',
      )
      .setVersion('1.0.0')
      .addTag('Health', 'Endpoints de health check')
      .addTag(
        'Extração e Chunking',
        'Endpoints para extração e processamento de documentos',
      )
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    // Configuracao do CORS
    app.enableCors();

    const port = parseInt(configService.get('server.port', '3000'));
    await app.listen(port, '0.0.0.0');

    appLogger.info('Servidor NestJS iniciado com sucesso', {
      port,
      environment: configService.get('server.node_env', 'development'),
      docsUrl: `http://localhost:${port}/docs`,
    });
  } catch (error) {
    appLogger.error('Erro critico ao iniciar aplicacao NestJS', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  const appLogger = createServiceLogger('nestjs-app');
  appLogger.info('Recebido SIGINT, encerrando aplicacao');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const appLogger = createServiceLogger('nestjs-app');
  appLogger.info('Recebido SIGTERM, encerrando aplicacao');
  process.exit(0);
});

bootstrap();
