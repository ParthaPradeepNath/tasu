"use client";

/* eslint-disable @next/next/no-img-element -- DiceBear serves a remote SVG; image optimization adds no value for these tiny placeholders. */

import * as React from "react";
import { avatarColor, cn, initials } from "@/lib/utils";

function GlassAvatarImage({ src, size }: { src: string; size: number }) {
  const [failed, setFailed] = React.useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

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
  const seed = name.trim() || "Tasu";
  const src = `https://api.dicebear.com/10.x/glass/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-1 ring-inset ring-white/15",
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
      <span className="absolute inset-0 flex items-center justify-center">
        {initials(name)}
      </span>
      <GlassAvatarImage key={src} src={src} size={size} />
    </span>
  );
}
