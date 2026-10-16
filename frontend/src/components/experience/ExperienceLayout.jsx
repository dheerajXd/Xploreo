import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar/navbar.jsx';

// Experience now shares the exact Traveller/Guide navbar (same component, same CSS) — see
// components/Navbar/navbar.jsx's EXPERIENCE_NAV_LINKS/EXPERIENCE_DROPDOWN_LINKS for its links.
export default function ExperienceLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
