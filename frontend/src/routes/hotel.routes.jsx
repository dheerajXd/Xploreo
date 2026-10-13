// M3: Hotel portal routes.
// No guard logic here — the router (M1's AppRouter) wraps this descriptor in the role guard.
// CSS prefix for all pages: .hotel-*

import { Navigate } from 'react-router-dom';

import HotelLayout    from '@/components/hotel/HotelLayout.jsx';
import HotelDashboard from '@/pages/Hotel/HotelDashboard.jsx';
import HotelRooms     from '@/pages/Hotel/HotelRooms.jsx';
import HotelBookings  from '@/pages/Hotel/HotelBookings.jsx';
import HotelEarnings  from '@/pages/Hotel/HotelEarnings.jsx';
import HotelReviews   from '@/pages/Hotel/HotelReviews.jsx';
import HotelProfile   from '@/pages/Hotel/HotelProfile.jsx';

export const hotelPortal = {
  basePath: '/hotel',
  layout: HotelLayout,
  requires: { partnerType: 'hotel' },
  homePath: '/hotel/dashboard',
  routes: [
    { index: true,       element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <HotelDashboard /> },
    { path: 'rooms',     element: <HotelRooms /> },
    { path: 'bookings',  element: <HotelBookings /> },
    { path: 'earnings',  element: <HotelEarnings /> },
    { path: 'reviews',   element: <HotelReviews /> },
    { path: 'profile',   element: <HotelProfile /> },
  ],
};


