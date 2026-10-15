import { useState } from 'react';
import TicketStatusBadge from './TicketStatusBadge.jsx';
import './tickets.css';

/**
 * Ticket Details Modal / Drawer Component.
 * Displays comprehensive ticket details:
 * - Ticket ID and creation timestamp
 * - Traveller details (name / ID)
 * - Full subject and description
 * - Category, priority, and status
 * - Resolution workflow for OPEN tickets with optional notes (max 800 chars)
 * - Read-only resolution audit for RESOLVED tickets
 * 
 * @param {Object} props
 * @param {Object|null} props.ticket - Active ticket record
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Modal close handler
 * @param {Function} [props.onResolve] - async (ticketId, resolution) => Promise<void>
 */
export default function TicketDetailsModal({
  ticket,
  isOpen,
  onClose,
  onResolve,
  allowResolve = true,
}) {
  const [isResolvingFormOpen, setIsResolvingFormOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !ticket) return null;

  const isTicketOpen = String(ticket.status || '').toUpperCase() === 'OPEN';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleString();
    } catch {
      return String(dateStr);
    }
  };

  const handleOpenResolveDialog = () => {
    setIsResolvingFormOpen(true);
    setResolutionText('');
    setError(null);
  };

  const handleCancelResolveDialog = () => {
    setIsResolvingFormOpen(false);
    setResolutionText('');
    setError(null);
  };

  const handleConfirmResolve = async () => {
    if (!onResolve) return;

    const trimmed = resolutionText.trim();
    if (trimmed.length > 800) {
      setError('Resolution notes cannot exceed 800 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onResolve(ticket.id, trimmed);
      setIsResolvingFormOpen(false);
      setResolutionText('');
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityClass =
    ticket.priority === 'HIGH'
      ? 'ticket-priority-high'
      : ticket.priority === 'LOW'
      ? 'ticket-priority-low'
      : 'ticket-priority-medium';

  return (
    <div className="admin-ticket-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title">
      <div className="admin-ticket-modal-card">
        {/* Modal Header */}
        <div className="admin-ticket-modal-header">
          <div>
            <div className="admin-ticket-modal-eyebrow">
              <span>Support Ticket Details</span>
              <span className="admin-ticket-modal-id">#{ticket.id}</span>
            </div>
            <h2 id="ticket-modal-title" className="admin-ticket-modal-title">
              {ticket.subject}
            </h2>
          </div>
          <button
            type="button"
            className="admin-ticket-modal-close-btn"
            onClick={onClose}
            aria-label="Close ticket details"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-ticket-modal-body">
          {/* Status & Metadata Bar */}
          <div className="admin-ticket-modal-meta-grid">
            <div className="admin-ticket-modal-meta-item">
              <span className="admin-ticket-modal-meta-label">Status</span>
              <div>
                <TicketStatusBadge status={ticket.status} />
              </div>
            </div>

            <div className="admin-ticket-modal-meta-item">
              <span className="admin-ticket-modal-meta-label">Priority</span>
              <span className={`admin-ticket-modal-meta-val ${priorityClass}`}>
                ● {ticket.priority || 'MEDIUM'}
              </span>
            </div>

            <div className="admin-ticket-modal-meta-item">
              <span className="admin-ticket-modal-meta-label">Category</span>
              <span className="admin-ticket-modal-meta-val">
                {ticket.category || 'General'}
              </span>
            </div>

            <div className="admin-ticket-modal-meta-item">
              <span className="admin-ticket-modal-meta-label">Created</span>
              <span className="admin-ticket-modal-meta-val">
                {formatDate(ticket.createdAt)}
              </span>
            </div>
          </div>

          {/* Traveller Info Section */}
          <div className="admin-ticket-modal-section">
            <h3 className="admin-ticket-modal-section-title">Traveller Information</h3>
            <div className="admin-ticket-modal-traveller-box">
              <div className="admin-ticket-modal-avatar" aria-hidden="true">
                {(ticket.travellerName || ticket.travellerId || 'T').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#0f172a' }}>
                  {ticket.travellerName || ticket.travellerId || 'Traveller'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  User ID: {ticket.travellerId || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Full Description Section */}
          <div className="admin-ticket-modal-section">
            <h3 className="admin-ticket-modal-section-title">Detailed Description</h3>
            <div className="admin-ticket-modal-desc-box">
              {ticket.message}
            </div>
          </div>

          {/* Resolution Audit (If Resolved) */}
          {ticket.resolution && (
            <div className="admin-ticket-modal-section">
              <h3 className="admin-ticket-modal-section-title">Resolution Record</h3>
              <div className="admin-ticket-modal-resolution-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '600', marginBottom: '6px' }}>
                  <span>✓</span> Resolved on {formatDate(ticket.resolvedAt)}
                  {ticket.resolvedBy && ` by ${ticket.resolvedBy}`}
                </div>
                <div style={{ color: '#14532d', fontSize: '13px', lineHeight: '1.5' }}>
                  {ticket.resolution}
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="admin-ticket-alert-error" role="alert" style={{ marginTop: '12px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Inline Resolution Form for Open Tickets */}
          {allowResolve && isResolvingFormOpen && (
            <div className="admin-ticket-modal-resolve-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="ticket-resolve-notes" style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                  Resolution Notes (Optional, max 800 characters)
                </label>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {resolutionText.length}/800
                </span>
              </div>
              <textarea
                id="ticket-resolve-notes"
                className="admin-ticket-textarea"
                style={{ minHeight: '80px', marginTop: '6px' }}
                placeholder="State the actions taken, booking reference details, or refund transaction ID..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                maxLength={800}
                disabled={isSubmitting}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="admin-ticket-modal-btn-secondary"
                  onClick={handleCancelResolveDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-ticket-modal-btn-primary"
                  onClick={handleConfirmResolve}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="admin-ticket-modal-footer">
          <button
            type="button"
            className="admin-ticket-modal-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          {isTicketOpen && !isResolvingFormOpen && allowResolve && typeof onResolve === 'function' && (
            <button
              type="button"
              className="admin-ticket-modal-btn-primary"
              onClick={handleOpenResolveDialog}
            >
              Resolve Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
