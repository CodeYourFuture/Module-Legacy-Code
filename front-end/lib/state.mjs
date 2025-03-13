const state = {
  // Core data properties
  currentUser: null,
  currentProfile: null,
  isLoggedIn: false,
  profiles: {}, // Keyed by username
  blooms: {}, // Keyed by username

  // Update state and notify listeners
  updateState(stateKey, newValues) {
    this[stateKey] = newValues;
    document.dispatchEvent(new CustomEvent("state-change", {detail: {state}}));
  },
  destroyState() {
    this.updateState("currentUser", null);
    this.updateState("currentProfile", null);
    this.updateState("isLoggedIn", false);
    this.updateState("profiles", {});
    this.updateState("blooms", {});
  },
};

export {state};
