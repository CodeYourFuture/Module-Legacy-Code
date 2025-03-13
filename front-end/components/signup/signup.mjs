import {state, apiService} from "../../index.mjs";

/**
 * Create a signup component
 * @param {string} template - The ID of the template to clone
 * @param {Object} data - Optional data to populate the component with
 * @returns {DocumentFragment} - The signup fragment
 */
function createSignup(template, data) {
  const signupElement = document
    .getElementById(template)
    .content.cloneNode(true);
  return signupElement;
}

/**
 * Handle signup form submission
 */
async function handleSignup(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector("[data-submit]");
  const originalText = submitButton.textContent;
  const errorContainer = form.querySelector("[data-error]");

  const formData = new FormData(form);
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    // make form inert while we call the back end...
    form.inert = true;
    submitButton.textContent = "Signing up...";
    await apiService.signup(username, password);
  } catch {
    // Show error to user
    errorContainer.textContent =
      error.message || "Signup failed. Please try again.";
  } finally {
    submitButton.textContent = originalText;
    form.inert = false;
  }
}

export {createSignup, handleSignup};
