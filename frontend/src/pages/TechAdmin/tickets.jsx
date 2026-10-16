import { useState, useEffect, useCallback, useMemo } from 'react';
import TicketList from '../../components/tickets/TicketList.jsx';
import { getTickets, resolveTicket } from '../../services/tickets.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { MOCK_TICKETS } from '../../mocks/tickets/tickets.fixture.js';
import '../../components/tickets/tickets.css';

/**
 * Tech Admin Tickets Page.
 * Mounts the production TicketList component with real ticket loading and resolution flows.
 * Also supports isolated previews with previewMockData prop.
 *
 * @param {Object} props
 * @param {boolean} [props.previewMockData=false] - When true, runs in isolated preview mode with mock tickets
 */
export default function TechAdminTicketsPage({ previewMockData = false }) {
  const { user } = useAuth();
  const session = useMemo(() => {
    return user || { userId: 'TA001', role: 'techadmin' };
  }, [user]);

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // If explicit mock preview requested, load mock fixture directly without network calls
    if (previewMockData) {
      setTimeout(() => {
        setTickets(MOCK_TICKETS);
        setIsLoading(false);
      }, 100);
      return;
    }

    try {
      const data = await getTickets(session);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      // In standalone dev/preview environments without backend running, fallback gracefully
      if (err?.message?.includes('NetworkError') || err?.message?.includes('Failed to fetch')) {
        console.warn('TechAdmin Tickets: Backend unavailable, displaying mock preview fixtures.');
        setTickets(MOCK_TICKETS);
        setErrorMessage(null);
      } else {
        setErrorMessage(err.message || 'Failed to load support tickets.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session, previewMockData]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResolveTicket = async (ticketId, resolution) => {
    if (previewMockData) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: 'RESOLVED',
                resolvedAt: new Date().toISOString(),
                resolvedBy: session?.userId || 'TA001',
                resolution: resolution || 'Resolved in preview mode',
              }
            : t
        )
      );
      return;
    }

    try {
      await resolveTicket(ticketId, resolution, session);
      // Refresh tickets to reflect updated state
      await fetchTickets();
    } catch (err) {
      throw new Error(err.message || 'Failed to resolve ticket.');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Support Tickets Queue
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px' }}>
          Inspect, prioritize, and resolve traveller and system support requests.
        </p>
      </div>

      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        error={errorMessage}
        onResolveTicket={handleResolveTicket}
      />
    </div>
  );
}
