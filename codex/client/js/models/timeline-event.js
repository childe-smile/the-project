// Timeline event model helpers
export function createTimelineEvent({
  id = crypto?.randomUUID?.() ?? String(Date.now()),
  title = "Event",
  date = "",
  era = "",
  description = "",
  meta = {},
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString()
} = {}) {
  return { id, title, date, era, description, meta, createdAt, updatedAt };
}

export function formatEventDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString();
  } catch (e) {
    return String(dateString);
  }
}
