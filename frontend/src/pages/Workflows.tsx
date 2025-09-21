import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
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

function Workflows() {
  const { data: workflowsResponse, isLoading, error } = useQuery(
    'workflows',
    () => workflowsAPI.getAll(),
    { refetchInterval: 10000 }
  );

  useWorkflowUpdates();

  const workflows = workflowsResponse?.data || [];

  const getStageIcon = (stage: string, hasErrors: boolean) => {
    if (hasErrors) return ExclamationTriangleIcon;
    if (stage === 'completed') return CheckCircleIcon;
    return ClockIcon;
  };

  const getStageColor = (stage: string, hasErrors: boolean) => {
    if (hasErrors) return 'text-red-500';
    if (stage === 'completed') return 'text-green-500';
    return 'text-blue-500';
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Failed to load workflows</div>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-legal font-bold text-gray-900 dark:text-white">
            Workflow Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage active legal workflows
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {workflows.filter(w => w.currentStage !== 'completed').length} active workflows
          </div>
        </div>
      </div>

      {/* Workflow Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12">
          <PlayIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No workflows found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Workflows will appear here when cases are created and processed
          </p>
          <Link to="/cases/new" className="btn-primary">
            Create New Case
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => {
            const hasErrors = workflow.errors.length > 0;
            const isCompleted = workflow.currentStage === 'completed';
            const StageIcon = getStageIcon(workflow.currentStage, hasErrors);
            const stageColor = getStageColor(workflow.currentStage, hasErrors);

            return (
              <div key={workflow.id} className="card p-6 hover:shadow-legal-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      hasErrors ? 'bg-red-100 dark:bg-red-900/20' :
                      isCompleted ? 'bg-green-100 dark:bg-green-900/20' :
                      'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      <StageIcon className={`h-5 w-5 ${stageColor}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Case {workflow.caseId.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Workflow ID: {workflow.id?.slice(-8)}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/workflows/${workflow.id}`}
                    className="text-legal-600 hover:text-legal-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {workflow.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        hasErrors ? 'bg-red-500' :
                        isCompleted ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>

                {/* Current Stage */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Stage
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {workflow.currentStage.replace('-', ' ')}
                  </p>
                </div>

                {/* Estimated Completion */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Completion
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(workflow.estimatedCompletion), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>

                {/* Completed Stages */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Completed Stages
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {workflow.completedStages.length === 0 ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        None yet
                      </span>
                    ) : (
                      workflow.completedStages.map((stage) => (
                        <span
                          key={stage}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        >
                          {stage.replace('-', ' ')}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Errors */}
                {workflow.errors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                      Errors ({workflow.errors.length})
                    </h4>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-xs text-red-800 dark:text-red-400">
                        {workflow.errors[0].error}
                      </p>
                      {workflow.errors.length > 1 && (
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                          +{workflow.errors.length - 1} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {!isCompleted && (
                    <>
                      <button className="flex-1 btn-secondary text-xs py-1">
                        <PauseIcon className="h-3 w-3 mr-1" />
                        Pause
                      </button>
                      <button className="flex-1 btn-danger text-xs py-1">
                        <StopIcon className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </>
                  )}
                  {isCompleted && (
                    <button className="flex-1 btn-primary text-xs py-1">
                      <PlayIcon className="h-3 w-3 mr-1" />
                      Restart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Workflows;