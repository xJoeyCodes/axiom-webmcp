const targetList = await fetch("http://127.0.0.1:9224/json/list").then((response) =>
  response.json(),
);
const target = targetList.find(
  (entry) =>
    entry.type === "page" && entry.url.startsWith("http://127.0.0.1:3100"),
);

if (!target) {
  throw new Error("Axiom browser target was not found.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const consoleErrors = [];
let commandId = 0;

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.id) {
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
    return;
  }

  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params.exceptionDetails.text);
  }

  if (
    message.method === "Runtime.consoleAPICalled" &&
    message.params.type === "error"
  ) {
    consoleErrors.push(
      message.params.args.map((argument) => argument.value ?? argument.description).join(" "),
    );
  }
});

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.value;
}

async function waitFor(predicate, message, timeout = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(message);
}

async function waitForUrl(expected) {
  await waitFor(
    async () => (await evaluate("location.pathname + location.search")) === expected,
    `Timed out waiting for ${expected}`,
  );
}

async function waitForText(text) {
  await waitFor(
    async () =>
      await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`),
    `Timed out waiting for text: ${text}`,
  );
}

async function navigate(url) {
  await send("Page.navigate", { url });
  await waitForUrl(new URL(url).pathname + new URL(url).search);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

await navigate("http://127.0.0.1:3100/discover");
await waitForText("Popular intents");

await evaluate(`
  [...document.querySelectorAll('a')]
    .find((link) => link.textContent.includes('Book a flight'))
    ?.click()
`);
await waitForUrl("/discover?q=Book+a+flight");
await waitForText("Orbit Travel");

await evaluate("history.back()");
await waitForUrl("/discover");
await waitForText("Popular intents");

await evaluate("history.forward()");
await waitForUrl("/discover?q=Book+a+flight");
await waitForText("Orbit Travel");

await navigate("http://127.0.0.1:3100/discover");
await waitForText("Popular intents");
await evaluate("document.querySelector('#discovery-query').focus()");
await send("Input.insertText", { text: "book dinner" });
await send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Enter",
  code: "Enter",
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
await waitForUrl("/discover?q=book+dinner");
await waitForText("Atlas Dining");

await evaluate(`
  (() => {
    const input = document.querySelector('#discovery-query');
    input.value = '';
    input.focus();
  })()
`);
await send("Input.insertText", { text: "find a flight" });
await send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Enter",
  code: "Enter",
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
await waitForUrl("/discover?q=find+a+flight");
await waitForText("Orbit Travel");

const responsive = [];
for (const [width, height] of [
  [1440, 1000],
  [1280, 900],
  [1024, 900],
  [768, 1024],
  [430, 932],
  [390, 844],
]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 430,
  });
  responsive.push(
    await evaluate(`({
      width: ${width},
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      searchRight: Math.round(document.querySelector('#discovery-query').getBoundingClientRect().right),
      resultRight: Math.round(document.querySelector('article a').getBoundingClientRect().right)
    })`),
  );
}

await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
const reducedMotion = await evaluate(`({
  matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
  runningAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length
})`);

await evaluate("document.querySelector('a[href=\"/site/orbit-travel\"]').click()");
await waitForUrl("/site/orbit-travel");
await waitForText("Orbit Travel");

await evaluate("history.back()");
await waitForUrl("/discover?q=find+a+flight");

console.log(
  JSON.stringify(
    {
      keyboardSubmission: true,
      suggestedQuery: true,
      browserBackForward: true,
      resultNavigation: true,
      responsive,
      reducedMotion,
      consoleErrors,
    },
    null,
    2,
  ),
);

await send("Browser.close");
