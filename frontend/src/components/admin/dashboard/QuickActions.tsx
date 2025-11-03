import { motion } from "framer-motion";
import {
  BarChart3,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../../hooks/useAdminAuth";
import { Button } from "../../ui/Button";

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { requiresPermission } = useAdminAuth();

  const actions = [
    {
      title: "Add Product",
      description: "Create a new product",
      icon: Plus,
      color: "btn-primary",
      onClick: () => navigate("/admin/products/new"),
      permission: "manage_products",
    },
    {
      title: "Manage Users",
      description: "View and edit users",
      icon: Users,
      color: "btn-secondary",
      onClick: () => navigate("/admin/users"),
      permission: "view_users",
    },
    {
      title: "View Orders",
      description: "Manage orders",
      icon: ShoppingCart,
      color: "btn-accent",
      onClick: () => navigate("/admin/orders"),
      permission: "view_orders",
    },
    {
      title: "Analytics",
      description: "View reports",
      icon: BarChart3,
      color: "btn-info",
      onClick: () => navigate("/admin/analytics"),
      permission: "view_analytics",
    },
    {
      title: "Products",
      description: "Manage inventory",
      icon: Package,
      color: "btn-success",
      onClick: () => navigate("/admin/products"),
      permission: "view_products",
    },
    {
      title: "Settings",
      description: "System settings",
      icon: Settings,
      color: "btn-warning",
      onClick: () => navigate("/admin/settings"),
      permission: "manage_system",
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.permission ? requiresPermission(action.permission) : true
  );

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {filteredActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 w-full hover:shadow-lg transition-shadow"
                onClick={action.onClick}
              >
                <action.icon className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
