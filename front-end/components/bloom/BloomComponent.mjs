import {apiService, getState, navigateTo} from "../../index.mjs";
import {formatTimestamp, initShadowDOM, applyStyles} from "../../utilities.mjs";
/**
 * BloomComponent - A custom element that displays a single bloom
 */
class BloomComponent extends HTMLElement {
  // Static property to cache the stylesheet for all instances
  static stylesheet = null;

  constructor() {
    super();
    // get the template, make a shadow DOM, and import styles
    const shadowRoot = initShadowDOM("bloom-template", this);
    applyStyles(shadowRoot, BloomComponent);

    // Initialize internal properties - just simple values now
    this._data = {
      username: "",
      content: "",
      timestamp: "",
      likes: 0,
      id: null,
    };
  }

  // ===== LIFECYCLE METHODS =====
  connectedCallback() {
    this._readAttributes();
    this._cacheQueries();
    this._addEventListeners();
    this._render();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  // TimeLine component sends us these
  _readAttributes() {
    // Get data from attributes
    this._data.username = this.getAttribute("username") || "";
    this._data.content = this.getAttribute("content") || "";
    this._data.timestamp = this.getAttribute("timestamp") || "";
    this._data.id = this.getAttribute("id") || null;
    this._data.likes = parseInt(this.getAttribute("likes"), 10) || 0;
  }

  // ===== CACHE DOM QUERIES =====
  _cacheQueries() {
    this.usernameElement = this.shadowRoot.querySelector("[data-username]");
    this.contentElement = this.shadowRoot.querySelector("[data-content]");
    this.timestampElement = this.shadowRoot.querySelector("[data-timestamp]");
    this.likeCountElement = this.shadowRoot.querySelector("[data-like-count]");
    this.likeButton = this.shadowRoot.querySelector("[data-action='like']");
  }

  // ===== EVENTS - INTERACTION =====
  _addEventListeners() {
    this.likeButton?.addEventListener("click", this._handleLikeClick);
    this.usernameElement?.addEventListener("click", this._handleUsernameClick);
  }

  _removeEventListeners() {
    this.likeButton?.removeEventListener("click", this._handleLikeClick);
    this.usernameElement?.removeEventListener(
      "click",
      this._handleUsernameClick
    );
  }

  // ===== HANDLERS =====
  _handleLikeClick = async () => {
    if (!this._data.id) return;

    try {
      const state = getState();
      if (!state.isLoggedIn) return;

      const response = await apiService.likeBloom(this._data.id);
      if (response) {
        this._data.likes++;
        this._render();
      }
    } catch (error) {
      console.error(error);
    }
  };

  _handleUsernameClick = (event) => {
    event.preventDefault();
    navigateTo(`/profile/${this._data.username}`);
  };

  // ===== RENDER VIEW =====
  _render() {
    if (!this.usernameElement || !this.contentElement) return;

    const {username, content, timestamp, likes} = this._data;

    this.usernameElement.textContent = `@${username}`;
    this.usernameElement.setAttribute("href", `/profile/${username}`);
    this.contentElement.textContent = content;

    // Update timestamp
    const formattedDate = formatTimestamp(timestamp);
    this.timestampElement.textContent = formattedDate;
    this.timestampElement.setAttribute("datetime", timestamp);
    this.timestampElement.setAttribute(
      "title",
      new Date(timestamp).toLocaleString()
    );

    this.likeCountElement.textContent = likes;
    this.likeCountElement.setAttribute("data-like-count", likes);
  }
}

// Register custom element
customElements.define("bloom-component", BloomComponent);
export default BloomComponent;
