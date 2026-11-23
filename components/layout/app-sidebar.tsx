"use client";

import Link from "next/link";

import { Plus, Search } from "lucide-react";

import { Logo, Wordmark } from "@/components/brand";
import { UserMenu } from "@/components/layout/user-menu";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Viewer } from "@/lib/session";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  count?: number;
  exact?: boolean;
};

function openSearch() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
  );
}

function NavRow({
  item,
  pathname,
}: {
  item: SidebarNavItem;
  pathname: string;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href} aria-current={active ? "page" : undefined}>
          <Icon strokeWidth={1.7} />
          <span className="flex-1 truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {typeof item.count === "number" && item.count > 0 && (
        <SidebarMenuBadge>
          {item.count > 99 ? "99+" : item.count}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  user,
  primary,
  workspace,
  pathname,
}: {
  user: Viewer;
  primary: SidebarNavItem[];
  workspace: SidebarNavItem[];
  pathname: string;
}) {
  const { state } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon" className="glass-chrome">
      <SidebarHeader className="border-separator h-[53px] justify-center border-b px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Tasu overview">
              <Link href="/app" className="gap-2">
                <Logo size={27} />
                <Wordmark className="group-data-[collapsible=icon]:hidden" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent role="navigation" aria-label="Main" className="pt-1">
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link
              href="/app/tickets/new"
              title="New ticket"
              aria-label="New ticket"
            >
              <Plus />
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {primary.map((item) => (
                <NavRow key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspace.map((item) => (
                <NavRow key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-separator border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Search" onClick={openSearch}>
              <Search />
              <span className="flex-1">Search</span>
              <Kbd>⌘K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <div className="px-0.5">
          <UserMenu
            user={user}
            variant="sidebar"
            collapsed={state === "collapsed"}
          />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
