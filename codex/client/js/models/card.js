// Card model factory and small helpers
export function createCardModel({
  id = crypto?.randomUUID?.() ?? String(Date.now()),
  type = "Untitled",
  name = "Untitled",
  alias = "",
  description = "",
  properties = [],
  relationships = [],
  text = "",
  image = "",
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString()
} = {}) {
  return {
    id,
    type,
    name,
    alias,
    description,
    properties,
    relationships,
    text,
    image,
    createdAt,
    updatedAt
  };
}

export function cardSummary(card, max = 120) {
  if (!card) return "";
  const source = card.description || card.text || "";
  if (source.length <= max) return source;
  return `${source.slice(0, max - 1).trim()}…`;
}
