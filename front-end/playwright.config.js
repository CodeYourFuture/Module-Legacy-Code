/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default {
  testDir: "./",
  testMatch: ["**/components/**/*.spec.js"],
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 3000,
  },
  /* Run tests in files in sequence rather than parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry tests on failures - more retries during development */
  retries: process.env.CI ? 2 : 1,
  /* Ensure tests run sequentially */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html"], ["list"]],

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        // Base URL to use for all tests
        baseURL: "http://localhost:5500",
        // Always use headless mode unless explicitly overridden
        headless: true,
        // Capture screenshots on failure
        screenshot: "only-on-failure",
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: "test-results/",

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npx http-server . -p 5500",
    port: 5500,
    reuseExistingServer: !process.env.CI,
    // Wait for server to be fully ready
    timeout: 3000,
  },
};
