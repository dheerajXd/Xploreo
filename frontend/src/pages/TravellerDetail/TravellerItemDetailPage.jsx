import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getHotel } from '../../services/hotels.api.js';
import { getExperience } from '../../services/partners.api.js';
import { getPlanById } from '../../services/plans.api.js';
import { apiRequest } from '../../services/api.js';
import {
  DEFAULT_HOTEL_FIXTURES,
  DEFAULT_EXPERIENCE_FIXTURES,
  DEFAULT_PLAN_FIXTURES,
  mapBackendHotel,
  mapBackendExperience,
  mapBackendPlan,
} from '../../utils/browseUtils.js';
import { formatCurrency, formatDate } from '../../utils/checkoutUtils.js';
import './travellerDetail.css';

/**
 * TravellerItemDetailPage
 * Dedicated full page for inspecting Hotel, Experience, or Holiday Package details.
 * Supports:
 * - Dynamic data retrieval by item ID & category with browser refresh persistence
 * - Multiple images in an interactive gallery carousel with graceful missing image fallbacks
 * - Comprehensive item specifics (amenities, schedule slots, package tags & itinerary)
 * - Clear "Book Slot" CTA transitioning into the existing /Traveller/checkout flow
 * - Preservation of user selections (guests, rooms, dates, destination)
 */
