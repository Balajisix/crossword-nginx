import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // For admin users: if they are NOT in an admin route, force redirect to /admin/panel
  if (isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/panel" replace />;
  }

  // For regular users: if they are trying to access an admin route, force redirect to /home
  if (!isAdmin && location.pathname.startsWith('/admin')) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
