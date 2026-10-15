import { seedTimeline } from "../data/seed.js";
import { loadFromStorage, saveToStorage } from "./storage.js";
import { createTimelineEvent } from "../models/timeline-event.js";

const STORAGE_KEY = "timelines";
let timelines = loadFromStorage(STORAGE_KEY, { valduna: seedTimeline });

function persist() {
  saveToStorage(STORAGE_KEY, timelines);
}

export function getTimeline(worldId) {
  return structuredClone(timelines[worldId] || []);
}

export function addTimelineEvent(worldId, values = {}) {
  const event = createTimelineEvent(values);
  timelines[worldId] = [...(timelines[worldId] || []), event];
  persist();
  return structuredClone(event);
}

export function updateTimelineEvent(worldId, eventId, changes) {
  timelines[worldId] = (timelines[worldId] || []).map((event) =>
    event.id === eventId
      ? { ...event, ...changes, updatedAt: new Date().toISOString() }
      : event
  );
  persist();
}

export function deleteTimelineEvent(worldId, eventId) {
  timelines[worldId] = (timelines[worldId] || []).filter((event) => event.id !== eventId);
  persist();
}
