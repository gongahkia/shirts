import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRequest, GeminiResponse } from '@/types';
import logger from '@/utils/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      const startTime = Date.now();

      const fullPrompt = this.buildPrompt(request);

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000,
          topP: 0.8,
          topK: 40,
        },
      });

      const response = await result.response;
      const content = response.text();

      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.info('Gemini API call completed', {
        duration,
        promptLength: fullPrompt.length,
        responseLength: content.length,
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 2000
      });

      return {
        content,
        usage: {
          promptTokens: this.estimateTokens(fullPrompt),
          completionTokens: this.estimateTokens(content),
          totalTokens: this.estimateTokens(fullPrompt + content)
        },
        model: 'gemini-2.0-flash-exp',
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Gemini API call failed', { error: error instanceof Error ? error.message : error });
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateLegalArgument(
    caseContext: string,
    legalIssue: string,
    jurisdiction: string,
    precedents: string[]
  ): Promise<string> {
    const systemPrompt = `You are an expert legal AI assistant specializing in legal argument generation.
    Your task is to analyze the provided case information and generate a well-structured legal argument.

    Guidelines:
    - Use formal legal language and proper citation format
    - Reference relevant statutes, case law, and legal precedents
    - Structure arguments logically with clear reasoning
    - Consider jurisdiction-specific laws and procedures
    - Maintain professional tone throughout
    - Provide multiple supporting arguments when possible`;

    const prompt = `Case Context: ${caseContext}

Legal Issue: ${legalIssue}

Jurisdiction: ${jurisdiction}

Relevant Precedents: ${precedents.join(', ')}

Please generate a comprehensive legal argument addressing the legal issue presented. Include:
1. Statement of the legal issue
2. Applicable law and precedents
3. Analysis of facts against legal standards
4. Conclusion and relief sought

Format the response as a formal legal argument suitable for court filings.`;

    const response = await this.generateContent({
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 3000
    });

    return response.content;
  }

  async generateLegalDocument(
    documentType: string,
    caseDetails: any,
    templateContext: string
  ): Promise<string> {
    const systemPrompt = `You are an expert legal document drafting AI. Your task is to generate professional legal documents
    that are accurate, properly formatted, and jurisdiction-appropriate.

    Guidelines:
    - Use proper legal document structure and formatting
    - Include all necessary legal language and clauses
    - Ensure compliance with court rules and procedures
    - Use appropriate citations and references
    - Maintain consistency in terminology throughout
    - Include proper headings, numbering, and organization`;

    const prompt = `Document Type: ${documentType}

Case Details: ${JSON.stringify(caseDetails, null, 2)}

Template Context: ${templateContext}

Please generate a complete ${documentType} document. Ensure it includes:
1. Proper document header and title
2. All necessary legal sections and clauses
3. Appropriate formatting for court filing
4. Placeholder fields for signatures and dates
5. Professional legal language throughout

The document should be ready for review and filing with minimal modifications.`;

    const response = await this.generateContent({
      prompt,
      systemPrompt,
      temperature: 0.2,
      maxTokens: 4000
    });

    return response.content;
  }

  async analyzeLegalText(text: string, analysisType: 'summary' | 'issues' | 'precedents'): Promise<string> {
    const systemPrompts = {
      summary: 'You are a legal analysis AI specializing in document summarization. Provide clear, concise summaries of legal texts.',
      issues: 'You are a legal issue identification AI. Analyze legal texts to identify key legal issues, claims, and potential problems.',
      precedents: 'You are a legal precedent analysis AI. Identify relevant case law, statutes, and legal precedents in legal texts.'
    };

    const prompts = {
      summary: `Please provide a comprehensive summary of the following legal text. Include:
1. Main legal issues or claims
2. Key facts and circumstances
3. Legal standards or tests applied
4. Conclusion or holding
5. Significance or implications

Legal Text: ${text}`,

      issues: `Please analyze the following legal text and identify:
1. Primary legal issues or claims
2. Secondary or related issues
3. Potential legal problems or weaknesses
4. Areas requiring further research
5. Recommended next steps

Legal Text: ${text}`,

      precedents: `Please analyze the following legal text and identify:
1. Cited case law and precedents
2. Relevant statutes and regulations
3. Legal principles or doctrines referenced
4. Similar cases or analogies
5. Potential additional precedents to research

Legal Text: ${text}`
    };

    const response = await this.generateContent({
      prompt: prompts[analysisType],
      systemPrompt: systemPrompts[analysisType],
      temperature: 0.4,
      maxTokens: 2000
    });

    return response.content;
  }

  private buildPrompt(request: GeminiRequest): string {
    let fullPrompt = '';

    if (request.systemPrompt) {
      fullPrompt += `System: ${request.systemPrompt}\n\n`;
    }

    if (request.context) {
      fullPrompt += `Context: ${request.context}\n\n`;
    }

    fullPrompt += `User: ${request.prompt}`;

    return fullPrompt;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent({
        prompt: 'Hello, please respond with "Connection successful"',
        maxTokens: 50
      });
      return true;
    } catch (error) {
      logger.error('Gemini connection test failed', { error });
      return false;
    }
  }
}