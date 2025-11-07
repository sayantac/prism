// src/components/layout/Header.tsx
import {
  BarChart3,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  ShoppingCart,
  Sun,
  User,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks";
import { useAuth } from "@/hooks";
import { useGetCurrentUserQuery } from "../../store/api/authApi";
import { useGetCartQuery } from "../../store/api/cartApi";
import { logout } from "../../store/slices/authSlice";
import {
  toggleCartDrawer,
  toggleSidebar,
  toggleTheme,
} from "../../store/slices/uiSlice";
import type { RootState } from "@/store";
import { SearchInput } from "../common/SearchInput";
import { Button } from "../ui/Button";

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const { theme } = useSelector((state: RootState) => state.ui);

  const { canAccessAdmin } = useAdminAuth();
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: user } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-base-100 border-b border-base-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => dispatch(toggleSidebar())}
              icon={<Menu className="w-5 h-5" />}
            />

            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
                PRISM
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-8">
            <SearchInput
              placeholder="Search for products, brands and more..."
              onSearch={handleSearch}
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => navigate("/search")}
              icon={<Search className="w-5 h-5" />}
            />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(toggleTheme())}
              icon={
                theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )
              }
            />

            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/wishlist")}
                  icon={<Heart className="w-5 h-5" />}
                /> */}

                {/* Cart */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(toggleCartDrawer())}
                    icon={<ShoppingCart className="w-5 h-5" />}
                  />
                  {!!cart?.total_items && cart.total_items > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary/60 border border-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.total_items}
                    </span>
                  )}
                </div>

                {/* User Menu */}
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-ghost btn-circle avatar"
                  >
                    <div className="w-8 rounded-full">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8">
                          <span className="text-sm">
                            {user?.first_name?.[0] || user?.email?.[0] || "U"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul
                    tabIndex={0}
                    className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    <li className="menu-title">
                      <span>
                        {user?.first_name} {user?.last_name}
                      </span>
                    </li>
                    <li>
                      <Link to="/profile" className="justify-between">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/orders" className="justify-between">
                        <span className="flex items-center">
                          <Package className="w-4 h-4 mr-2" />
                          Orders
                        </span>
                      </Link>
                    </li>
                    {canAccessAdmin() && (
                      <li>
                        <Link to="/admin" className="justify-between">
                          <span className="flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Admin Panel
                          </span>
                        </Link>
                      </li>
                    )}

                    <div className="divider my-1"></div>
                    <li>
                      <button onClick={handleLogout} className="text-error">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/register")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
