import {apiService, getState} from "../../index.mjs";
import {applyStyles, initShadowDOM} from "../../utilities.mjs";

/**
 * BloomFormComponent - Allows users to compose and post new Blooms
 * Given a view
 * When the user is LoggedIn
 * Then the Bloom form is shown
 *
 * When the user logs out
 * Then the Bloom form is unmounted
 */
class BloomFormComponent extends HTMLElement {
  // ===== PROPERTIES =====
  constructor() {
    super();

    // Initialize properties
    this.isLoading = false;
    this.charCount = 0;
    this.maxChars = 280;
    this.initialized = false;
  }

  // ===== LIFECYCLE METHODS =====
  connectedCallback() {
    // Check if user is logged in before initializing
    const state = getState();
    if (state.isLoggedIn) {
      this._initialize();
    }

    // Always listen for state changes
    document.addEventListener("state-change", this._handleStateChange);
  }

  disconnectedCallback() {
    this._removeEventListeners();
    document.removeEventListener("state-change", this._handleStateChange);
  }

  // ===== LAZY INIT =====
  _initialize() {
    if (this.initialized) return;

    // Clone template and attach shadow DOM
    const shadowRoot = initShadowDOM("bloom-form-template", this);
    applyStyles(shadowRoot, BloomFormComponent, [
      "../front-end/index.css",
      "../front-end/components/bloom-form/bloom-form.css",
    ]);
    this._cacheQueries();
    this._addEventListeners();
    this._updateCharCount();
    this.initialized = true;
  }

  // ===== STATE  =====
  _handleStateChange = (event) => {
    const {isLoggedIn} = getState();
    if (isLoggedIn && !this.initialized) {
      this.hidden = false;
      this._initialize();
    } else if (!isLoggedIn && this.initialized) {
      this.hidden = true;
      this._removeEventListeners();
      this.initialized = false;
    }
  };

  // ===== CACHE DOM QUERIES =====
  _cacheQueries() {
    this.form = this.shadowRoot.querySelector("form");
    this.textarea = this.shadowRoot.querySelector("[data-content]");
    this.charCountElement = this.shadowRoot.querySelector("[data-char-count]");
    this.submitButton = this.shadowRoot.querySelector("[data-submit]");
    this.errorContainer = this.shadowRoot.querySelector("[data-error]");
  }

  // ===== EVENT LISTENERS =====
  _addEventListeners() {
    this.form.addEventListener("submit", this._handleSubmit);
    this.textarea.addEventListener("input", this._handleInput);
  }

  _removeEventListeners() {
    this.form.removeEventListener("submit", this._handleSubmit);
    this.textarea.removeEventListener("input", this._handleInput);
  }

  // ===== EVENT HANDLERS =====
  _handleInput = () => {
    this.charCount = this.textarea?.value.length || 0;
    this._updateCharCount();
    this._clearError();
  };

  _updateCharCount() {
    this.charCountElement.textContent = `${this.charCount}/${this.maxChars}`;

    if (this.charCount >= this.maxChars) {
      this.textarea.classList.add("is-error");
      this.submitButton.textContent = "Too Long";
    } else {
      this.textarea.classList.remove("is-error");
      this.submitButton.textContent = "Bloom";
    }
  }

  _showError = (message) => (this.errorContainer.textContent = message);
  _clearError = () => (this.errorContainer.textContent = "");

  _setLoadingState(isLoading) {
    this.isLoading = isLoading;
    this.form.inert = isLoading;
    this.submitButton.textContent = isLoading ? "Posting..." : "Bloom";
  }

  _handleSubmit = async (event) => {
    event.preventDefault();

    if (this.isLoading) return;

    const state = getState();
    if (!state.isLoggedIn) {
      this._showError("You must be logged in to post a Bloom");
      return;
    }

    const content = this.textarea?.value.trim();
    if (content.length > this.maxChars) {
      this._showError(
        `Bloom content cannot exceed ${this.maxChars} characters`
      );
      return;
    }

    // Put UI into loading state while we post
    this._setLoadingState(true);
    this._clearError();

    try {
      // Post the Bloom to the API
      const response = await apiService.postBloom(content);

      if (response) {
        // Reset all the form bits
        this.form.reset();
        this.charCount = 0;
        this._updateCharCount();

        // Notify app to refresh timeline
        document.dispatchEvent(
          new CustomEvent("bloom-posted", {
            detail: {bloom: response},
          })
        );
      }
    } catch (error) {
      this._showError(
        error.message || "Failed to post Bloom. Please try again."
      );
    } finally {
      this._setLoadingState(false);
    }
  };
}

// Register custom element
customElements.define("bloom-form-component", BloomFormComponent);
export default BloomFormComponent;
