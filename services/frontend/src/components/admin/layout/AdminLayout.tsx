import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.ui);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-base-200" data-theme={theme}>
      {/* Admin Header */}
      <AdminHeader />

      <div className="flex">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64  min-h-[calc(100vh-4rem)] bg-base-200">
          <div className="p-6">
            {/* Breadcrumbs */}
            <AdminBreadcrumbs />

            {/* Page Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};
