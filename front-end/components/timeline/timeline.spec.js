import {test, expect} from "@playwright/test";
import {
  TEST_PAGE_URL,
  loginTestUser,
  createTestBloom,
} from "../../test-utilities.js";

/**
 * Tests for Timeline component
 */

test("Given an index page load, when I am LoggedIn, then I see a timeline of blooms from people I follow", async ({
  page,
}) => {
  // Given an index page load
  await page.goto(TEST_PAGE_URL);

  // When I am LoggedIn
  await loginTestUser(page);

  // Then I see a timeline of blooms
  await expect(page.locator("#timeline-container")).toBeVisible();
  // Check for the timeline content section
  await expect(page.locator("[data-content]").first()).toBeVisible();
});

test("Given an index page load, when a user posts a new bloom, then it appears in the timeline", async ({
  page,
}) => {
  // Given an index page load with logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When a user posts a new bloom
  const uniqueContent = `Timeline test bloom ${Date.now()}`;
  await createTestBloom(page, uniqueContent);

  // Then it appears in the timeline - check for the specific bloom with the content
  await expect(
    page.locator("[data-bloom]", {hasText: uniqueContent}).first()
  ).toBeVisible();

  // And it appears at the top of the timeline
  const firstBloom = page.locator("[data-bloom]").first();
  await expect(firstBloom).toContainText(uniqueContent);
});

test("Given a timeline, when clicking on a username, then the view navigates to that user's profile", async ({
  page,
}) => {
  // Given a timeline with blooms
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);
  await createTestBloom(page);

  // Get the username from the first bloom
  const usernameElement = page.locator("[data-bloom] [data-username]").first();
  const username = await usernameElement.textContent();

  // When clicking on a username
  await usernameElement.click();

  // Then the view switches to that user's profile
  await expect(page.locator("[data-username]")).toContainText(username);
  await expect(page.locator("#profile-container")).toBeVisible();
});

test("Given state changes between logged in and logged out, when the timeline renders, then it shows appropriate content", async ({
  page,
}) => {
  // Given an initial logged out state
  await page.goto(TEST_PAGE_URL);

  // Confirm login message is visible
  await expect(page.locator("[data-login-message]")).toBeVisible();

  // When logging in
  await loginTestUser(page);

  // Then timeline content is visible - login message is hidden
  await expect(page.locator("[data-login-message]")).toBeHidden();

  // And the content section is visible
  await expect(page.locator("[data-content]").first()).toBeVisible();

  // When logging out
  await page.click("[data-action='logout']");

  // Then login message returns
  await expect(page.locator("[data-login-message]")).toBeVisible();

  // And there should be no bloom components
  await expect(page.locator("[data-bloom]")).toHaveCount(0);
});

test("Timeline displays blooms in reverse chronological order", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Create multiple test blooms with timestamps in content
  const bloom1 = `First test bloom ${Date.now()}`;
  await createTestBloom(page, bloom1);
  await page.waitForTimeout(1000); // Ensure different timestamps

  const bloom2 = `Second test bloom ${Date.now()}`;
  await createTestBloom(page, bloom2);

  // Then timeline should show blooms in reverse chronological order (newest first)
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );

  const blooms = page.locator("[data-bloom]");

  // Get the first two blooms
  const firstBloomContent = await blooms
    .nth(0)
    .locator("[data-content]")
    .textContent();
  const secondBloomContent = await blooms
    .nth(1)
    .locator("[data-content]")
    .textContent();

  // Verify order (second bloom should be first as it's newer)
  expect(firstBloomContent.includes("Second test bloom")).toBeTruthy();
  expect(secondBloomContent.includes("First test bloom")).toBeTruthy();
});

test("Timeline loads more blooms when scrolling to bottom", async ({page}) => {
  // Given a logged in user viewing the timeline
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Get initial number of blooms
  const initialBloomsCount = await page.locator("[data-bloom]").count();

  // When scrolling to the bottom of the timeline
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // Wait for load more to trigger and complete
  await page.waitForTimeout(1000);

  // Then more blooms should be loaded
  const newBloomsCount = await page.locator("[data-bloom]").count();
  expect(newBloomsCount).toBeGreaterThan(initialBloomsCount);
});

test("Timeline is hidden when viewing profile", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Timeline should be visible
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );

  // When navigating to a profile
  await page.locator("[data-bloom]").first().locator("[data-username]").click();

  // Then timeline should be hidden
  await expect(page.locator("#timeline-container")).toHaveAttribute("hidden");

  // And profile should be visible
  await expect(page.locator("#profile-container")).not.toHaveAttribute(
    "hidden"
  );

  // When closing the profile
  await page.click("[data-action='close-profile']");

  // Then timeline should be visible again
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );
});

test("Timeline is hidden when viewing hashtag search results", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Create a bloom with a hashtag
  const uniqueTag = `test${Date.now()}`;
  await createTestBloom(page, `Testing hashtag visibility #${uniqueTag}`);

  // When clicking on a hashtag
  await page.locator(`a:has-text("#${uniqueTag}")`).click();

  // Then timeline should be hidden
  await expect(page.locator("#timeline-container")).toHaveAttribute("hidden");

  // And hashtag results should be visible (checking for an element with the hashtag text)
  await expect(
    page.locator(`[data-hashtag-header]:has-text("${uniqueTag}")`)
  ).toBeVisible();

  // When closing hashtag search
  await page.click("[data-action='close-hashtag']");

  // Then timeline should be visible again
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );
});
