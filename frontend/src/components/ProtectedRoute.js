// src/components/ProtectedRoute.js
import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute() {
  const { auth, loading } = useContext(AuthContext);

  // While the token is still being verified (e.g. right after a hard
  // refresh), auth.user is legitimately null -- redirecting here would
  // bounce a logged-in user to /signin before we actually know they're
  // logged out.
  if (loading) return null;

  return auth.token && auth.user ? <Outlet /> : <Navigate to="/signin" />;
}

export default ProtectedRoute;
