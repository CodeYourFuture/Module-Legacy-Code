import {test, expect} from "@playwright/test";
import {
  TEST_PAGE_URL,
  closeErrorDialog,
  mockApiError,
} from "../../test-utilities.js";

/**
 * Tests for login and signup components
 */

test("Login form submits and shows timeline on success", async ({page}) => {
  // Given the application home page
  await page.goto(TEST_PAGE_URL);

  // When logging in with valid credentials
  await page.fill("#username", "testuser");
  await page.fill("#password", "password");
  await page.click("[data-submit]");

  // Then the user is logged in and timeline is shown
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );
  await expect(page.locator("#bloom-form-container")).toBeVisible();
});

test("Login form shows error on invalid credentials", async ({page}) => {
  // Given the application home page
  await page.goto(TEST_PAGE_URL);

  // Mock API error for invalid login
  await mockApiError(page, "/login", 401, "Invalid username or password");

  // When logging in with invalid credentials
  await page.fill("#username", "wronguser");
  await page.fill("#password", "wrongpass");
  await page.click("[data-submit]");

  // Then an error is shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText(
    "Invalid username or password"
  );

  // And user remains on login form
  await closeErrorDialog(page);
  await expect(page.locator("[data-form='login']")).toBeVisible();
});

test("Signup form creates account and logs in user", async ({page}) => {
  // Given the application home page with signup form
  await page.goto(TEST_PAGE_URL);
  await page.click("[data-action='signup']");

  // When signing up with valid details
  const username = `test_user_${Date.now()}`;
  await page.fill("#signup-username", username);
  await page.fill("#signup-password", "password123");
  await page.click("[data-submit]");

  // Then the user is logged in and timeline is shown
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );
  await expect(page.locator("#bloom-form-container")).toBeVisible();
});

test("Signup form shows error on duplicate username", async ({page}) => {
  // Given the application home page with signup form
  await page.goto(TEST_PAGE_URL);
  await page.click("[data-action='signup']");

  // Mock API error for duplicate username
  await mockApiError(page, "/signup", 409, "Username already exists");

  // When signing up with a duplicate username
  await page.fill("#signup-username", "testuser"); // Assuming this username exists
  await page.fill("#signup-password", "password123");
  await page.click("[data-submit]");

  // Then an error is shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText(
    "Username already exists"
  );

  // And user remains on signup form
  await closeErrorDialog(page);
  await expect(page.locator("[data-form='signup']")).toBeVisible();
});

test("Toggle between login and signup forms works correctly", async ({
  page,
}) => {
  // Given the application home page with login form
  await page.goto(TEST_PAGE_URL);
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // When clicking signup link
  await page.click("[data-action='signup']");

  // Then signup form is shown
  await expect(page.locator("[data-form='signup']")).toBeVisible();

  // When clicking login link
  await page.click("[data-action='login']");

  // Then login form is shown
  await expect(page.locator("[data-form='login']")).toBeVisible();
});

test("Successful logout shows login form", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await page.fill("#username", "testuser");
  await page.fill("#password", "password");
  await page.click("[data-submit]");

  // Verify logged in
  await expect(page.locator("#bloom-form-container")).toBeVisible();

  // When logging out
  await page.click("[data-action='logout'], [data-logout-button]");

  // Then login form is shown
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // And timeline is hidden
  await expect(page.locator("#timeline-container")).toHaveAttribute("hidden");
});
