# Purple Forest front end

Native web components. Vanilla JS. Vanilla CSS. Playwright tests.

## Running the Application

1. Clone the repository
2. Open `index.html` in your browser - make sure the backend is running
3. Login with the demo account 'sample' password 'sosecret'

This front end doesn't have a build step. It's just a collection of web components.

## Event driven architecture

Here's how events flow in this application:

### User Actions → Component Events

1. User clicks "Login" → LoginComponent handles form submission
1. Component calls apiService.login()
1. On success, component dispatches "auth-change" event

### State Changes → Component Updates

1. "auth-change" event → index.mjs updates application state
1. State update triggers "state-change" event
1. Components listen for "state-change" and update their display

### Component Communication

1. Components dispatch custom events (e.g., "show-view") for view changes that aren't related to auth
1. Other components listen for these events and respond accordingly
