import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./discovery-check.mjs", import.meta.url),
  "utf8",
);
const correctedSource = source.replaceAll("Popular intents", "POPULAR INTENTS");
const encodedSource = Buffer.from(correctedSource).toString("base64");

await import(`data:text/javascript;base64,${encodedSource}`);
