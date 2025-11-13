import { useGetUserBehaviorSummaryQuery } from "@/store/api/adminApi";
import { Eye, MousePointer, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";

interface UserBehaviorSummaryProps {
  className?: string;
}

export const UserBehaviorSummary = ({ className = "" }: UserBehaviorSummaryProps) => {
  const { data: behavior, isLoading, error, refetch } = useGetUserBehaviorSummaryQuery({ days: 30 });

  const behaviorData = useMemo(() => {
    if (!behavior) return null;

    const userActions = behavior.user_actions || {};
    const mostViewedProducts = behavior.most_viewed_products || [];

    return {
      activeUsers: behavior.active_users || 0,
      totalActions: Object.values(userActions).reduce((sum: number, count: any) => sum + count, 0) as number,
      actionBreakdown: userActions,
      mostViewedProducts: mostViewedProducts.slice(0, 5), // Top 5
    };
  }, [behavior]);

  if (isLoading) {
    return (
      <div className={`bg-base-100 border border-base-300 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-base-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-base-300 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-base-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-error/10 border border-error/20 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-error mb-4">
          <Users className="w-5 h-5" />
          <span>Failed to load user behavior data</span>
        </div>
        <button onClick={refetch} className="btn btn-error btn-sm">
          Retry
        </button>
      </div>
    );
  }

  if (!behaviorData) {
    return (
      <div className={`bg-base-100 border border-base-300 rounded-lg p-6 ${className}`}>
        <p className="text-base-content/50">No user behavior data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-base-100 border border-base-300 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Behavior Summary
        </h3>
        <span className="text-sm text-base-content/60">
          Last {behavior?.period_days || 30} days
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary/10 rounded-lg p-4 border border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Active Users</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {behaviorData.activeUsers}
          </div>
        </div>

        <div className="bg-info/10 rounded-lg p-4 border border-info">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer className="w-4 h-4 text-info" />
            <span className="text-sm font-medium">Total Actions</span>
          </div>
          <div className="text-2xl font-bold text-info">
            {behaviorData.totalActions.toLocaleString()}
          </div>
        </div>

        {/* <div className="bg-base-200/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Settings Views</span>
          </div>
          <div className="text-2xl font-bold text-success">
            {behaviorData.actionBreakdown.SETTINGS_VIEWED || 0}
          </div>
        </div> */}

        <div className="bg-warning/5 border border-warning rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Product Views</span>
          </div>
          <div className="text-2xl font-bold text-warning">
            {behaviorData.actionBreakdown.VIEW_PRODUCT || 0}
          </div>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Action Breakdown</h4>
        <div className="space-y-2">
          {Object.entries(behaviorData.actionBreakdown).map(([action, count]: [string, any]) => (
            <div key={action} className="flex items-center justify-between p-2 bg-base-200/30 rounded">
              <span className="text-sm capitalize">{action.replace("_", " ").toLowerCase()}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most Viewed Products */}
      <div>
        <h4 className="text-sm font-medium mb-3">Most Viewed Products</h4>
        <div className="space-y-2">
          {behaviorData.mostViewedProducts.map((product: any, index: number) => (
            <div key={product.product_id || index} className="flex items-center justify-between p-3 bg-base-200/30 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-base-content/60">{product.brand}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">{product.view_count}</span>
                <span className="text-xs text-base-content/60 ml-1">views</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};