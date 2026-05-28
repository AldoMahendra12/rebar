import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      showLabel = false,
      size = "md",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-secondary",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-xs text-muted-foreground mt-1">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
