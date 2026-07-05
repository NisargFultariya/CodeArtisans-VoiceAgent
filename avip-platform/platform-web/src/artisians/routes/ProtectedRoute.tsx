import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Wraps authenticated routes — redirects to /login if no user is present.
 */
export const ProtectedRoute: React.FC = () => {
  const { user } = useApp();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
