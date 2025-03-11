/**
 * Testing utilities for Playwright tests
 */

/**
 * Standard test page URL
 */
export const TEST_PAGE_URL = "http://localhost:5500/front-end/index.html";

/**
 * Login a test user with standard credentials
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function loginTestUser(page) {
  await page.fill("#username", "sample");
  await page.fill("#password", "sosecret");
  await page.click("[data-submit]");
  // Wait for login to complete
  await page.waitForSelector("login-component [data-action='logout']", {
    state: "visible",
    timeout: 5000,
  });
}

/**
 * Create a test bloom with specified content
 * @param {Page} page - Playwright page object
 * @param {string} content - Content for the bloom (defaults to timestamped test content)
 * @returns {Promise<string>} - The content of the created bloom
 */
export async function createTestBloom(
  page,
  content = `Test bloom content ${Date.now()}`
) {
  await page.fill("bloom-form-component [data-content]", content);
  await page.click("bloom-form-component [data-submit]");
  // Wait for bloom to appear
  await page.waitForSelector("timeline-component [data-content]", {
    state: "visible",
    timeout: 5000,
  });
  return content;
}
