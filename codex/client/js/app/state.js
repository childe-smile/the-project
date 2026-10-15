const defaults = Object.freeze({
  query: "",
  activeType: "All",
  activeView: "world",
  selectedTreeRootId: null,
  sortBy: "updated"
});

export function createAppState(overrides = {}) {
  return { ...defaults, ...overrides };
}

export function resetAppState(state) {
  Object.assign(state, defaults);
  return state;
}

export function updateAppState(state, changes = {}) {
  Object.assign(state, changes);
  return state;
}

export function getDefaultAppState() {
  return { ...defaults };
}
