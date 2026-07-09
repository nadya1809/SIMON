import { ButtonHTMLAttributes, forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-white shadow-[var(--shadow-sm)] hover:brightness-[1.02]",
  secondary:
    "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface)] hover:text-[var(--accent-strong)]",
  danger:
    "bg-[linear-gradient(135deg,var(--danger-strong),var(--danger-fg))] text-white shadow-[var(--shadow-sm)] hover:brightness-[1.02]"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: IconDefinition;
  iconPosition?: "left" | "right";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon && iconPosition === "left" ? (
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        ) : null}
        {children}
        {icon && iconPosition === "right" ? (
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";
