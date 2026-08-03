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

  const isRebloomEvent = bloom.kind === "rebloom";
  const sourceBloom = isRebloomEvent ? bloom.bloom : bloom;
  const rebloomerUsername = isRebloomEvent ? bloom.rebloomer : null;
  const rebloomCount = sourceBloom.rebloom_count || 0;

  const bloomArticle = bloomFrag.querySelector("[data-bloom]");
  const bloomUsername = bloomFrag.querySelector("[data-username]");
  const bloomTime = bloomFrag.querySelector("[data-time]");
  const bloomTimeLink = bloomFrag.querySelector("a:has(> [data-time])");
  const bloomContent = bloomFrag.querySelector("[data-content]");
  const rebloomMeta = bloomFrag.querySelector("[data-rebloom-meta]");
  const rebloomLabel = bloomFrag.querySelector("[data-rebloom-label]");
  const rebloomerLink = bloomFrag.querySelector("[data-rebloomer]");
  const rebloomCountBadge = bloomFrag.querySelector("[data-rebloom-count]");
  const rebloomButton = bloomFrag.querySelector('[data-action="rebloom"]');

  bloomArticle.dataset.bloomId = String(sourceBloom.id);
  bloomUsername.setAttribute("href", `/profile/${sourceBloom.sender}`);
  bloomUsername.textContent = sourceBloom.sender;
  bloomTime.textContent = _formatTimestamp(sourceBloom.sent_timestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${sourceBloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(
      _formatHashtags(sourceBloom.content),
      "text/html",
    ).body.childNodes,
  );

  if (rebloomButton) {
    rebloomButton.dataset.bloomId = String(sourceBloom.id);
  }

  const rebloomCountText = `• ${rebloomCount} rebloom${rebloomCount === 1 ? "" : "s"}`;

  if (isRebloomEvent) {
    rebloomMeta.hidden = false;
    rebloomLabel.textContent = "Rebloomed by";
    rebloomerLink.setAttribute("href", `/profile/${rebloomerUsername}`);
    rebloomerLink.hidden = false;
    rebloomerLink.textContent = rebloomerUsername;
    rebloomCountBadge.textContent = rebloomCount > 0 ? rebloomCountText : "";
    rebloomCountBadge.hidden = rebloomCount === 0;
  } else if (rebloomCount > 0) {
    rebloomMeta.hidden = false;
    rebloomLabel.textContent = "";
    rebloomerLink.hidden = true;
    rebloomerLink.removeAttribute("href");
    rebloomCountBadge.textContent = `${rebloomCount} rebloom${rebloomCount === 1 ? "" : "s"}`;
    rebloomCountBadge.hidden = false;
  } else {
    rebloomerLink.hidden = true;
  }

  return bloomFrag;
};

function _formatHashtags(text) {
  if (!text) return text;
  return text.replaceAll(
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

/**
 * Handle rebloom button click
 * @param {Event} event - The click event from the rebloom button
 */
async function handleRebloom(event) {
  const button = event.target;
  const bloomId = Number.parseInt(button.dataset.bloomId, 10);
  const originalText = button.textContent;

  try {
    button.disabled = true;
    button.textContent = "Reblooming...";

    // Call the rebloom API
    await globalThis.apiService.rebloom(bloomId);

    // Refresh the timeline to show updated rebloom count
    await globalThis.apiService.getBlooms();
  } finally {
    // Restore button state
    button.textContent = originalText;
    button.disabled = false;
  }
}

export { createBloom, handleRebloom };
