import { IntakeAgent } from '@/agents/intake-agent';
import { LegalCase } from '@/types';
import { MockGeminiService } from '../mocks/gemini';

// Mock the GeminiService
jest.mock('@/services/gemini', () => ({
  GeminiService: MockGeminiService
}));

describe('IntakeAgent', () => {
  let intakeAgent: IntakeAgent;
  let mockCase: LegalCase;

  beforeEach(() => {
    intakeAgent = new IntakeAgent();
    mockCase = {
      id: 'test-case-1',
      plaintiffInfo: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        legalIssue: 'Breach of contract',
        description: 'Software development contract was not fulfilled according to specifications.',
        desiredOutcome: 'Monetary damages and specific performance',
        urgency: 'medium'
      },
      caseDetails: {
        title: 'Doe v. TechCorp',
        category: 'contract-dispute',
        jurisdiction: 'New York State',
        courtLevel: 'state',
        estimatedDuration: 90,
        complexity: 'medium',
        precedents: [],
        relevantLaws: []
      },
      status: 'intake',
      workflowStage: 'plaintiff-intake',
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent Information', () => {
    it('should have correct agent metadata', () => {
      const agentInfo = intakeAgent.getAgentInfo();

      expect(agentInfo.name).toBe('Legal Intake Agent');
      expect(agentInfo.type).toBe('intake-agent');
      expect(agentInfo.status).toBe('idle');
      expect(agentInfo.capabilities).toContain('Plaintiff information validation');
      expect(agentInfo.capabilities).toContain('Legal issue categorization');
    });

    it('should be available when idle', () => {
      expect(intakeAgent.isAvailable()).toBe(true);
    });
  });

  describe('Case Processing', () => {
    it('should successfully process a valid case', async () => {
      const result = await intakeAgent.process(mockCase);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCase.id);
      expect(result.workflowStage).toBe('legal-research');
      expect(result.status).toBe('active');
      expect(result.updatedAt).not.toEqual(mockCase.updatedAt);
    });

    it('should validate plaintiff information', async () => {
      const invalidCase = {
        ...mockCase,
        plaintiffInfo: {
          ...mockCase.plaintiffInfo,
          email: 'invalid-email'
        }
      };

      await expect(intakeAgent.process(invalidCase)).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      const incompleteCase = {
        ...mockCase,
        plaintiffInfo: {
          ...mockCase.plaintiffInfo,
          name: ''
        }
      };

      await expect(intakeAgent.process(incompleteCase)).rejects.toThrow();
    });

    it('should enhance case details with AI analysis', async () => {
      const result = await intakeAgent.process(mockCase);

      // The AI should have potentially enhanced the case details
      expect(result.caseDetails).toBeDefined();
      expect(result.caseDetails.category).toBe('contract-dispute');
    });
  });

  describe('Health Check', () => {
    it('should pass health check when Gemini service is available', async () => {
      const isHealthy = await intakeAgent.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle concurrent processing attempts', async () => {
      const promise1 = intakeAgent.process(mockCase);

      await expect(intakeAgent.process(mockCase)).rejects.toThrow(
        'Agent Legal Intake Agent is already processing a case'
      );

      await promise1; // Wait for the first one to complete
    });

    it('should reset status after processing failure', async () => {
      const invalidCase = {
        ...mockCase,
        plaintiffInfo: {
          ...mockCase.plaintiffInfo,
          email: 'invalid'
        }
      };

      await expect(intakeAgent.process(invalidCase)).rejects.toThrow();
      expect(intakeAgent.isAvailable()).toBe(true);
    });
  });

  describe('Event Emission', () => {
    it('should emit processing events', (done) => {
      let eventsReceived = 0;

      intakeAgent.on('processing-started', () => {
        eventsReceived++;
      });

      intakeAgent.on('processing-completed', () => {
        eventsReceived++;
        expect(eventsReceived).toBe(2);
        done();
      });

      intakeAgent.process(mockCase);
    });
  });
});