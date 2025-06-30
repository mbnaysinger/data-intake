import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DocumentExtraction } from '../model/document-chunk.model';
import { ExtractionRequestDto } from '../../api/v1/dto/extraction-request.dto';
import { DocumentLoaderService } from './document-loader.service';
import { ChunkingService } from './chunking.service';
import { AzureEmbeddingService } from './azure-embedding.service';
import { VectorStoreService } from './vector-store.service';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly documentLoaderService: DocumentLoaderService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingService: AzureEmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async extractDocument(
    request: ExtractionRequestDto,
  ): Promise<DocumentExtraction> {
    const startTime = Date.now();
    const extractionId = uuidv4();

    this.logger.log(
      `Iniciando extração ${extractionId} para ${request.source}`,
    );

    const extraction: DocumentExtraction = {
      id: extractionId,
      source: request.source,
      fileType: request.fileType,
      status: 'processing',
      totalChunks: 0,
      chunks: [],
      metadata: request.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // 1. Carregar o documento
      this.logger.log(`Carregando documento: ${request.source}`);
      const document = await this.documentLoaderService.loadDocument(
        request.source,
        request.fileType,
      );

      // 2. Fazer o chunking
      this.logger.log(
        `Realizando chunking com estratégia: ${request.chunkingStrategy}`,
      );
      const chunks = await this.chunkingService.createChunks(
        document,
        request.chunkingStrategy,
        request.chunkSize,
        request.chunkOverlap,
        {
          source: request.source,
          fileType: request.fileType,
          ...request.metadata,
        },
      );

      // 3. Gerar embeddings
      this.logger.log(`Gerando embeddings para ${chunks.length} chunks`);
      const chunksWithEmbeddings =
        await this.embeddingService.generateEmbeddings(chunks);

      // 4. Salvar no vector store (se solicitado)
      if (request.saveToVectorStore) {
        this.logger.log('Salvando chunks no vector store');
        await this.vectorStoreService.saveChunks(chunksWithEmbeddings);
      }

      // 5. Atualizar extração com sucesso
      extraction.status = 'completed';
      extraction.totalChunks = chunksWithEmbeddings.length;
      extraction.chunks = chunksWithEmbeddings;
      extraction.processingTime = Date.now() - startTime;
      extraction.updatedAt = new Date();

      this.logger.log(
        `Extração ${extractionId} concluída com sucesso. ${chunksWithEmbeddings.length} chunks criados em ${extraction.processingTime}ms`,
      );

      return extraction;
    } catch (error) {
      this.logger.error(`Erro na extração ${extractionId}:`, error);

      extraction.status = 'failed';
      extraction.error = error.message;
      extraction.processingTime = Date.now() - startTime;
      extraction.updatedAt = new Date();

      return extraction;
    }
  }

  async getExtractionById(
    extractionId: string,
  ): Promise<DocumentExtraction | null> {
    // Implementar busca no banco de dados
    this.logger.log(`Buscando extração: ${extractionId}`);
    return null;
  }

  async listExtractions(limit = 10, offset = 0): Promise<DocumentExtraction[]> {
    // Implementar listagem no banco de dados
    this.logger.log(`Listando extrações: limit=${limit}, offset=${offset}`);
    return [];
  }
}
