# Purple Forest Application State

This document describes the structure of the application state in the Purple Forest application, how it's updated, and how components interact with it.

## State Structure

The application uses a single source of truth (SSOT) pattern, with all state managed in one central object. This state object contains:

```javascript
{
  // Core data properties
  currentUser: null | String,       // Username of the logged-in user
  isLoggedIn: Boolean,              // Whether a user is currently logged in
  profiles: Array,                  // Array of profile objects with user-specific blooms
  timelineBlooms: Array,            // Array of aggregated blooms for home timeline
  token: null | String,             // Authentication token for API requests
  currentHashtag: null | String,    // Currently viewed hashtag
  hashtagBlooms: Array,             // Array of blooms for the current hashtag
}
```

## State Keys in Detail

### `currentUser`: String | null

- **Purpose**: Stores the username of the currently logged-in user
- **Default**: `null`
- **Updated By**:
  - `login()`: When login is successful
  - `signup()`: When registration is successful
  - `getProfile()`: When fetching the current user's profile
  - `logout()`: Reset to `null`
- **Used By**: Components that need to identify the current user or check if specific content belongs to the user

### Deriving the Current Profile

Instead of storing the currently viewed profile in state, it is derived:

- **From URL**: When on a profile page, the username is extracted from the URL path (`/profile/:username`)
- **From Context**: Components receive the username as a parameter
- **From Profiles Array**: Profile data is retrieved using `state.profiles.find((p) => p.username === username)`

This approach reduces redundancy and ensures there's a single source of truth.

### `isLoggedIn`: Boolean

- **Purpose**: Flag indicating authentication state
- **Default**: `false`
- **Updated By**:
  - `login()`: Set to `true` on successful login
  - `signup()`: Set to `true` on successful registration
  - `getProfile()`: Set to `true` when successfully retrieving user's own profile
  - `logout()`: Reset to `false`
- **Used By**: Router and components for conditional rendering

### `profiles`: Array

- **Purpose**: Stores profile data for users that have been viewed, including their blooms
- **Structure**: Array of profile objects containing:
  ```javascript
  [
    {
      username: "username1",
      follows: ["user2", "user3"],
      followers: ["user4", "user5"],
      recent_blooms: [...],      // Blooms returned directly from /profile/<username> endpoint
      is_following: Boolean,     // Only in /profile/<username> response
      is_self: Boolean,          // Only in /profile/<username> response
      total_blooms: Number,      // Only in /profile/<username> response
      blooms: [...],             // Complete bloom collection for this user, from /blooms/<username>
    },
    {
      username: "username2",
      // ...similar properties
    }
  ]
  ```
- **Default**: `[]`
- **Updated By**:
  - `getProfile(username)`: Adds or updates profile data for a specific username
  - `getBlooms(username)`: Updates the blooms for a specific profile
  - `followUser(username)`: Updates follow status and refreshes profile
- **Used By**: Profile component and user-specific timeline
- **Important Note**: Each profile contains its own collection of blooms specific to that user.

### `timelineBlooms`: Array

- **Purpose**: Stores aggregated bloom posts for the home timeline (from the current user and followed users)
- **Structure**: Array of bloom objects:
  ```javascript
  [
    {
      id: Number,
      sender: String, // username
      content: String,
      sent_timestamp: String, // ISO 8601 formatted date
    },
    // additional bloom objects...
  ];
  ```
- **Default**: `[]`
- **Updated By**:
  - `getBlooms()` (with no username): Fetches the aggregated home feed from `/home` endpoint
  - `postBloom()`: Indirectly updates by calling getBlooms() after posting
- **Used By**: Timeline component on the home view
- **Important Note**: This is distinct from profile-specific blooms and represents the aggregated feed shown on the home page.

### `token`: String | null

- **Purpose**: Stores the authentication token for API requests
- **Default**: `null`
- **Updated By**:
  - `login()`: When login is successful
  - `signup()`: When registration is successful
  - `logout()`: Reset to `null`
- **Used By**: API service to authenticate requests
- **Storage**: Persisted in localStorage for session restoration

### `currentHashtag`: String | null

- **Purpose**: Stores the currently viewed hashtag
- **Default**: `null`
- **Updated By**:
  - `getBloomsByHashtag(hashtag)`: When viewing blooms for a specific hashtag
  - `destroyState()`: Reset to `null`
- **Used By**: Hashtag view to display the current hashtag

### `hashtagBlooms`: Array

- **Purpose**: Stores bloom posts containing a specific hashtag
- **Structure**: Same as timelineBlooms - array of bloom objects
- **Default**: `[]`
- **Updated By**:
  - `getBloomsByHashtag(hashtag)`: Fetches blooms containing the specified hashtag
  - `destroyState()`: Reset to `[]`
