import { useState } from 'react';
import { useAuth } from '@/foundation';
import { useAsyncData } from '@/hooks/useAsyncData.js';
import { createTicket, listMyTickets } from '@/services/guide.api.js';
import './guideSupport.css';

const FAQS = [
  ['How do I report a technical bug or system error?', "Fill out the support ticket form above selecting 'Technical Issue' as the category. Describe the steps to reproduce the error and our Technical Admin team will investigate and resolve it."],
  ['How long does it take for support tickets to be resolved?', 'Our Technical Admin team reviews urgent/high-priority tickets within 2 hours and standard requests within 24 hours. You can track real-time resolution notes directly on this page.'],
  ['How can I update my booking or tour schedule?', "You can manage bookings directly from your Dashboard or Tours tabs. If you encounter an error with date modifications or sync issues, submit a ticket under 'Tours & Bookings'."],
  ['How do partner payouts and billing settlements work?', "Payouts are automatically calculated and processed through the earnings ledger. For discrepancies or payout delays, submit a ticket under 'Payment Issue'."],
];
const CATEGORIES = ['Technical Issue', 'Booking & Reservations', 'Payment & Payouts', 'Account Settings', 'Tours & Experiences', 'General Inquiry'];

const when = (value) => {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
};

const Chevron = () => (
  <svg className="gd-chevron" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
);

