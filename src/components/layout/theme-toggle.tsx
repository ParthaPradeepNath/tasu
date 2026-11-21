"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const subscribeNoop = () => () => {};

export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label="Change theme" disabled>
        <Sun />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "menu" ? "ghost" : "ghost"}
          size="icon-sm"
          aria-label="Change theme"
          className="text-label-2"
        >
          {resolvedTheme === "dark" ? <Moon /> : <Sun />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme("system")}>
          <Monitor className="size-3.5" />
          System
          {theme === "system" && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
