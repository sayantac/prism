// src/components/common/EmptyState.tsx
import { Package } from "lucide-react";
import { Button } from "../ui/Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "accent" | "outline";
  };
  size?: "sm" | "md" | "lg";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Package className="w-16 h-16" />,
  title,
  description,
  action,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
  };

  const iconSizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const titleSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`hero ${sizeClasses[size]} bg-base-100`}>
      <div className="hero-content text-center">
        <div className="max-w-md">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`text-base-content/30 ${iconSizeClasses[size]}`}>
              {icon}
            </div>
          </div>

          {/* Title */}
          <h3
            className={`font-bold text-base-content ${titleSizeClasses[size]} mb-4`}
          >
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-base-content/70 mb-6 leading-relaxed">
              {description}
            </p>
          )}

          {/* Action Button */}
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
              size={size === "lg" ? "lg" : "md"}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
