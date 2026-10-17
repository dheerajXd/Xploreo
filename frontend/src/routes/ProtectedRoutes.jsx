import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [], user }) {
  const location = useLocation();

  const isAuthenticated = Boolean(user && user.role && user.role !== "default");

  if (!isAuthenticated) {
    return <Navigate to="/Auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
