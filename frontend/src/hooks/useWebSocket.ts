import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import socketService, { SocketEvents } from '@/services/socket';
import { WorkflowState } from '@/types';

export function useWorkflowUpdates(workflowId?: string) {
  const queryClient = useQueryClient();
  const toastRef = useRef<string | null>(null);

  const handleWorkflowStarted = useCallback((data: Parameters<SocketEvents['workflow-started']>[0]) => {
    queryClient.invalidateQueries(['workflows']);
    queryClient.invalidateQueries(['workflow', data.workflowId]);

    toast.success(`Workflow started for case ${data.caseId.slice(-8)}`);
  }, [queryClient]);

  const handleWorkflowProgress = useCallback((data: Parameters<SocketEvents['workflow-progress']>[0]) => {
    queryClient.setQueryData(['workflow', data.workflowId], (old: any) => {
      if (old?.data) {
        return {
          ...old,
          data: {
            ...old.data,
            progress: data.progress,
            currentStage: data.currentStage,
          }
        };
      }
      return old;
    });

    // Update progress toast
    if (toastRef.current) {
      toast.dismiss(toastRef.current);
    }
    toastRef.current = toast.loading(
      `Workflow progress: ${data.progress}% - ${data.currentStage.replace('-', ' ')}`,
      { duration: 2000 }
    );
  }, [queryClient]);

  const handleWorkflowStageStarted = useCallback((data: Parameters<SocketEvents['workflow-stage-started']>[0]) => {
    toast.info(`Started: ${data.stage.replace('-', ' ')}`);
  }, []);

  const handleWorkflowStageCompleted = useCallback((data: Parameters<SocketEvents['workflow-stage-completed']>[0]) => {
    queryClient.invalidateQueries(['workflow', data.workflowId]);
    toast.success(`Completed: ${data.stage.replace('-', ' ')} (${data.duration}ms)`);
  }, [queryClient]);

  const handleWorkflowStageFailed = useCallback((data: Parameters<SocketEvents['workflow-stage-failed']>[0]) => {
    queryClient.invalidateQueries(['workflow', data.workflowId]);
    toast.error(`Failed: ${data.stage.replace('-', ' ')} - ${data.error}`);
  }, [queryClient]);

  const handleWorkflowCompleted = useCallback((data: Parameters<SocketEvents['workflow-completed']>[0]) => {
    queryClient.invalidateQueries(['workflows']);
    queryClient.invalidateQueries(['workflow', data.workflowId]);
    queryClient.invalidateQueries(['cases']);
    queryClient.invalidateQueries(['cases', data.caseId]);

    if (toastRef.current) {
      toast.dismiss(toastRef.current);
      toastRef.current = null;
    }
    toast.success(`Workflow completed for case ${data.caseId.slice(-8)}`);
  }, [queryClient]);

  const handleWorkflowFailed = useCallback((data: Parameters<SocketEvents['workflow-failed']>[0]) => {
    queryClient.invalidateQueries(['workflow', data.workflowId]);

    if (toastRef.current) {
      toast.dismiss(toastRef.current);
      toastRef.current = null;
    }
    toast.error(`Workflow failed: ${data.error}`);
  }, [queryClient]);

  useEffect(() => {
    socketService.connect();

    socketService.on('workflow-started', handleWorkflowStarted);
    socketService.on('workflow-progress', handleWorkflowProgress);
    socketService.on('workflow-stage-started', handleWorkflowStageStarted);
    socketService.on('workflow-stage-completed', handleWorkflowStageCompleted);
    socketService.on('workflow-stage-failed', handleWorkflowStageFailed);
    socketService.on('workflow-completed', handleWorkflowCompleted);
    socketService.on('workflow-failed', handleWorkflowFailed);

    if (workflowId) {
      socketService.joinWorkflow(workflowId);
    }

    return () => {
      socketService.off('workflow-started', handleWorkflowStarted);
      socketService.off('workflow-progress', handleWorkflowProgress);
      socketService.off('workflow-stage-started', handleWorkflowStageStarted);
      socketService.off('workflow-stage-completed', handleWorkflowStageCompleted);
      socketService.off('workflow-stage-failed', handleWorkflowStageFailed);
      socketService.off('workflow-completed', handleWorkflowCompleted);
      socketService.off('workflow-failed', handleWorkflowFailed);

      if (workflowId) {
        socketService.leaveWorkflow(workflowId);
      }
    };
  }, [
    workflowId,
    handleWorkflowStarted,
    handleWorkflowProgress,
    handleWorkflowStageStarted,
    handleWorkflowStageCompleted,
    handleWorkflowStageFailed,
    handleWorkflowCompleted,
    handleWorkflowFailed,
  ]);
}

export function useAgentUpdates() {
  const queryClient = useQueryClient();

  const handleAgentProcessingStarted = useCallback((data: Parameters<SocketEvents['agent-processing-started']>[0]) => {
    queryClient.invalidateQueries(['agents']);
    toast.info(`${data.agentType.replace('-', ' ')} started processing case ${data.caseId.slice(-8)}`);
  }, [queryClient]);

  const handleAgentProcessingCompleted = useCallback((data: Parameters<SocketEvents['agent-processing-completed']>[0]) => {
    queryClient.invalidateQueries(['agents']);
    toast.success(`${data.agentType.replace('-', ' ')} completed processing (${data.processingTime}ms)`);
  }, [queryClient]);

  const handleAgentProcessingFailed = useCallback((data: Parameters<SocketEvents['agent-processing-failed']>[0]) => {
    queryClient.invalidateQueries(['agents']);
    toast.error(`${data.agentType.replace('-', ' ')} failed: ${data.error}`);
  }, [queryClient]);

  const handleAgentProgressUpdate = useCallback((data: Parameters<SocketEvents['agent-progress-update']>[0]) => {
    // Optionally show progress updates as info toasts
    // toast.info(`${data.agentType}: ${data.message}`);
  }, []);

  useEffect(() => {
    socketService.connect();

    socketService.on('agent-processing-started', handleAgentProcessingStarted);
    socketService.on('agent-processing-completed', handleAgentProcessingCompleted);
    socketService.on('agent-processing-failed', handleAgentProcessingFailed);
    socketService.on('agent-progress-update', handleAgentProgressUpdate);

    return () => {
      socketService.off('agent-processing-started', handleAgentProcessingStarted);
      socketService.off('agent-processing-completed', handleAgentProcessingCompleted);
      socketService.off('agent-processing-failed', handleAgentProcessingFailed);
      socketService.off('agent-progress-update', handleAgentProgressUpdate);
    };
  }, [
    handleAgentProcessingStarted,
    handleAgentProcessingCompleted,
    handleAgentProcessingFailed,
    handleAgentProgressUpdate,
  ]);
}

export function useCaseUpdates(caseId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (caseId) {
      socketService.joinCase(caseId);

      return () => {
        socketService.leaveCase(caseId);
      };
    }
  }, [caseId]);

  // Case-specific real-time updates can be added here
  // as the backend expands to include case-specific events
}

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = React.useState(socketService.isConnected());

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}