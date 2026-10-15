export function initializeSearch({
  input,
  onSearch,
  delay = 200
}) {
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError(
      "initializeSearch requires a valid input element."
    );
  }

  let timeoutId = null;

  input.addEventListener("input", () => {
    window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      onSearch(input.value.trim());
    }, delay);
  });

  document.addEventListener("keydown", (event) => {
    const usesSearchShortcut =
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k";

    if (!usesSearchShortcut) {
      return;
    }

    event.preventDefault();
    input.focus();
    input.select();
  });

  return {
    clear() {
      input.value = "";
      onSearch("");
    },

    focus() {
      input.focus();
    },

    getValue() {
      return input.value.trim();
    }
  };
}