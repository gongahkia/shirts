import Joi from 'joi';
import { PlaintiffInfo, CaseDetails, LegalCategory, CourtLevel } from '@/types';

const addressSchema = Joi.object({
  street: Joi.string().required().min(1).max(200),
  city: Joi.string().required().min(1).max(100),
  state: Joi.string().required().min(2).max(50),
  zipCode: Joi.string().required().pattern(/^\d{5}(-\d{4})?$/),
  country: Joi.string().required().min(2).max(50)
});

export const plaintiffInfoSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string().required().pattern(/^\+?[\d\s\-\(\)]+$/),
  address: addressSchema.required(),
  legalIssue: Joi.string().required().min(10).max(500),
  description: Joi.string().required().min(50).max(2000),
  desiredOutcome: Joi.string().required().min(10).max(1000),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical').required()
});

export const caseDetailsSchema = Joi.object({
  title: Joi.string().required().min(5).max(200),
  category: Joi.string().valid(
    'civil-litigation',
    'contract-dispute',
    'employment-law',
    'personal-injury',
    'intellectual-property',
    'real-estate',
    'family-law',
    'criminal-defense',
    'business-law',
    'other'
  ).required(),
  jurisdiction: Joi.string().required().min(2).max(100),
  courtLevel: Joi.string().valid('municipal', 'county', 'state', 'federal', 'supreme').required(),
  estimatedDuration: Joi.number().integer().min(1).max(365).required(),
  complexity: Joi.string().valid('low', 'medium', 'high').required(),
  precedents: Joi.array().items(Joi.string().min(1).max(500)).default([]),
  relevantLaws: Joi.array().items(Joi.string().min(1).max(500)).default([])
});

export const createCaseSchema = Joi.object({
  plaintiffInfo: plaintiffInfoSchema.required(),
  caseDetails: caseDetailsSchema.required()
});

export const updateCaseSchema = Joi.object({
  plaintiffInfo: plaintiffInfoSchema.optional(),
  caseDetails: caseDetailsSchema.optional(),
  status: Joi.string().valid('intake', 'active', 'review', 'completed', 'archived', 'cancelled').optional()
});

export const ragQuerySchema = Joi.object({
  query: Joi.string().required().min(3).max(1000),
  context: Joi.string().optional().max(2000),
  filters: Joi.object({
    documentType: Joi.array().items(Joi.string()).optional(),
    jurisdiction: Joi.array().items(Joi.string()).optional(),
    dateRange: Joi.object({
      start: Joi.date().optional(),
      end: Joi.date().optional()
    }).optional(),
    relevanceScore: Joi.number().min(0).max(1).optional()
  }).optional(),
  maxResults: Joi.number().integer().min(1).max(100).default(10),
  threshold: Joi.number().min(0).max(1).default(0.7)
});

export const geminiRequestSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(10000),
  context: Joi.string().optional().max(5000),
  temperature: Joi.number().min(0).max(2).default(0.7),
  maxTokens: Joi.number().integer().min(1).max(4000).default(2000),
  systemPrompt: Joi.string().optional().max(2000)
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export function validateInput<T>(schema: Joi.ObjectSchema, data: unknown): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }

  return value as T;
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 10000);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}