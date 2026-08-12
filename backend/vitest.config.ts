import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/modules/**/*.ts", "src/shared/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/testFixtures.ts", "src/**/*.types.ts"],
    },
  },
});
