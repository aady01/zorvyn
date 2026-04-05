import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './protected-route';
import { RoleGate } from './role-gate';
import DashboardLayout from '@/components/layout/dashboard-layout';

import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';
import DashboardPage from '@/pages/dashboard/index';
import RecordsPage from '@/pages/records/index';
import BudgetsPage from '@/pages/budgets/index';
import TeamsPage from '@/pages/teams/index';
import UsersPage from '@/pages/users/index';
import SettingsPage from '@/pages/settings/index';

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'records', element: <RecordsPage /> },
          {
            element: <RoleGate allowedRoles={['MANAGER', 'ADMIN']} />,
            children: [
              { path: 'budgets', element: <BudgetsPage /> },
            ],
          },
          {
            element: <RoleGate allowedRoles={['ADMIN']} />,
            children: [
              { path: 'teams', element: <TeamsPage /> },
              { path: 'users', element: <UsersPage /> },
            ],
          },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <LoginPage />,
  },
]);
