import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/useAuth";

export const useAdminAuth = () => {
  const { user, isAdmin, isSuperAdmin, hasPermission, hasRole } = useAuth();
  const navigate = useNavigate();

  const canAccessAdmin = () => isAdmin || isSuperAdmin;

  const requiresPermission = (permission: string) => {
    if (!canAccessAdmin()) return false;
    return hasPermission(permission);
  };

  const requiresRole = (role: string) => {
    if (!canAccessAdmin()) return false;
    return hasRole(role);
  };

  const navigateToAdmin = (path = "") => {
    if (canAccessAdmin()) {
      navigate(`/admin${path}`);
    }
  };

  const adminUser = canAccessAdmin() ? user : null;

  return {
    user: adminUser,
    canAccessAdmin,
    requiresPermission,
    requiresRole,
    navigateToAdmin,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    hasRole,
  };
};
