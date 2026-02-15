## Hashtag slowing down my browser

The core problem here is that the frontend doesn't gate whether to fetch a hashtag on whether it has changed, so every time it fetches hashtag data it will re-render and fetch the same data again.

You can notice this in the network tab of devtools - open the network tab and reproduce the problem and you'll see a continuous loop of identical requests.

### Reasonable solutions

1. Add a check to the frontend to only fetch a hashtag if it's changed.

### Problems to look out for

1. Setting `state.currentHashtag` in the `front-end/views/hashtag.mjs` `hashtagView` function - the state is updated by `apiService.getBloomsByHashtag` already - setting it earlier may give rise to inconsistent rendering where we show the new hashtag in a title but the old hashtag's blooms.

### General problems to look out for

1. Reformatting unaffected lines.
2. Including other changes in the same branch.
