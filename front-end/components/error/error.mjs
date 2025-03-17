import {render} from "../../lib/render.mjs";

/**
 * Create an error dialog component
 * @param {string} template - The ID of the template to clone
 * @param {Object} errorData - The error data to display
 * @returns {DocumentFragment} - The error dialog fragment
 */
function createErrorDialog(template, errorData) {
  if (!template || !errorData) return;

  const errorFragment = document
    .getElementById(template)
    .content.cloneNode(true);
  const errorMessage = errorFragment.querySelector("[data-content]");

  errorMessage.textContent = errorData.message;

  return errorFragment;
}

/**
 * Global error handler that displays all errors in a central error dialog
 * @param {Error} error - The error object
 */
function handleErrorDialog(error) {
  console.error(error);
  const errorContainer = document.getElementById("error-container");
  if (!errorContainer) return;

  // Render the error message using the same render function as other components
  render([error], errorContainer, "error-template", createErrorDialog);

  // Add close handler if not already added
  const closeButton = errorContainer.querySelector(
    "[data-action='close-error']"
  );
  if (closeButton && !closeButton.hasListener) {
    closeButton.hasListener = true;
    closeButton.addEventListener("click", () => {
      const dialog = errorContainer.querySelector("dialog");
      if (dialog) dialog.close();
    });
  }

  // Show the dialog
  const dialog = errorContainer.querySelector("dialog");
  if (dialog && !dialog.open) dialog.showModal();
}

export {createErrorDialog, handleErrorDialog};
