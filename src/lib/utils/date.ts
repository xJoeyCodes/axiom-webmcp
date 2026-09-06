const indexedDateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function formatIndexedDate(value: string | null | undefined): string {
  if (!value) return "Not indexed yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : indexedDateFormatter.format(date);
}
