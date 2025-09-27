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
        "inline-flex cursor-pointer items-center rounded-full border px-4 py-1 text-sm font-semibold transition-all",
        selected
          ? "border-transparent bg-emerald-500 text-white shadow-soft hover:bg-emerald-600"
          : "border-emerald-200 bg-white/80 text-brand-700 hover:border-emerald-400 hover:bg-emerald-500/10",
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
