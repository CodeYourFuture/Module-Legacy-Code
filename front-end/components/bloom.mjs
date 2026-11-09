import {state} from "../lib/state.mjs"

/**
 * Create a bloom component (including reblooms)
 * @param {string} template - The ID of the template to clone
 * @param {Object} bloom - The bloom data
 * @returns {DocumentFragment} - The bloom fragment of UI, for items in the Timeline
 * btw a bloom object is composed thus
 * {"id": Number,
 * "sender": username,
 * "content": "string from textarea",
 * "sent_timestamp": "datetime as ISO 8601 formatted string",
 * "rebloom_count": Number,
 * "rebloomed_by: Optional string",
 * "rebloom_timestamp": "datetime as ISO 8601 formatted string",
 * "rebloomed_by_me": Boolean (has the logged-in user rebloomed this bloom)}}

 */
const createBloom = (template, bloom) => {
  if (!bloom) return;
  const bloomFrag = document.getElementById(template).content.cloneNode(true);
  const bloomParser = new DOMParser();

  const bloomArticle = bloomFrag.querySelector("[data-bloom]");
  const bloomUsername = bloomFrag.querySelector("[data-username]");
  const bloomTime = bloomFrag.querySelector("[data-time]");
  const bloomTimeLink = bloomFrag.querySelector("a:has(> [data-time])");
  const bloomContent = bloomFrag.querySelector("[data-content]");

  const rebloomInfo = bloomFrag.querySelector("[data-rebloom-info]");
  const rebloomerLink = bloomFrag.querySelector("[data-rebloomer]");
  const rebloomTime = bloomFrag.querySelector("[data-rebloom-time]");
  const rebloomBtn = bloomFrag.querySelector("[data-rebloom-btn]");
  const rebloomedLabel = bloomFrag.querySelector("[data-rebloomed-label]");
  const rebloomCount = bloomFrag.querySelector("[data-rebloom-count]");

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
  bloomUsername.textContent = bloom.sender;
  bloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes
  );

  // ---- Rebloom display ----
  const me = state.currentUser; // a username string
  const isRebloomItem = Boolean(bloom.rebloomed_by);
  const isOwnRebloom = isRebloomItem && bloom.rebloomed_by === me;
  const rebloomedByMe = Boolean(bloom.rebloomed_by_me);

  // This feed item is a rebloom: show who rebloomed it, and when
  if (isRebloomItem) {
    bloomArticle.classList.add("bloom--rebloom");
    rebloomInfo.hidden = false;
    rebloomerLink.setAttribute("href", `/profile/${bloom.rebloomed_by}`);
    rebloomerLink.textContent = isOwnRebloom ? "You" : bloom.rebloomed_by;
    rebloomTime.textContent = _formatTimestamp(bloom.rebloom_timestamp);
    // Logged-out viewers can't rebloom
    rebloomBtn.hidden = true;
  }
  if (isOwnRebloom) bloomArticle.classList.add("bloom--own-rebloom");

  // The logged-in user has rebloomed this bloom: different colour, no button
  if (rebloomedByMe) {
    rebloomBtn.hidden = true;
    // On your own rebloom item the top line already says "You rebloomed"
    rebloomedLabel.hidden = isOwnRebloom;
  }

  if (!state.isLoggedIn) rebloomBtn.hidden = true;

  // Count: nothing shown when it has never been rebloomed
  if (bloom.rebloom_count > 0) {
    rebloomCount.hidden = false;
    rebloomCount.textContent = `↻ ${bloom.rebloom_count}`;
  }
  
  return bloomFrag;
};

function _formatHashtags(text) {
  if (!text) return text;
  return text.replace(
    /\B#[^#]+/g,
    (match) => `<a href="/hashtag/${match.slice(1)}">${match}</a>`
  );
}

function _formatTimestamp(timestamp) {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    // Less than a minute
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }

    // Less than an hour
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    }

    // Less than a day
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h`;
    }

    // Less than a week
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d`;
    }

    // Format as month and day for older dates
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Failed to format timestamp:", error);
    return "";
  }
}

export {createBloom};
