import {test, expect} from "@playwright/test";
import {
  TEST_PAGE_URL,
  loginTestUser,
  mockApiError,
  closeErrorDialog,
} from "../../test-utilities.js";

/**
 * Tests for the centralized error handling system
 */

test("Error dialog displays for API errors", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Mock an API error
  const errorMessage = "Failed to fetch data from server";
  await mockApiError(page, "/timeline", 500, errorMessage);

  // When triggering an API request that will fail
  await page.reload();

  // Then an error dialog should be shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText(errorMessage);

  // And the dialog can be closed
  await closeErrorDialog(page);
  await expect(page.locator("#error-dialog")).toBeHidden();
});

test("Authentication errors redirect to login", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Mock an authentication error
  await mockApiError(page, "/timeline", 401, "Authentication required");

  // When triggering an API request that will return auth error
  await page.reload();

  // Then user should be redirected to login
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // And an error dialog should be shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText(
    "Authentication required"
  );

  // Close the error dialog
  await closeErrorDialog(page);
});

test("Connection errors show appropriate message", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Mock a network connection error
  await page.evaluate(() => {
    // Override fetch to simulate connection error
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      if (url.includes("/timeline")) {
        throw new Error("Failed to connect");
      }
      return originalFetch(url, options);
    };
  });

  // When triggering an API request that will fail with connection error
  await page.reload();

  // Then an error dialog should be shown with a connection error message
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText("connection");

  // Reset fetch
  await page.evaluate(() => {
    delete window.fetch;
  });

  // Close the error dialog
  await closeErrorDialog(page);
});

test("Error dialog appears above other content", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Mock an API error for bloom creation
  await mockApiError(page, "/bloom", 500, "Failed to create bloom");

  // When creating a bloom that will fail
  await page.fill("#bloom-content", "This bloom will fail");
  await page.click("[data-submit]");

  // Then an error dialog should appear and be visually on top
  await expect(page.locator("#error-dialog")).toBeVisible();

  // Verify dialog appears above other content (check z-index)
  const zIndex = await page.evaluate(() => {
    const dialog = document.querySelector("#error-dialog");
    return window.getComputedStyle(dialog).zIndex;
  });

  expect(parseInt(zIndex, 10)).toBeGreaterThan(0);

  // Close the error dialog
  await closeErrorDialog(page);
});
