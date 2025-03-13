import {test, expect} from "@playwright/test";
import {
  TEST_PAGE_URL,
  loginTestUser,
  createTestBloom,
} from "../../test-utilities.js";

/**
 * Tests for TimelineComponent based on specifications
 */

test("Given an index page load, when I am LoggedIn, then I see a timeline of blooms from people I follow", async ({
  page,
}) => {
  // Given an index page load
  await page.goto(TEST_PAGE_URL);

  // When I am LoggedIn
  await loginTestUser(page);

  // Then I see a timeline of blooms
  await expect(page.locator("timeline-component")).toBeVisible();
  // Check for the timeline content section
  await expect(
    page.locator("timeline-component [data-content]").first()
  ).toBeVisible();
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
    page.locator("bloom-component", {hasText: uniqueContent}).first()
  ).toBeVisible();

  // And it appears at the top of the timeline
  const firstBloom = page.locator("bloom-component").first();
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
  const usernameElement = page
    .locator("bloom-component [data-username]")
    .first();
  const username = await usernameElement.textContent();

  // When clicking on a username
  await usernameElement.click();

  // Then the view switches to that user's profile
  await expect(page.locator("profile-component [data-username]")).toContainText(
    username
  );
  await expect(page.locator("profile-component")).toBeVisible();
});

test("Given state changes between logged in and logged out, when the timeline renders, then it shows appropriate content", async ({
  page,
}) => {
  // Given an initial logged out state
  await page.goto(TEST_PAGE_URL);

  // Confirm login message is visible
  await expect(
    page.locator("timeline-component [data-login-message]")
  ).toBeVisible();

  // When logging in
  await loginTestUser(page);

  // Then timeline content is visible - login message is hidden
  await expect(
    page.locator("timeline-component [data-login-message]")
  ).toBeHidden();

  // And the content section is visible
  await expect(
    page.locator("timeline-component [data-content]").first()
  ).toBeVisible();

  // When logging out
  await page.click("[data-action='logout']");

  // Then login message returns
  await expect(
    page.locator("timeline-component [data-login-message]")
  ).toBeVisible();

  // And there should be no bloom components
  await expect(page.locator("bloom-component")).toHaveCount(0);
});
