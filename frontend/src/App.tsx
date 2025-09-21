import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import CreateCase from '@/pages/CreateCase';
import Workflows from '@/pages/Workflows';
import WorkflowDetail from '@/pages/WorkflowDetail';
import Agents from '@/pages/Agents';
import Settings from '@/pages/Settings';
import socketService from '@/services/socket';

function App() {
  useEffect(() => {
    // Connect to WebSocket on app mount
    socketService.connect();

    return () => {
      // Disconnect on unmount
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/new" element={<CreateCase />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/workflows/:id" element={<WorkflowDetail />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App;