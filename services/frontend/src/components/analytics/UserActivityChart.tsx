import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface UserActivityChartProps {
  data?: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
  }>;
  className?: string;
}

export const UserActivityChart: React.FC<UserActivityChartProps> = ({
  data,
  className = "",
}) => {
  // Mock data if none provided
  const mockData = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(
      Date.now() - (13 - i) * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-US", {
      weekday: "short",
    }),
    activeUsers: Math.floor(Math.random() * 200 + 100),
    newUsers: Math.floor(Math.random() * 50 + 10),
    returningUsers: Math.floor(Math.random() * 150 + 90),
  }));

  const chartData = data || mockData;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--bc) / 0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "hsl(var(--bc))" }}
            axisLine={{ stroke: "hsl(var(--bc) / 0.2)" }}
          />
          <YAxis
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
          />
          <Legend />
          <Bar
            dataKey="newUsers"
            stackId="a"
            fill="hsl(var(--su))"
            name="New Users"
            radius={[0, 0, 4, 4]}
          />
          <Bar
            dataKey="returningUsers"
            stackId="a"
            fill="hsl(var(--pr))"
            name="Returning Users"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
