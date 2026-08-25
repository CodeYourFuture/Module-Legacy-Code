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
import { apiService } from "../index.mjs";

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
  const rebloomButton = bloomFrag.querySelector("[data-action='rebloom']");
  const rebloomCount = bloomFrag.querySelector("[data-rebloom-count]");

  const isRebloom = Boolean(bloom.original_bloom);
  const displayAuthor = isRebloom ? bloom.original_bloom.sender : bloom.sender;
  const displayTimestamp = isRebloom ? bloom.original_bloom.sent_timestamp : bloom.sent_timestamp;
  const displayContent = isRebloom ? bloom.original_bloom.content : bloom.content;
  const displayBloomId = isRebloom ? bloom.original_bloom.id : bloom.id;

  rebloomCount.textContent = bloom.rebloom_count ?? 0;

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomArticle.classList.toggle("bloom--rebloom", isRebloom);
  bloomUsername.setAttribute("href", `/profile/${displayAuthor}`);
  bloomUsername.textContent = displayAuthor;
  bloomTime.textContent = _formatTimestamp(displayTimestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${displayBloomId}`);

  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(displayContent), "text/html")
      .body.childNodes
  );

  if (isRebloom) {
    rebloomInfo.hidden = false;
    rebloomInfo.textContent = `🔁 Rebloomed by ${bloom.sender}`;
  }

  // Handle rebloom
  rebloomButton.addEventListener("click", async () => {
    try {
      rebloomButton.disabled = true;
      rebloomButton.textContent = "Reblooming...";

      const rebloomedBloom = await apiService.rebloom(bloom.id);

      rebloomCount.textContent = rebloomedBloom.rebloom_count;
    } catch (error) {
      console.error("Failed to rebloom:", error);
    } finally {
      rebloomButton.disabled = false;
      rebloomButton.innerHTML = `Rebloom <span data-rebloom-count>${rebloomCount.textContent}</span>`;
    }
  });

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
