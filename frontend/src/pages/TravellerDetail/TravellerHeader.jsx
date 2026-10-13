import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TravellerHeader({ backTo, backLabel = 'Back', title }) {
  const navigate = useNavigate();

  const handleBack = (e) => {
    if (backTo) return; // Will follow Link to
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/hotels');
    }
  };

  return (
    <header className="trav-header" role="banner">
      <div className="trav-header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/hotels" className="trav-brand">
            <span className="trav-brand-badge">X</span>
            <span>Xploreo</span>
          </Link>
          {title && (
            <span style={{ fontSize: '0.95rem', color: 'var(--trav-text-muted)', fontWeight: 600 }}>
              / {title}
            </span>
          )}
        </div>

        <nav className="trav-nav-links" aria-label="Traveller Navigation">
          {backTo ? (
            <Link to={backTo} className="trav-back-btn">
              ← {backLabel}
            </Link>
          ) : (
            <button type="button" onClick={handleBack} className="trav-back-btn">
              ← {backLabel}
            </button>
          )}
          <Link to="/reviews/new" className="trav-nav-link">
            Write Review
          </Link>
        </nav>
      </div>
    </header>
  );
}
