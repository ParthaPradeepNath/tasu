import {
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
} from "date-fns";

export function relativeTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(value, { addSuffix: true });
}

export function shortDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (isToday(value)) return `Today, ${format(value, "h:mm a")}`;
  if (isYesterday(value)) return `Yesterday, ${format(value, "h:mm a")}`;
  return format(value, "MMM d, h:mm a");
}

export function dayLabel(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  if (isToday(value)) return "Today";
  if (isYesterday(value)) return "Yesterday";
  return format(value, "EEEE, MMMM d");
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "MMM d, yyyy 'at' h:mm a");
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "MMM d, yyyy");
}

export function compactRelative(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  const minutes = Math.max(
    0,
    Math.round((Date.now() - value.getTime()) / 60000),
  );
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 60 * 24 * 30) return `${Math.floor(minutes / (60 * 24))}d`;
  return `${Math.floor(minutes / (60 * 24 * 30))}mo`;
}

export function formatHours(minutes: number) {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

/** Time left in a compact, human form: 3h, 45m, 2d. */
export function countdown(date: Date | string | null | undefined) {
  if (!date) return null;
  const value = typeof date === "string" ? new Date(date) : date;
  const minutes = differenceInMinutes(value, new Date());

  if (minutes <= 0) {
    const overdue = Math.abs(minutes);
    if (overdue < 60) return `${overdue}m over`;
    if (overdue < 60 * 24) return `${Math.floor(overdue / 60)}h over`;
    return `${Math.floor(overdue / (60 * 24))}d over`;
  }

  if (minutes < 60) return `${minutes}m left`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h left`;
  return `${Math.floor(minutes / (60 * 24))}d left`;
}
