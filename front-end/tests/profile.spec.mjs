import {test, expect} from "@playwright/test";
import {TIMELINE_USERNAMES_ELEMENTS_LOCATOR, loginAsSample, loginAsJustSomeGuy, logout, waitForLocatorToHaveMatches} from "./test-utils.mjs";

test.describe("Profile View", () => {
  test("shows own profile when logged in", async ({page}) => {
    // Given a profile view
    // When I am logged in as sample
    await loginAsSample(page);
    await page.goto("/#/profile/sample");

    // Then I see logout button, profile, and timeline of my posts only
    await expect(
      page.locator("#logout-container [data-logout-button]")
    ).toBeVisible();
    await expect(
      page.locator("#profile-container header a[data-username]")
    ).toBeVisible();

    await waitForLocatorToHaveMatches(page, TIMELINE_USERNAMES_ELEMENTS_LOCATOR);
    const postUsernames = new Set(await page.locator(TIMELINE_USERNAMES_ELEMENTS_LOCATOR).allInnerTexts());
    expect(postUsernames).toEqual(new Set(["sample"]));

    // And bloom form is not attached
    await expect(
      page.locator("#bloom-form-container [data-form]")
    ).not.toBeAttached();
  });

  test("shows other user's profile with follow button", async ({page}) => {
    // Given I am logged in as AS
    await loginAsJustSomeGuy(page);
    // When I go to sample's profile
    await page.goto("/#/profile/sample");

    // Then I see logout button, profile, and timeline of sample's posts
    await expect(
      page.locator("#logout-container [data-logout-button]")
    ).toBeVisible();
    await expect(
      page.locator("#profile-container header a[data-username]")
    ).toBeVisible();
    await expect(page.locator("#timeline-container")).toBeVisible();
    // And bloom form is not attached
    await expect(page.locator("#bloom-form-container form")).not.toBeAttached();
  });
});

// Regression test: login should work again without leaving another user's profile
test("can log in again from another user's profile", async ({page}) => {
  // Given I am logged in as sample
  await loginAsSample(page);

  // And I am viewing AS's profile
  await page.goto("/#/profile/AS");

  // And I log out
  await logout(page);

  // When I log in again as sample
  await page.fill('[data-form="login"] input[name="username"]', "sample");
  await page.fill(
    '[data-form="login"] input[name="password"]',
    "sosecret"
  );
  await page.click('[data-form="login"] [data-submit]');

  // Then I see the logged in view of AS's profile
  await expect(
    page.locator("#logout-container [data-logout-button]")
  ).toBeVisible();

  await expect(
    page.locator("#profile-container header a[data-username]")
  ).toBeVisible();
});
