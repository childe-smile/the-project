const typeColors = {
  Character: "#b9a16e",
  Event: "#7899b7",
  City: "#5f9698",
  Location: "#7f9faf",
  Kingdom: "#86505a",
  Faction: "#8a6d8f",
  Item: "#ad9369",
  Creature: "#60785b",
  Magic: "#8292b2",
  Religion: "#9b8db1",
  Legend: "#6f91aa",
  "Magic System": "#7186b5",
  Organization: "#9a7656"
};

function createCardElement(card, onOpen, mentions = {}) {
  const element = document.createElement("article");

  element.className = "card";
  element.tabIndex = 0;
  element.dataset.cardId = card.id;
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", `Open ${card.name}`);

  if (card.type === "Character") {
    element.classList.add("card-character");
  }

  const cardHeader = document.createElement("header");
  cardHeader.className = "card-header";

  const visual = document.createElement("div");
  const iconType = String(card.type || "default").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  element.classList.add(`card-${iconType}`);
  visual.className = `card-visual card-vector-icon card-vector-icon-${iconType}`;
  visual.setAttribute("aria-hidden", "true");
  visual.style.setProperty("--type-color", typeColors[card.type] ?? "var(--teal)");

  if (card.image) {
    visual.style.backgroundImage = `url("${card.image}")`;
    visual.classList.add("has-image");
    visual.classList.remove("card-vector-icon");
    visual.textContent = "";
  } else if (card.type === "Character") {
    visual.style.backgroundImage = `url("assets/images/characters/character-1.jpg")`;
    visual.classList.add("has-image");
    visual.classList.remove("card-vector-icon");
    visual.textContent = "";
  }

  const headerContent = document.createElement("div");
  headerContent.className = "card-header-content";

  const type = document.createElement("div");
  type.className = "card-type";
  type.style.setProperty(
    "--type-color",
    typeColors[card.type] ?? "var(--teal)"
  );
  type.textContent = card.type;

  const name = document.createElement("h2");
  name.className = "card-name serif";
  name.textContent = card.name;

  headerContent.append(type, name);

  if (card.alias) {
    const alias = document.createElement("div");
    alias.className = "card-alias";
    alias.textContent = card.alias;
    headerContent.append(alias);
  }

  const description = document.createElement("p");
  description.className = "card-desc";
  description.textContent = card.description;
  headerContent.append(description);
  cardHeader.append(visual, headerContent);

  const footer = document.createElement("footer");
  footer.className = "card-foot";

  const statistics = [
    ["properties", card.properties?.length || 0, "Properties"],
    ["wiki", mentions.wiki || 0, "Mentions on Wiki"],
    ["relations", card.relationships?.length || 0, "Relations"],
    ["quill", mentions.quill || 0, "Mentions on Quill"]
  ];
  statistics.forEach(([kind, count, label]) => {
    if (count === 1) label = { properties: "Property", wiki: "Mention on Wiki", relations: "Relation", quill: "Mention on Quill" }[kind];
    const statistic = document.createElement("span");
    statistic.dataset.stat = kind;
    const value = document.createElement("strong");
    value.textContent = String(count);
    statistic.append(value, ` ${label}`);
    footer.append(statistic);
  });
  element.append(cardHeader, footer);

  element.addEventListener("click", () => onOpen(card.id));

  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(card.id);
    }
  });

  return element;
}

export function renderCards(container, cards, onOpen, mentions = new Map()) {
  container.replaceChildren();

  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    fragment.append(createCardElement(card, onOpen, mentions.get(card.id)));
  });

  container.append(fragment);
}

export function renderFilters(
  container,
  cards,
  activeType,
  onFilterChange
) {
  const types = [
    "All",
    ...new Set(cards.map((card) => card.type))
  ];

  container.replaceChildren();

  const fragment = document.createDocumentFragment();

  types.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.type = type;

    if (type === activeType) {
      button.classList.add("active");
    }

    const count =
      type === "All"
        ? cards.length
        : cards.filter((card) => card.type === type).length;

    button.textContent = type;
    button.setAttribute("aria-pressed", String(type === activeType));
    button.setAttribute("aria-label", `${type}: ${count} cards`);
    button.addEventListener("click", () => onFilterChange(type));

    fragment.append(button);
  });

  container.append(fragment);
}
