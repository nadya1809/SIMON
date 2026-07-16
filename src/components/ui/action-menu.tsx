"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ActionMenuItem = {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  icon?: IconDefinition;
  disabled?: boolean;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  align?: "left" | "right";
  triggerLabel?: string;
};

export function ActionMenu({
  items,
  align = "right",
  triggerLabel = "Aksi data"
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const canPortal = typeof document !== "undefined";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !menuRef.current?.contains(target) &&
        !portalMenuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const minWidth = 176;
      const viewportPadding = 16;
      const estimatedMenuHeight = items.length * 40 + 16;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const shouldOpenUpward = spaceBelow < estimatedMenuHeight;
      const top = shouldOpenUpward
        ? Math.max(viewportPadding, rect.top - estimatedMenuHeight - 8)
        : rect.bottom + 8;
      const preferredLeft =
        align === "right"
          ? rect.right - minWidth
          : rect.left;
      const maxLeft = window.innerWidth - minWidth - viewportPadding;
      const left = Math.min(
        Math.max(viewportPadding, preferredLeft),
        maxLeft
      );

      setMenuStyle({
        top,
        left,
        minWidth: Math.max(rect.width + 84, minWidth)
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, isOpen, items.length]);

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title={triggerLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-[var(--shadow-sm)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
      </button>

      {isOpen && canPortal && menuStyle
        ? createPortal(
            <div
              id={menuId}
              ref={portalMenuRef}
              className="fixed z-[200] rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[0_22px_44px_rgba(24,50,71,0.18)]"
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
                minWidth: menuStyle.minWidth
              }}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[0.75rem] px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                    item.variant === "danger"
                      ? "text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
                      : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                  )}
                >
                  {item.icon ? (
                    <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                  ) : null}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
