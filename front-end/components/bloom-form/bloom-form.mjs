import {apiService} from "../../index.mjs";

/**
 * Create a bloom form component
 * @param {string} template - The ID of the template to clone
 * @param {Object} isLoggedIn - only logged in users see the bloom form
 * @returns {DocumentFragment} - The bloom form fragment
 */
function createBloomForm(template, isLoggedIn) {
  if (!isLoggedIn) return;
  const bloomFormElement = document
    .getElementById(template)
    .content.cloneNode(true);
  return bloomFormElement;
}

/**
 * Handle bloom form submission
 * @param {Event} event - The form submission event
 */
async function handleBloomSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector("[data-submit]");
  const originalText = submitButton.textContent;
  const errorContainer = form.querySelector("[data-error]");
  const textarea = form.querySelector("textarea");

  // Get the bloom content from the textarea
  const content = textarea.value.trim();

  try {
    // Make form inert while we call the back end
    form.inert = true;
    submitButton.textContent = "Posting...";

    // Call the API - state changes will trigger appropriate UI updates
    await apiService.postBloom(content);
    textarea.value = "";
    // If there's a counter, update it
    const counter = form.querySelector("[data-counter]");
    if (counter && textarea.hasAttribute("maxlength")) {
      const maxLength = parseInt(textarea.getAttribute("maxlength"), 10);
      counter.textContent = `${maxLength} / ${maxLength}`;
    }
  } catch (error) {
    errorContainer.textContent =
      error.message || "Failed to post bloom. Please try again.";
  } finally {
    // Restore form
    submitButton.textContent = originalText;
    form.inert = false;
  }
}

/**
 * Handle textarea input for bloom form
 * @param {Event} event - The input event
 */
function handleTextareaInput(event) {
  const textarea = event.target;
  const form = textarea.closest("[data-form]");
  const counter = form.querySelector("[data-counter]");
  const maxLength = parseInt(textarea.getAttribute("maxlength"), 10);
  const currentLength = textarea.value.length;
  counter.textContent = `${maxLength - currentLength} / ${maxLength}`;
}

export {createBloomForm, handleBloomSubmit, handleTextareaInput};
