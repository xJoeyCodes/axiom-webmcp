import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./run-complete-check.mjs", import.meta.url),
  "utf8",
);
const correctedSource = source.replaceAll("\\n+", "\\n");

await import(`data:text/javascript;base64,${Buffer.from(correctedSource).toString("base64")}`);
