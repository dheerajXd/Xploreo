import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/foundation';
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  listHotelBookings,
  listHotels,
} from '@/services/hotels.api.js';
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';

// ── Status definitions ─────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'ALL',         label: 'All Bookings' },
  { key: 'CONFIRMED',   label: 'Confirmed' },
  { key: 'CHECKED_IN',  label: 'Checked In' },
  { key: 'CHECKED_OUT', label: 'Checked Out' },
  { key: 'CANCELLED',   label: 'Cancelled' },
];

const STATUS_META = {
  CONFIRMED:   { label: 'Confirmed',   color: '#22c55e', bg: '#dcfce7', icon: '✓' },
  CHECKED_IN:  { label: 'Checked In',  color: '#3b82f6', bg: '#dbeafe', icon: '⬆' },
  CHECKED_OUT: { label: 'Checked Out', color: '#8b5cf6', bg: '#ede9fe', icon: '⬇' },
  CANCELLED:   { label: 'Cancelled',   color: '#ef4444', bg: '#fee2e2', icon: '✕' },
};

// ── Helper: format currency ────────────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// ── Helper: nights between two ISO date strings ────────────────────────────────
function countNights(checkIn, checkOut) {
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(1, Math.round(diff / 86400000));
}

// ── Helper: format date for display ───────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HotelBookings() {
  usePageStyles(HOTEL_PAGE_CSS);
  const { user } = useAuth();

  // ── Primary data state ────────────────────────────────────────────────────
  const [hotels,        setHotels]        = useState([]);
  const [bookings,      setBookings]       = useState([]);
  const [loading,       setLoading]        = useState(true);
  const [generalError,  setGeneralError]   = useState(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]      = useState('ALL');
  const [selectedHotel, setSelectedHotel]  = useState('all');
  const [searchQuery,   setSearchQuery]    = useState('');

  // ── Action / in-flight state ──────────────────────────────────────────────
  const [actionId,      setActionId]       = useState(null); // booking id currently being actioned
  const [actionError,   setActionError]    = useState({});   // { [bookingId]: message }

  // ── Confirm-cancel modal ──────────────────────────────────────────────────
  const [cancelModal,   setCancelModal]    = useState(null); // booking to cancel
  const [cancelling,    setCancelling]     = useState(false);

  // ── Detail drawer ─────────────────────────────────────────────────────────
  const [detailBooking, setDetailBooking]  = useState(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState('');
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const [partnerHotels, allBookings] = await Promise.all([
        listHotels(),
        listHotelBookings(),
      ]);
      setHotels(partnerHotels);
      setBookings(allBookings);
    } catch (err) {
      setGeneralError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived: filtered bookings ────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (activeTab !== 'ALL')  result = result.filter((b) => b.status === activeTab);
    if (selectedHotel !== 'all') result = result.filter((b) => b.hotelId === selectedHotel);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.guestName?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q) ||
          b.roomType?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [bookings, activeTab, selectedHotel, searchQuery]);

  // ── Derived: counts per tab ───────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const all = selectedHotel === 'all' ? bookings : bookings.filter((b) => b.hotelId === selectedHotel);
    return {
      ALL:         all.length,
      CONFIRMED:   all.filter((b) => b.status === 'CONFIRMED').length,
      CHECKED_IN:  all.filter((b) => b.status === 'CHECKED_IN').length,
      CHECKED_OUT: all.filter((b) => b.status === 'CHECKED_OUT').length,
      CANCELLED:   all.filter((b) => b.status === 'CANCELLED').length,
    };
  }, [bookings, selectedHotel]);

  // ── Derived: summary stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const scope = selectedHotel === 'all' ? bookings : bookings.filter((b) => b.hotelId === selectedHotel);
    const revenue = scope
      .filter((b) => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status))
      .reduce((s, b) => s + (b.totalAmount ?? 0), 0);
    return {
      total:      scope.length,
      active:     scope.filter((b) => ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length,
      checkedIn:  scope.filter((b) => b.status === 'CHECKED_IN').length,
      revenue,
    };
  }, [bookings, selectedHotel]);

  // ── Hotel lookup helper ───────────────────────────────────────────────────
  function hotelName(hotelId) {
    return hotels.find((h) => h.id === hotelId)?.name ?? hotelId;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function clearActionError(id) {
    setActionError((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  async function handleCheckIn(booking) {
    clearActionError(booking.id);
    setActionId(booking.id);
    try {
      const updated = await checkInBooking(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (detailBooking?.id === booking.id) setDetailBooking(updated);
      showToast(`✓ Checked in — ${booking.guestName}`);
    } catch (err) {
      setActionError((prev) => ({ ...prev, [booking.id]: err?.message ?? 'Action failed' }));
    } finally {
      setActionId(null);
    }
  }

  async function handleCheckOut(booking) {
    clearActionError(booking.id);
    setActionId(booking.id);
    try {
      const updated = await checkOutBooking(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (detailBooking?.id === booking.id) setDetailBooking(updated);
      showToast(`✓ Checked out — ${booking.guestName}`);
    } catch (err) {
      setActionError((prev) => ({ ...prev, [booking.id]: err?.message ?? 'Action failed' }));
    } finally {
      setActionId(null);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelModal) return;
    setCancelling(true);
    clearActionError(cancelModal.id);
    try {
      const updated = await cancelBooking(cancelModal.id);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (detailBooking?.id === cancelModal.id) setDetailBooking(updated);
      showToast(`Booking ${cancelModal.id} has been cancelled.`);
      setCancelModal(null);
    } catch (err) {
      setActionError((prev) => ({ ...prev, [cancelModal.id]: err?.message ?? 'Cancel failed' }));
      setCancelModal(null);
    } finally {
      setCancelling(false);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function StatusBadge({ status }) {
    const meta = STATUS_META[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6', icon: '•' };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
        color: meta.color, background: meta.bg,
      }}>
        <span style={{ fontSize: '10px' }}>{meta.icon}</span>
        {meta.label}
      </span>
    );
  }

  // ── Derived: what actions are available for each booking ──────────────────
  function getActions(booking) {
    const busy = actionId === booking.id;
    const actions = [];
    if (booking.status === 'CONFIRMED') {
      actions.push({ label: 'Check In', handler: () => handleCheckIn(booking), busy, variant: 'primary' });
      actions.push({ label: 'Cancel',   handler: () => setCancelModal(booking), busy, variant: 'danger' });
    }
    if (booking.status === 'CHECKED_IN') {
      actions.push({ label: 'Check Out', handler: () => handleCheckOut(booking), busy, variant: 'primary' });
    }
    return actions;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE: Loading
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="hotel-page">
        <div className="hotel-page__header">
          <h1 className="hotel-page__title">Bookings</h1>
        </div>
        <div className="hotel-bookings-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="hotel-booking-skeleton-row" style={{
              height: '80px', background: 'linear-gradient(90deg, var(--hotel-surface-alt) 25%, var(--hotel-border) 50%, var(--hotel-surface-alt) 75%)',
              backgroundSize: '400% 100%', animation: 'hotel-shimmer 1.4s ease infinite',
              borderRadius: '12px', marginBottom: '12px',
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE: General Error
  // ═══════════════════════════════════════════════════════════════════════════
  if (generalError) {
    const is403 = generalError?.status === 403;
    return (
      <div className="hotel-page">
        <div className="hotel-page__header">
          <h1 className="hotel-page__title">Bookings</h1>
        </div>
        <div className="hotel-error-state" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{is403 ? '🔒' : '⚠️'}</div>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--hotel-text-primary)' }}>
            {is403 ? 'Access Denied' : 'Something went wrong'}
          </h2>
          <p style={{ color: 'var(--hotel-text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {is403
              ? "You don't have permission to view bookings for this hotel."
              : generalError?.message || 'Failed to load bookings. Please try again.'}
          </p>
          {!is403 && (
            <button className="hotel-btn hotel-btn--primary" onClick={loadData}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="hotel-page">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="hotel-page__header">
        <div>
          <h1 className="hotel-page__title">Bookings</h1>
          <p className="hotel-page__subtitle">
            Manage guest bookings across your {hotels.length} {hotels.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className="hotel-stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Bookings',  value: stats.total,                   icon: '📋' },
          { label: 'Active (Conf. + In)', value: stats.active,              icon: '🔄' },
          { label: 'Currently Checked In', value: stats.checkedIn,          icon: '🏨' },
          { label: 'Expected Revenue', value: fmt(stats.revenue),           icon: '₹',  wide: true },
        ].map((s) => (
          <div key={s.label} className="hotel-stat-card" style={{ gridColumn: s.wide ? 'span 1' : undefined }}>
            <span className="hotel-stat-card__icon">{s.icon}</span>
            <div>
              <div className="hotel-stat-card__value">{s.value}</div>
              <div className="hotel-stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters row ──────────────────────────────────────────────────── */}
      <div className="hotel-filters-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Hotel selector */}
        {hotels.length > 1 && (
          <select
            id="hotel-bookings-hotel-filter"
            className="hotel-form__select"
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            style={{ maxWidth: '220px' }}
          >
            <option value="all">All Properties</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hotel-text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            id="hotel-bookings-search"
            type="search"
            className="hotel-form__input"
            placeholder="Search guest, booking ID, room…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
            aria-label="Search bookings"
          />
        </div>
      </div>

      {/* ── Status tabs ──────────────────────────────────────────────────── */}
      <div className="hotel-tabs" role="tablist" aria-label="Booking status filter" style={{ marginBottom: '1.5rem' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            id={`hotel-bookings-tab-${tab.key.toLowerCase()}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`hotel-tab${activeTab === tab.key ? ' hotel-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="hotel-tab__count">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATE: Empty                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {filteredBookings.length === 0 ? (
        <div className="hotel-empty-state" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--hotel-text-primary)' }}>
            {activeTab === 'ALL' && !searchQuery
              ? hotels.length === 0
                ? 'No properties yet'
                : 'No bookings yet'
              : 'No matching bookings'}
          </h2>
          <p style={{ color: 'var(--hotel-text-muted)', maxWidth: '380px', margin: '0 auto' }}>
            {searchQuery
              ? `No bookings match "${searchQuery}". Try clearing the search.`
              : activeTab !== 'ALL'
              ? `You have no ${STATUS_META[activeTab]?.label.toLowerCase() ?? activeTab.toLowerCase()} bookings${selectedHotel !== 'all' ? ' for this property' : ''}.`
              : 'When travellers book your rooms, they will appear here.'}
          </p>
          {searchQuery && (
            <button
              className="hotel-btn hotel-btn--ghost"
              onClick={() => setSearchQuery('')}
              style={{ marginTop: '1.25rem' }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           STATE: Populated booking list
           ═══════════════════════════════════════════════════════════════════ */
        <div className="hotel-bookings-list">
          {filteredBookings.map((booking) => {
            const nights   = countNights(booking.checkIn, booking.checkOut);
            const actions  = getActions(booking);
            const errMsg   = actionError[booking.id];
            const isBusy   = actionId === booking.id;

            return (
              <div
                key={booking.id}
                id={`hotel-booking-card-${booking.id}`}
                className="hotel-booking-card"
                style={{
                  background: 'var(--hotel-surface)',
                  border: '1px solid var(--hotel-border)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '12px',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => setDetailBooking(booking)}
                role="button"
                tabIndex={0}
                aria-label={`Booking ${booking.id} — ${booking.guestName}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetailBooking(booking); }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                  {/* Left: guest info */}
                  <div style={{ flex: '1', minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--hotel-accent), var(--hotel-accent-dark, #7c3aed))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                      }}>
                        {booking.guestName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--hotel-text-primary)', fontSize: '15px' }}>
                          {booking.guestName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--hotel-text-muted)' }}>
                          {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--hotel-text-muted)', marginTop: '6px' }}>
                      {booking.email}
                    </div>
                  </div>

                  {/* Middle: booking details */}
                  <div style={{ flex: '2', minWidth: '200px' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--hotel-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Property</div>
                        <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--hotel-text-primary)' }}>{hotelName(booking.hotelId)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--hotel-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Room Type</div>
                        <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--hotel-text-primary)' }}>{booking.roomType}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--hotel-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Dates</div>
                        <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--hotel-text-primary)' }}>
                          {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--hotel-text-muted)' }}>{nights} night{nights !== 1 ? 's' : ''}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--hotel-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Amount</div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--hotel-accent)' }}>{fmt(booking.totalAmount ?? 0)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--hotel-text-muted)' }}>
                      Booking ID: <span style={{ fontFamily: 'monospace' }}>{booking.id}</span>
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}
                       onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={booking.status} />
                    {actions.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {actions.map((action) => (
                          <button
                            key={action.label}
                            id={`hotel-booking-${action.label.toLowerCase().replace(/\s+/g, '-')}-${booking.id}`}
                            className={`hotel-btn hotel-btn--sm hotel-btn--${action.variant}`}
                            disabled={action.busy}
                            onClick={action.handler}
                            aria-busy={action.busy}
                          >
                            {action.busy ? '…' : action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* 400-class action error */}
                    {errMsg && (
                      <p style={{ fontSize: '11px', color: '#ef4444', maxWidth: '200px', textAlign: 'right', margin: 0 }}>
                        {errMsg}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <p style={{ textAlign: 'center', color: 'var(--hotel-text-muted)', fontSize: '13px', marginTop: '1rem' }}>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            {activeTab !== 'ALL' ? ` · ${STATUS_META[activeTab]?.label}` : ''}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Detail Drawer / Side Panel
          ═══════════════════════════════════════════════════════════════════ */}
      {detailBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Booking details — ${detailBooking.guestName}`}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            onClick={() => setDetailBooking(null)}
          />

          {/* Drawer panel */}
          <div style={{
            position: 'relative', width: '420px', maxWidth: '95vw', height: '100%',
            background: 'var(--hotel-surface)', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
            overflowY: 'auto', padding: '2rem',
            animation: 'hotel-slide-in-right 0.25s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--hotel-text-primary)' }}>Booking Details</h2>
              <button
                id="hotel-booking-detail-close"
                className="hotel-btn hotel-btn--ghost hotel-btn--sm"
                onClick={() => setDetailBooking(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {/* Status badge + ID */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <StatusBadge status={detailBooking.status} />
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--hotel-text-muted)' }}>{detailBooking.id}</span>
            </div>

            {/* Guest */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hotel-text-muted)', marginBottom: '0.75rem' }}>Guest</h3>
              <DetailRow label="Name"   value={detailBooking.guestName} />
              <DetailRow label="Email"  value={detailBooking.email} />
              <DetailRow label="Phone"  value={detailBooking.phone} />
              <DetailRow label="Guests" value={`${detailBooking.guests} guest${detailBooking.guests !== 1 ? 's' : ''}`} />
            </section>

            {/* Stay */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hotel-text-muted)', marginBottom: '0.75rem' }}>Stay</h3>
              <DetailRow label="Property"  value={hotelName(detailBooking.hotelId)} />
              <DetailRow label="Room Type" value={detailBooking.roomType} />
              <DetailRow label="Check-In"  value={fmtDate(detailBooking.checkIn)} />
              <DetailRow label="Check-Out" value={fmtDate(detailBooking.checkOut)} />
              <DetailRow label="Nights"    value={countNights(detailBooking.checkIn, detailBooking.checkOut)} />
            </section>

            {/* Amount */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hotel-text-muted)', marginBottom: '0.75rem' }}>Amount</h3>
              <DetailRow label="Total" value={fmt(detailBooking.totalAmount ?? 0)} highlight />
            </section>

            {/* Notes */}
            {detailBooking.notes && (
              <section style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hotel-text-muted)', marginBottom: '0.5rem' }}>Notes</h3>
                <p style={{ fontSize: '14px', color: 'var(--hotel-text-secondary)', background: 'var(--hotel-surface-alt)', padding: '0.75rem', borderRadius: '8px', margin: 0 }}>
                  {detailBooking.notes}
                </p>
              </section>
            )}

            {/* Booked on */}
            <section style={{ marginBottom: '1.5rem' }}>
              <DetailRow label="Booked On" value={fmtDate(detailBooking.createdAt)} />
            </section>

            {/* Action error in drawer */}
            {actionError[detailBooking.id] && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c', marginBottom: '1rem' }}>
                {actionError[detailBooking.id]}
              </div>
            )}

            {/* Actions in drawer */}
            {(() => {
              const drawerActions = getActions(detailBooking);
              return drawerActions.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {drawerActions.map((action) => (
                    <button
                      key={action.label}
                      id={`hotel-booking-drawer-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`hotel-btn hotel-btn--${action.variant}`}
                      disabled={action.busy}
                      onClick={action.handler}
                      style={{ flex: 1 }}
                    >
                      {action.busy ? 'Processing…' : action.label}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Cancel Confirmation Modal
          ═══════════════════════════════════════════════════════════════════ */}
      {cancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotel-cancel-modal-title"
          style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => !cancelling && setCancelModal(null)}
          />
          <div style={{
            position: 'relative', background: 'var(--hotel-surface)', borderRadius: '20px',
            padding: '2rem', width: '440px', maxWidth: '95vw', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h2 id="hotel-cancel-modal-title" style={{ margin: '0 0 0.5rem', color: 'var(--hotel-text-primary)', fontSize: '1.25rem' }}>
                Cancel Booking?
              </h2>
              <p style={{ color: 'var(--hotel-text-muted)', margin: 0 }}>
                You are about to cancel booking <strong>{cancelModal.id}</strong> for{' '}
                <strong>{cancelModal.guestName}</strong>. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                id="hotel-cancel-modal-dismiss"
                className="hotel-btn hotel-btn--ghost"
                style={{ flex: 1 }}
                disabled={cancelling}
                onClick={() => setCancelModal(null)}
              >
                Keep Booking
              </button>
              <button
                id="hotel-cancel-modal-confirm"
                className="hotel-btn hotel-btn--danger"
                style={{ flex: 1 }}
                disabled={cancelling}
                onClick={handleConfirmCancel}
                aria-busy={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ───────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            background: '#1e293b', color: '#fff',
            padding: '0.75rem 1.25rem', borderRadius: '12px',
            fontSize: '14px', zIndex: 2000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'hotel-fade-in 0.3s ease',
          }}
        >
          {toast}
        </div>
      )}

      {/* ── Keyframe styles ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes hotel-shimmer {
          0%   { background-position: -400% 0; }
          100% { background-position:  400% 0; }
        }
        @keyframes hotel-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes hotel-slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0);    }
        }
        .hotel-booking-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .hotel-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 999px;
          border: 1.5px solid var(--hotel-border);
          background: var(--hotel-surface); color: var(--hotel-text-secondary);
          cursor: pointer; font-size: 13px; font-weight: 500;
          transition: all 0.15s;
        }
        .hotel-tab:hover:not(.hotel-tab--active) {
          border-color: var(--hotel-accent); color: var(--hotel-accent);
        }
        .hotel-tab--active {
          background: var(--hotel-accent); color: #fff; border-color: var(--hotel-accent);
        }
        .hotel-tab__count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; border-radius: 999px; padding: 0 5px;
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.25);
        }
        .hotel-tab:not(.hotel-tab--active) .hotel-tab__count {
          background: var(--hotel-surface-alt);
          color: var(--hotel-text-muted);
        }
        .hotel-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .hotel-btn--sm { padding: 5px 12px; font-size: 12px; }
        .hotel-btn--danger {
          background: #ef4444; color: #fff; border-color: #ef4444;
        }
        .hotel-btn--danger:hover:not(:disabled) {
          background: #dc2626; border-color: #dc2626;
        }
      `}</style>
    </div>
  );
}

// ── Small helper component ─────────────────────────────────────────────────────
function DetailRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid var(--hotel-border, #e2e8f0)' }}>
      <span style={{ fontSize: '13px', color: 'var(--hotel-text-muted)' }}>{label}</span>
      <span style={{ fontSize: highlight ? '16px' : '14px', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--hotel-accent)' : 'var(--hotel-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}
