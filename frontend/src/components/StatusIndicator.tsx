import React from 'react';
import { useConnectionStatus } from '@/hooks/useWebSocket';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function StatusIndicator() {
  const isConnected = useConnectionStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg ${
        isConnected
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      }`}>
        {isConnected ? (
          <>
            <WifiIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Connected</span>
          </>
        ) : (
          <>
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Disconnected</span>
          </>
        )}
      </div>
    </div>
  );
}

export default StatusIndicator;