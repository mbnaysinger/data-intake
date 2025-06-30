import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { DocumentChunk } from '../model/document-chunk.model';
import { ConfigServerService } from '../../../config/config.service';
import { createServiceLogger } from '../../../config/logger.service';
import { AzureEmbeddingService } from './azure-embedding.service';

@Injectable()
export class VectorStoreService {
  private readonly logger = createServiceLogger('vector-store-service');
  private vectorStore: Chroma | null = null;

  constructor(
    private configService: ConfigServerService,
    private embeddingService: AzureEmbeddingService,
  ) {}

  private async getVectorStore(): Promise<Chroma> {
    if (!this.vectorStore) {
      const chromaUrl =
        this.configService.get('config.chromadb.url') ||
        'http://localhost:8000';
      const collectionName =
        this.configService.get('config.chromadb.collection_name') ||
        'documents';

      this.logger.info(
        `Inicializando ChromaDB: ${chromaUrl}, coleção: ${collectionName}`,
      );

      // Criar embedding function usando o AzureEmbeddingService
      const embeddingFunction = {
        embedDocuments: async (texts: string[]) => {
          // IMPORTANTE: Se já temos embeddings, não gerar novamente
          // Esta função só será chamada se não tivermos embeddings pré-computados
          this.logger.info(
            `Gerando embeddings para ${texts.length} textos (não deveria acontecer se chunks já têm embeddings)`,
          );
          return await this.embeddingService
            .generateEmbeddings(
              texts.map((text, index) => ({
                id: `temp_${index}`,
                content: text,
                metadata: {},
                source: 'temp',
                fileType: 'temp',
                chunkIndex: index,
                createdAt: new Date(),
                updatedAt: new Date(),
              })),
            )
            .then((chunks) => chunks.map((chunk) => chunk.embedding || []));
        },
        embedQuery: async (text: string) => {
          return await this.embeddingService.generateEmbedding(text);
        },
      };

      // Configuração para versão mais recente do ChromaDB
      this.vectorStore = new Chroma(embeddingFunction, {
        url: chromaUrl,
        collectionName: collectionName,
        collectionMetadata: {
          'hnsw:space': 'cosine',
        },
      });

      this.logger.info('ChromaDB inicializado com sucesso via LangChain');
    }

    return this.vectorStore;
  }

