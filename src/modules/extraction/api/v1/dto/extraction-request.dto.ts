import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  PDF = 'pdf',
  EXCEL = 'excel',
  TEXT = 'text',
  HTML = 'html',
}

export enum ChunkingStrategy {
  RECURSIVE = 'recursive',
  TOKEN = 'token',
  CHARACTER = 'character',
}

export class ExtractionRequestDto {
  @ApiProperty({
    description: 'Caminho do arquivo ou URL para extração',
    example: '/path/to/document.pdf',
  })
  @IsString()
  source: string;

  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: FileType,
    example: FileType.PDF,
  })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiPropertyOptional({
    description: 'Estratégia de chunking',
    enum: ChunkingStrategy,
    default: ChunkingStrategy.RECURSIVE,
  })
  @IsOptional()
  @IsEnum(ChunkingStrategy)
  chunkingStrategy?: ChunkingStrategy = ChunkingStrategy.RECURSIVE;

  @ApiPropertyOptional({
    description: 'Tamanho do chunk em caracteres',
    default: 1000,
  })
  @IsOptional()
  chunkSize?: number = 1000;

  @ApiPropertyOptional({
    description: 'Sobreposição entre chunks',
    default: 200,
  })
  @IsOptional()
  chunkOverlap?: number = 200;

  @ApiPropertyOptional({
    description: 'Metadados adicionais para os chunks',
    example: { author: 'João Silva', category: 'financeiro' },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Se deve salvar no vector store',
    default: true,
  })
  @IsOptional()
  saveToVectorStore?: boolean = true;
}
