import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { casesAPI } from '@/services/api';
import { LegalCase, CaseStatus, LegalCategory } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

function Cases() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LegalCategory | 'all'>('all');

  const { data: casesResponse, isLoading, error } = useQuery(
    ['cases', page],
    () => casesAPI.getAll(page, 20),
    { keepPreviousData: true }
  );

  const cases = casesResponse?.data || [];
  const pagination = casesResponse?.pagination;

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.caseDetails.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.plaintiffInfo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || case_.caseDetails.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Failed to load cases</div>
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
            Legal Cases
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and track all your legal cases
          </p>
        </div>
        <Link to="/cases/new" className="btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          New Case
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | 'all')}
            className="input"
          >
            <option value="all">All Statuses</option>
            <option value="intake">Intake</option>
            <option value="active">Active</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LegalCategory | 'all')}
            className="input"
          >
            <option value="all">All Categories</option>
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

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FunnelIcon className="h-4 w-4 mr-2" />
            {filteredCases.length} of {cases.length} cases
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No cases match your filters'
                : 'No cases found'
              }
            </div>
            <Link to="/cases/new" className="btn-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Case
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Title</th>
                  <th>Plaintiff</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Workflow Stage</th>
                  <th>Urgency</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCases.map((case_) => (
                  <tr key={case_.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td>
                      <Link
                        to={`/cases/${case_.id}`}
                        className="text-legal-600 hover:text-legal-700 font-medium"
                      >
                        {case_.caseDetails.title}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {case_.plaintiffInfo.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {case_.plaintiffInfo.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {case_.caseDetails.category.replace('-', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status-${case_.status}`}>
                        {case_.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {case_.workflowStage.replace('-', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        case_.plaintiffInfo.urgency === 'critical' ? 'badge-status-error' :
                        case_.plaintiffInfo.urgency === 'high' ? 'badge-status-review' :
                        case_.plaintiffInfo.urgency === 'medium' ? 'badge-status-pending' :
                        'badge-status-completed'
                      }`}>
                        {case_.plaintiffInfo.urgency}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(case_.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/cases/${case_.id}`}
                        className="text-legal-600 hover:text-legal-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-legal-50 dark:bg-legal-900 border-legal-500 text-legal-600 dark:text-legal-400'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cases;