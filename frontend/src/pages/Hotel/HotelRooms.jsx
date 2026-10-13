import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/foundation';
import {
  createRoomType,
  deleteRoomType,
  getHotelAvailability,
  listHotels,
  listRooms,
  updateRoomType,
} from '@/services/hotels.api.js';
import { HOTEL_PAGE_CSS } from '@/legacy/styles.js';
import { usePageStyles } from '@/lib/usePageStyles.js';
import ImageUploader from '@/components/common/ImageUploader.jsx';

const ALL_AMENITIES = [
  'Free WiFi',
  'Air Conditioning',
  'TV',
  'Bathtub',
  'Breakfast Included',
  'Minibar',
  'Balcony',
  'Room Service',
  'Work Desk',
  'Electric Kettle',
  'Safe',
  'Plunge Pool',
  'Jacuzzi',
  'Butler',
];

const INITIAL_FORM = {
  hotelId: '',
  type: '',
  description: '',
  pricePerNight: '',
  maxOccupancy: 2,
  totalRooms: 10,
  amenities: ['Free WiFi', 'Air Conditioning'],
  image: '',
};

export default function HotelRooms() {
  usePageStyles(HOTEL_PAGE_CSS);
  const { user } = useAuth();

  // Primary data states
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generalError, setGeneralError] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Availability calendar modal states
  const [availabilityModal, setAvailabilityModal] = useState({
    isOpen: false,
    hotel: null,
    room: null,
    loading: false,
    data: null,
    error: null,
  });

  // Delete confirmation modal states
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Load partner hotels and their rooms
  const loadData = useCallback(async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const partnerHotels = await listHotels();
      setHotels(partnerHotels);

      if (partnerHotels.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      // Fetch rooms for all partner hotels
      const roomLists = await Promise.all(
        partnerHotels.map((h) =>
          listRooms(h.id).then((rList) =>
            rList.map((r) => ({
              ...r,
              hotelName: h.name,
              hotelCity: h.city,
            }))
          )
        )
      );

      const flattened = roomLists.flat();
      setRooms(flattened);
    } catch (err) {
      setGeneralError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (selectedHotelId === 'all') return rooms;
    return rooms.filter((r) => r.hotelId === selectedHotelId);
  }, [rooms, selectedHotelId]);

  // Inventory statistics
  const stats = useMemo(() => {
    const total = filteredRooms.reduce((sum, r) => sum + (Number(r.totalRooms) || 0), 0);
    const available = filteredRooms.reduce(
      (sum, r) => sum + (Number(r.availableRooms ?? r.totalRooms) || 0),
      0
    );
    const occupied = Math.max(0, total - available);
    return {
      totalRooms: total,
      availableRooms: available,
      occupiedRooms: occupied,
      totalTypes: filteredRooms.length,
    };
  }, [filteredRooms]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      ...INITIAL_FORM,
      hotelId: selectedHotelId !== 'all' ? selectedHotelId : hotels[0]?.id || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      hotelId: room.hotelId,
      type: room.type,
      description: room.description || '',
      pricePerNight: room.pricePerNight,
      maxOccupancy: room.maxOccupancy,
      totalRooms: room.totalRooms,
      amenities: room.amenities || [],
      image: room.images?.[0] || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Close form modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormErrors({});
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.hotelId) errors.hotelId = 'Please select a hotel';
    if (!formData.type?.trim()) errors.type = 'Room type is required (e.g. Deluxe Suite)';
    if (formData.pricePerNight === '' || Number(formData.pricePerNight) < 0) {
      errors.pricePerNight = 'Price per night must be 0 or greater';
    }
    if (!formData.maxOccupancy || Number(formData.maxOccupancy) < 1) {
      errors.maxOccupancy = 'Capacity must be at least 1 guest';
    }
    if (formData.totalRooms === '' || Number(formData.totalRooms) < 0) {
      errors.totalRooms = 'Total rooms cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add or Edit room
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setFormErrors({});

    const payload = {
      type: formData.type.trim(),
      description: formData.description.trim(),
      pricePerNight: Number(formData.pricePerNight),
      maxOccupancy: Number(formData.maxOccupancy),
      totalRooms: Number(formData.totalRooms),
      amenities: formData.amenities,
      images: formData.image ? [formData.image] : [],
    };

    try {
      if (editingRoom) {
        await updateRoomType(editingRoom.hotelId, editingRoom.id, payload);
        showToast(`Room type "${payload.type}" updated successfully!`);
      } else {
        await createRoomType(formData.hotelId, payload);
        showToast(`New room type "${payload.type}" added successfully!`);
      }
      handleCloseModal();
      await loadData();
    } catch (err) {
      if (err.status === 400 && err.details) {
        setFormErrors(err.details);
      } else {
        setFormErrors({ _general: err.message || 'Failed to save room type.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // Toggle amenity selection
  const toggleAmenity = (item) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== item)
          : [...prev.amenities, item],
      };
    });
  };

  // Delete Room
  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    setDeleting(true);
    try {
      await deleteRoomType(deletingRoom.hotelId, deletingRoom.id);
      showToast(`Room type "${deletingRoom.type}" deleted.`);
      setDeletingRoom(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Cannot delete room.');
    } finally {
      setDeleting(false);
    }
  };

  // Open Availability Calendar Modal
  const handleOpenAvailability = async (room) => {
    const parentHotel = hotels.find((h) => h.id === room.hotelId);
    setAvailabilityModal({
      isOpen: true,
      hotel: parentHotel,
      room,
      loading: true,
      data: null,
      error: null,
    });

    try {
      const res = await getHotelAvailability(room.hotelId);
      setAvailabilityModal((prev) => ({
        ...prev,
        loading: false,
        data: res,
      }));
    } catch (err) {
      setAvailabilityModal((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load availability calendar',
      }));
    }
  };

  const handleCloseAvailability = () => {
    setAvailabilityModal({
      isOpen: false,
      hotel: null,
      room: null,
      loading: false,
      data: null,
      error: null,
    });
  };

  // ── Render States ───────────────────────────────────────────────────────────

  // State 1: 403 Forbidden State
  if (generalError && generalError.status === 403) {
    return (
      <main className="dashboard-wrapper hotel-rooms-page" style={{ padding: '24px 32px' }}>
        <div className="hotel-page-header">
          <h1>Rooms &amp; Inventory</h1>
          <p>Manage your hotel room types and availability</p>
        </div>
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: '#991b1b',
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Access Restricted (403)</h2>
          <p>You do not have permission to access hotel inventory outside your assigned region.</p>
        </div>
      </main>
    );
  }

  // State 2: Loading State
  if (loading) {
    return (
      <main className="dashboard-wrapper hotel-rooms-page" style={{ padding: '24px 32px' }}>
        <div className="hotel-page-header hotel-flex-header">
          <div>
            <h1>Rooms &amp; Inventory</h1>
            <p>Loading your hotel rooms and availability…</p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: '4px solid #e2e8f0',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 16,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>
            Fetching room inventory…
          </span>
        </div>
      </main>
    );
  }

  // State 3: General Error State
  if (generalError) {
    return (
      <main className="dashboard-wrapper hotel-rooms-page" style={{ padding: '24px 32px' }}>
        <div className="hotel-page-header">
          <h1>Rooms &amp; Inventory</h1>
        </div>
        <div
          role="alert"
          style={{
            background: '#fff',
            border: '1px solid #fee2e2',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#b91c1c', marginBottom: 8 }}>Unable to load rooms</h2>
          <p style={{ color: '#64748b', marginBottom: 16 }}>{generalError.message || 'Network error occurred.'}</p>
          <button
            type="button"
            className="btn-blue"
            onClick={loadData}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-wrapper hotel-rooms-page" style={{ padding: '24px 32px' }}>
      {/* Toast Notification */}
      {toastMessage ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: '#0f172a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {toastMessage}
        </div>
      ) : null}

      {/* HEADER */}
      <div
        className="hotel-page-header hotel-flex-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: 32, fontWeight: 800 }}>Rooms &amp; Inventory</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            Partner Region:{' '}
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                background: '#eff6ff',
                color: '#1d4ed8',
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {user?.region || 'All'}
            </span>{' '}
            · Manage room categories, capacity, live availability, and nightly rates.
          </p>
        </div>

        <button
          type="button"
          className="btn-blue"
          onClick={handleOpenAdd}
          disabled={hotels.length === 0}
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: hotels.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37,99,235,0.25)',
          }}
        >
          + Add Room Type
        </button>
      </div>

      {/* FILTER & STATS BAR */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
            Filter by Property:
          </label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: 14,
              color: '#1e293b',
            }}
          >
            <option value="all">All Properties ({hotels.length})</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Inventory Summary Chips */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <div
            style={{
              background: '#fff',
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
              Total Rooms
            </span>
            <strong style={{ fontSize: 18, color: '#0f172a' }}>{stats.totalRooms}</strong>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
              Available
            </span>
            <strong style={{ fontSize: 18, color: '#16a34a' }}>{stats.availableRooms}</strong>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
              Occupied
            </span>
            <strong style={{ fontSize: 18, color: '#2563eb' }}>{stats.occupiedRooms}</strong>
          </div>
        </div>
      </div>

      {/* State 4: Empty State */}
      {filteredRooms.length === 0 ? (
        <div
          className="hotel-content-card"
          style={{
            padding: 48,
            textAlign: 'center',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #f1f5f9',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛏️</div>
          <h2 style={{ fontSize: 20, color: '#1e293b', marginBottom: 8 }}>No Rooms Found</h2>
          <p style={{ color: '#64748b', maxWidth: 460, margin: '0 auto 20px auto', fontSize: 14 }}>
            {hotels.length === 0
              ? 'You do not have any registered hotels in your account yet. Contact administration or register a property first.'
              : 'Add your first room type to make your inventory available for travellers to book.'}
          </p>
          {hotels.length > 0 ? (
            <button
              type="button"
              className="btn-blue"
              onClick={handleOpenAdd}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Add Room Type
            </button>
          ) : null}
        </div>
      ) : (
        /* ROOMS GRID */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredRooms.map((room) => {
            const isSoldOut = (room.availableRooms ?? room.totalRooms) === 0;
            const previewImg =
              room.images?.[0] ||
              'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600';

            return (
              <div
                key={room.id}
                className="hotel-room-box"
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  padding: 0,
                }}
              >
                {/* Room Photo & Badges */}
                <div style={{ position: 'relative', width: '100%', height: 160, background: '#f1f5f9' }}>
                  <img
                    src={previewImg}
                    alt={room.type}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: isSoldOut ? '#fef2f2' : '#f0fdf4',
                      color: isSoldOut ? '#dc2626' : '#16a34a',
                      border: isSoldOut ? '1px solid #fecaca' : '1px solid #bbf7d0',
                    }}
                  >
                    {isSoldOut ? 'Sold Out' : `${room.availableRooms ?? room.totalRooms} / ${room.totalRooms} Available`}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: 18, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      {room.hotelName} ({room.hotelCity})
                    </span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                      {room.type}
                    </h3>
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      color: '#475569',
                      margin: '0 0 12px 0',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {room.description || 'No description provided.'}
                  </p>

                  {/* Price & Capacity Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      padding: '8px 0',
                      borderTop: '1px solid #f1f5f9',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                        ₹{Number(room.pricePerNight).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}> / night</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                      👤 {room.maxOccupancy} guest{room.maxOccupancy > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Amenities Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(room.amenities || []).slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          fontSize: 11,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '2px 8px',
                          borderRadius: 6,
                          color: '#475569',
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                    {(room.amenities || []).length > 4 ? (
                      <span style={{ fontSize: 11, color: '#94a3b8', padding: '2px 4px' }}>
                        +{room.amenities.length - 4} more
                      </span>
                    ) : null}
                  </div>

                  {/* Card Actions */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAvailability(room)}
                      style={{
                        flex: 1,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Availability
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(room)}
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRoom(room)}
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: ADD / EDIT ROOM ────────────────────────────────────────── */}
      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                {editingRoom ? 'Edit Room Type' : 'Add Room Type'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRoom} style={{ padding: 24 }}>
              {formErrors._general ? (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#dc2626',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {formErrors._general}
                </div>
              ) : null}

              {/* Property Select */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Hotel Property *
                </label>
                <select
                  disabled={Boolean(editingRoom)}
                  value={formData.hotelId}
                  onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: formErrors.hotelId ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    background: editingRoom ? '#f8fafc' : '#fff',
                    fontSize: 14,
                  }}
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city} ({h.location})
                    </option>
                  ))}
                </select>
                {formErrors.hotelId ? (
                  <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.hotelId}
                  </span>
                ) : null}
              </div>

              {/* Room Type Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Room Category / Type Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deluxe Sea View, Heritage Suite"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: formErrors.type ? '1px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: 14,
                  }}
                />
                {formErrors.type ? (
                  <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {formErrors.type}
                  </span>
                ) : null}
              </div>

              {/* Numbers Grid: Price, Max Occupancy, Total Rooms */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                    Price/Night (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3500"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: formErrors.pricePerNight ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                    }}
                  />
                  {formErrors.pricePerNight ? (
                    <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                      {formErrors.pricePerNight}
                    </span>
                  ) : null}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="2"
                    value={formData.maxOccupancy}
                    onChange={(e) => setFormData({ ...formData, maxOccupancy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: formErrors.maxOccupancy ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                    }}
                  />
                  {formErrors.maxOccupancy ? (
                    <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                      {formErrors.maxOccupancy}
                    </span>
                  ) : null}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                    Total Rooms *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: formErrors.totalRooms ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                    }}
                  />
                  {formErrors.totalRooms ? (
                    <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>
                      {formErrors.totalRooms}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe features, views, bed type and amenities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Room Image (ImageUploader integration) */}
              <div style={{ marginBottom: 20 }}>
                <ImageUploader
                  id="room-image-uploader"
                  label="Room Photo"
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  helperText="JPEG, PNG or WebP up to 5MB"
                />
              </div>

              {/* Amenities Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                  Room Amenities
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALL_AMENITIES.map((amenity) => {
                    const selected = formData.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        style={{
                          background: selected ? '#eff6ff' : '#f8fafc',
                          color: selected ? '#1d4ed8' : '#475569',
                          border: selected ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {selected ? '✓ ' : '+ '}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── MODAL: AVAILABILITY CALENDAR ─────────────────────────────────── */}
      {availabilityModal.isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                  Availability Matrix &amp; Calendar
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                  {availabilityModal.hotel?.name} · {availabilityModal.room?.type}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAvailability}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {availabilityModal.loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                Loading live availability calendar…
              </div>
            ) : availabilityModal.error ? (
              <div role="alert" style={{ padding: 20, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
                {availabilityModal.error}
              </div>
            ) : (
              <div>
                {/* 14-day calendar grid */}
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12 }}>
                  Next 14 Days Forecast:
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 10,
                    marginBottom: 24,
                  }}
                >
                  {(availabilityModal.data?.calendar || []).map((day) => {
                    const specificRoomAvail = day.roomTypes?.find(
                      (rt) => rt.roomType === availabilityModal.room?.type
                    );
                    const avCount = specificRoomAvail?.availableRooms ?? day.availableRooms;
                    const totCount = specificRoomAvail?.totalRooms ?? day.totalRooms;
                    const isFull = avCount === 0;

                    return (
                      <div
                        key={day.date}
                        style={{
                          border: isFull ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '10px 8px',
                          textAlign: 'center',
                          backgroundColor: isFull ? '#fff1f2' : '#f8fafc',
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>
                          {day.dayName}
                        </span>
                        <strong style={{ fontSize: 13, display: 'block', color: '#1e293b' }}>
                          {day.date.slice(5)}
                        </strong>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isFull ? '#dc2626' : '#16a34a',
                            marginTop: 4,
                            display: 'block',
                          }}
                        >
                          {avCount}/{totCount}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    padding: 14,
                    background: '#f1f5f9',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#475569',
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>Auto-inventory updates:</strong> Rooms are automatically marked unavailable when bookings
                  are confirmed by travellers. Room availability reflects confirmed and checked-in reservations.
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                type="button"
                onClick={handleCloseAvailability}
                className="btn-blue"
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── MODAL: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deletingRoom ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
              Delete Room Category?
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong>&quot;{deletingRoom.type}&quot;</strong>? This action cannot be
              undone. Rooms with active bookings cannot be deleted.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeletingRoom(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteRoom}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
