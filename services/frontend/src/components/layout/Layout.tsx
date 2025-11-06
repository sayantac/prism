// src/components/layout/Layout.tsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { CartDrawer } from "../cart/CartDrawer";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    // Also update the class for better compatibility
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-base-200" data-theme={theme}>
      <Header />
      <Sidebar />
      <CartDrawer />

      <main className="min-h-[calc(100vh-4rem)] bg-base-200">{children}</main>

      <footer className="footer footer-center p-4 bg-base-300 text-base-content border-t border-base-200">
        <aside>
          <p className="text-base-content/70">
            Copyright © 2024 - All rights reserved by Store Ltd.
          </p>
        </aside>
      </footer>
    </div>
  );
};
