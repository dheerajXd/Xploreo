import { useState, useEffect, useCallback, useMemo } from 'react';
import TicketList from '../../components/tickets/TicketList.jsx';
import { getTickets, resolveTicket } from '../../services/tickets.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../components/tickets/tickets.css';

/**
 * Tech Admin Tickets Page.
 * Mounts the production TicketList component with real ticket loading and resolution flows.
 */
export default function TechAdminTicketsPage() {
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
    try {
      const data = await getTickets(session);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load support tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResolveTicket = async (ticketId, resolution) => {
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
