import { HNSWLib } from 'hnswlib-node';
import fs from 'fs/promises';
import path from 'path';
import { RAGQuery, RAGResult, RetrievedDocument } from '@/types';
import logger from '@/utils/logger';
import OpenAI from 'openai';

export class RAGService {
  private vectorIndex: HNSWLib | null = null;
  private documents: Map<number, any> = new Map();
  private openai: OpenAI;
  private isInitialized = false;
  private readonly vectorDimension = 1536; // OpenAI embedding dimension
  private readonly indexPath: string;

  constructor() {
    this.indexPath = process.env.VECTOR_DB_PATH || './data/vector_db';

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      logger.warn('OpenAI API key not found, RAG service will use mock embeddings');
    }

    this.openai = new OpenAI({
      apiKey: openaiKey || 'mock-key'
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      await this.loadOrCreateIndex();
      await this.loadDocuments();
      this.isInitialized = true;

      logger.info('RAG Service initialized successfully', {
        indexPath: this.indexPath,
        documentsLoaded: this.documents.size
      });
    } catch (error) {
      logger.error('Failed to initialize RAG Service', { error });
      throw new Error(`RAG Service initialization failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  async query(request: RAGQuery): Promise<RAGResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      const queryEmbedding = await this.getEmbedding(request.query);

      const searchResults = await this.searchSimilar(
        queryEmbedding,
        request.maxResults || 10,
        request.threshold || 0.7
      );

      const filteredResults = this.applyFilters(searchResults, request.filters);

      const retrievedDocuments = filteredResults.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        source: result.source,
        relevanceScore: result.score,
        metadata: result.metadata
      }));

      const queryTime = Date.now() - startTime;
      const confidence = retrievedDocuments.length > 0
        ? retrievedDocuments.reduce((sum, doc) => sum + doc.relevanceScore, 0) / retrievedDocuments.length
        : 0;

      logger.info('RAG query completed', {
        query: request.query,
        resultsFound: retrievedDocuments.length,
        queryTime,
        confidence
      });

      return {
        documents: retrievedDocuments,
        totalResults: retrievedDocuments.length,
        queryTime,
        confidence
      };

    } catch (error) {
      logger.error('RAG query failed', {
        query: request.query,
        error: error instanceof Error ? error.message : error
      });

      return {
        documents: [],
        totalResults: 0,
        queryTime: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  async addDocument(document: {
    id: string;
    title: string;
    content: string;
    source: string;
    metadata: any;
  }): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const embedding = await this.getEmbedding(document.content);
      const docIndex = this.documents.size;

      if (this.vectorIndex) {
        this.vectorIndex.addPoint(embedding, docIndex);
      }

      this.documents.set(docIndex, {
        ...document,
        index: docIndex,
        addedAt: new Date()
      });

      await this.saveDocuments();

      logger.info('Document added to RAG index', {
        documentId: document.id,
        title: document.title,
        index: docIndex
      });

    } catch (error) {
      logger.error('Failed to add document to RAG index', {
        documentId: document.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  async addDocumentsFromDirectory(directoryPath: string): Promise<void> {
    try {
      const files = await fs.readdir(directoryPath, { recursive: true });
      const textFiles = files.filter(file =>
        typeof file === 'string' &&
        (file.endsWith('.txt') || file.endsWith('.md') || file.endsWith('.json'))
      );

      logger.info(`Processing ${textFiles.length} documents from ${directoryPath}`);

      for (const file of textFiles) {
        try {
          const filePath = path.join(directoryPath, file as string);
          const content = await fs.readFile(filePath, 'utf-8');

          const document = {
            id: file as string,
            title: path.basename(file as string, path.extname(file as string)),
            content: content.substring(0, 8000), // Limit content size
            source: filePath,
            metadata: {
              type: this.inferDocumentType(file as string),
              fileSize: content.length,
              addedAt: new Date()
            }
          };

          await this.addDocument(document);

        } catch (error) {
          logger.warn(`Failed to process file ${file}`, { error });
        }
      }

      logger.info(`Successfully processed documents from ${directoryPath}`);

    } catch (error) {
      logger.error(`Failed to process directory ${directoryPath}`, { error });
      throw error;
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.indexPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }
  }

  private async loadOrCreateIndex(): Promise<void> {
    const indexFile = path.join(this.indexPath, 'index.bin');

    try {
      await fs.access(indexFile);

      this.vectorIndex = new HNSWLib('cosine', this.vectorDimension);
      await this.vectorIndex.readIndex(indexFile);

      logger.info('Loaded existing vector index', { indexFile });

    } catch (error) {
      this.vectorIndex = new HNSWLib('cosine', this.vectorDimension);
      this.vectorIndex.initIndex(1000); // Initial capacity

      logger.info('Created new vector index', { indexFile });
    }
  }

  private async loadDocuments(): Promise<void> {
    const documentsFile = path.join(this.indexPath, 'documents.json');

    try {
      const documentsData = await fs.readFile(documentsFile, 'utf-8');
      const documentsArray = JSON.parse(documentsData);

      this.documents.clear();
      documentsArray.forEach((doc: any) => {
        this.documents.set(doc.index, doc);
      });

      logger.info('Loaded existing documents', {
        documentsFile,
        documentCount: this.documents.size
      });

    } catch (error) {
      logger.info('No existing documents found, starting with empty collection');
    }
  }

  private async saveDocuments(): Promise<void> {
    const documentsFile = path.join(this.indexPath, 'documents.json');
    const documentsArray = Array.from(this.documents.values());

    await fs.writeFile(documentsFile, JSON.stringify(documentsArray, null, 2));

    if (this.vectorIndex) {
      const indexFile = path.join(this.indexPath, 'index.bin');
      await this.vectorIndex.writeIndex(indexFile);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return this.getMockEmbedding(text);
      }

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000) // OpenAI token limit
      });

      return response.data[0].embedding;

    } catch (error) {
      logger.warn('OpenAI embedding failed, using mock embedding', { error });
      return this.getMockEmbedding(text);
    }
  }

  private getMockEmbedding(text: string): number[] {
    const hash = this.simpleHash(text);
    const embedding = new Array(this.vectorDimension).fill(0);

    for (let i = 0; i < this.vectorDimension; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * 0.1;
    }

    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async searchSimilar(
    queryEmbedding: number[],
    maxResults: number,
    threshold: number
  ): Promise<any[]> {
    if (!this.vectorIndex || this.documents.size === 0) {
      return [];
    }

    const searchResults = this.vectorIndex.searchKnn(queryEmbedding, maxResults);

    return searchResults.neighbors
      .map((index, i) => {
        const document = this.documents.get(index);
        if (!document) return null;

        const score = 1 - searchResults.distances[i]; // Convert distance to similarity
        if (score < threshold) return null;

        return {
          ...document,
          score
        };
      })
      .filter(Boolean);
  }

  private applyFilters(results: any[], filters?: any): any[] {
    if (!filters) return results;

    return results.filter(result => {
      if (filters.documentType && filters.documentType.length > 0) {
        if (!filters.documentType.includes(result.metadata.type)) {
          return false;
        }
      }

      if (filters.jurisdiction && filters.jurisdiction.length > 0) {
        if (!filters.jurisdiction.includes(result.metadata.jurisdiction)) {
          return false;
        }
      }

      if (filters.dateRange) {
        const docDate = new Date(result.metadata.date);
        if (filters.dateRange.start && docDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && docDate > filters.dateRange.end) {
          return false;
        }
      }

      if (filters.relevanceScore && result.score < filters.relevanceScore) {
        return false;
      }

      return true;
    });
  }

  private inferDocumentType(filename: string): string {
    const lowerFilename = filename.toLowerCase();

    if (lowerFilename.includes('case') || lowerFilename.includes('court')) {
      return 'case-law';
    }
    if (lowerFilename.includes('statute') || lowerFilename.includes('law')) {
      return 'statute';
    }
    if (lowerFilename.includes('regulation') || lowerFilename.includes('rule')) {
      return 'regulation';
    }
    if (lowerFilename.includes('contract')) {
      return 'contract';
    }

    return 'legal-document';
  }

  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized && this.vectorIndex !== null;
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<{
    documentsCount: number;
    indexSize: number;
    isInitialized: boolean;
  }> {
    return {
      documentsCount: this.documents.size,
      indexSize: this.vectorIndex ? this.vectorIndex.getCurrentCount() : 0,
      isInitialized: this.isInitialized
    };
  }
}