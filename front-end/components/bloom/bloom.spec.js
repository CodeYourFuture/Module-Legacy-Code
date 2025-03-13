import {test, expect} from "@playwright/test";
import {
  TEST_PAGE_URL,
  loginTestUser,
  createTestBloom,
} from "../../test-utilities.js";

/**
 * Tests for the Bloom component - individual social media posts
 */

test("Given a timeline with blooms, when rendered, then each bloom shows content, sender, and timestamp", async ({
  page,
}) => {
  // Given a timeline with blooms
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When I create a bloom with unique content
  const uniqueContent = `Test bloom content ${Date.now()}`;
  await createTestBloom(page, uniqueContent);

  // Then each bloom shows required elements
  const bloom = page.locator("[data-bloom]", {hasText: uniqueContent}).first();

  // Content is visible and correct
  await expect(bloom.locator("[data-content]")).toContainText(uniqueContent);

  // Sender username is visible
  await expect(bloom.locator("[data-username]")).toBeVisible();
  await expect(bloom.locator("[data-username]")).not.toHaveText("");

  // Timestamp is visible
  await expect(bloom.locator("[data-time]")).toBeVisible();
  await expect(bloom.locator("[data-time]")).not.toHaveText("");
});

test("Given a bloom, when username is clicked, then navigation to profile occurs", async ({
  page,
}) => {
  // Given a timeline with blooms
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Get the first bloom
  const bloom = page.locator("[data-bloom]").first();

  // Get the username
  const usernameElement = bloom.locator("[data-username]");
  const username = await usernameElement.textContent();

  // When username is clicked
  await usernameElement.click();

  // Then navigation to profile occurs
  await expect(page.locator("#profile-container")).not.toHaveAttribute(
    "hidden"
  );
  await expect(page.locator("[data-username]")).toContainText(username);
});

test("Given a bloom with a hashtag, when the hashtag is clicked, then it shows hashtag search results", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Create a bloom with a hashtag
  const hashtag = `test${Date.now()}`;
  const bloomContent = `Testing hashtags #${hashtag}`;
  await createTestBloom(page, bloomContent);

  // When the hashtag is clicked
  // First locate the bloom with our content
  const bloom = page.locator("[data-bloom]", {hasText: bloomContent}).first();

  // Locate and click the hashtag
  const hashtagElement = bloom.locator(`a:has-text("#${hashtag}")`);
  await hashtagElement.click();

  // Then it shows hashtag search results
  await expect(page.locator("[data-hashtag-header]")).toBeVisible();
  await expect(page.locator("[data-hashtag-header]")).toContainText(
    `#${hashtag}`
  );

  // And our bloom should be in the results
  await expect(
    page.locator("[data-bloom]", {hasText: bloomContent})
  ).toBeVisible();
});

test("Given blooms in the timeline, when inspecting the bloom structure, then they follow proper semantic HTML", async ({
  page,
}) => {
  // Given a timeline with blooms
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Then blooms have proper semantic structure
  const bloom = page.locator("[data-bloom]").first();

  // Bloom is an article element (semantic)
  await expect(bloom.locator("article")).toBeVisible();

  // Username is a proper link (for navigation)
  const usernameLink = bloom.locator("[data-username]");
  await expect(usernameLink).toHaveAttribute("href", /^.*\/profile.*/);

  // Timestamp is properly formatted
  const timestamp = bloom.locator("[data-time]");
  await expect(timestamp).toBeVisible();

  // Content is in a proper element
  const content = bloom.locator("[data-content]");
  await expect(content).toBeVisible();
});
