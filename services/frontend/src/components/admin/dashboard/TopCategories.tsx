/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart3, TrendingUp } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/store/api/adminApi";

export const TopCategories: React.FC = () => {
  const { data: overview, isLoading } = useGetAdminDashboardQuery({ days: 90 });

  if (isLoading) {
    return <div className="skeleton h-64 w-full"></div>;
  }

  const categories = overview?.analytics?.top_categories || [];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title">Top Categories</h3>
          <BarChart3 className="w-5 h-5 text-base-content/50" />
        </div>

        <div className="space-y-3 mt-4">
          {categories.length > 0 ? (
            categories.slice(0, 8).map((category: any, index: number) => {
              const maxCount = Math.max(...categories.map((c: any) => c.count));
              const percentage = (category.count / maxCount) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-base-content/60">
                        {category.count}
                      </span>
                      <TrendingUp className="w-3 h-3 text-success" />
                    </div>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No category data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
