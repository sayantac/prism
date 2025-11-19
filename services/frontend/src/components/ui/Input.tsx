// src/components/ui/Input.tsx
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  variant?: "bordered" | "ghost" | "filled";
  inputSize?: "xs" | "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      iconPosition = "left",
      className,
      variant = "bordered",
      inputSize = "md",
      ...props
    },
    ref
  ) => {
    const baseClasses = "input w-full";

    const variantClasses = {
      bordered: "input-bordered",
      ghost: "input-ghost",
      filled: "", // default filled style
    };

    const sizeClasses = {
      xs: "input-xs",
      sm: "input-sm",
      md: "input-md",
      lg: "input-lg",
    };

    const errorClasses = error ? "input-error" : "";

    return (
      <div className="form-control w-full">
        {label && (
          <label className="label">
            <span className="label-text text-base-content font-medium">
              {label}
            </span>
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/60">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              baseClasses,
              variantClasses[variant],
              sizeClasses[inputSize],
              errorClasses,
              icon && iconPosition === "left" ? "pl-10" : "",
              icon && iconPosition === "right" ? "pr-10" : "",
              "bg-base-100 text-base-content placeholder:text-base-content/50",
              className
            )}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-base-content/60">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
