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

function renderHashtagUI() {
  renderOne(
    state.isLoggedIn,
    getLogoutContainer(),
    "logout-template",
    createLogout,
  );
  document
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", handleLogout);
  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin,
  );
  document
    .querySelector("[data-action='login']")
    ?.addEventListener("click", handleLogin);

  renderOne(
    state.currentHashtag,
    getHeadingContainer(),
    "heading-template",
    createHeading,
  );
  renderEach(
    state.hashtagBlooms || [],
    getTimelineContainer(),
    "bloom-template",
    createBloom,
  );
}

// Hashtag view: show all tweets containing this tag

function hashtagView(hashtag) {
  destroy();
  const formattedTag = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;

  if (state.currentHashtag === formattedTag) {
    renderHashtagUI();
    return;
  }

  apiService.getBloomsByHashtag(hashtag);
  renderHashtagUI();
}

export { hashtagView };
