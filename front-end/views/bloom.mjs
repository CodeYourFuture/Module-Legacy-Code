import {render, destroy} from "../lib/render.mjs";
import {
  apiService,
  getTimelineContainer,
  state,
} from "../index.mjs";
import {createBloom} from "../components/bloom.mjs";

// Bloom view - just a single bloom
function bloomView(bloomId) {
  destroy();

  const blooms = [];
  if (!state.singleBloomToShow || state.singleBloomToShow.id != bloomId) {
    apiService.getBloom(bloomId);
  } else {
    blooms.push(state.singleBloomToShow);
  }

  render(
    blooms,
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
}

export {bloomView};
