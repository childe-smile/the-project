// World model helpers
export function createWorldModel({
  id = crypto?.randomUUID?.() ?? String(Date.now()),
  name = "New world",
  slug = "",
  description = "",
  meta = {},
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString()
} = {}) {
  if (!slug && name) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  return { id, name, slug, description, meta, createdAt, updatedAt };
}

export function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
