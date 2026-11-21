import { avatarColor, cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  color,
  size = 24,
  className,
}: {
  name: string;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ring-1 ring-inset ring-white/15",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color ?? avatarColor(name),
        fontSize: Math.max(8, Math.round(size * 0.38)),
        letterSpacing: "-0.01em",
      }}
      title={name}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
