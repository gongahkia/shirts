import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  FolderIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { casesAPI, agentsAPI, workflowsAPI } from '@/services/api';
import { LegalCase, Agent, WorkflowState } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import RecentActivity from '@/components/RecentActivity';

function Dashboard() {
  const { data: casesResponse, isLoading: casesLoading } = useQuery(
    'cases',
    () => casesAPI.getAll(1, 10),
    { refetchInterval: 30000 }
  );

  const { data: agentsResponse, isLoading: agentsLoading } = useQuery(
    'agents',
    () => agentsAPI.getAll(),
    { refetchInterval: 15000 }
  );

  const { data: workflowsResponse, isLoading: workflowsLoading } = useQuery(
    'workflows',
    () => workflowsAPI.getAll(),
    { refetchInterval: 10000 }
  );

  const cases = casesResponse?.data || [];
  const agents = agentsResponse?.data || [];
  const workflows = workflowsResponse?.data || [];

  const stats = {
    totalCases: cases.length,
    activeCases: cases.filter(c => c.status === 'active').length,
    completedCases: cases.filter(c => c.status === 'completed').length,
    pendingReview: cases.filter(c => c.status === 'review').length,
    activeWorkflows: workflows.filter(w => w.currentStage !== 'completed').length,
    healthyAgents: agents.filter(a => a.healthy !== false).length,
    totalAgents: agents.length,
  };

  if (casesLoading || agentsLoading || workflowsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-legal-600 to-legal-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-legal font-bold">Welcome to Shirts Legal Workflow</h1>
            <p className="mt-2 text-legal-100">
              Manage your legal cases with AI-powered workflow automation
            </p>
          </div>
          <div className="hidden sm:block">
            <Link
              to="/cases/new"
              className="inline-flex items-center px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-md transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Case
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cases"
          value={stats.totalCases}
          icon={FolderIcon}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Cases"
          value={stats.activeCases}
          icon={PlayIcon}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={ClockIcon}
          color="yellow"
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Completed Cases"
          value={stats.completedCases}
          icon={CheckCircleIcon}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Status */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Active Workflows
            </h3>
            <Link
              to="/workflows"
              className="text-legal-600 hover:text-legal-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {workflows.slice(0, 5).map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    workflow.currentStage === 'completed' ? 'bg-green-500' :
                    workflow.errors.length > 0 ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Case {workflow.caseId.slice(-8)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {workflow.currentStage.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {workflow.progress}%
                  </p>
                  <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                    <div
                      className="bg-legal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {workflows.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <PlayIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active workflows</p>
              </div>
            )}
          </div>
        </div>

        {/* Agent Status */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Agent Status
            </h3>
            <Link
              to="/agents"
              className="text-legal-600 hover:text-legal-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    agent.healthy === false ? 'bg-red-500' :
                    agent.status === 'processing' ? 'bg-blue-500' :
                    agent.status === 'maintenance' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {agent.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {agent.processedCases}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    cases processed
                  </p>
                </div>
              </div>
            ))}

            {agents.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No agents available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Cases
          </h3>
          <Link
            to="/cases"
            className="text-legal-600 hover:text-legal-700 text-sm font-medium"
          >
            View all cases
          </Link>
        </div>

        <div className="overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Workflow Stage</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cases.slice(0, 5).map((case_) => (
                <tr key={case_.id}>
                  <td>
                    <Link
                      to={`/cases/${case_.id}`}
                      className="text-legal-600 hover:text-legal-700 font-medium"
                    >
                      {case_.caseDetails.title}
                    </Link>
                  </td>
                  <td className="text-gray-500 dark:text-gray-400">
                    {case_.caseDetails.category.replace('-', ' ')}
                  </td>
                  <td>
                    <span className={`badge badge-status-${case_.status}`}>
                      {case_.status}
                    </span>
                  </td>
                  <td className="text-gray-500 dark:text-gray-400">
                    {case_.workflowStage.replace('-', ' ')}
                  </td>
                  <td className="text-gray-500 dark:text-gray-400">
                    {new Date(case_.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {cases.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FolderIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No cases found</p>
              <Link
                to="/cases/new"
                className="mt-2 inline-flex items-center text-legal-600 hover:text-legal-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Create your first case
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/cases/new"
          className="card p-6 hover:shadow-legal-lg transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-legal-100 dark:bg-legal-800 rounded-lg group-hover:bg-legal-200 dark:group-hover:bg-legal-700 transition-colors duration-200">
              <PlusIcon className="h-6 w-6 text-legal-600 dark:text-legal-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Case
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start a new legal case workflow
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/workflows"
          className="card p-6 hover:shadow-legal-lg transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors duration-200">
              <PlayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Monitor Workflows
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track active workflow progress
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/agents"
          className="card p-6 hover:shadow-legal-lg transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-700 transition-colors duration-200">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                System Status
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check agent health and performance
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;