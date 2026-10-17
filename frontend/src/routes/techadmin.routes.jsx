import { Navigate } from 'react-router-dom';
import TechAdminLayout from '@/components/techadmin/TechAdminLayout.jsx';
import TechAdminDashboard from '@/pages/TechAdmin/dashboard.jsx';
import TechAdminTicketsPage from '@/pages/TechAdmin/tickets.jsx';
// Reuses the exact Super Admin Users & Partners page — Tech Admin just gets a narrower slice of
// it (view + suspend/restore only; no create/edit), enforced both here (hidden buttons) and on
// the server (backend/src/auth/auth.service.ts#update rejects anything beyond status for Tech Admin).
import SuperAdminUsersPage from '@/pages/SuperAdmin/users.jsx';

export const techadminPortal = {
  basePath: '/tech-admin',
  layout: TechAdminLayout,
  requires: { role: 'techadmin' },
  homePath: '/tech-admin/dashboard',
  routes: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <TechAdminDashboard /> },
    { path: 'users', element: <SuperAdminUsersPage /> },
    { path: 'tickets', element: <TechAdminTicketsPage /> },
  ],
};
