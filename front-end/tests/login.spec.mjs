import {test, expect} from "@playwright/test";
import {loginAsSample} from "./test-utils.mjs";

test.describe("Login Component", () => {
  test("should successfully log in with valid credentials", async ({page}) => {
    // Given an index page load
    await page.goto("/");

    // When I enter username "sample" and password "sosecret"
    await loginAsSample(page);

    // Then I am logged in and the logout container is shown
    await expect(
      page.locator("#logout-container [data-logout-button]")
    ).toBeVisible();
  });
});

// when i enter a user that does not exist
// then an error dialog appears
// and I do not navigate
test("should show error when user does not exist", async ({page}) => {
  // Given an index page load
  await page.goto("/");

  // When I enter invalid credentials
  await page.fill('[data-form="login"] input[name="username"]', "nonexistent");
  await page.fill(
    '[data-form="login"] input[name="password"]',
    "wrongpassword"
  );
  await page.click("[data-form='login'] [data-submit]");

  // Then an error dialog appears
  await expect(page.locator("#error-container [data-error]")).toHaveText(/unknown user/i);
});
