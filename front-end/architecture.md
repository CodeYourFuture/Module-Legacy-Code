# Purple Forest Application Architecture

This document describes the architecture of the Purple Forest application, including its design patterns, component structure, and data flow.

## Overview

Purple Forest is a social media application built with vanilla JavaScript using ES6 modules. It follows a component-based architecture with a central state management system. The application is designed as a Single Page Application (SPA) with client-side routing on the hash.

## Core Design Patterns

### Single Source of Truth (SSOT)

The application uses a single state object as the source of truth for all application data.

### Unidirectional Data Flow

Data flows in one direction through the application:

1. User actions trigger component handlers
2. Component handlers call API service methods
3. API service updates the central state
4. State changes trigger UI updates through event listeners
5. Views render components based on the current state

This simple flow makes the application behavior predictable and easier to reason about.

### Component-Based Architecture

The UI is composed of reusable components, each responsible for a specific part of the interface. Components are pure functions of state, meaning they render based solely on the data passed to them.

### Centralised Error Handling

The application implements a centralised error handling system that captures errors at the API service level and displays them in a single top level error dialog.

## Directory Structure

```
front-end/
├── components/       # UI components
│   ├── bloom/        # Individual post component
│   ├── bloom-form/   # Form for creating new posts
│   ├── error/        # Error dialog component
│   ├── login/        # Login component
│   ├── logout/       # Logout component
│   ├── profile/      # User profile component
│   ├── signup/       # Signup component
│   └── timeline/     # Timeline component for displaying posts
├── lib/              # Core application modules
│   ├── api.mjs       # API service for backend communication
│   ├── render.mjs    # Rendering utilities
│   ├── router.mjs    # Client-side routing
│   ├── state.mjs     # State management
│   └── views.mjs     # View composition (legacy)
├── views/            # Application views
│   ├── home.mjs      # Home view
│   ├── login.mjs     # Login view
│   ├── profile.mjs   # Profile view
│   └── signup.mjs    # Signup view
├── index.html        # Main HTML file
├── index.mjs         # Application entry point
└── index.css         # Global styles
```

## Core Modules

### State Management (state.mjs)

The state module manages the application's data and provides methods for updating it. Key features:

- **Central State Object**: Stores all application data
- **updateState()**: Updates state properties and notifies listeners
- **destroyState()**: Resets state to initial values
- **Event Dispatching**: Triggers 'state-change' events when state is updated
- **Local Storage**: Persists state to localStorage, and can restore from it on page load

### API Service (api.mjs)

The API service handles all communication with the backend. It updates the state when successful, destroys session state on authentication errors, and passes errors up to the error handler.

### Router (router.mjs)

The router handles client-side navigation and view rendering.

### Error Component (components/error/error.mjs)

The error component provides centralized error management. Key features:

- **Error Dialog**: Displays errors in a consistent UI dialog
- **Component-Based Structure**: Creates error dialogs following the same pattern as other components
- **Event Handlers**: Manages dialog interaction (close buttons, backdrop clicks)
- **Consistent Error Display**: Ensures all errors are displayed in a standardized way

### Render Utilities (render.mjs)

The render module provides two functions:

- **render()**: Renders components into DOM containers
- **destroy()**: Clears containers for view changes

## Component Architecture

Components in Purple Forest follow a consistent pattern:

1. **Creator Function**: A pure function that creates a component based on data

   ```javascript
   function createComponent(template, data) {
     // Clone template
     // Populate with data
     // Return fragment
   }
   ```

2. **Event Handlers**: Functions that handle user interactions, exported to the view
   ```javascript
   function handleEvent(event) {
     // Call API service
     // State changes trigger UI updates
   }
   ```

Components are attached to the DOM using the render utility:

```javascript
render(
  [data], // Data to pass to the component
  getContainer(), // DOM container
  "template-id", // Template ID
  createComponent // Creator function
);
```

## View Composition

Views compose multiple components to create complete screens or types of pages. Each view:

1. Clears previous content using the destroy utility
2. Renders components based on the current state
3. Attaches event handlers to components once they are attached to the DOM

## Error Handling Flow

The application handles errors like this:

1. **Error Origin**: Error occurs (usually in API service)
2. **Error Capture**: API service captures the error
   - For auth errors (401/403), it destroys session state
   - For all errors, it passes the error to the error handler
3. **Error Display**: Error handler displays the error in a page level dialog
4. **Component Recovery**: Components use try/finally to reset UI

This approach ensures errors don't leave the application in an inconsistent state and provides clear feedback to users.

## Data Flow Example: Login Process

1. **User Action**: User submits login form
2. **Component Handler**: `handleLogin()` calls `apiService.login()`
3. **API Service**: Makes API request and updates state on success
   ```javascript
   state.updateState({
     token: data.token,
     currentUser: username,
     isLoggedIn: true,
   });
   ```
4. **State Change**: Triggers 'state-change' event
5. **Event Listener**: In index.mjs, calls `handleRouteChange()`
6. **Router**: Renders the home view based on the updated state
7. **View**: Home view renders profile, timeline, and bloom form components

## State-Driven UI Updates

UI updates are driven by state changes, not direct DOM manipulation:

1. State is updated through the API service
2. State change triggers the 'state-change' event
3. Event listener calls the router
4. Router renders the appropriate view
5. View renders components based on the current state

This approach ensures the UI always reflects the current application state.

## Some design patterns in this architecture

1. **Single Source of Truth**: The state object is the single source of truth for all application data
1. **Component Purity**: UI Components are pure functions of state
1. **Separation of Concerns**:
   - Components handle rendering and user interactions
   - API service handles data operations
   - State manages application data
   - Router handles navigation and view rendering
1. **State-Driven UI Updates**: UI updates are driven by state changes
1. **Event-Driven Updates**: UI updates are driven by state changes
1. **Centralised Error Management**: All errors are handled through a central system
