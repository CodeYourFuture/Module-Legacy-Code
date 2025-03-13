import {state} from "./state.mjs";
import {render} from "./render.mjs";
import {
  getCardContainer,
  getCountContainer,
  getSelectEpisode,
  getSelectShow,
} from "./app.mjs";
import {createCard} from "./card.mjs";
import {createOption} from "./select.mjs";

function createCount(template) {
  const count = document.getElementById(template).content.cloneNode(true);
  count.textContent = "";

  count.textContent = `Displaying ${state.nowShowing.length}`;

  return count;
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();

  const filtered = state.nowShowing.filter((item) =>
    item.name.toLowerCase().includes(searchTerm)
  );
  state.updateState("nowShowing", filtered);

  render(filtered, getCardContainer(), "card-template", createCard);
  render([1], getCountContainer(), "results-template", createCount);
  render(
    [{name: "Choose a show"}, ...state.nowShowing],
    getSelectShow(),
    "option-template",
    createOption
  );
}

export {createCount, handleSearch};
