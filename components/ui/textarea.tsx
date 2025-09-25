import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-700 shadow-inner placeholder:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
