// ExampleComponent.mjs
import {applyStyles, initShadowDOM} from "../../utilities.mjs";
import {getState} from "../../index.mjs";

/**
 * ExampleComponent - Simple example
 *
 * Given a view
 * When the user is LoggedIn
 * Then the Example is shown
 */
class ExampleComponent extends HTMLElement {
  initialized = false;

  constructor() {
    super();
    this.hidden = true;
  }

  // ===== LIFECYCLE METHODS =====
  connectedCallback() {
    document.addEventListener("state-change", this._handleStateChange);
    if (!this.initialized) {
      this._initialize();
    }
  }

  disconnectedCallback() {
    document.removeEventListener("state-change", this._handleStateChange);
  }

  // ===== LAZY INITIALIZATION =====
  _initialize() {
    const shadowRoot = initShadowDOM("Example-Example", this);
    applyStyles(shadowRoot, ExampleComponent);
    this._cacheQueries();
    this.action.addEventListener("click", handleClick);
    this.initialized = true;
  }

  // ===== CACHE DOM QUERIES =====
  _cacheQueries() {
    this.action = this.shadowRoot.querySelector("[data-action]");
  }

  // ===== EVENT HANDLERS =====
  _handleStateChange = () => {
    const {isLoggedIn} = getState();
    this.hidden = !isLoggedIn;
  };

  _handleClick = () => {
    // trigger some api endpoint
  };
}

// Register custom element
customElements.define("example-component", ExampleComponent);
export default ExampleComponent;
