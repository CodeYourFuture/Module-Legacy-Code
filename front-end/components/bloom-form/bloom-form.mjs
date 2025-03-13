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

  // Initialize the counter with the maximum length value
  const textarea = bloomFormElement.querySelector("textarea");
  const counter = bloomFormElement.querySelector("[data-counter]");

  if (textarea && counter && textarea.hasAttribute("maxlength")) {
    const maxLength = parseInt(textarea.getAttribute("maxlength"), 10);
    counter.textContent = maxLength;
  }

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
  const textarea = form.querySelector("textarea");
  const content = textarea.value.trim();

  try {
    // Make form inert while we call the back end
    form.inert = true;
    submitButton.textContent = "Posting...";
    await apiService.postBloom(content);

    // Clear the textarea
    textarea.value = "";
  } finally {
    // Restore form
    submitButton.textContent = originalText;
    form.inert = false;
  }
}

/**
 * Handle textarea input for bloom form
 * @param {Event} event - The input event from textarea drives the character counter
 */
function handleTyping(event) {
  const textarea = event.target;
  const form = textarea.closest("[data-form]");
  const counter = form.querySelector("[data-counter]");

  if (counter && textarea.hasAttribute("maxlength")) {
    const maxLength = parseInt(textarea.getAttribute("maxlength"), 10);
    const currentLength = textarea.value.length;
    const remainingChars = maxLength - currentLength;
    counter.textContent = `${remainingChars} / ${maxLength}`;
  }
}

export {createBloomForm, handleBloomSubmit, handleTyping};
