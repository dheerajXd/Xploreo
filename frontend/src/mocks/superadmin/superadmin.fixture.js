/**
 * Xploreo SuperAdmin Domain Demo Fixtures
 * 
 * NOTE: All data in this file represents synthetic DEMO / SIMULATION fixtures
 * designed specifically for frontend preview and visual testing of SuperAdmin pages.
 * They do NOT represent real financial accounts, actual transactions, or production records.
 */

// ============================================================================
// 1. DASHBOARD & VELOCITY FIXTURES
// ============================================================================

export const DEMO_DASHBOARD_METRICS = {
  totalUsers: 1428,
  totalUsersChangePct: 12.5,
  grossRevenue: 3450000, // INR
  grossRevenueChangePct: 18.2,
  totalBookings: 326,
  totalBookingsChangePct: 8.4,
  activeTrips: 42,
  activeTripsChangePct: 14.1,
  periodLabel: 'vs last month',
};

export const DEMO_BOOKING_VELOCITY = {
  weekly: [
    { label: 'Mon', bookings: 12, revenue: 145000 },
    { label: 'Tue', bookings: 18, revenue: 210000 },
    { label: 'Wed', bookings: 15, revenue: 178000 },
    { label: 'Thu', bookings: 24, revenue: 310000 },
    { label: 'Fri', bookings: 32, revenue: 420000 },
    { label: 'Sat', bookings: 45, revenue: 580000 },
    { label: 'Sun', bookings: 38, revenue: 490000 },
  ],
  monthly: [
    { label: 'Week 1', bookings: 68, revenue: 780000 },
    { label: 'Week 2', bookings: 82, revenue: 920000 },
    { label: 'Week 3', bookings: 94, revenue: 1050000 },
    { label: 'Week 4', bookings: 112, revenue: 1280000 },
  ],
  quarterly: [
    { label: 'Month 1', bookings: 280, revenue: 3100000 },
    { label: 'Month 2', bookings: 340, revenue: 3850000 },
    { label: 'Month 3', bookings: 410, revenue: 4620000 },
  ],
};

export const DEMO_RECENT_BOOKINGS = [
  {
    id: 'BK-2026-081',
    customerName: 'Anjali Sharma',
    customerEmail: 'anjali@xploreo.com',
    role: 'traveller',
    serviceTitle: 'Royal Jaipur Heritage & Palaces',
    serviceType: 'package',
    amount: 24500,
    currency: 'INR',
    bookingDate: '2026-10-12T10:30:00Z',
    status: 'confirmed',
  },
  {
    id: 'BK-2026-080',
    customerName: 'Rohan Mehta',
    customerEmail: 'rohan.m@gmail.com',
    role: 'traveller',
    serviceTitle: 'Taj Rambagh Palace Stay',
    serviceType: 'hotel',
    amount: 18500,
    currency: 'INR',
    bookingDate: '2026-10-12T09:15:00Z',
    status: 'ongoing',
  },
  {
    id: 'BK-2026-079',
    customerName: 'Priya Iyer',
    customerEmail: 'priya.iyer@outlook.com',
    role: 'traveller',
    serviceTitle: 'Amer Fort Early Access Walk',
    serviceType: 'experience',
    amount: 3200,
    currency: 'INR',
    bookingDate: '2026-10-11T16:45:00Z',
    status: 'completed',
  },
  {
    id: 'BK-2026-078',
    customerName: 'Vikram Sengupta',
    customerEmail: 'vikram.s@yahoo.com',
    role: 'traveller',
    serviceTitle: 'Old Delhi Culinary Midnight Trail',
    serviceType: 'experience',
    amount: 4500,
    currency: 'INR',
    bookingDate: '2026-10-11T14:20:00Z',
    status: 'confirmed',
  },
  {
    id: 'BK-2026-077',
    customerName: 'Aditya Nair',
    customerEmail: 'aditya.n@gmail.com',
    role: 'traveller',
    serviceTitle: 'Goa Coastal Watersports & Sunset',
    serviceType: 'package',
    amount: 28000,
    currency: 'INR',
    bookingDate: '2026-10-10T11:00:00Z',
    status: 'cancelled',
  },
];

// ============================================================================
// 2. OPERATIONS & BOOKINGS FIXTURES (OPSBOOK)
// ============================================================================

export const DEMO_OPERATIONS_METRICS = {
  totalAnnualBookings: 1840,
  ongoingExperiences: 42,
  successfulCompletions: 1720,
  attritionRefundsCount: 38,
  attritionRefundsRate: 2.1, // 2.1% refund rate
};

