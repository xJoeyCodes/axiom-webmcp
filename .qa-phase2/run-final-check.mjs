import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./discovery-check.mjs", import.meta.url),
  "utf8",
);
const keyUpMarker = 'await send("Input.dispatchKeyEvent", {\n  type: "keyUp",';
const charEvent =
  [
    'await send("Input.dispatchKeyEvent", {',
    '  type: "char",',
    '  key: "Enter",',
    '  code: "Enter",',
    '  text: "\\r",',
    '  unmodifiedText: "\\r",',
    "  windowsVirtualKeyCode: 13,",
    "  nativeVirtualKeyCode: 13,",
    "});",
  ].join("\n") + "\n";
const correctedSource = source
  .replaceAll("Popular intents", "POPULAR INTENTS")
  .replaceAll(keyUpMarker, `${charEvent}${keyUpMarker}`);

await import(`data:text/javascript;base64,${Buffer.from(correctedSource).toString("base64")}`);
