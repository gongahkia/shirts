import axios, { AxiosResponse } from 'axios';
import {
  LegalCase,
  APIResponse,
  PaginatedResponse,
  WorkflowState,
  Agent,
  RAGQuery,
  RAGResult
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse<APIResponse>) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cases API
export const casesAPI = {
  getAll: async (page = 1, limit = 20): Promise<PaginatedResponse<LegalCase>> => {
    const response = await api.get<PaginatedResponse<LegalCase>>('/cases', {
      params: { page, limit }
    });
    return response.data;
  },

  getById: async (id: string): Promise<APIResponse<LegalCase>> => {
    const response = await api.get<APIResponse<LegalCase>>(`/cases/${id}`);
    return response.data;
  },

  create: async (caseData: Partial<LegalCase>): Promise<APIResponse<{ case: LegalCase; workflowId: string }>> => {
    const response = await api.post<APIResponse<{ case: LegalCase; workflowId: string }>>('/cases', caseData);
    return response.data;
  },

  update: async (id: string, caseData: Partial<LegalCase>): Promise<APIResponse<LegalCase>> => {
    const response = await api.put<APIResponse<LegalCase>>(`/cases/${id}`, caseData);
    return response.data;
  },

  delete: async (id: string): Promise<APIResponse> => {
    const response = await api.delete<APIResponse>(`/cases/${id}`);
    return response.data;
  },

  getDocuments: async (id: string): Promise<APIResponse<Document[]>> => {
    const response = await api.get<APIResponse<Document[]>>(`/cases/${id}/documents`);
    return response.data;
  },

  restartWorkflow: async (id: string): Promise<APIResponse<{ workflowId: string }>> => {
    const response = await api.post<APIResponse<{ workflowId: string }>>(`/cases/${id}/restart-workflow`);
    return response.data;
  },
};

// Workflows API
export const workflowsAPI = {
  getAll: async (): Promise<APIResponse<(WorkflowState & { id: string })[]>> => {
    const response = await api.get<APIResponse<(WorkflowState & { id: string })[]>>('/workflows');
    return response.data;
  },

  getById: async (id: string): Promise<APIResponse<WorkflowState>> => {
    const response = await api.get<APIResponse<WorkflowState>>(`/workflows/${id}`);
    return response.data;
  },

  pause: async (id: string): Promise<APIResponse> => {
    const response = await api.post<APIResponse>(`/workflows/${id}/pause`);
    return response.data;
  },

  cancel: async (id: string): Promise<APIResponse> => {
    const response = await api.post<APIResponse>(`/workflows/${id}/cancel`);
    return response.data;
  },

  getLogs: async (id: string): Promise<APIResponse<any[]>> => {
    const response = await api.get<APIResponse<any[]>>(`/workflows/${id}/logs`);
    return response.data;
  },

  getErrors: async (id: string): Promise<APIResponse<any[]>> => {
    const response = await api.get<APIResponse<any[]>>(`/workflows/${id}/errors`);
    return response.data;
  },
};

// Agents API
export const agentsAPI = {
  getAll: async (): Promise<APIResponse<Agent[]>> => {
    const response = await api.get<APIResponse<Agent[]>>('/agents');
    return response.data;
  },

  getHealth: async (): Promise<APIResponse<{
    healthy: boolean;
    healthyCount: number;
    totalCount: number;
    healthPercentage: number;
  }>> => {
    const response = await api.get<APIResponse<{
      healthy: boolean;
      healthyCount: number;
      totalCount: number;
      healthPercentage: number;
    }>>('/agents/health');
    return response.data;
  },
};

// RAG API
export const ragAPI = {
  query: async (queryData: RAGQuery): Promise<APIResponse<RAGResult>> => {
    const response = await api.post<APIResponse<RAGResult>>('/rag/query', queryData);
    return response.data;
  },

  addDocument: async (document: {
    id: string;
    title: string;
    content: string;
    source: string;
    metadata?: any;
  }): Promise<APIResponse> => {
    const response = await api.post<APIResponse>('/rag/documents', document);
    return response.data;
  },

  bulkAddDocuments: async (directoryPath: string): Promise<APIResponse> => {
    const response = await api.post<APIResponse>('/rag/documents/bulk', { directoryPath });
    return response.data;
  },

  getStats: async (): Promise<APIResponse<{
    documentsCount: number;
    indexSize: number;
    isInitialized: boolean;
  }>> => {
    const response = await api.get<APIResponse<{
      documentsCount: number;
      indexSize: number;
      isInitialized: boolean;
    }>>('/rag/stats');
    return response.data;
  },

  getHealth: async (): Promise<APIResponse<{ healthy: boolean }>> => {
    const response = await api.get<APIResponse<{ healthy: boolean }>>('/rag/health');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<APIResponse<{
    status: string;
    timestamp: Date;
    version: string;
    uptime: number;
  }>> => {
    const response = await api.get<APIResponse<{
      status: string;
      timestamp: Date;
      version: string;
      uptime: number;
    }>>('/health');
    return response.data;
  },
};

export default api;