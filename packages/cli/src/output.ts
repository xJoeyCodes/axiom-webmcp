import type {
  AxiomManifest,
  InspectResult,
  PublishResult,
} from "@axiom-webmcp/sdk";
import type { DiscoveryResponse } from "@axiom-webmcp/client";

const count = (value: number) => value.toString().padStart(2, "0");
const row = (label: string, value: number) =>
  `${label.padEnd(12)} ${value.toString()}`;

export function formatInspection(
  manifest: AxiomManifest,
  result: InspectResult,
): string {
  const plan = result.plan;
  const lines = [
    "AXIOM",
    "",
    `Inspecting ${manifest.provider.domain}`,
    "",
    "Provider",
    manifest.provider.name,
    "",
    "Capabilities",
    count(manifest.capabilities.length),
    "",
    ...manifest.capabilities.map((capability) => `✓ ${capability.name}`),
    "",
    "Publication plan",
    "",
    ...plan.capabilities.map(
      (change) => `${change.action.toUpperCase().padEnd(12)} ${change.name}`,
    ),
    "",
    "Summary",
    "",
    row("Create", plan.summary.create),
    row("Update", plan.summary.update),
    row("Unchanged", plan.summary.unchanged),
  ];
  if (result.warnings.length > 0) {
    lines.push(
      "",
      "Warnings",
      "",
      ...result.warnings.map(
        (warning) => `! ${warning.capability}: ${warning.message}`,
      ),
    );
  }
  lines.push("", "Ready to publish.");
  return `${lines.join("\n")}\n`;
}

export function formatPublish(result: PublishResult): string {
  const indexed = result.indexing.ready;
  const waiting = result.indexing.failed + result.indexing.pending;
  const lines = [
    "AXIOM",
    "",
    waiting > 0 ? "Published with warnings." : "Published.",
    "",
    row("Created", result.summary.create),
    row("Updated", result.summary.update),
    row("Unchanged", result.summary.unchanged),
    "",
    `${indexed} ${indexed === 1 ? "capability" : "capabilities"} indexed.`,
  ];
  if (waiting > 0) {
    lines.push(
      `${waiting} ${waiting === 1 ? "capability is" : "capabilities are"} awaiting indexing.`,
    );
  } else {
    lines.push(`${result.provider.domain} is discoverable through Axiom.`);
  }
  return `${lines.join("\n")}\n`;
}

export function formatSearch(result: DiscoveryResponse): string {
  const lines = ["AXIOM", "", "Query", result.query.intent, ""];
  if (result.results.length === 0) {
    lines.push("No matching providers.");
  } else {
    for (const [index, match] of result.results.entries()) {
      lines.push(
        `${String(index + 1).padStart(2, "0")}  ${match.provider.name}  ${Math.round(match.score * 100)}%`,
        `    ${match.provider.domain}`,
        "",
        ...match.matchedCapabilities.map(
          (capability) => `    ${capability.capability.name}`,
        ),
        "",
      );
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
