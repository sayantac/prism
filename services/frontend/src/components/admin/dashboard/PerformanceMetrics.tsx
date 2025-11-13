import { useGetPerformanceMetricsQuery } from "@/store/api/adminApi";
import { Activity, AlertCircle, Database, Search, Server } from "lucide-react";
import { useMemo } from "react";

interface PerformanceMetricsProps {
  className?: string;
}

export const PerformanceMetrics = ({ className = "" }: PerformanceMetricsProps) => {
  const { data: metrics, isLoading, error, refetch } = useGetPerformanceMetricsQuery(undefined, {
    pollingInterval: 300000, // Poll every 5 minutes
  });

  const metricsData = useMemo(() => {
    if (!metrics?.data) return null;

    return {
      api: {
        avg: metrics.data.api_response_time?.avg || 0,
        min: metrics.data.api_response_time?.min || 0,
        max: metrics.data.api_response_time?.max || 0,
        count: metrics.data.api_response_time?.count || 0,
        latest: metrics.data.api_response_time?.latest || 0,
      },
      error: {
        rate: metrics.data.error_rate?.avg || 0,
      },
      database: {
        avg: metrics.data.database_query_time?.avg || 0,
      },
      search: {
        avg: metrics.data.search_response_time?.avg || 0,
      },
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className={`bg-base-100 border border-base-300 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-base-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-base-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-error/10 border border-error/20 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-error mb-4">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load performance metrics</span>
        </div>
        <button onClick={refetch} className="btn btn-error btn-sm">
          Retry
        </button>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className={`bg-base-100 border border-base-300 rounded-lg p-6 ${className}`}>
        <p className="text-base-content/50">No performance metrics available</p>
      </div>
    );
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return "text-success";
    if (value <= thresholds.warning) return "text-warning";
    return "text-error";
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`bg-base-100 border border-base-300 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Metrics
        </h3>
        <button onClick={refetch} className="btn btn-ghost btn-sm">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Response Time */}
        <div className="bg-base-200/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">API Response</span>
          </div>
          <div className={`text-2xl font-bold ${getPerformanceColor(metricsData.api.avg, { good: 200, warning: 500 })}`}>
            {formatTime(metricsData.api.avg)}
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            Latest: {formatTime(metricsData.api.latest)} | Count: {metricsData.api.count}
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-base-200/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <span className="text-sm font-medium">Error Rate</span>
          </div>
          <div className={`text-2xl font-bold ${getPerformanceColor(metricsData.error.rate, { good: 0.01, warning: 0.05 })}`}>
            {(metricsData.error.rate * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            System errors
          </div>
        </div>

        {/* Database Query Time */}
        <div className="bg-base-200/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-info" />
            <span className="text-sm font-medium">Database</span>
          </div>
          <div className={`text-2xl font-bold ${getPerformanceColor(metricsData.database.avg, { good: 50, warning: 200 })}`}>
            {formatTime(metricsData.database.avg)}
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            Query time
          </div>
        </div>

        {/* Search Response Time */}
        <div className="bg-base-200/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Search</span>
          </div>
          <div className={`text-2xl font-bold ${getPerformanceColor(metricsData.search.avg, { good: 300, warning: 1000 })}`}>
            {formatTime(metricsData.search.avg)}
          </div>
          <div className="text-xs text-base-content/60 mt-1">
            Response time
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="mt-6 pt-4 border-t border-base-300">
        <h4 className="text-sm font-medium mb-3">Detailed API Metrics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-base-content/60">Min:</span>
            <span className="ml-2 font-medium">{formatTime(metricsData.api.min)}</span>
          </div>
          <div>
            <span className="text-base-content/60">Max:</span>
            <span className="ml-2 font-medium">{formatTime(metricsData.api.max)}</span>
          </div>
          <div>
            <span className="text-base-content/60">Requests:</span>
            <span className="ml-2 font-medium">{metricsData.api.count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};