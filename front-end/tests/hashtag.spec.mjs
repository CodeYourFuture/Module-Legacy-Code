import { test, expect } from "@playwright/test";

test("should not make infinite hashtag endpoint requests", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => {
    if (
      request.url().includes(":3000/hashtag/do") &&
      request.resourceType() === "fetch"
    ) {
      requests.push(request);
    }
  });

  await page.goto("/#/hashtag/do");

  await page.waitForTimeout(200);

  expect(requests.length).toEqual(1);
});
