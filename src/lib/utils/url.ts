export function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (!url.hostname || !["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
