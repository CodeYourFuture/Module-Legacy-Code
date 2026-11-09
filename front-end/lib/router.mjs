import {bloomView} from "../views/bloom.mjs";
import {profileView} from "../views/profile.mjs";
import {signupView} from "../views/signup.mjs";
import {loginView} from "../views/login.mjs";
import {homeView} from "../views/home.mjs";
import {hashtagView} from "../views/hashtag.mjs";

import {apiService} from "./api.mjs";
import {state} from "./state.mjs";

/**
 * Refresh the data for the current route. Runs once per navigation and once
 * on page load. It must not run on state-change re-renders, or it would loop.
 */
function refreshRouteData() {
  const hash = window.location.hash.substring(1) || "/";

  if (hash.startsWith("/bloom/")) {
    // getBloom has no error handling of its own, and the dialog already showed
    apiService.getBloom(hash.split("/")[2]).catch(() => {});
  } else if (hash.startsWith("/profile/")) {
    apiService.getProfile(hash.split("/")[2]);
  } else if (hash.startsWith("/hashtag/")) {
    apiService.getBloomsByHashtag(hash.split("/")[2]);
  } else if (hash === "/" && state.isLoggedIn) {
    apiService.getBlooms();
  }
}


let lastRoute = null;

/**
 * Handle route changes based on the current URL
 */
function handleRouteChange() {
  // We're going to use hash for routing
  const hash = window.location.hash.substring(1) || "/";

  // True for a real navigation, false for re-renders caused by state changes
  const isNavigation = hash !== lastRoute;
  lastRoute = hash;
  if (isNavigation) refreshRouteData();

  // Bloom path for a single bloom
  if (hash.startsWith("/bloom/")) {
    const bloomId = hash.split("/")[2];
    bloomView(bloomId);
    return;
  }

  // Profile path with username
  if (hash.startsWith("/profile/")) {
    const username = hash.split("/")[2];
    profileView(username);
    return;
  }

  // Hashtag path
  if (hash.startsWith("/hashtag/")) {
    const hashtag = hash.split("/")[2];
    hashtagView(hashtag);
    return;
  }

  // Static routes
  if (hash === "/signup") {
    signupView();
    return;
  }

  if (hash === "/login") {
    loginView();
    return;
  }

  // Default route
  homeView();
}

/**
 * Navigate to a specific route in the application
 * @param {string} path - The path to navigate to
 */
function navigateTo(path) {
  window.location.hash = path;
}

window.addEventListener("hashchange", handleRouteChange);

// Intercept clicks on internal links
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href");
  // Only handle internal links (starting with / and not # anchors)
  if (href && href.startsWith("/") && !href.startsWith("#")) {
    event.preventDefault();
    navigateTo(href);
  }
});

export {handleRouteChange, navigateTo};
