import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Dashboard from '@/pages/Dashboard';
import { mockApiService } from '../mocks/api';

// Mock the WebSocket hooks
vi.mock('@/hooks/useWebSocket', () => ({
  useWorkflowUpdates: vi.fn(),
  useAgentUpdates: vi.fn(),
  useCaseUpdates: vi.fn()
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard welcome message', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Shirts Legal Workflow')).toBeInTheDocument();
    });
  });

  it('displays the New Case button', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      const newCaseButtons = screen.getAllByText('New Case');
      expect(newCaseButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows loading spinner initially', () => {
    // Mock the API to delay response
    mockApiService.casesAPI.getAll.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays stats cards when data loads', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Cases')).toBeInTheDocument();
      expect(screen.getByText('Active Cases')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('Completed Cases')).toBeInTheDocument();
    });
  });

  it('shows workflow status section', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Active Workflows')).toBeInTheDocument();
    });
  });

  it('displays agent status section', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Agent Status')).toBeInTheDocument();
    });
  });

  it('shows recent cases table', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Cases')).toBeInTheDocument();
      expect(screen.getByText('Case Title')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('displays quick action cards', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Create New Case')).toBeInTheDocument();
      expect(screen.getByText('Monitor Workflows')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });

  it('shows case data when available', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Doe v. TechCorp')).toBeInTheDocument();
    });
  });

  it('handles empty workflow state', async () => {
    // Mock empty workflows response
    mockApiService.workflowsAPI.getAll.mockResolvedValueOnce({
      success: true,
      data: [],
      timestamp: new Date(),
      requestId: 'test'
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No active workflows')).toBeInTheDocument();
    });
  });

  it('handles empty cases state', async () => {
    // Mock empty cases response
    mockApiService.casesAPI.getAll.mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date(),
      requestId: 'test'
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No cases found')).toBeInTheDocument();
    });
  });

  it('displays agent health information', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Legal Intake Agent')).toBeInTheDocument();
    });
  });

  it('shows proper links to other pages', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      const viewAllLinks = screen.getAllByText(/view all/i);
      expect(viewAllLinks.length).toBeGreaterThan(0);
    });
  });
});