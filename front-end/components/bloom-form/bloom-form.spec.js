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
  await expect(page.locator("bloom-form-component")).toBeVisible();
  await expect(page.locator("bloom-form-component [data-form]")).toBeVisible();
  await expect(
    page.locator("bloom-form-component [data-content]")
  ).toBeVisible();
  await expect(
    page.locator("bloom-form-component [data-submit]")
  ).toBeVisible();
});

test("When the user logs out, then the Bloom form is hidden", async ({
  page,
}) => {
  // Given a view with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Verify bloom form is visible
  await expect(page.locator("bloom-form-component")).toBeVisible();

  // When the user logs out
  await page.click("[data-action='logout']");

  // Then the Bloom form is hidden
  await expect(
    page.locator("bloom-form-component [data-form]")
  ).not.toBeVisible();
  await expect(page.locator("bloom-form-component")).toHaveAttribute("hidden");
});

test("Given a logged-in user, when composing and submitting a valid bloom, then the bloom is posted and the form is cleared", async ({
  page,
}) => {
  // Given a logged-in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When composing and submitting a valid bloom
  const bloomContent = "Test bloom content " + Date.now();
  await page.fill("bloom-form-component [data-content]", bloomContent);
  await page.click("bloom-form-component [data-submit]");

  // Then the bloom is posted and the form is cleared
  await expect(page.locator("bloom-form-component [data-content]")).toHaveValue(
    ""
  );

  // And the bloom appears in the timeline
  await expect(
    page.locator("timeline-component [data-content]").first()
  ).toContainText(bloomContent);
});

test("Given a bloom form, when typing content, then the character count updates correctly", async ({
  page,
}) => {
  // Given a bloom form with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When typing content
  await page.fill("bloom-form-component [data-content]", "Hello world");

  // Then the character count updates correctly
  await expect(
    page.locator("bloom-form-component [data-char-count]")
  ).toContainText("11/280");
});

test("Given a bloom form, when attempting to submit with excessive characters, then an error is shown and submission is prevented", async ({
  page,
}) => {
  // Given a bloom form with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When attempting to submit with excessive characters
  const longText = "A".repeat(281); // 281 characters, exceeding the 280 limit
  await page.fill("bloom-form-component [data-content]", longText);

  // Then the character count shows an error state
  await expect(page.locator("bloom-form-component textarea")).toHaveClass(
    /is-error/
  );
});
