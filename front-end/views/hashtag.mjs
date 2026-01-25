import {renderOne, renderEach,} from "../lib/render.mjs";
import {
  state,
  apiService,
  getTimelineContainer,
  getHeadingContainer,
} from "../index.mjs";
import {createBloom} from "../components/bloom.mjs";
import {createHeading} from "../components/heading.mjs";

// Hashtag view: show all tweets containing this tag

function hashtagView(hashtag) {

  // changed to only fetch hashtags when hashtag changes
  if (state.currentHashtag !== hashtag) {
    state.currentHashtag = hashtag;
    state.isLoadingHashtag = true;
    apiService.getBloomsByHashtag(hashtag);
  }

 

  renderOne(
    state.currentHashtag,
    getHeadingContainer(),
    "heading-template",
    createHeading
  );
  renderEach(
    state.hashtagBlooms || [],
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
}

export {hashtagView};
