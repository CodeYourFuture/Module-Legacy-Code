import {renderOne, destroy} from "../lib/render.mjs";
import {state, getLoginContainer} from "../index.mjs";
import {createLogin} from "../components/login.mjs";

// Initial load - not logged in
function loginView() {
  destroy();
  renderOne(
    state.isLoggedIn,
    getLoginContainer(),
    "login-template",
    createLogin
  );
}

export {loginView};
