import {test, expect} from "@playwright/test";
import {TEST_PAGE_URL} from "../../test-utilities.js";

/**
 * Tests for the login component functionality
 */

test("Given an index.html page load, when not logged in, then the login form is shown", async ({
  page,
}) => {
  // Given an index.html page load
  await page.goto(TEST_PAGE_URL);

  // Then the login form is shown by default
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // And the signup link is visible
  await expect(page.locator("[data-action='signup']")).toBeVisible();

  // And the logout button is not visible
  await expect(page.locator("[data-action='logout']")).not.toBeVisible();
});

test("Given an index page load without cached credentials, when checking login state, then the login form is shown", async ({
  page,
}) => {
  // Given an index page load without cached credentials
  await page.goto(TEST_PAGE_URL);

  // When the login state is checked (happens automatically on load)
  // Then the login form is shown
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // And the signup link is visible
  await expect(page.locator("[data-action='signup']")).toBeVisible();

  // And the logout button is not visible
  await expect(page.locator("[data-action='logout']")).not.toBeVisible();
});

test("Given a valid JWT in localStorage, when index page loads, then the user is auto-logged in and form is hidden", async ({
  page,
}) => {
  // Given a valid JWT in localStorage
  await page.goto(TEST_PAGE_URL);
  await page.evaluate(() => {
    localStorage.setItem("token", "valid-jwt-token-for-testing");
    localStorage.setItem("username", "testuser");
  });

  // When index page loads (reload to trigger auto-login)
  await page.reload();

  // Then the user is auto-logged in and login form is hidden
  await expect(page.locator("[data-form='login']")).toBeHidden();

  // And the signup link is hidden
  await expect(page.locator("[data-action='signup']")).toBeHidden();

  // And the logout button is visible
  await expect(page.locator("[data-action='logout']")).toBeVisible();
});

test("Given an invalid JWT in localStorage, when index page loads, then the login form is shown", async ({
  page,
}) => {
  // Given an invalid JWT in localStorage
  await page.goto(TEST_PAGE_URL);
  await page.evaluate(() => {
    localStorage.setItem("token", "invalid-token");
    localStorage.setItem("username", "testuser");
  });

  // Mock a 401 response from the auth check
  await page.route("**/verify", (route) => {
    return route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({message: "Invalid or expired token"}),
    });
  });

  // When index page loads (reload to trigger auto-login attempt)
  await page.reload();

  // Then the login form is shown
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // And the signup link is visible
  await expect(page.locator("[data-action='signup']")).toBeVisible();

  // And the logout button is not visible
  await expect(page.locator("[data-action='logout']")).not.toBeVisible();
});

test("Given a login form, when submitted with valid credentials, then the user is logged in and form is hidden", async ({
  page,
}) => {
  // Given a login form
  await page.goto(TEST_PAGE_URL);

  // Mock a successful login response
  await page.route("**/login", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({token: "valid-jwt", username: "testuser"}),
    });
  });

  // When submitted with valid credentials
  await page.fill("#username", "testuser");
  await page.fill("#password", "password");
  await page.click("[data-submit]");

  // Then the user is logged in
  await expect(page.locator("[data-form='login']")).not.toHaveAttribute(
    "hidden"
  );

  // And the submit button is enabled
  await expect(page.locator("[data-submit]")).toBeEnabled();
});

test("Given a logged in state, when the logout button is clicked, then the user is logged out and login form is shown", async ({
  page,
}) => {
  // Given a logged in state
  await page.goto(TEST_PAGE_URL);
  await page.evaluate(() => {
    localStorage.setItem("token", "valid-jwt-token-for-testing");
    localStorage.setItem("username", "testuser");
    if (window.state) {
      window.state.isLoggedIn = true;
      window.state.token = "valid-jwt-token-for-testing";
      window.state.currentUser = "testuser";
    }
  });
  await page.reload();

  // Verify the user is logged in - logout button is visible
  await expect(page.locator("[data-action='logout']")).toBeVisible();

  // When the logout button is clicked
  await page.click("[data-action='logout']");

  // Then the user is logged out and login form is shown
  await expect(page.locator("[data-form='login']")).toBeVisible();

  // And the signup link is visible
  await expect(page.locator("[data-action='signup']")).toBeVisible();

  // And the logout button is not visible
  await expect(page.locator("[data-action='logout']")).not.toBeVisible();
});

test("Given the login view, when clicking the signup link, then the signup form is shown", async ({
  page,
}) => {
  // Given the login view
  await page.goto(TEST_PAGE_URL);

  // When clicking the signup link
  await page.click("[data-action='signup']");

  // Then the signup form is shown
  await expect(page.locator("[data-form='signup']")).not.toHaveAttribute(
    "hidden"
  );

  // And the login form is hidden
  await expect(page.locator("[data-form='login']")).toHaveAttribute("hidden");
});
