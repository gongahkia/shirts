import { vi } from 'vitest';
import { LegalCase, APIResponse, PaginatedResponse } from '@/types';

export const mockCase: LegalCase = {
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
    precedents: ['Similar case precedent'],
    relevantLaws: ['Contract Law Section 123']
  },
  status: 'active',
  workflowStage: 'legal-research',
  documents: [],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02')
};

export const mockCasesResponse: PaginatedResponse<LegalCase> = {
  success: true,
  data: [mockCase],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1
  },
  timestamp: new Date(),
  requestId: 'test-request-1'
};

export const mockApiService = {
  casesAPI: {
    getAll: vi.fn().mockResolvedValue(mockCasesResponse),
    getById: vi.fn().mockResolvedValue({
      success: true,
      data: mockCase,
      timestamp: new Date(),
      requestId: 'test-request-2'
    }),
    create: vi.fn().mockResolvedValue({
      success: true,
      data: { case: mockCase, workflowId: 'workflow-1' },
      timestamp: new Date(),
      requestId: 'test-request-3'
    }),
    update: vi.fn().mockResolvedValue({
      success: true,
      data: mockCase,
      timestamp: new Date(),
      requestId: 'test-request-4'
    }),
    delete: vi.fn().mockResolvedValue({
      success: true,
      message: 'Case deleted successfully',
      timestamp: new Date(),
      requestId: 'test-request-5'
    }),
    getDocuments: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date(),
      requestId: 'test-request-6'
    }),
    restartWorkflow: vi.fn().mockResolvedValue({
      success: true,
      data: { workflowId: 'workflow-2' },
      timestamp: new Date(),
      requestId: 'test-request-7'
    })
  },
  workflowsAPI: {
    getAll: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date(),
      requestId: 'test-request-8'
    }),
    getById: vi.fn().mockResolvedValue({
      success: true,
      data: {
        caseId: mockCase.id,
        currentStage: 'legal-research',
        completedStages: ['plaintiff-intake'],
        progress: 33,
        estimatedCompletion: new Date(),
        logs: [],
        errors: []
      },
      timestamp: new Date(),
      requestId: 'test-request-9'
    }),
    pause: vi.fn().mockResolvedValue({
      success: true,
      message: 'Workflow paused',
      timestamp: new Date(),
      requestId: 'test-request-10'
    }),
    cancel: vi.fn().mockResolvedValue({
      success: true,
      message: 'Workflow cancelled',
      timestamp: new Date(),
      requestId: 'test-request-11'
    }),
    getLogs: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date(),
      requestId: 'test-request-12'
    }),
    getErrors: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date(),
      requestId: 'test-request-13'
    })
  },
  agentsAPI: {
    getAll: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'agent-1',
          name: 'Legal Intake Agent',
          type: 'intake-agent',
          description: 'Processes initial plaintiff intake',
          capabilities: ['Validation', 'Categorization'],
          status: 'idle',
          processedCases: 10,
          averageProcessingTime: 5000,
          healthy: true
        }
      ],
      timestamp: new Date(),
      requestId: 'test-request-14'
    }),
    getHealth: vi.fn().mockResolvedValue({
      success: true,
      data: {
        healthy: true,
        healthyCount: 3,
        totalCount: 3,
        healthPercentage: 100
      },
      timestamp: new Date(),
      requestId: 'test-request-15'
    })
  }
};

vi.mock('@/services/api', () => mockApiService);