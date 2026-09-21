import {defineConfig} from "@playwright/test";

// Use the installed Chrome because Playwright's bundled browser is unavailable
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:5500/",
  },
  projects: [
    {
      name: "system-chrome",
      use: {
        browserName: "chromium",
        channel: "chrome",
      },
    },
  ],
});
