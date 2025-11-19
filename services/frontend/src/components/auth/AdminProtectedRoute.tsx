import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks";
import { useAuth } from "@/hooks";
import { useGetCurrentUserQuery } from "../../store/api/authApi";
import { Loading } from "../ui/Loading";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const { data: user, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { canAccessAdmin } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  const hasAdminAccess = canAccessAdmin();

  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
