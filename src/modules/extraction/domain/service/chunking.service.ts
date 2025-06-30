import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { DocumentChunk } from '../model/document-chunk.model';
import { ChunkingStrategy } from '../../api/v1/dto/extraction-request.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  async createChunks(
    documents: Document[],
    strategy: ChunkingStrategy,
    chunkSize: number = 1000,
    chunkOverlap: number = 200,
    metadata: Record<string, any> = {},
  ): Promise<DocumentChunk[]> {
    this.logger.log(`Criando chunks com estratégia: ${strategy}`);

    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    for (const document of documents) {
      const splitter = this.createTextSplitter(
        strategy,
        chunkSize,
        chunkOverlap,
      );
      const splitDocs = await splitter.splitDocuments([document]);

      for (const splitDoc of splitDocs) {
        const chunk: DocumentChunk = {
          id: uuidv4(),
          content: splitDoc.pageContent,
          metadata: {
            ...splitDoc.metadata,
            ...metadata,
            chunkIndex,
            originalDocumentId: document.metadata?.id || 'unknown',
          },
          source: metadata.source || 'unknown',
          fileType: metadata.fileType || 'unknown',
          chunkIndex,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        chunks.push(chunk);
        chunkIndex++;
      }
    }

    this.logger.log(`Criados ${chunks.length} chunks com sucesso`);
    return chunks;
  }

  private createTextSplitter(
    strategy: ChunkingStrategy,
    chunkSize: number,
    chunkOverlap: number,
  ) {
    switch (strategy) {
      case ChunkingStrategy.RECURSIVE:
        return new RecursiveCharacterTextSplitter({
          chunkSize,
          chunkOverlap,
          separators: ['\n\n', '\n', ' ', ''],
        });

      case ChunkingStrategy.TOKEN:
        return new TokenTextSplitter({
          chunkSize,
          chunkOverlap,
        });

      case ChunkingStrategy.CHARACTER:
        return new CharacterTextSplitter({
          chunkSize,
          chunkOverlap,
          separator: '\n',
        });

      default:
        this.logger.warn(
          `Estratégia desconhecida: ${strategy}, usando RecursiveCharacterTextSplitter`,
        );
        return new RecursiveCharacterTextSplitter({
          chunkSize,
          chunkOverlap,
          separators: ['\n\n', '\n', ' ', ''],
        });
    }
  }
}
