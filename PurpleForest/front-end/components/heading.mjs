/**
 * Create a heading component
 * @param {string} template - The ID of the template to clone
 * @param {boolean} text - Only add page heading when there's a value passed
 * @returns {DocumentFragment|undefined} - The heading fragment or undefined if no text
 */
export function createHeading(template, text) {
  if (!text) return;
  const heading = document.getElementById(template).content.cloneNode(true);
  heading.querySelector("[data-heading]").textContent = text;
  return heading;
}
