import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionService } from './domain/service/extraction.service';
import { DocumentLoaderService } from './domain/service/document-loader.service';
import { ChunkingService } from './domain/service/chunking.service';
import { AzureEmbeddingService } from './domain/service/azure-embedding.service';
import { VectorStoreService } from './domain/service/vector-store.service';
import {
  ExtractionRequestDto,
  FileType,
  ChunkingStrategy,
} from './api/v1/dto/extraction-request.dto';

describe('ExtractionService', () => {
  let service: ExtractionService;
  let documentLoaderService: DocumentLoaderService;
  let chunkingService: ChunkingService;
  let embeddingService: AzureEmbeddingService;
  let vectorStoreService: VectorStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionService,
        {
          provide: DocumentLoaderService,
          useValue: {
            loadDocument: jest.fn(),
          },
        },
        {
          provide: ChunkingService,
          useValue: {
            createChunks: jest.fn(),
          },
        },
        {
          provide: AzureEmbeddingService,
          useValue: {
            generateEmbeddings: jest.fn(),
          },
        },
        {
          provide: VectorStoreService,
          useValue: {
            saveChunks: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExtractionService>(ExtractionService);
    documentLoaderService = module.get<DocumentLoaderService>(
      DocumentLoaderService,
    );
    chunkingService = module.get<ChunkingService>(ChunkingService);
    embeddingService = module.get<AzureEmbeddingService>(AzureEmbeddingService);
    vectorStoreService = module.get<VectorStoreService>(VectorStoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractDocument', () => {
    it('should successfully extract a document', async () => {
      // Arrange
      const request: ExtractionRequestDto = {
        source: '/test/document.pdf',
        fileType: FileType.PDF,
        chunkingStrategy: ChunkingStrategy.RECURSIVE,
        chunkSize: 1000,
        chunkOverlap: 200,
        saveToVectorStore: true,
      };

      const mockDocuments = [
        {
          pageContent: 'Test document content',
          metadata: { source: '/test/document.pdf' },
        },
      ];

      const mockChunks = [
        {
          id: 'chunk-1',
          content: 'Test document content',
          metadata: { source: '/test/document.pdf' },
          source: '/test/document.pdf',
          fileType: 'pdf',
          chunkIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChunksWithEmbeddings = [
        {
          ...mockChunks[0],
          embedding: [0.1, 0.2, 0.3],
        },
      ];

      jest
        .spyOn(documentLoaderService, 'loadDocument')
        .mockResolvedValue(mockDocuments);
      jest.spyOn(chunkingService, 'createChunks').mockResolvedValue(mockChunks);
      jest
        .spyOn(embeddingService, 'generateEmbeddings')
        .mockResolvedValue(mockChunksWithEmbeddings);
      jest.spyOn(vectorStoreService, 'saveChunks').mockResolvedValue();

      // Act
      const result = await service.extractDocument(request);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.totalChunks).toBe(1);
      expect(result.chunks).toHaveLength(1);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(documentLoaderService.loadDocument).toHaveBeenCalledWith(
        request.source,
        request.fileType,
      );
      expect(chunkingService.createChunks).toHaveBeenCalled();
      expect(embeddingService.generateEmbeddings).toHaveBeenCalled();
      expect(vectorStoreService.saveChunks).toHaveBeenCalled();
    });

    it('should handle extraction failure', async () => {
      // Arrange
      const request: ExtractionRequestDto = {
        source: '/test/document.pdf',
        fileType: FileType.PDF,
      };

      jest
        .spyOn(documentLoaderService, 'loadDocument')
        .mockRejectedValue(new Error('File not found'));

      // Act
      const result = await service.extractDocument(request);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.error).toBe('File not found');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should not save to vector store when saveToVectorStore is false', async () => {
      // Arrange
      const request: ExtractionRequestDto = {
        source: '/test/document.pdf',
        fileType: FileType.PDF,
        saveToVectorStore: false,
      };

      const mockDocuments = [
        {
          pageContent: 'Test document content',
          metadata: { source: '/test/document.pdf' },
        },
      ];

      const mockChunks = [
        {
          id: 'chunk-1',
          content: 'Test document content',
          metadata: { source: '/test/document.pdf' },
          source: '/test/document.pdf',
          fileType: 'pdf',
          chunkIndex: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockChunksWithEmbeddings = [
        {
          ...mockChunks[0],
          embedding: [0.1, 0.2, 0.3],
        },
      ];

      jest
        .spyOn(documentLoaderService, 'loadDocument')
        .mockResolvedValue(mockDocuments);
      jest.spyOn(chunkingService, 'createChunks').mockResolvedValue(mockChunks);
      jest
        .spyOn(embeddingService, 'generateEmbeddings')
        .mockResolvedValue(mockChunksWithEmbeddings);
      jest.spyOn(vectorStoreService, 'saveChunks').mockResolvedValue();

      // Act
      const result = await service.extractDocument(request);

      // Assert
      expect(result.status).toBe('completed');
      expect(vectorStoreService.saveChunks).not.toHaveBeenCalled();
    });
  });

  describe('getExtractionById', () => {
    it('should return null for non-existent extraction', async () => {
      // Act
      const result = await service.getExtractionById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('listExtractions', () => {
    it('should return empty array for list extractions', async () => {
      // Act
      const result = await service.listExtractions(10, 0);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
