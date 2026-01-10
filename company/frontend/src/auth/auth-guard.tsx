import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { hasValidRole } from 'src/layouts/nav-config-dashboard';

import { useAuth } from './auth-context';

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Check if user has valid roles
  const userRoles = user.roles || [];
  const hasAccess = hasValidRole(userRoles);

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}
