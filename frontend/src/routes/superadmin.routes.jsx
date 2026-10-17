import { Navigate } from 'react-router-dom';
import SuperAdminLayout from '@/components/superadmin/SuperAdminLayout.jsx';
import SuperAdminDashboardPage from '@/pages/SuperAdmin/dashboard.jsx';
import SuperAdminUsersPage from '@/pages/SuperAdmin/users.jsx';
import SuperAdminAdminsPage from '@/pages/SuperAdmin/admins.jsx';
import SuperAdminFinancePage from '@/pages/SuperAdmin/finance.jsx';
import SuperAdminOpsBookPage from '@/pages/SuperAdmin/opsbook.jsx';

export const superadminPortal = {
  basePath: '/superadmin',
  layout: SuperAdminLayout,
  requires: { role: 'superadmin' },
  homePath: '/superadmin/dashboard',
  routes: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <SuperAdminDashboardPage /> },
    { path: 'users', element: <SuperAdminUsersPage /> },
    { path: 'admins', element: <SuperAdminAdminsPage /> },
    { path: 'finance', element: <SuperAdminFinancePage /> },
    { path: 'operations', element: <SuperAdminOpsBookPage /> },
  ],
};
