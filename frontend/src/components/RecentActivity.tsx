import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: 'workflow-started' | 'workflow-completed' | 'workflow-failed' | 'case-created' | 'case-updated';
  title: string;
  description: string;
  timestamp: Date;
  entityId: string;
  entityType: 'case' | 'workflow' | 'agent';
}

interface RecentActivityProps {
  activities: Activity[];
  maxItems?: number;
}

function RecentActivity({ activities, maxItems = 10 }: RecentActivityProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'workflow-started':
        return PlayIcon;
      case 'workflow-completed':
        return CheckCircleIcon;
      case 'workflow-failed':
        return ExclamationTriangleIcon;
      case 'case-created':
      case 'case-updated':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'workflow-started':
        return 'text-blue-500';
      case 'workflow-completed':
        return 'text-green-500';
      case 'workflow-failed':
        return 'text-red-500';
      case 'case-created':
      case 'case-updated':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>

      {displayedActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="flow-root">
          <ul className="-mb-8">
            {displayedActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.type);
              const isLast = index === displayedActivities.length - 1;

              return (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700`}>
                          <Icon className={`h-4 w-4 ${iconColor}`} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          <time dateTime={activity.timestamp.toISOString()}>
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RecentActivity;