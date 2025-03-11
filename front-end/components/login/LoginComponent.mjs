import {apiService, getState} from "../../index.mjs";
import {applyStyles, initShadowDOM} from "../../utilities.mjs";

/**
 * LoginComponent
 *
 * Given an index load or a switch from signup
 * When the user is not LoggedIn
 * Then the login form is shown
 * And the signup CTA is shown
 * And the logout button is hidden
 *
 * When the user logs in
 * Then the login form is hidden
 * And the signup CTA is hidden
 * And the logout button is shown
 *
 * When the user is LoggedIn
 * Then the login form is hidden
 * And the signup CTA is hidden
 * And the logout button is shown
 *
 */
class LoginComponent extends HTMLElement {
  // ===== PROPERTIES =====
  isLoading = false;
  constructor() {
    super();
  }

  // ===== LIFECYCLE METHODS =====
  connectedCallback() {
    const shadowRoot = initShadowDOM("login-template", this);
    if (!shadowRoot) return;

    applyStyles(shadowRoot, LoginComponent, [
      "../front-end/index.css",
      "../front-end/components/login/login.css",
    ]);
    this._cacheQueries();
    this._addEventListeners();

    // Initial visibility state based on authentication
    // It's written out in scenarios so you can follow the logic
    this._applyScenario();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  // ===== CACHE DOM QUERIES =====
  _cacheQueries() {
    this.form = this.shadowRoot.querySelector("[data-form]");
    this.signup = this.shadowRoot.querySelector("[data-signup]");
    this.signupLink = this.shadowRoot.querySelector("[data-action='signup']");
    this.errorContainer = this.shadowRoot.querySelector("[data-error]");
    this.submitButton = this.shadowRoot.querySelector("[data-submit]");
    this.logoutButton = this.shadowRoot.querySelector("[data-action='logout']");
  }

  // ===== EVENT LISTENERS =====
  _addEventListeners() {
    this.form?.addEventListener("submit", this._handleSubmit);
    this.signupLink?.addEventListener("click", this._handleSwitchToSignup);
    this.logoutButton?.addEventListener("click", this._handleLogout);
    document.addEventListener("state-change", this._handleStateChange);
    document.addEventListener("show-view", this._handleShowView);
  }

  _removeEventListeners() {
    this.form?.removeEventListener("submit", this._handleSubmit);
    this.signupLink?.removeEventListener("click", this._handleSwitchToSignup);
    this.logoutButton?.removeEventListener("click", this._handleLogout);
    document.removeEventListener("state-change", this._handleStateChange);
    document.removeEventListener("show-view", this._handleShowView);
  }

  // ===== SCENARIO-BASED VISIBILITY MANAGEMENT =====
  _applyScenario() {
    const {isLoggedIn} = getState();

    // Main component visibility
    if (isLoggedIn) {
      // Scenario: User is logged in
      this.hidden = false; // Component must be visible to show logout button
      this.form.hidden = true;
      this.signup.hidden = true;
      this.logoutButton.hidden = false;
    } else {
      // Scenario: User is not logged in
      this.hidden = false;
      this.form.hidden = false;
      this.signup.hidden = false;
      this.logoutButton.hidden = true;
    }
  }

  // ===== EVENT HANDLERS =====
  _handleStateChange = () => {
    this._applyScenario();
  };

  _handleShowView = (event) => {
    if (event.detail.view === "login") {
      // When switching to login view, we need to show the component
      // and apply the correct scenario based on login state
      this.hidden = false;

      // If we're coming from signup, we need the form visible
      // (if user is not logged in)
      const {isLoggedIn} = getState();
      if (!isLoggedIn) {
        this.form.hidden = false;
        this.signup.hidden = false;
      }
    }
  };

  _showError = (message) => (this.errorContainer.textContent = message);
  _clearError = () => (this.errorContainer.textContent = "");

  _setLoadingState(isLoading) {
    this.isLoading = isLoading;
    this.submitButton.disabled = isLoading;
    this.submitButton.textContent = isLoading ? "Logging in..." : "Log in";
  }

  _handleSubmit = async (event) => {
    event.preventDefault();
    if (this.isLoading) return;

    // Clear any previous error
    this._clearError();

    const formData = new FormData(this.form);
    const username = formData.get("username");
    const password = formData.get("password");

    if (!username || !password) {
      this._showError("Username and password are required");
      return;
    }

    // Update loading state
    this._setLoadingState(true);

    try {
      const response = await apiService.login(username, password);

      if (response.access_token) {
        const userData = {
          ...response.user,
          token: response.access_token,
        };

        document.dispatchEvent(
          new CustomEvent("auth-change", {
            detail: {
              isLoggedIn: true,
              user: userData,
            },
          })
        );
        // Successful login handled by state change event
      } else {
        this._showError(response.detail || "Login failed");
      }
    } catch (error) {
      const errorMessage =
        error.detail || error.message || "Login failed. Please try again.";
      this._showError(errorMessage);
    } finally {
      // Reset loading state
      this._setLoadingState(false);
    }
  };

  _handleSwitchToSignup = (event) => {
    event.preventDefault();
    this.hidden = true;

    document.dispatchEvent(
      new CustomEvent("show-view", {
        detail: {view: "signup"},
      })
    );
  };

  _handleLogout = () => {
    document.dispatchEvent(
      new CustomEvent("auth-change", {
        detail: {
          isLoggedIn: false,
          user: null,
        },
      })
    );
    // Logout state handled by state change event
  };
}

// Register custom element
customElements.define("login-component", LoginComponent);
export default LoginComponent;
