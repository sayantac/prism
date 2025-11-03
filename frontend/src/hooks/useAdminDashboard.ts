// import { useMemo } from "react";
// import {
//   useGetA,
//   useGetRealTimeStatsQuery,
//   useGetSystemHealthQuery,
// } from "../store/api/adminApi";

// export const useAdminDashboard = () => {
//   const {
//     data: overview,
//     isLoading: overviewLoading,
//     error: overviewError,
//   } = useGetAdminDashboardOverviewQuery({});

//   const { data: realTimeStats, isLoading: statsLoading } =
//     useGetRealTimeStatsQuery(undefined, {
//       pollingInterval: 30000,
//     });

//   const { data: systemHealth, isLoading: healthLoading } =
//     useGetSystemHealthQuery(undefined, {
//       pollingInterval: 60000,
//     });

//   const dashboardData = useMemo(
//     () => ({
//       overview,
//       realTimeStats,
//       systemHealth,
//       isLoading: overviewLoading || statsLoading || healthLoading,
//       error: overviewError,
//     }),
//     [
//       overview,
//       realTimeStats,
//       systemHealth,
//       overviewLoading,
//       statsLoading,
//       healthLoading,
//       overviewError,
//     ]
//   );

//   const keyMetrics = useMemo(() => {
//     if (!overview) return [];

//     return [
//       {
//         title: "Total Revenue",
//         value: `${overview.orders?.revenue_today || 0}`,
//         change: {
//           value: 12,
//           type: "increase" as const,
//           period: "vs yesterday",
//         },
//       },
//       {
//         title: "Orders Today",
//         value: overview.orders?.today || 0,
//         change: { value: 8, type: "increase" as const, period: "vs yesterday" },
//       },
//       {
//         title: "Active Users",
//         value: realTimeStats?.active_users || 0,
//         change: { value: 5, type: "increase" as const, period: "vs last hour" },
//       },
//       {
//         title: "Conversion Rate",
//         value: "3.2%",
//         change: { value: 2, type: "decrease" as const, period: "vs yesterday" },
//       },
//     ];
//   }, [overview, realTimeStats]);

//   return {
//     ...dashboardData,
//     keyMetrics,
//   };
// };
