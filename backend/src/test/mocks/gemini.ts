import { GeminiResponse } from '@/types';

export class MockGeminiService {
  async generateContent(): Promise<GeminiResponse> {
    return {
      content: 'Mock legal analysis response',
      usage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300
      },
      model: 'gemini-2.0-flash-exp',
      timestamp: new Date()
    };
  }

  async generateLegalArgument(): Promise<string> {
    return `LEGAL ARGUMENT

I. STATEMENT OF THE ISSUE
The plaintiff seeks relief for breach of contract regarding software development services.

II. APPLICABLE LAW
Under state contract law, parties have a duty to perform according to the terms of their agreement.

III. ANALYSIS
The defendant failed to deliver the software as specified in the contract, constituting a material breach.

IV. CONCLUSION
Plaintiff is entitled to damages for defendant's breach of contract.`;
  }

  async generateLegalDocument(): Promise<string> {
    return `COMPLAINT FOR BREACH OF CONTRACT

TO THE HONORABLE COURT:

NOW COMES Plaintiff, by and through undersigned counsel, and states:

1. Plaintiff is a business entity operating in the jurisdiction.
2. Defendant entered into a contract with Plaintiff for software development services.
3. Defendant materially breached the contract by failing to deliver the agreed-upon software.

WHEREFORE, Plaintiff requests damages and such other relief as the Court deems just.

Respectfully submitted,
[Attorney Signature Block]`;
  }

  async analyzeLegalText(): Promise<string> {
    return `LEGAL TEXT ANALYSIS

Summary: This document presents a standard breach of contract claim with clear factual allegations.

Key Issues:
1. Material breach of contract
2. Damages calculation
3. Statute of limitations

Recommendations:
1. Gather evidence of contract terms
2. Document damages suffered
3. Consider settlement negotiations`;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}