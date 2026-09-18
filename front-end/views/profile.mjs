import {renderEach, renderOne, destroy} from "../lib/render.mjs";
import {
  apiService,
  state,
  getLogoutContainer,
  getLoginContainer,
  getProfileContainer,
  getTimelineContainer,
} from "../index.mjs";
import {createProfile, handleFollow} from "../components/profile.mjs";
import {createBloom} from "../components/bloom.mjs";
import {createLogin} from "../components/login.mjs";
import {createLogout} from "../components/logout.mjs";

// Profile view - just this person's blooms and their profile
async function profileView(username) {
  destroy();

  const existingProfile = state.profiles.find((p) => p.username === username);

  // Only fetch profile if we don't have it or if it's incomplete
  if (!existingProfile || !existingProfile.recent_blooms) {
    // Wait for the profile request before rendering to avoid stale async updates
    await apiService.getProfile(username);
  }

  renderOne(
    state.isLoggedIn,
    getLogoutContainer(),
    "logout-template",
    createLogout
  );
  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin
  );

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
    renderEach(
      profileData.recent_blooms || [],
      getTimelineContainer(),
      "bloom-template",
      createBloom
    );
  }
}

export {profileView};
