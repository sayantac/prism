/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Server,
  Wifi,
} from "lucide-react";
import { useGetSystemStatusQuery } from "@/store/api/adminApi";

export const SystemHealth: React.FC = () => {
  const { data: health, isLoading } = useGetSystemStatusQuery(undefined, {
    pollingInterval: 60000, // Poll every minute
  });

  if (isLoading) {
    return <div className="skeleton h-64 w-full"></div>;
  }

  const healthIndicators = [
    {
      name: "API Server",
      status: health?.api_status || "unknown",
      responseTime: health?.api_response_time || 0,
      icon: Server,
    },
    {
      name: "Database",
      status: health?.database_status || "unknown",
      responseTime: health?.database_response_time || 0,
      icon: Database,
    },
    {
      name: "Network",
      status: health?.network_status || "unknown",
      responseTime: health?.network_response_time || 0,
      icon: Wifi,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-error";
      default:
        return "text-base-content/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
      case "error":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">System Health</h3>

        <div className="space-y-4">
          {healthIndicators.map((indicator) => (
            <div
              key={indicator.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <indicator.icon className="w-5 h-5 text-base-content/70" />
                <span className="font-medium">{indicator.name}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-base-content/70">
                  {indicator.responseTime}ms
                </span>
                <div
                  className={`flex items-center gap-1 ${getStatusColor(
                    indicator.status
                  )}`}
                >
                  {getStatusIcon(indicator.status)}
                  <span className="text-sm capitalize">{indicator.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Health Score */}
        <div className="divider"></div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Overall Health</span>
          <div className="flex items-center gap-2">
            <div
              className="radial-progress text-success"
              style={{ "--value": health?.overall_score || 0 } as any}
            >
              {health?.overall_score || 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
