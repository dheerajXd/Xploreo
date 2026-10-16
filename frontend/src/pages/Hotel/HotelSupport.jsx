import { useState, useEffect, useCallback, useMemo } from 'react';
import { TicketCreateForm, TicketList } from '../../components/tickets/index.js';
import { getTickets } from '../../services/tickets.api.js';
import { useAuth } from '@/foundation';
import '../Traveller/travellerSupportTickets.css';

/**
 * HotelSupport
 *
 * Dedicated Hotel Partner Support & Inquiries desk.
 * Reuses the existing Phase 1 Ticket components (TicketCreateForm, TicketList)
 * while providing hotel-specific copy, context, and issue categories without duplicating ticket logic.
 */
export default function HotelSupport() {
  const { user } = useAuth();

  const hotelSession = useMemo(() => {
    return (
      user || {
        name: 'The Grand Heritage Resort',
        username: 'hotel_grandheritage',
        role: 'hotel',
        userId: 'HP1001',
      }
    );
  }, [user]);

  const [activeTab, setActiveTab] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTickets(hotelSession);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load your hotel support tickets.');
    } finally {
      setIsLoading(false);
    }
  }, [hotelSession]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleTicketSubmitted = (createdTicket) => {
    setNotification({
      type: 'success',
      message: `Ticket #${createdTicket?.id?.substring(0, 8) || 'new'} submitted successfully! The Xploreo operations desk will review your inquiry.`,
    });
    fetchTickets();
    setActiveTab('list');
  };

  return (
    <div className="trav-tickets-page-wrapper" data-testid="hotel-support-page">
      <main className="trav-tickets-page">
        {/* Hotel-Specific Header */}
        <header className="trav-tickets-header">
          <div className="trav-tickets-header-text">
            <div className="trav-tickets-eyebrow">
              <span className="trav-tickets-eyebrow-dot" style={{ background: '#7c3aed' }} />
              Hotel Partner Operations
            </div>
            <h1 className="trav-tickets-title">Hotel Partner Support</h1>
            <p className="trav-tickets-subtitle">
              Submit operational inquiries, report room inventory or guest check-in discrepancies, or track resolution from the Xploreo operations desk.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="trav-tickets-tabs" role="tablist" aria-label="Hotel Support Tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'list'}
              className={`trav-tickets-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
              data-testid="tab-hotel-tickets"
            >
              <span>Partner Tickets</span>
              <span className="trav-tickets-tab-badge">{tickets.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'create'}
              className={`trav-tickets-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
              data-testid="tab-create-hotel-ticket"
            >
              <span>+ New Support Request</span>
            </button>
          </div>
        </header>

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`trav-tickets-banner trav-tickets-banner-${notification.type}`}
            role="status"
          >
            <span>{notification.message}</span>
            <button
              type="button"
              className="trav-tickets-banner-close"
              onClick={() => setNotification(null)}
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Partner Tickets Queue */}
        {activeTab === 'list' && (
          <section aria-labelledby="partner-tickets-queue">
            <TicketList
              tickets={tickets}
              isLoading={isLoading}
              error={error}
              allowResolve={false}
            />
          </section>
        )}

        {/* Tab 2: Submit a Support Request */}
        {activeTab === 'create' && (
          <section aria-labelledby="create-hotel-ticket-form">
            <TicketCreateForm
              currentUser={hotelSession}
              onTicketCreated={handleTicketSubmitted}
              onCancel={() => setActiveTab('list')}
            />
          </section>
        )}
      </main>
    </div>
  );
}
