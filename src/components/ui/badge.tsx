import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-status-success text-foreground border border-status-success/20",
        danger: "bg-status-danger text-foreground border border-status-danger/20",
        warning: "bg-status-warning text-foreground border border-status-warning/20",
        info: "bg-status-info text-foreground border border-status-info/20",
        neutral: "bg-neutral-badge text-foreground border border-neutral-badge/20",
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
