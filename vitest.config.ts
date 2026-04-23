import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Node environment by default — DOM tests (React components) can opt in
    // per-file with `// @vitest-environment jsdom`.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Drizzle's ESM loader + remotion-promo are both slow/irrelevant for tests.
    exclude: ["node_modules", ".next", "out", "remotion-promo"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
