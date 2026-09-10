import type { AxiomManifest } from "@/lib/types/axiom";

export type WebsiteInspectionPhase = "opening" | "reading";

export interface DiscoveredWebMcpTool {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly origin?: string;
  readonly inputSchema?: unknown;
  readonly annotations?: unknown;
}

interface WebMcpInspectorContext {
  getTools(options?: {
    readonly fromOrigins?: readonly string[];
  }): Promise<readonly DiscoveredWebMcpTool[]>;
}

export class WebsiteInspectionError extends Error {
  readonly code:
    | "INVALID_URL"
    | "INSECURE_ORIGIN"
    | "WEBMCP_UNAVAILABLE"
    | "WEBSITE_UNAVAILABLE"
    | "NO_CAPABILITIES";

  constructor(code: WebsiteInspectionError["code"], message: string) {
    super(message);
    this.name = "WebsiteInspectionError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonObject(value: unknown): Record<string, unknown> | null {
  try {
    const parsed =
      typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    if (!isRecord(parsed)) return null;
    return JSON.parse(JSON.stringify(parsed)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function providerName(hostname: string): string {
  const segment = hostname.replace(/^www\./u, "").split(".")[0] ?? hostname;
  return segment
    .split(/[-_]+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizedOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function buildManifestFromWebMcpTools(
  websiteUrl: URL,
  tools: readonly DiscoveredWebMcpTool[],
): AxiomManifest {
  const capabilities = tools.map((tool) => ({
    name: tool.name.trim(),
    description:
      tool.description?.trim() ||
      tool.title?.trim() ||
      `WebMCP action exposed by ${websiteUrl.hostname}.`,
    inputSchema: jsonObject(tool.inputSchema) ?? { type: "object" },
    annotations: jsonObject(tool.annotations) ?? undefined,
    specVersion: "draft",
  }));

  return {
    version: "1",
    provider: {
      name: providerName(websiteUrl.hostname) || websiteUrl.hostname,
      domain: websiteUrl.hostname,
      canonicalUrl: websiteUrl.toString(),
      description: `WebMCP actions exposed by ${websiteUrl.hostname}.`,
    },
    capabilities,
  };
}

function getInspectorContext(source: Document): WebMcpInspectorContext | null {
  const candidate = (source as Document & { modelContext?: unknown })
    .modelContext;
  if (!isRecord(candidate) || typeof candidate.getTools !== "function") {
    return null;
  }
  return candidate as unknown as WebMcpInspectorContext;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function waitForFrame(frame: HTMLIFrameElement, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new WebsiteInspectionError(
          "WEBSITE_UNAVAILABLE",
          "The website did not finish loading in time.",
        ),
      );
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeout);
      frame.removeEventListener("load", loaded);
      frame.removeEventListener("error", failed);
    }

    function loaded() {
      cleanup();
      resolve();
    }

    function failed() {
      cleanup();
      reject(
        new WebsiteInspectionError(
          "WEBSITE_UNAVAILABLE",
          "The website could not be opened for WebMCP inspection.",
        ),
      );
    }

    frame.addEventListener("load", loaded, { once: true });
    frame.addEventListener("error", failed, { once: true });
  });
}

export async function inspectWebsiteWebMcp(
  rawUrl: string,
  options: {
    readonly onPhaseChange?: (phase: WebsiteInspectionPhase) => void;
    readonly timeoutMs?: number;
  } = {},
): Promise<AxiomManifest> {
  let websiteUrl: URL;
  try {
    websiteUrl = new URL(rawUrl, window.location.origin);
  } catch {
    throw new WebsiteInspectionError(
      "INVALID_URL",
      "Enter a valid website URL.",
    );
  }

  if (
    !websiteUrl.hostname ||
    !["http:", "https:"].includes(websiteUrl.protocol)
  ) {
    throw new WebsiteInspectionError(
      "INVALID_URL",
      "Website URLs must use HTTP or HTTPS.",
    );
  }
  websiteUrl.hash = "";

  const crossOrigin = websiteUrl.origin !== window.location.origin;
  if (crossOrigin && websiteUrl.protocol !== "https:") {
    throw new WebsiteInspectionError(
      "INSECURE_ORIGIN",
      "Cross-origin WebMCP inspection requires an HTTPS website.",
    );
  }

  const modelContext = getInspectorContext(document);
  if (!modelContext) {
    throw new WebsiteInspectionError(
      "WEBMCP_UNAVAILABLE",
      "This browser does not expose WebMCP inspection. Enable WebMCP in a supported browser or use the manifest option.",
    );
  }

  const frame = document.createElement("iframe");
  frame.src = websiteUrl.toString();
  frame.title = `Inspecting ${websiteUrl.hostname}`;
  frame.allow = "tools";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1px",
    height: "1px",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  options.onPhaseChange?.("opening");
  const frameReady = waitForFrame(frame, options.timeoutMs ?? 8_000);
  document.body.append(frame);

  try {
    await frameReady;
    options.onPhaseChange?.("reading");

    const request = crossOrigin
      ? { fromOrigins: [websiteUrl.origin] }
      : undefined;
    const deadline = Date.now() + 3_000;
    let matches: readonly DiscoveredWebMcpTool[] = [];

    do {
      const tools = await modelContext.getTools(request);
      matches = tools.filter((tool) => {
        const origin = normalizedOrigin(tool.origin);
        return origin ? origin === websiteUrl.origin : !crossOrigin;
      });
      if (matches.length > 0) break;
      await wait(150);
    } while (Date.now() < deadline);

    if (matches.length === 0) {
      throw new WebsiteInspectionError(
        "NO_CAPABILITIES",
        "No WebMCP actions were visible. The site may block embedding, may not expose tools to this Axiom origin, or may not register WebMCP actions.",
      );
    }

    return buildManifestFromWebMcpTools(websiteUrl, matches);
  } finally {
    frame.remove();
  }
}
