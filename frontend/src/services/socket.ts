import { io, Socket } from 'socket.io-client';
import { WorkflowState, Agent } from '@/types';

export interface SocketEvents {
  'workflow-started': (data: { workflowId: string; caseId: string; state: WorkflowState }) => void;
  'workflow-progress': (data: { workflowId: string; caseId: string; progress: number; currentStage: string; state: WorkflowState }) => void;
  'workflow-stage-started': (data: { workflowId: string; caseId: string; stage: string; state: WorkflowState }) => void;
  'workflow-stage-completed': (data: { workflowId: string; caseId: string; stage: string; duration: number; state: WorkflowState }) => void;
  'workflow-stage-failed': (data: { workflowId: string; caseId: string; stage: string; error: string; state: WorkflowState }) => void;
  'workflow-completed': (data: { workflowId: string; caseId: string; state: WorkflowState; finalCase: any }) => void;
  'workflow-failed': (data: { workflowId: string; caseId: string; error: string; state: WorkflowState }) => void;
  'workflow-paused': (data: { workflowId: string; caseId: string; state: WorkflowState }) => void;
  'workflow-cancelled': (data: { workflowId: string; caseId: string; state: WorkflowState }) => void;
  'agent-processing-started': (data: { agentType: string; agentId: string; caseId: string; timestamp: Date }) => void;
  'agent-processing-completed': (data: { agentType: string; agentId: string; caseId: string; processingTime: number; log: any; timestamp: Date }) => void;
  'agent-processing-failed': (data: { agentType: string; agentId: string; caseId: string; error: string; timestamp: Date }) => void;
  'agent-progress-update': (data: { agentType: string; agentId: string; caseId: string; message: string; details?: any; timestamp: Date }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      retries: 3,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Register all event listeners
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        this.socket?.on(event, listener);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)!.push(callback);

    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  joinCase(caseId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-case', caseId);
    }
  }

  leaveCase(caseId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-case', caseId);
    }
  }

  joinWorkflow(workflowId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-workflow', workflowId);
    }
  }

  leaveWorkflow(workflowId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-workflow', workflowId);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();

export default socketService;