// Support tickets for hotel partners: raise a ticket (resolved by the tech admin) and track its status.
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/foundation';
import { TicketCreateForm, TicketList } from '@/components/tickets/index.js';
import { getTickets } from '@/services/tickets.api.js';
import HotelPage, { PageHeader } from '@/components/hotel/HotelPage.jsx';

export default function HotelSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load your support tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreated = (ticket) => {
    setNotice(`Ticket #${String(ticket?.id || '').substring(0, 8)} submitted. Our technical admin team has been notified.`);
    load();
  };

  return (
    <HotelPage title="Support">
      <PageHeader title="Support" subtitle="Raise a ticket and track its resolution by the Xploreo technical team" />
      {notice && <div className="hotel-content-card" role="status"><p className="hotel-sub-text">{notice}</p></div>}
      <section className="hotel-content-card">
        <TicketCreateForm currentUser={user} onSubmitSuccess={onCreated} />
      </section>
      <section className="hotel-content-card">
        <TicketList tickets={tickets} isLoading={loading} error={error} />
      </section>
    </HotelPage>
  );
}
