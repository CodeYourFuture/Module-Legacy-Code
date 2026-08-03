import { test, expect } from "@playwright/test";
import { loginAsSample, signUp } from "./test-utils.mjs";

test.describe("unfollow", () => {
  test("allows unfollowing a user from their profile", async ({ page }) => {
    await signUp(page, "sample");
    await signUp(page, "AnotherUser");

    // Given a profile component AnotherUser
    // And I am logged in as sample
    await loginAsSample(page);
    await page.goto("/#/profile/AnotherUser");
    // And sample is following AS
    await page.click('[data-action="follow"]');

    // When I view the profile component for AnotherUser
    // Then I should see a button labeled "Unfollow"
    const unfollowButton = page.locator('[data-action="unfollow"]');
    await expect(unfollowButton).toBeVisible();

    // When I click the "Unfollow" button
    await unfollowButton.click();

    // Then I should no longer be following AnotherUser
    const followerCount = page.locator("[data-follower-count]");
    await expect(followerCount).toHaveText("0");
    // And the unfollow button is not visible
    await expect(unfollowButton).toBeHidden();
  });
})
