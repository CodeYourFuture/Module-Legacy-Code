import {renderOne, renderEach, destroy} from "../lib/render.mjs";
import {
  state,
  apiService,
  getLogoutContainer,
  getLoginContainer,
  getTimelineContainer,
  getHeadingContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login.mjs";
import {createLogout, handleLogout} from "../components/logout.mjs";
import {createBloom} from "../components/bloom.mjs";
import {createHeading} from "../components/heading.mjs";

// Hashtag view: show all tweets containing this tag

function hashtagView(hashtag) {
  destroy();

  //Only fetch if we are actually switching to a NEW hashtag or haven't loaded it yet
  if (state.currentHashtag !== hashtag) {
    // Tell the state what hashtag we are trying to load so it doesn't get stuck
    state.updateState({ currentHashtag: hashtag });
    apiService.getBloomsByHashtag(hashtag);
    return; // Stop this cycle; the state-change listener will re-trigger this view cleanly with data!
  }

  renderOne(
    state.isLoggedIn,
    getLogoutContainer(),
    "logout-template",
    createLogout
  );
  document
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", handleLogout);
  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin
  );
  document
    .querySelector("[data-action='login']")
    ?.addEventListener("click", handleLogin);

  renderOne(
    state.currentHashtag,
    getHeadingContainer(),
    "heading-template",
    createHeading
  );
  renderEach(
    state.hashtagBlooms || [],
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
}

export {hashtagView};
