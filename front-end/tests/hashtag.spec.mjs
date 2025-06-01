import { test, expect } from "@playwright/test";
import {
  TIMELINE_USERNAMES_ELEMENTS_LOCATOR,
  loginAsSample,
  postBloom,
  logout,
  waitForLocatorToHaveMatches,
} from "./test-utils.mjs";

test.describe("Hashtag Vew", () => {
  test("shows core hashtag components when I am login ", async ({ page }) => {
    // Given I am logged in
    await loginAsSample(page);

    // the I go to
    page.goto("/#/hashtag/do");

    // Then I see the core home components
    await expect(page.locator("[data-logout-button]")).toBeVisible();
    await expect(page.locator("[data-username]")).toBeVisible();
    await expect(page.locator("[data-content]")).toBeVisible();
  });

  test("should not make infinite hashtag endpoint requests", async ({
    page,
  }) => {
    // ===== ARRANGE
    const requests = [];
    page.on("request", (request) => {
      if (
        request.url().includes(":3000/hashtag/do") &&
        request.resourceType() === "fetch"
      ) {
        requests.push(request);
      }
    });
    // ====== ACT
    // When I navigate to the hashtag
    await page.goto("/#/hashtag/do");
    // And I wait a reasonable time for any additional requests
    await page.waitForTimeout(200);

    // ====== ASSERT
    // Then the number of requests should be 1
    expect(requests.length).toEqual(1);
  });
});
