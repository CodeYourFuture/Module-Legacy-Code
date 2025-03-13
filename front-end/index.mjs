import {state} from "./lib/state.mjs";
import {handleRouteChange} from "./lib/router.mjs";
import {apiService} from "./lib/api.mjs";

// get all the dynamic areas of the initial DOM
const getLoginContainer = () => document.getElementById("login-container");
const getSignupContainer = () => document.getElementById("signup-container");
const getBloomFormContainer = () =>
  document.getElementById("bloom-form-container");
const getProfileContainer = () => document.getElementById("profile-container");
const getTimelineContainer = () =>
  document.getElementById("timeline-container");

/**
 * Initialize the application
 * - Attempt to restore session if token exists
 * - Set up state change listeners
 * - Initialize router
 */
function init() {
  // If we're still logged in, just restore that session
  if (localStorage.getItem("token")) {
    apiService.getProfile().finally(handleRouteChange);
  } else {
    handleRouteChange();
  }
  // listen for any more state changes
  document.addEventListener("state-change", handleRouteChange);
}

window.onload = init;

export {
  getLoginContainer,
  getSignupContainer,
  getBloomFormContainer,
  getProfileContainer,
  getTimelineContainer,
  state,
  apiService,
};
