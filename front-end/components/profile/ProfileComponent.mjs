import {apiService, getState} from "../../index.mjs";
import {applyStyles, initShadowDOM} from "../../utilities.mjs";

/**
 * ProfileComponent - Displays user profile information
 * Given an index.html page load
 *
 * When user is LoggedIn
 * Then their profile is shown
 * And all their data is fetched and populated
 *
 * When user is NOT LoggedIn
 * Then the profile component is not init and not shown
 *
 * Given a /@username page with /username in the url
 * Then that @username profile is shown
 * And the LoggedIn status is immaterial
 */
class ProfileComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const shadowRoot = initShadowDOM("profile-template", this);
    if (!shadowRoot) return;
    applyStyles(shadowRoot, ProfileComponent, [
      "../front-end/index.css",
      "../front-end/components/profile/profile.css",
    ]);
    this._cacheDOMQueries();
    this._addListeners();
    this._applyScenario();
  }
  disconnectedCallback() {
    this._removeListeners();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "username" && oldValue !== newValue) {
      this._applyScenario();
    }
  }
  static get observedAttributes() {
    return ["username"];
  }

  _cacheDOMQueries() {
    this.usernameElement = this.shadowRoot.querySelector("[data-username]");
    this.followingCountElement = this.shadowRoot.querySelector(
      "[data-following-count]"
    );
    this.followersCountElement = this.shadowRoot.querySelector(
      "[data-followers-count]"
    );
    this.bloomsCountElement = this.shadowRoot.querySelector(
      "[data-blooms-count]"
    );
    this.followButton = this.shadowRoot.querySelector("[data-action='follow']");
    this.errorContainer = this.shadowRoot.querySelector("[data-error]");
  }
  _addListeners() {
    this.followButton?.addEventListener("click", this._handleFollowClick);
    document.addEventListener("show-view", this._handleShowView);
    document.addEventListener("bloom-posted", this._handleBloomPosted);
    document.addEventListener("state-change", this._handleStateChange);
  }
  _removeListeners() {
    this.followButton?.removeEventListener("click", this._handleFollowClick);
    document.removeEventListener("show-view", this._handleShowView);
    document.removeEventListener("bloom-posted", this._handleBloomPosted);
    document.removeEventListener("state-change", this._handleStateChange);
  }

  _showError = (message) => (this.errorContainer.textContent = message);
  _clearError = () => (this.errorContainer.textContent = "");

  // ===== SCENARIO: Determine visibility and what to display =====
  _applyScenario() {
    const {currentUser} = getState();
    const profileUsername =
      this.getAttribute("username") || currentUser?.username;

    if (!profileUsername) {
      this.hidden = true;
      return;
    }

    this.hidden = false;
    this._loadProfile(profileUsername);
  }

  async _loadProfile(username) {
    this._clearError();

    try {
      const profile = await apiService.getUserProfile(username);
      if (profile) {
        this._renderProfile(profile);
        // Store username for follow action
        this.currentUsername = profile.username;
      } else {
        this._showError(`Could not load profile for ${username}`);
      }
    } catch (error) {
      this._showError("Error loading profile");
      console.error(error);
    }
  }

  _renderProfile(profile) {
    this.usernameElement.textContent = `@${profile.username}`;
    this.followersCountElement.textContent = profile.followers.length;
    this.followingCountElement.textContent = profile.follows.length;
    this.bloomsCountElement.textContent = profile.total_blooms;

    this.followButton.hidden = profile.is_self || profile.is_following;
  }

  _handleShowView = (event) => {
    if (event.detail.view === "profile") {
      this.hidden = false;
      this.setAttribute("username", event.detail.username || "");
    } else if (event.detail.view === "home") {
      this.hidden = true;
    }
  };

  _handleStateChange = () => this._applyScenario();

  _handleBloomPosted = () => this._applyScenario();

  _handleFollowClick = async () => {
    if (!this.currentUsername) return;

    try {
      await apiService.followUser(this.currentUsername);
      this._applyScenario();
    } catch (error) {
      this._showError("Failed to follow user");
    }
  };
}

customElements.define("profile-component", ProfileComponent);
export default ProfileComponent;
