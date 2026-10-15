const enhanced = new WeakSet();

export function initializeCustomSelects(root = document) {
  root.querySelectorAll(".cards-sort, .tree-root-select, .form-field select, .pin-customizer select, .map-pin-creator select")
    .forEach(enhanceSelect);
}

function enhanceSelect(select) {
  if (enhanced.has(select)) return;
  enhanced.add(select);

  const shell = document.createElement("div");
  shell.className = "custom-select";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "custom-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "custom-select-menu";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;
  shell.append(trigger, menu);
  select.insertAdjacentElement("afterend", shell);
  select.classList.add("custom-select-native");

  function rebuild() {
    menu.replaceChildren();
    Array.from(select.children).forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const label = document.createElement("span");
        label.className = "custom-select-group";
        label.textContent = child.label;
        menu.append(label);
        Array.from(child.children).forEach((option) => addOption(option));
      } else {
        addOption(child);
      }
    });
    sync();
  }

  function addOption(option) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "custom-select-option";
    item.setAttribute("role", "option");
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.disabled = option.disabled;
    item.addEventListener("click", () => {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      close();
      sync();
    });
    menu.append(item);
  }

  function sync() {
    const selected = select.options[select.selectedIndex];
    trigger.textContent = selected?.textContent || "Choose an option";
    trigger.disabled = select.disabled;
    menu.querySelectorAll(".custom-select-option").forEach((item) => {
      const active = item.dataset.value === select.value;
      item.classList.toggle("selected", active);
      item.setAttribute("aria-selected", String(active));
    });
  }

  function close() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    shell.classList.remove("open");
  }

  trigger.addEventListener("click", () => {
    const willOpen = menu.hidden;
    document.querySelectorAll(".custom-select.open .custom-select-trigger").forEach((button) => {
      if (button !== trigger) button.click();
    });
    menu.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", String(willOpen));
    shell.classList.toggle("open", willOpen);
  });
  select.addEventListener("change", sync);
  new MutationObserver(rebuild).observe(select, { childList: true, subtree: true, attributes: true });
  document.addEventListener("click", (event) => {
    if (!shell.contains(event.target)) close();
  });
  rebuild();
}
