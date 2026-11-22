"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { PropertySelect, type SelectOption } from "@/components/ui/property-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Assignee = { id: string; name: string };

const STATUSES: SelectOption[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_ON_USER", label: "Waiting on requester" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITIES: SelectOption[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "No priority" },
];

const CATEGORIES: SelectOption[] = [
  { value: "HARDWARE", label: "Hardware" },
  { value: "SOFTWARE", label: "Software" },
  { value: "NETWORK", label: "Network" },
  { value: "ACCESS", label: "Access" },
  { value: "OTHER", label: "Other" },
];

const FILTER_KEYS = ["status", "priority", "category", "assignee", "q"];

export function TicketFilterBar({
  assignees = [],
  showAssignee = false,
  placeholder = "Search tickets…",
  className,
}: {
  assignees?: Assignee[];
  showAssignee?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = React.useState(currentQuery);
  const [syncedQuery, setSyncedQuery] = React.useState(currentQuery);

  // Keep the field in sync when navigation clears or rewrites the search
  // without losing what the user is currently typing.
  if (currentQuery !== syncedQuery) {
    setSyncedQuery(currentQuery);
    if (query !== currentQuery) setQuery(currentQuery);
  }

  const active = FILTER_KEYS.filter((key) => searchParams.get(key));

  function apply(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    params.delete("cursor");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;
    const timer = setTimeout(() => apply("q", query || null), 260);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const assigneeOptions: SelectOption[] = [
    { value: "me", label: "Assigned to me" },
    { value: "unassigned", label: "Unassigned" },
    ...assignees.map((person) => ({ value: person.id, label: person.name })),
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      <div className="relative flex h-7 min-w-[168px] flex-1 items-center gap-1.5 rounded-full border border-separator bg-surface-solid/70 pl-2.5 pr-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] duration-100 focus-within:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)] sm:max-w-[260px]">
        <Search className="size-3.5 shrink-0 text-label-3" />
        <input
          data-search-input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-label outline-none placeholder:text-label-3"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="press inline-flex size-4 items-center justify-center rounded-full bg-fill text-label-3 hover:text-label"
          >
            <X className="size-2.5" />
          </button>
        )}
      </div>

      <PropertySelect
        variant="pill"
        label="Status"
        value={searchParams.get("status")}
        options={STATUSES}
        onChange={(value) => apply("status", value)}
        emptyLabel="Any"
      />
      <PropertySelect
        variant="pill"
        label="Priority"
        value={searchParams.get("priority")}
        options={PRIORITIES}
        onChange={(value) => apply("priority", value)}
        emptyLabel="Any"
      />
      <PropertySelect
        variant="pill"
        label="Category"
        value={searchParams.get("category")}
        options={CATEGORIES}
        onChange={(value) => apply("category", value)}
        emptyLabel="Any"
      />
      {showAssignee && (
        <PropertySelect
          variant="pill"
          label="Assignee"
          value={searchParams.get("assignee")}
          options={assigneeOptions}
          onChange={(value) => apply("assignee", value)}
          emptyLabel="Anyone"
        />
      )}

      {active.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname, { scroll: false })}
          className="h-7 gap-1 px-1.5 text-[11.5px] text-label-3"
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
