// Shared shell for the hotel portal pages. Mirrors the original hotels/*.html:
//   <div id="navbar"> + <main id="main" class="dashboard-wrapper"> (the CSS reserves the space under the fixed navbar).
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';

export default function HotelPage({ title, children }) {
  usePageStyles(HOTEL_PAGE_CSS, 'hotel-bg-light', title);
  return (
    <main id="main" className="dashboard-wrapper">
      {children}
    </main>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className={`hotel-page-header${children ? ' hotel-flex-header' : ''}`}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// Loading / error block shown instead of a page body.
export function LoadState({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="hotel-content-card" role="status">
        <p className="hotel-sub-text">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="hotel-content-card" role="alert">
        <h2>{error.status === 403 ? 'Access restricted' : 'Unable to load data'}</h2>
        <p className="hotel-sub-text">{error.message || 'Something went wrong.'}</p>
        <button type="button" className="btn-blue" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return children;
}

export function EmptyState({ title, text }) {
  return (
    <div className="hotel-content-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
      <h2>{title}</h2>
      <p className="hotel-sub-text">{text}</p>
    </div>
  );
}

// Overlay + box in the original modal markup. Clicking the backdrop closes it.
export function HotelModal({ title, onClose, children, footer }) {
  return (
    <div className="hotel-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hotel-modal-box" role="dialog" aria-modal="true" aria-label={title}>
        <div className="hotel-modal-header">
          <h2>{title}</h2>
          <span className="close-btn" role="button" tabIndex={0} onClick={onClose} onKeyDown={(e) => e.key === 'Enter' && onClose()}>✕</span>
        </div>
        <div className="hotel-modal-body">{children}</div>
        {footer ? <div className="hotel-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
