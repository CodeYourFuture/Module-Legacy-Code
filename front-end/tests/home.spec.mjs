import {test, expect} from "@playwright/test";
import {TIMELINE_USERNAMES_ELEMENTS_LOCATOR, loginAsSample, postBloom, logout, waitForLocatorToHaveMatches} from "./test-utils.mjs";

test.describe("Home View", () => {
  test("shows login component when not logged in", async ({page}) => {
    // Given an index load
    await page.goto("/");

    // And I am not logged in
    // (no login action needed)

    // Then I see the login component
    await expect(page.locator('[data-form="login"]')).toBeVisible();
    await expect(
      page.locator('[data-form="login"] input[name="username"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-form="login"] input[name="password"]')
    ).toBeVisible();
  });

  test("shows core home components when logged in", async ({page}) => {
    // Given I am logged in
    await loginAsSample(page);

    // Then I see the core home components
    await expect(page.locator("[data-logout-button]")).toBeVisible();
    await expect(
      page.locator(".profile__username[data-username]")
    ).toBeVisible();
    await expect(page.locator('[data-form="bloom"]')).toBeVisible();
  });

  test("shows timeline after creating a bloom", async ({page}) => {
    // Given I am logged in
    await loginAsSample(page);

    // When I create a bloom
    await postBloom(page, "My first bloom!");

    // Finds at least one Bloom with the content created by this test.
    await expect(
      page.locator("[data-bloom] [data-content]").filter({hasText: "My first bloom!"}).first()
    ).toBeVisible();
  });

  test("hides components after logout", async ({page}) => {
    // Given I am logged in
    await loginAsSample(page);

    // When I logout
    await logout(page);

    // Then I see the login form again
    await expect(page.locator('[data-form="login"]')).toBeVisible();
    // And home components are removed from the DOM
    await expect(page.locator("[data-logout-button]")).not.toBeAttached();
    await expect(
      page.locator(".profile__username[data-username]")
    ).not.toBeAttached();
    await expect(page.locator('[data-form="bloom"]')).not.toBeAttached();
  });

  test("shows own and followed user's posts in home timeline", async ({page}) => {
    // Given I am logged in as sample who already follows JustSomeGuy
    await loginAsSample(page);

    await waitForLocatorToHaveMatches(page, TIMELINE_USERNAMES_ELEMENTS_LOCATOR);
    const postUsernames = await page.locator(TIMELINE_USERNAMES_ELEMENTS_LOCATOR).allInnerTexts();
    // Then I see my own posts in my timeline
    expect(postUsernames).toContain("sample");
    // And I see my a followed user's posts in my timeline
    expect(postUsernames).toContain("JustSomeGuy");
  });
});

// Playwright test for reblooming a Bloom and showing its rebloom count.
test("can rebloom a bloom and show its rebloom count", async ({page}) => {
  await loginAsSample(page);

  const content = `Rebloom test ${Date.now()}`;
  await postBloom(page, content);

  // Finds the specific Bloom created by this test so we do not depend on existing data.
  const bloom = page.locator("[data-bloom]").filter({hasText: content}).first();
  await expect(bloom).toBeVisible();

  const bloomId = await bloom.getAttribute("data-bloom-id");

  // Rebloom the Bloom and wait for the refreshed timeline to show the rebloom.
  await bloom.locator("[data-action='rebloom']").click();
  await expect(
    page.locator(`[data-bloom-id="${bloomId}"] .bloom__rebloom`)
  ).toHaveCount(1);

  // Verifies that the rebloom shows the total number of reblooms.
  const rebloom = page
    .locator(`[data-bloom-id="${bloomId}"]`)
    .filter({has: page.locator(".bloom__rebloom")})
    .first();

  await expect(rebloom.locator(".bloom__rebloom-count")).toHaveText("1 rebloom");

  // Clicking again should not create another rebloom because the database prevents duplicates.
  await page
    .locator(`[data-bloom-id="${bloomId}"] [data-action='rebloom']`)
    .first()
    .click();

  await expect(
    page.locator(`[data-bloom-id="${bloomId}"] .bloom__rebloom`)
  ).toHaveCount(1);
});
