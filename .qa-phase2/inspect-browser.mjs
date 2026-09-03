const targets = await fetch("http://127.0.0.1:9224/json/list").then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.startsWith("http://127.0.0.1:3100"));
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let id = 0;
function send(method, params = {}) {
  const commandId = ++id;
  socket.send(JSON.stringify({ id: commandId, method, params }));
  return new Promise((resolve) => {
    const listener = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== commandId) return;
      socket.removeEventListener("message", listener);
      resolve(message.result);
    };
    socket.addEventListener("message", listener);
  });
}
const result = await send("Runtime.evaluate", {
  expression: "({url: location.href, ready: document.readyState, title: document.title, text: document.body?.innerText, html: document.body?.innerHTML.slice(0, 500)})",
  returnByValue: true,
});
console.log(JSON.stringify(result.result.value, null, 2));
socket.close();
