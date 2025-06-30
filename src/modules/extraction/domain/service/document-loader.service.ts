import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { FileType } from '../../api/v1/dto/extraction-request.dto';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class DocumentLoaderService {
  private readonly logger = new Logger(DocumentLoaderService.name);

  async loadDocument(source: string, fileType: FileType): Promise<Document[]> {
    this.logger.log(`Carregando documento: ${source} (tipo: ${fileType})`);

    try {
      switch (fileType) {
        case FileType.PDF:
          return await this.loadPdfDocument(source);
        case FileType.EXCEL:
          return await this.loadExcelDocument(source);
        case FileType.TEXT:
          return await this.loadTextDocument(source);
        case FileType.HTML:
          return await this.loadHtmlDocument(source);
        default:
          throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao carregar documento ${source}:`, error);
      throw new Error(`Falha ao carregar documento: ${error.message}`);
    }
  }

  private async loadPdfDocument(filePath: string): Promise<Document[]> {
    this.logger.log(`Carregando PDF: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const loader = new PDFLoader(filePath, {
      splitPages: false, // Carrega todo o documento como um único documento
    });

    const docs = await loader.load();
    this.logger.log(`PDF carregado com sucesso: ${docs.length} páginas`);

    return docs;
  }

  private async loadExcelDocument(filePath: string): Promise<Document[]> {
    this.logger.log(`Carregando Excel: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const documents: Document[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Converter dados para texto
      const textContent = jsonData
        .map((row: any[]) => row.join('\t'))
        .join('\n');

      if (textContent.trim()) {
        documents.push(
          new Document({
            pageContent: textContent,
            metadata: {
              source: filePath,
              sheet: sheetName,
              fileType: 'excel',
            },
          }),
        );
      }
    }

    this.logger.log(
      `Excel carregado com sucesso: ${documents.length} planilhas`,
    );
    return documents;
  }

  private async loadTextDocument(filePath: string): Promise<Document[]> {
    this.logger.log(`Carregando texto: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const loader = new TextLoader(filePath);
    const docs = await loader.load();

    this.logger.log(`Texto carregado com sucesso: ${docs.length} documentos`);
    return docs;
  }

  private async loadHtmlDocument(filePath: string): Promise<Document[]> {
    this.logger.log(`Carregando HTML: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Para HTML, vamos usar o TextLoader por enquanto
    // Em uma implementação mais robusta, você usaria Cheerio para extrair texto limpo
    const loader = new TextLoader(filePath);
    const docs = await loader.load();

    // Adicionar metadados específicos para HTML
    docs.forEach((doc) => {
      doc.metadata.fileType = 'html';
    });

    this.logger.log(`HTML carregado com sucesso: ${docs.length} documentos`);
    return docs;
  }
}
