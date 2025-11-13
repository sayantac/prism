import { useGetQuickStatsQuery } from "@/store/api/adminApi";
import { DollarSign, RefreshCw, ShoppingCart, Users } from "lucide-react";

interface QuickStatsProps {
  className?: string;
}

export const QuickStats = ({ className = "" }: QuickStatsProps) => {
  const { data: stats, isLoading, error, refetch } = useGetQuickStatsQuery(undefined, {
    pollingInterval: 300000, // Poll every 5 minutes
  });

  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-base-100 border border-base-300 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-base-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-error/10 border border-error/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-error">
          <RefreshCw className="w-5 h-5" />
          <span>Failed to load quick stats</span>
        </div>
        <button onClick={refetch} className="btn btn-error btn-sm mt-2">
          Retry
        </button>
      </div>
    );
  }

  const statsData = stats?.data || {};

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Revenue Today */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/70">Revenue Today</p>
            <p className="text-2xl font-bold text-success">
              ${statsData.revenue_today?.toLocaleString() || 0}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-success/60" />
        </div>
      </div>

      {/* Orders Today */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/70">Orders Today</p>
            <p className="text-2xl font-bold text-primary">
              {statsData.orders_today || 0}
            </p>
          </div>
          <ShoppingCart className="w-8 h-8 text-primary/60" />
        </div>
      </div>

      {/* New Users Today */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/70">New Users Today</p>
            <p className="text-2xl font-bold text-info">
              {statsData.new_users_today || 0}
            </p>
          </div>
          <Users className="w-8 h-8 text-info/60" />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-base-content/70">System Status</p>
            <p className={`text-2xl font-bold ${
              statsData.system_status === "healthy" ? "text-success" :
              statsData.system_status === "warning" ? "text-warning" : "text-error"
            }`}>
              {statsData.system_status || "Unknown"}
            </p>
            <p className="text-xs text-base-content/50">
              Score: {statsData.performance_score || 0}%
            </p>
          </div>
          <div className={`w-8 h-8 rounded-full ${
            statsData.system_status === "healthy" ? "bg-success/20" :
            statsData.system_status === "warning" ? "bg-warning/20" : "bg-error/20"
          } flex items-center justify-center`}>
            <div className={`w-3 h-3 rounded-full ${
              statsData.system_status === "healthy" ? "bg-success" :
              statsData.system_status === "warning" ? "bg-warning" : "bg-error"
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};