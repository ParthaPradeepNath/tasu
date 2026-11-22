"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  Search,
  Ticket,
} from "lucide-react";
import type { Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { CommandPalette } from "@/components/layout/command-palette";
import { GlobalShortcuts } from "@/components/layout/global-shortcuts";
import { AppSidebar, type SidebarNavItem } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type Counts = {
  inbox: number;
  unassigned: number;
  waiting: number;
};

export function AppShell({
  user,
  counts,
  children,
}: {
  user: Viewer;
  counts: Counts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStaff = user.role !== "employee";

  const primary: SidebarNavItem[] = [
    { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
    {
      href: "/app/inbox",
      label: "Inbox",
      icon: Inbox,
      count: counts.inbox,
    },
    { href: "/app/tickets", label: "My tickets", icon: Ticket },
  ];

  const workspace: SidebarNavItem[] = [
    ...(isStaff
      ? [
          {
            href: "/app/queue",
            label: "Queue",
            icon: Ticket,
            count: counts.unassigned,
          } satisfies SidebarNavItem,
          {
            href: "/app/reports",
            label: "Reports",
            icon: ChartNoAxesColumn,
          } satisfies SidebarNavItem,
        ]
      : []),
    { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
  ];

  return (
    <SidebarProvider className="min-h-dvh">
      <CommandPalette user={user} />
      <GlobalShortcuts user={user} />

      <AppSidebar
        user={user}
        primary={primary}
        workspace={workspace}
        pathname={pathname}
      />

      <SidebarInset>
        <header className="glass-chrome sticky top-0 z-30 flex h-[var(--topbar-h)] shrink-0 items-center gap-2 border-b border-separator px-3 sm:px-5">
          <SidebarTrigger className="-ml-1" />

          <Breadcrumbs pathname={pathname} />

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                document.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "k",
                    metaKey: true,
                    bubbles: true,
                  }),
                )
              }
              className="press hidden h-8 items-center gap-2 rounded-[8px] border border-separator bg-surface-solid/60 pl-2.5 pr-1.5 text-[12px] text-label-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:flex sm:w-[210px]"
            >
              <Search className="size-3.5" />
              <span className="flex-1 text-left">Search Tasu</span>
              <Kbd className="border-transparent bg-fill">⌘K</Kbd>
            </button>

            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="relative"
              aria-label={`Inbox${counts.inbox ? `, ${counts.inbox} unread` : ""}`}
            >
              <Link href="/app/inbox">
                <Inbox />
                {counts.inbox > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent ring-2 ring-[var(--sidebar)]" />
                )}
              </Link>
            </Button>

            <ThemeToggle />
            <div className="ml-1">
              <UserMenu user={user} variant="topbar" />
            </div>
          </div>
        </header>

        <div className="app-canvas min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            <PageTransition key={pathname}>{children}</PageTransition>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.replace(/^\/app\/?/, "").split("/").filter(Boolean);
  const labels: Record<string, string> = {
    tickets: "My tickets",
    queue: "Queue",
    new: "New ticket",
    inbox: "Inbox",
    knowledge: "Knowledge",
    reports: "Reports",
  };

  const crumbs =
    parts.length === 0
      ? [{ label: "Overview", last: true }]
      : parts.map((part, index) => {
          const last = index === parts.length - 1;
          const label =
            labels[part] ??
            (parts[0] === "knowledge"
              ? "Article"
              : /^HD-\d+$/.test(part)
                ? part
                : part.replace(/-/g, " "));
          return { label, last };
        });

  if (crumbs.length > 2) crumbs.splice(1, crumbs.length - 2);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[12.5px]">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.label}-${index}`}>
          {index > 0 && (
            <ChevronRight className="size-3 shrink-0 text-label-3" />
          )}
          <span
            className={cn(
              "truncate",
              crumb.last ? "font-medium text-label" : "text-label-3",
            )}
            aria-current={crumb.last ? "page" : undefined}
          >
            {crumb.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
