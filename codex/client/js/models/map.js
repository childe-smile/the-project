// Map model and utilities
export function createMapModel({
  id = crypto?.randomUUID?.() ?? String(Date.now()),
  name = "World map",
  width = 1000,
  height = 700,
  markers = [],
  layers = [],
  meta = {},
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString()
} = {}) {
  return { id, name, width, height, markers, layers, meta, createdAt, updatedAt };
}

export function findMarker(map, markerId) {
  return (map?.markers || []).find((m) => m.id === markerId) ?? null;
}
