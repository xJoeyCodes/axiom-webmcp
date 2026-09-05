export const DEFAULT_AXIOM_BASE_URL = "http://127.0.0.1:4000";

export function resolveBaseUrl(
  flag: string | undefined,
  environment: Readonly<Record<string, string | undefined>>,
): string {
  return (
    flag?.trim() || environment.AXIOM_BASE_URL?.trim() || DEFAULT_AXIOM_BASE_URL
  );
}
