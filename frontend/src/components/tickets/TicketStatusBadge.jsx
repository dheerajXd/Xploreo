import './tickets.css';

/**
 * Reusable Status Pill for Support Tickets.
 * Maps strictly to backend TicketStatus: 'OPEN' and 'RESOLVED'.
 * 
 * @param {Object} props
 * @param {string} props.status - 'OPEN' | 'RESOLVED'
 * @param {string} [props.className] - Optional extra class
 */
export default function TicketStatusBadge({ status, className = '' }) {
  const normStatus = String(status || '').toUpperCase();

  if (normStatus === 'OPEN') {
    return (
      <span className={`ticket-badge ticket-badge-open ${className}`}>
        <span className="ticket-badge-dot" />
        Open
      </span>
    );
  }

  if (normStatus === 'RESOLVED') {
    return (
      <span className={`ticket-badge ticket-badge-resolved ${className}`}>
        <span className="ticket-badge-dot" />
        Resolved
      </span>
    );
  }

  return (
    <span className={`ticket-badge ticket-badge-unknown ${className}`}>
      <span className="ticket-badge-dot" />
      {status || 'Unknown'}
    </span>
  );
}
