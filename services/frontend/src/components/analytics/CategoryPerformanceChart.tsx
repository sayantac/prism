import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

// Fallback to 'any' for PieLabelRenderProps if type import fails

interface CategoryPerformanceChartProps {
  data?: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  className?: string;
}

export const CategoryPerformanceChart: React.FC<
  CategoryPerformanceChartProps
> = ({ data, className = "" }) => {
  // Use real API data, fallback to empty array
  const chartData = Array.isArray(data) ? data : [];

  const renderLabel = (props: any) => {
    return `${props.value}%`;
  };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--b1))",
              border: "1px solid hsl(var(--b3))",
              borderRadius: "8px",
              color: "hsl(var(--bc))",
            }}
            formatter={(value: number) => [`${value}%`, "Share"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
