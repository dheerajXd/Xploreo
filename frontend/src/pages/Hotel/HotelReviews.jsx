import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/foundation';
import { listReviews } from '@/services/reviews.api.js';
import { listHotels } from '@/services/hotels.api.js';
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';

// ── Star icons renderer ───────────────────────────────────────────────────────
function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '0.05em' }}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i}>★</span>;
        return (
          <span key={i} style={{ color: '#cbd5e1' }}>
            ☆
          </span>
        );
      })}
    </span>
  );
}

// ── Date formatter ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HotelReviews() {
  usePageStyles(HOTEL_PAGE_CSS);
  const { user } = useAuth();

  const [hotels, setHotels] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedHotelId, setSelectedHotelId] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Load reviews using M5's domain service listReviews
  const loadReviewsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partnerHotels, reviewsData] = await Promise.all([
        listHotels(),
        listReviews(),
      ]);
      setHotels(partnerHotels);
      setAllReviews(reviewsData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  // Partner's hotels set
  const partnerHotelIds = useMemo(() => new Set(hotels.map((h) => h.id)), [hotels]);

  // Reviews filtered to the signed-in partner's hotels
  const partnerReviews = useMemo(() => {
    return allReviews.filter((r) => r.targetType === 'hotel' && partnerHotelIds.has(r.targetId));
  }, [allReviews, partnerHotelIds]);

  // Further filtered by user selections on the page
  const filteredReviews = useMemo(() => {
    return partnerReviews.filter((r) => {
      if (selectedHotelId !== 'all' && r.targetId !== selectedHotelId) return false;
      if (ratingFilter !== 'all' && Number(r.rating) !== Number(ratingFilter)) return false;
      return true;
    });
  }, [partnerReviews, selectedHotelId, ratingFilter]);

  // Overall statistics for the selected hotel or all properties
  const stats = useMemo(() => {
    const relevant = selectedHotelId === 'all'
      ? partnerReviews
      : partnerReviews.filter((r) => r.targetId === selectedHotelId);

    const total = relevant.length;
    const avg = total > 0 ? relevant.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total : 0;

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    relevant.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      counts[star] = (counts[star] || 0) + 1;
    });

    return { total, avg, counts };
  }, [partnerReviews, selectedHotelId]);

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
          <p style={{ margin: '0 0 1.5rem', color: '#b91c1c' }}>
            {error.message || 'You do not have permission to view review data outside your assigned region.'}
          </p>
          <button
            onClick={loadReviewsData}
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
            <h4 style={{ margin: '0 0 0.25rem', fontWeight: 700 }}>Failed to Load Guest Reviews</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{error.message || 'Network error occurred while fetching reviews.'}</p>
          </div>
          <button
            onClick={loadReviewsData}
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
    <div className="hotel-page hotel-reviews" style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* ── Page Header ── */}
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
              ⭐
            </span>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Guest Reviews & Ratings
            </h1>
          </div>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Authentic traveller feedback and verified stay ratings for your properties.
          </p>
        </div>

        {/* Property Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hotels.length > 1 && (
            <select
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
            onClick={loadReviewsData}
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

      {/* ── Loading Skeleton State ── */}
      {loading ? (
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
          <p style={{ color: '#64748b', fontWeight: 500 }}>Loading guest feedback…</p>
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
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
            Reviews will be displayed here once your properties receive guest bookings and feedback.
          </p>
        </div>
      ) : (
        <>
          {/* ── Rating Overview Banner & Distribution ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 1fr) 2fr',
              gap: '1.5rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.75rem',
              marginBottom: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            {/* Score box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                borderRight: '1px solid #f1f5f9',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {stats.total > 0 ? stats.avg.toFixed(1) : '0.0'}
              </div>
              <div style={{ margin: '0.4rem 0' }}>
                <Stars rating={stats.avg} />
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                Based on {stats.total} guest review{stats.total !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Distribution bars */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.45rem' }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.counts[star] || 0;
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <span style={{ width: '45px', color: '#475569', fontWeight: 600 }}>{star} ★</span>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: '#f59e0b',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                    <span style={{ width: '35px', textAlign: 'right', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Filters Bar ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Rating Filter Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'All Reviews', value: 'all' },
                { label: '5 Stars ★', value: '5' },
                { label: '4 Stars ★', value: '4' },
                { label: '3 Stars ★', value: '3' },
              ].map((pill) => {
                const active = ratingFilter === pill.value;
                return (
                  <button
                    key={pill.value}
                    onClick={() => setRatingFilter(pill.value)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      border: active ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                      background: active ? '#fffbeb' : '#ffffff',
                      color: active ? '#b45309' : '#475569',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing {filteredReviews.length} of {partnerReviews.length} reviews
            </div>
          </div>

          {/* ── Reviews List ── */}
          {filteredReviews.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
                No Matching Reviews Found
              </h3>
              <p style={{ color: '#64748b', margin: 0 }}>
                {ratingFilter !== 'all'
                  ? `No guest has left a ${ratingFilter}-star review yet.`
                  : 'Reviews will appear as soon as guests submit their trip feedback.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredReviews.map((r) => {
                const hotelObj = hotels.find((h) => h.id === r.targetId);
                const reviewerName = r.userName || r.reviewerName || `Traveller #${r.userId || 'Guest'}`;
                const initial = String(reviewerName)[0].toUpperCase();

                return (
                  <div
                    key={r.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                          }}
                        >
                          {initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                            {reviewerName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Verified Stay • {fmtDate(r.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <Stars rating={Number(r.rating) || 0} />
                        {hotelObj && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              background: '#eff6ff',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                            }}
                          >
                            {hotelObj.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: '0.5rem 0 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      "{r.comment || 'No written comment provided.'}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
