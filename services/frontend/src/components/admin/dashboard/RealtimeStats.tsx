import { motion } from "framer-motion";
import { Activity, Eye, ShoppingBag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetRealTimeStatsQuery } from "@/store/api/adminApi";
import { MetricCard } from "../../admin/ui/MetricCard";

export const RealtimeStats: React.FC = () => {
  const {
    data: stats,
    isLoading,
    refetch,
  } = useGetRealTimeStatsQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const realTimeMetrics = [
    {
      title: "Revenue Today",
      value: stats?.data?.revenue?.today || 0,
      icon: <Activity className="w-6 h-6 text-green-600" />,
      change: stats?.data?.revenue?.growth_rate,
      format: "currency",
    },
    {
      title: "Orders Today",
      value: stats?.data?.orders?.today || 0,
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      change: stats?.data?.orders?.growth_rate,
    },
    {
      title: "Active Users (24h)",
      value: stats?.data?.users?.active_24h || 0,
      icon: <Users className="w-6 h-6 text-purple-600" />,
    },
    {
      title: "New Users Today",
      value: stats?.data?.users?.new_today || 0,
      icon: <Eye className="w-6 h-6 text-orange-600" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Analytics</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-sm text-base-content/70">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {realTimeMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              change={metric.change}
              loading={isLoading}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
