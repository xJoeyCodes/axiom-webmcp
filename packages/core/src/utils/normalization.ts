import { ApplicationError } from "../errors/application-error.js";

function parseHttpUrl(input: string): URL {
  const value = input.trim();
  if (!value) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "A URL or domain is required.",
    );
  }

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//iu.test(value)
    ? value
    : `https://${value}`;
  let parsed: URL;

  try {
    parsed = new URL(withScheme);
  } catch (cause) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "The URL or domain is invalid.",
      {
        cause,
      },
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "Only HTTP and HTTPS URLs are supported.",
    );
  }

  if (parsed.username || parsed.password) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "URLs containing credentials are not supported.",
    );
  }

  return parsed;
}

export function normalizeDomain(input: string): string {
  const parsed = parseHttpUrl(input);
  return parsed.hostname
    .toLowerCase()
    .replace(/^www\./u, "")
    .replace(/\.$/u, "");
}

export function normalizeUrl(input: string): string {
  const parsed = parseHttpUrl(input);
  const domain = normalizeDomain(parsed.hostname);
  const port =
    parsed.port && parsed.port !== "80" && parsed.port !== "443"
      ? `:${parsed.port}`
      : "";
  return `https://${domain}${port}`;
}

export function createProviderSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  if (!slug) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      "A provider slug cannot be empty.",
    );
  }

  return slug;
}

export function isValidProviderSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug);
}
