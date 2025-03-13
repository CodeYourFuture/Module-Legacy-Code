import {render, destroy} from "./render.mjs";
import {
  state,
  getLoginContainer,
  getSignupContainer,
  getProfileContainer,
  getTimelineContainer,
  getBloomFormContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login/login.mjs";
import {createLogout, handleLogout} from "../components/logout/logout.mjs";
import {createSignup, handleSignup} from "../components/signup/signup.mjs";
import {createProfile} from "../components/profile/profile.mjs";
import {
  createBloomForm,
  handleBloomSubmit,
} from "../components/bloom-form/bloom-form.mjs";
import {createTimeline} from "../components/timeline/timeline.mjs";

// Home view - not logged in
function loginView() {
  destroy();
  render(
    [state.isLoggedIn],
    getLoginContainer(),
    "login-template",
    createLogin
  );
  document
    .querySelector("[data-login-form]")
    .addEventListener("submit", handleLogin);
}

// Signup view, not  logged in
function signupView() {
  destroy();
  render(
    [state.isLoggedIn],
    getSignupContainer(),
    "signup-template",
    createSignup
  );
  document
    .querySelector("[data-signup-form]")
    .addEventListener("submit", handleSignup);
}

// Home view - logged in or not
function homeView() {
  destroy();
  if (state.isLoggedIn) {
    render(
      [state.currentUser],
      getProfileContainer(),
      "profile-template",
      createProfile
    );
    render(
      state.blooms,
      getTimelineContainer(),
      "timeline-template",
      createTimeline
    );
    render(
      [state.isLoggedIn],
      getBloomFormContainer(),
      "bloom-form-template",
      createBloomForm
    );
    render(
      [state.isLoggedIn],
      getLogoutContainer,
      "logout-template",
      createLogout
    );
    document
      .querySelector("[data-logout-button]")
      .addEventListener("click", handleLogout);
    document
      .querySelector("[data-bloom-form]")
      .addEventListener("submit", handleBloomSubmit);
  } else {
    render(
      [state.isLoggedIn],
      getLoginContainer(),
      "login-template",
      createLogin
    );
    document
      .querySelector("[data-login-form]")
      .addEventListener("submit", handleLogin);
  }
}

// Profile view - just this person's tweets and their profile
function profileView(username) {
  destroy();
  render(
    [state.isLoggedIn],
    getLoginContainer(),
    "login-template",
    createLogin
  );
  render(
    [state.username],
    getProfileContainer(),
    "profile-template",
    createProfile
  );
  render(
    state.blooms.username === username ? state.blooms : [],
    getTimelineContainer(),
    "timeline-template",
    createTimeline
  );
}

export {loginView, signupView, homeView, profileView};
