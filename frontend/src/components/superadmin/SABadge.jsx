import './superadmin.css';

/**
 * SuperAdmin Reusable Status Badge.
 * Normalized status mapping across all 4 SA domains:
 * - Accounts: Active, Inactive, Restricted, Suspended
 * - Trips: Confirmed, Started, Ongoing, Completed, Draft, Cancelled
 * - Refunds: Pending, Approved, Rejected
 * - Disputes: Open, Under Review, Resolved
 * - Finance: Paid, Settled, Pending, Failed
 * 
 * @param {Object} props
 * @param {string} props.status - Status text
 * @param {'success'|'info'|'warning'|'danger'|'neutral'|'purple'} [props.variant] - Optional forced variant
 * @param {string} [props.className] - Additional classes
 */
export default function SABadge({ status, variant = null, className = '' }) {
  const norm = String(status || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

  let badgeVariant;
  let displayLabel = status || 'Unknown';

  if (variant) {
    badgeVariant = variant;
  } else {
    // Map normalized strings to design variants
    switch (norm) {
      // Success states
      case 'active':
      case 'confirmed':
      case 'completed':
      case 'approved':
      case 'resolved':
      case 'paid':
      case 'settled':
        badgeVariant = 'success';
        break;

      // Info states
      case 'ongoing':
      case 'started':
        badgeVariant = 'info';
        break;

      // Warning states
      case 'pending':
      case 'underreview':
      case 'inprogress':
      case 'review':
        badgeVariant = 'warning';
        break;

      // Danger / Restricted states
      case 'restricted':
      case 'suspended':
      case 'rejected':
      case 'failed':
      case 'cancelled':
      case 'open':
        badgeVariant = 'danger';
        break;

      // Neutral states
      case 'inactive':
      case 'draft':
        badgeVariant = 'neutral';
        break;

      default:
        badgeVariant = 'neutral';
        break;
    }
  }

  // Format label cleanly if needed
  if (norm === 'underreview') displayLabel = 'Under Review';
  else if (norm === 'inprogress') displayLabel = 'In Progress';

  return (
    <span className={`sa-badge sa-badge-${badgeVariant} ${className}`}>
      <span className="sa-badge-dot" />
      <span>{displayLabel}</span>
    </span>
  );
}
