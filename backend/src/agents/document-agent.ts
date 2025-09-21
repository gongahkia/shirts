import { BaseAgent } from './base-agent';
import { LegalCase, Document, DocumentType } from '@/types';
import { DocumentGeneratorService } from '@/services/document-generator';

export class DocumentAgent extends BaseAgent {
  private documentService: DocumentGeneratorService;

  constructor() {
    super(
      'Legal Document Agent',
      'document-agent',
      'Generates professional legal documents from case data and templates',
      [
        'Legal document generation',
        'Multi-format output (PDF, DOCX, HTML)',
        'Template-based document creation',
        'Court-ready formatting',
        'Document validation and review'
      ]
    );

    this.documentService = new DocumentGeneratorService();
  }

  protected async executeTask(caseData: LegalCase): Promise<LegalCase> {
    this.logProgress(caseData.id, 'Starting document generation', {
      category: caseData.caseDetails.category,
      workflowStage: caseData.workflowStage
    });

    const processedCase = { ...caseData };

    const documentsToGenerate = this.determineDocumentsNeeded(caseData);
    this.logProgress(caseData.id, 'Determined documents to generate', {
      documentTypes: documentsToGenerate
    });

    const generatedDocuments: Document[] = [];

    for (const documentType of documentsToGenerate) {
      try {
        this.logProgress(caseData.id, `Generating ${documentType}`, { documentType });

        const pdfDocument = await this.documentService.generateDocument(
          caseData,
          documentType,
          'pdf'
        );

        const docxDocument = await this.documentService.generateDocument(
          caseData,
          documentType,
          'docx'
        );

        generatedDocuments.push(pdfDocument, docxDocument);

        this.logProgress(caseData.id, `Generated ${documentType} in multiple formats`, {
          documentType,
          formats: ['pdf', 'docx']
        });

      } catch (error) {
        this.logProgress(caseData.id, `Failed to generate ${documentType}`, {
          documentType,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    for (const document of generatedDocuments) {
      const validation = await this.documentService.validateDocument(document);

      if (!validation.isValid) {
        this.logProgress(caseData.id, `Document validation issues found`, {
          documentId: document.id,
          documentType: document.type,
          issues: validation.issues
        });

        document.status = 'review';
      } else {
        document.status = 'approved';
      }
    }

    processedCase.documents = [...processedCase.documents, ...generatedDocuments];
    processedCase.workflowStage = 'review-and-revision';
    processedCase.updatedAt = new Date();

    this.logProgress(caseData.id, 'Document generation completed', {
      documentsGenerated: generatedDocuments.length,
      documentTypes: [...new Set(generatedDocuments.map(d => d.type))],
      nextStage: processedCase.workflowStage
    });

    return processedCase;
  }

  private determineDocumentsNeeded(caseData: LegalCase): DocumentType[] {
    const documents: DocumentType[] = [];
    const category = caseData.caseDetails.category;

    switch (category) {
      case 'civil-litigation':
        documents.push('complaint', 'discovery-request');
        break;

      case 'contract-dispute':
        documents.push('complaint', 'motion', 'legal-memo');
        break;

      case 'employment-law':
        documents.push('complaint', 'discovery-request', 'legal-memo');
        break;

      case 'personal-injury':
        documents.push('complaint', 'discovery-request', 'evidence-summary');
        break;

      case 'intellectual-property':
        documents.push('complaint', 'motion', 'brief');
        break;

      case 'real-estate':
        documents.push('contract', 'legal-memo');
        break;

      case 'family-law':
        documents.push('complaint', 'motion');
        break;

      case 'criminal-defense':
        documents.push('motion', 'brief');
        break;

      case 'business-law':
        documents.push('contract', 'legal-memo');
        break;

      default:
        documents.push('legal-memo');
    }

    if (caseData.caseDetails.complexity === 'high') {
      documents.push('brief');
    }

    if (caseData.plaintiffInfo.urgency === 'critical') {
      documents.unshift('motion');
    }

    return [...new Set(documents)];
  }

  async generateSpecificDocument(
    caseData: LegalCase,
    documentType: DocumentType,
    format: 'pdf' | 'docx' | 'html' | 'txt' = 'pdf'
  ): Promise<Document> {
    this.logProgress(caseData.id, `Generating specific document: ${documentType}`, {
      documentType,
      format
    });

    try {
      const document = await this.documentService.generateDocument(
        caseData,
        documentType,
        format
      );

      const validation = await this.documentService.validateDocument(document);

      if (!validation.isValid) {
        document.status = 'review';
        this.logProgress(caseData.id, 'Document requires review', {
          documentId: document.id,
          issues: validation.issues
        });
      } else {
        document.status = 'approved';
      }

      this.logProgress(caseData.id, `Successfully generated ${documentType}`, {
        documentId: document.id,
        documentType,
        format,
        status: document.status
      });

      return document;

    } catch (error) {
      this.logProgress(caseData.id, `Failed to generate ${documentType}`, {
        documentType,
        format,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      const testCase = this.createTestCase();
      const testDocument = await this.documentService.generateDocument(
        testCase,
        'legal-memo',
        'txt'
      );

      return testDocument.content.length > 100;
    } catch (error) {
      return false;
    }
  }

  private createTestCase(): LegalCase {
    return {
      id: 'test-case',
      plaintiffInfo: {
        name: 'Test Plaintiff',
        email: 'test@example.com',
        phone: '555-0123',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA'
        },
        legalIssue: 'Test legal issue',
        description: 'This is a test case for document generation health check.',
        desiredOutcome: 'Successful test completion',
        urgency: 'low'
      },
      caseDetails: {
        title: 'Test Case v. Document Generator',
        category: 'other',
        jurisdiction: 'Test Jurisdiction',
        courtLevel: 'state',
        estimatedDuration: 30,
        complexity: 'low',
        precedents: [],
        relevantLaws: []
      },
      status: 'active',
      workflowStage: 'document-drafting',
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}