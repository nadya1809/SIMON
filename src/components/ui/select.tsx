import { forwardRef, SelectHTMLAttributes } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";
import { formControlClassName } from "@/components/ui/primitive-styles";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        data-slot="select"
        className={cn(
          formControlClassName,
          "h-11 appearance-none px-4 pr-11 [&_option]:bg-[var(--card)] [&_option]:text-[var(--foreground)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--muted)]">
        <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
      </span>
    </div>
  );
});

Select.displayName = "Select";
