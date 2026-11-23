import type {
  Category,
  Priority,
  TicketStatus,
} from "@/generated/prisma/enums";

export const STATUS_ORDER: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_USER",
  "RESOLVED",
  "CLOSED",
];

export const STATUS_META: Record<
  TicketStatus,
  { label: string; tone: Tone; description: string }
> = {
  OPEN: {
    label: "Open",
    tone: "info",
    description: "New and waiting for IT to pick it up.",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "accent",
    description: "Someone in IT is working on this.",
  },
  WAITING_ON_USER: {
    label: "Waiting on you",
    tone: "warning",
    description: "IT needs more information from you.",
  },
  RESOLVED: {
    label: "Resolved",
    tone: "success",
    description: "The fix is in. Confirm it worked.",
  },
  CLOSED: {
    label: "Closed",
    tone: "neutral",
    description: "This ticket is done.",
  },
};

export type Tone =
  "accent" | "info" | "warning" | "success" | "danger" | "neutral" | "purple";

export const TONE_CLASSES: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-fill text-label-2",
  purple: "bg-purple-soft text-purple",
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; bars: number; tone: Tone }
> = {
  NONE: { label: "No priority", bars: 0, tone: "neutral" },
  LOW: { label: "Low", bars: 1, tone: "neutral" },
  MEDIUM: { label: "Medium", bars: 2, tone: "accent" },
  HIGH: { label: "High", bars: 3, tone: "warning" },
  URGENT: { label: "Urgent", bars: 3, tone: "danger" },
};

export const PRIORITY_ORDER: Priority[] = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NONE",
];

export const CATEGORY_META: Record<Category, { label: string }> = {
  HARDWARE: { label: "Hardware" },
  SOFTWARE: { label: "Software" },
  NETWORK: { label: "Network" },
  ACCESS: { label: "Access" },
  OTHER: { label: "Other" },
};

export const CATEGORY_TONE: Record<Category, Tone> = {
  HARDWARE: "neutral",
  SOFTWARE: "accent",
  NETWORK: "info",
  ACCESS: "purple",
  OTHER: "neutral",
};

export const CATEGORY_ORDER: Category[] = [
  "HARDWARE",
  "SOFTWARE",
  "NETWORK",
  "ACCESS",
  "OTHER",
];

export function firstName(name: string | null | undefined) {
  if (!name) return "someone";
  return name.split(" ")[0];
}
