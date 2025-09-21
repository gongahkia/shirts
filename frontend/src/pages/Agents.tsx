import React from 'react';
import { useQuery } from 'react-query';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { agentsAPI } from '@/services/api';
import { useAgentUpdates } from '@/hooks/useWebSocket';
import LoadingSpinner from '@/components/LoadingSpinner';

function Agents() {
  const { data: agentsResponse, isLoading } = useQuery(
    'agents',
    () => agentsAPI.getAll(),
    { refetchInterval: 15000 }
  );

  const { data: healthResponse } = useQuery(
    'agent-health',
    () => agentsAPI.getHealth(),
    { refetchInterval: 10000 }
  );

  useAgentUpdates();

  const agents = agentsResponse?.data || [];
  const health = healthResponse?.data;

  const getStatusIcon = (status: string, healthy?: boolean) => {
    if (healthy === false) return ExclamationTriangleIcon;
    switch (status) {
      case 'idle':
        return CheckCircleIcon;
      case 'processing':
        return ClockIcon;
      case 'maintenance':
        return CogIcon;
      case 'error':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status: string, healthy?: boolean) => {
    if (healthy === false) return 'text-red-500';
    switch (status) {
      case 'idle':
        return 'text-green-500';
      case 'processing':
        return 'text-blue-500';
      case 'maintenance':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-legal font-bold text-gray-900 dark:text-white">
          Agent Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor and manage AI agents in the legal workflow system
        </p>
      </div>

      {/* System Health Overview */}
      {health && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            System Health Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${health.healthy ? 'text-green-500' : 'text-red-500'}`}>
                {health.healthyCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Healthy Agents</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {health.totalCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Agents</div>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold ${
                health.healthPercentage >= 80 ? 'text-green-500' :
                health.healthPercentage >= 60 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {Math.round(health.healthPercentage)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Health Rate</div>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold ${
                health.healthy ? 'text-green-500' : 'text-red-500'
              }`}>
                {health.healthy ? 'OK' : 'ERROR'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">System Status</div>
            </div>
          </div>

          {/* Health Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Health
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {health.healthyCount} / {health.totalCount} agents healthy
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  health.healthPercentage >= 80 ? 'bg-green-500' :
                  health.healthPercentage >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${health.healthPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const StatusIcon = getStatusIcon(agent.status, agent.healthy);
          const statusColor = getStatusColor(agent.status, agent.healthy);

          return (
            <div key={agent.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    agent.healthy === false ? 'bg-red-100 dark:bg-red-900/20' :
                    agent.status === 'idle' ? 'bg-green-100 dark:bg-green-900/20' :
                    agent.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    agent.status === 'maintenance' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {agent.type.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  agent.healthy === false ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  agent.status === 'idle' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  agent.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  agent.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {agent.healthy === false ? 'unhealthy' : agent.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {agent.description}
              </p>

              {/* Current Task */}
              {agent.currentTask && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Task
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {agent.currentTask}
                  </p>
                </div>
              )}

              {/* Capabilities */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capabilities
                </h4>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <span
                      key={capability}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-legal-100 text-legal-800 dark:bg-legal-900/20 dark:text-legal-400"
                    >
                      {capability}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {agent.processedCases}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Cases Processed
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round(agent.averageProcessingTime)}ms
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Avg Processing Time
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                {agent.status === 'maintenance' ? (
                  <button className="flex-1 btn-primary text-xs py-1">
                    Enable
                  </button>
                ) : (
                  <button className="flex-1 btn-secondary text-xs py-1">
                    Maintenance
                  </button>
                )}
                <button className="flex-1 btn-outline text-xs py-1">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No agents found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Agent information will appear here when the system is running
          </p>
        </div>
      )}
    </div>
  );
}

export default Agents;