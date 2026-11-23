"use client";

import * as React from "react";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { Command } from "cmdk";
import {
  BookOpen,
  ChartNoAxesColumn,
  CornerDownLeft,
  FileText,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Ticket,
} from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import { authClient } from "@/lib/auth-client";
import type { Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";

type Results = {
  tickets: { id: string; key: string; title: string; status: string }[];
  articles: { id: string; slug: string; title: string }[];
};

const EMPTY: Results = { tickets: [], articles: [] };

export function CommandPalette({ user }: { user: Viewer }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { triggerHaptic } = useWebHaptics();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Results>(EMPTY);
  const [loading, setLoading] = React.useState(false);
  const isStaff = user.role !== "employee";
  const term = query.trim();
  const searching = term.length >= 2;

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        triggerHaptic("light");
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [triggerHaptic]);

  React.useEffect(() => {
    if (!searching) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          setResults((await response.json()) as Results);
        }
      } catch {
        // Aborted or offline — keep the previous results.
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searching, term]);

  function handleOpenChange(next: boolean) {
    if (next) triggerHaptic("light");
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults(EMPTY);
      setLoading(false);
    }
  }

  function run(action: () => void) {
    triggerHaptic("medium");
    setOpen(false);
    action();
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label="Command menu"
      shouldFilter
      overlayClassName="motion-overlay fixed inset-0 z-[80] bg-black/30 backdrop-blur-[4px]"
      contentClassName={cn(
        "motion-dialog fixed left-1/2 top-[16%] z-[81] w-[min(620px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[16px] border border-line bg-[color-mix(in_srgb,var(--surface-solid)_92%,transparent)] text-label shadow-[var(--shadow-dialog)] backdrop-blur-2xl"
      )}
    >
      <div className="border-separator flex h-12 items-center gap-2.5 border-b px-3.5">
        {loading ? (
          <Loader2 className="text-label-3 size-4 shrink-0 animate-spin" />
        ) : (
          <Search className="text-label-3 size-4 shrink-0" />
        )}
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search tickets, articles, or jump to…"
          className="text-label placeholder:text-label-3 h-full flex-1 bg-transparent text-[14px] outline-none"
        />
        <Kbd>esc</Kbd>
      </div>

      <Command.List className="max-h-[min(460px,60dvh)] overflow-y-auto overscroll-contain p-1.5">
        <Command.Empty className="text-label-2 px-3 py-8 text-center text-[13px]">
          {loading ? "Searching…" : "Nothing found for that search."}
        </Command.Empty>

        {query.trim().length < 2 && (
          <>
            <Command.Group heading="Go to" className="cmd-group">
              <PaletteItem
                icon={<LayoutDashboard />}
                label="Overview"
                onSelect={() => run(() => router.push("/app"))}
              />
              <PaletteItem
                icon={<Inbox />}
                label="Inbox"
                onSelect={() => run(() => router.push("/app/inbox"))}
              />
              <PaletteItem
                icon={<Ticket />}
                label="My tickets"
                shortcut="G T"
                onSelect={() => run(() => router.push("/app/tickets"))}
              />
              {isStaff && (
                <PaletteItem
                  icon={<Ticket />}
                  label="Queue"
                  shortcut="G Q"
                  onSelect={() => run(() => router.push("/app/queue"))}
                />
              )}
              {isStaff && (
                <PaletteItem
                  icon={<ChartNoAxesColumn />}
                  label="Reports"
                  onSelect={() => run(() => router.push("/app/reports"))}
                />
              )}
              <PaletteItem
                icon={<BookOpen />}
                label="Knowledge base"
                shortcut="G K"
                onSelect={() => run(() => router.push("/app/knowledge"))}
              />
            </Command.Group>

            <Command.Group heading="Actions" className="cmd-group">
              <PaletteItem
                icon={<Plus />}
                label="New ticket"
                shortcut="C"
                onSelect={() => run(() => router.push("/app/tickets/new"))}
              />
              <PaletteItem
                icon={<Sun />}
                label="Use light appearance"
                onSelect={() => run(() => setTheme("light"))}
              />
              <PaletteItem
                icon={<Moon />}
                label="Use dark appearance"
                onSelect={() => run(() => setTheme("dark"))}
              />
              <PaletteItem
                icon={<LogOut />}
                label="Sign out"
                onSelect={() =>
                  run(async () => {
                    await authClient.signOut();
                    router.push("/login");
                    router.refresh();
                  })
                }
              />
            </Command.Group>
          </>
        )}

        {query.trim().length >= 2 && results.tickets.length > 0 && (
          <Command.Group heading="Tickets" className="cmd-group">
            {results.tickets.map((ticket) => (
              <PaletteItem
                key={ticket.id}
                icon={<Ticket />}
                label={ticket.title}
                hint={ticket.key}
                onSelect={() =>
                  run(() => router.push(`/app/tickets/${ticket.key}`))
                }
              />
            ))}
          </Command.Group>
        )}

        {query.trim().length >= 2 && results.articles.length > 0 && (
          <Command.Group heading="Knowledge" className="cmd-group">
            {results.articles.map((article) => (
              <PaletteItem
                key={article.id}
                icon={<FileText />}
                label={article.title}
                onSelect={() =>
                  run(() => router.push(`/app/knowledge/${article.slug}`))
                }
              />
            ))}
          </Command.Group>
        )}
      </Command.List>

      <div className="border-separator text-label-3 flex items-center justify-between border-t px-3.5 py-2 text-[10.5px]">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>
              <CornerDownLeft className="size-2.5" />
            </Kbd>
            open
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd> anywhere
        </span>
      </div>
    </Command.Dialog>
  );
}

function PaletteItem({
  icon,
  label,
  hint,
  shortcut,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="ease-amicro data-[selected=true]:bg-fill data-[selected=true]:text-label [&_svg]:text-label-3 flex h-9 cursor-default items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] transition-colors duration-150 outline-none select-none [&_svg]:size-3.5"
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <span className="text-label-3 font-mono text-[10.5px]">{hint}</span>
      )}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Command.Item>
  );
}
