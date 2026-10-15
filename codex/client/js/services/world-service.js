import {
  loadFromStorage,
  saveToStorage
} from "./storage.js";

import { defaultWorlds } from "../data/default-worlds.js";

const WORLDS_KEY = "worlds";
const ACTIVE_WORLD_KEY = "active-world";
const defaultWorld = defaultWorlds[0];

let worlds = loadFromStorage(WORLDS_KEY, [defaultWorld]);
let activeWorldId = loadFromStorage(
  ACTIVE_WORLD_KEY,
  worlds[0]?.id ?? defaultWorld.id
);

function persist() {
  saveToStorage(WORLDS_KEY, worlds);
  saveToStorage(ACTIVE_WORLD_KEY, activeWorldId);
}

export function getWorlds() {
  return structuredClone(worlds);
}

export function getActiveWorld() {
  return structuredClone(
    worlds.find((world) => world.id === activeWorldId) ?? worlds[0]
  );
}

export function createWorld(name) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("World name is required.");
  }

  const world = {
    id: crypto.randomUUID(),
    name: normalizedName,
    description: "A new world waiting for its first story."
  };
  worlds.unshift(world);
  activeWorldId = world.id;
  persist();

  return structuredClone(world);
}

export function setActiveWorld(worldId) {
  if (!worlds.some((world) => world.id === worldId)) return false;

  activeWorldId = worldId;
  persist();
  return true;
}
