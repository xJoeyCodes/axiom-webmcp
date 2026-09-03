const targets = await fetch("http://127.0.0.1:9224/json/list").then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.startsWith("http://127.0.0.1:3100"));
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const resolve = pending.get(message.id);
  pending.delete(message.id);
  resolve(message.result);
});
function send(method, params = {}) {
  const commandId = ++id;
  socket.send(JSON.stringify({ id: commandId, method, params }));
  return new Promise((resolve) => pending.set(commandId, resolve));
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true });
  return response.result.value;
}
await evaluate(`(() => {
  const input = document.querySelector('#discovery-query');
  input.value = '';
  input.focus();
})()`);
await send("Input.insertText", { text: "book dinner" });
console.log("before", await evaluate(`({ value: document.querySelector('#discovery-query').value, valid: document.querySelector('#discovery-query').checkValidity(), busy: document.querySelector('form[role=search]').getAttribute('aria-busy') })`));
await send("Input.dispatchKeyEvent", {
  type: "rawKeyDown",
  key: "Enter",
  code: "Enter",
  text: "\r",
  unmodifiedText: "\r",
  windowsVirtualKeyCode: 13,
  nativeVirtualKeyCode: 13,
});
await send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "Enter",
  code: "Enter",
  windowsVirtualKeyCode: 13,
  nativeVirtualKeyCode: 13,
});
await new Promise((resolve) => setTimeout(resolve, 1500));
console.log("after", await evaluate(`({ url: location.pathname + location.search, value: document.querySelector('#discovery-query')?.value })`));
socket.close();
