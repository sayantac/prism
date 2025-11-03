import { Navigate, Route, Routes } from "react-router-dom";

// Admin Pages
import { AdminLayout } from "../components/layout/admin/AdminLayout";
import { AdminAnalytics } from "../pages/admin/AdminAnalytics";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import AdminML, {
  RecommendationManagement,
  UserSegmentationManagement,
} from "../pages/admin/AdminML";
import { AdminSettings } from "../pages/admin/AdminSettings";
import ProductBundleApp from "../pages/admin/AIProductBundle";
import Dashboard from "../pages/admin/BannerManagement";
import { AdminOrders } from "../pages/admin/OrderManagement";
import { AdminProducts } from "../pages/admin/ProductManagement";
import { AdminUsers } from "../pages/admin/UserManagement";
export const AdminRouter: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/products" element={<AdminProducts />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/analytics" element={<AdminAnalytics />} />
        <Route path="/ml" element={<AdminML />} />
        <Route path="/gen" element={<Dashboard />} />
        <Route path="/recommendation" element={<RecommendationManagement />} />
        <Route
          path="/user-segmentation"
          element={<UserSegmentationManagement />}
        />
        <Route path="/product-bundle" element={<ProductBundleApp />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

// import { Navigate, Route, Routes } from "react-router-dom";
// import { AdminProtectedRoute } from "../components/auth/AdminProtectedRoute";
// import { AdminLayout } from "../components/layout/admin/AdminLayout";
// import { AdminDashboard } from "../pages/admin/AdminDashboard";

// // Operations
// import { InventoryManagement } from "../pages/admin/InventoryManagement";
// import { OrderManagement } from "../pages/admin/OrderManagement";
// import { ProductManagement } from "../pages/admin/ProductManagement";
// import { UserManagement } from "../pages/admin/UserManagement";

// // Analytics & AI
// import { SearchAnalytics } from "../pages/admin/SearchAnalytics";
// import { UserAnalytics } from "../pages/admin/UserAnalytics";
// import { UserSegmentation } from "../pages/admin/UserSegmentation";

// // ML & Recommendations
// import { MlModelConfiguration } from "../pages/admin/MlModelConfiguration";
// import { RecommendationEngine } from "../pages/admin/RecommendationEngine";

// // System
// import { SystemAlerts } from "../pages/admin/SystemAlerts";
// import { SystemSettings } from "../pages/admin/SystemSettings";

// export const AdminRouter = () => {
//   return (
//     <AdminLayout>
//       <Routes>
//         {/* Dashboard */}
//         <Route
//           index
//           element={
//             <AdminProtectedRoute>
//               <AdminDashboard />
//             </AdminProtectedRoute>
//           }
//         />

//         {/* ===== OPERATIONS ===== */}
//         <Route
//           path="products/*"
//           element={
//             <AdminProtectedRoute requiredPermission="manage_products">
//               <ProductManagement />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="orders/*"
//           element={
//             <AdminProtectedRoute requiredPermission="view_orders">
//               <OrderManagement />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="users/*"
//           element={
//             <AdminProtectedRoute requiredPermission="view_users">
//               <UserManagement />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="inventory/*"
//           element={
//             <AdminProtectedRoute requiredPermission="manage_inventory">
//               <InventoryManagement />
//             </AdminProtectedRoute>
//           }
//         />

//         {/* ===== ANALYTICS & AI ===== */}
//         <Route
//           path="user-analytics/*"
//           element={
//             <AdminProtectedRoute requiredPermission="view_user_analytics">
//               <UserAnalytics />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="search-analytics/*"
//           element={
//             <AdminProtectedRoute requiredPermission="view_search_analytics">
//               <SearchAnalytics />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="user-segmentation/*"
//           element={
//             <AdminProtectedRoute requiredPermission="manage_user_segments">
//               <UserSegmentation />
//             </AdminProtectedRoute>
//           }
//         />

//         {/* ===== ML & RECOMMENDATIONS ===== */}
//         <Route
//           path="recommendation-engine/*"
//           element={
//             <AdminProtectedRoute>
//               <RecommendationEngine />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="ml-models/*"
//           element={
//             <AdminProtectedRoute requiredPermission="manage_ml_models">
//               <MlModelConfiguration />
//             </AdminProtectedRoute>
//           }
//         />

//         {/* ===== SYSTEM ===== */}
//         <Route
//           path="system-alerts/*"
//           element={
//             <AdminProtectedRoute requiredPermission="view_system_alerts">
//               <SystemAlerts />
//             </AdminProtectedRoute>
//           }
//         />

//         <Route
//           path="settings/*"
//           element={
//             <AdminProtectedRoute requiredPermission="manage_system">
//               <SystemSettings />
//             </AdminProtectedRoute>
//           }
//         />

//         {/* Catch all - redirect to dashboard */}
//         <Route path="*" element={<Navigate to="/admin" replace />} />
//       </Routes>
//     </AdminLayout>
//   );
// };
