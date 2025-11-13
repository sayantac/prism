import { TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { AdminDashboard as AD } from "../../../components/analytics/EnhancedCharts";
import { Loading } from "../../../components/ui/Loading";

import { UserBehaviorSummary } from "../../../components/admin/dashboard/UserBehaviorSummary";
import {
  useGetAdminDashboardQuery,
  useGetKpisQuery,
  useGetMlConfigsQuery,
  useGetRecommendationPerformanceQuery,
  useGetSegmentPerformanceQuery,
  useGetRealTimeStatsQuery ,
  useGetSystemStatusQuery,
  useGetUserSegmentsQuery,
} from "../../../store/api/adminApi";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error" | "info";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color = "primary",
}) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    error: "text-error bg-error/10",
    info: "text-info bg-info/10",
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base-content/60 text-sm">{title}</p>
            <p className="text-2xl font-bold text-base-content">{value}</p>
            {change && (
              <div className="flex items-center space-x-1 mt-1">
                {change.type === "increase" ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-error" />
                )}
                <span
                  className={`text-sm ${
                    change.type === "increase" ? "text-success" : "text-error"
                  }`}
                >
                  {Math.abs(change.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  // const { data: dashboardData, isLoading } = useGetAdminDashboardQuery({});
  // const { data: realtimeStats } = useGetRealtimeStatsQuery({});
  const { data: dashboardData, isLoading } = useGetAdminDashboardQuery({
    days: 90,
  });

  // Fetch KPIs (default: last 30 days)
  const { data: kpisData } = useGetKpisQuery({ days: 90 });

  // Fetch recommendation performance (default: last 30 days)
  const { data: recommendationPerformance } =
    useGetRecommendationPerformanceQuery({ days: 90 });

  // Fetch segment performance
  const { data: segmentPerformance } = useGetSegmentPerformanceQuery({});

  // Fetch user segments
  const { data: userSegments } = useGetUserSegmentsQuery({});

  // Fetch ML configurations
  const { data: mlConfigs } = useGetMlConfigsQuery({});

  // Fetch system status
  const { data: systemStatus } = useGetSystemStatusQuery({});

  // Fetch system configuration
  const { data: systemConfig } = useGetRealTimeStatsQuery({});

  // Log data for debugging
  console.log("useGetAdminDashboardQuery: ", dashboardData);
  console.log("useGetKpisQuery: ", kpisData);
  console.log(
    "useGetRecommendationPerformanceQuery: ",
    recommendationPerformance
  );
  console.log("useGetSegmentPerformanceQuery: ", segmentPerformance);
  console.log("useGetUserSegmentsQuery: ", userSegments);
  console.log("useGetMlConfigsQuery: ", mlConfigs);
  console.log("useGetSystemStatusQuery: ", systemStatus);
  console.log("useGetRealTimeStatsQuery: ", systemConfig);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
          <p className="text-base-content/70 mt-1">Monitor system performance and key metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="btn btn-outline btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>


      {/* Legacy Dashboard as fallback */}
      <AD />
    </div>
  );
};
