import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/Button";

interface Alert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  dismissed?: boolean;
}

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      type: "warning",
      title: "Low Stock Alert",
      message: "5 products are running low on stock",
      timestamp: "5 minutes ago",
    },
    {
      id: "2",
      type: "info",
      title: "System Maintenance",
      message: "Scheduled maintenance window tonight at 2 AM",
      timestamp: "1 hour ago",
    },
    {
      id: "3",
      type: "success",
      title: "Backup Completed",
      message: "Daily backup completed successfully",
      timestamp: "2 hours ago",
    },
  ]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "error":
        return "alert-error";
      case "warning":
        return "alert-warning";
      case "info":
        return "alert-info";
      case "success":
        return "alert-success";
      default:
        return "alert-info";
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title">System Alerts</h3>
          <div className="badge badge-primary">{alerts.length}</div>
        </div>

        <div className="space-y-3 mt-4 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`alert ${getAlertStyle(alert.type)} shadow-sm`}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <h4 className="font-medium">{alert.title}</h4>
                  <p className="text-sm opacity-80">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-1">{alert.timestamp}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  shape="square"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {alerts.length === 0 && (
            <div className="text-center py-8 text-base-content/60">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
              <p>All clear! No active alerts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
