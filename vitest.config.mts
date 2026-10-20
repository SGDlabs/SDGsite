import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./scripts/test-stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    // the database suite boots Postgres (PGlite) and runs every migration first
    hookTimeout: 60_000,
  },
});
