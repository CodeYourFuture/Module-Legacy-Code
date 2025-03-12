import {apiService, getState} from "../../index.mjs";
import {applyStyles, initShadowDOM} from "../../utilities.mjs";

/**
 * TimelineComponent - Displays a feed of blooms, either all blooms or filtered by hashtag
 *
 * Given an index page load
 * When I am LoggedIn
 * Then I see a timeline of recent_blooms from people I follow
 * And this includes my own recent_blooms
 *
 * When I click on a hashtag
 * Then the timeline is filtered to only show blooms with that hashtag
 * And maybe it matters if I'm logged in? (I never used Twitter)
 *
 * When I am not LoggedIn
 * Then I see a message saying Log in to see the forest
 */
class TimelineComponent extends HTMLElement {
  constructor() {
    super();
    this.blooms = [];
  }

  // ===== LIFECYCLE =====
  connectedCallback() {
    const shadowRoot = initShadowDOM("timeline-template", this);
    if (!shadowRoot) return;

    applyStyles(shadowRoot, TimelineComponent, [
      "../front-end/index.css",
      "../front-end/components/timeline/timeline.css",
    ]);
    this._cacheDOMQueries();
    this._addEventListeners();
    this._loadBlooms();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this._loadBlooms();
  }

  static get observedAttributes() {
    return ["hashtag", "username"];
  }

  // ===== DOM QUERIES =====
  _cacheDOMQueries() {
    this.titleElement = this.shadowRoot.querySelector("[data-title]");
    this.contentElement = this.shadowRoot.querySelector("[data-content]");
    this.errorElement = this.shadowRoot.querySelector("[data-error]");
    this.emptyElement = this.shadowRoot.querySelector("[data-empty]");
    this.loginMessageElement = this.shadowRoot.querySelector(
      "[data-login-message]"
    );
  }

  // ===== EVENTS =====
  _addEventListeners() {
    document.addEventListener("bloom-posted", this._handleBloomPosted);
    document.addEventListener("state-change", this._handleStateChange);
    document.addEventListener("show-view", this._handleShowView);
  }

  _removeEventListeners() {
    document.removeEventListener("bloom-posted", this._handleBloomPosted);
    document.removeEventListener("state-change", this._handleStateChange);
    document.removeEventListener("show-view", this._handleShowView);
  }

  _handleBloomPosted = () => this._loadBlooms();
  _handleStateChange = () => this._loadBlooms();
  _handleShowView = (event) => {
    // Show the timeline component when the home view is requested
    // or when a profile is shown with a username attribute
    if (event.detail.view === "home") {
      this.hidden = false;
      this.removeAttribute("username"); // Clear any username filter
      this._loadBlooms();
    } else if (event.detail.view !== "profile") {
      // Hide the timeline for views other than home or profile
      this.hidden = true;
    }
  };

  // ===== DATA LOADING =====
  async _loadBlooms() {
    const {isLoggedIn} = getState();
    const username = this.getAttribute("username");
    const hashtag = this.getAttribute("hashtag");

    // Reset UI
    this.contentElement.replaceChildren();
    this.errorElement.hidden = true;
    this.emptyElement.hidden = true;
    this.loginMessageElement.hidden = true;

    // Show login message if needed
    // You might want to show "top blooms" here or something
    if (!isLoggedIn && !username && !hashtag) {
      this.titleElement.textContent = "Welcome to Purple Forest";
      this.loginMessageElement.hidden = false;
      return;
    }

    // Updating title based on context, to flag what the feed is showing
    this._updateTitle(username, hashtag);
    this.contentElement.setAttribute("aria-busy", "true");

    try {
      this.blooms = await this._fetchBlooms(username, hashtag, isLoggedIn);
      if (this.blooms.length > 0) {
        this._renderBlooms();
      } else {
        this.emptyElement.hidden = false;
      }
    } catch (error) {
      this.errorElement.textContent = error.message || "Failed to load blooms";
      this.errorElement.hidden = false;
    } finally {
      this.contentElement.setAttribute("aria-busy", "false");
    }
  }

  async _fetchBlooms(username, hashtag, isLoggedIn) {
    if (hashtag) {
      // Hashtag filtering not implemented in API yet
      return [];
    }

    if (username) {
      const profile = await apiService.getUserProfile(username);
      return profile?.recent_blooms || [];
    }

    if (isLoggedIn) {
      const profile = await apiService.getProfile();
      if (profile?.username) {
        const userProfile = await apiService.getUserProfile(profile.username);
        return userProfile?.recent_blooms || [];
      }
    }

    return [];
  }

  // ===== RENDERING =====
  _updateTitle(username, hashtag) {
    if (hashtag) {
      this.titleElement.textContent = `#${hashtag}`;
    } else if (username) {
      this.titleElement.textContent = `Blooms by @${username}`;
    } else {
      this.titleElement.textContent = "Your Forest";
    }
  }

  _renderBlooms() {
    this.blooms.forEach((bloom) => {
      if (!bloom?.content) return;

      const bloomElement = document.createElement("bloom-component");
      bloomElement.setAttribute(
        "username",
        bloom.sender || bloom.username || "unknown"
      );
      bloomElement.setAttribute("content", bloom.content);
      bloomElement.setAttribute(
        "timestamp",
        bloom.sent_timestamp || bloom.timestamp || new Date().toISOString()
      );
      bloomElement.setAttribute("id", bloom.id || "");

      this.contentElement.appendChild(bloomElement);
    });
  }
}

// Register custom element
customElements.define("timeline-component", TimelineComponent);
export default TimelineComponent;
