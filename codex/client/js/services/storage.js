const STORAGE_PREFIX = "codex:";

export function loadFromStorage(key, fallbackValue) {
  try {
    const serializedValue = localStorage.getItem(
      `${STORAGE_PREFIX}${key}`
    );

    if (!serializedValue) {
      return structuredClone(fallbackValue);
    }

    return JSON.parse(serializedValue);
  } catch (error) {
    console.error(`Could not load "${key}" from storage.`, error);
    return structuredClone(fallbackValue);
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(`Could not save "${key}" to storage.`, error);
  }
}

export function removeFromStorage(key) {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}