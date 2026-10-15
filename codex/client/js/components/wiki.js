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

function createWikiEntryCard(card, onOpen) {
  const entry = document.createElement("article");
  entry.className = "wiki-entry-card";
  entry.tabIndex = 0;
  entry.dataset.cardId = card.id;

  const header = document.createElement("header");
  header.className = "wiki-entry-header";

  const avatar = document.createElement("div");
  const iconType = String(card.type || "default").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  avatar.className = `wiki-entry-avatar card-vector-icon card-vector-icon-${iconType}`;
  avatar.style.setProperty("--type-color", typeColors[card.type] ?? "#7dcad6");

  if (card.image) {
    avatar.style.backgroundImage = `url("${card.image}")`;
    avatar.classList.add("has-image");
    avatar.classList.remove("card-vector-icon");
  } else if (card.type === "Character") {
    avatar.style.backgroundImage = `url("assets/images/characters/character-1.jpg")`;
    avatar.classList.add("has-image");
    avatar.classList.remove("card-vector-icon");
  }

  const headerInfo = document.createElement("div");
  headerInfo.className = "wiki-entry-info";

  const tag = document.createElement("span");
  tag.className = "wiki-entry-tag";
  tag.textContent = card.type;
  tag.style.setProperty("--tag-color", typeColors[card.type] ?? "#7dcad6");

  const title = document.createElement("h3");
  title.textContent = card.name;

  headerInfo.append(tag, title);

  if (card.alias) {
    const alias = document.createElement("p");
    alias.className = "wiki-entry-alias";
    alias.textContent = card.alias;
    headerInfo.append(alias);
  }

  header.append(avatar, headerInfo);

  const excerpt = document.createElement("p");
  excerpt.className = "wiki-entry-excerpt";
  excerpt.textContent = card.text
    ? card.text.slice(0, 120).trim() + (card.text.length > 120 ? "…" : "")
    : card.description.slice(0, 120).trim() + (card.description.length > 120 ? "…" : "");

  const footer = document.createElement("div");
  footer.className = "wiki-entry-footer";

  const icon = document.createElement("span");
  icon.className = `wiki-entry-icon card-vector-icon card-vector-icon-${iconType}`;
  icon.style.setProperty("--type-color", typeColors[card.type] ?? "#7dcad6");

  const details = document.createElement("div");
  details.className = "wiki-entry-details";

  const count = document.createElement("small");
  count.textContent = `${card.relationships.length} relations · ${card.properties.length} properties`;

  details.append(count);
  footer.append(icon, details);

  entry.append(header, excerpt, footer);

  entry.addEventListener("click", () => onOpen(card.id));
  entry.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(card.id);
    }
  });

  return entry;
}

export function renderWikiEntries(container, cards, onOpen) {
  container.replaceChildren();

  if (!cards.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  cards.forEach((card) => {
    fragment.append(createWikiEntryCard(card, onOpen));
  });

  container.append(fragment);
}
