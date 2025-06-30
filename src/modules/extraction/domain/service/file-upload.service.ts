import { Injectable } from '@nestjs/common';
import { createServiceLogger } from '../../../config/logger.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly logger = createServiceLogger('file-upload-service');
  private readonly uploadDir = './uploads';

  constructor() {
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.info(`Diretório de upload criado: ${this.uploadDir}`);
    }
  }

  async saveFile(file: any): Promise<string> {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Salvar arquivo
      fs.writeFileSync(filePath, file.buffer);

      this.logger.info(`Arquivo salvo: ${filePath} (${file.size} bytes)`);

      return filePath;
    } catch (error) {
      this.logger.error('Erro ao salvar arquivo:', error);
      throw new Error(`Falha ao salvar arquivo: ${error.message}`);
    }
  }

  getFileType(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();

    switch (extension) {
      case '.pdf':
        return 'pdf';
      case '.xlsx':
      case '.xls':
        return 'excel';
      case '.txt':
        return 'text';
      case '.html':
      case '.htm':
        return 'html';
      default:
        throw new Error(`Tipo de arquivo não suportado: ${extension}`);
    }
  }

  validateFile(file: any): void {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    if (file.size === 0) {
      throw new Error('Arquivo está vazio');
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
    }

    const supportedTypes = ['.pdf', '.xlsx', '.xls', '.txt', '.html', '.htm'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!supportedTypes.includes(fileExtension)) {
      throw new Error(`Tipo de arquivo não suportado: ${fileExtension}`);
    }
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.info(`Arquivo removido: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`Erro ao remover arquivo ${filePath}:`, error);
    }
  }

  parseMetadata(additionalMetadata?: string): Record<string, any> {
    if (!additionalMetadata) {
      return {};
    }

    try {
      return JSON.parse(additionalMetadata);
    } catch (error) {
      this.logger.warn('Erro ao fazer parse dos metadados adicionais:', error);
      return {};
    }
  }

  buildMetadata(
    author?: string,
    category?: string,
    department?: string,
    tags?: string,
    additionalMetadata?: string,
  ): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (author) metadata.author = author;
    if (category) metadata.category = category;
    if (department) metadata.department = department;
    if (tags) {
      // Converter tags para string para compatibilidade com ChromaDB v2
      const tagsArray = tags.split(',').map((tag) => tag.trim());
      metadata.tags = JSON.stringify(tagsArray);
    }

    // Adicionar metadados adicionais
    const additional = this.parseMetadata(additionalMetadata);
    Object.assign(metadata, additional);

    return metadata;
  }
}
