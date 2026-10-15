let container = null;

export function showToast(message, type = "success", duration = 2800) {
  if (!message) return null;
  if (!container?.isConnected) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "false");
    document.body.append(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  container.append(toast);

  const dismiss = () => {
    toast.remove();
    if (!container?.children.length) {
      container?.remove();
      container = null;
    }
  };
  toast.addEventListener("click", dismiss, { once: true });
  window.setTimeout(dismiss, duration);
  return toast;
}

export const notify = {
  success: (message) => showToast(message, "success"),
  error: (message) => showToast(message, "error"),
  info: (message) => showToast(message, "info")
};
