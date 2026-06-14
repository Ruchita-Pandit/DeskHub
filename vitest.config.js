import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
    coverage: {
      provider: "v8",
      /** Only this file counts toward % and thresholds (good for “this suite / module”). */
      include: ["src/api/tickets.js"],
      /** Count every line in that file, even if no test imports it yet. */
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      reporter: ["text", "html"],
    },
  },
});