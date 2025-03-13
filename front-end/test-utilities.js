/**
 * Testing utilities for Playwright tests
 */

/**
 * Standard test page URL
 */
export const TEST_PAGE_URL = "http://localhost:5500/front-end/index.html";

/**
 * Completely clean up application state between tests
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function cleanupAppState(page) {
  // 1. First clean up any open dialogs to avoid interference
  const isDialogVisible = await page.isVisible("#error-dialog");
  if (isDialogVisible) {
    await page.click("[data-action='close-error']").catch(() => {});
    await page
      .waitForSelector("#error-dialog", {
        state: "hidden",
        timeout: 3000,
      })
      .catch(() => {});
  }

  // 2. Navigate back to home to ensure consistent starting point
  await page.goto(TEST_PAGE_URL);

  // 3. Clear state, localStorage, and any other persistent data
  await page.evaluate(() => {
    // Direct state destruction
    if (window.state) {
      // Force clear all state properties
      if (typeof window.state.destroyState === "function") {
        window.state.destroyState();
      } else {
        // Fallback manual state clearing
        const stateKeys = Object.keys(window.state);
        for (const key of stateKeys) {
          // Skip functions and internal properties
          if (typeof window.state[key] !== "function" && !key.startsWith("_")) {
            if (Array.isArray(window.state[key])) {
              window.state[key] = [];
            } else if (
              typeof window.state[key] === "object" &&
              window.state[key] !== null
            ) {
              window.state[key] = {};
            } else if (typeof window.state[key] === "boolean") {
              window.state[key] = false;
            } else if (typeof window.state[key] === "string") {
              window.state[key] = null;
            } else {
              window.state[key] = null;
            }
          }
        }
      }
    }

    // Clear localStorage completely
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Explicitly set critical state values to their initial values
    if (window.state) {
      window.state.isLoggedIn = false;
      window.state.currentUser = null;
      window.state.token = null;
      window.state.profiles = [];
      window.state.timelineBlooms = [];
    }

    // Cleanup any error dialogs via the global function if available
    if (typeof window.cleanupErrorDialog === "function") {
      window.cleanupErrorDialog();
    }

    // Clear any event listeners on the document
    const oldElement = document.documentElement;
    const newElement = oldElement.cloneNode(true);
    oldElement.parentNode.replaceChild(newElement, oldElement);

    console.log("State cleanup complete");
  });

  // 4. Reload page to ensure clean DOM and state
  await page.reload();

  // 5. Wait for page to be fully loaded and stable
  await page.waitForLoadState("networkidle", {timeout: 3000}).catch(() => {});
  await page
    .waitForLoadState("domcontentloaded", {timeout: 3000})
    .catch(() => {});

  // 6. Additional verification that cleanup worked
  await page.evaluate(() => {
    // Verify token is cleared
    if (window.state && window.state.token) {
      console.error("CLEANUP FAILED: Token still exists in state");
      window.state.token = null;
    }

    // Verify localStorage is cleared
    if (
      localStorage.getItem("token") ||
      localStorage.getItem("purpleForestState")
    ) {
      console.error("CLEANUP FAILED: LocalStorage still contains data");
      localStorage.clear();
    }
  });
}

/**
 * Login a test user with standard credentials
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function loginTestUser(page) {
  // Ensure login form is visible before proceeding
  await page.waitForSelector("#username", {state: "visible", timeout: 3000});

  await page.fill("#username", "sample");
  await page.fill("#password", "sosecret");
  await page.click("[data-submit]");

  // Wait for login to complete - using the logout button's visibility as an indicator
  await page.waitForSelector("[data-action='logout'], [data-logout-button]", {
    state: "visible",
    timeout: 3000,
  });
}

/**
 * Create a test bloom with specified content
 * @param {Page} page - Playwright page object
 * @param {string} content - Content for the bloom (defaults to timestamped test content)
 * @returns {Promise<string>} - The content of the created bloom
 */
export async function createTestBloom(
  page,
  content = `Test bloom content ${Date.now()}`
) {
  // Fill the bloom content textarea - note that in the HTML it has id="bloom-content"
  await page.fill("#bloom-content", content);
  // Click the submit button
  await page.click("[data-submit]");
  // Wait for bloom to appear in timeline - using the bloom's content element
  await page.waitForSelector("[data-content]", {
    state: "visible",
    timeout: 3000,
  });
  return content;
}

/**
 * Close the error dialog if it's visible
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function closeErrorDialog(page) {
  // Try to use the exported cleanup function if available
  await page.evaluate(() => {
    // Use the provided error cleanup function if available
    if (typeof window.cleanupErrorDialog === "function") {
      window.cleanupErrorDialog();
      return true;
    }
    return false;
  });

  // Fallback to manual DOM operations if the function wasn't available or didn't work
  const isVisible = await page.isVisible("#error-dialog");
  if (isVisible) {
    await page.click("[data-action='close-error']");
    await page.waitForSelector("#error-dialog", {
      state: "hidden",
      timeout: 3000,
    });
  }
}

/**
 * Mock an API error response
 * @param {Page} page - Playwright page object
 * @param {string} endpoint - API endpoint to mock (e.g., '/home')
 * @param {number} status - HTTP status code (e.g., 500)
 * @param {string} message - Error message
 * @returns {Promise<void>}
 */
export async function mockApiError(page, endpoint, status, message) {
  await page.route(`**${endpoint}`, (route) => {
    return route.fulfill({
      status: status,
      contentType: "application/json",
      body: JSON.stringify({message: message}),
    });
  });
}

/**
 * Wait for and verify error dialog with specific message
 * @param {Page} page - Playwright page object
 * @param {string} errorTextFragment - Fragment of error text to verify
 * @returns {Promise<void>}
 */
export async function expectErrorDialog(page, errorTextFragment) {
  await page.waitForSelector("#error-dialog", {
    state: "visible",
    timeout: 3000,
  });

  await page.waitForSelector("#error-dialog[open]", {
    state: "visible",
    timeout: 3000,
  });

  if (errorTextFragment) {
    await page.waitForSelector("[data-message]", {
      state: "visible",
      timeout: 3000,
    });

    const messageText = await page.textContent("[data-message]");
    if (!messageText.includes(errorTextFragment)) {
      throw new Error(
        `Error dialog message does not contain "${errorTextFragment}". Actual message: "${messageText}"`
      );
    }
  }
}
