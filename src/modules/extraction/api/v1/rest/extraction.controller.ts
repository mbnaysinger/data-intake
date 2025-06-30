import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ExtractionService } from '../../../domain/service/extraction.service';
import { VectorStoreService } from '../../../domain/service/vector-store.service';
import { ExtractionRequestDto } from '../dto/extraction-request.dto';
import {
  ExtractionResponseDto,
  ChunkDto,
} from '../dto/extraction-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadExtractionDto } from '../dto/upload-extraction.dto';
import { FileUploadService } from '../../../domain/service/file-upload.service';

@ApiTags('Extração e Chunking')
@Controller('api/v1/extraction')
export class ExtractionController {
  constructor(
    private readonly extractionService: ExtractionService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Extrair e fazer chunking de um documento',
    description:
      'Carrega um documento, faz chunking e opcionalmente salva no vector store',
  })
  @ApiResponse({
    status: 201,
    description: 'Documento extraído com sucesso',
    type: ExtractionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async extractDocument(
    @Body() request: ExtractionRequestDto,
  ): Promise<ExtractionResponseDto> {
    try {
      const extraction = await this.extractionService.extractDocument(request);

      if (extraction.status === 'failed') {
        throw new HttpException(
          {
            message: 'Falha na extração do documento',
            error: extraction.error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Converter para DTO de resposta
      const response: ExtractionResponseDto = {
        id: extraction.id,
        status: extraction.status,
        source: extraction.source,
        fileType: extraction.fileType,
        totalChunks: extraction.totalChunks,
        chunks: extraction.chunks.map((chunk) => ({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata,
        })),
        processingTime: extraction.processingTime || 0,
      };

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Erro interno durante a extração',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter detalhes de uma extração',
    description: 'Retorna os detalhes de uma extração específica pelo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da extração',
    example: 'extraction_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Extração encontrada',
    type: ExtractionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Extração não encontrada',
  })
  async getExtraction(@Param('id') id: string): Promise<ExtractionResponseDto> {
    const extraction = await this.extractionService.getExtractionById(id);

    if (!extraction) {
      throw new HttpException(
        {
          message: 'Extração não encontrada',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: extraction.id,
      status: extraction.status,
      source: extraction.source,
      fileType: extraction.fileType,
      totalChunks: extraction.totalChunks,
      chunks: extraction.chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
      })),
      processingTime: extraction.processingTime || 0,
      error: extraction.error,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Listar extrações',
    description: 'Retorna uma lista paginada de extrações',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de itens por página',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Número de itens para pular',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de extrações',
    type: [ExtractionResponseDto],
  })
  async listExtractions(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<ExtractionResponseDto[]> {
    const extractions = await this.extractionService.listExtractions(
      limit,
      offset,
    );

    return extractions.map((extraction) => ({
      id: extraction.id,
      status: extraction.status,
      source: extraction.source,
      fileType: extraction.fileType,
      totalChunks: extraction.totalChunks,
      chunks: extraction.chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
      })),
      processingTime: extraction.processingTime || 0,
      error: extraction.error,
    }));
  }

  @Post('search')
  @ApiOperation({
    summary: 'Buscar documentos similares',
    description: 'Busca documentos similares no vector store',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentos similares encontrados',
    type: [ChunkDto],
  })
  async searchSimilar(
    @Body() body: { query: string; k?: number; filter?: Record<string, any> },
  ): Promise<ChunkDto[]> {
    try {
      const chunks = await this.vectorStoreService.searchSimilar(
        body.query,
        body.k || 5,
        body.filter,
      );

      return chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding || [],
      }));
    } catch (error) {
      throw new HttpException(
        {
          message: 'Erro na busca de documentos similares',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload e extração de arquivo',
    description:
      'Faz upload de um arquivo e extrai seu conteúdo automaticamente',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo e parâmetros de extração',
    type: UploadExtractionDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo processado com sucesso',
    type: ExtractionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndExtract(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: '.(pdf|xlsx|xls|txt|html|htm)' }),
        ],
      }),
    )
    file: any,
    @Body() uploadData: any,
  ): Promise<ExtractionResponseDto> {
    try {
      // Validar arquivo
      this.fileUploadService.validateFile(file);

      // Salvar arquivo temporariamente
      const filePath = await this.fileUploadService.saveFile(file);

      try {
        // Determinar tipo do arquivo
        const fileType = this.fileUploadService.getFileType(file.originalname);

        // Construir metadados
        const metadata = this.fileUploadService.buildMetadata(
          uploadData.author,
          uploadData.category,
          uploadData.department,
          uploadData.tags,
          uploadData.additionalMetadata,
        );

        // Preparar request de extração
        const extractionRequest: ExtractionRequestDto = {
          source: filePath,
          fileType: fileType as any,
          chunkingStrategy: uploadData.chunkingStrategy || 'recursive',
          chunkSize: parseInt(uploadData.chunkSize) || 1000,
          chunkOverlap: parseInt(uploadData.chunkOverlap) || 200,
          metadata,
          saveToVectorStore: uploadData.saveToVectorStore !== 'false',
        };

        // Processar extração
        const extraction =
          await this.extractionService.extractDocument(extractionRequest);

        // Converter para DTO de resposta
        const response: ExtractionResponseDto = {
          id: extraction.id,
          status: extraction.status,
          source: extraction.source,
          fileType: extraction.fileType,
          totalChunks: extraction.totalChunks,
          chunks: extraction.chunks.map((chunk) => ({
            id: chunk.id,
            content: chunk.content,
            metadata: chunk.metadata,
          })),
          processingTime: extraction.processingTime || 0,
        };

        return response;
      } finally {
        // Limpar arquivo temporário
        await this.fileUploadService.cleanupFile(filePath);
      }
    } catch (error) {
      throw new BadRequestException(
        `Erro no processamento do arquivo: ${error.message}`,
      );
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Verificar saúde do serviço',
    description: 'Verifica se o serviço de extração está funcionando',
  })
  @ApiResponse({
    status: 200,
    description: 'Serviço funcionando normalmente',
  })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
