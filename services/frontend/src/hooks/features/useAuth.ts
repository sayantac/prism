/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useAuth.ts - Updated for new API structure
import { useSelector } from "react-redux";
import { useGetCurrentUserQuery } from "../../store/api/authApi";
import type { RootState } from "@/store";

export const useAuth = () => {
  const {
    isAuthenticated,
    token,
    user: storeUser,
  } = useSelector((state: RootState) => state.auth);

  const {
    data: user,
    isLoading,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Use store user if available, fallback to API user
  const currentUser = storeUser || user;

  // Check if user is admin based on new role structure
  const isAdmin = currentUser?.roles?.some(
    (role: any) => role.name === "admin" || role.name === "super_admin"
  );

  const isSuperAdmin =
    (currentUser as any)?.is_superuser ||
    currentUser?.roles?.some((role: any) => role.name === "admin");

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return currentUser?.permissions?.includes(permission) || false;
  };

  // Check if user has specific role
  const hasRole = (roleName: string) => {
    return (
      currentUser?.roles?.some((role: any) => role.name === roleName) || false
    );
  };

  // Check if user can access admin panel
  const canAccessAdmin = () => {
    return (
      isSuperAdmin ||
      hasRole("admin") ||
      hasRole("super_admin") ||
      hasPermission("admin.access") ||
      hasPermission("*")
    );
  };

  // Get user's full name
  const getFullName = () => {
    if (!currentUser) return "";
    return `${currentUser.first_name} ${currentUser.last_name}`.trim();
  };

  // Check if user is verified
  const isVerified = (currentUser as any)?.email_verified || false;

  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    error,
    token,
    isAdmin,
    isSuperAdmin,
    isVerified,
    hasPermission,
    hasRole,
    canAccessAdmin,
    getFullName,
  };
};
