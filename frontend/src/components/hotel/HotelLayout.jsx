import { Outlet } from 'react-router-dom';
import { Navbar, useAuth } from '@/foundation';

const LINKS = [
  { to: '/hotel/dashboard', label: 'Dashboard', icon: 'dashboard.svg' },
  { to: '/hotel/rooms', label: 'Rooms & Inventory', icon: 'tours.svg' },
  { to: '/hotel/bookings', label: 'Bookings', icon: 'schedule.svg' },
  { to: '/hotel/earnings', label: 'Earnings', icon: 'earnings.svg' },
  { to: '/hotel/reviews', label: 'Reviews', icon: 'reviews.svg' },
];

export default function HotelLayout() {
  const { user, logout } = useAuth();
  return (
    <>
      <Navbar
        links={LINKS}
        userName={user?.businessName || user?.name || 'Hotel Partner'}
        profileTo="/hotel/profile"
        onLogout={logout}
      />
      <Outlet />
    </>
  );
}
