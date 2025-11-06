import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueChartProps {
  data?: Array<{
    date: string;
    revenue: number;
    orders: number;
    previousRevenue?: number;
  }>;
  timeRange?: "7d" | "30d" | "90d" | "1y";
  className?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  timeRange = "30d",
  className = "",
}) => {
  // Mock data if none provided
  const mockData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(
      Date.now() - (29 - i) * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: Math.floor(Math.random() * 5000 + 2000),
    orders: Math.floor(Math.random() * 50 + 20),
    previousRevenue: Math.floor(Math.random() * 4500 + 1800),
  }));

  const chartData = data || mockData;

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--p))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--p))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--s))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--s))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "hsl(var(--bc))" }}
            axisLine={{ stroke: "hsl(var(--bc) / 0.2)" }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12, fill: "hsl(var(--bc))" }}
            axisLine={{ stroke: "hsl(var(--bc) / 0.2)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--b1))",
              border: "1px solid hsl(var(--b3))",
              borderRadius: "8px",
              color: "hsl(var(--bc))",
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "revenue" ? "Current Period" : "Previous Period",
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="previousRevenue"
            stackId="1"
            stroke="hsl(var(--s))"
            fill="url(#previousGradient)"
            strokeWidth={2}
            name="Previous Period"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="2"
            stroke="hsl(var(--p))"
            fill="url(#revenueGradient)"
            strokeWidth={2}
            name="Current Period"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
