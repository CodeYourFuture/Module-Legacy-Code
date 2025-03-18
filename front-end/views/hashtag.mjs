import {render, destroy} from "../lib/render.mjs";
import {
  state,
  apiService,
  getLogoutContainer,
  getLoginContainer,
  getTimelineContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login/login.mjs";
import {createLogout, handleLogout} from "../components/logout/logout.mjs";

// Hashtag view: show all tweets containing this tag

function hashtagView(hashtag) {
  destroy();

  apiService.getBloomsByHashtag(hashtag);

  render(
    [state.isLoggedIn],
    getLogoutContainer(),
    "logout-template",
    createLogout
  );
  document
    .querySelector("[data-action='logout']")
    ?.addEventListener("click", handleLogout);
  render(
    [state.isLoggedIn],
    getLoginContainer(),
    "login-template",
    createLogin
  );
  document
    .querySelector("[data-action='login']")
    ?.addEventListener("click", handleLogin);

  render(
    state.hashtagBlooms || [],
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
}

export {hashtagView};
