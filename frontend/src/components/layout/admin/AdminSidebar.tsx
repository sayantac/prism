import {
  BarChart3,
  Brain,
  FunnelPlus,
  Group,
  LucideMapPinCheckInside,
  Package,
  Target,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../../../hooks/useAdminAuth";

export const AdminSidebar: React.FC = () => {
  const { requiresPermission } = useAdminAuth();

  const navigation = [
    // CORE ADMIN SECTION
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: BarChart3,
      end: true,
    },

    // OPERATIONS SECTION
    {
      section: "Operations",
      items: [
        {
          name: "Products",
          href: "/admin/products",
          icon: Package,
          badge: "New",
          permission: "manage_products",
        },
        // {
        //   name: "Orders",
        //   href: "/admin/orders",
        //   icon: ShoppingCart,
        //   badge: "5",
        //   permission: "view_orders",
        // },
        // {
        //   name: "Users",
        //   href: "/admin/users",
        //   icon: Users,
        //   permission: "view_users",
        // },
      ],
    },

    // ANALYTICS & AI SECTION
    {
      section: "Analytics & AI",
      items: [
        // {
        //   name: "Analytics",
        //   href: "/admin/analytics",
        //   icon: TrendingUp,
        //   permission: "view_analytics",
        // },

        {
          name: "Models",
          href: "/admin/ml",
          icon: Brain,
          permission: "manage_ml_models",
        },
        {
          name: "Recommendations",
          href: "/admin/recommendation",
          icon: Target,
          permission: "manage_recommendations",
        },
        {
          name: "User Segmentation",
          href: "/admin/user-segmentation",
          icon: FunnelPlus,
          permission: "manage_banners",
        },
        {
          name: "Product Bundle",
          href: "/admin/product-bundle",
          icon: Group,
          permission: "manage_banners",
        },
        {
          name: "Personalized Banners",
          href: "/admin/gen",
          icon: LucideMapPinCheckInside,
          permission: "manage_banners",
        },

        // {
        //   name: "Search",
        //   href: "/admin/ml/search",
        //   icon: Search,
        //   permission: "manage_search",
        // },
      ],
    },

    // SYSTEM SECTION
    // {
    //   section: "System",
    //   items: [
    //     {
    //       name: "Settings",
    //       href: "/admin/settings",
    //       icon: Settings,
    //       permission: "manage_settings",
    //     },
    //   ],
    // },
  ];

  const renderNavItem = (item: any) => (
    <NavLink
      key={item.name}
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-content"
            : "text-base-content hover:bg-base-200"
        }`
      }
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.name}
    </NavLink>
  );

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-base-100 lg:border-r lg:border-base-300 lg:pt-16">
      <div className="flex flex-col justify-between flex-grow pt-5 pb-4 overflow-y-auto">
        <nav className="px-4 space-y-6">
          {navigation.map((navGroup, index) => {
            if (!navGroup.section) {
              // Single item (Dashboard)
              return renderNavItem(navGroup);
            }

            // Section with items
            const visibleItems = navGroup.items.filter((item: any) =>
              item.permission ? requiresPermission(item.permission) : true
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={navGroup.section}>
                <h3 className="px-4 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                  {navGroup.section}
                </h3>
                <div className="space-y-1">
                  {visibleItems.map(renderNavItem)}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Quick Stats Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-base-300">
          <div className="text-xs text-base-content/60">
            <div className="flex justify-between mb-1">
              <span>System Status</span>
              <span className="text-success">●</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
// import {
//   BarChart3,
//   BoxIcon,
//   LayoutDashboard,
//   Package,
//   Settings,
//   ShoppingCart,
//   Users,
// } from "lucide-react";
// import { NavLink } from "react-router-dom";
// import { useAdminAuth } from "../../../hooks/useAdminAuth";

// export const AdminSidebar: React.FC = () => {
//   const { requiresPermission } = useAdminAuth();

//   const navigation = [
//     {
//       name: "Dashboard",
//       href: "/admin",
//       icon: LayoutDashboard,
//       end: true,
//     },
//     {
//       name: "Products",
//       href: "/admin/products",
//       icon: Package,
//       permission: "manage_products",
//     },
//     {
//       name: "Categories",
//       href: "/admin/categories",
//       icon: BoxIcon,
//       permission: "manage_categories",
//     },
//     {
//       name: "Orders",
//       href: "/admin/orders",
//       icon: ShoppingCart,
//       permission: "view_orders",
//     },
//     {
//       name: "Users",
//       href: "/admin/users",
//       icon: Users,
//       permission: "view_users",
//     },
//     {
//       name: "Analytics",
//       href: "/admin/analytics",
//       icon: BarChart3,
//       permission: "view_analytics",
//     },
//     {
//       name: "Settings",
//       href: "/admin/settings",
//       icon: Settings,
//       permission: "manage_system",
//     },
//   ];

//   const filteredNavigation = navigation.filter((item) =>
//     item.permission ? requiresPermission(item.permission) : true
//   );

//   return (
//     <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-base-100 lg:border-r lg:border-base-300 lg:pt-16">
//       <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
//         <div className="flex items-center flex-shrink-0 px-4">
//           <h2 className="text-lg font-semibold text-base-content">
//             Admin Panel
//           </h2>
//         </div>
//         <nav className="mt-5 flex-1 px-2 space-y-1">
//           {filteredNavigation.map((item) => (
//             <NavLink
//               key={item.name}
//               to={item.href}
//               end={item.end}
//               className={({ isActive }) =>
//                 `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
//                   isActive
//                     ? "bg-primary text-primary-content"
//                     : "text-base-content hover:bg-base-200 hover:text-primary"
//                 }`
//               }
//             >
//               <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
//               {item.name}
//             </NavLink>
//           ))}
//         </nav>
//       </div>
//     </aside>
//   );
// };
