import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-status-success/15 text-emerald-700 dark:text-emerald-300 border border-status-success/30",
        danger: "bg-status-danger/15 text-red-700 dark:text-red-300 border border-status-danger/30",
        warning: "bg-status-warning/15 text-amber-700 dark:text-amber-300 border border-status-warning/30",
        info: "bg-status-info/15 text-blue-700 dark:text-blue-300 border border-status-info/30",
        neutral: "bg-neutral-badge/15 text-gray-700 dark:text-gray-300 border border-neutral-badge/30",
        outline: "border border-divider text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
