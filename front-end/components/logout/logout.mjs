import {apiService} from "../../index.mjs";

/**
 * Create a logout component
 * @param {string} template - The ID of the template to clone
 * @param {boolean} isLoggedIn - Only show logout when logged in
 * @returns {DocumentFragment|undefined} - The logout fragment or undefined if not logged in
 */
function createLogout(template, isLoggedIn) {
  if (!isLoggedIn) return;
  const logout = document.getElementById(template).content.cloneNode(true);

  return logout;
}

/**
 * Handle logout - state changes will trigger appropriate UI updates
 */
async function handleLogout(event) {
  // Call API - state changes will trigger appropriate UI updates
  apiService.logout();
}

export {createLogout, handleLogout};
