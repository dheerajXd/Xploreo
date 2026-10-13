import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/foundation';
import { listHotelBookings, listHotels } from '@/services/hotels.api.js';
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';

// ── Currency formatter ────────────────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

// ── Date formatter ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Status metadata ───────────────────────────────────────────────────────────
const STATUS_META = {
  CONFIRMED:   { label: 'Confirmed',   color: '#16a34a', bg: '#dcfce7', icon: '✓' },
  CHECKED_IN:  { label: 'Checked In',  color: '#2563eb', bg: '#dbeafe', icon: '⬆' },
  CHECKED_OUT: { label: 'Checked Out', color: '#7c3aed', bg: '#ede9fe', icon: '⬇' },
  CANCELLED:   { label: 'Cancelled',   color: '#dc2626', bg: '#fee2e2', icon: '✕' },
};

export default function HotelDashboard() {
  usePageStyles(HOTEL_PAGE_CSS);
  const { user } = useAuth();

  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState('all');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partnerHotels, allBookings] = await Promise.all([
        listHotels(),
        listHotelBookings(),
      ]);
      setHotels(partnerHotels);
      setBookings(allBookings);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filtered hotels & bookings based on property switcher
  const relevantHotels = useMemo(() => {
    if (selectedHotelId === 'all') return hotels;
    return hotels.filter((h) => h.id === selectedHotelId);
  }, [hotels, selectedHotelId]);

  const relevantBookings = useMemo(() => {
    if (selectedHotelId === 'all') return bookings;
    return bookings.filter((b) => b.hotelId === selectedHotelId);
  }, [bookings, selectedHotelId]);

  // Computed summary metrics
  const stats = useMemo(() => {
    const totalRooms = relevantHotels.reduce((sum, h) => sum + (h.totalRooms || 0), 0);
    const availableRooms = relevantHotels.reduce((sum, h) => sum + (h.availableRooms || 0), 0);
    const occupiedRooms = Math.max(0, totalRooms - availableRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const activeBookings = relevantBookings.filter((b) => ['CONFIRMED', 'CHECKED_IN'].includes(b.status));
    const completedBookings = relevantBookings.filter((b) => b.status === 'CHECKED_OUT');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const todayIso = new Date().toISOString().split('T')[0];
    const todayArrivals = relevantBookings.filter((b) => b.checkIn === todayIso && b.status === 'CONFIRMED').length;
    const todayDepartures = relevantBookings.filter((b) => b.checkOut === todayIso && b.status === 'CHECKED_IN').length;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      activeCount: activeBookings.length,
      totalCount: relevantBookings.length,
      totalRevenue,
      todayArrivals,
      todayDepartures,
    };
  }, [relevantHotels, relevantBookings]);

  // Recent 5 bookings
  const recentBookings = useMemo(() => {
    return [...relevantBookings]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [relevantBookings]);

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
            padding: '2rem',
            textAlign: 'center',
            color: '#991b1b',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>Access Restricted (403)</h3>
          <p style={{ margin: '0 0 1.25rem', color: '#b91c1c' }}>
            {error.message || 'You do not have permission to view hotel partner dashboard data outside your assigned region.'}
          </p>
          <button
            onClick={loadDashboardData}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
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
            <h4 style={{ margin: '0 0 0.25rem', fontWeight: 700 }}>Failed to Load Dashboard Data</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{error.message || 'A network error occurred.'}</p>
          </div>
          <button
            onClick={loadDashboardData}
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
    <div className="hotel-page hotel-dashboard" style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* ── Top Header & Greeting ── */}
      <div
        className="hotel-dash-header"
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
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                borderRadius: '10px',
                display: 'inline-flex',
              }}
            >
              🏨
            </span>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Hotel Operations Dashboard
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Welcome back, <strong>{user?.businessName || user?.name || 'Hotel Partner'}</strong>
            {user?.region ? <span style={{ marginLeft: '0.5rem', color: '#3b82f6' }}>• {user.region} Region</span> : null}
          </p>
        </div>

        {/* Property Selector & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hotels.length > 1 && (
            <select
              id="hotel-dashboard-selector"
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
              <option value="all">All Properties ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadDashboardData}
            title="Refresh dashboard stats"
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>↻</span> Refresh
          </button>
        </div>
      </div>

      {/* ── Loading Skeleton State ── */}
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ color: '#64748b', fontWeight: 500 }}>Synchronising live hotel metrics…</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : hotels.length === 0 ? (
        /* ── Empty State (0 Hotels Registered) ── */
        <div
          className="hotel-empty-state"
          style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            margin: '1.5rem 0',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
            No Hotels Enrolled in {user?.region || 'Your Region'}
          </h2>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Your account is currently set up as a hotel partner with 0 active properties. Once properties are assigned
            to your profile, real-time occupancy, bookings, and earnings will populate here automatically.
          </p>
          <Link
            to="/hotel/profile"
            style={{
              display: 'inline-block',
              padding: '0.7rem 1.5rem',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
            }}
          >
            Configure Partner Profile →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Key Metrics Cards Grid ── */}
          <div
            className="hotel-metrics-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            {/* Metric 1: Total Rooms */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Rooms
                </span>
                <span style={{ padding: '0.35rem', background: '#eff6ff', borderRadius: '8px', fontSize: '1.1rem' }}>🛏️</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {stats.totalRooms}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600 }}>
                {stats.availableRooms} available currently
              </div>
            </div>

            {/* Metric 2: Occupancy Rate */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Occupancy Rate
                </span>
                <span style={{ padding: '0.35rem', background: '#f0fdf4', borderRadius: '8px', fontSize: '1.1rem' }}>📊</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {stats.occupancyRate}%
              </div>
              {/* Mini progress bar */}
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', marginTop: '0.65rem', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, stats.occupancyRate)}%`,
                    height: '100%',
                    background: stats.occupancyRate > 75 ? '#16a34a' : stats.occupancyRate > 40 ? '#3b82f6' : '#f59e0b',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Metric 3: Active Bookings */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Bookings
                </span>
                <span style={{ padding: '0.35rem', background: '#f5f3ff', borderRadius: '8px', fontSize: '1.1rem' }}>📅</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {stats.activeCount}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                {stats.totalCount} total bookings on record
              </div>
            </div>

            {/* Metric 4: Realised Revenue */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Completed Revenue
                </span>
                <span style={{ padding: '0.35rem', background: '#fef3c7', borderRadius: '8px', fontSize: '1.1rem' }}>💰</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {fmt(stats.totalRevenue)}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                Verified checkout payouts
              </div>
            </div>
          </div>

          {/* ── Quick Links Portal Navigation ── */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
              Quick Navigation
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <Link
                to="/hotel/rooms"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '10px', fontSize: '1.25rem' }}>🚪</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rooms & Inventory</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage room types & rates</div>
                </div>
              </Link>

              <Link
                to="/hotel/bookings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '10px', fontSize: '1.25rem' }}>📋</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Bookings</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Check-in & guest status</div>
                </div>
              </Link>

              <Link
                to="/hotel/earnings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '10px', fontSize: '1.25rem' }}>💳</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Earnings</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified stay settlements</div>
                </div>
              </Link>

              <Link
                to="/hotel/reviews"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ padding: '0.5rem', background: '#fdf2f8', borderRadius: '10px', fontSize: '1.25rem' }}>⭐</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Guest Reviews</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Ratings & feedback</div>
                </div>
              </Link>
            </div>
          </div>

          {/* ── Main Content Split: Recent Bookings & Property Cards ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
              gap: '1.5rem',
            }}
          >
            {/* Left Column: Recent Bookings Widget */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Recent Bookings
                </h3>
                <Link
                  to="/hotel/bookings"
                  style={{
                    color: '#2563eb',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  View All ({bookings.length}) →
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No recent bookings recorded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentBookings.map((b) => {
                    const statusMeta = STATUS_META[b.status] || { label: b.status, color: '#64748b', bg: '#f1f5f9' };
                    const hotelName = hotels.find((h) => h.id === b.hotelId)?.name || b.hotelId;
                    return (
                      <div
                        key={b.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.9rem 1rem',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #f1f5f9',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                              {b.guestName}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{b.id}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                            {hotelName} • {b.roomType} • {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: statusMeta.color,
                              background: statusMeta.bg,
                            }}
                          >
                            {statusMeta.label}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                            {fmt(b.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Properties Overview Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Property Overview
                </h3>
                <Link
                  to="/hotel/profile"
                  style={{
                    color: '#2563eb',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Manage Profile →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {relevantHotels.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                      background: '#ffffff',
                    }}
                  >
                    {h.image ? (
                      <div
                        style={{
                          height: '110px',
                          borderRadius: '8px',
                          backgroundImage: `url(${h.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          marginBottom: '0.75rem',
                        }}
                      />
                    ) : null}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                          {h.name}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          📍 {h.location || h.city}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        {h.status || 'active'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        marginTop: '0.85rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748b' }}>Total Rooms:</span>{' '}
                        <strong>{h.totalRooms}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Available:</span>{' '}
                        <strong style={{ color: '#16a34a' }}>{h.availableRooms ?? h.totalRooms}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Rating:</span>{' '}
                        <strong>{h.rating ? `${h.rating} ★` : 'New'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Base Rate:</span>{' '}
                        <strong>{fmt(h.pricePerNight)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
