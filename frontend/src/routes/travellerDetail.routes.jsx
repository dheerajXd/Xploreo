// M3: Traveller browse-detail page routes (overflow from M5).
// Separate from M5's route file — M1 imports this into AppRouter once.
// CSS prefix for all pages: .trav-*
//
// ⚠️  Do NOT start building pages here until the page-count session confirms
//    which traveller detail pages move to M3 (Assumption 4 from the main plan).
//
// TODO (Phase 7): replace each placeholder element with the real page component.
import { Navigate } from 'react-router-dom';

import TravellerItemDetailPage from '@/pages/TravellerDetail/TravellerItemDetailPage.jsx';
import HotelDetailPage from '@/pages/TravellerDetail/HotelDetailPage.jsx';
import RoomDetailPage from '@/pages/TravellerDetail/RoomDetailPage.jsx';
import ExperienceDetailPage from '@/pages/TravellerDetail/ExperienceDetailPage.jsx';
import ReviewSubmitPage from '@/pages/TravellerDetail/ReviewSubmitPage.jsx';
import BookingConfirmationPage from '@/pages/TravellerDetail/BookingConfirmationPage.jsx';

// NOTE: basePath is intentionally not '/hotel' to avoid clashing with the hotel portal.
// Traveller-facing hotel detail lives at /hotels/:id (public route), not /hotel/*.
export const travellerDetailRoutes = [
  // Dedicated full details pages supporting hotels, experiences, and holiday packages
  { path: '/hotels/:id', element: <TravellerItemDetailPage defaultType="hotel" /> },
  { path: '/hotels/:id/rooms/:roomId', element: <RoomDetailPage /> },
  { path: '/experiences/:id', element: <TravellerItemDetailPage defaultType="experience" /> },
  { path: '/packages/:id', element: <TravellerItemDetailPage defaultType="package" /> },
  { path: '/plans/:id', element: <TravellerItemDetailPage defaultType="package" /> },
  { path: '/Traveller/details/:type/:id', element: <TravellerItemDetailPage /> },
  { path: '/reviews/new', element: <ReviewSubmitPage /> },
  { path: '/bookings/confirmation/:id', element: <BookingConfirmationPage /> },
  { path: '/bookings/:id', element: <BookingConfirmationPage /> },
];

