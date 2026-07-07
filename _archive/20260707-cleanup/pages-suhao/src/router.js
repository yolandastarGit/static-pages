import { openChromeTab, restoreTabSnapshot, snapshotCurrentTab, state } from "./store.js?v=20260703074251";

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

function splitAppPath(path) {
  const [pathname, ...queryParts] = path.split("?");
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const search = queryParts.length ? `?${queryParts.join("?")}` : "";
  return { pathname: normalized, search };
}

export function getAppPathname() {
  if (useHashRouting()) {
    const hash = window.location.hash.slice(1);
    const { pathname } = splitAppPath(hash || "/");
    return pathname === "/" ? "/dashboard" : pathname;
  }
  let pathname = window.location.pathname;
  const base = getBasePath();
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || "/";
  }
  pathname = pathname.replace(/\/index\.html$/, "") || "/";
  return pathname === "/" ? "/dashboard" : pathname;
}

export function getAppPath() {
  if (useHashRouting()) {
    const hash = window.location.hash.slice(1);
    const { pathname, search } = splitAppPath(hash || "/");
    const normalized = pathname === "/" ? "/dashboard" : pathname;
    return `${normalized}${search}`;
  }
  return `${getAppPathname()}${window.location.search}`;
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
  const { pathname } = splitAppPath(path);
  return matchPath(pathname);
}

function syncChromeTab(path) {
  const { pathname } = splitAppPath(path);
  const { route } = matchPath(pathname);
  if (route && !route.public) {
    openChromeTab({ path, title: route.title, pageId: route.pageId, public: route.public });
  }
}

export function navigate(path) {
  snapshotCurrentTab(getAppPath());
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
  snapshotCurrentTab(getAppPath());
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
    return Object.fromEntries(new URLSearchParams(window.location.hash.split("?").slice(1).join("?")).entries());
  }
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function withQuery(path, query) {
  const params = new URLSearchParams(query);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}
