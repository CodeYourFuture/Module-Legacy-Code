// ImportAPI service
import {apiService} from "./api/apiService.js";

// Export apiService for components to use
export {apiService};

// Initialize state at the very beginning
const appState = {
  currentUser: null,
  isLoggedIn: false,
};

/**
 * Get current application state
 * @returns {Object} Current state
 */
export function getState() {
  return {...appState};
}

/**
 * Update application state and notify listeners
 * @param {Object} newState - New state properties to merge
 */
export function updateState(newState) {
  Object.assign(appState, newState);
  document.dispatchEvent(
    new CustomEvent("state-change", {detail: {state: appState}})
  );
}

/**
 * Handle logout action
 */
async function handleLogout() {
  try {
    await apiService.logout();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    updateState({
      currentUser: null,
      isLoggedIn: false,
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

/**
 * Parse the current URL and handle routing
 */
function handleRouteChange() {
  const path = window.location.pathname;
  const profileMatch = path.match(/^\/profile\/([^\/]+)$/);

  if (profileMatch) {
    const username = profileMatch[1];
    // Dispatch a show-view event for the profile with this username
    document.dispatchEvent(
      new CustomEvent("show-view", {
        detail: {view: "profile", username},
      })
    );
  } else {
    // Any other route shows the home page
    document.dispatchEvent(
      new CustomEvent("show-view", {
        detail: {view: "home"},
      })
    );
  }
}

/**
 * Navigate to a new URL without page reload
 * @param {string} path - The path to navigate to
 */
export function navigateTo(path) {
  window.history.pushState({}, "", path);
  handleRouteChange();
}

/**
 * Initialize the router
 */
function initRouter() {
  // Handle browser back/forward navigation
  window.addEventListener("popstate", handleRouteChange);

  // Handle initial route
  handleRouteChange();
}

/**
 * Initialize the application
 */
function init() {
  // Set up auth change events
  document.addEventListener("auth-change", (event) => {
    const {isLoggedIn, user} = event.detail;

    if (isLoggedIn && user) {
      localStorage.setItem("auth_token", user.token);
      localStorage.setItem("user", JSON.stringify(user));
      apiService.token = user.token;
      apiService.currentUser = user;
      updateState({
        currentUser: user,
        isLoggedIn: true,
      });
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      updateState({
        currentUser: null,
        isLoggedIn: false,
      });
    }
  });

  // Set up logout handler
  const logoutButton = document.querySelector('[data-action="logout"]');
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

  // Set up home link navigation
  const homeLink = document.querySelector("[data-view='home']");
  if (homeLink) {
    homeLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("/");
    });
  }

  // Check for existing session
  const token = localStorage.getItem("auth_token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  if (token && storedUser.username) {
    apiService.currentUser = storedUser;
    apiService.token = token;
    updateState({
      currentUser: storedUser,
      isLoggedIn: true,
    });
  }

  // Initialize the router
  initRouter();
}

// Start the application when DOM is ready
document.addEventListener("DOMContentLoaded", init);
