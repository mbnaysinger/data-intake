import { ApiProperty } from '@nestjs/swagger';

export class ChunkDto {
  @ApiProperty({
    description: 'ID único do chunk',
    example: 'chunk_123',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo do chunk',
    example: 'Este é o conteúdo extraído do documento...',
  })
  content: string;

  @ApiProperty({
    description: 'Metadados do chunk',
    example: { page: 1, source: 'document.pdf' },
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Embedding do chunk (vetor)',
    example: [0.1, 0.2, 0.3],
    required: false,
  })
  embedding?: number[];
}

export class ExtractionResponseDto {
  @ApiProperty({
    description: 'ID da extração',
    example: 'extraction_123',
  })
  id: string;

  @ApiProperty({
    description: 'Status da extração',
    example: 'completed',
  })
  status: string;

  @ApiProperty({
    description: 'Fonte do documento',
    example: '/path/to/document.pdf',
  })
  source: string;

  @ApiProperty({
    description: 'Tipo do arquivo',
    example: 'pdf',
  })
  fileType: string;

  @ApiProperty({
    description: 'Número total de chunks criados',
    example: 15,
  })
  totalChunks: number;

  @ApiProperty({
    description: 'Chunks extraídos',
    type: [ChunkDto],
  })
  chunks: ChunkDto[];

  @ApiProperty({
    description: 'Tempo de processamento em milissegundos',
    example: 2500,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Mensagem de erro, se houver',
    example: null,
  })
  error?: string;
}
