import { createBrowserRouter, redirect, Outlet } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Containers from './pages/Containers';
import AssignedContainers from './pages/AssignedContainers';
import RegisterVehicle from './pages/RegisterVehicle';
import Profile from './pages/Profile';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import Help from './pages/Help';

// Auth guard loader
const protectedLoader = () => {
  const user = useAuthStore.getState().user;
  if (!user) return redirect('/login');
  return null;
};

export const router = createBrowserRouter(
  [
    {
      path: '/',
    element: <DashboardLayout><Outlet /></DashboardLayout>,
    errorElement: <ErrorBoundary />,
    loader: protectedLoader,
    children: [
      {
        index: true, // Use index: true for the default child route
        element: <Dashboard />
      },
      {
        path: '/containers',
        element: <Containers />
      },
      {
        path: '/assigned-containers',
        element: <AssignedContainers />
      },      {
        path: '/vehicles/register',
        element: <RegisterVehicle />
      },
      {
        path: '/profile',
        element: <Profile />
      },
      {
        path: '/help',
        element: <Help />
      }
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />  }
], {
  future: {
    v7_relativeSplatPath: true
  }
});
