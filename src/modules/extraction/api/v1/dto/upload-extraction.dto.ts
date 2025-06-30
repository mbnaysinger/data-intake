import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChunkingStrategy {
  RECURSIVE = 'recursive',
  TOKEN = 'token',
  CHARACTER = 'character',
}

export class UploadExtractionDto {
  @ApiProperty({
    description: 'Arquivo para extração (PDF, Excel, Texto, HTML)',
    type: 'string',
    format: 'binary',
  })
  file: any;

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
  @IsNumber()
  chunkSize?: number = 1000;

  @ApiPropertyOptional({
    description: 'Sobreposição entre chunks',
    default: 200,
  })
  @IsOptional()
  @IsNumber()
  chunkOverlap?: number = 200;

  @ApiPropertyOptional({
    description: 'Autor do documento',
    example: 'João Silva',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Categoria do documento',
    example: 'financeiro',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Departamento responsável',
    example: 'TI',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Tags adicionais (separadas por vírgula)',
    example: 'importante,urgente,2024',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Se deve salvar no vector store',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  saveToVectorStore?: boolean = true;

  @ApiPropertyOptional({
    description: 'Metadados adicionais em JSON',
    example: '{"priority": "high", "reviewed": true}',
  })
  @IsOptional()
  @IsString()
  additionalMetadata?: string;
}
