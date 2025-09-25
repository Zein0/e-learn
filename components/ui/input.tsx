import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-brand-200 bg-white px-4 text-sm text-brand-700 shadow-inner placeholder:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
