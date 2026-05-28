import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-700",
        secondary: "bg-zinc-100 text-zinc-600",
        destructive: "bg-red-50 text-red-600",
        outline: "border border-zinc-200 text-zinc-700",
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        info: "bg-blue-50 text-blue-600",
        behind: "bg-red-50 text-red-600",
        ahead: "bg-blue-50 text-blue-600",
        on_track: "bg-emerald-50 text-emerald-600",
        planning: "bg-zinc-100 text-zinc-600",
        completed: "bg-emerald-50 text-emerald-600",
        on_hold: "bg-amber-50 text-amber-600",
        active: "bg-blue-50 text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
