/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Server,
  Wifi,
} from "lucide-react";
import { useGetSystemHealthQuery } from "@/store/api/adminApi";

export const SystemHealth: React.FC = () => {
  const { data: health, isLoading, error, refetch } = useGetSystemHealthQuery(
    undefined,
    {
      pollingInterval: 60000, // Poll every minute
    }
  );

  console.log("SystemHealth component - health data:", health);

  if (isLoading) {
    return <div className="skeleton h-64 w-full"></div>;
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-6">
        <div className="flex items-center gap-2 text-error mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span>Failed to load system health</span>
        </div>
        <button onClick={refetch} className="btn btn-error btn-sm">
          Retry
        </button>
      </div>
    );
  }

  const healthData = health?.data || {};
  const components = healthData.components || {};

  const healthIndicators = Object.entries(components).map(
    ([name, component]: [string, any]) => ({
      name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      status: component.status,
      responseTime: component.response_time_ms || 0,
      message: component.message,
      icon: name === "database" ? Database : name === "api" ? Server : Wifi,
    })
  );

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

        {/* Overall Health Status */}
        <div className="divider"></div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Overall Health</span>
          <div className="flex items-center gap-2">
            {health?.overall_status === "healthy" && (
              <CheckCircle className="w-5 h-5 text-success" />
            )}
            {health?.overall_status === "warning" && (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            {health?.overall_status === "critical" && (
              <AlertTriangle className="w-5 h-5 text-error" />
            )}
            <span className="font-medium capitalize">
              {health?.overall_status || "unknown"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
