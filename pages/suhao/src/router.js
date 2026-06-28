import { openChromeTab, restoreTabSnapshot, snapshotCurrentTab, state } from "./store.js";

const routes = [];
let fallback = null;

export function defineRoutes(routeList, fallbackRoute) {
  routes.splice(0, routes.length, ...routeList);
  fallback = fallbackRoute;
}

function matchPath(pathname) {
  for (const route of routes) {
    if (route.path === pathname) return { route, params: {} };
    const routeParts = route.path.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;
    const params = {};
    const matched = routeParts.every((part, index) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = pathParts[index];
        return true;
      }
      return part === pathParts[index];
    });
    if (matched) return { route, params };
  }
  return { route: fallback, params: {} };
}

export function getCurrentRoute() {
  const pathname = window.location.pathname === "/" ? "/dashboard" : window.location.pathname;
  return matchPath(pathname);
}

export function resolveRoute(path) {
  const url = new URL(path, window.location.origin);
  return matchPath(url.pathname);
}

function syncChromeTab(path) {
  const url = new URL(path, window.location.origin);
  const { route } = matchPath(url.pathname);
  if (route && !route.public) {
    openChromeTab({ path, title: route.title, pageId: route.pageId, public: route.public });
  }
}

export function navigate(path) {
  snapshotCurrentTab(window.location.pathname + window.location.search);
  state.ui.drawer = null;
  state.ui.modal = null;
  state.ui.loading = false;
  syncChromeTab(path);
  restoreTabSnapshot(path);
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("app:navigate"));
}

export function replace(path) {
  snapshotCurrentTab(window.location.pathname + window.location.search);
  state.ui.drawer = null;
  state.ui.modal = null;
  state.ui.loading = false;
  syncChromeTab(path);
  restoreTabSnapshot(path);
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new Event("app:navigate"));
}

export function queryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function withQuery(path, query) {
  const params = new URLSearchParams(query);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}
