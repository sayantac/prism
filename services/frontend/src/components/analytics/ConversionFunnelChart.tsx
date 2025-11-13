import {
    Cell,
    Funnel,
    FunnelChart,
    LabelList,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface ConversionFunnelChartProps {
  data?: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  className?: string;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  data,
  className = "",
}) => {
  // Use real API data, fallback to empty array
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={400}>
        <FunnelChart>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--b1))",
              border: "1px solid hsl(var(--b3))",
              borderRadius: "8px",
              color: "hsl(var(--bc))",
            }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} users`,
              name,
            ]}
          />
          <Funnel dataKey="value" data={chartData} isAnimationActive>
            <LabelList
              position="center"
              fill="white"
              stroke="none"
              fontSize={14}
            />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
};
