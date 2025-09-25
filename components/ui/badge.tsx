import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, selected, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer items-center rounded-full border px-4 py-1 text-sm font-medium transition",
        selected
          ? "border-emerald-500 bg-emerald-500 text-white shadow-soft"
          : "border-brand-200 bg-white text-brand-700 hover:border-emerald-500 hover:bg-emerald-500/10",
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
