## Can't log in from profile page

Two major contributing problems here:
1. We are listening for events on the wrong element. We are hooking an element that doesn't actually exist on the page (it does elsewhere).
2. Even if we were hooking the correct element, we're handling the click event, but the submit event still fires, so the submit's default behaviour is to POST to the current path, re-navigating the page. The frontend is just statically hosted, so rejects POST requests - we expected instead for JS to make a request to the backend and prevent the default submission.

### Reasonable solutions

1. Fix the element locator, and hook the submit event not the click event.

### Optional nice to sees

1. A test showing the behaviour is fixed (encouraged!).
2. Noticing that other pages follow this same buggy pattern (e.g. `hashtag.mjs`), and fixing that too.
3. Extracting a re-usable function for handling log-in, and applying it in each page (or a level above the per-view renderer).

### Problems to look out for

1. Just having the logout button redirect to the index. This is over-fitting the solution to the precise bug report, rather than looking at the general problem.

### General problems to look out for

1. Reformatting unaffected lines.
2. Including other changes in the same branch.
