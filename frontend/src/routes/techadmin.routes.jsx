import { Navigate } from 'react-router-dom';
import TechAdminLayout from '@/components/techadmin/TechAdminLayout.jsx';
import TechAdminDashboard from '@/pages/TechAdmin/dashboard.jsx';
import TechAdminTicketsPage from '@/pages/TechAdmin/tickets.jsx';
import TechAdminUsersPage from '@/pages/TechAdmin/users.jsx';

export const techadminPortal = {
  basePath: '/tech-admin',
  layout: TechAdminLayout,
  requires: { role: 'techadmin' },
  homePath: '/tech-admin/dashboard',
  routes: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <TechAdminDashboard /> },
    { path: 'tickets', element: <TechAdminTicketsPage /> },
    { path: 'users', element: <TechAdminUsersPage /> },
  ],
};
