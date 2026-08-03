import { apiService } from "../index.mjs";
/**
 * Create a bloom component-> adding rebloom functionality in this component.
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
  const rebloomInfo = bloomFrag.querySelector("[data-rebloom-info]");
  const rebloomSender = bloomFrag.querySelector("[data-rebloom-sender]");
  const rebloomBtn = bloomFrag.querySelector("[data-action='rebloom']");
  const rebloomCount = bloomFrag.querySelector("[data-rebloom-count]");

  bloomArticle.setAttribute("data-bloom-id", bloom.id);

  if (bloom.rebloom_id) {   //checking if rebloom_id exists  its a rebloom otherwise normal bloom
    bloomUsername.setAttribute("href", `/profile/${bloom.original_sender}`);
    bloomUsername.textContent = bloom.original_sender;

    if (rebloomInfo) rebloomInfo.hidden = false;
    if (rebloomSender) {
      rebloomSender.textContent = bloom.sender;
      rebloomSender.setAttribute("href", `/profile/${bloom.sender}`);
    }
  } else {
    bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
    bloomUsername.textContent = bloom.sender;

    if (rebloomInfo) rebloomInfo.hidden = true;
  }
  if (rebloomBtn) rebloomBtn.setAttribute("data-bloom-id", bloom.id);
  bloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes
  );
  if (rebloomCount) {
    rebloomCount.textContent = bloom.rebloom_count || 0;
  }

  if (rebloomBtn) {
    const rebloomID = bloom.rebloom_id || bloom.id;
    rebloomBtn.setAttribute("data-bloom-id", rebloomID);

    rebloomBtn.addEventListener("click", handleRebloom);
  }
  return bloomFrag;
};


async function handleRebloom(event) {
  const button = event.target.closest("button");
  const bloomId = button.getAttribute("data-bloom-id"); //each rebloom button stores id of the respective bloom.
  
  if (!bloomId) return;

  button.disabled = true; //preventing users from doubleclikcing and double reblooms
  const result = await apiService.rebloom(bloomId);

  if (!result.success) {
    alert(result.error || "You have already rebloomed this");
  button.disabled = false;
  return 
}
  button.disabled = true;
}



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
