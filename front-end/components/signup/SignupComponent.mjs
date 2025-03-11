import {apiService, getState} from "../../index.mjs";
import {applyStyles, initShadowDOM} from "../../utilities.mjs";

/**
 * SignupComponent - Handles user registration
 *
 * Given an event from LoginComponent
 * When signup is clicked
 * And the user is not LoggedIn
 * Then the signup form is shown
 *
 * When the signup form is submitted
 * Then the api is called
 * And the user account is created
 * And the user is LoggedIn
 *
 * When the login link is clicked
 * Then the login form is shown
 * And the signup form is hidden
 *
 * When the form has invalid data
 * Then appropriate error messages are shown
 * And the form is not submitted
 */
class SignupComponent extends HTMLElement {
  // Static property to cache the stylesheet for all instances
  static stylesheet = null;

  // ===== PROPERTIES =====
  isLoading = false;
  initialized = false;

  constructor() {
    super();
  }

  // ===== LIFECYCLE METHODS =====
  connectedCallback() {
    document.addEventListener("show-view", this._handleShowView);
    if (!this.initialized) {
      this._initializeComponent();
    }
  }

  disconnectedCallback() {
    document.removeEventListener("show-view", this._handleShowView);
    document.removeEventListener("state-change", this._handleStateChange);

    if (this.initialized) {
      this.form.removeEventListener("submit", this._handleSubmit);
      this.loginLink.removeEventListener("click", this._handleSwitchToLogin);
    }
  }

  // ===== INITIALIZATION =====
  _initializeComponent() {
    const shadowRoot = initShadowDOM("signup-template", this);
    applyStyles(shadowRoot, SignupComponent);
    this._cacheQueries();
    this._addListeners();
    this.initialized = true;
  }

  // ===== CACHE DOM QUERIES =====
  _cacheQueries() {
    this.form = this.shadowRoot.querySelector("[data-form]");
    this.loginLink = this.shadowRoot.querySelector("[data-action='login']");
    this.errorContainer = this.shadowRoot.querySelector("[data-error]");
    this.submitButton = this.shadowRoot.querySelector("[data-submit]");
    this.usernameInput = this.shadowRoot.querySelector("#signup-username");
    this.passwordInput = this.shadowRoot.querySelector("#signup-password");
    this.displayNameInput = this.shadowRoot.querySelector(
      "#signup-display-name"
    );
  }

  // ===== EVENT LISTENERS =====
  _addListeners() {
    this.form.addEventListener("submit", this._handleSubmit);
    this.loginLink.addEventListener("click", this._handleSwitchToLogin);
    document.addEventListener("state-change", this._handleStateChange);
  }

  // ===== EVENT HANDLERS =====
  _handleStateChange = (event) =>
    event.detail.state.isLoggedIn ? (this.hidden = true) : null;

  _handleShowView = (event) => {
    const shouldShow = event.detail.view === "signup";
    if (shouldShow && !this.initialized) {
      this._initializeComponent();
    }
    this.hidden = !shouldShow;
  };

  _showError = (message) => (this.errorContainer.textContent = message);

  _clearError = () => (this.errorContainer.textContent = "");

  _setLoadingState(isLoading) {
    this.isLoading = isLoading;
    this.submitButton.disabled = isLoading;
    this.submitButton.textContent = isLoading
      ? "Creating account..."
      : "Sign up";

    // Disable all inputs while loading
    [this.usernameInput, this.passwordInput, this.displayNameInput].forEach(
      (input) => {
        if (input) input.disabled = isLoading;
      }
    );
  }

  _handleSubmit = async (event) => {
    event.preventDefault();
    if (this.isLoading) return;

    this._clearError();

    const formData = new FormData(this.form);
    const username = formData.get("username");
    const password = formData.get("password");
    const displayName = formData.get("displayName") || username;

    // Update UI to loading state
    this._setLoadingState(true);

    try {
      const response = await apiService.signup(username, password, displayName);

      if (response.success) {
        // Login on signup
        document.dispatchEvent(
          new CustomEvent("auth-change", {
            detail: {
              isLoggedIn: true,
              user: response.user,
            },
          })
        );
      } else {
        this._showError(response.detail || "Registration failed");
      }
    } catch (error) {
      this._showError(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      this._setLoadingState(false);
    }
  };

  _handleSwitchToLogin = (event) => {
    event.preventDefault();
    this.hidden = true;

    // Dispatch event for showing login, if it wants one
    document.dispatchEvent(
      new CustomEvent("show-view", {
        detail: {view: "login"},
      })
    );
  };
}

// Register custom element
customElements.define("signup-component", SignupComponent);
export default SignupComponent;