export const DEMO_TRANSACTION_LEDGER = [
  {
    transactionId: 'TXN-9941',
    bookingId: 'BK-2026-081',
    customerName: 'Anjali Sharma',
    partnerName: 'The Heritage Haveli & Spa, Jaipur',
    partnerType: 'hotel',
    itemType: 'Package Stay',
    grossAmount: 24500,
    platformFee: 3675, // 15% platform fee
    netPayout: 20825,
    timestamp: '2026-10-12T10:32:00Z',
    status: 'settled',
  },
  {
    transactionId: 'TXN-9940',
    bookingId: 'BK-2026-080',
    customerName: 'Rohan Mehta',
    partnerName: 'Taj Rambagh Palace',
    partnerType: 'hotel',
    itemType: 'Hotel Booking',
    grossAmount: 18500,
    platformFee: 2775,
    netPayout: 15725,
    timestamp: '2026-10-12T09:16:00Z',
    status: 'pending',
  },
  {
    transactionId: 'TXN-9939',
    bookingId: 'BK-2026-079',
    customerName: 'Priya Iyer',
    partnerName: 'Jaipur Heritage Walks',
    partnerType: 'experience',
    itemType: 'Guided Experience',
    grossAmount: 3200,
    platformFee: 480,
    netPayout: 2720,
    timestamp: '2026-10-11T16:47:00Z',
    status: 'settled',
  },
  {
    transactionId: 'TXN-9938',
    bookingId: 'BK-2026-077',
    customerName: 'Aditya Nair',
    partnerName: 'Goa Coastal Escapes',
    partnerType: 'experience',
    itemType: 'Package Tour',
    grossAmount: 28000,
    platformFee: 0,
    netPayout: 0,
    timestamp: '2026-10-10T12:00:00Z',
    status: 'refunded',
  },
];

export const DEMO_REFUND_QUEUE = [
  {
    refundId: 'REF-201',
    bookingId: 'BK-2026-077',
    customerName: 'Aditya Nair',
    customerEmail: 'aditya.n@gmail.com',
    serviceTitle: 'Goa Coastal Watersports & Sunset',
    reason: 'Customer cancelled 48h prior due to medical emergency.',
    requestedAmount: 28000,
    requestedAt: '2026-10-10T11:45:00Z',
    status: 'approved',
    processedAt: '2026-10-10T12:00:00Z',
  },
  {
    refundId: 'REF-202',
    bookingId: 'BK-2026-072',
    customerName: 'Sanjay Deshmukh',
    customerEmail: 'sanjay.d@corp.com',
    serviceTitle: 'Kerala Backwater Luxury Houseboat',
    reason: 'Heavy monsoon storm caused canal closure; tour rescheduled.',
    requestedAmount: 16500,
    requestedAt: '2026-10-11T14:10:00Z',
    status: 'pending',
    processedAt: null,
  },
  {
    refundId: 'REF-203',
    bookingId: 'BK-2026-065',
    customerName: 'Natasha Fernandez',
    customerEmail: 'natasha.f@gmail.com',
    serviceTitle: 'Mumbai Marine Drive Sunset Walk',
    reason: 'Customer did not show up at designated meeting point.',
    requestedAmount: 2400,
    requestedAt: '2026-10-09T18:00:00Z',
    status: 'rejected',
    processedAt: '2026-10-10T09:30:00Z',
    reviewNotes: 'No-show without prior notice violates cancellation policy.',
  },
];

export const DEMO_DISPUTES = [
  {
    disputeId: 'DSP-104',
    bookingId: 'BK-2026-070',
    customerName: 'Kunal Kapoor',
    partnerName: 'Jaipur Haveli Stays',
    category: 'service_quality',
    severity: 'medium',
    status: 'under_review',
    openedAt: '2026-10-11T08:20:00Z',
    summary: 'Customer reports air conditioning failure in heritage room for 2 nights.',
  },
  {
    disputeId: 'DSP-103',
    bookingId: 'BK-2026-059',
    customerName: 'Meera Rajput',
    partnerName: 'Delhi Heritage Walks',
    category: 'cancellation',
    severity: 'low',
    status: 'resolved',
    openedAt: '2026-10-08T15:10:00Z',
    resolvedAt: '2026-10-09T11:00:00Z',
    summary: 'Guide delayed by 30 minutes due to road blockades. Partner provided complimentary refreshment.',
  },
];

// ============================================================================
// 3. USERS & PARTNERS FIXTURES
// ============================================================================

