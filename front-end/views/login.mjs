import {renderOne, destroy} from "../lib/render.mjs";
import {state, getLoginContainer} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login.mjs";

// Initial load - not logged in
function loginView() {
  destroy();
  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin
  );
  const form = getLoginContainer().querySelector("[data-form='login']");
 form?.addEventListener("submit", (event) => { 
  event.preventDefault();
   handleLogin(event);
 })
}

export {loginView};
