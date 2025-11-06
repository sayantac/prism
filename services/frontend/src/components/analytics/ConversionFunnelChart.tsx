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
  const mockData = [
    { name: "Website Visits", value: 10000, fill: "hsl(var(--pr))" },
    { name: "Product Views", value: 4500, fill: "hsl(var(--in))" },
    { name: "Add to Cart", value: 1200, fill: "hsl(var(--wa))" },
    { name: "Checkout Started", value: 800, fill: "hsl(var(--er))" },
    { name: "Orders Completed", value: 600, fill: "hsl(var(--su))" },
  ];

  const chartData = data || mockData;

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
