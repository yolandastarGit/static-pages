import { openChromeTab, restoreTabSnapshot, snapshotCurrentTab, state } from "./store.js";

const routes = [];
let fallback = null;

export function defineRoutes(routeList, fallbackRoute) {
  routes.splice(0, routes.length, ...routeList);
  fallback = fallbackRoute;
}

let cachedBase = null;

export function getBasePath() {
  if (cachedBase !== null) return cachedBase;
  const script = document.querySelector('script[type="module"]');
  if (script?.src) {
    cachedBase = new URL(script.src, window.location.href).pathname.replace(/\/src\/main\.js$/, "");
  } else {
    cachedBase = "";
  }
  return cachedBase;
}

function useHashRouting() {
  return Boolean(getBasePath());
}

export function getAppPathname() {
  if (useHashRouting()) {
    const hash = window.location.hash.slice(1).split("?")[0];
    const path = hash || "/";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized === "/" ? "/dashboard" : normalized;
  }
  let pathname = window.location.pathname;
  const base = getBasePath();
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || "/";
  }
  pathname = pathname.replace(/\/index\.html$/, "") || "/";
  return pathname === "/" ? "/dashboard" : pathname;
}

export function getAppSearch() {
  if (useHashRouting() && window.location.hash.includes("?")) {
    return `?${window.location.hash.split("?").slice(1).join("?")}`;
  }
  return window.location.search;
}

export function getAppLocation() {
  return `${getAppPathname()}${getAppSearch()}`;
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
  return matchPath(getAppPathname());
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
  snapshotCurrentTab(getAppLocation());
  state.ui.drawer = null;
  state.ui.modal = null;
  state.ui.loading = false;
  syncChromeTab(path);
  restoreTabSnapshot(path);
  if (useHashRouting()) {
    window.location.hash = path;
  } else {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("app:navigate"));
  }
}

export function replace(path) {
  snapshotCurrentTab(getAppLocation());
  state.ui.drawer = null;
  state.ui.modal = null;
  state.ui.loading = false;
  syncChromeTab(path);
  restoreTabSnapshot(path);
  if (useHashRouting()) {
    const url = new URL(window.location.href);
    url.hash = path;
    window.history.replaceState({}, "", url);
    window.dispatchEvent(new Event("app:navigate"));
  } else {
    window.history.replaceState({}, "", path);
    window.dispatchEvent(new Event("app:navigate"));
  }
}

export function queryParams() {
  if (useHashRouting() && window.location.hash.includes("?")) {
    return Object.fromEntries(new URLSearchParams(window.location.hash.split("?")[1] || "").entries());
  }
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function withQuery(path, query) {
  const params = new URLSearchParams(query);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}
