import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRole: 'worker' | 'buyer' | 'admin';
}

export default function RoleBasedRoute({ children, allowedRole }: RoleBasedRouteProps) {
  const { dbUser, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Verifying permissions...</div>;

  if (!dbUser || (dbUser.role !== allowedRole && !(allowedRole === 'admin' && dbUser.email === 'aminboni070@gmail.com'))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
