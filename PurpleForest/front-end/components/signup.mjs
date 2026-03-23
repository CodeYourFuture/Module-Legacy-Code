import {apiService} from "../index.mjs";
import {navigateTo} from "../lib/router.mjs";

/**
 * Create a signup component
 * @param {string} template - The ID of the template to clone
 * @returns {DocumentFragment} - The signup fragment
 */
function createSignup(template) {
  const signupElement = document
    .getElementById(template)
    .content.cloneNode(true);
  return signupElement;
}

/**
 * Handle signup form submission
 * Errors are caught by the handler in apiService
 */
async function handleSignup(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector("[data-submit]");
  const originalText = submitButton.textContent;

  try {
    form.inert = true;
    submitButton.textContent = "Signing up...";

    const formData = new FormData(form);
    const username = formData.get("username");
    const password = formData.get("password");

    // TODO check passwords match here
    const result = await apiService.signup(username, password);
    if (result.success) {
      navigateTo("/");
    }
  } catch (error) {
    throw error;
  } finally {
    // Always reset UI state regardless of success/failure
    submitButton.textContent = originalText;
    form.inert = false;
    form.reset();
  }
}

export {createSignup, handleSignup};
