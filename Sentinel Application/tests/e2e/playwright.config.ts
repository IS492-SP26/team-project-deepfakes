import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    headless: true,
  },
  webServer: {
    command: "bash ../../scripts/dev.sh",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
