export interface DocumentChunk {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  source: string;
  fileType: string;
  chunkIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentExtraction {
  id: string;
  source: string;
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalChunks: number;
  chunks: DocumentChunk[];
  processingTime?: number;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
