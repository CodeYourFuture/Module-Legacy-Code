import {createBloom} from "../bloom/bloom.mjs";

/**
 * Create a timeline component
 * @param {string} template - The ID of the template to clone
 * @param {Object} blooms - The timeline content, show whatever is passed and don't make decisions
 * @returns {DocumentFragment} - The timeline element
 */
function createTimeline(template, blooms) {
  if (!blooms) return;
  const timelineElement = document
    .getElementById(template)
    .content.cloneNode(true);

  // All the bits of the template we currently want to interact with
  const content = timelineElement.querySelector("[data-content]");
  const errorContainer = timelineElement.querySelector("[data-error]");
  const emptyMessage = timelineElement.querySelector("[data-empty]");

  // Show/hide appropriate messages
  const isEmpty = data.length === 0;
  emptyMessage.hidden = !isEmpty;

  // now let's make a piece of UI for each bloom
  const bloomsUI = blooms.map((bloom) => createBloom("bloom-template", bloom));
  content.appendChild(bloomsUI);

  return timelineElement;
}

export {createTimeline};
