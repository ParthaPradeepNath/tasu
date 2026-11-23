"use client";

import * as React from "react";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  BookOpen,
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Ticket,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import type { Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";

export function UserMenu({
  user,
  variant = "sidebar",
  collapsed = false,
}: {
  user: Viewer;
  variant?: "sidebar" | "topbar";
  collapsed?: boolean;
}) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [signingOut, setSigningOut] = React.useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleLabel =
    user.role === "admin"
      ? "IT manager"
      : user.role === "agent"
        ? "IT agent"
        : "Employee";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className={cn(
              "press flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left",
              collapsed && "justify-center p-1"
            )}
            aria-label="Account menu"
          >
            <Avatar name={user.name} color={user.avatarColor} size={26} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="text-label block truncate text-[12.5px] leading-4 font-medium">
                    {user.name}
                  </span>
                  <span className="text-label-3 block truncate text-[11px] leading-4">
                    {roleLabel}
                  </span>
                </span>
                <ChevronsUpDown className="text-label-3 size-3.5 shrink-0" />
              </>
            )}
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Account menu"
          >
            <Avatar name={user.name} color={user.avatarColor} size={24} />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={variant === "topbar" ? "bottom" : "top"}
        className="w-[236px]"
      >
        <DropdownMenuLabel className="tracking-normal normal-case">
          <span className="text-label block text-[12.5px] font-medium">
            {user.name}
          </span>
          <span className="text-label-3 block truncate text-[11px] font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/tickets">
            <Ticket className="size-3.5" />
            My tickets
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/knowledge">
            <BookOpen className="size-3.5" />
            Knowledge base
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme("light")}>
          <Sun className="size-3.5" />
          Light
          {theme === "light" && (
            <span className="bg-accent ml-auto size-1.5 rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <Moon className="size-3.5" />
          Dark
          {theme === "dark" && (
            <span className="bg-accent ml-auto size-1.5 rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <Monitor className="size-3.5" />
          System
          {theme === "system" && (
            <span className="bg-accent ml-auto size-1.5 rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault();
            void signOut();
          }}
        >
          <LogOut className="size-3.5" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
