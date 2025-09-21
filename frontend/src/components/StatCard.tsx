import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, trend, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  const bgColorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    gray: 'bg-gray-50 dark:bg-gray-900/20',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-md ${bgColorClasses[color]}`}>
            <Icon className={`h-6 w-6 text-white ${colorClasses[color]}`} />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
              </div>
              {trend && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? (
                    <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {trend.isPositive ? 'Increased' : 'Decreased'} by
                  </span>
                  {trend.value}%
                </div>
              )}
            </dd>
            {subtitle && (
              <dd className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default StatCard;