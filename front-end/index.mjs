import {state} from "./lib/state.mjs";
import {handleRouteChange} from "./lib/router.mjs";
import {apiService} from "./lib/api.mjs";
import {handleErrorDialog} from "./components/error.mjs";

// get all the dynamic areas of the initial DOM
const getLogoutContainer = () => document.getElementById("logout-container");
const getLoginContainer = () => document.getElementById("login-container");
const getSignupContainer = () => document.getElementById("signup-container");
const getBloomFormContainer = () =>
  document.getElementById("bloom-form-container");
const getProfileContainer = () => document.getElementById("profile-container");
const getTimelineContainer = () =>
  document.getElementById("timeline-container");
const getErrorDialog = () => document.getElementById("error-container");
const getHeadingContainer = () => document.getElementById("heading-container");

/**
 * Init the application
 * - Check for token and restore session if exists
 * - Handle the current route based on URL
 * - Set up state change listeners
 */
async function init() {
  const path = window.location.pathname;
  const isProfilePage = path.startsWith("/profile/");
  const profileUsername = isProfilePage ? path.split("/")[2] : null;

  // Attempt to restore session if token exists
  if (state.token || localStorage.getItem("token")) {
    if (localStorage.getItem("token") && !state.token) {
      state.updateState({token: localStorage.getItem("token")});
    }
    await apiService.getProfile();

    if (isProfilePage && profileUsername) {
      await apiService.getProfile(profileUsername);
    }
  }

  handleRouteChange();

  document.addEventListener("state-change", () => {
    handleRouteChange();
  });
}

document.addEventListener("click", async (e) => {
  if (e.target.dataset.action === "rebloom") {
    const bloomId = Number(e.target.dataset.bloomId);

    if (!bloomId) return;

    try {
      const result = await apiService.rebloomBloom(bloomId);
      if (result.success) {
        // Look for the span with the data attribute
        const rebloomContainer = e.target.closest(".bloom__rebloom");
        const countElem = rebloomContainer?.querySelector("[data-rebloom-count]");

        if (countElem) {
          countElem.textContent = result.rebloom_count || 1;
        }
      }
    } catch (error) {
      handleErrorDialog(error);
    }
  }
});

// TODO Check any unhandled errors bubble up to this central handler
window.onload = () => {
  init().catch((error) => {
    handleErrorDialog(error);
  });
};
// TODO rm this backstop
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  handleErrorDialog(event.reason);
});

export {
  getLogoutContainer,
  getLoginContainer,
  getSignupContainer,
  getBloomFormContainer,
  getProfileContainer,
  getHeadingContainer,
  getTimelineContainer,
  getErrorDialog,
  state,
  apiService,
};
