import { apiService } from "../lib/api.mjs";

/**
 * Create a bloom component
 * @param {string} template - The ID of the template to clone
 * @param {Object} bloom - The bloom data
 * @returns {DocumentFragment} - The bloom fragment of UI, for items in the Timeline
 * btw a bloom object is composed thus
 * {"id": Number,
 * "sender": username,
 * "content": "string from textarea",
 * "sent_timestamp": "datetime as ISO 8601 formatted string"}

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
  const rebloomBanner = bloomFrag.querySelector("[data-rebloom-banner]");
  const rebloomUsername = bloomFrag.querySelector("[data-rebloom-username]");
  const rebloomButton = bloomFrag.querySelector('[data-action="rebloom"]');
  const rebloomCount = bloomFrag.querySelector("[data-rebloom-count]");
  
  const displayTimestamp = bloom.rebloomed_by
    ? bloom.rebloom_timestamp
    : bloom.sent_timestamp;

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
  bloomUsername.textContent = bloom.sender;
  bloomTime.textContent = _formatTimestamp(displayTimestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes,
  );

 
  if (bloom.rebloomed_by) {
    bloomArticle.setAttribute("data-is-rebloom", "true");
    if (rebloomBanner && rebloomUsername) {
      rebloomUsername.setAttribute("href", `/profile/${bloom.rebloomed_by}`);
      rebloomUsername.textContent = bloom.rebloomed_by;
      rebloomBanner.hidden = false;
    }
  }

  if (rebloomCount) {
    if (bloom.rebloom_count > 0) {
      rebloomCount.textContent = bloom.rebloom_count;
      rebloomCount.hidden = false;
    } else {
      rebloomCount.hidden = true;
    }
  }

  if (rebloomButton) {
    let isRebloomedByViewer = Boolean(bloom.rebloomed_by_viewer);
    rebloomButton.setAttribute("data-active", String(isRebloomedByViewer));
    rebloomButton.setAttribute("aria-pressed", String(isRebloomedByViewer));

    rebloomButton.addEventListener("click", async () => {
      rebloomButton.disabled = true;
      const action = isRebloomedByViewer
        ? apiService.unrebloom
        : apiService.rebloom;
      const result = await action(bloom.id);
      if (result.success) {
        isRebloomedByViewer = !isRebloomedByViewer;
        rebloomButton.setAttribute("data-active", String(isRebloomedByViewer));
        rebloomButton.setAttribute("aria-pressed", String(isRebloomedByViewer));
      }
      rebloomButton.disabled = false;
    });
  }

  return bloomFrag;
};

function _formatHashtags(text) {
  if (!text) return text;
  return text.replace(
    /\B#[^#]+/g,
    (match) => `<a href="/hashtag/${match.slice(1)}">${match}</a>`,
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

export { createBloom };
