import { Outlet } from 'react-router-dom';
import { Navbar, useAuth } from '@/foundation';

const LINKS = [
  { to: '/superadmin/dashboard', label: 'Executive Overview', icon: 'dashboard.svg' },
  { to: '/superadmin/users', label: 'Users & Partners', icon: 'user.svg' },
  { to: '/superadmin/admins', label: 'Admin Management', icon: 'user.svg' },
  { to: '/superadmin/finance', label: 'Finance & Reports', icon: 'earnings.svg' },
  { to: '/superadmin/operations', label: 'Operations & Ledger', icon: 'schedule.svg' },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  return (
    <>
      <Navbar
        links={LINKS}
        userName={user?.name || user?.username || 'SuperAdmin'}
        profileTo="/superadmin/users"
        onLogout={logout}
      />
      <main className="admin-portal-content">
        <Outlet />
      </main>
    </>
  );
}
