

const IST_TIMEZONE = "Asia/Kolkata";


export function formatDateIST(dateString: string | Date): string {
  if (!dateString) return "";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return d.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}


export function formatDateOnlyIST(dateString: string | Date): string {
  if (!dateString) return "";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return d.toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


export function formatTimeIST(dateString: string | Date): string {
  if (!dateString) return "";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return d.toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
