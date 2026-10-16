import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar/navbar.jsx';

// Hotel shares the Traveller/Guide navbar (same component, same CSS) — see
// components/Navbar/navbar.jsx's HOTEL_NAV_LINKS/HOTEL_DROPDOWN_LINKS for its links.
export default function HotelLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
