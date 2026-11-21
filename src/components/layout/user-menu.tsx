"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
  Ticket,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import type { Viewer } from "@/lib/session";
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
    user.role === "admin" ? "IT manager" : user.role === "agent" ? "IT agent" : "Employee";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className={cn(
              "press flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left",
              collapsed && "justify-center p-1",
            )}
            aria-label="Account menu"
          >
            <Avatar name={user.name} color={user.avatarColor} size={26} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium leading-4 text-label">
                    {user.name}
                  </span>
                  <span className="block truncate text-[11px] leading-4 text-label-3">
                    {roleLabel}
                  </span>
                </span>
                <ChevronsUpDown className="size-3.5 shrink-0 text-label-3" />
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
      <DropdownMenuContent align="start" side={variant === "topbar" ? "bottom" : "top"} className="w-[236px]">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block text-[12.5px] font-medium text-label">{user.name}</span>
          <span className="block truncate text-[11px] font-normal text-label-3">{user.email}</span>
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
          {theme === "light" && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}>
          <Moon className="size-3.5" />
          Dark
          {theme === "dark" && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <Monitor className="size-3.5" />
          System
          {theme === "system" && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
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
