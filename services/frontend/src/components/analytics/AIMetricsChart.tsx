import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface AIMetricsChartProps {
  data?: Array<{
    date: string;
    ctr: number;
    conversionRate: number;
    impressions: number;
    modelAccuracy: number;
  }>;
  className?: string;
}

export const AIMetricsChart: React.FC<AIMetricsChartProps> = ({
  data,
  className = "",
}) => {
  // Use real API data, fallback to empty array
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "hsl(var(--bc))" }}
            axisLine={{ stroke: "hsl(var(--bc) / 0.2)" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "hsl(var(--bc))" }}
            axisLine={{ stroke: "hsl(var(--bc) / 0.2)" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
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
            formatter={(value: number, name: string) => {
              if (
                name.includes("Rate") ||
                name.includes("ctr") ||
                name.includes("Accuracy")
              ) {
                return [`${value?.toFixed(1)}%`, name];
              }
              return [value.toLocaleString(), name];
            }}
          />
          <Legend />
          <Bar
            yAxisId="right"
            dataKey="impressions"
            fill="hsl(var(--in) / 0.7)"
            name="Impressions"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ctr"
            stroke="hsl(var(--pr))"
            strokeWidth={2}
            name="Click-through Rate (%)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="conversionRate"
            stroke="hsl(var(--su))"
            strokeWidth={2}
            name="Conversion Rate (%)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="modelAccuracy"
            stroke="hsl(var(--wa))"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Model Accuracy (%)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