export default function GuideSupport() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsyncData(listMyTickets);
  const [form, setForm] = useState({ subject: '', category: CATEGORIES[0], message: '' });
  const [alert, setAlert] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  const tickets = [...(data ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const set = (name) => (event) => setForm((f) => ({ ...f, [name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setAlert(null);
    setFieldErrors({});
    const body = { subject: form.subject.trim(), category: form.category, message: form.message.trim() };
    if (!body.subject || !body.message) {
      setAlert({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const ticket = await createTicket(body);
      setForm({ subject: '', category: CATEGORIES[0], message: '' });
      setAlert({ text: `Ticket ${ticket.id || ''} submitted successfully! Technical admin has been notified.`, type: 'success' });
      reload();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      setAlert({ text: err.message || 'Failed to submit ticket. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gd-page-wrapper">
      <main className="gd-page">
        <header className="gd-header">
          <div className="gd-header-text">
            <span className="gd-eyebrow">Guide Portal</span>
            <h1 className="gd-title">Support &amp; Help Center</h1>
            <p className="gd-subtitle">Submit support requests, report bugs, and track technical issue resolutions.</p>
          </div>
          <span className="gd-header-badge">{user.name} · Guide</span>
        </header>

        <div className="gd-support-grid">
          <div className="gd-support-main">
            <section className="gd-card">
              <h3 className="gd-section-title">Create Support Ticket</h3>
              <span className="gd-section-desc">Describe your issue or inquiry and the Technical Admin team will review and resolve it.</span>
              {alert ? <div className={`gd-alert ${alert.type}`} role={alert.type === 'error' ? 'alert' : 'status'}>{alert.text}</div> : null}
              <form onSubmit={submit} noValidate>
                <div className="gd-form-group">
                  <label htmlFor="ticket-subject">Subject</label>
                  <input id="ticket-subject" type="text" className="gd-input" maxLength={140} required value={form.subject} onChange={set('subject')} placeholder="Brief summary of the issue (e.g., Booking sync failure, Payout query)" />
                  {fieldErrors.subject ? <small style={{ color: '#dc2626' }}>{fieldErrors.subject}</small> : null}
                </div>
                <div className="gd-form-row">
                  <div className="gd-form-group">
                    <label htmlFor="ticket-category">Category</label>
                    <select id="ticket-category" className="gd-select" value={form.category} onChange={set('category')}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="gd-form-group">
                  <label htmlFor="ticket-message">Detailed Message</label>
                  <textarea id="ticket-message" className="gd-input" minLength={10} maxLength={1200} required value={form.message} onChange={set('message')} placeholder="Please provide exact details, error messages, or relevant booking/tour IDs..." />
                  {fieldErrors.message ? <small style={{ color: '#dc2626' }}>{fieldErrors.message}</small> : null}
                </div>
                <button type="submit" className="gd-btn gd-btn-primary" disabled={saving}>
                  {saving ? 'Submitting Ticket…' : 'Submit Ticket to Technical Admin'}
                </button>
              </form>
            </section>

            <section className="gd-card">
              <div className="gd-section-header" style={{ marginBottom: '1rem' }}>
                <div>
                  <h3 className="gd-section-title" style={{ marginBottom: 2 }}>Your Support Tickets</h3>
                  <p className="gd-section-desc" style={{ margin: 0 }}>Track status and view resolutions provided by Technical Admin</p>
                </div>
                <span className="gd-header-badge">{tickets.length} Ticket{tickets.length === 1 ? '' : 's'}</span>
              </div>

              {!data && loading ? <p className="gd-section-desc">Loading your tickets…</p> : null}

              {error ? (
                <div className="gd-state-error" role="alert">
                  <div className="gd-state-icon">⚠️</div>
                  <h3 className="gd-state-title">Unable to load tickets</h3>
                  <p className="gd-state-text">{error.message}</p>
                  {error.status !== 403 ? <button type="button" className="gd-btn-retry" onClick={reload}>Try Again</button> : null}
                </div>
              ) : null}

              {data && tickets.length === 0 ? (
                <div className="gd-empty">
                  <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>No support tickets raised yet</p>
                  <p style={{ margin: '0.35rem 0 0 0' }}>Have a question or running into a technical issue? Submit a ticket using the form above.</p>
                </div>
              ) : null}

              <div className="gd-ticket-list">
                {tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
              </div>
            </section>

            <section className="gd-card">
              <h3 className="gd-section-title">Frequently Asked Questions</h3>
              <span className="gd-section-desc">Quick solutions to common questions across the platform</span>
              <div className="gd-faq-list">
                {FAQS.map(([question, answer], i) => (
                  <div className={`gd-faq-item${openFaq === i ? ' active' : ''}`} key={question}>
                    <button type="button" className="gd-faq-question" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                      <span>{question}</span>
                      <Chevron />
                    </button>
                    <div className="gd-faq-answer">{answer}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="gd-support-sidebar">
            <div className="gd-sidebar-card gd-response-card">
              <div className="gd-time-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <span className="gd-time-val">&lt; 24 Hours</span>
                <span className="gd-time-desc">Average Technical Support resolution turnaround</span>
              </div>
            </div>

            <div className="gd-sidebar-card">
              <h3 className="gd-section-title" style={{ fontSize: '1.05rem' }}>Direct Support Channels</h3>
              <div className="gd-contact-item">
                <div className="gd-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>
                <div className="gd-contact-info">
                  <span className="gd-contact-label">Technical Desk Email</span>
                  <span className="gd-contact-value">support@xploreo.com</span>
                  <span className="gd-contact-meta">Direct dispatch to Tech Admin</span>
                </div>
              </div>
              <div className="gd-contact-item">
                <div className="gd-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </div>
                <div className="gd-contact-info">
                  <span className="gd-contact-label">Urgent Partner Helpline</span>
                  <span className="gd-contact-value">+91 1800 123 9756</span>
                  <span className="gd-contact-meta">Mon-Sat, 9AM - 8PM IST</span>
                </div>
              </div>
            </div>

            <div className="gd-sidebar-card">
              <h3 className="gd-section-title" style={{ fontSize: '1.05rem' }}>Quick Resources</h3>
              <div className="gd-quick-links">
                {['Platform Guidelines & SLA', 'System Health & Status', 'Security & Privacy Policies'].map((label) => (
                  <a href="#" className="gd-quick-link" key={label} onClick={(e) => e.preventDefault()}>
                    <span>{label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketCard({ ticket: t }) {
  const resolved = String(t.status).toUpperCase() === 'RESOLVED';
  const priority = String(t.priority || 'MEDIUM');
  return (
    <div className="gd-ticket-card">
      <div className="gd-ticket-top">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="gd-ticket-id">{t.id || '#ticket'}</span>
            <span className={`gd-priority-tag ${priority.toLowerCase()}`}>{priority.toUpperCase()}</span>
          </div>
          <span className="gd-ticket-title">{t.subject}</span>
          <div className="gd-ticket-meta">
            <span>{t.category || 'General'}</span>
            <span>•</span>
            <span>Created {when(t.createdAt)}</span>
          </div>
        </div>
        <span className={`gd-status-pill ${resolved ? 'resolved' : 'open'}`}>{resolved ? '✓ Resolved' : '● Open'}</span>
      </div>
      <div className="gd-ticket-message">{t.message || t.description || ''}</div>
      {resolved ? (
        <div className="gd-ticket-resolution-box">
          <div className="gd-ticket-resolution-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            <span>Resolution from Technical Support Admin:</span>
          </div>
          <p className="gd-ticket-resolution-text">{t.resolution || 'Issue resolved by technical admin.'}</p>
          <div className="gd-ticket-resolution-meta">
            Resolved on {when(t.resolvedAt || t.createdAt)} {t.resolvedBy ? `by ${t.resolvedBy}` : ''}
          </div>
        </div>
      ) : null}
    </div>
  );
}
