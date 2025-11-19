/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ui/admin/Chart.tsx
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartProps {
  type: "line" | "bar" | "area" | "pie";
  data: any[];
  xKey?: string;
  yKey?: string;
  title?: string;
  height?: number;
  color?: string;
  colors?: string[];
  loading?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const COLORS = [
  "oklch(var(--p))",
  "oklch(var(--s))",
  "oklch(var(--a))",
  "oklch(var(--su))",
  "oklch(var(--wa))",
  "oklch(var(--er))",
  "oklch(var(--in))",
  "oklch(var(--ne))",
];

export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  xKey = "name",
  yKey = "value",
  title,
  height = 300,
  color = "oklch(var(--p))",
  colors = COLORS,
  loading,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className = "",
}) => {
  if (loading) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          {title && <h3 className="card-title">{title}</h3>}
          <div className="skeleton w-full" style={{ height }}></div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "oklch(var(--bc) / 0.7)" }}
              axisLine={{ stroke: "oklch(var(--bc) / 0.2)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "oklch(var(--bc) / 0.7)" }}
              axisLine={{ stroke: "oklch(var(--bc) / 0.2)" }}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(var(--b1))",
                  border: "1px solid oklch(var(--b3))",
                  borderRadius: "8px",
                  color: "oklch(var(--bc))",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "oklch(var(--bc) / 0.7)" }}
              axisLine={{ stroke: "oklch(var(--bc) / 0.2)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "oklch(var(--bc) / 0.7)" }}
              axisLine={{ stroke: "oklch(var(--bc) / 0.2)" }}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(var(--b1))",
                  border: "1px solid oklch(var(--b3))",
                  borderRadius: "8px",
                  color: "oklch(var(--bc))",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "oklch(var(--bc) / 0.7)" }}
              axisLine={{ stroke: "oklch(var(--bc) / 0.2)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "oklch(var(--bc) / 0.7)" }}
              axisLine={{ stroke: "oklch(var(--bc) / 0.2)" }}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(var(--b1))",
                  border: "1px solid oklch(var(--b3))",
                  borderRadius: "8px",
                  color: "oklch(var(--bc))",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={color}
              fill={`${color}/20`}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart {...commonProps}>
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(var(--b1))",
                  border: "1px solid oklch(var(--b3))",
                  borderRadius: "8px",
                  color: "oklch(var(--bc))",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill={color}
              dataKey={yKey}
              label={({ name, percent }) =>
                `${name} ${(percent * 100)?.toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        {title && <h3 className="card-title text-base-content">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Generic Stats Grid Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period?: string;
  };
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color = "text-primary",
  loading,
}) => {
  if (loading) {
    return <div className="skeleton h-32 w-full"></div>;
  }

  return (
    <div className="stat bg-base-100 shadow rounded-box border border-base-300">
      <div className="stat-figure text-primary">
        {icon && <div className={color}>{icon}</div>}
      </div>
      <div className="stat-title text-base-content/70">{title}</div>
      <div className="stat-value text-base-content">{value}</div>
      {change && (
        <div
          className={`stat-desc ${
            change.type === "increase" ? "text-success" : "text-error"
          }`}
        >
          {change.type === "increase" ? "↗︎" : "↘︎"} {change.value}%
          {change.period && ` ${change.period}`}
        </div>
      )}
    </div>
  );
};

// Generic Data Table Component for Admin
interface AdminTableColumn {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface AdminTableProps {
  columns: AdminTableColumn[];
  data: any[];
  loading?: boolean;
  onRowClick?: (record: any) => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  className?: string;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  columns,
  data,
  loading,
  onRowClick,
  pagination,
  className = "",
}) => {
  if (loading) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <div className="space-y-4">
            <div className="skeleton h-8 w-full"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-base-content font-medium"
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((record, index) => (
                <tr
                  key={index}
                  className={`hover:bg-base-200 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(record)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="text-base-content">
                      {column.render
                        ? column.render(record[column.key], record)
                        : record[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex justify-center p-4">
            <div className="btn-group">
              <button
                className="btn btn-sm"
                disabled={pagination.current === 1}
                onClick={() => pagination.onChange(pagination.current - 1)}
              >
                «
              </button>
              <button className="btn btn-sm btn-active">
                Page {pagination.current}
              </button>
              <button
                className="btn btn-sm"
                disabled={
                  pagination.current >=
                  Math.ceil(pagination.total / pagination.pageSize)
                }
                onClick={() => pagination.onChange(pagination.current + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
