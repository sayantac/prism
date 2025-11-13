/* eslint-disable @typescript-eslint/no-explicit-any */
import { Clock, Package, ShoppingCart, User } from "lucide-react";
import { useGetRecentActivityQuery } from "@/store/api/adminApi";

export const RecentActivity: React.FC = () => {
  const { data: activityData, isLoading, error, refetch } = useGetRecentActivityQuery({ limit: 50, hours: 24 });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4" />;
      case "user":
        return <User className="w-4 h-4" />;
      case "product":
        return <Package className="w-4 h-4" />;
      case "audit":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "order":
        return "text-success";
      case "user":
        return "text-info";
      case "product":
        return "text-warning";
      case "audit":
        return "text-primary";
      default:
        return "text-base-content";
    }
  };

  if (isLoading) {
    return <div className="skeleton h-64 w-full"></div>;
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-6">
        <div className="flex items-center gap-2 text-error mb-4">
          <Clock className="w-5 h-5" />
          <span>Failed to load recent activity</span>
        </div>
        <button onClick={refetch} className="btn btn-error btn-sm">
          Retry
        </button>
      </div>
    );
  }

  const activities = activityData?.data?.activities || [];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">Recent Activity</h3>

        <div className="space-y-3 mt-4 max-h-64 overflow-y-auto">
          {activities.length > 0 ? (
            activities.slice(0, 10).map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors"
              >
                <div
                  className={`p-2 rounded-full bg-base-200 ${getActivityColor(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content">
                    {activity.title || activity.description || "Activity"}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {activity.details || "No additional details"}
                  </p>
                  <p className="text-xs text-base-content/50 mt-1">
                    {activity.timestamp
                      ? new Date(activity.timestamp).toLocaleTimeString()
                      : "Just now"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
