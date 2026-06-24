import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-4 text-sm text-[var(--foreground)] shadow-[var(--shadow-sm)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(10,111,182,0.08)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";
