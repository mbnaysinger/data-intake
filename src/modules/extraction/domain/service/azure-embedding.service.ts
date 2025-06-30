import { Injectable } from '@nestjs/common';
import { AzureOpenAI } from 'openai';
import { DocumentChunk } from '../model/document-chunk.model';
import { ConfigServerService } from '../../../config/config.service';
import { createServiceLogger } from '../../../config/logger.service';

@Injectable()
export class AzureEmbeddingService {
  private readonly logger = createServiceLogger('azure-embedding-service');
  private client: AzureOpenAI;

  constructor(private configService: ConfigServerService) {
    // Configurar Azure OpenAI usando a biblioteca oficial
    const azureApiKey = this.configService.get('config.openai.api_key');
    const azureEndpoint = this.configService.get('config.openai.endpoint');
    const azureDeploymentName =
      this.configService.get('config.openai.deployment_name') ||
      'text-embedding-3-large';

    this.logger.info(
      `Azure API Key configurada: ${azureApiKey ? 'Sim' : 'Não'}`,
    );
    this.logger.info(`Azure Endpoint: ${azureEndpoint || 'Não configurado'}`);
    this.logger.info(
      `Azure Deployment: ${azureDeploymentName || 'Não configurado'}`,
    );

    if (!azureApiKey || !azureEndpoint) {
      throw new Error(
        'Configuração de Azure OpenAI incompleta. Necessário: api_key e endpoint',
      );
    }

    // Criar cliente Azure OpenAI usando a biblioteca oficial
    this.client = new AzureOpenAI({
      apiKey: azureApiKey,
      endpoint: azureEndpoint,
      apiVersion: '2024-04-01-preview',
    });

    this.logger.info('Cliente Azure OpenAI configurado com sucesso');
  }

  async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    this.logger.info(`Gerando embeddings para ${chunks.length} chunks`);

    try {
      // Extrair textos dos chunks
      const texts = chunks.map((chunk) => chunk.content);

      // Gerar embeddings em lotes para melhor performance
      const batchSize = 10;
      const chunksWithEmbeddings: DocumentChunk[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        // Usar a biblioteca oficial da Microsoft
        const response = await this.client.embeddings.create({
          input: batch,
          model: 'text-embedding-3-large',
        });

        // Processar resposta
        for (let j = 0; j < batch.length; j++) {
          const chunk = chunks[i + j];
          const embedding = response.data[j].embedding;

          chunksWithEmbeddings.push({
            ...chunk,
            embedding,
            updatedAt: new Date(),
          });
        }

        this.logger.info(
          `Processados ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`,
        );
      }

      this.logger.info(
        `Embeddings gerados com sucesso para ${chunksWithEmbeddings.length} chunks`,
      );
      return chunksWithEmbeddings;
    } catch (error) {
      this.logger.error('Erro ao gerar embeddings:', error);
      throw new Error(`Falha ao gerar embeddings: ${error.message}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.info('Gerando embedding para texto único');

    try {
      const response = await this.client.embeddings.create({
        input: text,
        model: 'text-embedding-3-large',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Erro ao gerar embedding:', error);
      throw new Error(`Falha ao gerar embedding: ${error.message}`);
    }
  }
}
