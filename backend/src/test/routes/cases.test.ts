import request from 'supertest';
import express from 'express';
import { casesRouter } from '@/routes/cases';

const app = express();
app.use(express.json());
app.use('/api/cases', casesRouter);

describe('Cases API', () => {
  const validCaseData = {
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
      description: 'Software development contract was not fulfilled according to specifications. The defendant failed to deliver the agreed-upon software within the specified timeframe.',
      desiredOutcome: 'Monetary damages for losses incurred due to breach',
      urgency: 'medium'
    },
    caseDetails: {
      title: 'Doe v. TechCorp Software Solutions',
      category: 'contract-dispute',
      jurisdiction: 'New York State',
      courtLevel: 'state',
      estimatedDuration: 90,
      complexity: 'medium',
      precedents: [],
      relevantLaws: []
    }
  };

  describe('POST /api/cases', () => {
    it('should create a new case with valid data', async () => {
      const response = await request(app)
        .post('/api/cases')
        .send(validCaseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('case');
      expect(response.body.data).toHaveProperty('workflowId');
      expect(response.body.data.case).toHaveProperty('id');
      expect(response.body.data.case.status).toBe('intake');
      expect(response.body.data.case.workflowStage).toBe('plaintiff-intake');
    });

    it('should reject case with invalid plaintiff info', async () => {
      const invalidData = {
        ...validCaseData,
        plaintiffInfo: {
          ...validCaseData.plaintiffInfo,
          email: 'invalid-email'
        }
      };

      const response = await request(app)
        .post('/api/cases')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should reject case with missing required fields', async () => {
      const incompleteData = {
        plaintiffInfo: {
          name: 'John Doe'
          // Missing other required fields
        }
      };

      const response = await request(app)
        .post('/api/cases')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should validate ZIP code format', async () => {
      const invalidZipData = {
        ...validCaseData,
        plaintiffInfo: {
          ...validCaseData.plaintiffInfo,
          address: {
            ...validCaseData.plaintiffInfo.address,
            zipCode: 'invalid-zip'
          }
        }
      };

      const response = await request(app)
        .post('/api/cases')
        .send(invalidZipData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cases', () => {
    beforeAll(async () => {
      // Create a test case first
      await request(app)
        .post('/api/cases')
        .send(validCaseData);
    });

    it('should return paginated cases', async () => {
      const response = await request(app)
        .get('/api/cases')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cases?page=1&limit=5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/cases?page=0&limit=200')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cases/:id', () => {
    let caseId: string;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/cases')
        .send(validCaseData);
      caseId = createResponse.body.data.case.id;
    });

    it('should return a specific case', async () => {
      const response = await request(app)
        .get(`/api/cases/${caseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(caseId);
      expect(response.body.data.plaintiffInfo.name).toBe(validCaseData.plaintiffInfo.name);
    });

    it('should return 404 for non-existent case', async () => {
      const response = await request(app)
        .get('/api/cases/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Case not found');
    });
  });

  describe('PUT /api/cases/:id', () => {
    let caseId: string;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/cases')
        .send(validCaseData);
      caseId = createResponse.body.data.case.id;
    });

    it('should update a case', async () => {
      const updateData = {
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/cases/${caseId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/api/cases/${caseId}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent case update', async () => {
      const response = await request(app)
        .put('/api/cases/non-existent-id')
        .send({ status: 'active' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/cases/:id', () => {
    let caseId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/cases')
        .send(validCaseData);
      caseId = createResponse.body.data.case.id;
    });

    it('should delete a case', async () => {
      const response = await request(app)
        .delete(`/api/cases/${caseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Case deleted successfully');

      // Verify case is deleted
      await request(app)
        .get(`/api/cases/${caseId}`)
        .expect(404);
    });

    it('should return 404 for non-existent case deletion', async () => {
      const response = await request(app)
        .delete('/api/cases/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cases/:id/documents', () => {
    let caseId: string;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/cases')
        .send(validCaseData);
      caseId = createResponse.body.data.case.id;
    });

    it('should return case documents', async () => {
      const response = await request(app)
        .get(`/api/cases/${caseId}/documents`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 404 for documents of non-existent case', async () => {
      const response = await request(app)
        .get('/api/cases/non-existent-id/documents')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/cases/:id/restart-workflow', () => {
    let caseId: string;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/cases')
        .send(validCaseData);
      caseId = createResponse.body.data.case.id;
    });

    it('should restart workflow for a case', async () => {
      const response = await request(app)
        .post(`/api/cases/${caseId}/restart-workflow`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('workflowId');
    });

    it('should return 404 for non-existent case workflow restart', async () => {
      const response = await request(app)
        .post('/api/cases/non-existent-id/restart-workflow')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});