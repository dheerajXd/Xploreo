import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/foundation';
import { listHotels, updateHotel, updateHotelPartnerProfile } from '@/services/hotels.api.js';
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';
import ImageUploader from '@/components/common/ImageUploader.jsx';

const ALL_AMENITIES = [
  'Free WiFi',
  'Air Conditioning',
  'Pool',
  'Restaurant',
  'Gym',
  'Spa',
  'Airport Transfer',
  '24h Room Service',
  'Parking',
  'Bar',
  'Breakfast Included',
];

export default function HotelProfile() {
  usePageStyles(HOTEL_PAGE_CSS);
  const { user } = useAuth();

  // Primary data state
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'property'
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // ── Account Form State ────────────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
  });
  const [accountErrors, setAccountErrors] = useState({});
  const [accountSaving, setAccountSaving] = useState(false);

  // ── Property Form State ───────────────────────────────────────────────────
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    location: '',
    description: '',
    stars: 3,
    pricePerNight: 0,
    taxesAndFees: 0,
    image: '',
    images: [],
    amenities: [],
  });
  const [propertyErrors, setPropertyErrors] = useState({});
  const [propertySaving, setPropertySaving] = useState(false);

  // ── Toast notification ────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
  const showToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: '', type: 'success' }), 4000);
  };

  // Load partner's account & hotels data
  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Seed user account details from AuthContext session
      if (user) {
        setAccountForm({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          businessName: user.businessName || '',
        });
      }

      const partnerHotels = await listHotels();
      setHotels(partnerHotels);

      if (partnerHotels.length > 0) {
        const first = partnerHotels[0];
        setSelectedPropertyId(first.id);
        setPropertyForm({
          name: first.name || '',
          location: first.location || '',
          description: first.description || '',
          stars: first.stars || 3,
          pricePerNight: first.pricePerNight || 0,
          taxesAndFees: first.taxesAndFees || 0,
          image: first.image || '',
          images: Array.isArray(first.images) ? first.images : first.image ? [first.image] : [],
          amenities: Array.isArray(first.amenities) ? first.amenities : [],
        });
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // When switching selected property in property tab
  const handleSelectProperty = (propId) => {
    setSelectedPropertyId(propId);
    setPropertyErrors({});
    const found = hotels.find((h) => h.id === propId);
    if (found) {
      setPropertyForm({
        name: found.name || '',
        location: found.location || '',
        description: found.description || '',
        stars: found.stars || 3,
        pricePerNight: found.pricePerNight || 0,
        taxesAndFees: found.taxesAndFees || 0,
        image: found.image || '',
        images: Array.isArray(found.images) ? found.images : found.image ? [found.image] : [],
        amenities: Array.isArray(found.amenities) ? found.amenities : [],
      });
    }
  };

  // ── Save Account Profile ──────────────────────────────────────────────────
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountErrors({});

    // Client-side quick convenience validation
    const errs = {};
    if (!accountForm.name.trim()) errs.name = 'Full name is required';
    if (!accountForm.email.trim() || !accountForm.email.includes('@')) errs.email = 'Valid email is required';
    if (!accountForm.phone.trim()) errs.phone = 'Phone number is required';
    if (!accountForm.businessName.trim()) errs.businessName = 'Business name is required';

    if (Object.keys(errs).length > 0) {
      setAccountErrors(errs);
      return;
    }

    setAccountSaving(true);
    try {
      // Self-only guard: partner can only edit user.id
      const payload = {
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone.trim(),
        businessName: accountForm.businessName.trim(),
      };
      await updateHotelPartnerProfile(user.id, payload);
      showToast('Partner profile updated successfully!');
    } catch (err) {
      if (err.status === 400 && err.fieldErrors) {
        setAccountErrors(err.fieldErrors);
      } else {
        showToast(err.message || 'Failed to update partner profile', 'error');
      }
    } finally {
      setAccountSaving(false);
    }
  };

  // ── Save Hotel Property Profile ───────────────────────────────────────────
  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setPropertyErrors({});

    const errs = {};
    if (!propertyForm.name.trim()) errs.name = 'Property name is required';
    if (!propertyForm.location.trim()) errs.location = 'Location / address is required';
    if (!propertyForm.description.trim()) errs.description = 'Description is required';
    if (Number(propertyForm.stars) < 1 || Number(propertyForm.stars) > 5) errs.stars = 'Stars must be 1 to 5';

    if (Object.keys(errs).length > 0) {
      setPropertyErrors(errs);
      return;
    }

    setPropertySaving(true);
    try {
      // Whitelisted DTO fields only (pickHotel in hotels.api.js enforces this)
      const payload = {
        name: propertyForm.name.trim(),
        location: propertyForm.location.trim(),
        description: propertyForm.description.trim(),
        stars: Number(propertyForm.stars),
        pricePerNight: Number(propertyForm.pricePerNight),
        taxesAndFees: Number(propertyForm.taxesAndFees),
        image: propertyForm.image || (propertyForm.images.length > 0 ? propertyForm.images[0] : ''),
        images: propertyForm.images,
        amenities: propertyForm.amenities,
      };

      const updated = await updateHotel(selectedPropertyId, payload);
      // Update local state list
      setHotels((prev) => prev.map((h) => (h.id === selectedPropertyId ? updated : h)));
      showToast('Hotel property details saved successfully!');
    } catch (err) {
      if (err.status === 400 && err.fieldErrors) {
        setPropertyErrors(err.fieldErrors);
      } else {
        showToast(err.message || 'Failed to update property details', 'error');
      }
    } finally {
      setPropertySaving(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setPropertyForm((prev) => {
      const current = prev.amenities || [];
      const next = current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity];
      return { ...prev, amenities: next };
    });
  };

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
            {error.message || 'You can only view and update profiles for your own account and properties.'}
          </p>
          <button
            onClick={loadProfileData}
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

  return (
    <div className="hotel-page hotel-profile" style={{ padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* ── Toast banner ── */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            padding: '0.85rem 1.5rem',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }}>
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
            🏢
          </span>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Hotel Partner Profile
          </h1>
        </div>
        <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.95rem' }}>
          Manage your business credentials, contact info, and hotel property branding.
        </p>
      </div>

      {/* ── Navigation Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '2rem',
        }}
      >
        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'account' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'account' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          👤 Business Account Info
        </button>

        <button
          onClick={() => setActiveTab('property')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'property' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'property' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          🏨 Property Details & Gallery
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3.5rem 0', textAlign: 'center' }}>
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
          <p style={{ color: '#64748b', fontWeight: 500 }}>Loading profile records…</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : activeTab === 'account' ? (
        /* ════════════════════════════════════════════════════════════════════════════
           TAB 1: PARTNER ACCOUNT INFO
           ════════════════════════════════════════════════════════════════════════════ */
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.5rem' }}>
            Partner Identity & Contact
          </h2>

          <form onSubmit={handleSaveAccount}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Representative Name *
                </label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: accountErrors.name ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
                {accountErrors.name && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    {accountErrors.name}
                  </span>
                )}
              </div>

              {/* Business Legal Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Business / Entity Name *
                </label>
                <input
                  type="text"
                  value={accountForm.businessName}
                  onChange={(e) => setAccountForm({ ...accountForm, businessName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: accountErrors.businessName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
                {accountErrors.businessName && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    {accountErrors.businessName}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: accountErrors.email ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
                {accountErrors.email && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    {accountErrors.email}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: accountErrors.phone ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
                {accountErrors.phone && (
                  <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    {accountErrors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Region / Location Guard Info (Read-only security token) */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📍</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                  Assigned Operating Region: {user?.region || user?.location || 'Unassigned'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Operating region is tied to your partner agreement and cannot be altered directly.
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="submit"
                disabled={accountSaving}
                style={{
                  padding: '0.65rem 1.75rem',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: accountSaving ? 'not-allowed' : 'pointer',
                  opacity: accountSaving ? 0.7 : 1,
                }}
              >
                {accountSaving ? 'Saving Changes…' : 'Save Account Settings'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════════
           TAB 2: PROPERTY DETAILS & GALLERY (uses ImageUploader)
           ════════════════════════════════════════════════════════════════════════════ */
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {hotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <p>No enrolled hotel properties found for this account.</p>
            </div>
          ) : (
            <>
              {/* Hotel Property Switcher Header */}
              {hotels.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.75rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                    Select Property:
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => handleSelectProperty(e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#1e293b',
                    }}
                  >
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={handleSaveProperty}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  {/* Property Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Property Display Name *
                    </label>
                    <input
                      type="text"
                      value={propertyForm.name}
                      onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: propertyErrors.name ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    {propertyErrors.name && (
                      <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                        {propertyErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Star Classification (1 - 5) *
                    </label>
                    <select
                      value={propertyForm.stars}
                      onChange={(e) => setPropertyForm({ ...propertyForm, stars: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: propertyErrors.stars ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <option key={s} value={s}>
                          {s} Star{s > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location / Address */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Full Address / Locality *
                  </label>
                  <input
                    type="text"
                    value={propertyForm.location}
                    onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: propertyErrors.location ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {propertyErrors.location && (
                    <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                      {propertyErrors.location}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Hotel Narrative & Description *
                  </label>
                  <textarea
                    rows={4}
                    value={propertyForm.description}
                    onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: propertyErrors.description ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                  {propertyErrors.description && (
                    <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                      {propertyErrors.description}
                    </span>
                  )}
                </div>

                {/* Property Amenities Checkboxes */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                    Featured Amenities
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    {ALL_AMENITIES.map((amenity) => {
                      const checked = propertyForm.amenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '8px',
                            background: checked ? '#eff6ff' : '#f8fafc',
                            border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAmenity(amenity)}
                          />
                          <span>{amenity}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* ── Image Uploads using Shared ImageUploader Component ── */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.75rem',
                  }}
                >
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    Property Images & Media Gallery
                  </h3>

                  {/* Primary Cover Photo Uploader */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <ImageUploader
                      id="property-cover-uploader"
                      label="Primary Cover Photo"
                      helperText="Displayed as the primary hero image across traveller browse and listings"
                      multiple={false}
                      value={propertyForm.image}
                      onChange={(newUrl) => {
                        setPropertyForm((prev) => ({
                          ...prev,
                          image: newUrl,
                          images: prev.images.includes(newUrl) ? prev.images : [newUrl, ...prev.images],
                        }));
                      }}
                    />
                  </div>

                  {/* Multi-image Gallery Uploader */}
                  <div>
                    <ImageUploader
                      id="property-gallery-uploader"
                      label="Property Photo Gallery"
                      helperText="Upload up to 6 high-resolution photos of rooms, lobby, amenities and views"
                      multiple={true}
                      maxFiles={6}
                      value={propertyForm.images}
                      onChange={(newUrls) => {
                        setPropertyForm((prev) => ({
                          ...prev,
                          images: newUrls,
                          image: prev.image || (newUrls.length > 0 ? newUrls[0] : ''),
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    disabled={propertySaving}
                    style={{
                      padding: '0.65rem 1.75rem',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      cursor: propertySaving ? 'not-allowed' : 'pointer',
                      opacity: propertySaving ? 0.7 : 1,
                    }}
                  >
                    {propertySaving ? 'Saving Property…' : 'Save Property Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
