"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  faCheck,
  faChevronDown,
  faMagnifyingGlass
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";
import { formControlClassName } from "@/components/ui/primitive-styles";

type OfficerOption = {
  id: string;
  name: string;
  nip: string;
  unitName: string;
};

type SearchableOfficerSelectProps = {
  value: string;
  officers: OfficerOption[];
  onChange: (value: string) => void;
  allValue?: string;
  allLabel?: string;
  disabled?: boolean;
  placeholder?: string;
};

function getOfficerLabel(officer: OfficerOption) {
  return `${officer.name} - ${officer.nip} - ${officer.unitName}`;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("id-ID").trim();
}

export function SearchableOfficerSelect({
  value,
  officers,
  onChange,
  allValue = "",
  allLabel = "Semua petugas",
  disabled = false,
  placeholder = "Cari nama atau NIP"
}: SearchableOfficerSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOfficer = officers.find((officer) => officer.id === value);
  const selectedLabel =
    value === allValue || !selectedOfficer ? allLabel : getOfficerLabel(selectedOfficer);
  const normalizedQuery = normalizeSearch(query);
  const filteredOfficers = useMemo(() => {
    if (!normalizedQuery) {
      return officers;
    }

    return officers.filter((officer) =>
      normalizeSearch(
        `${officer.name} ${officer.nip} ${officer.unitName}`
      ).includes(normalizedQuery)
    );
  }, [normalizedQuery, officers]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--muted)]">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={isOpen ? query : selectedLabel}
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          className={cn(formControlClassName, "h-11 px-10 pr-11")}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            if (!isOpen) {
              setIsOpen(true);
            }
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              setQuery("");
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              selectValue(filteredOfficers[0]?.id ?? allValue);
            }
          }}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label="Buka filter petugas"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--muted)] disabled:cursor-not-allowed"
          onClick={() => {
            setIsOpen((current) => !current);
            setQuery("");
          }}
        >
          <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
        </button>
      </div>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--card)] p-1 shadow-[var(--shadow-md)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === allValue}
            className="flex w-full items-center justify-between rounded-[var(--radius-control)] px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
            onClick={() => selectValue(allValue)}
          >
            <span>{allLabel}</span>
            {value === allValue ? (
              <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 text-[var(--accent)]" />
            ) : null}
          </button>

          {filteredOfficers.length ? (
            filteredOfficers.map((officer) => (
              <button
                key={officer.id}
                type="button"
                role="option"
                aria-selected={value === officer.id}
                className="flex w-full items-start justify-between gap-3 rounded-[var(--radius-control)] px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
                onClick={() => selectValue(officer.id)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{officer.name}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">
                    {officer.nip} - {officer.unitName}
                  </span>
                </span>
                {value === officer.id ? (
                  <FontAwesomeIcon icon={faCheck} className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-[var(--muted)]">
              Petugas tidak ditemukan.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
