"use client";

import { useEffect, useRef, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
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
};

export function ActionMenu({
  items,
  align = "right"
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
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

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <button
        type="button"
        aria-label="Aksi data"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--muted)] shadow-[var(--shadow-sm)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div
          className={cn(
            "absolute top-11 z-30 min-w-44 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-md)]",
            align === "right" ? "right-0" : "left-0"
          )}
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
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
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
        </div>
      ) : null}
    </div>
  );
}
