export function createRouter({ onChange } = {}) {
  const routes = new Map();
  let activeRoute = null;

  function register(name, view, navigationItem = null) {
    routes.set(name, { view, navigationItem });
    return api;
  }

  function navigate(name, { replace = false } = {}) {
    const route = routes.get(name);
    if (!route) return false;
    routes.forEach((candidate, routeName) => {
      candidate.view?.classList.toggle("active", routeName === name);
      candidate.navigationItem?.classList.toggle("active", routeName === name);
    });
    activeRoute = name;
    const hash = `#${name}`;
    if (location.hash !== hash) history[replace ? "replaceState" : "pushState"]({}, "", hash);
    onChange?.(name);
    return true;
  }

  function start(fallback = "cards") {
    const requested = location.hash.slice(1);
    navigate(routes.has(requested) ? requested : fallback, { replace: true });
    window.addEventListener("popstate", () => navigate(location.hash.slice(1) || fallback, { replace: true }));
  }

  const api = { register, navigate, start, get activeRoute() { return activeRoute; } };
  return api;
}
