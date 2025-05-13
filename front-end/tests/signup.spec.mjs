import {test, expect} from "@playwright/test";
import {signUp, generateUsername, logout} from "./test-utils.mjs";

test.describe("Signup View", () => {
  test("navigates to signup view when clicking signup link", async ({page}) => {
    // Given an index load
    await page.goto("/");

    // When I click the signup link
    await page.click('[data-action="signup"]');

    // Then I navigate to the signup view
    await expect(page).toHaveURL(/.*#\/signup$/);
  });

  test("successfully signs up as new user", async ({page}) => {
    // Given I am on the signup view
    await page.goto("/#/signup");

    // When I signup with a unique username
    const username = generateUsername();
    await signUp(page, username);

    // Then I am logged in
    await expect(
      page.locator("#logout-container [data-logout-button]")
    ).toBeVisible();
    // And I am returned to home view
    await expect(page).toHaveURL(/.*#\/$/);
  });

  test("shows error when attempting to signup as existing user", async ({
    page,
  }) => {
    // Given I am on the signup view
    await page.goto("/#/signup");

    // When I attempt to signup as sample
    await signUp(page, "sample");

    // Then I get an error dialog
    await expect(page.locator("#error-container [data-error]")).toBeVisible();
    await expect(page.locator("#error-container [data-error]")).toHaveText(/.*user already exists.*/i);
  });

  test("returns to login view when clicking login link", async ({page}) => {
    // Given I am on the signup view
    await page.goto("/#/signup");

    // When I click the login link
    await page.click('[data-action="login"]');

    // Then I am returned to login view
    await expect(page).toHaveURL(/.*#\/login$/);
    // And the login form is visible
    await expect(
      page.locator("#login-container [data-form='login']")
    ).toBeVisible();
    // And the signup form is empty (not attached)
    await expect(
      page.locator("#signup-container [data-form='signup']")
    ).not.toBeAttached();
  });
});
