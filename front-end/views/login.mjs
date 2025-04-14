import {render, destroy} from "../lib/render.mjs";
import {state, getLoginContainer} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login.mjs";

// Initial load - not logged in
function loginView() {
  destroy();
  render(
    [state.isLoggedIn],
    getLoginContainer(),
    "login-template",
    createLogin
  );
  const form = document.querySelector("[data-form='login']");
  form?.addEventListener("submit", handleLogin);
}

export {loginView};
