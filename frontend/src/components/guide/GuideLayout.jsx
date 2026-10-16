import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar/navbar.jsx';

// Guide now shares the exact Traveller navbar (same component, same CSS) — see
// components/Navbar/navbar.jsx's GUIDE_NAV_LINKS/GUIDE_DROPDOWN_LINKS for its links.
export default function GuideLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