export const DEMO_USERS_AND_PARTNERS = [
  // 1. Guides
  {
    userId: 'G001',
    username: 'G001',
    name: 'Sreekar Joshi',
    email: 'sreekar@gmail.com',
    phone: '9876543210',
    role: 'guide',
    status: 'active',
    location: 'Jaipur',
    rating: 4.9,
    joinedAt: '2025-06-15',
    totalTripsOrBookings: 84,
    verified: true,
  },
  {
    userId: 'G002',
    username: 'G002',
    name: 'Rameshwar Vyas',
    email: 'rameshwar.v@gmail.com',
    phone: '9822334455',
    role: 'guide',
    status: 'active',
    location: 'Delhi',
    rating: 4.8,
    joinedAt: '2025-08-20',
    totalTripsOrBookings: 62,
    verified: true,
  },
  {
    userId: 'G003',
    username: 'G003',
    name: 'Dilip Sawant',
    email: 'dilip.s@gmail.com',
    phone: '9811223344',
    role: 'guide',
    status: 'inactive', // Restricted / Suspended
    location: 'Goa',
    rating: 3.9,
    joinedAt: '2025-11-10',
    totalTripsOrBookings: 19,
    verified: false,
  },

  // 2. Travelers
  {
    userId: 'T001',
    username: 'T001',
    name: 'Anjali Sharma',
    email: 'anjali@xploreo.com',
    phone: '9123456780',
    role: 'traveller',
    status: 'active',
    location: 'New Delhi',
    joinedAt: '2025-04-10',
    totalTripsOrBookings: 7,
    verified: true,
  },
  {
    userId: 'T002',
    username: 'T002',
    name: 'Rohan Mehta',
    email: 'rohan.m@gmail.com',
    phone: '9845012345',
    role: 'traveller',
    status: 'active',
    location: 'Mumbai',
    joinedAt: '2025-07-22',
    totalTripsOrBookings: 3,
    verified: true,
  },
  {
    userId: 'T003',
    username: 'T003',
    name: 'Vikram Sengupta',
    email: 'vikram.s@yahoo.com',
    phone: '9711882233',
    role: 'traveller',
    status: 'active',
    location: 'Kolkata',
    joinedAt: '2026-01-14',
    totalTripsOrBookings: 5,
    verified: true,
  },
  {
    userId: 'T004',
    username: 'T004',
    name: 'Aditya Nair',
    email: 'aditya.n@gmail.com',
    phone: '9900112233',
    role: 'traveller',
    status: 'inactive',
    location: 'Bengaluru',
    joinedAt: '2026-02-05',
    totalTripsOrBookings: 1,
    verified: false,
  },

  // 3. Hotel Partners
  {
    userId: 'HP001',
    username: 'HP001',
    name: 'The Heritage Haveli & Spa, Jaipur',
    email: 'hotel.partner@xploreo.com',
    phone: '9000000001',
    role: 'hotel',
    status: 'active',
    location: 'Jaipur',
    rating: 4.8,
    joinedAt: '2025-03-01',
    totalTripsOrBookings: 142,
    verified: true,
  },
  {
    userId: 'HP002',
    username: 'HP002',
    name: 'Taj Rambagh Palace, Jaipur',
    email: 'rambagh.palace@tajhotels.com',
    phone: '9000000011',
    role: 'hotel',
    status: 'active',
    location: 'Jaipur',
    rating: 5.0,
    joinedAt: '2025-05-12',
    totalTripsOrBookings: 98,
    verified: true,
  },
  {
    userId: 'HP003',
    username: 'HP003',
    name: 'Cidade de Goa Heritage Resort',
    email: 'contact@cidadedegoa.com',
    phone: '9000000022',
    role: 'hotel',
    status: 'active',
    location: 'Goa',
    rating: 4.6,
    joinedAt: '2025-09-08',
    totalTripsOrBookings: 115,
    verified: true,
  },

  // 4. Experience Partners
  {
    userId: 'XP001',
    username: 'XP001',
    name: 'Jaipur Royal Walking Tours',
    email: 'experience.partner@xploreo.com',
    phone: '9000000002',
    role: 'experience',
    status: 'active',
    location: 'Jaipur',
    rating: 4.9,
    joinedAt: '2025-03-15',
    totalTripsOrBookings: 210,
    verified: true,
  },
  {
    userId: 'XP002',
    username: 'XP002',
    name: 'Old Delhi Midnight Culinary Walk',
    email: 'delhi.foodies@tours.com',
    phone: '9000000033',
    role: 'experience',
    status: 'active',
    location: 'Delhi',
    rating: 4.7,
    joinedAt: '2025-07-19',
    totalTripsOrBookings: 178,
    verified: true,
  },
  {
    userId: 'XP003',
    username: 'XP003',
    name: 'Goa Catamaran & Sunset Sailings',
    email: 'sailing@goacoastal.com',
    phone: '9000000044',
    role: 'experience',
    status: 'inactive',
    location: 'Goa',
    rating: 4.1,
    joinedAt: '2025-10-04',
    totalTripsOrBookings: 46,
    verified: false,
  },
];

