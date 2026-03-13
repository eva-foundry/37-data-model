/**
 * useSupportTicketsData — API-layer data hook for SupportTicketsPage (WI-14)
 *
 * Provides tickets[], isLoading, error, filters, updateTicket() for
 * direct use with AdminListPage<SupportTicket>.
 *
 * Backend: BackendApiClient.getSupportTickets() — mock via MockBackendService (USE_MOCK=true).
 * Real endpoints (future):
 *   GET   /v1/admin/support/tickets
 *   PATCH /v1/admin/support/tickets/{ticketId}
 */
import { useState, useCallback, useEffect } from 'react';
import { BackendApiClient } from '@services/BackendApiClient';

// ---------------------------------------------------------------------------
// Entity types
// ---------------------------------------------------------------------------

export type TicketStatus = 'open' | 'in-progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  ticketId: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  assignedTo: string;
}

export interface SupportTicketFilter {
  key: string;
  label: string;
  type: 'select';
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface UseSupportTicketsDataReturn {
  items: SupportTicket[];
  isLoading: boolean;
  error: string | null;
  filters: SupportTicketFilter[];
  load: () => Promise<void>;
  updateTicket: (ticketId: string, patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo'>>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useSupportTicketsData = (): UseSupportTicketsDataReturn => {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await BackendApiClient.getSupportTickets({ status: statusFilter, priority: priorityFilter });
      setItems(response.tickets as SupportTicket[]);
    } catch {
      setError('admin.supportTickets.error.fetch');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const updateTicket = useCallback(async (
    ticketId: string,
    patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assignedTo'>>,
  ) => {
    try {
      await BackendApiClient.updateSupportTicket(ticketId, patch);
      setItems((prev) =>
        prev.map((t) => (t.ticketId === ticketId ? { ...t, ...patch } : t)),
      );
    } catch {
      setError('admin.supportTickets.error.update');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filters: SupportTicketFilter[] = [
    {
      key: 'status',
      label: 'admin.supportTickets.filter.status',
      type: 'select',
      value: statusFilter,
      options: [
        { value: '',            label: 'admin.supportTickets.filter.status.all'         },
        { value: 'open',        label: 'admin.supportTickets.filter.status.open'        },
        { value: 'in-progress', label: 'admin.supportTickets.filter.status.inProgress'  },
        { value: 'resolved',    label: 'admin.supportTickets.filter.status.resolved'    },
      ],
      onChange: setStatusFilter,
    },
    {
      key: 'priority',
      label: 'admin.supportTickets.filter.priority',
      type: 'select',
      value: priorityFilter,
      options: [
        { value: '',       label: 'admin.supportTickets.filter.priority.all'    },
        { value: 'high',   label: 'admin.supportTickets.filter.priority.high'   },
        { value: 'medium', label: 'admin.supportTickets.filter.priority.medium' },
        { value: 'low',    label: 'admin.supportTickets.filter.priority.low'    },
      ],
      onChange: setPriorityFilter,
    },
  ];

  return { items, isLoading, error, filters, load, updateTicket };
};
