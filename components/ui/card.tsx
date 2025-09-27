import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-3xl border border-brand-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:bg-brand-800/60", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4 space-y-1", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-display text-xl text-brand-800 dark:text-brand-50", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-brand-600 dark:text-brand-100", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  disableSpace?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, disableSpace, ...props }, ref) => (
    <div ref={ref} className={cn(!disableSpace && "space-y-4", className)}  {...props} />
  ),
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
