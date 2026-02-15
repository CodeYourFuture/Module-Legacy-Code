## Hashtag link doesn't work correctly

The core problem here is that the regex keeps searching until the next hashtag. There are many valid interpretations for what the end-of-hashtag boundary should be - anything reasonable is fine.

### Reasonable solutions

1. Amend the regex to do any reasonable end-of-hashtag detection. "Up to first whitespace" or "Until the first non-alphanumeric" seem like obvious choices.

### Optional nice to sees

1. A test showing the behaviour is fixed (encouraged!).
2. A comment explaining the behaviour of the regex, particularly if it's non-obvious.

### General problems to look out for

1. Reformatting unaffected lines.
2. Including other changes in the same branch.
