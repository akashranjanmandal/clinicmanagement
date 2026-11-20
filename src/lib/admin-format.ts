// Client-safe helpers that turn raw database values into plain, readable text.

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

export const statusMeta: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: "Waiting for confirmation", className: "badge-amber" },
  confirmed: { label: "Confirmed", className: "badge-green" },
  completed: { label: "Visit done", className: "badge-blue" },
  cancelled: { label: "Cancelled", className: "badge-red" },
  no_show: { label: "Patient did not come", className: "badge-grey" },
};

/** "14:30" -> "2:30 PM" */
export function formatTime(value: unknown) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ""));
  if (!match) return value ? String(value) : "—";
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${match[2]} ${suffix}`;
}

/** "2026-11-22" -> "Sun, 22 Nov 2026" (no timezone shifting). */
export function formatDate(value: unknown, withYear = true) {
  const text = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return value ? text : "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(new Date(`${text}T00:00:00Z`));
}

/** Adds "Today" / "Tomorrow" in front of the date when it applies. */
export function friendlyDate(value: string, today: string) {
  if (!today) return formatDate(value);
  const diff = Math.round((Date.parse(`${value}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDate(value);
}

export function formatDateTime(value: unknown) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return value ? String(value) : "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
