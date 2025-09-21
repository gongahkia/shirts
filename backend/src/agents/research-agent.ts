import { BaseAgent } from './base-agent';
import { LegalCase } from '@/types';
import { GeminiService } from '@/services/gemini';
import { RAGService } from '@/services/rag';

export class ResearchAgent extends BaseAgent {
  private geminiService: GeminiService;
  private ragService: RAGService;

  constructor() {
    super(
      'Legal Research Agent',
      'research-agent',
      'Conducts comprehensive legal research using RAG and AI analysis',
      [
        'Case law research',
        'Statute analysis',
        'Precedent identification',
        'Legal principle extraction',
        'Jurisdiction-specific research',
        'RAG-powered document retrieval'
      ]
    );

    this.geminiService = new GeminiService();
    this.ragService = new RAGService();
  }

  protected async executeTask(caseData: LegalCase): Promise<LegalCase> {
    this.logProgress(caseData.id, 'Starting legal research', {
      category: caseData.caseDetails.category,
      jurisdiction: caseData.caseDetails.jurisdiction,
      legalIssue: caseData.plaintiffInfo.legalIssue
    });

    const processedCase = { ...caseData };

    const researchQuery = this.buildResearchQuery(caseData);
    this.logProgress(caseData.id, 'Built research query', { query: researchQuery });

    const ragResults = await this.ragService.query({
      query: researchQuery,
      context: this.buildResearchContext(caseData),
      filters: {
        jurisdiction: [caseData.caseDetails.jurisdiction],
        documentType: ['case-law', 'statute', 'regulation']
      },
      maxResults: 20,
      threshold: 0.7
    });

    this.logProgress(caseData.id, 'Retrieved relevant documents', {
      documentsFound: ragResults.totalResults,
      confidence: ragResults.confidence
    });

    const researchFindings = await this.analyzeResearchResults(caseData, ragResults.documents);
    this.logProgress(caseData.id, 'Analyzed research results');

    const enhancedPrecedents = await this.identifyKeyPrecedents(
      caseData,
      ragResults.documents
    );
    this.logProgress(caseData.id, 'Identified key precedents');

    const relevantLaws = await this.extractRelevantLaws(
      caseData,
      ragResults.documents
    );
    this.logProgress(caseData.id, 'Extracted relevant laws');

    processedCase.caseDetails.precedents = [
      ...processedCase.caseDetails.precedents,
      ...enhancedPrecedents
    ];

    processedCase.caseDetails.relevantLaws = [
      ...processedCase.caseDetails.relevantLaws,
      ...relevantLaws
    ];

    processedCase.workflowStage = 'argument-generation';
    processedCase.updatedAt = new Date();

    this.logProgress(caseData.id, 'Legal research completed', {
      precedentsFound: enhancedPrecedents.length,
      lawsIdentified: relevantLaws.length,
      nextStage: processedCase.workflowStage
    });

    return processedCase;
  }

  private buildResearchQuery(caseData: LegalCase): string {
    const { legalIssue, description } = caseData.plaintiffInfo;
    const { category, jurisdiction } = caseData.caseDetails;

    return `${legalIssue} ${description} ${category} ${jurisdiction} case law statutes regulations`;
  }

  private buildResearchContext(caseData: LegalCase): string {
    return `Legal Case Research Context:
- Category: ${caseData.caseDetails.category}
- Jurisdiction: ${caseData.caseDetails.jurisdiction}
- Court Level: ${caseData.caseDetails.courtLevel}
- Legal Issue: ${caseData.plaintiffInfo.legalIssue}
- Case Description: ${caseData.plaintiffInfo.description}
- Desired Outcome: ${caseData.plaintiffInfo.desiredOutcome}`;
  }

