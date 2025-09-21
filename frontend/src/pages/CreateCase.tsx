import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { casesAPI } from '@/services/api';
import { LegalCategory, CourtLevel } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CaseFormData {
  // Plaintiff Info
  plaintiffName: string;
  plaintiffEmail: string;
  plaintiffPhone: string;
  plaintiffStreet: string;
  plaintiffCity: string;
  plaintiffState: string;
  plaintiffZipCode: string;
  plaintiffCountry: string;
  legalIssue: string;
  description: string;
  desiredOutcome: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';

  // Case Details
  caseTitle: string;
  category: LegalCategory;
  jurisdiction: string;
  courtLevel: CourtLevel;
  estimatedDuration: number;
  complexity: 'low' | 'medium' | 'high';
}

function CreateCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<CaseFormData>({
    defaultValues: {
      urgency: 'medium',
      category: 'other',
      courtLevel: 'state',
      estimatedDuration: 30,
      complexity: 'medium',
      plaintiffCountry: 'USA',
    }
  });

  const createCaseMutation = useMutation(casesAPI.create, {
    onSuccess: (response) => {
      queryClient.invalidateQueries(['cases']);
      toast.success('Case created successfully!');
      navigate(`/cases/${response.data?.case.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create case');
    },
  });

  const onSubmit: SubmitHandler<CaseFormData> = (data) => {
    const caseData = {
      plaintiffInfo: {
        name: data.plaintiffName,
        email: data.plaintiffEmail,
        phone: data.plaintiffPhone,
        address: {
          street: data.plaintiffStreet,
          city: data.plaintiffCity,
          state: data.plaintiffState,
          zipCode: data.plaintiffZipCode,
          country: data.plaintiffCountry,
        },
        legalIssue: data.legalIssue,
        description: data.description,
        desiredOutcome: data.desiredOutcome,
        urgency: data.urgency,
      },
      caseDetails: {
        title: data.caseTitle,
        category: data.category,
        jurisdiction: data.jurisdiction,
        courtLevel: data.courtLevel,
        estimatedDuration: data.estimatedDuration,
        complexity: data.complexity,
        precedents: [],
        relevantLaws: [],
      },
    };

    createCaseMutation.mutate(caseData);
  };

  const watchCategory = watch('category');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-legal font-bold text-gray-900 dark:text-white">
          Create New Legal Case
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Provide the case details to start the automated legal workflow
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Plaintiff Information */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Plaintiff Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                {...register('plaintiffName', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className="input"
                placeholder="John Doe"
              />
              {errors.plaintiffName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.plaintiffName.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Email Address *</label>
              <input
                type="email"
                {...register('plaintiffEmail', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="input"
                placeholder="john.doe@example.com"
              />
              {errors.plaintiffEmail && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.plaintiffEmail.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Phone Number *</label>
              <input
                type="tel"
                {...register('plaintiffPhone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[\+]?[0-9\s\-\(\)]+$/,
                    message: 'Invalid phone number'
                  }
                })}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
              {errors.plaintiffPhone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.plaintiffPhone.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Urgency Level *</label>
              <select {...register('urgency')} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="label">Street Address *</label>
                <input
                  type="text"
                  {...register('plaintiffStreet', { required: 'Street address is required' })}
                  className="input"
                  placeholder="123 Main Street"
                />
                {errors.plaintiffStreet && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plaintiffStreet.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  {...register('plaintiffCity', { required: 'City is required' })}
                  className="input"
                  placeholder="New York"
                />
                {errors.plaintiffCity && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plaintiffCity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">State *</label>
                <input
                  type="text"
                  {...register('plaintiffState', { required: 'State is required' })}
                  className="input"
                  placeholder="NY"
                />
                {errors.plaintiffState && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plaintiffState.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">ZIP Code *</label>
                <input
                  type="text"
                  {...register('plaintiffZipCode', {
                    required: 'ZIP code is required',
                    pattern: {
                      value: /^\d{5}(-\d{4})?$/,
                      message: 'Invalid ZIP code format'
                    }
                  })}
                  className="input"
                  placeholder="10001"
                />
                {errors.plaintiffZipCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plaintiffZipCode.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Country *</label>
                <input
                  type="text"
                  {...register('plaintiffCountry', { required: 'Country is required' })}
                  className="input"
                />
                {errors.plaintiffCountry && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plaintiffCountry.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Legal Issue Details */}
          <div className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="label">Legal Issue Summary *</label>
                <input
                  type="text"
                  {...register('legalIssue', {
                    required: 'Legal issue summary is required',
                    minLength: { value: 10, message: 'Please provide more detail (at least 10 characters)' }
                  })}
                  className="input"
                  placeholder="Breach of contract regarding software development services"
                />
                {errors.legalIssue && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.legalIssue.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Detailed Description *</label>
                <textarea
                  rows={4}
                  {...register('description', {
                    required: 'Detailed description is required',
                    minLength: { value: 50, message: 'Please provide more detail (at least 50 characters)' }
                  })}
                  className="input"
                  placeholder="Provide a comprehensive description of the legal issue, including relevant facts, timeline, and circumstances..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Desired Outcome *</label>
                <textarea
                  rows={3}
                  {...register('desiredOutcome', {
                    required: 'Desired outcome is required',
                    minLength: { value: 10, message: 'Please specify the desired outcome' }
                  })}
                  className="input"
                  placeholder="What resolution are you seeking? (e.g., monetary damages, specific performance, injunctive relief...)"
                />
                {errors.desiredOutcome && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.desiredOutcome.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Case Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Case Title *</label>
              <input
                type="text"
                {...register('caseTitle', {
                  required: 'Case title is required',
                  minLength: { value: 5, message: 'Case title must be at least 5 characters' }
                })}
                className="input"
                placeholder="Smith v. TechCorp Software Services"
              />
              {errors.caseTitle && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.caseTitle.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Legal Category *</label>
              <select {...register('category')} className="input">
                <option value="civil-litigation">Civil Litigation</option>
                <option value="contract-dispute">Contract Dispute</option>
                <option value="employment-law">Employment Law</option>
                <option value="personal-injury">Personal Injury</option>
                <option value="intellectual-property">Intellectual Property</option>
                <option value="real-estate">Real Estate</option>
                <option value="family-law">Family Law</option>
                <option value="criminal-defense">Criminal Defense</option>
                <option value="business-law">Business Law</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Jurisdiction *</label>
              <input
                type="text"
                {...register('jurisdiction', { required: 'Jurisdiction is required' })}
                className="input"
                placeholder="New York State"
              />
              {errors.jurisdiction && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.jurisdiction.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Court Level *</label>
              <select {...register('courtLevel')} className="input">
                <option value="municipal">Municipal</option>
                <option value="county">County</option>
                <option value="state">State</option>
                <option value="federal">Federal</option>
                <option value="supreme">Supreme</option>
              </select>
            </div>

            <div>
              <label className="label">Case Complexity *</label>
              <select {...register('complexity')} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="label">Estimated Duration (days) *</label>
              <input
                type="number"
                min="1"
                max="365"
                {...register('estimatedDuration', {
                  required: 'Estimated duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 day' },
                  max: { value: 365, message: 'Duration cannot exceed 365 days' }
                })}
                className="input"
              />
              {errors.estimatedDuration && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.estimatedDuration.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || createCaseMutation.isLoading}
          >
            {isSubmitting || createCaseMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating Case...
              </>
            ) : (
              'Create Case & Start Workflow'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateCase;