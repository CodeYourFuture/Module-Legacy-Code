import { renderEach, renderOne, destroy } from "../lib/render.mjs";
import {
  apiService,
  state,
  getLogoutContainer,
  getLoginContainer,
  getProfileContainer,
  getTimelineContainer,
} from "../index.mjs";
import { createLogin, handleLogin } from "../components/login.mjs";
import { createLogout, handleLogout } from "../components/logout.mjs";
import {
  createProfile,
  handleFollow,
  handleUnfollow,
} from "../components/profile.mjs";
import { createBloom } from "../components/bloom.mjs";

// Profile view - just this person's blooms and their profile
function profileView(username) {
  destroy();

  const existingProfile = state.profiles.find((p) => p.username === username);

  // Only fetch profile if we don't have it or if it's incomplete
  if (!existingProfile || !existingProfile.recent_blooms) {
    apiService.getProfile(username);
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

  const profileData = state.profiles.find((p) => p.username === username);
  if (profileData) {
    renderOne(
      {
        profileData,
        whoToFollow: state.isLoggedIn ? state.whoToFollow : [],
        isLoggedIn: state.isLoggedIn,
      },
      getProfileContainer(),
      "profile-template",
      createProfile
    );
    document
      .querySelector("[data-action='follow']")
      ?.addEventListener("click", handleFollow);
    document
      .querySelector("[data-action='unfollow']")
      ?.addEventListener("click", handleUnfollow);
    renderEach(
      profileData.recent_blooms || [],
      getTimelineContainer(),
      "bloom-template",
      createBloom
    );
  }
}

export { profileView };
