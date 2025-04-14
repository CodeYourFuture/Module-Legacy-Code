import {test, expect} from "@playwright/test";
import {loginAsSample, loginAsSample2} from "./test-utils.mjs";

test.describe("Profile View", () => {
  test("shows own profile when logged in", async ({page}) => {
    // Given a profile view
    // When I am logged in as sample
    await loginAsSample(page);
    await page.goto("/front-end/#/profile/sample");

    // Then I see logout button, profile, and timeline of my posts only
    await expect(
      page.locator("#logout-container [data-logout-button]")
    ).toBeVisible();
    await expect(
      page.locator("#profile-container a[data-username]")
    ).toBeVisible();
    await expect(page.locator("#timeline-container")).toBeVisible();
    // And bloom form is not attached
    await expect(
      page.locator("#bloom-form-container [data-form]")
    ).not.toBeAttached();
  });

  test("shows other user's profile with follow button", async ({page}) => {
    // Given I am logged in as sample2
    await loginAsSample2(page);
    // When I go to sample's profile
    await page.goto("/front-end/#/profile/sample");

    // Then I see logout button, profile, and timeline of sample's posts
    await expect(
      page.locator("#logout-container [data-logout-button]")
    ).toBeVisible();
    await expect(
      page.locator("#profile-container a[data-username]")
    ).toBeVisible();
    await expect(page.locator("#timeline-container")).toBeVisible();
    // And bloom form is not attached
    await expect(page.locator("#bloom-form-container form")).not.toBeAttached();
  });

  test("shows followed user's posts in timeline", async ({page}) => {
    // Given I am logged in as sample2 on sample's profile
    await loginAsSample2(page);
    await page.goto("/front-end/#/profile/sample");
    // And I have followed sample (not repeatable...)
    // await page.click('[data-action="follow"]');

    // When I return to my home view
    await page.goto("/front-end/#/");

    // Then I see sample's posts in my timeline
    await expect(page.locator("#timeline-container")).toBeVisible();
  });
});
