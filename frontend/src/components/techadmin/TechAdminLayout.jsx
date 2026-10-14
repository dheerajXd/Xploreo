import { Outlet } from 'react-router-dom';
import { Navbar, useAuth } from '@/foundation';

const LINKS = [
  { to: '/tech-admin/dashboard', label: 'Support Dashboard', icon: 'dashboard.svg' },
  { to: '/tech-admin/tickets', label: 'Ticket Queue', icon: 'support.svg' },
];

export default function TechAdminLayout() {
  const { user, logout } = useAuth();
  return (
    <>
      <Navbar
        links={LINKS}
        userName={user?.name || user?.username || 'Tech Admin'}
        profileTo="/tech-admin/dashboard"
        onLogout={logout}
      />
      <main className="admin-portal-content">
        <Outlet />
      </main>
    </>
  );
}
