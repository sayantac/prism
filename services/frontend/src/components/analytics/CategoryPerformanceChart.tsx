import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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
  const mockData = [
    { name: "Electronics", value: 35, fill: "hsl(var(--pr))" },
    { name: "Clothing", value: 25, fill: "hsl(var(--se))" },
    { name: "Home & Garden", value: 20, fill: "hsl(var(--ac))" },
    { name: "Books", value: 12, fill: "hsl(var(--in))" },
    { name: "Others", value: 8, fill: "hsl(var(--wa))" },
  ];

  const chartData = data || mockData;

  const renderLabel = (entry: any) => {
    return `${entry.value}%`;
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
