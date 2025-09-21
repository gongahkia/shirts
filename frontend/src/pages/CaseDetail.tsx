import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  DocumentIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { casesAPI } from '@/services/api';
import { useWorkflowUpdates, useCaseUpdates } from '@/hooks/useWebSocket';
import LoadingSpinner from '@/components/LoadingSpinner';

function CaseDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: caseResponse, isLoading, error } = useQuery(
    ['cases', id],
    () => casesAPI.getById(id!),
    { enabled: !!id }
  );

  const { data: documentsResponse } = useQuery(
    ['case-documents', id],
    () => casesAPI.getDocuments(id!),
    { enabled: !!id }
  );

  useCaseUpdates(id);
  useWorkflowUpdates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !caseResponse?.data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Case not found</div>
        <Link to="/cases" className="btn-primary">
          Back to Cases
        </Link>
      </div>
    );
  }

  const case_ = caseResponse.data;
  const documents = documentsResponse?.data || [];

  const workflowStages = [
    { id: 'plaintiff-intake', name: 'Plaintiff Intake', description: 'Initial case information processing' },
    { id: 'legal-research', name: 'Legal Research', description: 'AI-powered research and precedent analysis' },
    { id: 'argument-generation', name: 'Argument Generation', description: 'Legal argument formulation' },
    { id: 'document-drafting', name: 'Document Drafting', description: 'Automated document generation' },
    { id: 'review-and-revision', name: 'Review & Revision', description: 'Quality review and refinements' },
    { id: 'final-formatting', name: 'Final Formatting', description: 'Court-ready document preparation' },
  ];

  const getCurrentStageIndex = () => {
    return workflowStages.findIndex(stage => stage.id === case_.workflowStage);
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/cases"
            className="flex items-center text-legal-600 hover:text-legal-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Cases
          </Link>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-legal font-bold text-gray-900 dark:text-white">
              {case_.caseDetails.title}
            </h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Case ID: {case_.id.slice(-8)}</span>
              <span>•</span>
              <span>Created: {format(new Date(case_.createdAt), 'MMM dd, yyyy')}</span>
              <span>•</span>
              <span className={`badge badge-status-${case_.status}`}>
                {case_.status}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button className="btn-secondary">
              <DocumentIcon className="h-4 w-4 mr-2" />
              Export Case
            </button>
            <button className="btn-primary">
              <PlayIcon className="h-4 w-4 mr-2" />
              Restart Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Workflow Progress */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Workflow Progress
            </h2>

            <div className="space-y-4">
              {workflowStages.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <div
                    key={stage.id}
                    className={`workflow-stage ${
                      isCompleted ? 'workflow-stage-completed' :
                      isCurrent ? 'workflow-stage-active' :
                      'workflow-stage-pending'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      ) : isCurrent ? (
                        <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {stage.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {stage.description}
                      </p>
                    </div>

                    <div className="text-right">
                      {isCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Completed
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          In Progress
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs text-gray-400 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Case Details */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Case Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Legal Category
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.caseDetails.category.replace('-', ' ')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Jurisdiction
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.caseDetails.jurisdiction}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Court Level
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.caseDetails.courtLevel}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Complexity
                </h3>
                <span className={`badge ${
                  case_.caseDetails.complexity === 'high' ? 'badge-status-error' :
                  case_.caseDetails.complexity === 'medium' ? 'badge-status-pending' :
                  'badge-status-completed'
                }`}>
                  {case_.caseDetails.complexity}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Estimated Duration
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.caseDetails.estimatedDuration} days
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Urgency
                </h3>
                <span className={`badge ${
                  case_.plaintiffInfo.urgency === 'critical' ? 'badge-status-error' :
                  case_.plaintiffInfo.urgency === 'high' ? 'badge-status-review' :
                  case_.plaintiffInfo.urgency === 'medium' ? 'badge-status-pending' :
                  'badge-status-completed'
                }`}>
                  {case_.plaintiffInfo.urgency}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Legal Issue
              </h3>
              <p className="text-gray-900 dark:text-white">
                {case_.plaintiffInfo.legalIssue}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Description
              </h3>
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {case_.plaintiffInfo.description}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Desired Outcome
              </h3>
              <p className="text-gray-900 dark:text-white leading-relaxed">
                {case_.plaintiffInfo.desiredOutcome}
              </p>
            </div>
          </div>

          {/* Generated Documents */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Generated Documents
            </h2>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents generated yet</p>
                <p className="text-sm">Documents will appear here as the workflow progresses</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-6 w-6 text-legal-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {document.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {document.type.replace('-', ' ')} • {document.format.toUpperCase()} •
                          Generated {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`badge badge-status-${document.status}`}>
                        {document.status}
                      </span>
                      <button className="text-legal-600 hover:text-legal-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plaintiff Information */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Plaintiff Information
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.plaintiffInfo.name}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.plaintiffInfo.email}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {case_.plaintiffInfo.phone}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Address
                </h3>
                <p className="text-gray-900 dark:text-white text-sm">
                  {case_.plaintiffInfo.address.street}<br />
                  {case_.plaintiffInfo.address.city}, {case_.plaintiffInfo.address.state} {case_.plaintiffInfo.address.zipCode}<br />
                  {case_.plaintiffInfo.address.country}
                </p>
              </div>
            </div>
          </div>

          {/* Case Statistics */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Case Statistics
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Documents Generated</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {documents.length}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Days Since Creation</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.floor((Date.now() - new Date(case_.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round((currentStageIndex / workflowStages.length) * 100)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-legal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStageIndex / workflowStages.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseDetail;