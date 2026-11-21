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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Ticket,
  X,
} from "lucide-react";
import type { Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Logo, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { CommandPalette } from "@/components/layout/command-palette";
import { GlobalShortcuts } from "@/components/layout/global-shortcuts";

const SIDEBAR_EVENT = "tasu:sidebar";
const SIDEBAR_KEY = "tasu.sidebar";

function subscribeSidebar(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SIDEBAR_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SIDEBAR_EVENT, onChange);
  };
}

const getSidebarCollapsed = () =>
  window.localStorage.getItem(SIDEBAR_KEY) === "collapsed";

const getSidebarCollapsedOnServer = () => false;

type Counts = {
  inbox: number;
  unassigned: number;
  waiting: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  count?: number;
  exact?: boolean;
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
  const collapsed = React.useSyncExternalStore(
    subscribeSidebar,
    getSidebarCollapsed,
    getSidebarCollapsedOnServer,
  );
  const pathname = usePathname();
  // Track which route opened the drawer. Navigating changes the pathname, so
  // the drawer closes itself without an effect.
  const [mobileOpenPath, setMobileOpenPath] = React.useState<string | null>(
    null,
  );
  const mobileOpen = mobileOpenPath === pathname;
  const isStaff = user.role !== "employee";

  React.useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpenPath(null);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem("tasu.sidebar", next ? "collapsed" : "expanded");
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  }

  const primary: NavItem[] = [
    { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
    {
      href: "/app/inbox",
      label: "Inbox",
      icon: Inbox,
      count: counts.inbox,
    },
    { href: "/app/tickets", label: "My tickets", icon: Ticket },
  ];

  const workspace: NavItem[] = [
    ...(isStaff
      ? [
          {
            href: "/app/queue",
            label: "Queue",
            icon: Ticket,
            count: counts.unassigned,
          } satisfies NavItem,
          {
            href: "/app/reports",
            label: "Reports",
            icon: ChartNoAxesColumn,
          } satisfies NavItem,
        ]
      : []),
    { href: "/app/knowledge", label: "Knowledge", icon: BookOpen },
  ];

  return (
    <div className="flex min-h-dvh">
      <CommandPalette user={user} />
      <GlobalShortcuts user={user} />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "glass-chrome sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-separator transition-[width] duration-200 [transition-timing-function:var(--ease-spring)] lg:flex",
          collapsed ? "w-[68px]" : "w-[236px]",
        )}
      >
        <SidebarBody
          user={user}
          counts={counts}
          collapsed={collapsed}
          pathname={pathname}
          primary={primary}
          workspace={workspace}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpenPath(null)}
          className={cn(
            "absolute inset-0 bg-black/30 backdrop-blur-[3px] transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "glass-chrome absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-line shadow-[var(--shadow-dialog)] transition-transform duration-300 [transition-timing-function:var(--ease-spring)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="absolute right-2.5 top-2.5 z-10">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close navigation"
              onClick={() => setMobileOpenPath(null)}
            >
              <X />
            </Button>
          </div>
          <SidebarBody
            user={user}
            counts={counts}
            collapsed={false}
            pathname={pathname}
            primary={primary}
            workspace={workspace}
            onNavigate={() => setMobileOpenPath(null)}
          />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-chrome sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-2 border-b border-separator px-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpenPath(pathname)}
          >
            <Menu />
          </Button>

          <Breadcrumbs pathname={pathname} />

          <div className="ml-auto flex items-center gap-1">
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

        <main className="app-canvas min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarBody({
  user,
  collapsed,
  pathname,
  primary,
  workspace,
  onToggleCollapse,
  onNavigate,
}: {
  user: Viewer;
  counts: Counts;
  collapsed: boolean;
  pathname: string;
  primary: NavItem[];
  workspace: NavItem[];
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          "flex h-[52px] shrink-0 items-center gap-2 border-b border-separator",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <Link
          href="/app"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-[7px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label="Tasu overview"
        >
          <Logo size={27} />
          {!collapsed && <Wordmark />}
        </Link>
        {!collapsed && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-label-3"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
          >
            <PanelLeftClose />
          </Button>
        )}
      </div>

      <div className={cn("shrink-0", collapsed ? "px-2 pt-3" : "px-3 pt-3")}>
        <Button
          asChild
          variant="primary"
          size={collapsed ? "icon" : "md"}
          className={cn("shadow-none", !collapsed && "w-full justify-start")}
        >
          <Link
            href="/app/tickets/new"
            onClick={onNavigate}
            title={collapsed ? "New ticket" : undefined}
          >
            <Plus />
            {!collapsed && (
              <>
                New ticket
                <Kbd className="ml-auto border-white/20 bg-white/10 text-white/70">
                  C
                </Kbd>
              </>
            )}
          </Link>
        </Button>
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto overscroll-contain pb-3 pt-4",
          collapsed ? "px-2" : "px-2.5",
        )}
        aria-label="Main"
      >
        <NavGroup
          items={primary}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <div className="my-3 h-px bg-separator" />
        {!collapsed && <p className="eyebrow mb-1.5 px-2">Workspace</p>}
        <NavGroup
          items={workspace}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-separator p-2",
          collapsed ? "flex flex-col items-center gap-1" : "space-y-1",
        )}
      >
        {!collapsed && (
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
            className="press flex h-8 w-full items-center gap-2 rounded-[8px] px-2 text-[12px] text-label-3"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
        <UserMenu user={user} collapsed={collapsed} />
        {collapsed && onToggleCollapse && (
          <TooltiplessIconButton
            label="Expand sidebar"
            onClick={onToggleCollapse}
          >
            <PanelLeftOpen />
          </TooltiplessIconButton>
        )}
      </div>
    </>
  );
}

function TooltiplessIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="press inline-flex size-7 items-center justify-center rounded-[7px] text-label-3 hover:text-label [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}

function NavGroup({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-8 items-center gap-2.5 rounded-[8px] text-[12.5px] font-medium transition-[background-color,color,box-shadow] duration-150",
                collapsed ? "justify-center px-0" : "px-2",
                active
                  ? "bg-surface-solid text-label shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-label-2 hover:bg-surface-hover hover:text-label",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-accent" : "text-label-3 group-hover:text-label-2",
                )}
                strokeWidth={1.7}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span className="num rounded-full bg-fill px-1.5 py-0.5 text-[10px] font-medium leading-none text-label-2">
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
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
