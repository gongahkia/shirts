import { BaseAgent } from './base-agent';
import { LegalCase, PlaintiffInfo, CaseDetails, WorkflowStage } from '@/types';
import { GeminiService } from '@/services/gemini';
import { validateInput, plaintiffInfoSchema, caseDetailsSchema } from '@/utils/validation';

export class IntakeAgent extends BaseAgent {
  private geminiService: GeminiService;

  constructor() {
    super(
      'Legal Intake Agent',
      'intake-agent',
      'Processes initial plaintiff intake forms and validates legal case information',
      [
        'Plaintiff information validation',
        'Legal issue categorization',
        'Urgency assessment',
        'Initial case evaluation',
        'Data sanitization and formatting'
      ]
    );

    this.geminiService = new GeminiService();
  }

  protected async executeTask(caseData: LegalCase): Promise<LegalCase> {
    this.logProgress(caseData.id, 'Starting intake processing', {
      plaintiffName: caseData.plaintiffInfo.name,
      legalIssue: caseData.plaintiffInfo.legalIssue
    });

    const processedCase = { ...caseData };

    processedCase.plaintiffInfo = await this.validatePlaintiffInfo(processedCase.plaintiffInfo);
    this.logProgress(caseData.id, 'Plaintiff information validated');

    processedCase.caseDetails = await this.enhanceCaseDetails(
      processedCase.caseDetails,
      processedCase.plaintiffInfo
    );
    this.logProgress(caseData.id, 'Case details enhanced with AI analysis');

    processedCase.workflowStage = 'legal-research';
    processedCase.status = 'active';
    processedCase.updatedAt = new Date();

    this.logProgress(caseData.id, 'Intake processing completed', {
      category: processedCase.caseDetails.category,
      complexity: processedCase.caseDetails.complexity,
      nextStage: processedCase.workflowStage
    });

    return processedCase;
  }

  private async validatePlaintiffInfo(plaintiffInfo: PlaintiffInfo): Promise<PlaintiffInfo> {
    try {
      const validatedInfo = validateInput<PlaintiffInfo>(plaintiffInfoSchema, plaintiffInfo);

      const enhancedInfo = await this.enhancePlaintiffInfo(validatedInfo);

      return enhancedInfo;
    } catch (error) {
      throw new Error(`Plaintiff information validation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async enhancePlaintiffInfo(plaintiffInfo: PlaintiffInfo): Promise<PlaintiffInfo> {
    const prompt = `Analyze the following plaintiff information and provide enhancements:

Plaintiff Name: ${plaintiffInfo.name}
Legal Issue: ${plaintiffInfo.legalIssue}
Description: ${plaintiffInfo.description}
Desired Outcome: ${plaintiffInfo.desiredOutcome}
Current Urgency: ${plaintiffInfo.urgency}

Please analyze and suggest:
1. More specific legal issue categorization if possible
2. Urgency level assessment based on the description
3. Any red flags or special considerations
4. Recommended additional information to gather

Respond in JSON format with fields: suggestedCategory, recommendedUrgency, redFlags, additionalInfoNeeded, enhancedDescription`;

    try {
      const response = await this.geminiService.generateContent({
        prompt,
        systemPrompt: 'You are a legal intake specialist with expertise in case categorization and risk assessment.',
        temperature: 0.3,
        maxTokens: 1000
      });

      const analysis = JSON.parse(response.content);

      const enhanced: PlaintiffInfo = {
        ...plaintiffInfo,
        urgency: analysis.recommendedUrgency || plaintiffInfo.urgency,
        description: analysis.enhancedDescription || plaintiffInfo.description
      };

      return enhanced;

    } catch (error) {
      this.logProgress('', 'AI enhancement failed, using original data', { error });
      return plaintiffInfo;
    }
  }

  private async enhanceCaseDetails(
    caseDetails: CaseDetails,
    plaintiffInfo: PlaintiffInfo
  ): Promise<CaseDetails> {
    try {
      const validatedDetails = validateInput<CaseDetails>(caseDetailsSchema, caseDetails);

      const enhancedDetails = await this.analyzeCaseComplexity(validatedDetails, plaintiffInfo);

      return enhancedDetails;
    } catch (error) {
      throw new Error(`Case details validation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async analyzeCaseComplexity(
    caseDetails: CaseDetails,
    plaintiffInfo: PlaintiffInfo
  ): Promise<CaseDetails> {
    const prompt = `Analyze the following legal case for complexity and provide recommendations:

Case Title: ${caseDetails.title}
Category: ${caseDetails.category}
Jurisdiction: ${caseDetails.jurisdiction}
Court Level: ${caseDetails.courtLevel}
Current Complexity: ${caseDetails.complexity}

Legal Issue: ${plaintiffInfo.legalIssue}
Case Description: ${plaintiffInfo.description}
Desired Outcome: ${plaintiffInfo.desiredOutcome}

Provide analysis in JSON format with:
1. complexityAssessment: "low", "medium", or "high"
2. estimatedDuration: number of days
3. keyLegalIssues: array of specific legal issues to research
4. suggestedPrecedents: array of relevant case names or legal principles
5. relevantStatutes: array of applicable laws or regulations
6. potentialChallenges: array of potential legal challenges
7. recommendedStrategy: brief strategy overview

Base your assessment on:
- Legal precedents and complexity of applicable law
- Number of parties involved
- Factual complexity
- Discovery requirements
- Potential for settlement vs. trial`;

    try {
      const response = await this.geminiService.generateContent({
        prompt,
        systemPrompt: 'You are an experienced legal case analyst with expertise in case complexity assessment and strategic planning.',
        temperature: 0.2,
        maxTokens: 1500
      });

      const analysis = JSON.parse(response.content);

      const enhanced: CaseDetails = {
        ...caseDetails,
        complexity: analysis.complexityAssessment || caseDetails.complexity,
        estimatedDuration: analysis.estimatedDuration || caseDetails.estimatedDuration,
        precedents: analysis.suggestedPrecedents || caseDetails.precedents,
        relevantLaws: analysis.relevantStatutes || caseDetails.relevantLaws
      };

      return enhanced;

    } catch (error) {
      this.logProgress('', 'Case complexity analysis failed, using original data', { error });
      return caseDetails;
    }
  }

  protected async performHealthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.geminiService.generateContent({
        prompt: 'Respond with "OK" to confirm service availability.',
        maxTokens: 10
      });

      return testResponse.content.includes('OK');
    } catch (error) {
      return false;
    }
  }
}