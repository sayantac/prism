import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "./Button";

interface AlertProps {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = "info",
  className = "",
  onClose,
}) => {
  const baseClasses = "alert";

  const variantClasses = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
  };

  const icons = {
    info: <Info className="w-6 h-6" />,
    success: <CheckCircle className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
  };

  return (
    <div className={twMerge(baseClasses, variantClasses[variant], className)}>
      {icons[variant]}
      <span>{children}</span>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="btn-circle btn-xs"
          icon={<X className="w-4 h-4" />}
        />
      )}
    </div>
  );
};
