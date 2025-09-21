// Shared types from backend
export interface LegalCase {
  id: string;
  plaintiffInfo: PlaintiffInfo;
  caseDetails: CaseDetails;
  status: CaseStatus;
  workflowStage: WorkflowStage;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaintiffInfo {
  name: string;
  email: string;
  phone: string;
  address: Address;
  legalIssue: string;
  description: string;
  desiredOutcome: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CaseDetails {
  title: string;
  category: LegalCategory;
  jurisdiction: string;
  courtLevel: CourtLevel;
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high';
  precedents: string[];
  relevantLaws: string[];
}

export type LegalCategory =
  | 'civil-litigation'
  | 'contract-dispute'
  | 'employment-law'
  | 'personal-injury'
  | 'intellectual-property'
  | 'real-estate'
  | 'family-law'
  | 'criminal-defense'
  | 'business-law'
  | 'other';

export type CourtLevel = 'municipal' | 'county' | 'state' | 'federal' | 'supreme';

export type CaseStatus = 'intake' | 'active' | 'review' | 'completed' | 'archived' | 'cancelled';

export type WorkflowStage =
  | 'plaintiff-intake'
  | 'legal-research'
  | 'argument-generation'
  | 'document-drafting'
  | 'review-and-revision'
  | 'final-formatting'
  | 'completed';

export interface Document {
  id: string;
  caseId: string;
  type: DocumentType;
  title: string;
  content: string;
  format: DocumentFormat;
  version: number;
  status: DocumentStatus;
  generatedBy: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: DocumentMetadata;
}

export type DocumentType =
  | 'complaint'
  | 'motion'
  | 'brief'
  | 'contract'
  | 'settlement-agreement'
  | 'discovery-request'
  | 'evidence-summary'
  | 'legal-memo'
  | 'court-filing'
  | 'correspondence';

export type DocumentFormat = 'pdf' | 'docx' | 'html' | 'txt';

export type DocumentStatus = 'draft' | 'review' | 'approved' | 'filed' | 'archived';

export interface DocumentMetadata {
  wordCount: number;
  pageCount: number;
  lastModifiedBy: string;
  tags: string[];
  confidentialityLevel: 'public' | 'confidential' | 'attorney-client';
}

export interface WorkflowState {
  caseId: string;
  currentStage: WorkflowStage;
  completedStages: WorkflowStage[];
  progress: number;
  estimatedCompletion: Date;
  logs: WorkflowLog[];
  errors: WorkflowError[];
}

export interface WorkflowLog {
  timestamp: Date;
  stage: WorkflowStage;
  agent: string;
  action: string;
  details: string;
  duration: number;
}

export interface WorkflowError {
  timestamp: Date;
  stage: WorkflowStage;
  agent: string;
  error: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  currentTask?: string;
  processedCases: number;
  averageProcessingTime: number;
  healthy?: boolean;
}

export type AgentType =
  | 'intake-agent'
  | 'research-agent'
  | 'argument-agent'
  | 'document-agent'
  | 'review-agent'
  | 'rag-retriever'
  | 'formatting-agent';

export type AgentStatus = 'idle' | 'processing' | 'error' | 'maintenance';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RAGQuery {
  query: string;
  context: string;
  filters?: RAGFilters;
  maxResults?: number;
  threshold?: number;
}

export interface RAGFilters {
  documentType?: string[];
  jurisdiction?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  relevanceScore?: number;
}

export interface RAGResult {
  documents: RetrievedDocument[];
  totalResults: number;
  queryTime: number;
  confidence: number;
}

export interface RetrievedDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  relevanceScore: number;
  metadata: {
    type: string;
    jurisdiction: string;
    date: Date;
    court?: string;
    caseNumber?: string;
    citation?: string;
  };
}

// Frontend-specific types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'lawyer' | 'paralegal' | 'client';
  avatar?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  pendingReview: number;
  averageCompletionTime: number;
  successRate: number;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  children?: NavigationItem[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | undefined;
  };
}