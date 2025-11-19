import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const AdminBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Remove 'admin' from pathnames for cleaner breadcrumbs
  const adminPathnames = pathnames.slice(1);

  const breadcrumbNames: Record<string, string> = {
    products: "Products",
    categories: "Categories",
    orders: "Orders",
    users: "Users",
    analytics: "Analytics",
    settings: "Settings",
  };

  return (
    <div className="breadcrumbs text-sm">
      <ul>
        <li>
          <Link to="/admin" className="flex items-center gap-1">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </li>
        {adminPathnames.map((pathname, index) => {
          const routeTo = `/admin/${adminPathnames
            .slice(0, index + 1)
            .join("/")}`;
          const isLast = index === adminPathnames.length - 1;
          const name = breadcrumbNames[pathname] || pathname;

          return (
            <li key={pathname}>
              {!isLast ? (
                <Link to={routeTo} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  {name}
                </Link>
              ) : (
                <span className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  {name}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
