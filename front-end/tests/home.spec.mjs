import {test, expect} from "@playwright/test";
import {loginAsSample, postBloom, logout} from "./test-utils.mjs";

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

    // Then I see the bloom in the timeline
    await expect(page.locator("[data-bloom]").first()).toBeVisible();
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
});
