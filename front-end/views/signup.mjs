import {renderOne, destroy} from "../lib/render.mjs";
import {state, getSignupContainer} from "../index.mjs";
import {createSignup, handleSignup} from "../components/signup.mjs";

// Signup view, only signup when not logged in
function signupView() {
  if (state.isLoggedIn) return;
  destroy();
  renderOne(null, getSignupContainer(), "signup-template", createSignup);
  const form = document.querySelector("[data-form='signup']");
  form?.addEventListener("submit", handleSignup);
}

export {signupView};
