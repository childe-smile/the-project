// Pointer and keyboard positioning for a persistent floating player.
export function initializeFloatingPanel(panel, { handle, minimizeButton, restoreButton, storageKey }) {
  let position = null;
  let drag = null;
  let minimized = false;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) position = { x: saved.x, y: saved.y };
    minimized = saved?.minimized === true;
  } catch { /* Keep the default position when saved settings are unavailable. */ }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ ...position, minimized })); } catch { /* Session settings still work. */ }
  }

  function place(x, y) {
    if (panel.hidden) return;
    const rect = panel.getBoundingClientRect();
    position = {
      x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))
    };
    panel.style.left = `${position.x}px`;
    panel.style.top = `${position.y}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.dispatchEvent(new Event("floating-panel:move"));
  }

  function reflow() {
    if (panel.hidden) return;
    const rect = panel.getBoundingClientRect();
    place(position?.x ?? rect.left, position?.y ?? rect.top);
  }

  function toggleMinimized() {
    minimized = !minimized;
    panel.classList.toggle("is-minimized", minimized);
    minimizeButton.setAttribute("aria-expanded", String(!minimized));
    const label = minimized ? "Expand music player" : "Minimize music player";
    minimizeButton.setAttribute("aria-label", label);
    minimizeButton.title = label;
    restoreButton?.setAttribute("aria-expanded", String(!minimized));
    panel.dispatchEvent(new Event("floating-panel:resize"));
    reflow();
    save();
  }

  panel.classList.toggle("is-minimized", minimized);
  minimizeButton.setAttribute("aria-expanded", String(!minimized));
  minimizeButton.setAttribute("aria-label", minimized ? "Expand music player" : "Minimize music player");
  minimizeButton.title = minimizeButton.getAttribute("aria-label");
  minimizeButton.addEventListener("click", toggleMinimized);
  restoreButton?.setAttribute("aria-expanded", String(!minimized));
  restoreButton?.addEventListener("click", () => { if (minimized) toggleMinimized(); });

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const rect = panel.getBoundingClientRect();
    drag = { pointerId: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
    handle.setPointerCapture(event.pointerId);
    panel.classList.add("is-dragging");
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (drag?.pointerId === event.pointerId) place(event.clientX - drag.x, event.clientY - drag.y);
  });
  function endDrag(event) {
    if (drag?.pointerId !== event.pointerId) return;
    drag = null;
    panel.classList.remove("is-dragging");
    if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    save();
  }
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  handle.addEventListener("lostpointercapture", endDrag);
  handle.addEventListener("keydown", (event) => {
    const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!steps[event.key]) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    const step = event.shiftKey ? 40 : 12;
    place(rect.left + steps[event.key][0] * step, rect.top + steps[event.key][1] * step);
    save();
  });
  window.addEventListener("resize", reflow);
  new ResizeObserver(reflow).observe(panel);
  return { reflow, get minimized() { return minimized; } };
}
