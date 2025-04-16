const STATE_STORAGE_KEY = "purpleForestState";

// Try to get state out of cache
const loadCachedState = () => {
  const cachedState = localStorage.getItem(STATE_STORAGE_KEY);
  if (cachedState) return JSON.parse(cachedState);
  return {
    currentUser: null,
    isLoggedIn: false,
    profiles: [],
    timelineBlooms: [],
    token: null,
    currentHashtag: null,
    hashtagBlooms: [],
    singleBloomToShow: null,
  };
};

const state = {
  ...loadCachedState(),

  updateState(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this[key] = value;
    }
    this._persistState();
    document.dispatchEvent(new CustomEvent("state-change", {detail: {state}}));
  },

  // Cache the current state in localStorage
  _persistState() {
    try {
      const stateToCache = {
        currentUser: this.currentUser,
        isLoggedIn: this.isLoggedIn,
        profiles: this.profiles,
        timelineBlooms: this.timelineBlooms,
        token: this.token,
        currentHashtag: this.currentHashtag,
        hashtagBlooms: this.hashtagBlooms,
        singleBloomToShow: this.singleBloomToShow,
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToCache));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  },

  destroyState() {
    this.updateState({
      token: null,
      currentUser: null,
      isLoggedIn: false,
      profiles: [],
      timelineBlooms: [],
      currentHashtag: null,
      hashtagBlooms: [],
      singleBloomToShow: null,
    });

    // Clear from localStorage too
    localStorage.removeItem(STATE_STORAGE_KEY);
  },
};

export {state};
