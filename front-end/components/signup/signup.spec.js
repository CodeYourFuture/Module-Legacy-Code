import {test, expect} from "@playwright/test";
import {TEST_PAGE_URL} from "../../test-utilities.js";

/**
 * Tests for the signup component
 */

test("Given an index page load, when user clicks signup, then the signup form is shown and login is hidden", async ({
  page,
}) => {
  // Given an index page load
  await page.goto(TEST_PAGE_URL);

  // When user clicks signup link
  await page.click("[data-action='signup']");

  // Then the signup form is shown
  await expect(page.locator("[data-form='signup']")).not.toHaveAttribute(
    "hidden"
  );
  await expect(page.locator("[data-form='signup']")).toBeVisible();

  // And the login form is hidden
  await expect(page.locator("[data-form='login']")).toHaveAttribute("hidden");
});

test("Given a signup form, when user clicks login link, then the login form is shown and signup is hidden", async ({
  page,
}) => {
  // Given a signup form
  await page.goto(TEST_PAGE_URL);
  await page.click("[data-action='signup']");

  // When user clicks login link
  await page.click("[data-action='login']");

  // Then the login form is shown
  await expect(page.locator("[data-form='login']")).not.toHaveAttribute(
    "hidden"
  );

  // And the signup form is hidden
  await expect(page.locator("[data-form='signup']")).toHaveAttribute("hidden");
});

test("Given a signup form, when submitting valid data, then the user is registered and auto-logged in", async ({
  page,
}) => {
  // Given a signup form
  await page.goto(TEST_PAGE_URL);
  await page.click("[data-action='signup']");

  // Mock a successful registration response
  await page.route("**/signup", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        username: "newuser",
        token: "valid-jwt-token-for-testing",
      }),
    });
  });

  // When submitting valid data
  const uniqueUsername = `test_user_${Date.now()}`;
  await page.fill("#signup-username", uniqueUsername);
  await page.fill("#signup-password", "password123");
  await page.fill("#signup-password-confirmation", "password123");
  await page.click("[data-submit]");

  // Then the user is registered and auto-logged in
  await expect(page.locator("[data-form='login']")).toHaveAttribute("hidden");
  await expect(page.locator("[data-form='signup']")).toHaveAttribute("hidden");

  // And timeline is visible (indicating logged in state)
  await expect(page.locator("#timeline-container")).toBeVisible();
});

test("Given a signup form, when submitting with username that already exists, then error is shown", async ({
  page,
}) => {
  // Given a signup form
  await page.goto(TEST_PAGE_URL);
  await page.click("[data-action='signup']");

  // Mock a duplicate username error
  await page.route("**/signup", (route) => {
    return route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({message: "Username already exists"}),
    });
  });

  // When submitting with username that already exists
  await page.fill("#signup-username", "existinguser");
  await page.fill("#signup-password", "password123");
  await page.fill("#signup-password-confirmation", "password123");
  await page.click("[data-submit]");

  // Then error is shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText(
    "Username already exists"
  );

  // And signup form is still active
  const isFormActive = await page.evaluate(() => {
    const form = document.querySelector("[data-form='signup']");
    const submitButton = document.querySelector("[data-submit]");
    return !form.hasAttribute("inert") && !submitButton.disabled;
  });

  expect(isFormActive).toBeTruthy();
});