- **Used By**: Timeline component in hashtag view
- **Important Note**: Not persisted in localStorage to avoid caching potentially stale hashtag data

## State Operations

### `updateState(stateKey, newValues)`

- **Purpose**: Updates a specific key in the state object and notifies listeners
- **Behavior**:
  - Sets `state[stateKey] = newValues`
  - Persists state to localStorage (except for hashtag-related data)
  - Dispatches a 'state-change' event with the updated state
- **Used By**: API service functions to update state after data fetching

### `destroyState()`

- **Purpose**: Resets the state to its initial values
- **Behavior**: Calls updateState for each key with default values
- **Implementation**:

  ```javascript
  destroyState() {
    this.updateState({
      token: null,
      currentUser: null,
      isLoggedIn: false,
      profiles: [],
      timelineBlooms: [],
      currentHashtag: null,
      hashtagBlooms: [],
    });

    // Clear from localStorage too
    localStorage.removeItem(STATE_STORAGE_KEY);
  }
  ```

- **Security Consideration**: It's important that all state data is properly cleared during logout to prevent data leakage between sessions.
- **Used By**: `logout()` to clear user data

## State Update Flow

1. **User Actions → API Calls**

   - User interacts with component (e.g., clicks login)
   - Component handler calls appropriate API method

2. **API Calls → State Updates**

   - API service makes HTTP request to backend
   - On success, API service updates relevant state keys
   - API service calls state.updateState() with new values

3. **State Updates → UI Updates**
   - state.updateState() dispatches 'state-change' event
   - Router listens for 'state-change' event and handles route changes
   - Components use updated state values in rendering

## Common State Access Patterns

### Profile Data

- **Current User Profile**:

  ```javascript
  // Direct access in profile component (home view):
  render(
    [state.profiles.find((p) => p.username === state.currentUser)],
    getProfileContainer(),
    "profile-template",
    createProfile
  );
  ```

- **Viewed Profile**:

  ```javascript
  // Direct access in profile component (profile view):
  // The username is derived from the URL or passed as a parameter
  const profileData = state.profiles.find((p) => p.username === username);
  render(
    [profileData],
    getProfileContainer(),
    "profile-template",
    createProfile
  );
  ```

### Bloom Data

- **Home Timeline Blooms**:

  ```javascript
  // In timeline component (home view):
  render(
    state.timelineBlooms, // Already an array
    getTimelineContainer(),
    "timeline-template",
    createTimeline
  );
  ```

- **User-Specific Blooms**:

  ```javascript
  // Direct access to user-specific blooms in timeline component:
  render(
    state.profiles.find((p) => p.username === username)?.blooms || [],
    getTimelineContainer(),
    "timeline-template",
    createTimeline
  );
  ```

- **Hashtag Blooms**:

  ```javascript
  // In hashtag view:
  render(
    state.hashtagBlooms || [],
    getTimelineContainer(),
    "bloom-template",
    createBloom
  );
  ```

## State Persistence

The application persists state to localStorage to maintain user sessions across page reloads:

- **Persisted Keys**: `currentUser`, `isLoggedIn`, `profiles`, `timelineBlooms`, `token`
- **Non-Persisted Keys**: `currentHashtag`, `hashtagBlooms` (to avoid caching stale hashtag data)
- **Storage Key**: `purpleForestState`
- **Restoration**: On application initialization, state is loaded from localStorage if available

## Implementation Considerations

### Updating State Structure

If you're implementing this state structure in a new application or refactoring an existing one:

1. **Ensure consistent naming**: If renaming state keys (e.g., from `blooms` to `timelineBlooms`), make sure to update:

   - All references in API service functions
   - The destroyState method
   - Component render functions
   - Any other code that accesses these state keys

2. **Migration strategy**: When refactoring existing code:
   - Consider maintaining backward compatibility temporarily
   - Update one component or function at a time
   - Test thoroughly after each change

## Best Practices

1. Never modify state directly; always use state.updateState()
2. Keep state normalized with minimal duplication
3. Use the router to respond to state changes
4. Components should be pure functions of state
5. API service is responsible for all state updates
6. When passing data to render functions, ensure it's in array format
7. Avoid accessing state properties that might be undefined without proper null checks
8. Maintain the distinction between home timeline blooms, user-specific blooms, and hashtag blooms
9. When updating profile data, ensure you're not overwriting existing profile information
10. Always clear all sensitive data in destroyState() when users log out
11. Prefer direct state references in render calls when possible, avoiding unnecessary intermediate variables
12. Consider which state properties should be persisted to localStorage and which should be reset on page reload
