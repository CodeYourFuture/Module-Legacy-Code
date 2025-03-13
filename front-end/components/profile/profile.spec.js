import {test, expect} from "@playwright/test";
import {
  TEST_PAGE_URL,
  loginTestUser,
  createTestBloom,
} from "../../test-utilities.js";

/**
 * Tests for the Profile component
 */

test("Profile component renders user information correctly", async ({page}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Create a bloom to facilitate profile navigation
  const bloomContent = `Test bloom ${Date.now()}`;
  await createTestBloom(page, bloomContent);

  // When navigating to profile by clicking on username
  await page.locator("[data-bloom]").first().locator("[data-username]").click();

  // Then the profile component should be visible
  await expect(page.locator("#profile-container")).not.toHaveAttribute(
    "hidden"
  );

  // And should display username
  await expect(page.locator("[data-username]")).toContainText("testuser");

  // And should show follower count
  await expect(page.locator("[data-follower-count]")).toBeVisible();

  // And should show user's blooms
  await expect(page.locator("[data-bloom]")).toBeVisible();
  await expect(
    page.locator("[data-bloom]", {hasText: bloomContent})
  ).toBeVisible();
});

test("Profile component navigates back to timeline on close", async ({
  page,
}) => {
  // Given a logged in user viewing a profile
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);
  await page.locator("[data-bloom]").first().locator("[data-username]").click();

  // When clicking the close button
  await page.click("[data-action='close-profile']");

  // Then the profile should be hidden
  await expect(page.locator("#profile-container")).toHaveAttribute("hidden");

  // And the timeline should be visible
  await expect(page.locator("#timeline-container")).toBeVisible();
});

test("Profile component shows follow/unfollow button for other users", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When visiting another user's profile (not the current user)
  // Find another user's bloom
  const otherUserBloom = page
    .locator("[data-bloom]")
    .filter({
      has: page.locator("[data-username]").filter({
        hasNotText: "testuser", // Not the current user
      }),
    })
    .first();

  // Navigate to their profile
  await otherUserBloom.locator("[data-username]").click();

  // Then the follow/unfollow button should be visible
  const followButton = page.locator("[data-action='follow']");
  const unfollowButton = page.locator("[data-action='unfollow']");

  // Either follow or unfollow button should be visible
  await expect(
    page.locator("[data-action='follow'], [data-action='unfollow']")
  ).toBeVisible();

  // Test follow/unfollow functionality
  if (await followButton.isVisible()) {
    // Get initial follower count
    const initialCount = await page
      .locator("[data-follower-count]")
      .textContent();

    // Follow the user
    await followButton.click();

    // Unfollow button should now be visible
    await expect(unfollowButton).toBeVisible();

    // Follower count should have increased
    await expect(page.locator("[data-follower-count]")).not.toHaveText(
      initialCount
    );
  } else if (await unfollowButton.isVisible()) {
    // Get initial follower count
    const initialCount = await page
      .locator("[data-follower-count]")
      .textContent();

    // Unfollow the user
    await unfollowButton.click();

    // Follow button should now be visible
    await expect(followButton).toBeVisible();

    // Follower count should have decreased
    await expect(page.locator("[data-follower-count]")).not.toHaveText(
      initialCount
    );
  }
});

test("Given an index.html page load, when user is logged in, then their profile is shown with data", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // When navigating to own profile via username click
  await page.locator("[data-bloom]").first().locator("[data-username]").click();

  // Then the profile component shows with correct data
  await expect(page.locator("#profile-container")).not.toHaveAttribute(
    "hidden"
  );
  await expect(page.locator("[data-username]")).toContainText("testuser");
  await expect(page.locator("[data-follower-count]")).toBeVisible();

  // And the timeline is hidden
  await expect(page.locator("#timeline-container")).toHaveAttribute("hidden");
});

test("Given a user profile, when viewing the profile, then user's blooms are displayed in chronological order", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Create several test blooms with timestamps in content
  const bloom1 = `First test bloom ${Date.now()}`;
  await createTestBloom(page, bloom1);
  await page.waitForTimeout(1000); // Ensure different timestamps

  const bloom2 = `Second test bloom ${Date.now()}`;
  await createTestBloom(page, bloom2);

  // When navigating to own profile
  await page.locator("[data-bloom]").first().locator("[data-username]").click();

  // Then profile should show blooms in reverse chronological order (newest first)
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

test("Given a profile view, when closing the profile, then the timeline is shown again", async ({
  page,
}) => {
  // Given a logged in user viewing a profile
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);
  await page.locator("[data-bloom]").first().locator("[data-username]").click();

  // Verify we're on the profile
  await expect(page.locator("#profile-container")).not.toHaveAttribute(
    "hidden"
  );

  // When clicking the close button
  await page.click("[data-action='close-profile']");

  // Then the profile is hidden
  await expect(page.locator("#profile-container")).toHaveAttribute("hidden");

  // And the timeline is visible again
  await expect(page.locator("#timeline-container")).not.toHaveAttribute(
    "hidden"
  );
});

test("When user is not logged in, then the profile component is not initialized and not shown", async ({
  page,
}) => {
  // Given an index.html page load
  await page.goto(TEST_PAGE_URL);

  // When user is NOT logged in (default state)
  // Then the profile component is not initialized and not shown
  await expect(page.locator("#profile-container")).toHaveAttribute("hidden");
});

test("Given a profile page error, when the profile API request fails, then the error is properly handled", async ({
  page,
}) => {
  // Given a logged in user
  await page.goto(TEST_PAGE_URL);
  await loginTestUser(page);

  // Mock a failed API request for a non-existent profile
  await page.route("**/profile/nonexistent", (route) => {
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({message: "User not found"}),
    });
  });

  // When navigating to a non-existent profile
  await page.goto(`${TEST_PAGE_URL}#/profile/nonexistent`);

  // Then the error dialog is shown
  await expect(page.locator("#error-dialog")).toBeVisible();
  await expect(page.locator("[data-message]")).toContainText("User not found");

  // And the main UI is still accessible after closing the error
  await page.click("[data-action='close-error']");
  await expect(page.locator("[data-form='login']")).toBeVisible();
});
