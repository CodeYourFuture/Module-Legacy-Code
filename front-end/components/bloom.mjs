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
  const rebloomBtn = bloomFrag.querySelector("[data-action='rebloom']");

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
  bloomUsername.textContent = bloom.sender;
  bloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes,
  );

  // Handle Rebloom Header Banner
  if (bloom.is_rebloom && bloom.rebloomed_by && rebloomBanner) {
    rebloomBanner.textContent = `🔄 rebloomed by ${bloom.rebloomed_by}`;
  } else if (rebloomBanner) {
    rebloomBanner.textContent = "";
  }

  //Handle Rebloom Button
  if (rebloomBtn) {
    if (bloom.is_rebloom) {
      // Disable button if it's already a rebloom
      rebloomBtn.disabled = true;
    } else {
      rebloomBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent opening the single bloom view on click

        rebloomBtn.disabled = true;
        const success = await apiService.rebloom(bloom.id);
        if (!success) {
          rebloomBtn.disabled = false;
        } else {
          if (typeof onUpdate === "function") {
            onUpdate();
          } else {
            window.location.reload(); // Fallback if no layout renderer handler is attached
          }
        }
      });
    }
  }

  return bloomFrag;
};

function _formatHashtags(text) {
  if (!text) return text;
  return text.replace(
    /#(\w+)/g,
    (match, tag) => `<a href="/hashtag/${tag}">${match}</a>`,
  );
}

function _formatTimestamp(timestamp) {
  if (!timestamp) return "";

  try {
    let formattedTimestamp = timestamp;
    if (
      typeof formattedTimestamp === "string" &&
      !formattedTimestamp.endsWith("Z") &&
      !formattedTimestamp.includes("+")
    ) {
      formattedTimestamp += "Z";
    }
    const date = new Date(formattedTimestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds == 0) {
      return "now";
    }

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
