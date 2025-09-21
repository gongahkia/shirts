import { RAGQuery, RAGResult, RetrievedDocument } from '@/types';

export class MockRAGService {
  private isInitialized = true;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async query(request: RAGQuery): Promise<RAGResult> {
    const mockDocuments: RetrievedDocument[] = [
      {
        id: 'doc-1',
        title: 'Sample Contract Law Case',
        content: 'This case establishes the principle that material breach of contract...',
        source: 'legal-database',
        relevanceScore: 0.95,
        metadata: {
          type: 'case-law',
          jurisdiction: 'Federal',
          date: new Date('2020-01-01'),
          court: 'Federal District Court',
          caseNumber: '2020-CV-123',
          citation: '123 F.Supp.3d 456'
        }
      },
      {
        id: 'doc-2',
        title: 'Software Development Contract Statute',
        content: 'Contracts for software development services must specify...',
        source: 'statute-database',
        relevanceScore: 0.88,
        metadata: {
          type: 'statute',
          jurisdiction: 'State',
          date: new Date('2019-01-01')
        }
      }
    ];

    return {
      documents: mockDocuments.slice(0, request.maxResults || 10),
      totalResults: mockDocuments.length,
      queryTime: 150,
      confidence: 0.9
    };
  }

  async addDocument(): Promise<void> {
    // Mock implementation
  }

  async addDocumentsFromDirectory(): Promise<void> {
    // Mock implementation
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized;
  }

  async getStats(): Promise<{
    documentsCount: number;
    indexSize: number;
    isInitialized: boolean;
  }> {
    return {
      documentsCount: 100,
      indexSize: 1000,
      isInitialized: this.isInitialized
    };
  }
}