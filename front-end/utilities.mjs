/**
 * Format a timestamp for display in a human-readable format
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted timestamp (e.g., '2m', '5h', 'Jul 15')
 */
export function formatTimestamp(timestamp) {
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
 * Applies the app's stylesheet to a component's shadow DOM
 * I've extracted this because every component needs it exactly like this
 * Or the CSS won't apply to children of the shadow root and you might think you need to start
 * junking up the component with CSS or doing complicated slot projection
 * But you don't - you should just do this.
 * @param {ShadowRoot} shadowRoot - The shadow root
 * @param {Class} componentClass - The component class (not instance)
 * @param {string|string[]} paths - Stylesheet path(s) (defaults to index.css)
 */
export function applyStyles(
  shadowRoot,
  componentClass,
  paths = "../front-end/index.css"
) {
  // Normalize paths to array
  const stylesheetPaths = Array.isArray(paths) ? paths : [paths];

  // If stylesheets are already cached
  if (
    componentClass.stylesheets &&
    componentClass.stylesheets.length === stylesheetPaths.length
  ) {
    shadowRoot.adoptedStyleSheets = componentClass.stylesheets;
    return;
  }

  // Load all stylesheets
  Promise.all(
    stylesheetPaths.map(
      (path) =>
        fetch(path)
          .then((response) => response.text())
          .then((cssText) => {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(cssText);
            return sheet;
          })
          .catch(() => null) // Return null for failed stylesheets
    )
  ).then((sheets) => {
    // Filter out nulls from failed loads
    const validSheets = sheets.filter((sheet) => sheet);

    if (validSheets.length > 0) {
      // Store in static property
      componentClass.stylesheets = validSheets;

      // Apply to shadow DOM
      shadowRoot.adoptedStyleSheets = validSheets;
    }
  });
}
/**
 * Initializes a component's shadow DOM from a template
 * I've extracted this because every component needs it exactly like this
 * And nothing else will do
 * It's a common mishap for people new to web components
 * @param {string} templateId - ID of the template element
 * @param {HTMLElement} component - The component to initialize
 * @returns {ShadowRoot|null} - The created shadow root or null on error
 */
export function initShadowDOM(templateId, component) {
  const template = document.getElementById(templateId);
  if (!template) return null;

  const shadowRoot = component.attachShadow({mode: "open"});
  shadowRoot.appendChild(template.content.cloneNode(true));
  return shadowRoot;
}
