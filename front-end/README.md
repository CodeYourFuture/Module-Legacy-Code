# Purple Forest front end

Vanilla JS es6 modules. Vanilla CSS. Playwright tests.

## Running the Application

1. Clone the repository
2. Open `index.html` in your browser - make sure the backend is running
3. Login with the demo account 'sample' password 'sosecret'

This front end doesn't have a build step. It's just a collection of js modules that interact with the backend api. The entry point is `index.mjs` and this is SPA style.

## Application Structure

- index.mjs - entry point for the application
- index.css - global styles
- index.html - sole HTML file

#### /lib

- api - api.mjs - functions for making API calls
- state - state.mjs - manages application state
- router - router.mjs - handles routing to different views
- views - views.mjs - renders collections of components into views and attached handlers

#### /components

- login - login.mjs - login form
- signup - signup.mjs - sign up form
- profile - profile.mjs - shows user profile information for the selected user
- bloom - bloom.mjs - creates a bloom component for the timeline
- timeline - timeline.mjs - displays a list of blooms for the selected user or an aggregated list of blooms from all followed users
- bloom form - bloom-form.mjs - form for creating new blooms

## Central State

The application state is managed in a single object. It is updated by the API calls. The main.mjs file is the entry point for the application. It sets up the initial state and listens for state changes. On state-change, it calls the router, which renders the view derived from the state.

State is passed down to the components as props. Components can dispatch events to update the state. The state is updated in a single place and passed down to the components. The components always mirror the state and never update the state directly or hold internal state.

This makes it easy to reason about the state of the application.

### User Actions → Component Events

1. User clicks "Login" → handleLogin calls apiService.login()

### API Calls → State Changes

1. apiService.login() → api.mjs makes API call to /auth/login
1. api.mjs receives response → api.mjs dispatches "auth-change" event
1. api.mjs updates application state with auth data
1. state dispatches "state-change" event

### State Changes → Component Updates

1. "auth-change" event → index.mjs updates application state
1. State update triggers "state-change" event
1. Components listen for "state-change" and update their display

### Declarative UI Updates

1. Components listen for "state-change" event
1. Components re-render based on new state
1. All UI updates are declarative, driven by state
