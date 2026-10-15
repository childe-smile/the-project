const worldList = document.querySelector("#world-list");
const newWorldButton = document.querySelector("#new-world-button");
const backdrop = document.querySelector("#world-modal-backdrop");
const form = document.querySelector("#world-form");
const input = document.querySelector("#world-input");

let createHandler = null;
let selectHandler = null;

function closeModal() {
  backdrop.hidden = true;
  form.reset();
  newWorldButton.focus();
}

export function renderWorlds(worlds, activeWorld) {
  worldList.replaceChildren();

  const orderedWorlds = [...worlds].sort((a, b) =>
    Number(b.id === activeWorld.id) - Number(a.id === activeWorld.id)
  );

  orderedWorlds.forEach((world) => {
    const button = document.createElement("button");
    button.className = "world-option";
    button.type = "button";
    button.textContent = world.name;
    button.title = world.name;
    if (world.id === activeWorld.id) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      selectHandler?.(world.id);
    });
    worldList.append(button);
  });
}

export function initializeWorldControls({ onCreate, onSelect }) {
  createHandler = onCreate;
  selectHandler = onSelect;

  newWorldButton.addEventListener("click", () => {
    backdrop.hidden = false;
    input.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    createHandler?.(name);
    closeModal();
  });

  document.querySelector("#world-modal-close").addEventListener("click", closeModal);
  document.querySelector("#cancel-world-button").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!backdrop.hidden) closeModal();
  });
}
