import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./keyboard-check.mjs", import.meta.url), "utf8");
const marker = 'await send("Input.dispatchKeyEvent", {\n  type: "keyUp",';
const insertion = `await send("Input.dispatchKeyEvent", {\n  type: "char",\n  key: "Enter",\n  code: "Enter",\n  text: "\\r",\n  unmodifiedText: "\\r",\n  windowsVirtualKeyCode: 13,\n  nativeVirtualKeyCode: 13,\n});\n`;
const correctedSource = source.replace(marker, `${insertion}${marker}`);

if (correctedSource === source) {
  throw new Error("Keyboard event marker not found.");
}

await import(`data:text/javascript;base64,${Buffer.from(correctedSource).toString("base64")}`);
