## Unfollow

This is a simple feature to add - pretty much just copy+pasting all of the "follow" functions/endpoints/... with an "unfollow" version.

### Reasonable solutions

See https://github.com/CodeYourFuture/Module-Legacy-Code/pull/73 for a high quality sample solution.

Ideally new functions will be added directly after the existing `follow` functions, rather than elsewhere in the files or in new files - keeping related functions together makes a codebase easier to navigate.

### Optional nice to sees

1. A test showing the behaviour is fixed (encouraged!).

### General problems to look out for

1. Reformatting unaffected lines.
2. Including other changes in the same branch.
