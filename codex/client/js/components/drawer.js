let selectedCardId = null;
let onRelationshipClick = null;

const overlay = document.querySelector("#overlay");
const drawer = document.querySelector("#drawer");

const drawerAvatar = document.querySelector("#drawer-avatar");
const drawerType = document.querySelector("#drawer-type");
const drawerName = document.querySelector("#drawer-name");
const drawerAlias = document.querySelector("#drawer-alias");

const propertiesPane = document.querySelector("#pane-props");
const relationshipsPane = document.querySelector("#pane-rels");
const textPane = document.querySelector("#pane-text");

export function getSelectedCardId() {
  return selectedCardId;
}

export function setRelationshipClickHandler(handler) {
  onRelationshipClick = handler;
}

export function openDrawer(card) {
  selectedCardId = card.id;
  const iconType = String(card.type || "default").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  drawerAvatar.className = "drawer-avatar";

  if (card.image) {
    drawerAvatar.style.backgroundImage = `url("${card.image}")`;
    drawerAvatar.classList.add("has-image");
    drawerAvatar.textContent = "";
  } else if (card.type === "Character") {
    drawerAvatar.style.backgroundImage = `url("assets/images/characters/character-1.jpg")`;
    drawerAvatar.classList.add("has-image");
    drawerAvatar.textContent = "";
  } else {
    drawerAvatar.style.backgroundImage = "none";
    drawerAvatar.classList.add("card-vector-icon", `card-vector-icon-${iconType}`);
    drawerAvatar.textContent = "";
  }

  drawerType.textContent = card.type;
  drawerName.textContent = card.name;
  drawerAlias.textContent = card.alias ?? "";

  renderProperties(card.properties);
  renderRelationships(card.relationships);

  textPane.replaceChildren();

  const text = document.createElement("p");
  text.className = "drawer-text";
  text.textContent = card.text || "No extended text has been added yet.";

  textPane.append(text);

  overlay.classList.add("show");
  drawer.classList.add("show");
  drawer.setAttribute("aria-hidden", "false");
}

export function closeDrawer() {
  selectedCardId = null;

  overlay.classList.remove("show");
  drawer.classList.remove("show");
  drawer.setAttribute("aria-hidden", "true");
}

function renderProperties(properties) {
  propertiesPane.replaceChildren();

  if (!properties.length) {
    const empty = document.createElement("p");
    empty.className = "drawer-empty";
    empty.textContent = "No properties yet. Edit this card to add stats and details.";
    propertiesPane.append(empty);
    return;
  }

  properties.forEach((property) => {
    const row = document.createElement("div");
    row.className = "prop-row";

    const label = document.createElement("span");
    label.className = "prop-label";
    label.textContent = property.name.toUpperCase();

    const value = document.createElement("span");
    value.className = "prop-val";
    value.textContent = property.value;

    row.append(label, value);
    propertiesPane.append(row);
  });
}

function renderRelationships(relationships) {
  relationshipsPane.replaceChildren();

  if (!relationships.length) {
    const empty = document.createElement("p");
    empty.className = "drawer-empty";
    empty.textContent = "No relationships yet. Link this card to others by name when editing.";
    relationshipsPane.append(empty);
    return;
  }

  relationships.forEach((relationship) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "rel-item rel-item-link";

    const target = document.createElement("span");
    target.textContent = relationship.target;

    const kind = document.createElement("span");
    kind.className = "rel-kind";
    kind.textContent = relationship.kind;

    row.append(target, kind);
    row.addEventListener("click", () => {
      onRelationshipClick?.(relationship.target);
    });

    relationshipsPane.append(row);
  });
}

document
  .querySelector("#drawer-close")
  .addEventListener("click", closeDrawer);

overlay.addEventListener("click", closeDrawer);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => {
      item.classList.remove("active");
    });

    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.remove("active");
    });

    tab.classList.add("active");

    document
      .querySelector(`#pane-${tab.dataset.tab}`)
      ?.classList.add("active");
  });
});
