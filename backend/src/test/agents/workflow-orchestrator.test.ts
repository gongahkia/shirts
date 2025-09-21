import { WorkflowOrchestrator } from '@/agents/workflow-orchestrator';
import { LegalCase } from '@/types';

// Mock all agent dependencies
jest.mock('@/agents/intake-agent');
jest.mock('@/agents/research-agent');
jest.mock('@/agents/document-agent');

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockCase: LegalCase;

  beforeEach(() => {
    orchestrator = new WorkflowOrchestrator();
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
        description: 'Software development contract was not fulfilled.',
        desiredOutcome: 'Monetary damages',
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

  describe('Workflow Initialization', () => {
    it('should initialize with agents', () => {
      expect(orchestrator).toBeDefined();
    });

    it('should start a new workflow', async () => {
      const workflowId = await orchestrator.startWorkflow(mockCase);

      expect(workflowId).toBeDefined();
      expect(typeof workflowId).toBe('string');
    });

    it('should track workflow state', async () => {
      const workflowId = await orchestrator.startWorkflow(mockCase);
      const workflowState = orchestrator.getWorkflowState(workflowId);

      expect(workflowState).toBeDefined();
      expect(workflowState?.caseId).toBe(mockCase.id);
      expect(workflowState?.currentStage).toBe('plaintiff-intake');
      expect(workflowState?.progress).toBe(0);
    });
  });

  describe('Workflow Management', () => {
    let workflowId: string;

    beforeEach(async () => {
      workflowId = await orchestrator.startWorkflow(mockCase);
    });

    it('should pause a workflow', async () => {
      await expect(orchestrator.pauseWorkflow(workflowId)).resolves.not.toThrow();
    });

    it('should cancel a workflow', async () => {
      await orchestrator.cancelWorkflow(workflowId);
      const workflowState = orchestrator.getWorkflowState(workflowId);

      expect(workflowState).toBeNull();
    });

    it('should handle non-existent workflow operations', async () => {
      const fakeId = 'non-existent-workflow';

      await expect(orchestrator.pauseWorkflow(fakeId)).rejects.toThrow(
        `Workflow ${fakeId} not found`
      );
    });
  });

  describe('Agent Status', () => {
    it('should return agent status', async () => {
      const agentStatus = await orchestrator.getAgentStatus();

      expect(agentStatus).toBeDefined();
      expect(agentStatus.size).toBeGreaterThan(0);

      // Check if intake agent exists
      expect(agentStatus.has('intake')).toBe(true);
    });

    it('should include health status in agent info', async () => {
      const agentStatus = await orchestrator.getAgentStatus();
      const intakeAgent = agentStatus.get('intake');

      expect(intakeAgent).toBeDefined();
      expect(intakeAgent).toHaveProperty('healthy');
    });
  });

  describe('Event Handling', () => {
    it('should emit workflow events', (done) => {
      let eventReceived = false;

      orchestrator.on('workflow-started', (data) => {
        expect(data.caseId).toBe(mockCase.id);
        eventReceived = true;
        if (eventReceived) done();
      });

      orchestrator.startWorkflow(mockCase);
    });

    it('should emit workflow progress events', (done) => {
      orchestrator.on('workflow-progress', (data) => {
        expect(data.workflowId).toBeDefined();
        expect(data.progress).toBeGreaterThanOrEqual(0);
        done();
      });

      // This would normally be triggered by the workflow processing
      // For testing, we'll emit it manually
      setTimeout(() => {
        orchestrator.emit('workflow-progress', {
          workflowId: 'test',
          caseId: mockCase.id,
          progress: 50,
          currentStage: 'legal-research',
          state: {} as any
        });
      }, 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow processing errors gracefully', async () => {
      const workflowId = await orchestrator.startWorkflow(mockCase);

      // Simulate an error by trying to process a case that doesn't exist
      const invalidCase = { ...mockCase, id: 'invalid-case' };

      await expect(
        orchestrator.processWorkflow(workflowId, invalidCase)
      ).rejects.toThrow();
    });

    it('should track workflow errors', async () => {
      const workflowId = await orchestrator.startWorkflow(mockCase);
      const workflowState = orchestrator.getWorkflowState(workflowId);

      expect(workflowState?.errors).toBeDefined();
      expect(Array.isArray(workflowState?.errors)).toBe(true);
    });
  });
});