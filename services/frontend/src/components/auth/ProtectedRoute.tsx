// // src/cemnnoopst / auth / ProtectedRoute.tsx;
// import type { ReactNode } from "react";
// import { useSelector } from "react-redux";
// import { Navigate, useLocation } from "react-router-dom";
// import type { RootState } from "../../store/store";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
//   const { isAuthenticated } = useSelector((state: RootState) => state.auth);
//   const location = useLocation();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return <>{children}</>;
// };
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = "/login",
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
