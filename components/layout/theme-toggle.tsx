"use client";

import * as React from "react";

import { useTheme } from "next-themes";

import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWebHaptics } from "@/hooks/use-web-haptics";

const subscribeNoop = () => () => {};

export function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "menu";
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { triggerHaptic } = useWebHaptics();
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon-sm" aria-label="Change theme" disabled>
        <Sun />
      </Button>
    );
  }

  function chooseTheme(next: "light" | "dark" | "system") {
    triggerHaptic("light");
    setTheme(next);
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
          <motion.span
            key={resolvedTheme === "dark" ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex"
          >
            {resolvedTheme === "dark" ? <Moon /> : <Sun />}
          </motion.span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => chooseTheme("light")}>
          <Sun className="size-3.5" />
          Light
          {theme === "light" && (
            <span className="bg-accent ml-auto size-1.5 rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => chooseTheme("dark")}>
          <Moon className="size-3.5" />
          Dark
          {theme === "dark" && (
            <span className="bg-accent ml-auto size-1.5 rounded-full" />
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => chooseTheme("system")}>
          <Monitor className="size-3.5" />
          System
          {theme === "system" && (
            <span className="bg-accent ml-auto size-1.5 rounded-full" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
