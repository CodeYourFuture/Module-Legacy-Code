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
  const errorMessage = errorFragment.querySelector("[data-message]");

  errorMessage.textContent = errorData.message;

  return errorFragment;
}

/**
 * Remove all event listeners from the error dialog
 */
function removeErrorDialogListeners() {
  const errorDialog = document.getElementById("error-dialog");
  if (!errorDialog) return;

  // Remove click event from close button
  const closeButton = errorDialog.querySelector("[data-close-error]");
  if (closeButton) {
    closeButton.removeEventListener("click", handleErrorClose);
  }

  // Remove backdrop click handler
  errorDialog.removeEventListener("click", handleBackdropClick);
}

/**
 * Handle dialog close button click
 * @param {Event} event - The click event
 */
function handleErrorClose(event) {
  const errorDialog = document.getElementById("error-dialog");
  if (errorDialog && errorDialog.open) {
    removeErrorDialogListeners();
    errorDialog.close();
  }
}

/**
 * Handle dialog backdrop click
 * @param {Event} event - The click event
 */
function handleBackdropClick(event) {
  const errorDialog = document.getElementById("error-dialog");
  if (event.target === errorDialog && errorDialog.open) {
    removeErrorDialogListeners();
    errorDialog.close();
  }
}

/**
 * Global error handler that displays all errors in a central error dialog
 * @param {Error} error - The error object
 */
function handleErrorDialog(error) {
  console.error(error);

  const errorDialog = document.getElementById("error-dialog");
  if (!errorDialog) return;

  // Clean up any existing listeners first
  removeErrorDialogListeners();

  const errorData = {
    message:
      error.message || "Something went wrong. That's all we know, sorry!",
  };

  render([errorData], errorDialog, "error-template", createErrorDialog);

  // Add click handlers after rendering
  const closeButton = errorDialog.querySelector("[data-close-error]");
  if (closeButton) {
    closeButton.addEventListener("click", handleErrorClose);
  }

  // Add backdrop click handler
  errorDialog.addEventListener("click", handleBackdropClick);

  if (!errorDialog.open) {
    errorDialog.showModal();
  }
}

/**
 * Clean up the error dialog - can be called directly to force cleanup
 * This is useful for test cleanup or when switching between views TODO, simplify this all a bit
 */
function cleanupErrorDialog() {
  const errorDialog = document.getElementById("error-dialog");
  if (errorDialog) {
    removeErrorDialogListeners();
    if (errorDialog.open) {
      errorDialog.close();
    }
  }
}

// Export functions
export {handleErrorDialog, removeErrorDialogListeners, cleanupErrorDialog};
