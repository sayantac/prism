import { Navigate, Route, Routes } from "react-router-dom";

// Admin Pages
import { AdminLayout } from "../../components/admin/layout/AdminLayout";
import { AdminAnalytics } from "@/pages";
import { AdminDashboard } from "@/pages";
import { AdminML } from "@/pages";
import {
  RecommendationManagement,
  UserSegmentationManagement,
} from "../../pages/admin/ml/AdminML";
import { AdminSettings } from "@/pages";
import { AIProductBundle } from "@/pages";
import { BannerManagement } from "@/pages";
import { AdminOrders } from "@/pages";
import { AdminProducts } from "@/pages";
import { AdminUsers } from "@/pages";
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
        <Route path="/gen" element={<BannerManagement />} />
        <Route path="/recommendation" element={<RecommendationManagement />} />
        <Route
          path="/user-segmentation"
          element={<UserSegmentationManagement />}
        />
        <Route path="/product-bundle" element={<AIProductBundle />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};
