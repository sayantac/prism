// src/components/ui/Button.tsx
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "neutral"
    | "ghost"
    | "outline"
    | "error"
    | "success"
    | "warning"
    | "info";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  shape?: "square" | "circle";
  wide?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      children,
      className,
      disabled,
      shape,
      wide = false,
      block = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = "btn";

    const variantClasses = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      accent: "btn-accent",
      neutral: "btn-neutral",
      ghost: "btn-ghost",
      outline: "btn-outline",
      error: "btn-error",
      success: "btn-success",
      warning: "btn-warning",
      info: "btn-info",
    };

    const sizeClasses = {
      xs: "btn-xs",
      sm: "btn-sm",
      md: "", // default size
      lg: "btn-lg",
    };

    const shapeClasses = shape
      ? shape === "circle"
        ? "btn-circle"
        : "btn-square"
      : "";
    const wideClass = wide ? "btn-wide" : "";
    const blockClass = block ? "btn-block" : "";

    return (
      <motion.button
        ref={ref}
        className={twMerge(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          shapeClasses,
          wideClass,
          blockClass,
          className
        )}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && iconPosition === "left" && <span>{icon}</span>}
        {children}
        {!loading && icon && iconPosition === "right" && <span>{icon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
