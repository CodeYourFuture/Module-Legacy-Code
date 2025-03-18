import {render} from "../../lib/render.mjs";

// There are 163 status messages...
const _STATUS_MESSAGES = {
  400: "Bad Request - The server cannot process your request.",
  403: "Forbidden - You don't have permission to access this.",
  404: "Not Found - The requested resource does not exist.",
  405: "Not Allowed - The server knows the request method, but the target resource doesn't support this method.",
  418: "I'm a teapot - Server refuses to brew coffee with a teapot.",
  500: "Internal Server Error - Something went wrong on the server.",
};

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

  const statusMessage = errorData.status
    ? `\n${_STATUS_MESSAGES[errorData.status] || `Status ${errorData.status}`}`
    : "";

  errorMessage.textContent = `Error: ${errorData.message}${statusMessage}`;

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

  render([error], errorContainer, "error-template", createErrorDialog);

  const dialog = errorContainer.querySelector("dialog");
  const closeButton = dialog?.querySelector("[data-action='close-error']");
  // we are gonna use replaceChildren instead of closing the modal, because that's how we're emptying all components in this design

  closeButton?.addEventListener("click", () =>
    errorContainer.replaceChildren()
  );

  if (dialog && !dialog.open) dialog.showModal();
}

export {createErrorDialog, handleErrorDialog};
