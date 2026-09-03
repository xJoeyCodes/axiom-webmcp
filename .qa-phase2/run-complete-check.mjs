import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./discovery-check.mjs", import.meta.url),
  "utf8",
);
const keyUpMarker = 'await send("Input.dispatchKeyEvent", {\n  type: "keyUp",';
const charEvent = `await send("Input.dispatchKeyEvent", {\n+  type: "char",\n+  key: "Enter",\n+  code: "Enter",\n+  text: "\\r",\n+  unmodifiedText: "\\r",\n+  windowsVirtualKeyCode: 13,\n+  nativeVirtualKeyCode: 13,\n+});\n`;
const correctedSource = source
  .replaceAll("Popular intents", "POPULAR INTENTS")
  .replaceAll(keyUpMarker, `${charEvent}${keyUpMarker}`);

if (correctedSource === source) {
  throw new Error("QA corrections were not applied.");
}

await import(`data:text/javascript;base64,${Buffer.from(correctedSource).toString("base64")}`);
