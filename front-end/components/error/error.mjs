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
 * Global error handler that displays all errors in a central error dialog
 * @param {Error} error - The error object
 */
function handleErrorDialog(error) {
  console.error(error);
  const errorDialog = document.getElementById("error-dialog");
  if (!errorDialog) return;
  errorDialog.querySelector("[data-message]").textContent = "";

  // render the error dialog, we're doing this here instead of in views because it's triggered on any view
  render([error.message], errorDialog, "error-template", createErrorDialog);

  const _handleErrorClose = (event) => event.target.parentElement.close();
  errorDialog
    .querySelector("[data-close-error]")
    ?.addEventListener("click", _handleErrorClose);

  if (!errorDialog.open) errorDialog.showModal();
}

export {createErrorDialog, handleErrorDialog};
