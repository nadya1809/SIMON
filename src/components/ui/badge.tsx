import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
};

const badgeVariants = {
  default: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  success: "bg-[#e5f3eb] text-[#18603f]",
  warning: "bg-[#fff4dc] text-[#8c5d00]",
  danger: "bg-[#fbe7e4] text-[#a33a2b]"
};

export function Badge({
  children,
  variant = "default",
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
