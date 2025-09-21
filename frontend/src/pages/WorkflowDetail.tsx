import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { workflowsAPI } from '@/services/api';
import { useWorkflowUpdates } from '@/hooks/useWebSocket';
import LoadingSpinner from '@/components/LoadingSpinner';

function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: workflowResponse, isLoading, error } = useQuery(
    ['workflow', id],
    () => workflowsAPI.getById(id!),
    { enabled: !!id, refetchInterval: 5000 }
  );

  const { data: logsResponse } = useQuery(
    ['workflow-logs', id],
    () => workflowsAPI.getLogs(id!),
    { enabled: !!id, refetchInterval: 5000 }
  );

  const { data: errorsResponse } = useQuery(
    ['workflow-errors', id],
    () => workflowsAPI.getErrors(id!),
    { enabled: !!id }
  );

  useWorkflowUpdates(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !workflowResponse?.data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Workflow not found</div>
        <Link to="/workflows" className="btn-primary">
          Back to Workflows
        </Link>
      </div>
    );
  }

  const workflow = workflowResponse.data;
  const logs = logsResponse?.data || [];
  const errors = errorsResponse?.data || [];

  const workflowStages = [
    { id: 'plaintiff-intake', name: 'Plaintiff Intake' },
    { id: 'legal-research', name: 'Legal Research' },
    { id: 'argument-generation', name: 'Argument Generation' },
    { id: 'document-drafting', name: 'Document Drafting' },
    { id: 'review-and-revision', name: 'Review & Revision' },
    { id: 'final-formatting', name: 'Final Formatting' },
  ];

  const getCurrentStageIndex = () => {
    return workflowStages.findIndex(stage => stage.id === workflow.currentStage);
  };

  const currentStageIndex = getCurrentStageIndex();
  const hasErrors = workflow.errors.length > 0;
  const isCompleted = workflow.currentStage === 'completed';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/workflows"
            className="flex items-center text-legal-600 hover:text-legal-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Workflows
          </Link>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-legal font-bold text-gray-900 dark:text-white">
              Workflow Details
            </h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Workflow ID: {id?.slice(-8)}</span>
              <span>•</span>
              <span>Case ID: {workflow.caseId.slice(-8)}</span>
              <span>•</span>
              <span>Progress: {workflow.progress}%</span>
            </div>
          </div>

          <div className="flex space-x-3">
            {!isCompleted && (
              <>
                <button className="btn-secondary">
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </button>
                <button className="btn-danger">
                  <StopIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            )}
            <Link
              to={`/cases/${workflow.caseId}`}
              className="btn-primary"
            >
              View Case
            </Link>
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

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {workflow.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    hasErrors ? 'bg-red-500' :
                    isCompleted ? 'bg-green-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${workflow.progress}%` }}
                />
              </div>
            </div>

            {/* Stage Details */}
            <div className="space-y-4">
              {workflowStages.map((stage, index) => {
                const isCompleted = workflow.completedStages.includes(stage.id);
                const isCurrent = stage.id === workflow.currentStage;
                const isPending = !isCompleted && !isCurrent;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                      isCompleted ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                      isCurrent ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 shadow-md' :
                      'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
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
                        Stage {index + 1} of {workflowStages.length}
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

          {/* Workflow Logs */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Workflow Logs
            </h2>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No logs available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.slice().reverse().map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.agent} - {log.action}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.details}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Stage: {log.stage.replace('-', ' ')}
                        </span>
                        {log.duration > 0 && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Duration: {log.duration}ms
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Status */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Status Overview
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current Stage
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {workflow.currentStage.replace('-', ' ')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estimated Completion
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(workflow.estimatedCompletion), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed Stages
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {workflow.completedStages.length} of {workflowStages.length}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Logs
                </h3>
                <p className="text-gray-900 dark:text-white">
                  {logs.length}
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {workflow.errors.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-red-700 dark:text-red-400 mb-4">
                Errors ({workflow.errors.length})
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {workflow.errors.map((error, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-800 dark:text-red-400">
                          {error.agent} - {error.stage.replace('-', ' ')}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {error.error}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            error.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            error.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {error.severity}
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {format(new Date(error.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowDetail;