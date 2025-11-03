import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  icon?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  loading,
  onClick,
}) => {
  if (loading) {
    return <div className="skeleton h-32 w-full"></div>;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`card bg-base-100 shadow-xl ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-base-content/70">{title}</p>
            <p className="text-2xl font-bold text-base-content mt-1">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                {change.type === "increase" ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-error" />
                )}
                <span
                  className={`text-sm ${
                    change.type === "increase" ? "text-success" : "text-error"
                  }`}
                >
                  {change.value}% {change.period}
                </span>
              </div>
            )}
          </div>
          {icon && <div className="p-3 rounded-full bg-primary/10">{icon}</div>}
        </div>
      </div>
    </motion.div>
  );
};
