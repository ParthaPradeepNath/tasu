import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "press focus-ring inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-accent-hover",
        secondary:
          "border border-line bg-surface-solid text-label shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-surface-hover",
        ghost: "text-label-2 hover:bg-fill hover:text-label",
        subtle: "bg-fill text-label hover:bg-fill-strong",
        danger:
          "bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-110",
        glass:
          "glass border border-line text-label shadow-[var(--shadow-card)] hover:bg-surface-raised",
        link: "text-accent hover:text-accent-hover hover:underline hover:underline-offset-2",
      },
      size: {
        xs: "h-6 rounded-[6px] px-2 text-[11.5px] [&_svg]:size-3.5",
        sm: "h-7 rounded-[7px] px-2.5 text-[12px] [&_svg]:size-3.5",
        md: "h-8 rounded-[8px] px-3 text-[13px] [&_svg]:size-4",
        lg: "h-9 rounded-[9px] px-3.5 text-[13.5px] [&_svg]:size-4",
        xl: "h-10 rounded-[10px] px-4 text-[14px] [&_svg]:size-4",
        icon: "size-8 rounded-[8px] [&_svg]:size-4",
        "icon-sm": "size-7 rounded-[7px] [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
