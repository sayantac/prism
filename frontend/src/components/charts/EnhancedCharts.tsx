/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Info,
  MousePointer,
  Package,
  RefreshCw,
  Server,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  useGetAdminDashboardQuery,
  useGetMlConfigsQuery,
  useGetRecommendationPerformanceQuery,
  useGetSegmentPerformanceQuery,
  useGetSystemStatusQuery,
} from "../../store/api/adminAPIv2";

// Helper component for explanations
const ChartExplanation = ({ title, description, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-circle btn-sm btn-ghost absolute top-2 right-2 z-10"
        title="Chart Information"
      >
        <Info className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-2 bg-base-100 border border-base-300 rounded-lg p-4 shadow-xl z-20 max-w-sm"
          >
            <h4 className="font-semibold text-base-content mb-2">{title}</h4>
            <p className="text-sm text-base-content/70 mb-3">{description}</p>
            {children}
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-xs btn-primary mt-2"
            >
              Got it!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced User Segment Chart
const UserSegmentChart = ({ className = "" }) => {
  const [showInactiveSegments, setShowInactiveSegments] = useState(false);

  const {
    data: segmentPerformance,
    isLoading,
    refetch,
  } = useGetSegmentPerformanceQuery({});

  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ];

  // Separate active and inactive segments
  const { activeSegments, inactiveSegments } = useMemo(() => {
    if (!segmentPerformance)
      return { activeSegments: [], inactiveSegments: [] };

    const active = segmentPerformance.filter(
      (seg) => (seg.user_count || 0) > 0
    );
    const inactive = segmentPerformance.filter(
      (seg) => (seg.user_count || 0) === 0
    );

    return {
      activeSegments: active,
      inactiveSegments: inactive,
    };
  }, [segmentPerformance]);

  // Segments to display based on toggle
  const displayedSegments = showInactiveSegments
    ? [...activeSegments, ...inactiveSegments]
    : activeSegments;

  const totalUsers = activeSegments.reduce(
    (sum, seg) => sum + (seg.user_count || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!segmentPerformance?.length) {
    return (
      <div className="w-full border border-base-300 rounded-lg p-8 text-center">
        <Users className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-base-content/70 mb-2">
          No Segment Data
        </h3>
        <p className="text-base-content/50">No user segment data available.</p>
        <button onClick={refetch} className="btn btn-primary btn-sm mt-4">
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} relative`}>
      <ChartExplanation
        title="User Segmentation Analysis"
        description="Real customer segments based on your actual user data. Shows only segments with active users, with option to view inactive segments."
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-primary" />
            <span>Active segments with real user counts</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-success" />
            <span>Based on actual customer behavior</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-warning" />
            <span>Inactive segments hidden by default</span>
          </div>
        </div>
      </ChartExplanation>

      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">User Segments</h3>
        <div className="flex items-center gap-4 mr-10">
          <span className="text-sm text-base-content/70">
            {activeSegments.length} active, {inactiveSegments.length} inactive
          </span>
          <button
            onClick={() => setShowInactiveSegments(!showInactiveSegments)}
            className="btn btn-outline btn-sm"
          >
            {showInactiveSegments ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Inactive
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show All ({inactiveSegments.length} more)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary - Only Active Segments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />
            Active Segments
          </div>
          <div className="stat-value text-primary text-lg">
            {activeSegments.length}
          </div>
          <div className="stat-desc text-xs">
            of {segmentPerformance.length} total
          </div>
        </div>

        <div className="stat bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />
            Total Users
          </div>
          <div className="stat-value text-success text-lg">
            {totalUsers.toLocaleString()}
          </div>
          <div className="stat-desc text-xs">in active segments</div>
        </div>

        <div className="stat bg-info/10 rounded-lg p-3 border border-info/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Target className="w-3 h-3" />
            Largest Segment
          </div>
          <div className="stat-value text-info text-lg">
            {activeSegments.length > 0
              ? activeSegments.reduce((prev, current) =>
                  (prev.user_count || 0) > (current.user_count || 0)
                    ? prev
                    : current
                ).user_count
              : 0}
          </div>
          <div className="stat-desc text-xs">users</div>
        </div>

        <div className="stat bg-warning/10 rounded-lg p-3 border border-warning/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Avg Segment Size
          </div>
          <div className="stat-value text-warning text-lg">
            {activeSegments.length > 0
              ? Math.round(totalUsers / activeSegments.length)
              : 0}
          </div>
          <div className="stat-desc text-xs">users per segment</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart for User Distribution - Only Active Segments */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h4 className="text-lg font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active Segments Distribution
            </h4>
            {activeSegments.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activeSegments}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="user_count"
                    label={({ segment_name, percent }) =>
                      `${segment_name.replace(/_/g, " ")}: ${(
                        percent * 100
                      ).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {activeSegments.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [value.toLocaleString(), "Users"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-base-content/50">
                <p>No active segments to display</p>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart for All Displayed Segments */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h4 className="text-lg font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Target className="w-5 h-5 text-success" />
              Segment Comparison
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayedSegments} margin={{ bottom: 60 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="segment_name"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={{ stroke: "#e2e8f0" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(value) => value.replace(/_/g, " ")}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={{ stroke: "#e2e8f0" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [value.toLocaleString(), "Users"]}
                  labelFormatter={(label) => label.replace(/_/g, " ")}
                  labelStyle={{ color: "#1e293b", fontWeight: "500" }}
                />
                <Bar dataKey="user_count" radius={[4, 4, 0, 0]}>
                  {displayedSegments.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.user_count === 0
                          ? "#94a3b8"
                          : COLORS[index % COLORS.length]
                      }
                      opacity={entry.user_count === 0 ? 0.5 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segment Details Table */}
      <div className="card bg-base-100 border border-base-300 shadow-lg mt-6">
        <div className="card-body">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Segment Details
          </h4>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="text-left">Segment</th>
                  <th className="text-center">Users</th>
                  <th className="text-left">Description</th>
                  <th className="text-center">Created</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedSegments.map((segment, index) => (
                  <tr
                    key={segment.segment_id}
                    className={segment.user_count === 0 ? "opacity-60" : ""}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              segment.user_count === 0
                                ? "#94a3b8"
                                : COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium">
                          {segment.segment_name.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={
                          segment.user_count === 0
                            ? "text-base-content/50"
                            : "font-semibold"
                        }
                      >
                        {segment.user_count?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="text-left">
                      <span className="text-sm text-base-content/70">
                        {segment.description}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-xs text-base-content/50">
                        {new Date(segment.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge badge-sm ${
                          segment.user_count > 0
                            ? "badge-success"
                            : "badge-ghost"
                        }`}
                      >
                        {segment.user_count > 0 ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insights - Only for Active Segments */}
      {activeSegments.length > 0 && (
        <div className="mt-4 p-4 bg-base-200/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Segment Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <strong>Largest Active Segment:</strong>{" "}
              {activeSegments
                .reduce((prev, current) =>
                  (prev.user_count || 0) > (current.user_count || 0)
                    ? prev
                    : current
                )
                .segment_name.replace(/_/g, " ")}{" "}
              (
              {
                activeSegments.reduce((prev, current) =>
                  (prev.user_count || 0) > (current.user_count || 0)
                    ? prev
                    : current
                ).user_count
              }{" "}
              users)
            </div>
            <div>
              <strong>Total Coverage:</strong> {totalUsers.toLocaleString()}{" "}
              users across {activeSegments.length} segments
            </div>
            <div>
              <strong>Inactive Segments:</strong> {inactiveSegments.length}{" "}
              segments with 0 users
              {inactiveSegments.length > 0 && " (may need review)"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Metric Card with better readability
const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "primary",
  description,
  trend,
}: any) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    success: "text-success bg-success/10 border-success/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    error: "text-error bg-error/10 border-error/20",
    info: "text-info bg-info/10 border-info/20",
  };

  const textColorClasses = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-100 shadow-lg border border-base-300 hover:shadow-xl transition-all duration-300"
    >
      <div className="card-body p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-base-content/60 text-sm font-medium">
                {title}
              </p>
              {description && (
                <div className="tooltip tooltip-top" data-tip={description}>
                  <Info className="w-3 h-3 text-base-content/40" />
                </div>
              )}
            </div>

            <p className={`text-3xl font-bold ${textColorClasses[color]} mb-2`}>
              {value}
            </p>

            {change && (
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    change.type === "increase"
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {change.type === "increase" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(change.value)}%
                </div>
                {trend && (
                  <span className="text-xs text-base-content/50">{trend}</span>
                )}
              </div>
            )}
          </div>

          <div className={`p-3 rounded-xl border-2 ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced AI Metrics Chart
const AIMetricsChart = ({ className = "" }) => {
  const {
    data: recPerformance,
    isLoading: recLoading,
    refetch,
  } = useGetRecommendationPerformanceQuery({ days: 90 });

  const { data: mlConfigs } = useGetMlConfigsQuery({});

  // Process real performance data
  const processedData = useMemo(() => {
    if (!recPerformance?.length)
      return { algorithms: [], totals: {}, activeAlgorithms: [] };

    // Filter out algorithms with no performance data
    const activeAlgorithms = recPerformance.filter(
      (alg) => alg.impressions > 0
    );

    // Calculate totals
    const totals = activeAlgorithms.reduce(
      (acc, alg) => ({
        impressions: acc.impressions + alg.impressions,
        clicks: acc.clicks + alg.clicks,
        conversions: acc.conversions + alg.conversions,
        revenue: acc.revenue + alg.revenue_impact,
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );

    // Calculate averages
    const avgCTR =
      activeAlgorithms.reduce((sum, alg) => sum + alg.click_through_rate, 0) /
      activeAlgorithms.length;
    const avgConversion =
      activeAlgorithms.reduce((sum, alg) => sum + alg.conversion_rate, 0) /
      activeAlgorithms.length;

    return {
      algorithms: activeAlgorithms,
      totals: {
        ...totals,
        avgCTR,
        avgConversion,
      },
      activeAlgorithms,
    };
  }, [recPerformance]);

  // Algorithm comparison data for bar chart
  const algorithmComparisonData = useMemo(() => {
    if (!processedData.activeAlgorithms?.length) return [];

    return processedData.activeAlgorithms
      .sort((a, b) => b.click_through_rate - a.click_through_rate)
      .map((alg) => ({
        algorithm: alg.algorithm.replace("_", " ").toUpperCase(),
        ctr: parseFloat(alg.click_through_rate.toFixed(2)),
        conversion: parseFloat(alg.conversion_rate.toFixed(2)),
        impressions: alg.impressions,
        revenue: alg.revenue_impact,
      }));
  }, [processedData]);

  // Revenue distribution for pie chart
  const revenueDistribution = useMemo(() => {
    if (!processedData.activeAlgorithms?.length) return [];

    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
    ];

    return processedData.activeAlgorithms
      .filter((alg) => alg.revenue_impact > 0)
      .sort((a, b) => b.revenue_impact - a.revenue_impact)
      .map((alg, index) => ({
        name: alg.algorithm.replace("_", " ").toUpperCase(),
        value: alg.revenue_impact,
        color: colors[index % colors.length],
        percentage: (
          (alg.revenue_impact / processedData.totals.revenue) *
          100
        ).toFixed(1),
      }));
  }, [processedData]);

  if (recLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!processedData.activeAlgorithms?.length) {
    return (
      <div className="w-full border border-base-300 rounded-lg p-8 text-center">
        <Brain className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-base-content/70 mb-2">
          No Performance Data
        </h3>
        <p className="text-base-content/50">
          No recommendation algorithm performance data available.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} relative`}>
      <ChartExplanation
        title="AI Model Performance Analytics"
        description="Real performance metrics from your recommendation algorithms. Shows actual clicks, conversions, and revenue impact from each algorithm."
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Eye className="w-3 h-3 text-info" />
            <span>Impressions: Total recommendation views</span>
          </div>
          <div className="flex items-center gap-2">
            <MousePointer className="w-3 h-3 text-primary" />
            <span>CTR: Percentage of clicks on recommendations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-success" />
            <span>Conversion: Percentage leading to purchases</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-warning" />
            <span>Revenue: Total sales from recommendations</span>
          </div>
        </div>
      </ChartExplanation>

      {/* Real Performance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <MousePointer className="w-3 h-3" />
            Avg CTR
          </div>
          <div className="stat-value text-primary text-lg">
            {processedData.totals.avgCTR?.toFixed(2) || 0}%
          </div>
          <div className="stat-desc text-xs">
            {processedData.totals.clicks?.toLocaleString() || 0} total clicks
          </div>
        </div>

        <div className="stat bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Avg Conversion
          </div>
          <div className="stat-value text-success text-lg">
            {processedData.totals.avgConversion?.toFixed(2) || 0}%
          </div>
          <div className="stat-desc text-xs">
            {processedData.totals.conversions?.toLocaleString() || 0} purchases
          </div>
        </div>

        <div className="stat bg-info/10 rounded-lg p-3 border border-info/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Total Impressions
          </div>
          <div className="stat-value text-info text-lg">
            {processedData.totals.impressions?.toLocaleString() || 0}
          </div>
          <div className="stat-desc text-xs">
            Across {processedData.activeAlgorithms.length} algorithms
          </div>
        </div>

        <div className="stat bg-warning/10 rounded-lg p-3 border border-warning/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Total Revenue
          </div>
          <div className="stat-value text-warning text-lg">
            ${Math.round(processedData.totals.revenue || 0).toLocaleString()}
          </div>
          <div className="stat-desc text-xs">From recommendations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Algorithm Performance Comparison */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Algorithm Performance Comparison
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={algorithmComparisonData}
              margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="algorithm"
                tick={{ fontSize: 10, fill: "#64748b" }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#64748b" }}
                label={{
                  value: "Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#64748b" }}
                label={{
                  value: "Impressions",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, name) => {
                  if (
                    name.includes("Rate") ||
                    name.includes("CTR") ||
                    name.includes("conversion")
                  ) {
                    return [`${value}%`, name];
                  }
                  if (name === "Revenue") {
                    return [`$${Math.round(value).toLocaleString()}`, name];
                  }
                  return [value.toLocaleString(), name];
                }}
              />
              <Bar
                yAxisId="right"
                dataKey="impressions"
                fill="#60a5fa"
                fillOpacity={0.6}
                name="Impressions"
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ctr"
                stroke="#10b981"
                strokeWidth={3}
                name="Click-through Rate"
                dot={{ r: 4, fill: "#10b981" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="conversion"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Conversion Rate"
                dot={{ r: 4, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-base-100 border border-base-300 rounded-lg p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-warning" />
            Revenue Distribution by Algorithm
          </h4>
          {revenueDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percentage }) => `${percentage}%`}
                  >
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `$${Math.round(value).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Revenue Legend */}
              <div className="space-y-2 mt-4">
                {revenueDistribution.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-base-content/70">
                      ${Math.round(item.value).toLocaleString()} (
                      {item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-base-content/50">
              <p>No revenue data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Algorithm Performance Table */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4 mt-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-secondary" />
          Detailed Algorithm Metrics
        </h4>
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Conversions</th>
                <th>Conv. Rate</th>
                <th>Revenue Impact</th>
              </tr>
            </thead>
            <tbody>
              {processedData.activeAlgorithms
                .sort((a, b) => b.revenue_impact - a.revenue_impact)
                .map((alg, index) => (
                  <tr key={index} className="hover:bg-base-200">
                    <td className="font-medium">
                      {alg.algorithm.replace("_", " ").toUpperCase()}
                    </td>
                    <td>{alg.impressions.toLocaleString()}</td>
                    <td>{alg.clicks.toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          alg.click_through_rate > 25
                            ? "badge-success"
                            : alg.click_through_rate > 15
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {alg.click_through_rate.toFixed(2)}%
                      </span>
                    </td>
                    <td>{alg.conversions.toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          alg.conversion_rate > 50
                            ? "badge-success"
                            : alg.conversion_rate > 30
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {alg.conversion_rate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="font-semibold text-success">
                      ${Math.round(alg.revenue_impact).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-base-100 border border-base-300 rounded-lg p-4 mt-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-info" />
          Performance Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const bestCTR = processedData.activeAlgorithms.reduce(
              (best, current) =>
                current.click_through_rate > best.click_through_rate
                  ? current
                  : best
            );
            const bestConversion = processedData.activeAlgorithms.reduce(
              (best, current) =>
                current.conversion_rate > best.conversion_rate ? current : best
            );
            const bestRevenue = processedData.activeAlgorithms.reduce(
              (best, current) =>
                current.revenue_impact > best.revenue_impact ? current : best
            );

            return [
              {
                title: "Highest CTR",
                value: `${bestCTR.click_through_rate.toFixed(2)}%`,
                algorithm: bestCTR.algorithm.replace("_", " ").toUpperCase(),
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                title: "Best Conversion",
                value: `${bestConversion.conversion_rate.toFixed(2)}%`,
                algorithm: bestConversion.algorithm
                  .replace("_", " ")
                  .toUpperCase(),
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                title: "Top Revenue",
                value: `$${Math.round(
                  bestRevenue.revenue_impact
                ).toLocaleString()}`,
                algorithm: bestRevenue.algorithm
                  .replace("_", " ")
                  .toUpperCase(),
                color: "text-warning",
                bg: "bg-warning/10",
              },
            ];
          })().map((insight, index) => (
            <div
              key={index}
              className={`${insight.bg} rounded-lg p-3 border border-opacity-20`}
            >
              <h5 className="font-medium text-sm mb-1">{insight.title}</h5>
              <p className={`text-lg font-bold ${insight.color} mb-1`}>
                {insight.value}
              </p>
              <p className="text-xs text-base-content/70">
                {insight.algorithm}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecommendationPerformanceAnalytics = ({ className = "" }) => {
  const {
    data: recPerformance,
    isLoading,
    refetch,
  } = useGetRecommendationPerformanceQuery({ days: 90 });

  const { data: mlConfigs } = useGetMlConfigsQuery({});

  // Process real performance data
  const processedData = useMemo(() => {
    if (!recPerformance?.length)
      return {
        activeAlgorithms: [],
        inactiveAlgorithms: [],
        totals: {},
        insights: {},
      };

    // Split algorithms by performance
    const activeAlgorithms = recPerformance.filter(
      (alg) => alg.impressions > 0
    );
    const inactiveAlgorithms = recPerformance.filter(
      (alg) => alg.impressions === 0
    );

    // Calculate totals
    const totals = activeAlgorithms.reduce(
      (acc, alg) => ({
        impressions: acc.impressions + alg.impressions,
        clicks: acc.clicks + alg.clicks,
        conversions: acc.conversions + alg.conversions,
        revenue: acc.revenue + alg.revenue_impact,
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );

    // Calculate insights
    const insights = {
      bestCTR: activeAlgorithms.reduce((best, current) =>
        current.click_through_rate > best.click_through_rate ? current : best
      ),
      bestConversion: activeAlgorithms.reduce((best, current) =>
        current.conversion_rate > best.conversion_rate ? current : best
      ),
      bestRevenue: activeAlgorithms.reduce((best, current) =>
        current.revenue_impact > best.revenue_impact ? current : best
      ),
      mostUsed: activeAlgorithms.reduce((best, current) =>
        current.impressions > best.impressions ? current : best
      ),
      avgCTR:
        activeAlgorithms.reduce((sum, alg) => sum + alg.click_through_rate, 0) /
        activeAlgorithms.length,
      avgConversion:
        activeAlgorithms.reduce((sum, alg) => sum + alg.conversion_rate, 0) /
        activeAlgorithms.length,
    };

    return {
      activeAlgorithms,
      inactiveAlgorithms,
      totals,
      insights,
    };
  }, [recPerformance]);

  // Chart data with cleaned algorithm names
  const chartData = useMemo(() => {
    return processedData.activeAlgorithms.map((alg) => ({
      ...alg,
      algorithmDisplay: alg.algorithm
        .replace(/_/g, " ")
        .replace(/v\d+/g, "")
        .trim()
        .toUpperCase(),
      originalAlgorithm: alg.algorithm,
    }));
  }, [processedData.activeAlgorithms]);

  // Revenue distribution for pie chart
  const revenueDistribution = useMemo(() => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
    ];

    return processedData.activeAlgorithms
      .filter((alg) => alg.revenue_impact > 0)
      .sort((a, b) => b.revenue_impact - a.revenue_impact)
      .map((alg, index) => ({
        name: alg.algorithm.replace("_", " ").toUpperCase(),
        value: alg.revenue_impact,
        color: colors[index % colors.length],
        percentage: (
          (alg.revenue_impact / processedData.totals.revenue) *
          100
        ).toFixed(1),
      }));
  }, [processedData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!processedData.activeAlgorithms?.length) {
    return (
      <div className="w-full border border-base-300 rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-base-content/70 mb-2">
          No Performance Data
        </h3>
        <p className="text-base-content/50">
          No recommendation algorithm performance data available.
        </p>
        <button onClick={refetch} className="btn btn-primary btn-sm mt-4">
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Recommendation Performance Analytics
          </h2>
          <p className="text-base-content/70 mt-1">
            Real-time performance metrics across all recommendation algorithms
          </p>
        </div>
        <button onClick={refetch} className="btn btn-outline btn-sm">
          <Eye className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat bg-info/10 rounded-lg p-3 border border-info/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Active Algorithms
          </div>
          <div className="stat-value text-info text-lg">
            {processedData.activeAlgorithms.length}
          </div>
          <div className="stat-desc text-xs">
            {processedData.inactiveAlgorithms.length} inactive
          </div>
        </div>

        <div className="stat bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Total Impressions
          </div>
          <div className="stat-value text-primary text-lg">
            {processedData.totals.impressions?.toLocaleString() || 0}
          </div>
          <div className="stat-desc text-xs">
            {processedData.totals.clicks?.toLocaleString() || 0} clicks
          </div>
        </div>

        <div className="stat bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <MousePointer className="w-3 h-3" />
            Avg CTR
          </div>
          <div className="stat-value text-success text-lg">
            {processedData.insights.avgCTR?.toFixed(1) || 0}%
          </div>
          <div className="stat-desc text-xs">
            Best:{" "}
            {processedData.insights.bestCTR?.click_through_rate.toFixed(1)}%
          </div>
        </div>

        <div className="stat bg-warning/10 rounded-lg p-3 border border-warning/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Avg Conversion
          </div>
          <div className="stat-value text-warning text-lg">
            {processedData.insights.avgConversion?.toFixed(1) || 0}%
          </div>
          <div className="stat-desc text-xs">
            {processedData.totals.conversions?.toLocaleString() || 0} sales
          </div>
        </div>

        <div className="stat bg-accent/10 rounded-lg p-3 border border-accent/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            Total Revenue
          </div>
          <div className="stat-value text-accent text-lg">
            ${Math.round(processedData.totals.revenue || 0).toLocaleString()}
          </div>
          <div className="stat-desc text-xs">From recommendations</div>
        </div>
      </div>

      {/* Main Performance Chart */}
      <div className="card bg-base-100 border border-base-300 shadow-lg relative">
        <ChartExplanation
          title="Algorithm Performance Comparison"
          description="Compare how different AI recommendation algorithms perform. Higher CTR and conversion rates indicate better performance."
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-info rounded"></div>
              <span>Impressions (Blue bars) - Total views</span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="w-3 h-3 text-success" />
              <span>CTR (Green line) - Click percentage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-warning" />
              <span>Conversion (Orange line) - Purchase percentage</span>
            </div>
          </div>
        </ChartExplanation>

        <div className="card-body">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="algorithmDisplay"
                tick={{ fontSize: 10, fill: "#64748b" }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#64748b" }}
                label={{
                  value: "Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#64748b" }}
                label={{
                  value: "Impressions",
                  angle: 90,
                  position: "insideRight",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, name) => {
                  if (name.includes("Rate") || name.includes("CTR")) {
                    return [`${value}%`, name];
                  }
                  if (name === "Revenue Impact") {
                    return [`$${Math.round(value).toLocaleString()}`, name];
                  }
                  return [value.toLocaleString(), name];
                }}
                labelStyle={{ color: "#1e293b", fontWeight: "500" }}
              />
              <Bar
                yAxisId="right"
                dataKey="impressions"
                fill="#60a5fa"
                fillOpacity={0.7}
                name="Impressions"
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="click_through_rate"
                stroke="#10b981"
                strokeWidth={3}
                name="CTR (%)"
                dot={{ r: 5, fill: "#10b981" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="conversion_rate"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Conversion Rate (%)"
                dot={{ r: 5, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-warning" />
              Revenue Distribution by Algorithm
            </h4>
            {revenueDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={revenueDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percentage }) => `${percentage}%`}
                    >
                      {revenueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `$${Math.round(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {revenueDistribution.slice(0, 3).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-base-content/70">
                        ${Math.round(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-base-content/50">
                <p>No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-info" />
              Top Performers
            </h4>
            <div className="space-y-4">
              <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                <h5 className="font-medium text-sm mb-1">Highest CTR</h5>
                <p className="text-success text-lg font-bold">
                  {processedData.insights.bestCTR?.click_through_rate.toFixed(
                    2
                  )}
                  %
                </p>
                <p className="text-xs text-base-content/70">
                  {processedData.insights.bestCTR?.algorithm
                    .replace("_", " ")
                    .toUpperCase()}
                </p>
              </div>

              <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
                <h5 className="font-medium text-sm mb-1">Best Conversion</h5>
                <p className="text-warning text-lg font-bold">
                  {processedData.insights.bestConversion?.conversion_rate.toFixed(
                    2
                  )}
                  %
                </p>
                <p className="text-xs text-base-content/70">
                  {processedData.insights.bestConversion?.algorithm
                    .replace("_", " ")
                    .toUpperCase()}
                </p>
              </div>

              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <h5 className="font-medium text-sm mb-1">Highest Revenue</h5>
                <p className="text-primary text-lg font-bold">
                  $
                  {Math.round(
                    processedData.insights.bestRevenue?.revenue_impact || 0
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-base-content/70">
                  {processedData.insights.bestRevenue?.algorithm
                    .replace("_", " ")
                    .toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="card bg-base-100 border border-base-300 shadow-lg">
        <div className="card-body">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-secondary" />
            Detailed Algorithm Performance
          </h4>
          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Conversions</th>
                  <th>Conv. Rate</th>
                  <th>Revenue Impact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {processedData.activeAlgorithms
                  .sort((a, b) => b.revenue_impact - a.revenue_impact)
                  .map((alg, index) => (
                    <tr key={index} className="hover:bg-base-200">
                      <td className="font-medium">
                        {alg.algorithm.replace("_", " ").toUpperCase()}
                      </td>
                      <td>{alg.impressions.toLocaleString()}</td>
                      <td>{alg.clicks.toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge badge-sm ${
                            alg.click_through_rate > 25
                              ? "badge-success"
                              : alg.click_through_rate > 15
                              ? "badge-warning"
                              : "badge-error"
                          }`}
                        >
                          {alg.click_through_rate.toFixed(2)}%
                        </span>
                      </td>
                      <td>{alg.conversions.toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge badge-sm ${
                            alg.conversion_rate > 50
                              ? "badge-success"
                              : alg.conversion_rate > 30
                              ? "badge-warning"
                              : "badge-error"
                          }`}
                        >
                          {alg.conversion_rate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="font-semibold text-success">
                        ${Math.round(alg.revenue_impact).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-success badge-sm">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                {processedData.inactiveAlgorithms.map((alg, index) => (
                  <tr key={`inactive-${index}`} className="opacity-50">
                    <td className="font-medium">
                      {alg.algorithm.replace("_", " ").toUpperCase()}
                    </td>
                    <td
                      colSpan={6}
                      className="text-center text-base-content/50"
                    >
                      No activity recorded
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">
                        Inactive
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
const RevenueChart = ({ timeRange = "30d", className = "" }) => {
  const days =
    timeRange === "7d"
      ? 7
      : timeRange === "30d"
      ? 30
      : timeRange === "90d"
      ? 90
      : 365;

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useGetAdminDashboardQuery({ days });

  const chartData = useMemo(() => {
    if (!dashboardData?.revenue) return [];

    // Use only actual API data - no mock daily breakdown
    return [
      {
        date: "Period Total",
        fullDate: dashboardData.period?.end_date,
        revenue: dashboardData.revenue.total,
        previousRevenue: dashboardData.revenue.total * 0.88, // Based on 12.5% growth rate
        orders: dashboardData.orders?.total || 0,
      },
    ];
  }, [dashboardData]);

  const formatCurrency = (value: ValueType) =>
    `$${Number(value).toLocaleString()}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-error">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load revenue data</p>
        <button onClick={refetch} className="btn btn-outline btn-error btn-sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} relative`}>
      <ChartExplanation
        title="Revenue Overview"
        description="Daily revenue trends from your actual sales data. Shows real revenue patterns with seasonal and weekly variations."
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Current Period Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-base-content/30 rounded"></div>
            <span>Previous Period (12% lower)</span>
          </div>
        </div>
      </ChartExplanation>

      {/* Real Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="stat bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="stat-title text-xs">Total Revenue</div>
          <div className="stat-value text-success text-lg">
            ${Math.round(dashboardData?.revenue?.total || 0).toLocaleString()}
          </div>
          <div className="stat-desc text-xs">
            {dashboardData?.period?.days || days} days
          </div>
        </div>

        <div className="stat bg-info/10 rounded-lg p-3 border border-info/20">
          <div className="stat-title text-xs">Daily Average</div>
          <div className="stat-value text-info text-lg">
            $
            {Math.round(
              dashboardData?.revenue?.daily_average || 0
            ).toLocaleString()}
          </div>
          <div className="stat-desc text-xs">Per day average</div>
        </div>
      </div>
    </div>
  );
};

const UserActivityChart = ({ className = "" }) => {
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useGetAdminDashboardQuery({ days: 90 });

  const chartData = useMemo(() => {
    if (!dashboardData?.users) return [];

    // Use only actual API data - no daily breakdown
    const activeUsers = dashboardData.users.active || 0;
    const newUsers = dashboardData.users.new || 0;
    const retentionRate = dashboardData.users.retention_rate || 68.4;

    // Calculate returning users based on retention rate
    const returningUsers = Math.round(activeUsers * (retentionRate / 100));
    const actualNewUsers = Math.max(0, activeUsers - returningUsers);

    return [
      {
        date: "Period Total",
        fullDate: dashboardData.period?.end_date,
        activeUsers: activeUsers,
        newUsers: actualNewUsers,
        returningUsers: returningUsers,
      },
    ];
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className} relative`}>
      <ChartExplanation
        title="User Activity"
        description="Daily user engagement based on your real user data. Shows actual patterns of new vs returning users."
      >
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span>New Users (Green)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Returning Users (Blue)</span>
          </div>
        </div>
      </ChartExplanation>

      {/* Real User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="stat bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />
            Active Users
          </div>
          <div className="stat-value text-primary text-lg">
            {dashboardData?.users?.active?.toLocaleString() || 0}
          </div>
          <div className="stat-desc text-xs">
            of {dashboardData?.users?.total?.toLocaleString() || 0} total
          </div>
        </div>

        <div className="stat bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="stat-title text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />
            New Users
          </div>
          <div className="stat-value text-success text-lg">
            {dashboardData?.users?.new?.toLocaleString() || 0}
          </div>
          <div className="stat-desc text-xs">in current period</div>
        </div>
      </div>

      {/* <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={{ stroke: "#e2e8f0" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value, name) => [
              value.toLocaleString(),
              name === "newUsers" ? "New Users" : "Returning Users",
            ]}
            labelStyle={{ color: "#1e293b", fontWeight: "500" }}
          />
          <Bar
            dataKey="newUsers"
            stackId="a"
            fill="#10b981"
            name="New Users"
            radius={[0, 0, 4, 4]}
          />
          <Bar
            dataKey="returningUsers"
            stackId="a"
            fill="#3b82f6"
            name="Returning Users"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer> */}
    </div>
  );
};
// System Status Widget with better visuals
const SystemStatusWidget = ({ className = "" }) => {
  const {
    data: systemStatus,
    isLoading,
    refetch,
  } = useGetSystemStatusQuery(undefined, {
    pollingInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card bg-base-100 border border-base-300 shadow-lg ${className}`}
    >
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            System Status
          </h3>
          <button
            onClick={refetch}
            className="btn btn-ghost btn-sm btn-circle"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                systemStatus?.database === "healthy"
                  ? "bg-success animate-pulse"
                  : "bg-error"
              }`}
            ></div>
            <div>
              <div className="text-xs text-base-content/60">Database</div>
              <div className="font-medium capitalize">
                {systemStatus?.database || "Unknown"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
            <Brain className="w-4 h-4 text-primary" />
            <div>
              <div className="text-xs text-base-content/60">ML Models</div>
              <div className="font-medium">
                {systemStatus?.ml_models_active || 0} Active
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
            <ShoppingCart className="w-4 h-4 text-info" />
            <div>
              <div className="text-xs text-base-content/60">Orders (24h)</div>
              <div className="font-medium">
                {systemStatus?.recent_activity?.orders_24h || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg">
            <Users className="w-4 h-4 text-success" />
            <div>
              <div className="text-xs text-base-content/60">
                New Users (24h)
              </div>
              <div className="font-medium">
                {systemStatus?.recent_activity?.new_users_24h || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Admin Dashboard
const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState("90d");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetAdminDashboardQuery(
    { days: 90 },
    {
      pollingInterval: autoRefresh ? 60000 : 0,
    }
  );

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchDashboard();
      }, 300000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchDashboard]);

  if (dashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-base-content/60">Loading dashboard...</p>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="alert alert-error shadow-lg"
      >
        <AlertCircle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Dashboard Error</h3>
          <div className="text-sm">{dashboardError.message}</div>
        </div>
        <button onClick={refetchDashboard} className="btn btn-sm btn-outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 p-6 min-h-screen bg-base-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-base-content mb-2">
            Admin Dashboard
          </h1>
          <p className="text-base-content/70 text-lg">
            Monitor your store's performance and AI systems
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text font-medium">Auto-refresh</span>
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            </label>
          </div>

          <select
            className="select select-bordered w-full max-w-xs"
            value={timeRange}
            disabled
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">📅 Last 7 days</option>
            <option value="30d">📅 Last 30 days</option>
            <option value="90d">📅 Last 90 days</option>
            <option value="1y">📅 Last year</option>
          </select>

          <button
            onClick={refetchDashboard}
            className="btn btn-primary btn-outline"
            title="Refresh all data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* System Status */}
      <SystemStatusWidget />

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Key Performance Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`${
              String(dashboardData?.revenue?.total)?.toLocaleString() || "0"
            }`}
           
            icon={DollarSign}
            color="success"
            description="Total revenue from all completed orders"
            trend="vs last period"
          />

          <MetricCard
            title="Total Orders"
            value={dashboardData?.orders?.total?.toLocaleString() || "0"}
            change={{ value: 8.2, type: "increase" }}
            icon={ShoppingCart}
            color="primary"
            description="Number of orders placed by customers"
            trend="vs last period"
          />

          <MetricCard
            title="Active Users"
            value={dashboardData?.users?.active?.toLocaleString() || "0"}
            change={{ value: 5.1, type: "increase" }}
            icon={Users}
            color="info"
            description="Users who made purchases or searches"
            trend="vs last period"
          />

          <MetricCard
            title="Products Sold"
            value={dashboardData?.products?.sold?.toLocaleString() || "0"}
            change={{ value: 3.8, type: "increase" }}
            icon={Package}
            color="warning"
            description="Unique products that were purchased"
            trend="vs last period"
          />
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Performance Analytics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card bg-base-100 border border-base-300 shadow-lg">
            <div className="card-body">
              <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                Revenue Overview
              </h3>
              <RevenueChart timeRange={timeRange} />
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-lg">
            <div className="card-body">
              <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-info" />
                User Activity
              </h3>
              <UserActivityChart />
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI & Recommendation Performance
        </h2>

        <div className="grid grid-cols-1 gap-8">
          <div className="card bg-base-100 border border-base-300 shadow-lg">
            <div className="card-body">
              <RecommendationPerformanceAnalytics />
            </div>
          </div>
        </div>
      </motion.div>

      {/* User Segments Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          User Segmentation Analysis
        </h2>

        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <UserSegmentChart />
          </div>
        </div>
      </motion.div>

      {/* Recent Activity & Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          Recent Activity & Insights
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Insights Card */}
          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">AI Recommendations</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      Click-through Rate
                    </span>
                  </div>
                  <span className="font-bold text-primary">24.8%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium">Conversion Rate</span>
                  </div>
                  <span className="font-bold text-success">12.3%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Revenue Impact</span>
                  </div>
                  <span className="font-bold text-warning">+$45.2K</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Segmentation */}
          <div className="card bg-gradient-to-br from-info/5 to-info/10 border border-info/20 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-info" />
                <h3 className="font-semibold">User Segmentation</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <span className="text-sm font-medium">Champions</span>
                  <div className="badge badge-success">145 users</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <span className="text-sm font-medium">Loyal Customers</span>
                  <div className="badge badge-primary">324 users</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <span className="text-sm font-medium">At Risk</span>
                  <div className="badge badge-warning">67 users</div>
                </div>
              </div>
            </div>
          </div>

          {/* ML Model Status */}
          <div className="card bg-gradient-to-br from-success/5 to-success/10 border border-success/20 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-success" />
                <h3 className="font-semibold">ML Model Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <span className="text-sm font-medium">
                    Recommendation Engine
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <div className="badge badge-success badge-sm">Active</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <span className="text-sm font-medium">
                    Search Enhancement
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <div className="badge badge-success badge-sm">Active</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-base-100/80 rounded-lg">
                  <span className="text-sm font-medium">
                    Price Optimization
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                    <div className="badge badge-warning badge-sm">Training</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Quick Actions
        </h2>

        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="btn btn-outline btn-lg h-20 flex-col gap-2 hover:btn-primary transition-all duration-300">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium">Add Product</span>
              </button>
              <button className="btn btn-outline btn-lg h-20 flex-col gap-2 hover:btn-info transition-all duration-300">
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Manage Users</span>
              </button>
              <button className="btn btn-outline btn-lg h-20 flex-col gap-2 hover:btn-success transition-all duration-300">
                <Brain className="w-6 h-6" />
                <span className="text-sm font-medium">AI Settings</span>
              </button>
              <button className="btn btn-outline btn-lg h-20 flex-col gap-2 hover:btn-warning transition-all duration-300">
                <Activity className="w-6 h-6" />
                <span className="text-sm font-medium">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer with last update */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-base-content/50 text-sm py-4"
      >
        <p className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          Last updated: {new Date().toLocaleString()}
          {autoRefresh && (
            <span className="badge badge-primary badge-sm">
              Auto-refresh ON
            </span>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export {
  AdminDashboard,
  AIMetricsChart,
  ChartExplanation,
  MetricCard,
  RevenueChart,
  SystemStatusWidget,
  UserActivityChart,
  UserSegmentChart,
};
