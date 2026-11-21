"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

export function PropertySelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  variant = "row",
  align = "start",
  emptyLabel = "None",
  className,
}: {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  variant?: "row" | "pill";
  align?: "start" | "center" | "end";
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = query
    ? options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase()),
      )
    : options;
  const searchable = options.length > 7;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const trigger =
    variant === "pill" ? (
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "press inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface-solid px-2.5 text-[12px] font-medium text-label shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-surface-hover disabled:opacity-45",
            className,
          )}
        >
          <span className="text-label-3">{label}</span>
          <span className="max-w-[132px] truncate">
            {selected?.label ?? emptyLabel}
          </span>
          <ChevronDown className="size-3 text-label-3" />
        </button>
      </PopoverTrigger>
    ) : (
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "group flex h-8 w-full items-center gap-2 rounded-[7px] px-1.5 text-left text-[12.5px] transition-colors duration-150 hover:bg-fill disabled:pointer-events-none disabled:opacity-45",
            className,
          )}
        >
          <span className="w-[74px] shrink-0 text-label-3">{label}</span>
          <span className="min-w-0 flex-1 truncate text-label">
            {selected?.label ?? emptyLabel}
          </span>
          <ChevronDown className="size-3 shrink-0 text-label-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
    );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <PopoverContent align={align} className="w-[236px] p-1">
        {searchable && (
          <div className="flex items-center gap-2 border-b border-separator px-2 pb-1.5 pt-1">
            <Search className="size-3.5 shrink-0 text-label-3" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-6 w-full bg-transparent text-[12px] text-label outline-none placeholder:text-label-3"
              autoFocus
            />
          </div>
        )}
        <div className="max-h-[260px] overflow-y-auto overscroll-contain py-0.5">
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-center text-[11.5px] text-label-3">
              Nothing matches.
            </p>
          )}
          {filtered.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] transition-colors duration-100",
                  active
                    ? "bg-fill text-label"
                    : "text-label-2 hover:bg-fill hover:text-label",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.hint && (
                    <span className="block truncate text-[10.5px] text-label-3">
                      {option.hint}
                    </span>
                  )}
                </span>
                {active && <Check className="size-3.5 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
