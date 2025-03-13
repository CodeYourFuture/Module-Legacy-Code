import {profileView, signupView, loginView, homeView} from "./views.mjs";

/**
 * Handle route changes based on the current URL
 */
function handleRouteChange() {
  const path = window.location.pathname;

  // Profile path with username
  if (path.startsWith("/profile/")) {
    const username = path.split("/")[2];
    profileView(username);
    return;
  }

  // Static routes
  if (path === "/signup") {
    signupView();
    return;
  }

  if (path === "/login") {
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
  history.pushState(null, "", path);
  handleRouteChange();
}

// Listen for browser navigation events
window.addEventListener("popstate", handleRouteChange);

export {handleRouteChange, navigateTo};
