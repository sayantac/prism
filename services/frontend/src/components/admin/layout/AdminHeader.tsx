import { Home, LogOut, Menu, Moon, Settings, Sun, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks";
import { logout } from "@/store/slices/authSlice";
import { Button } from "../../ui/Button";
import { toggleTheme } from "@/store/slices/uiSlice";
import type { RootState } from "@/store";

export const AdminHeader: React.FC = () => {
  const { user } = useAdminAuth();
  
  const { theme } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();

  console.log("AdminHeader user object:", user);
  console.log("User first_name:", user?.first_name);
  console.log("User last_name:", user?.last_name);
  console.log("User email:", user?.email);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-base-100 border-b border-base-300 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo */}
            <Link to="/admin" className="flex items-center">
              <h1 className="ml-4 text-xl font-bold text-primary">
                Admin Dashboard
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                icon={<Home className="w-5 h-5" />}
                className="btn-circle"
                title="Back to Store"
              />
            </Link>

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
              className="btn-circle"
            />

            {/* User Menu */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-8 rounded-full">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-8 flex items-center justify-center">
                      <span className="text-xs font-semibold" style={{ textTransform: 'uppercase' }}>
                        {(() => {
                          const firstName = user?.first_name || "";
                          const lastName = user?.last_name || "";
                          const email = user?.email || "";
                          
                          if (firstName && lastName) {
                            return `${firstName[0]}${lastName[0]}`.toUpperCase();
                          }
                          if (firstName) {
                            return firstName[0].toUpperCase();
                          }
                          if (email) {
                            return email[0].toUpperCase();
                          }
                          return "AD";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span>
                    {user?.first_name} {user?.last_name}
                  </span>
                </li>
                <li>
                  <Link to="/profile">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/admin/settings">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </li>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
