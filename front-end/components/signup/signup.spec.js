import {test, expect} from "@playwright/test";
import {TEST_PAGE_URL} from "../../test-utilities";

test("Given an event from LoginComponent, when signup is clicked and user not logged in, then signup form is shown", async ({
  page,
}) => {
  // Given a login page with user not logged in
  await page.goto(TEST_PAGE_URL);

  // Wait for page to fully load and stabilize
  await page.waitForSelector("login-component", {state: "visible"});

  // When signup is clicked
  await page.click('[data-action="signup"]');

  // Wait for the event to propagate and components to update
  await page.waitForTimeout(100);

  // Then the signup form is shown
  await expect(page.locator("signup-component")).not.toHaveAttribute("hidden");
  await expect(page.locator("signup-component [data-form]")).toBeVisible();

  // And login component should be hidden
  await expect(page.locator("login-component")).toHaveAttribute("hidden");
});

test("When the signup form is submitted, then user account is created and user is logged in", async ({
  page,
}) => {
  // Given a signup form
  await page.goto(TEST_PAGE_URL);
  await page.waitForSelector("login-component", {state: "visible"});
  await page.click('[data-action="signup"]');
  await page.waitForSelector("signup-component:not([hidden])", {
    state: "visible",
  });

  // When the signup form is submitted with valid data
  const username = `test_user_${Date.now()}`;
  await page.fill("#signup-username", username);
  await page.fill("#signup-display-name", "display");
  await page.fill("#signup-password", "password123");
  await page.fill("#signup-confirm-password", "password123");
  await page.click("signup-component [data-submit]");

  await page.waitForTimeout(500);

  // And the signup form is hidden - this should work regardless
  await expect(page.locator("signup-component")).toHaveAttribute("hidden");

  // And a logged in view is shown
  await expect(page.locator("bloom-form-component")).toBeVisible();
});

test("When the login link is clicked, then login form is shown and signup form is hidden", async ({
  page,
}) => {
  // Given a signup form
  await page.goto(TEST_PAGE_URL);
  await page.waitForSelector("login-component", {state: "visible"});
  await page.click('[data-action="signup"]');
  await page.waitForSelector("signup-component:not([hidden])", {
    state: "visible",
  });

  // When the login link is clicked
  await page.click('[data-action="login"]');

  // Wait for the view to change
  await page.waitForTimeout(100);

  // Then the login form is shown
  await expect(page.locator("login-component")).not.toHaveAttribute("hidden");
  await expect(page.locator("login-component form")).not.toHaveAttribute(
    "hidden"
  );

  // And the signup form is hidden
  await expect(page.locator("signup-component")).toHaveAttribute("hidden");
});
