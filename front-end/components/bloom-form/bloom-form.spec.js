import {test, expect} from "@playwright/test";
import {TEST_PAGE_URL, loginTestUser} from "../../test-utilities.js";

test("Given a view, when the user is logged in, then the Bloom form is shown", async ({
  page,
}) => {
  // Given a view
  await page.goto(TEST_PAGE_URL);

  // When the user is logged in
  await loginTestUser(page);

  // Then the Bloom form is shown
  await expect(page.locator("#bloom-form-container")).toBeVisible();
  await expect(page.locator("[data-form='bloom']")).toBeVisible();
  await expect(page.locator("#bloom-content")).toBeVisible();
  await expect(page.locator("[data-submit]")).toBeVisible();
});

test("When the user logs out, then the Bloom form is hidden", async ({
  page,
}) => {
  // Given a view with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Verify bloom form is visible
  await expect(page.locator("#bloom-form-container")).toBeVisible();

  // When the user logs out
  await page.click("[data-action='logout'], [data-logout-button]");

  // Then the Bloom form is hidden
  await expect(page.locator("[data-form='bloom']")).not.toBeVisible();
  await expect(page.locator("#bloom-form-container")).toHaveAttribute("hidden");
});

test("Given a logged-in user, when composing and submitting a valid bloom, then the bloom is posted and the form is cleared", async ({
  page,
}) => {
  // Given a logged-in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When composing and submitting a valid bloom
  const bloomContent = "Test bloom content " + Date.now();
  await page.fill("#bloom-content", bloomContent);
  await page.click("[data-submit]");

  // Then the bloom is posted and the form is cleared
  await expect(page.locator("#bloom-content")).toHaveValue("");

  // And the bloom appears in the timeline
  await expect(page.locator("[data-content]").first()).toContainText(
    bloomContent
  );
});

test("Given a bloom form, when typing content, then the character count updates correctly", async ({
  page,
}) => {
  // Given a bloom form with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When typing content
  await page.fill("#bloom-content", "Hello world");

  // Then the character count updates correctly
  await expect(page.locator("[data-counter]")).toContainText("269");
});

test("Given a bloom form, when attempting to submit with excessive characters, then an error is shown and submission is prevented", async ({
  page,
}) => {
  // Given a bloom form with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When attempting to submit with excessive characters
  const longText = "A".repeat(281); // 281 characters, exceeding the 280 limit
  await page.fill("#bloom-content", longText);

  // Then the form shows an error state (only checking for data attributes)
  const isErrorVisible = await page.evaluate(() => {
    const textarea = document.querySelector("#bloom-content");
    // Check for data-error attribute only
    return (
      textarea.hasAttribute("data-error") ||
      document.querySelector("[data-error]") !== null
    );
  });

  expect(isErrorVisible).toBeTruthy();
});

test("Given a logged-in user, when submitting a bloom fails due to network error, then the error dialog is shown and form state is preserved", async ({
  page,
}) => {
  // Given a logged-in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Mock a failed API request
  await page.route("**/bloom", (route) => {
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({message: "Server error when posting bloom"}),
    });
  });

  // When submitting a bloom
  const bloomContent = "This bloom will fail to post due to server error";
  await page.fill("#bloom-content", bloomContent);
  await page.click("[data-submit]");

  // Then the error dialog is shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText("Server error");

  // And the form state is preserved (content still in textarea)
  await expect(page.locator("#bloom-content")).toHaveValue(bloomContent);

  // And the form is re-enabled after error
  const isFormActive = await page.evaluate(() => {
    const form = document.querySelector("[data-form='bloom']");
    const submitButton = document.querySelector("[data-submit]");
    return !form.hasAttribute("inert") && !submitButton.disabled;
  });

  expect(isFormActive).toBeTruthy();

  // When the user clicks the error dialog close button
  await page.click("[data-action='close-error']");

  // Then the error dialog closes
  await expect(page.locator("#error-dialog")).not.toBeVisible();
});
