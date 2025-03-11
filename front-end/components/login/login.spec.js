import {test, expect} from "@playwright/test";
import {TEST_PAGE_URL, loginTestUser} from "../../test-utilities.js";

test("Given an index load, when user is not logged in, then login form and signup CTA are shown, logout is hidden", async ({
  page,
}) => {
  // Given an index page load
  await page.goto(TEST_PAGE_URL);

  // When the user is not logged in (default state)

  // Then the login form is shown
  await expect(page.locator("login-component [data-form]")).toBeVisible();
  // And the signup CTA is shown
  await expect(page.locator("login-component [data-signup]")).toBeVisible();
  // And the logout button is hidden
  await expect(
    page.locator("login-component [data-action='logout']")
  ).toBeHidden();
});

test("Given a switch from signup, when user is not logged in, then login form and signup CTA are shown, logout is hidden", async ({
  page,
}) => {
  // Given a switch from signup
  await page.goto(TEST_PAGE_URL);
  await page.click('[data-action="signup"]'); // Switch to signup
  await page.click('[data-action="login"]'); // Switch back to login

  // When the user is not logged in

  // Then the login form is shown
  await expect(page.locator("login-component [data-form]")).toBeVisible();
  // And the signup CTA is shown
  await expect(page.locator("login-component [data-signup]")).toBeVisible();
  // And the logout button is hidden
  await expect(
    page.locator("login-component [data-action='logout']")
  ).toBeHidden();
});

test("When the user logs in, then login form and signup CTA are hidden, logout button is shown", async ({
  page,
}) => {
  // Given a login page
  await page.goto(TEST_PAGE_URL);

  // When the user logs in with valid credentials
  await loginTestUser(page);

  // Then the login form is hidden
  await expect(page.locator("login-component [data-form]")).toBeHidden();
  // And the signup CTA is hidden
  await expect(page.locator("login-component [data-signup]")).toBeHidden();
  // And the logout button is shown
  await expect(
    page.locator("login-component [data-action='logout']")
  ).toBeVisible();
});

test("When the user is logged in, then login form and signup CTA are hidden, logout button is shown", async ({
  page,
}) => {
  // Given a page where user will be logged in
  await page.goto(TEST_PAGE_URL);

  // Log the user in for this test
  await loginTestUser(page);

  // When the user is logged in (just verified above)

  // Then the login form is hidden
  await expect(page.locator("login-component [data-form]")).toBeHidden();
  // And the signup CTA is hidden
  await expect(page.locator("login-component [data-signup]")).toBeHidden();
  // And the logout button is shown
  await expect(
    page.locator("login-component [data-action='logout']")
  ).toBeVisible();
});

test("Given a login page, when the user enters invalid credentials, then an error message is shown", async ({
  page,
}) => {
  // Given a login page
  await page.goto(TEST_PAGE_URL);

  // When the user enters invalid credentials and submits
  await page.fill("#username", "invalid");
  await page.fill("#password", "wrong");
  await page.click("[data-submit]");

  // Then an error message is shown
  await expect(page.locator("login-component [data-error]")).toBeVisible();
  await expect(page.locator("login-component [data-error]")).not.toHaveText("");
  // And the login form remains visible
  await expect(page.locator("login-component [data-form]")).toBeVisible();
});

test("Given a user is logged in, when they click logout, then the login form reappears", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Verify login was successful
  await expect(
    page.locator("login-component [data-action='logout']")
  ).toBeVisible();

  // When they click logout
  await page.click("login-component [data-action='logout']");

  // Then the login form is shown
  await expect(page.locator("login-component [data-form]")).toBeVisible();
  // And the signup CTA is shown
  await expect(page.locator("login-component [data-signup]")).toBeVisible();
  // And the logout button is hidden
  await expect(
    page.locator("login-component [data-action='logout']")
  ).toBeHidden();
});

test("Given a login page, when the user clicks on signup link, then the signup form is shown", async ({
  page,
}) => {
  // Given a login page
  await page.goto(TEST_PAGE_URL);

  // When the user clicks on signup link
  await page.click("login-component [data-action='signup']");

  // Then the signup form is shown
  await expect(page.locator("signup-component")).not.toHaveAttribute("hidden");
  // And the login form is hidden
  await expect(page.locator("login-component")).toHaveAttribute("hidden");
});
