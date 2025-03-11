import {test, expect} from "@playwright/test";
import {TEST_PAGE_URL, loginTestUser} from "../../test-utilities.js";

test("Given an index.html page load, when user is logged in, then their profile is shown with data", async ({
  page,
}) => {
  // Given an index.html page load
  await page.goto(TEST_PAGE_URL);

  // When user is logged in
  await loginTestUser(page);

  // Then their profile is shown
  await expect(page.locator("profile-component")).not.toHaveAttribute("hidden");

  // And all their data is fetched and populated
  await expect(page.locator("profile-component [data-username]")).toBeVisible();
  await expect(
    page.locator("profile-component [data-username]")
  ).not.toHaveText("");

  // Eg stats are shown with values
  await expect(
    page.locator("profile-component [data-following-count]")
  ).toBeVisible();
  await expect(
    page.locator("profile-component [data-followers-count]")
  ).toBeVisible();
  await expect(
    page.locator("profile-component [data-blooms-count]")
  ).toBeVisible();
});

test("When user is not logged in, then the profile component is not initialized and not shown", async ({
  page,
}) => {
  // Given an index.html page load
  await page.goto(TEST_PAGE_URL);

  // When user is NOT logged in (default state)
  // Then the profile component is not initialized and not shown
  await expect(page.locator("profile-component")).toHaveAttribute("hidden");
});
