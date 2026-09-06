import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "apps/**/*.test.ts",
      "packages/**/*.test.ts",
      "src/lib/**/*.test.ts",
    ],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: { reporter: ["text", "html"] },
  },
});
