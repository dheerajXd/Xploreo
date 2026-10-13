// In-memory "database" for the hotels mock domain (M3).
// Shapes copy backend/src/hotels (Hotel entity, Booking entity, CreateHotelDto, CreateBookingDto).
// Dates are relative to today so the demo never goes stale.
//
// Seeded on purpose:
//   hotel-partner-jpr   2 hotels in Jaipur, rooms in every status, bookings in every state
//   hotel-partner-goa   2 hotels in Goa (one partner-A, one partner-B for 403 isolation test)
//   hotel-partner-del   1 hotel in Delhi — single-item list test
//   hotel-partner-mum   1 hotel in Mumbai
//   hotel-partner-ker   0 hotels (Kerala) → empty list state
//   all 5 regions: Jaipur, Goa, Delhi, Mumbai, Kerala
//
// Unhappy-path fixtures baked in:
//   • Hotel partner A (hotel-partner-goa) tries to access hotel-partner-goa-2 → 403
//   • Room becomes unavailable after a booking
//   • Empty hotel list (hotel-partner-ker)

const pad = (n) => String(n).padStart(2, '0');
function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function dayOffset(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
export function nowIso() {
  return new Date().toISOString();
}
function isoAt(offsetDays, hour = 10) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

// ── Hotel partner users (hotel partnerType) ────────────────────────────────────
export const hotelUsers = [
  { userId: 'hotel-partner-jpr',   username: 'heritage.stays.jpr',  name: 'Heritage Stays Jaipur',    email: 'stays@heritagejpr.example',  phone: '+91 98765 60001', role: 'hotel', location: 'Jaipur',  businessName: 'Heritage Stays Pvt Ltd' },
  { userId: 'hotel-partner-goa',   username: 'coastal.hotels.goa',  name: 'Coastal Hotels Goa',       email: 'info@coastalhotels.example', phone: '+91 98765 60002', role: 'hotel', location: 'Goa',     businessName: 'Coastal Hotels LLP' },
  { userId: 'hotel-partner-goa-2', username: 'sunset.resorts.goa',  name: 'Sunset Resorts Goa',       email: 'hi@sunsetresorts.example',   phone: '+91 98765 60003', role: 'hotel', location: 'Goa',     businessName: 'Sunset Resorts' },
  { userId: 'hotel-partner-del',   username: 'capital.inns.del',    name: 'Capital Inns Delhi',       email: 'book@capitalinns.example',   phone: '+91 98765 60004', role: 'hotel', location: 'Delhi',   businessName: 'Capital Inns Delhi' },
  { userId: 'hotel-partner-mum',   username: 'skyline.hotels.mum',  name: 'Skyline Hotels Mumbai',    email: 'res@skylinehotels.example',  phone: '+91 98765 60005', role: 'hotel', location: 'Mumbai',  businessName: 'Skyline Hotels Ltd' },
  { userId: 'hotel-partner-ker',   username: 'backwater.stays.ker', name: 'Backwater Stays Kerala',   email: 'hq@backwaterstays.example',  phone: '+91 98765 60006', role: 'hotel', location: 'Kerala',  businessName: 'Backwater Stays' },
];

export function findHotelUser(id) {
  return hotelUsers.find((u) => u.userId === id);
}

// ── Hotels ─────────────────────────────────────────────────────────────────────
const AMENITY_SETS = {
  budget: ['Free WiFi', 'Air Conditioning', 'Parking'],
  standard: ['Free WiFi', 'Air Conditioning', 'Pool', 'Restaurant', 'Parking'],
  luxury: ['Free WiFi', 'Air Conditioning', 'Pool', 'Restaurant', 'Gym', 'Spa', 'Airport Transfer', '24h Room Service'],
};

const hotel = (id, partnerId, name, city, location, description, stars, pricePerNight, taxesAndFees, totalRooms, image, amenityTier = 'standard', status = 'active') => ({
  id,
  partnerId,
  name,
  city,
  location,
  description,
  stars,
  rating: 0,
  reviewCount: 0,
  pricePerNight,
  taxesAndFees,
  totalRooms,
  availableRooms: totalRooms,
  image,
  images: [image],
  amenities: AMENITY_SETS[amenityTier],
  status,
  isDeleted: false,
  createdAt: isoAt(-90),
});

export const hotels = [
  // ── Jaipur (hotel-partner-jpr) ────────────────────────────────────────────────
  hotel(
    'hotel-jpr-1', 'hotel-partner-jpr',
    'Haveli Courtyard Inn', 'Jaipur', 'Old City, Jaipur',
    'A restored 18th-century haveli in the heart of the old city. Rooms open onto a shaded courtyard with a fountain, and breakfast is served on the rooftop with a view of Hawa Mahal.',
    4, 4800, 650, 18,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    'luxury',
  ),
  hotel(
    'hotel-jpr-2', 'hotel-partner-jpr',
    'Pink City Budget Inn', 'Jaipur', 'Near Sindhi Camp, Jaipur',
    'Clean, well-located budget option steps from the bus stand and Sindhi Camp. Great for solo travellers and backpackers exploring Rajasthan.',
    2, 1200, 180, 30,
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
    'budget',
  ),

  // ── Goa: partner A owns hotel-goa-1; partner B owns hotel-goa-2 (for 403 isolation) ──
  hotel(
    'hotel-goa-1', 'hotel-partner-goa',
    'Coastal Breeze Resort', 'Goa', 'Calangute Beach, Goa',
    'Beachfront resort with direct sand access, two pools, and a sunset bar. All rooms have sea-facing balconies and breakfast is included.',
    4, 6200, 820, 42,
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
    'luxury',
  ),
  hotel(
    'hotel-goa-2', 'hotel-partner-goa-2',
    'Sunset Palms Resort', 'Goa', 'Baga Beach, Goa',
    'Intimate boutique resort on Baga Beach. Partner B owns this — used to prove hotel partner A cannot see or edit it (403).',
    3, 3800, 510, 16,
    'https://images.unsplash.com/photo-1551882547-ff40c0d129df?auto=format&fit=crop&q=80&w=800',
    'standard',
  ),

  // ── Delhi (hotel-partner-del) ─────────────────────────────────────────────────
  hotel(
    'hotel-del-1', 'hotel-partner-del',
    'Capital Heritage Suites', 'Delhi', 'Connaught Place, Delhi',
    'Boutique heritage property in central Delhi. Elegant rooms in a colonial building, walking distance from Janpath and the Metro.',
    3, 3500, 450, 24,
    'https://images.unsplash.com/photo-1522792850028-9a6401a6b4af?auto=format&fit=crop&q=80&w=800',
    'standard',
  ),

  // ── Mumbai (hotel-partner-mum) ────────────────────────────────────────────────
  hotel(
    'hotel-mum-1', 'hotel-partner-mum',
    'Skyline Marine Drive Hotel', 'Mumbai', 'Marine Drive, Mumbai',
    "Sea-view rooms overlooking the Queen's Necklace. Premium property with rooftop dining and direct Marine Drive promenade access.",
    5, 9500, 1200, 36,
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=800',
    'luxury',
  ),

  // ── Kerala: hotel-partner-ker has NO hotels → empty list state ─────────────────
  // (no entry — empty list seeded on purpose)
];

export const findHotel = (id) => hotels.find((h) => h.id === id);

// Derive availableRooms from bookings (the server owns this value)
export function refreshHotel(hotel) {
  const active = hotelBookings.filter(
    (b) => b.hotelId === hotel.id && ['CONFIRMED', 'CHECKED_IN'].includes(b.status),
  );
  const occupied = active.reduce((sum, b) => sum + (b.rooms ?? 1), 0);
  hotel.availableRooms = Math.max(0, hotel.totalRooms - occupied);
  return hotel;
}

// ── Room types per hotel ───────────────────────────────────────────────────────
// Shape: { id, hotelId, type, description, pricePerNight, maxOccupancy, totalRooms, availableRooms, amenities, images }
const ROOM_TYPE = (id, hotelId, type, description, price, maxOccupancy, total, amenities = []) => ({
  id,
  hotelId,
  type,
  description,
  pricePerNight: price,
  maxOccupancy,
  totalRooms: total,
  availableRooms: total,
  amenities,
  images: [],
});

export const roomTypes = [
  // hotel-jpr-1
  ROOM_TYPE('rt-jpr-1-std', 'hotel-jpr-1', 'Standard Room',    'Classic haveli room with traditional Rajasthani décor, king bed, and courtyard view.',    3800, 2, 8,  ['AC', 'WiFi', 'TV', 'Minibar']),
  ROOM_TYPE('rt-jpr-1-dlx', 'hotel-jpr-1', 'Deluxe Room',     'Larger room with antique furnishings, bathtub, and rooftop terrace access.',              5200, 2, 6,  ['AC', 'WiFi', 'TV', 'Bathtub', 'Minibar']),
  ROOM_TYPE('rt-jpr-1-ste', 'hotel-jpr-1', 'Heritage Suite',  'Two-room suite with a private verandah, rain shower, and a personalised butler service.', 8500, 4, 4,  ['AC', 'WiFi', 'TV', 'Bathtub', 'Butler', 'Private Verandah']),

  // hotel-jpr-2
  ROOM_TYPE('rt-jpr-2-dbl', 'hotel-jpr-2', 'Double Room',     'Simple double room with a comfortable bed and all essentials.',                           1000, 2, 15, ['AC', 'WiFi', 'TV']),
  ROOM_TYPE('rt-jpr-2-dor', 'hotel-jpr-2', 'Dormitory Bed',   '6-bed mixed dorm. Lockers, reading lights and shared bathrooms included.',                  400, 1, 15, ['WiFi', 'Locker']),

  // hotel-goa-1
  ROOM_TYPE('rt-goa-1-sea', 'hotel-goa-1', 'Sea View Room',    'Balcony room with direct ocean views, king bed, and complimentary breakfast.',            5500, 2, 20, ['AC', 'WiFi', 'Balcony', 'Breakfast']),
  ROOM_TYPE('rt-goa-1-dlx', 'hotel-goa-1', 'Deluxe Pool Room', 'Ground-floor room with private plunge pool and garden.',                                  7800, 2, 12, ['AC', 'WiFi', 'Plunge Pool', 'Breakfast']),
  ROOM_TYPE('rt-goa-1-ste', 'hotel-goa-1', 'Beachfront Suite', 'Top-floor suite with private deck, jacuzzi, and 180° sea views.',                        12000, 4, 10, ['AC', 'WiFi', 'Jacuzzi', 'Deck', 'Breakfast', 'Butler']),

  // hotel-goa-2
  ROOM_TYPE('rt-goa-2-std', 'hotel-goa-2', 'Garden Room',      'Cosy garden-view room with queen bed.',                                                   3200, 2, 10, ['AC', 'WiFi', 'TV']),
  ROOM_TYPE('rt-goa-2-dlx', 'hotel-goa-2', 'Pool View Room',   'Pool-facing room with sunbed access on the terrace.',                                     4100, 2,  6, ['AC', 'WiFi', 'TV', 'Pool Access']),

  // hotel-del-1
  ROOM_TYPE('rt-del-1-std', 'hotel-del-1', 'Standard Room',    'Classic room with colonial-era furniture, queen bed and city views.',                     2800, 2, 14, ['AC', 'WiFi', 'TV']),
  ROOM_TYPE('rt-del-1-dlx', 'hotel-del-1', 'Deluxe Room',     'Corner room with extra-large windows overlooking Connaught Place.',                        3800, 2, 10, ['AC', 'WiFi', 'TV', 'Minibar']),

  // hotel-mum-1
  ROOM_TYPE('rt-mum-1-sea', 'hotel-mum-1', 'Sea View Deluxe',  'Floor-to-ceiling windows facing Marine Drive. King bed, marble bathroom.',               8200, 2, 18, ['AC', 'WiFi', 'TV', 'Bathtub', 'Minibar']),
  ROOM_TYPE('rt-mum-1-ste', 'hotel-mum-1', 'Marine Suite',     'Two-bedroom suite with living room, rooftop access and in-room dining.',                14000, 6, 18, ['AC', 'WiFi', 'TV', 'Bathtub', 'Butler', 'Rooftop Access']),
];

export const findRoomType = (id) => roomTypes.find((r) => r.id === id);
export const roomsForHotel = (hotelId) => roomTypes.filter((r) => r.hotelId === hotelId);

// Recompute availableRooms on a room type from active bookings
export function refreshRoomType(rt) {
  const active = hotelBookings.filter(
    (b) => b.hotelId === rt.hotelId && b.roomType === rt.type && ['CONFIRMED', 'CHECKED_IN'].includes(b.status),
  );
  const occupied = active.reduce((sum, b) => sum + (b.rooms ?? 1), 0);
  rt.availableRooms = Math.max(0, rt.totalRooms - occupied);
  return rt;
}

// ── Traveller names for bookings ───────────────────────────────────────────────
const FIRST = ['Ananya', 'Rohan', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Imran', 'Priya', 'Dev', 'Nisha', 'Rahul', 'Tara', 'Kabir'];
const LAST  = ['Rao', 'Menon', 'Kulkarni', 'Bhatia', 'Joshi', 'Pillai', 'Shetty', 'Sheikh', 'Gupta', 'Das', 'Nair', 'Bose'];

function seedName(idx) {
  return `${FIRST[idx % FIRST.length]} ${LAST[Math.floor(idx / FIRST.length) % LAST.length]}`;
}

// ── Hotel bookings ─────────────────────────────────────────────────────────────
// Status enum mirrors backend/src/bookings/entities/booking.entity.ts BookingStatus.
// Every status represented: CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT
let bookingSeq = 1;
function makeBookingId() { return `XPL-HTL-${String(bookingSeq++).padStart(4, '0')}`; }

const bk = (hotelId, travellerId, guestIdx, checkInOffset, checkOutOffset, roomType, guests, rooms, status, notes = '') => {
  const guestName = seedName(guestIdx);
  const created = new Date();
  created.setDate(created.getDate() - (checkInOffset + 10));
  return {
    id: makeBookingId(),
    hotelId,
    travellerId,
    guestName,
    email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@mail.example`,
    phone: `+91 9${String(800000000 + guestIdx * 7919).padStart(9, '0')}`,
    checkIn: dayOffset(checkInOffset),
    checkOut: dayOffset(checkOutOffset),
    guests,
    roomType,
    notes,
    rooms,
    totalAmount: guests * 4800 * (checkOutOffset - checkInOffset),
    guestNames: [guestName],
    status,
    createdAt: created.toISOString(),
  };
};

export const hotelBookings = [
  // ── hotel-jpr-1: all statuses ────────────────────────────────────────────────
  bk('hotel-jpr-1', 'trav-301', 0,  2,  5,  'Deluxe Room',     2, 1, 'CONFIRMED', 'Late check-in requested.'),
  bk('hotel-jpr-1', 'trav-302', 1,  5,  8,  'Heritage Suite',  4, 1, 'CONFIRMED'),
  bk('hotel-jpr-1', 'trav-303', 2,  0,  3,  'Standard Room',   2, 1, 'CHECKED_IN'),
  bk('hotel-jpr-1', 'trav-304', 3, -5, -2,  'Standard Room',   1, 1, 'CHECKED_OUT'),
  bk('hotel-jpr-1', 'trav-305', 4, -10,-7,  'Deluxe Room',     2, 1, 'CHECKED_OUT'),
  bk('hotel-jpr-1', 'trav-306', 5,  3,  6,  'Standard Room',   2, 1, 'CANCELLED'),
  bk('hotel-jpr-1', 'trav-307', 6,  7, 10,  'Deluxe Room',     3, 1, 'CONFIRMED'),
  // Extra CONFIRMED so availableRooms calculation is visible
  bk('hotel-jpr-1', 'trav-308', 7,  1,  4,  'Deluxe Room',     2, 1, 'CONFIRMED'),

  // ── hotel-jpr-2: budget hotel ─────────────────────────────────────────────────
  bk('hotel-jpr-2', 'trav-310', 8,  1,  3,  'Double Room',  2, 1, 'CONFIRMED'),
  bk('hotel-jpr-2', 'trav-311', 9, -3, -1,  'Dormitory Bed', 1, 1, 'CHECKED_OUT'),
  bk('hotel-jpr-2', 'trav-312', 10, 4,  6, 'Double Room',   1, 1, 'CANCELLED'),

  // ── hotel-goa-1 ────────────────────────────────────────────────────────────────
  bk('hotel-goa-1', 'trav-320', 11, 2,  5,  'Sea View Room',    2, 1, 'CONFIRMED'),
  bk('hotel-goa-1', 'trav-321', 12, 5,  8,  'Beachfront Suite', 4, 1, 'CONFIRMED'),
  bk('hotel-goa-1', 'trav-322', 13, 0,  4,  'Deluxe Pool Room', 2, 1, 'CHECKED_IN'),
  bk('hotel-goa-1', 'trav-323', 14, -4, -1, 'Sea View Room',    2, 1, 'CHECKED_OUT'),
  bk('hotel-goa-1', 'trav-324', 15, 9,  12, 'Sea View Room',    1, 1, 'CONFIRMED'),
  bk('hotel-goa-1', 'trav-325', 0,  6,  9,  'Sea View Room',    2, 1, 'CANCELLED'),

  // ── hotel-del-1: single booking (one-item list test) ─────────────────────────
  bk('hotel-del-1', 'trav-330', 1,  3,  5,  'Standard Room',   2, 1, 'CONFIRMED'),

  // ── hotel-mum-1 ────────────────────────────────────────────────────────────────
  bk('hotel-mum-1', 'trav-340', 2,  1,  3,  'Sea View Deluxe', 2, 1, 'CONFIRMED'),
  bk('hotel-mum-1', 'trav-341', 3, -2,  0,  'Marine Suite',    4, 1, 'CHECKED_IN'),
  bk('hotel-mum-1', 'trav-342', 4,  6,  9,  'Sea View Deluxe', 2, 1, 'CONFIRMED'),
];

export const findHotelBooking = (id) => hotelBookings.find((b) => b.id === id);
export const bookingsForHotel = (hotelId) => hotelBookings.filter((b) => b.hotelId === hotelId);
export const bookingsForTraveller = (travellerId) => hotelBookings.filter((b) => b.travellerId === travellerId);

// ── Reviews for Hotels ────────────────────────────────────────────────────────
export const hotelReviews = [
  {
    id: 101,
    userId: 20001,
    userName: 'Ananya Rao',
    targetType: 'hotel',
    targetId: 'hotel-jpr-1',
    rating: 5,
    comment: 'The courtyard garden and breakfast were sublime! Authentic heritage experience in the heart of Jaipur. We loved the heritage suites and friendly hospitality.',
    createdAt: isoAt(-12),
  },
  {
    id: 102,
    userId: 20002,
    userName: 'Rohan Kulkarni',
    targetType: 'hotel',
    targetId: 'hotel-jpr-1',
    rating: 4,
    comment: 'Great hospitality and very courteous staff. The rooftop dinner view of Hawa Mahal was truly unforgettable. Will definitely visit again.',
    createdAt: isoAt(-8),
  },
  {
    id: 103,
    userId: 20003,
    userName: 'Meera Joshi',
    targetType: 'hotel',
    targetId: 'hotel-jpr-1',
    rating: 5,
    comment: 'Spacious Deluxe room with antique furnishings. The courtyard fountain makes mornings feel magical. Highly recommended.',
    createdAt: isoAt(-3),
  },
  {
    id: 104,
    userId: 20004,
    userName: 'Vikram Bhatia',
    targetType: 'hotel',
    targetId: 'hotel-jpr-2',
    rating: 4,
    comment: 'Clean budget rooms right by Sindhi Camp. Excellent value for money and super convenient location for exploring Jaipur.',
    createdAt: isoAt(-15),
  },
  {
    id: 105,
    userId: 20005,
    userName: 'Sneha Shetty',
    targetType: 'hotel',
    targetId: 'hotel-goa-1',
    rating: 5,
    comment: 'Breathtaking sea views and direct beach access. Breakfast spread was extraordinary and sunset cocktails were top notch!',
    createdAt: isoAt(-6),
  },
  {
    id: 106,
    userId: 20006,
    userName: 'Kabir Das',
    targetType: 'hotel',
    targetId: 'hotel-goa-1',
    rating: 4,
    comment: 'Lovely pool and chilled sunset vibe. The beach suite was spacious with comfortable beds. Very good service.',
    createdAt: isoAt(-2),
  },
  {
    id: 107,
    userId: 20007,
    userName: 'Imran Sheikh',
    targetType: 'hotel',
    targetId: 'hotel-del-1',
    rating: 5,
    comment: 'Colonial charm in central CP. Walking distance to Metro and Janpath. Very quiet rooms despite the central location.',
    createdAt: isoAt(-5),
  },
  {
    id: 108,
    userId: 20008,
    userName: 'Priya Gupta',
    targetType: 'hotel',
    targetId: 'hotel-mum-1',
    rating: 5,
    comment: 'Unmatched views of Marine Drive and the Queens Necklace. Luxurious rooms and world-class hospitality.',
    createdAt: isoAt(-4),
  },
];

export function refreshHotelReviews(h) {
  const revs = hotelReviews.filter((r) => r.targetId === h.id);
  h.reviewCount = revs.length;
  if (revs.length > 0) {
    const sum = revs.reduce((acc, r) => acc + r.rating, 0);
    h.rating = Math.round((sum / revs.length) * 10) / 10;
  } else {
    h.rating = 0;
  }
  return h;
}

// Seed availableRooms and review ratings
hotels.forEach((h) => {
  refreshHotel(h);
  refreshHotelReviews(h);
});
roomTypes.forEach(refreshRoomType);

// ── Earnings (read-only; calculated from CHECKED_OUT bookings by the server) ───
// Shape mirrors what the server would compute: per-booking line items + summary.
export function earningsForHotel(hotelId) {
  const completed = hotelBookings.filter(
    (b) => b.hotelId === hotelId && b.status === 'CHECKED_OUT',
  );
  const items = completed.map((b) => ({
    bookingId: b.id,
    guestName: b.guestName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    roomType: b.roomType,
    guests: b.guests,
    amount: b.totalAmount,
    paidAt: b.createdAt,
  }));
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  return { hotelId, items, total, currency: 'INR' };
}

// ── Utility ───────────────────────────────────────────────────────────────────
export const HOTEL_BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'];

let hotelSeq = 100;
export function newHotelId(partnerId) {
  hotelSeq += 1;
  const region = partnerId.split('-').slice(-1)[0];
  return `hotel-${region}-${hotelSeq}`;
}

let bookingIdSeq = bookingSeq;
export function newBookingId() {
  return `XPL-HTL-${String(bookingIdSeq++).padStart(4, '0')}`;
}

