import { test, expect } from "@playwright/test";
import { loginAsSample } from "./test-utils.mjs";

test.describe("Hashtag Page", () => {
  test("should not make infinite hashtag endpoint requests", async ({
    page,
  }) => {
    // 1. Given I am logged in
    await loginAsSample(page);

    // 2. ARRANGE: Start listening for requests
    const requests = [];
    page.on("request", (request) => {
      // Note: If the test fails with 0, check if the URL includes ":3000/hashtag/do"
      // or if it should be an API path like "/api/hashtag/do"
      if (
        request.url().includes(":3000/hashtag/do") &&
        request.resourceType() === "fetch"
      ) {
        requests.push(request);
      }
    });

    // 3. ACT: Navigate to the hashtag
    await page.goto("/#/hashtag/do");

    // Wait to see if the bug triggers multiple requests
    await page.waitForTimeout(200);

    // 4. ASSERT: Then the number of requests should be 1
    expect(requests.length).toEqual(1);
  });
});