export default function TravellerItemDetailPage({ user: propUser, defaultType }) {
  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch {
    authUser = null;
  }
  const user = propUser || authUser;
  const { type: paramType, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize category type (hotel | experience | package/plan)
  const effectiveType = useMemo(() => {
    const raw = (paramType || defaultType || '').toLowerCase();
    if (raw === 'hotels' || raw === 'hotel') return 'hotel';
    if (raw === 'experiences' || raw === 'experience') return 'experience';
    if (raw === 'packages' || raw === 'package' || raw === 'plans' || raw === 'plan') return 'package';
    return 'hotel';
  }, [paramType, defaultType]);

  // Read search context from URL search params or router location state
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialCheckIn = searchParams.get('checkIn') || location.state?.checkInDate || location.state?.checkIn || '';
  const initialCheckOut = searchParams.get('checkOut') || location.state?.checkOutDate || location.state?.checkOut || '';
  const initialGuests = searchParams.get('guests') || location.state?.guestCount || location.state?.guests || '2';
  const initialRooms = searchParams.get('rooms') || location.state?.roomCount || location.state?.rooms || '1';

  // State management
  const [item, setItem] = useState(() => {
    if (location.state?.item && String(location.state.item.id) === String(id)) {
      return location.state.item;
    }
    return null;
  });
  const [loading, setLoading] = useState(!item);
  const [error, setError] = useState(null);

  // Gallery carousel state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Booking drawer controls
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedCheckIn, setSelectedCheckIn] = useState(initialCheckIn || todayStr);
  const [selectedCheckOut, setSelectedCheckOut] = useState(() => {
    if (initialCheckOut) return initialCheckOut;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [selectedGuests, setSelectedGuests] = useState(initialGuests);
  const [selectedRooms, setSelectedRooms] = useState(initialRooms);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // Fetch item data on mount or when id/type changes
  useEffect(() => {
    let isCancelled = false;

    async function loadItem() {
      if (!id) {
        setError('Invalid item identifier provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let loaded = null;

        if (effectiveType === 'hotel') {
          try {
            const raw = await getHotel(id);
            if (raw) loaded = mapBackendHotel(raw);
          } catch {
            const fixture = DEFAULT_HOTEL_FIXTURES.find((h) => String(h.id) === String(id));
            if (fixture) loaded = fixture;
          }
        } else if (effectiveType === 'experience') {
          try {
            const raw = await getExperience(id);
            if (raw) loaded = mapBackendExperience(raw);
          } catch {
            const fixture = DEFAULT_EXPERIENCE_FIXTURES.find((e) => String(e.id) === String(id));
            if (fixture) loaded = fixture;
          }
        } else if (effectiveType === 'package') {
          try {
            const raw = await getPlanById(id);
            if (raw) loaded = mapBackendPlan(raw);
          } catch {
            const fixture = DEFAULT_PLAN_FIXTURES.find((p) => String(p.id) === String(id));
            if (fixture) loaded = fixture;
          }
        }

        if (!isCancelled) {
          if (loaded) {
            setItem(loaded);
            if (Array.isArray(loaded.slots) && loaded.slots.length > 0) {
              const available = loaded.slots.find((s) => s.available && (s.capacity - (s.booked || 0)) > 0);
              setSelectedSlotId(available ? available.id : loaded.slots[0].id);
            }
          } else if (!item) {
            setError(`The requested ${effectiveType} (#${id}) could not be found.`);
          }
        }
      } catch (err) {
        if (!isCancelled && !item) {
          setError(err.message || `Failed to load ${effectiveType} details.`);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadItem();

    return () => {
      isCancelled = true;
    };
  }, [id, effectiveType]);

  // Photo gallery calculation (safe, no invented URLs)
  const images = useMemo(() => {
    if (!item) return [];
    const list = [];
    if (Array.isArray(item.images)) {
      item.images.forEach((img) => {
        if (typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    if (typeof item.image === 'string' && item.image.trim() && !list.includes(item.image.trim())) {
      list.push(item.image.trim());
    }
    if (typeof item.imageUrl === 'string' && item.imageUrl.trim() && !list.includes(item.imageUrl.trim())) {
      list.push(item.imageUrl.trim());
    }
    return list;
  }, [item]);

  const activePhoto = images[activePhotoIndex] || images[0] || null;

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Pricing & Night calculations
  const calculateNights = () => {
    if (!selectedCheckIn || !selectedCheckOut) return 1;
    const start = new Date(selectedCheckIn);
    const end = new Date(selectedCheckOut);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.ceil(diff) : 1;
  };

  const nights = calculateNights();
  const guestCountNum = Math.max(1, Number(selectedGuests) || 2);
  const roomCountNum = Math.max(1, Number(selectedRooms) || 1);
  const startingRate = Number(item?.pricePerNight ?? item?.price ?? item?.pricePerPerson ?? 5000);
  const subtotal =
    effectiveType === 'hotel'
      ? startingRate * nights * roomCountNum
      : effectiveType === 'package'
      ? startingRate * guestCountNum
      : startingRate * guestCountNum;
  const taxes = Number(item?.taxesAndFees ?? 1200);
  const totalAmount = subtotal + taxes;

  // Handle "Book Slot" navigation into existing /Traveller/checkout flow
  const handleBookSlot = () => {
    if (!item) return;

    const selectedSlotObj = Array.isArray(item.slots)
      ? item.slots.find((s) => s.id === selectedSlotId)
      : null;

    const checkoutItem = {
      id: item.id || `item-${Date.now()}`,
      title: item.name || item.title || 'Selected Reservation',
      type: effectiveType === 'hotel' ? 'hotel' : effectiveType === 'experience' ? 'experience' : 'plan',
      location: item.location || item.city || item.destination || 'India',
      date: selectedCheckIn,
      checkIn: selectedCheckIn,
      checkOut: selectedCheckOut,
      guestCount: guestCountNum,
      roomCount: roomCountNum,
      basePrice: startingRate,
      taxesAndFees: taxes,
      total: totalAmount,
      imageUrl: activePhoto || item.image || item.imageUrl || null,
      selectedSlot: selectedSlotObj,
      item,
    };

    navigate('/Traveller/checkout', {
      state: {
        item: checkoutItem,
        guests: guestCountNum,
        rooms: roomCountNum,
        checkIn: selectedCheckIn,
        checkOut: selectedCheckOut,
      },
    });
  };

  // 1. Loading State
  if (loading && !item) {
    return (
      <div className="trav-page-container">
        <Navbar user={user} />
        <main className="trav-main" style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
          <div className="trav-loading-card">
            <div className="trav-spinner" />
            <h2 className="trav-loading-title">Loading Item Details...</h2>
            <p className="trav-loading-subtitle">
              Retrieving verified rates, property features, and live availability.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // 2. Error State
  if (error && !item) {
    return (
      <div className="trav-page-container">
        <Navbar user={user} />
        <main className="trav-main" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
          <div className="trav-error-state" role="alert">
            <span className="trav-error-icon" aria-hidden="true">⚠️</span>
            <h2 className="trav-error-title">Item Unavailable</h2>
            <p className="trav-error-desc">{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="trav-btn trav-btn-primary"
                onClick={() => navigate('/Traveller/browse')}
              >
                ← Return to Browse
              </button>
              <button
                type="button"
                className="trav-btn trav-btn-secondary"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const title = item.name || item.title || 'Travel Item';
  const displayLocation = item.location || item.city || item.destination || 'India';
  const categoryLabel =
    effectiveType === 'hotel'
      ? 'Hotels & Stays'
      : effectiveType === 'experience'
      ? 'Curated Experience'
      : 'Holiday Tour Package';

  return (
    <div className="trav-page-container" data-testid="traveller-item-detail-page">
      <Navbar user={user} />

      <main className="trav-main" style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
        {/* Navigation Breadcrumb & Back button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            className="trav-btn trav-btn-secondary"
            onClick={() => navigate(-1)}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            aria-label="Back to browse"
          >
            ← Back to Browse
          </button>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            <Link to="/Traveller/browse" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: 600 }}>
              Browse
            </Link>
            {' › '}
            <span style={{ color: '#475569', fontWeight: 600 }}>{categoryLabel}</span>
            {' › '}
            <span style={{ color: '#0f172a', fontWeight: 700 }}>{title}</span>
          </div>
        </div>

        {/* Item Topline Header */}
        <div className="trav-detail-header">
          <div className="trav-detail-topline">
            <div>
              <span className="trav-badge trav-badge-category" style={{ marginBottom: '8px' }}>
                {categoryLabel.toUpperCase()}
              </span>
              <h1 className="trav-detail-title">{title}</h1>
              <div className="trav-detail-location">
                <span>📍</span>
                <span>{displayLocation}</span>
                {item.stars && (
                  <span style={{ marginLeft: '12px', color: '#f59e0b', fontWeight: 700 }}>
                    {'★'.repeat(Math.min(5, Math.max(1, item.stars)))} {item.stars}-Star Tier
                  </span>
                )}
                {item.rating && (
                  <span style={{ marginLeft: '8px', color: '#0f172a', fontWeight: 700 }}>
                    ★ {item.rating} ({item.reviewCount || 120} reviews)
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Starting from</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>
                {formatCurrency(startingRate)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {effectiveType === 'hotel' ? 'per night' : 'per person'}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery & Carousel */}
        <section className="trav-gallery-container" aria-label="Photo Gallery" style={{ marginBottom: '32px' }}>
          {images.length > 0 ? (
            <div>
              <div style={{ position: 'relative', width: '100%', height: '460px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                <img
                  src={activePhoto}
                  alt={`${title} view ${activePhotoIndex + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      aria-label="Previous photo"
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        border: 'none',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      aria-label="Next photo"
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        border: 'none',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      ›
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {activePhotoIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '12px',
                    overflowX: 'auto',
                    paddingBottom: '6px',
                  }}
                >
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      style={{
                        border: idx === activePhotoIndex ? '3px solid #0d9488' : '2px solid transparent',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        padding: 0,
                        cursor: 'pointer',
                        flexShrink: 0,
                        width: '100px',
                        height: '68px',
                        opacity: idx === activePhotoIndex ? 1 : 0.7,
                        transition: 'opacity 0.2s',
                      }}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Graceful missing-image fallback (no invented URLs) */
            <div
              style={{
                width: '100%',
                height: '320px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
              }}
            >
              <span style={{ fontSize: '3rem' }}>
                {effectiveType === 'hotel' ? '🏨' : effectiveType === 'experience' ? '🧭' : '🗺'}
              </span>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
                Photo gallery coming soon · Verified listing
              </p>
            </div>
          )}
        </section>

        {/* 2-Column Content + Sticky Booking Box */}
        <div className="trav-grid-layout">
          {/* Left Column: Comprehensive Details */}
          <div>
            {/* Overview / Description */}
            <section className="trav-card">
              <h2 className="trav-card-title">Overview & Description</h2>
              <p className="trav-card-desc">
                {item.description ||
                  'Experience tranquil luxury and world-class hospitality curated for discerning travellers across India.'}
              </p>
            </section>

            {/* Hotel-Specific Details: Amenities & Policies */}
            {effectiveType === 'hotel' && (
              <>
                {Array.isArray(item.amenities) && item.amenities.length > 0 && (
                  <section className="trav-card">
                    <h2 className="trav-card-title">Included Amenities</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {item.amenities.map((amenity, idx) => (
                        <span key={idx} className="trav-chip">
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="trav-card">
                  <h2 className="trav-card-title">Property Policies</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.95rem' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Check-in time</span>
                      <strong style={{ color: '#0f172a' }}>12:00 PM</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Check-out time</span>
                      <strong style={{ color: '#0f172a' }}>11:00 AM</strong>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Experience-Specific Details: Slots, Duration, Capacity */}
            {effectiveType === 'experience' && (
              <section className="trav-card">
                <h2 className="trav-card-title">Activity Information & Schedule</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Duration</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>
                      {item.durationHours ? `${item.durationHours} Hours` : 'Half Day'}
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Group Capacity</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>
                      Up to {item.capacity || 10} guests
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Category</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px', textTransform: 'capitalize' }}>
                      {item.category || 'Adventure'}
                    </strong>
                  </div>
                </div>

                {Array.isArray(item.slots) && item.slots.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '16px 0 10px', color: '#0f172a' }}>
                      Available Session Slots
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {item.slots.map((slot) => {
                        const spotsLeft = Math.max(0, (slot.capacity || 10) - (slot.booked || 0));
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <div
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f0fdfa' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div>
                              <strong style={{ color: '#0f172a' }}>{slot.date}</strong>
                              <span style={{ color: '#64748b', marginLeft: '8px' }}>at {slot.time}</span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: spotsLeft > 0 ? '#0d9488' : '#ef4444',
                                fontWeight: 700,
                              }}
                            >
                              {spotsLeft > 0 ? `${spotsLeft} spots available` : 'Sold out'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Package/Plan-Specific Details: Duration, Tags, Itinerary */}
            {effectiveType === 'package' && (
              <section className="trav-card">
                <h2 className="trav-card-title">Tour Package Specifications</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Duration</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>
                      {item.durationNights ? `${item.durationNights} Nights / ${item.durationNights + 1} Days` : '5 Nights / 6 Days'}
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Accommodation</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>
                      {item.hotelStars || 4}-Star Premium Stays
                    </strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Destination</span>
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>
                      {item.destination || 'Kerala'}
                    </strong>
                  </div>
                </div>

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '14px 0 8px', color: '#0f172a' }}>
                      Key Highlights
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="trav-chip">
                          🌟 {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #0d9488' }}>
                  <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '0.95rem' }}>Package Inclusions</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                    All packages include vetted accommodation, guided transfers, verified daily itineraries, and 24/7 traveller support.
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Booking Widget Sidebar */}
          <aside className="trav-booking-box">
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Reservation Summary
            </h3>

            {/* Price display */}
            <div className="trav-price-display" style={{ marginBottom: '20px' }}>
              <span className="trav-price-amount">{formatCurrency(startingRate)}</span>
              <span className="trav-price-unit">
                {effectiveType === 'hotel' ? '/ night' : '/ person'}
              </span>
            </div>

            {/* Interactive Search / Booking fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {/* Date pickers */}
              {effectiveType === 'hotel' ? (
                <>
                  <div>
                    <label htmlFor="detail-checkin" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      CHECK-IN
                    </label>
                    <input
                      id="detail-checkin"
                      type="date"
                      min={todayStr}
                      value={selectedCheckIn}
                      onChange={(e) => setSelectedCheckIn(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="detail-checkout" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      CHECK-OUT
                    </label>
                    <input
                      id="detail-checkout"
                      type="date"
                      min={selectedCheckIn || todayStr}
                      value={selectedCheckOut}
                      onChange={(e) => setSelectedCheckOut(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="detail-date" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    {effectiveType === 'package' ? 'DEPARTURE DATE' : 'ACTIVITY DATE'}
                  </label>
                  <input
                    id="detail-date"
                    type="date"
                    min={todayStr}
                    value={selectedCheckIn}
                    onChange={(e) => setSelectedCheckIn(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Guests selector */}
              <div>
                <label htmlFor="detail-guests" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  GUESTS
                </label>
                <select
                  id="detail-guests"
                  value={selectedGuests}
                  onChange={(e) => setSelectedGuests(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5+">5+ Guests</option>
                </select>
              </div>

              {/* Rooms selector (hotels & packages) */}
              {effectiveType !== 'experience' && (
                <div>
                  <label htmlFor="detail-rooms" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    ROOMS
                  </label>
                  <select
                    id="detail-rooms"
                    value={selectedRooms}
                    onChange={(e) => setSelectedRooms(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="1">1 Room</option>
                    <option value="2">2 Rooms</option>
                    <option value="3">3 Rooms</option>
                    <option value="4+">4+ Rooms</option>
                  </select>
                </div>
              )}
            </div>

            {/* Live Pricing Breakdown */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px', color: '#475569' }}>
                <span>
                  {formatCurrency(startingRate)} × {effectiveType === 'hotel' ? `${nights} night(s)` : `${guestCountNum} guest(s)`}
                </span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '12px', color: '#475569' }}>
                <span>Taxes & Service Fees</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(taxes)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0 12px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                <span>Total Amount</span>
                <span style={{ color: '#0d9488' }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Clear "Book Slot" Primary CTA Button */}
            <button
              type="button"
              className="trav-btn trav-btn-primary"
              id="btn-book-slot"
              data-testid="btn-book-slot"
              onClick={handleBookSlot}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1.05rem',
                fontWeight: 800,
                boxSizing: 'border-box',
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
              }}
            >
              Book Slot
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                🔒 Best Price Guaranteed · Instant Confirmation
              </span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
