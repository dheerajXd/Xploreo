import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, user }) {

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
