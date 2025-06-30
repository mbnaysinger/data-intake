import { Module } from '@nestjs/common';
import { ExtractionController } from './api/v1/rest/extraction.controller';
import { ExtractionService } from './domain/service/extraction.service';
import { DocumentLoaderService } from './domain/service/document-loader.service';
import { ChunkingService } from './domain/service/chunking.service';
import { AzureEmbeddingService } from './domain/service/azure-embedding.service';
import { VectorStoreService } from './domain/service/vector-store.service';
import { FileUploadService } from './domain/service/file-upload.service';
import { ConfigServerModule } from '../config/config.module';

@Module({
  imports: [ConfigServerModule],
  controllers: [ExtractionController],
  providers: [
    ExtractionService,
    DocumentLoaderService,
    ChunkingService,
    AzureEmbeddingService,
    VectorStoreService,
    FileUploadService,
    {
      provide: 'IExtractionService',
      useExisting: ExtractionService,
    },
    {
      provide: 'IDocumentLoaderService',
      useExisting: DocumentLoaderService,
    },
    {
      provide: 'IChunkingService',
      useExisting: ChunkingService,
    },
    {
      provide: 'IEmbeddingService',
      useExisting: AzureEmbeddingService,
    },
    {
      provide: 'IVectorStoreService',
      useExisting: VectorStoreService,
    },
  ],
  exports: [
    ExtractionService,
    DocumentLoaderService,
    ChunkingService,
    AzureEmbeddingService,
    VectorStoreService,
  ],
})
export class ExtractionModule {}