  private async analyzeResearchResults(caseData: LegalCase, documents: any[]): Promise<string> {
    const documentsText = documents
      .slice(0, 10)
      .map(doc => `Title: ${doc.title}\nContent: ${doc.content.substring(0, 500)}...`)
      .join('\n\n');

    const prompt = `Analyze the following legal research results for the case:

Case Context: ${this.buildResearchContext(caseData)}

Research Documents:
${documentsText}

Provide a comprehensive analysis including:
1. Key legal principles identified
2. Strength of available precedents
3. Potential arguments for the plaintiff
4. Potential counterarguments to address
5. Gaps in research that need attention
6. Strategic recommendations

Format as a detailed legal research memo.`;

    const response = await this.geminiService.generateContent({
      prompt,
      systemPrompt: 'You are an expert legal researcher with deep knowledge of case law analysis and legal strategy.',
      temperature: 0.3,
      maxTokens: 2500
    });

    return response.content;
  }

  private async identifyKeyPrecedents(caseData: LegalCase, documents: any[]): Promise<string[]> {
    const precedentDocs = documents
      .filter(doc => doc.metadata.type === 'case-law')
      .slice(0, 15);

    if (precedentDocs.length === 0) {
      return [];
    }

    const documentsText = precedentDocs
      .map(doc => `Case: ${doc.title}\nCitation: ${doc.metadata.citation || 'N/A'}\nKey Points: ${doc.content.substring(0, 300)}...`)
      .join('\n\n');

    const prompt = `Identify the most relevant precedent cases for this legal issue:

Case Issue: ${caseData.plaintiffInfo.legalIssue}
Jurisdiction: ${caseData.caseDetails.jurisdiction}

Available Cases:
${documentsText}

Provide a ranked list of the top 10 most relevant precedent cases with:
1. Case name and citation
2. Relevance to current issue (1-10 scale)
3. Key legal principle from the case
4. How it supports or challenges our position

Format as JSON array with fields: caseName, citation, relevance, principle, impact`;

    try {
      const response = await this.geminiService.generateContent({
        prompt,
        systemPrompt: 'You are a legal precedent analysis expert with expertise in case law relevance assessment.',
        temperature: 0.2,
        maxTokens: 2000
      });

      const precedents = JSON.parse(response.content);
      return precedents
        .filter((p: any) => p.relevance >= 7)
        .map((p: any) => `${p.caseName} - ${p.principle}`);

    } catch (error) {
      this.logProgress(caseData.id, 'Precedent analysis failed, using basic extraction', { error });
      return precedentDocs.slice(0, 5).map(doc => doc.title);
    }
  }

  private async extractRelevantLaws(caseData: LegalCase, documents: any[]): Promise<string[]> {
    const statuteDocs = documents
      .filter(doc => ['statute', 'regulation'].includes(doc.metadata.type))
      .slice(0, 10);

    if (statuteDocs.length === 0) {
      return [];
    }

    const documentsText = statuteDocs
      .map(doc => `Law: ${doc.title}\nContent: ${doc.content.substring(0, 400)}...`)
      .join('\n\n');

    const prompt = `Extract the most relevant laws and regulations for this case:

Legal Issue: ${caseData.plaintiffInfo.legalIssue}
Case Category: ${caseData.caseDetails.category}
Jurisdiction: ${caseData.caseDetails.jurisdiction}

Available Laws:
${documentsText}

Identify the top relevant statutes and regulations with:
1. Full legal citation
2. Relevant section or subsection
3. How it applies to this case
4. Whether it supports or challenges the plaintiff's position

Format as JSON array with fields: citation, section, application, favorability`;

    try {
      const response = await this.geminiService.generateContent({
        prompt,
        systemPrompt: 'You are a legal statute analysis expert with expertise in regulatory compliance and legal application.',
        temperature: 0.2,
        maxTokens: 1500
      });

      const laws = JSON.parse(response.content);
      return laws.map((law: any) => `${law.citation} ${law.section} - ${law.application}`);

    } catch (error) {
      this.logProgress(caseData.id, 'Legal statute analysis failed, using basic extraction', { error });
      return statuteDocs.slice(0, 5).map(doc => doc.title);
    }
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      const geminiHealthy = await this.geminiService.testConnection();
      const ragHealthy = await this.ragService.healthCheck();

      return geminiHealthy && ragHealthy;
    } catch (error) {
      return false;
    }
  }
}