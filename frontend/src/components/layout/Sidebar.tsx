/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/layout/Sidebar.tsx
import { AnimatePresence, motion } from "framer-motion";
import { Grid, Home, Package, Search, Tag, TrendingUp, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetCategoriesQuery } from "../../store/api/productApi";
import { setSidebarOpen } from "../../store/slices/uiSlice";
import type { RootState } from "../../store/store";
import { Button } from "../ui/Button";

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { data: categories } = useGetCategoriesQuery({});

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "All Products", href: "/products", icon: Package },
    { name: "Search", href: "/search", icon: Search },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Categories", href: "/categories", icon: Grid },
  ];

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => dispatch(setSidebarOpen(false))}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-base-100 border-r border-base-200 z-50 lg:hidden overflow-y-auto"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-base-content">
                  Menu
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(setSidebarOpen(false))}
                  icon={<X className="w-5 h-5" />}
                  className="btn-circle"
                />
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-3 py-2 text-base-content hover:bg-base-200 rounded-lg transition-colors"
                    onClick={() => dispatch(setSidebarOpen(false))}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-base-content/70 uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {categories.map((category: any) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${category.id}`}
                        className="flex items-center px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 rounded-lg transition-colors"
                        onClick={() => dispatch(setSidebarOpen(false))}
                      >
                        <Tag className="w-4 h-4 mr-3" />
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
// import { AnimatePresence, motion } from "framer-motion";
// import { Home, Package, Search, Tag, TrendingUp, X } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { Link } from "react-router-dom";
// import { useGetCategoriesQuery } from "../../store/api/productApi";
// import { setSidebarOpen } from "../../store/slices/uiSlice";
// import type { RootState } from "../../store/store";
// import { Button } from "../ui/Button";

// export const Sidebar: React.FC = () => {
//   const dispatch = useDispatch();
//   const { sidebarOpen } = useSelector((state: RootState) => state.ui);
//   const { data: categories } = useGetCategoriesQuery({});

//   const navigation = [
//     { name: "Home", href: "/", icon: Home },
//     { name: "All Products", href: "/products", icon: Package },
//     { name: "Search", href: "/search", icon: Search },
//     { name: "Trending", href: "/trending", icon: TrendingUp },
//   ];

//   return (
//     <AnimatePresence>
//       {sidebarOpen && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
//             onClick={() => dispatch(setSidebarOpen(false))}
//           />

//           {/* Sidebar */}
//           <motion.div
//             initial={{ x: -300 }}
//             animate={{ x: 0 }}
//             exit={{ x: -300 }}
//             transition={{ type: "tween", duration: 0.3 }}
//             className="fixed left-0 top-0 bottom-0 w-80 bg-base-100 border-r border-base-200 z-50 lg:hidden overflow-y-auto"
//           >
//             <div className="p-4">
//               {/* Header */}
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-lg font-semibold text-base-content">
//                   Menu
//                 </h2>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   shape="square"
//                   onClick={() => dispatch(setSidebarOpen(false))}
//                 >
//                   <X className="w-5 h-5" />
//                 </Button>
//               </div>

//               {/* Navigation */}
//               <ul className="menu bg-base-100 w-full">
//                 {navigation.map((item) => (
//                   <li key={item.name}>
//                     <Link
//                       to={item.href}
//                       onClick={() => dispatch(setSidebarOpen(false))}
//                       className="text-base-content hover:bg-base-200 hover:text-primary active:bg-primary active:text-primary-content"
//                     >
//                       <item.icon className="w-5 h-5" />
//                       {item.name}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>

//               {/* Categories */}
//               {categories && categories.length > 0 && (
//                 <div className="mt-8">
//                   <div className="divider text-base-content">
//                     <Tag className="w-4 h-4 mr-2" />
//                     Categories
//                   </div>
//                   <ul className="menu bg-base-100 w-full">
//                     {categories.slice(0, 10).map((category: any) => (
//                       <li key={category.id}>
//                         <Link
//                           to={`/products?category=${category.name}`}
//                           onClick={() => dispatch(setSidebarOpen(false))}
//                           className="text-base-content hover:bg-base-200 hover:text-primary active:bg-primary active:text-primary-content text-sm"
//                         >
//                           <div className="w-2 h-2 bg-primary rounded-full"></div>
//                           {category.name}
//                         </Link>
//                       </li>
//                     ))}
//                   </ul>

//                   {categories.length > 10 && (
//                     <div className="mt-2 text-center">
//                       <Link
//                         to="/categories"
//                         onClick={() => dispatch(setSidebarOpen(false))}
//                         className="btn btn-ghost btn-sm text-base-content"
//                       >
//                         View All Categories
//                       </Link>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Quick Actions */}
//               <div className="mt-8">
//                 <div className="divider text-base-content">Quick Actions</div>
//                 <div className="space-y-2">
//                   <Link
//                     to="/wishlist"
//                     onClick={() => dispatch(setSidebarOpen(false))}
//                     className="btn btn-outline btn-sm w-full justify-start"
//                   >
//                     ❤️ Wishlist
//                   </Link>
//                   <Link
//                     to="/orders"
//                     onClick={() => dispatch(setSidebarOpen(false))}
//                     className="btn btn-outline btn-sm w-full justify-start"
//                   >
//                     📦 My Orders
//                   </Link>
//                   <Link
//                     to="/profile"
//                     onClick={() => dispatch(setSidebarOpen(false))}
//                     className="btn btn-outline btn-sm w-full justify-start"
//                   >
//                     👤 Profile
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };
