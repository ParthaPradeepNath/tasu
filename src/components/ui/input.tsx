import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded-[9px] border border-transparent bg-surface-sunken px-3 text-[13.5px] text-label shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] outline-none transition-[border-color,box-shadow,background-color] duration-100 placeholder:text-label-3 focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] focus:bg-surface-solid focus:shadow-[0_0_0_4px_var(--accent-soft)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-[10px] border border-transparent bg-surface-sunken px-3 py-2.5 text-[13.5px] leading-6 text-label outline-none transition-[border-color,box-shadow,background-color] duration-100 placeholder:text-label-3 focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] focus:bg-surface-solid focus:shadow-[0_0_0_4px_var(--accent-soft)]",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
