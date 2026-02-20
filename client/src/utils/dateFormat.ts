/**
 * Global date/time formatting utilities.
 * All dates are displayed in IST (Asia/Kolkata) timezone.
 */

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Format a date string to IST in a human-readable format.
 * Example: "Feb 20, 2026, 8:52 PM"
 */
export function formatDateIST(dateString: string | Date): string {
  if (!dateString) return "—";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return d.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Format just the date portion in IST.
 * Example: "20 Feb 2026"
 */
export function formatDateOnlyIST(dateString: string | Date): string {
  if (!dateString) return "—";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return d.toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format just the time portion in IST.
 * Example: "8:52 PM"
 */
export function formatTimeIST(dateString: string | Date): string {
  if (!dateString) return "—";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return d.toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
