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

function renderNoBloomsFound() {
  renderOne(
    "No blooms found",
    getHeadingContainer(),
    "heading-template",
    createHeading,
  );
}

async function hashtagView(hashtag) {
  destroy();
  if (!hashtag || hashtag.trim() === "") {
    renderNoBloomsFound();
    return;
  }

  const parsedTag = (
    hashtag.startsWith("#") ? hashtag.slice(1) : hashtag
  ).trim();
  const activeHashtag = `#${parsedTag}`;

  // Avoid refetching the same hashtag on every state-triggered rerender.
  if (state.currentHashtag !== activeHashtag) {
    await apiService.getBloomsByHashtag(parsedTag);
  }

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

  const blooms = state.hashtagBlooms || [];

  if (blooms.length === 0) {
    renderNoBloomsFound();
    return;
  }

  renderOne(
    state.currentHashtag,
    getHeadingContainer(),
    "heading-template",
    createHeading,
  );
  renderEach(blooms, getTimelineContainer(), "bloom-template", createBloom);
}

export { hashtagView };
