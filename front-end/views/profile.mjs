import {render, destroy} from "../lib/render.mjs";
import {
  apiService,
  state,
  getLogoutContainer,
  getLoginContainer,
  getProfileContainer,
  getTimelineContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login/login.mjs";
import {createLogout, handleLogout} from "../components/logout/logout.mjs";
import {createProfile, handleFollow} from "../components/profile/profile.mjs";
import {createBloom} from "../components/bloom/bloom.mjs";

// Profile view - just this person's tweets and their profile
function profileView(username) {
  destroy();

  const existingProfile = state.profiles.find((p) => p.username === username);

  // Only fetch profile if we don't have it or if it's incomplete
  if (!existingProfile || !existingProfile.recent_blooms) {
    apiService.getProfile(username);
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
    .querySelector("[data-action='login']")
    ?.addEventListener("click", handleLogin);

  const profileData = state.profiles.find((p) => p.username === username);
  if (profileData) {
    render(
      [profileData],
      getProfileContainer(),
      "profile-template",
      createProfile
    );
    render(
      profileData.recent_blooms || [],
      getTimelineContainer(),
      "bloom-template",
      createBloom
    );
    document
      .querySelector("[data-action='follow']")
      ?.addEventListener("click", handleFollow);
  }
}

export {profileView};
