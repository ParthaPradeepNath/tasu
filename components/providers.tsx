"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={150}>
          {children}
          <AppToaster />
        </TooltipPrimitive.Provider>
      </MotionConfig>
    </NextThemesProvider>
  );
}

function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      offset={20}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[14px] !border !border-[var(--line)] !bg-[var(--surface-solid)] !text-[var(--label)] !shadow-[var(--shadow-pop)] !font-sans",
          title: "!text-[13px] !font-medium",
          description: "!text-[12px] !text-[var(--label-2)]",
          actionButton:
            "!bg-[var(--accent)] !text-white !rounded-[7px] !text-[12px] !font-medium",
          cancelButton:
            "!bg-[var(--fill)] !text-[var(--label-2)] !rounded-[7px] !text-[12px]",
        },
      }}
    />
  );
}
