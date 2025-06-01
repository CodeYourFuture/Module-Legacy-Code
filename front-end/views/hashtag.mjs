import { renderOne, renderEach, destroy } from "../lib/render.mjs";
import {
  state,
  apiService,
  getLogoutContainer,
  getLoginContainer,
  getTimelineContainer,
  getHeadingContainer,
} from "../index.mjs";
import { createLogin, handleLogin } from "../components/login.mjs";
import { createLogout, handleLogout } from "../components/logout.mjs";
import { createBloom } from "../components/bloom.mjs";
import { createHeading } from "../components/heading.mjs";

// Hashtag view: show all tweets containing this tag

function hashtagView(hashtag) {
  destroy();

  // Only fetch hashtag if we don't have it
  const normalized = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
  if (normalized !== state.currentHashtag) {
    apiService.getBloomsByHashtag(normalized);
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

export { hashtagView };
