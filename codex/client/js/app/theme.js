const STORAGE_KEY = "codex-theme";
const allowedThemes = new Set(["ocean", "dark", "light", "sepia", "parchment"]);

export function setTheme(theme = "ocean") {
  const selected = allowedThemes.has(theme) ? theme : "ocean";
  if (selected === "ocean") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = selected;
  try { localStorage.setItem(STORAGE_KEY, selected); } catch { /* session only */ }
  window.dispatchEvent(new CustomEvent("codex:theme-change", { detail: { theme: selected } }));
  return selected;
}

export function getTheme() {
  try { return localStorage.getItem(STORAGE_KEY) || "ocean"; }
  catch { return "ocean"; }
}

export function initializeTheme() {
  return setTheme(getTheme());
}

export function initializeThemeToggle() {
  const toggle = document.querySelector("#theme-toggle");
  if (!toggle) return;

  const syncToggle = (theme) => {
    const isLight = theme === "light";
    const nextMode = isLight ? "dark" : "light";
    toggle.dataset.mode = isLight ? "light" : "dark";
    toggle.setAttribute("aria-label", `Switch to ${nextMode} mode`);
    toggle.title = `Switch to ${nextMode} mode`;
    const label = toggle.querySelector(".theme-toggle-label");
    if (label) label.textContent = isLight ? "Dark Mode" : "Light Mode";
  };

  syncToggle(getTheme());
  toggle.addEventListener("click", () => {
    const nextTheme = getTheme() === "light" ? "dark" : "light";
    syncToggle(setTheme(nextTheme));
  });

  window.addEventListener("codex:theme-change", (event) => {
    syncToggle(event.detail.theme);
  });
}
