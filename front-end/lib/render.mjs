import {
  getLogoutContainer,
  getLoginContainer,
  getSignupContainer,
  getProfileContainer,
  getTimelineContainer,
  getBloomFormContainer,
  getHeadingContainer,
} from "../index.mjs";

/**
 * Render a component: pass to a creator function and then attach the result to the DOM
 * At this point the fragment becomes part of the DOM  - you can attach event listeners after this point in the flow
 * @param {Array} data - The data to pass to the creator function
 * @param {HTMLElement} container - The container to append the component to
 * @param {string} template - The ID of the template to clone
 * @param {Function} creator - The function that creates the component
 */
const renderEach = (data, container, template, creator) => {
  const fragment = data.map((item) => creator(template, item));
  if (fragment.some(Boolean)) container.replaceChildren(...fragment);
};

/**
 * Render a component: pass to a creator function and then attach the result to the DOM
 * At this point the fragment becomes part of the DOM  - you can attach event listeners after this point in the flow
 * @param {Any} data - The data to pass to the creator function
 * @param {HTMLElement} container - The container to append the component to
 * @param {string} template - The ID of the template to clone
 * @param {Function} creator - The function that creates the component
 */
const renderOne = (data, container, template, creator) => {
  const fragment = creator(template, data);
  if (fragment) container.replaceChildren(fragment);
};

// to clear an entire page, not just the contents of one container
const destroy = () => {
  [
    getLogoutContainer(),
    getLoginContainer(),
    getSignupContainer(),
    getProfileContainer(),
    getTimelineContainer(),
    getBloomFormContainer(),
    getHeadingContainer(),
  ].forEach((container) => {
    if (container) container.replaceChildren();
  });
};

export {renderEach, renderOne, destroy};