// ============================================================================
// 4. FINANCE & REPORTS FIXTURES
// ============================================================================

export const DEMO_FINANCE_METRICS = {
  totalGrossProcessing: 4850000, // INR
  netPlatformRevenue: 727500, // 15% platform commission
  partnerPayoutsTotal: 4122500,
  averageCommissionRate: 15.0, // 15%
  currency: 'INR',
  pendingPayoutsCount: 8,
  pendingPayoutsAmount: 185000,
};

export const DEMO_EARNINGS_SERIES = {
  weekly: [
    { period: 'Mon', grossProcessing: 145000, platformRevenue: 21750, partnerPayout: 123250 },
    { period: 'Tue', grossProcessing: 210000, platformRevenue: 31500, partnerPayout: 178500 },
    { period: 'Wed', grossProcessing: 178000, platformRevenue: 26700, partnerPayout: 151300 },
    { period: 'Thu', grossProcessing: 310000, platformRevenue: 46500, partnerPayout: 263500 },
    { period: 'Fri', grossProcessing: 420000, platformRevenue: 63000, partnerPayout: 357000 },
    { period: 'Sat', grossProcessing: 580000, platformRevenue: 87000, partnerPayout: 493000 },
    { period: 'Sun', grossProcessing: 490000, platformRevenue: 73500, partnerPayout: 416500 },
  ],
  monthly: [
    { period: 'Week 1', grossProcessing: 780000, platformRevenue: 117000, partnerPayout: 663000 },
    { period: 'Week 2', grossProcessing: 920000, platformRevenue: 138000, partnerPayout: 782000 },
    { period: 'Week 3', grossProcessing: 1050000, platformRevenue: 157500, partnerPayout: 892500 },
    { period: 'Week 4', grossProcessing: 1280000, platformRevenue: 192000, partnerPayout: 1088000 },
  ],
  yearly: [
    { period: 'Q1', grossProcessing: 3100000, platformRevenue: 465000, partnerPayout: 2635000 },
    { period: 'Q2', grossProcessing: 3850000, platformRevenue: 577500, partnerPayout: 3272500 },
    { period: 'Q3', grossProcessing: 4200000, platformRevenue: 630000, partnerPayout: 3570000 },
    { period: 'Q4', grossProcessing: 4850000, platformRevenue: 727500, partnerPayout: 4122500 },
  ],
};

export const DEMO_PAYOUTS = [
  {
    payoutId: 'PO-7001',
    recipientName: 'The Heritage Haveli & Spa, Jaipur',
    partnerType: 'hotel',
    amount: 142000,
    currency: 'INR',
    method: 'NEFT Bank Transfer',
    status: 'paid',
    initiatedAt: '2026-10-01T08:00:00Z',
    completedAt: '2026-10-02T14:30:00Z',
  },
  {
    payoutId: 'PO-7002',
    recipientName: 'Jaipur Royal Walking Tours',
    partnerType: 'experience',
    amount: 48500,
    currency: 'INR',
    method: 'UPI Direct',
    status: 'paid',
    initiatedAt: '2026-10-05T10:15:00Z',
    completedAt: '2026-10-05T10:16:00Z',
  },
  {
    payoutId: 'PO-7003',
    recipientName: 'Taj Rambagh Palace, Jaipur',
    partnerType: 'hotel',
    amount: 215000,
    currency: 'INR',
    method: 'RTGS Transfer',
    status: 'pending',
    initiatedAt: '2026-10-11T12:00:00Z',
    completedAt: null,
  },
  {
    payoutId: 'PO-7004',
    recipientName: 'Sreekar Joshi (Guide)',
    partnerType: 'guide',
    amount: 18200,
    currency: 'INR',
    method: 'UPI Direct',
    status: 'pending',
    initiatedAt: '2026-10-12T09:00:00Z',
    completedAt: null,
  },
  {
    payoutId: 'PO-7005',
    recipientName: 'Goa Coastal Escapes',
    partnerType: 'experience',
    amount: 32000,
    currency: 'INR',
    method: 'NEFT Bank Transfer',
    status: 'failed',
    initiatedAt: '2026-10-08T11:00:00Z',
    completedAt: null,
    failureReason: 'Invalid IFSC code / Beneficiary account suspended by bank.',
  },
];
