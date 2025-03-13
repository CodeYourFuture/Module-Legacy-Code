import {render, destroy} from "../lib/render.mjs";
import {
  apiService,
  state,
  getLogoutContainer,
  getLoginContainer,
  getProfileContainer,
  getTimelineContainer,
  getBloomFormContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login/login.mjs";
import {createLogout, handleLogout} from "../components/logout/logout.mjs";
import {createProfile} from "../components/profile/profile.mjs";
import {
  createBloomForm,
  handleBloomSubmit,
  handleTyping,
} from "../components/bloom-form/bloom-form.mjs";
import {createBloom} from "../components/bloom/bloom.mjs";

// Home view - logged in or not
function homeView() {
  destroy();

  if (state.isLoggedIn) {
    render(
      [state.profiles.find((p) => p.username === state.currentUser)],
      getProfileContainer(),
      "profile-template",
      createProfile
    );
    render(
      state.timelineBlooms,
      getTimelineContainer(),
      "bloom-template",
      createBloom
    );
    render(
      [state.isLoggedIn],
      getBloomFormContainer(),
      "bloom-form-template",
      createBloomForm
    );
    render(
      [state.isLoggedIn],
      getLogoutContainer(),
      "logout-template",
      createLogout
    );
    document
      .querySelector("[data-action='logout']")
      ?.addEventListener("click", handleLogout);
    document
      .querySelector("[data-form='bloom']")
      ?.addEventListener("submit", handleBloomSubmit);
    document.querySelector("textarea")?.addEventListener("input", handleTyping);
  } else {
    render(
      [state.isLoggedIn],
      getLoginContainer(),
      "login-template",
      createLogin
    );
    document
      .querySelector("[data-form='login']")
      ?.addEventListener("submit", handleLogin);
  }
}
export {homeView};
