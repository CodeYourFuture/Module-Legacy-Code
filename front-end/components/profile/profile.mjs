/**
 * Create a profile component
 * @param {string} template - The ID of the template to clone
 * @param {Object} profileData - The profile data to display
 * @returns {DocumentFragment} - The profile UI
 */
function createProfile(template, profileData) {
  if (!template || !profileData) return;
  const profileElement = document
    .getElementById(template)
    .content.cloneNode(true);

  // These values should come from state and be updated from api
  const usernameEl = profileElement.querySelector("[data-username]");
  const bloomCountEl = profileElement.querySelector("[data-bloom-count]");
  const followerCountEl = profileElement.querySelector("[data-follower-count]");

  // Populate with data
  usernameEl.textContent = profileData.username || "";
  bloomCountEl.textContent = profileData.bloom_count || 0;
  followerCountEl.textContent = profileData.follower_count || 0;

  return profileElement;
}

export {createProfile};
