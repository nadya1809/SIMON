import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
};

const badgeVariants = {
  default: "bg-[var(--surface)] text-[var(--foreground)]",
  success: "bg-[#e7f6ea] text-[#1f6b2b]",
  warning: "bg-[#fff3dc] text-[#8a5a00]",
  danger: "bg-[#fde8e6] text-[#a53125]"
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
