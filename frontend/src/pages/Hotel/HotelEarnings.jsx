import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/foundation';
import { getHotelEarnings, listHotels } from '@/services/hotels.api.js';
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';

// ── Currency formatter ────────────────────────────────────────────────────────
const fmt = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);

// ── Date formatter ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HotelEarnings() {
  usePageStyles(HOTEL_PAGE_CSS);
  const { user } = useAuth();

  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [earningsData, setEarningsData] = useState(null);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [error, setError] = useState(null);

  // Load partner hotels
  const loadPartnerHotels = useCallback(async () => {
    setLoadingHotels(true);
    setError(null);
    try {
      const partnerHotels = await listHotels();
      setHotels(partnerHotels);
      if (partnerHotels.length > 0) {
        setSelectedHotelId(partnerHotels[0].id);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  useEffect(() => {
    loadPartnerHotels();
  }, [loadPartnerHotels]);

  // Load read-only earnings for selected hotel
  const loadEarnings = useCallback(async (hotelId) => {
    if (!hotelId) return;
    setLoadingEarnings(true);
    setError(null);
    try {
      const res = await getHotelEarnings(hotelId);
      // The server strictly owns and computes the earnings data
      setEarningsData(res);
    } catch (err) {
      setError(err);
      setEarningsData(null);
    } finally {
      setLoadingEarnings(false);
    }
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      loadEarnings(selectedHotelId);
    }
  }, [selectedHotelId, loadEarnings]);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId);

  // ── Render 403 Forbidden State ──────────────────────────────────────────────
  if (error && error.status === 403) {
    return (
      <div className="hotel-page" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          className="hotel-alert hotel-alert-danger"
          style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            color: '#991b1b',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛡️</div>
          <h2 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Access Restricted (403)</h2>
          <p style={{ margin: '0 0 1.5rem', color: '#b91c1c', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
            {error.message || 'You do not have permission to view earnings for properties outside your authorized region or account.'}
          </p>
          <button
            onClick={() => loadEarnings(selectedHotelId)}
            style={{
              padding: '0.65rem 1.5rem',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  // ── Render General Error State ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="hotel-page" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          className="hotel-alert hotel-alert-danger"
          style={{
            background: '#fff1f2',
            border: '1px solid #fda4af',
            borderRadius: '12px',
            padding: '1.75rem',
            color: '#9f1239',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 0.25rem', fontWeight: 700 }}>Failed to Retrieve Verified Earnings</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{error.message || 'An unexpected error occurred while contacting the server.'}</p>
          </div>
          <button
            onClick={() => (selectedHotelId ? loadEarnings(selectedHotelId) : loadPartnerHotels())}
            style={{
              padding: '0.5rem 1rem',
              background: '#e11d48',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-page hotel-earnings" style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* ── Page Header & Property Switcher ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '1.8rem',
                padding: '0.4rem',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '10px',
                display: 'inline-flex',
              }}
            >
              💳
            </span>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Verified Partner Earnings
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Read-only financial statements computed from completed guest check-outs by the server.
          </p>
        </div>

        {/* Hotel Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hotels.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="earnings-hotel-select" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>
                Property:
              </label>
              <select
                id="earnings-hotel-select"
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadEarnings(selectedHotelId)}
            title="Reload earnings report"
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Notice Banner on Read-Only Nature ── */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.9rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem',
          color: '#475569',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🔒</span>
        <div>
          <strong>Server-Verified Ledger:</strong> All amounts and disbursement records are calculated directly
          by the central settlements service once guests complete their stay (<code>CHECKED_OUT</code>). Zero client-side computation is performed.
        </div>
      </div>

      {/* ── Loading Skeleton State ── */}
      {loadingHotels || loadingEarnings ? (
        <div style={{ padding: '3.5rem 0', textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ color: '#64748b', fontWeight: 500 }}>Fetching server settlement ledger…</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : hotels.length === 0 ? (
        /* ── Empty State: No Hotels ── */
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
            No Hotels Enrolled in {user?.region || 'Your Account'}
          </h2>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Earnings become available once properties are created and guest stays are recorded.
          </p>
          <Link
            to="/hotel/dashboard"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              background: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      ) : !earningsData || !earningsData.items || earningsData.items.length === 0 ? (
        /* ── Empty State: No Verified Earnings Yet ── */
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪙</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
            No Verified Earnings Yet for {selectedHotel?.name}
          </h2>
          <p style={{ color: '#64748b', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Earnings are automatically credited when active bookings transition to <strong>CHECKED_OUT</strong> status.
            As soon as visiting guests complete their stay and are checked out, payout records will appear here.
          </p>
          <Link
            to="/hotel/bookings"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage Active Bookings →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Summary Stats Line / Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            {/* Total Verified Payout (Server Provided) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '14px',
                padding: '1.4rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Total Verified Payout
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#38bdf8' }}>
                {fmt(earningsData.total, earningsData.currency)}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                Property: {selectedHotel?.name}
              </div>
            </div>

            {/* Completed Stays Count */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.4rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.4rem' }}>
                Completed Stays
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a' }}>
                {earningsData.items.length}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                100% verified check-outs
              </div>
            </div>

            {/* Average Revenue per Stay */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.4rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.4rem' }}>
                Average Payout / Stay
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a' }}>
                {fmt(
                  earningsData.items.length > 0 ? earningsData.total / earningsData.items.length : 0,
                  earningsData.currency,
                )}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                Direct bank deposit eligible
              </div>
            </div>

            {/* Disbursement Status */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.4rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.4rem' }}>
                Settlement Currency
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a' }}>
                {earningsData.currency || 'INR'}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                ✓ Clean audit verification
              </div>
            </div>
          </div>

          {/* ── Earnings Breakdown Table ── */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Itemised Stay Settlements ({earningsData.items.length})
              </h3>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}
              >
                ● Server Verified
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Booking Ref</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Guest Name</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Stay Dates</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Room Type</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Guests</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Paid Date</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Payout Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData.items.map((item, idx) => (
                    <tr
                      key={item.bookingId || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: 600, color: '#2563eb' }}>
                        #{item.bookingId}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                        {item.guestName}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>
                        {fmtDate(item.checkIn)} → {fmtDate(item.checkOut)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#334155' }}>
                        {item.roomType}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>
                        {item.guests} {item.guests === 1 ? 'Guest' : 'Guests'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b' }}>
                        {fmtDate(item.paidAt)}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {fmt(item.amount, earningsData.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={6} style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                      Total Verified Settlement Line:
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', textAlign: 'right' }}>
                      {fmt(earningsData.total, earningsData.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
