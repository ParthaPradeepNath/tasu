"use client";

import * as React from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "motion-pop border-line text-label z-50 w-72 overflow-hidden rounded-[12px] border bg-[color-mix(in_srgb,var(--surface-solid)_92%,transparent)] p-1.5 shadow-[var(--shadow-pop)] backdrop-blur-2xl",
        className
      )}
      style={{
        transformOrigin:
          "var(--radix-popover-content-transform-origin, center)",
      }}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
