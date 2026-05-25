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

  // REBLOOM UI EXTENSIONS
  // Look for a top notification banner anchor inside your HTML template template
  const rebloomHeader = bloomFrag.querySelector("[data-rebloom-header]");
  if (bloom.rebloomed_by) {
    if (rebloomHeader) {
      rebloomHeader.textContent = `🔄 ${bloom.rebloomed_by} re-bloomed`;
      rebloomHeader.setAttribute("href", `/profile/${bloom.rebloomed_by}`);
      rebloomHeader.classList.remove("hidden"); // Ensure it's visible
    }
    // Visual indicator to distinctively dim or border wrap the shared block card
    bloomArticle.classList.add("rebloom-card-style"); 
  } else if (rebloomHeader) {
    rebloomHeader.classList.add("hidden");
  }

  // Look for your counter UI node element
  const rebloomCounter = bloomFrag.querySelector("[data-rebloom-count]");
  if (rebloomCounter) {
    rebloomCounter.textContent = bloom.rebloom_count > 0 ? `🔄 ${bloom.rebloom_count}` : "🔄";
  }

  bloomArticle.setAttribute("data-bloom-id", bloom.id);
  bloomUsername.setAttribute("href", `/profile/${bloom.sender}`);
  bloomUsername.textContent = bloom.sender;
  bloomTime.textContent = _formatTimestamp(bloom.sent_timestamp);
  bloomTimeLink.setAttribute("href", `/bloom/${bloom.id}`);
  bloomContent.replaceChildren(
    ...bloomParser.parseFromString(_formatHashtags(bloom.content), "text/html")
      .body.childNodes
  );

  const rebloomButton = bloomFrag.querySelector("[data-rebloom-button]");
  if (rebloomButton) {
    rebloomButton.addEventListener("click", async (event) => {
      // Prevent standard browser button click bubbles or form submissions
      event.preventDefault();
      
      try {
        // Send a POST network ping request straight to your Flask Endpoint.py
        const response = await fetch(`/api/blooms/${bloom.id}/rebloom`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Instantly refresh the timeline viewport so the newly shared item renders at the top
          window.location.reload();
        } else {
          alert(`Could not rebloom: ${result.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Network error executing rebloom:", error);
        alert("A network connection problem occurred. Please try again.");
      }
    });
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
