export function initializeNavigation({
  onViewChange
} = {}) {
  const app = document.querySelector(".app");
  const sidebarToggle = document.querySelector("#sidebar-toggle");
  const navigationItems = document.querySelectorAll(
    ".nav-item[data-view]"
  );

  const views = document.querySelectorAll(".view");

  function setSidebarHidden(isHidden) {
    app?.classList.toggle("sidebar-hidden", isHidden);
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", String(!isHidden));
      sidebarToggle.setAttribute("aria-label", isHidden ? "Show navigation menu" : "Hide navigation menu");
      sidebarToggle.title = isHidden ? "Show navigation menu" : "Hide navigation menu";
    }

    try {
      localStorage.setItem("codex-sidebar-hidden", String(isHidden));
    } catch {
      // The menu remains functional when browser storage is unavailable.
    }
  }

  let sidebarWasHidden = false;
  try {
    sidebarWasHidden = localStorage.getItem("codex-sidebar-hidden") === "true";
  } catch {
    sidebarWasHidden = false;
  }
  setSidebarHidden(sidebarWasHidden);

  sidebarToggle?.addEventListener("click", () => {
    setSidebarHidden(!app?.classList.contains("sidebar-hidden"));
  });

  navigationItems.forEach((item) => {
    item.addEventListener("click", () => {
      const viewName = item.dataset.view;

      navigationItems.forEach((navigationItem) => {
        navigationItem.classList.toggle(
          "active",
          navigationItem === item
        );
      });

      views.forEach((view) => {
        view.classList.toggle(
          "active",
          view.id === `view-${viewName}`
        );
      });

      onViewChange?.(viewName);
      window.dispatchEvent(new CustomEvent("codex:view-change", { detail: { view: viewName } }));
    });
  });
}
