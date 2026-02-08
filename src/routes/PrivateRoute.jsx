import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function PrivateRoute({ requiredRole }) {
  const auth = useAuth();
  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && !auth.roles?.includes(requiredRole)) {
    return <Navigate to="/denied" replace />;
  }
  return <Outlet />;
}
