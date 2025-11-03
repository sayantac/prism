import { twMerge } from "tailwind-merge";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
}) => {
  const baseClasses = "badge";

  const variantClasses = {
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info",
  };

  const sizeClasses = {
    xs: "badge-xs",
    sm: "badge-sm",
    md: "badge-md",
    lg: "badge-lg",
  };

  return (
    <>
      {onClick ? (
        <span
          className={twMerge(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
          onClick={onClick}
        >
          {children}
        </span>
      ) : (
        <span
          className={twMerge(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
        >
          {children}
        </span>
      )}
    </>
  );
};