  async listAllChunksChromaHttp(): Promise<DocumentChunk[]> {
    const chromaUrl =
      this.configService.get('config.chromadb.url') || 'http://localhost:8000';
    const collectionName =
      this.configService.get('config.chromadb.collection_name') || 'documents';
    const url = `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${collectionName}/get`;
    this.logger.info(`Listando todos os chunks via HTTP: ${url}`);
    try {
      const response = await axios.get(url);
      // Ajuste conforme o formato retornado pelo ChromaDB v2
      const docs = response.data?.documents || [];
      const metadatas = response.data?.metadatas || [];
      return docs.map((content: string, index: number) => ({
        id: metadatas[index]?.id || `chunk_${index}`,
        content,
        metadata: metadatas[index],
        source: metadatas[index]?.source || 'unknown',
        fileType: metadatas[index]?.fileType || 'unknown',
        chunkIndex: metadatas[index]?.chunkIndex || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error) {
      this.logger.error('Erro ao listar chunks via HTTP:', error);
      throw new Error(`Falha ao listar chunks via HTTP: ${error.message}`);
    }
  }

  async saveChunks(chunks: DocumentChunk[]): Promise<void> {
    this.logger.info(
      `Salvando ${chunks.length} chunks no ChromaDB via LangChain`,
    );

    // Verificar se os chunks já têm embeddings
    const chunksWithEmbeddings = chunks.filter(
      (chunk) => chunk.embedding && chunk.embedding.length > 0,
    );

    if (chunksWithEmbeddings.length === chunks.length) {
      this.logger.info(
        'Todos os chunks já têm embeddings, usando método otimizado',
      );
      await this.saveChunksWithEmbeddings(chunksWithEmbeddings);
    } else {
      this.logger.info('Alguns chunks não têm embeddings, usando LangChain');
      await this.saveChunksWithLangChain(chunks);
    }
  }

  private async saveChunksWithEmbeddings(
    chunks: DocumentChunk[],
  ): Promise<void> {
    // Método otimizado para chunks que já têm embeddings
    await this.saveChunksViaHttp(chunks);
  }

  private async saveChunksWithLangChain(
    chunks: DocumentChunk[],
  ): Promise<void> {
    try {
      const vectorStore = await this.getVectorStore();

      // Converter DocumentChunk para Document do LangChain
      // IMPORTANTE: Não gerar embeddings novamente, usar os que já existem
      const documents = chunks.map((chunk) => ({
        pageContent: chunk.content,
        metadata: {
          id: chunk.id,
          source: chunk.source,
          fileType: chunk.fileType,
          chunkIndex: chunk.chunkIndex,
          ...this.cleanMetadataForLangChain(chunk.metadata),
        },
      }));

      // Usar addDocuments com configurações específicas
      await vectorStore.addDocuments(documents);

      this.logger.info(
        `${chunks.length} chunks salvos com sucesso no ChromaDB via LangChain`,
      );
    } catch (error) {
      this.logger.error('Erro ao salvar chunks no ChromaDB:', error);

      // Se falhar com LangChain, tentar via HTTP direto como fallback
      this.logger.info('Tentando salvar via HTTP como fallback...');
      await this.saveChunksViaHttp(chunks);
    }
  }

  private cleanMetadataForLangChain(
    metadata: Record<string, any>,
  ): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== null && value !== undefined) {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          cleaned[key] = value;
        } else if (
          Array.isArray(value) &&
          value.every(
            (v) =>
              typeof v === 'string' ||
              typeof v === 'number' ||
              typeof v === 'boolean',
          )
        ) {
          // Para arrays, converter para string para compatibilidade
          cleaned[key] = JSON.stringify(value);
        } else if (typeof value === 'object') {
          // Para objetos, converter para string
          try {
            cleaned[key] = JSON.stringify(value);
          } catch {
            this.logger.warn(`Pulando metadata complexo: ${key}`);
          }
        }
      }
    }
    return cleaned;
  }

  private async saveChunksViaHttp(chunks: DocumentChunk[]): Promise<void> {
    const chromaUrl =
      this.configService.get('config.chromadb.url') || 'http://localhost:8000';
    const collectionName =
      this.configService.get('config.chromadb.collection_name') || 'documents';

    this.logger.info(
      `Iniciando salvamento HTTP: ${chromaUrl}, coleção: ${collectionName}`,
    );

    // Primeiro, obter ou criar a coleção e pegar seu ID
    let collectionId: string;

    try {
      // Tentar obter a coleção pelo nome
      const collectionsUrl = `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections`;
      this.logger.info(`Buscando coleção: ${collectionsUrl}`);

      const collectionsResponse = await axios.get(collectionsUrl);
      const collections = collectionsResponse.data || [];

      // Procurar pela coleção com o nome desejado
      const existingCollection = collections.find(
        (col: any) => col.name === collectionName,
      );

      if (existingCollection) {
        collectionId = existingCollection.id;
        this.logger.info(
          `Coleção ${collectionName} encontrada com ID: ${collectionId}`,
        );
      } else {
        // Criar nova coleção
        this.logger.info(`Criando coleção ${collectionName}...`);
        const createResponse = await axios.post(collectionsUrl, {
          name: collectionName,
          metadata: {
            'hnsw:space': 'cosine',
          },
        });

        collectionId = createResponse.data.id;
        this.logger.info(
          `Coleção ${collectionName} criada com ID: ${collectionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Erro ao obter/criar coleção:',
        error.response?.data || error.message,
      );
      throw new Error('Falha ao obter/criar coleção no ChromaDB');
    }

    // Preparar dados para API v2
    const documents = chunks.map((chunk) => chunk.content);
    const embeddings = chunks.map((chunk) => chunk.embedding || []);

    // Limpar metadados para compatibilidade com API v2
    const metadatas = chunks.map((chunk) => {
      const cleanMetadata: Record<string, any> = {
        id: chunk.id,
        source: chunk.source,
        fileType: chunk.fileType,
        chunkIndex: chunk.chunkIndex,
      };

      // Processar metadados adicionais
      for (const [key, value] of Object.entries(chunk.metadata)) {
        if (value !== null && value !== undefined) {
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            cleanMetadata[key] = value;
          } else if (Array.isArray(value)) {
            // Para arrays, converter para string para evitar problemas de serialização
            cleanMetadata[key] = JSON.stringify(value);
          } else if (typeof value === 'object') {
            // Para objetos, converter para string
            try {
              cleanMetadata[key] = JSON.stringify(value);
            } catch {
              this.logger.warn(`Pulando metadata complexo: ${key}`);
            }
          }
        }
      }

      return cleanMetadata;
    });

    const payload = {
      ids: chunks.map((chunk) => chunk.id),
      documents,
      metadatas,
      embeddings,
    };

    this.logger.info(
      `Enviando payload com ${documents.length} documentos usando API v2`,
    );
    this.logger.info(
      `Formato do payload: ${JSON.stringify(Object.keys(payload))}`,
    );
    this.logger.info(
      `Exemplo de metadata limpo: ${JSON.stringify(metadatas[0])}`,
    );

    // Tentar endpoints da API v2 usando o ID da coleção
    const endpoints = [
      `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${collectionId}/upsert`,
      `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${collectionId}/add`,
    ];

    for (const url of endpoints) {
      try {
        this.logger.info(`Tentando endpoint: ${url}`);
        const response = await axios.post(url, payload);
        this.logger.info(`✅ Sucesso com endpoint: ${url}`);
        this.logger.info(
          `Resposta do ChromaDB: ${response.status} ${response.statusText}`,
        );
        this.logger.info(`${chunks.length} chunks salvos com sucesso via HTTP`);
        return; // Sucesso, sair da função
      } catch (error) {
        this.logger.warn(
          `❌ Falha com endpoint ${url}: ${error.response?.status} ${error.response?.statusText}`,
        );
        this.logger.warn(
          `Erro detalhado: ${JSON.stringify(error.response?.data)}`,
        );

        if (error.response?.status === 422) {
          this.logger.warn(
            `Endpoint ${url} retornou 422 (Unprocessable Entity) - tentando próximo...`,
          );
          continue;
        }

        // Se não for 422, pode ser outro erro que não queremos ignorar
        if (url === endpoints[endpoints.length - 1]) {
          // Último endpoint, re-throw o erro
          this.logger.error('Todos os endpoints falharam');
          this.logger.error('Status:', error.response?.status);
          this.logger.error('Status Text:', error.response?.statusText);
          this.logger.error('Data:', error.response?.data);
          throw new Error(
            `Falha ao salvar chunks no ChromaDB: ${error.message}`,
          );
        }
      }
    }
  }

  async searchSimilar(
    query: string,
    k: number = 5,
    filter?: Record<string, any>,
  ): Promise<DocumentChunk[]> {
    this.logger.info(`Buscando documentos similares para: "${query}"`);

    try {
      const vectorStore = await this.getVectorStore();

      // Buscar documentos similares
      const results = await vectorStore.similaritySearch(query, k, filter);

      // Converter de volta para DocumentChunk
      return results.map((doc, index) => ({
        id: doc.metadata?.id || `result_${index}`,
        content: doc.pageContent,
        metadata: doc.metadata,
        source: doc.metadata?.source || 'unknown',
        fileType: doc.metadata?.fileType || 'unknown',
        chunkIndex: doc.metadata?.chunkIndex || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error) {
      this.logger.error('Erro ao buscar documentos similares:', error);
      throw new Error(`Falha ao buscar documentos similares: ${error.message}`);
    }
  }
}
