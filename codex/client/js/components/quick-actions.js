const editableSelector = [
  ".card[data-card-id]",
  ".wiki-entry-card[data-card-id]",
  ".graph-node[data-card-id]",
  ".tree-node[data-card-id]",
  ".map-marker[data-card-id]",
  ".timeline-event:not(.timeline-event-preview)",
  ".canvas-note[data-note-id]"
].join(",");

let menu = null;
let activeTarget = null;
let isInvokingAction = false;

export function initializeQuickActions() {
  if (document.body.dataset.quickActionsReady) return;
  document.body.dataset.quickActionsReady = "true";

  menu = document.createElement("div");
  menu.className = "quick-action-menu";
  menu.hidden = true;
  menu.setAttribute("role", "menu");
  document.body.append(menu);

  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".quick-action-menu")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", closeMenu);
  document.querySelector(".main")?.addEventListener("scroll", closeMenu, true);
}

function handleContextMenu(event) {
  if (isInvokingAction) return;
  if (event.target.closest(".quick-action-menu")) return;

  const target = event.target.closest(editableSelector);
  if (!target) {
    closeMenu();
    return;
  }

  if (target.classList.contains("map-marker") && target.dataset.cardId === "placeholder") return;
  event.preventDefault();
  activeTarget = target;
  openMenu(event.clientX, event.clientY);
}

function openMenu(x, y) {
  if (!activeTarget || !menu) return;
  menu.replaceChildren();

  const heading = document.createElement("span");
  heading.className = "quick-action-label";
  heading.textContent = "Quick actions";
  menu.append(heading);

  addAction("Edit", "edit", editTarget);
  addAction("Delete", "delete", deleteTarget, true);

  menu.hidden = false;
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x + 10, window.innerWidth - rect.width - 12)}px`;
  menu.style.top = `${Math.min(y + 10, window.innerHeight - rect.height - 12)}px`;
}

function addAction(label, kind, handler, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `quick-action quick-action-${kind}${danger ? " danger" : ""}`;
  button.setAttribute("role", "menuitem");
  button.textContent = label;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    isInvokingAction = true;
    try {
      handler();
      closeMenu();
    } finally {
      isInvokingAction = false;
    }
  });
  menu.append(button);
}

function editTarget() {
  if (!activeTarget) return;
  if (activeTarget.matches(".timeline-event")) {
    activeTarget.querySelector(".timeline-event-actions button:not(.timeline-delete)")?.click();
  } else if (activeTarget.matches(".canvas-note")) {
    activeTarget.dispatchEvent(new CustomEvent("codex:quick-edit"));
  } else {
    document.querySelector("#edit-card-button")?.click();
  }
}

function deleteTarget() {
  if (!activeTarget) return;
  if (activeTarget.matches(".timeline-event")) {
    activeTarget.querySelector(".timeline-delete")?.click();
  } else if (activeTarget.matches(".canvas-note")) {
    activeTarget.dispatchEvent(new CustomEvent("codex:quick-delete"));
  } else {
    document.querySelector("#delete-card-button")?.click();
  }
}

function closeMenu() {
  if (menu) menu.hidden = true;
  activeTarget = null;
}
