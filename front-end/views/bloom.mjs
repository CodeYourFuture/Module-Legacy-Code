import {render, destroy} from "../lib/render.mjs";
import {
  apiService,
  getLoginContainer,
  getLogoutContainer,
  getTimelineContainer,
  state,
} from "../index.mjs";
import {createBloom} from "../components/bloom.mjs";
import {createLogin, handleLogin} from "../components/login.mjs";
import {createLogout, handleLogout} from "../components/logout.mjs";

// Bloom view - just a single bloom
function bloomView(bloomId) {
  destroy();

  const blooms = [];
  if (!state.singleBloomToShow || state.singleBloomToShow.id != bloomId) {
    apiService.getBloom(bloomId);
  } else {
    blooms.push(state.singleBloomToShow);
  }

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
    .querySelector("[data-form='login']")
    ?.addEventListener("submit", handleLogin);

  render(
    blooms,
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
}

export {bloomView};
