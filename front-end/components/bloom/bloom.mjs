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

  const bloomArticle = bloomFrag.querySelector("[data-bloom]");
  const bloomUsername = bloomFrag.querySelector("[data-username]");
  const bloomTime = bloomFrag.querySelector("[data-time]");
  const bloomContent = bloomFrag.querySelector("[data-content]");

  const parsedContent = new DOMParser();

  // Populate with data
  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
  bloomUsername.textContent = bloom.sender;
  bloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  // TODO when the back end gives us HTML, we can parse it
  // bloomContent.textContent =
  //   parsedContent.parseFromString(bloom.content, "text/html") ||
  //   "Hmmm, this bloom is empty";
  bloomContent.textContent = bloom.content;

  return bloomFrag;
};

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
