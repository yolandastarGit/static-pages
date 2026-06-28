import { clearPageState } from "./store.js";

const routes = [];
let fallback = null;

export function defineRoutes(routeList, fallbackRoute) {
  routes.splice(0, routes.length, ...routeList);
  fallback = fallbackRoute;
}

function detectBasePath() {
  const script = document.querySelector('script[type="module"][src*="main.js"]');
  if (!script) return "";
  return new URL(script.src, window.location.href).pathname.replace(/\/src\/main\.js$/, "");
}

const basePath = detectBasePath();

export function getBasePath() {
  return basePath;
}

export function getAppPath() {
  const pathname = window.location.pathname;
  if (basePath && pathname.startsWith(basePath)) {
    const rest = pathname.slice(basePath.length) || "/";
    return rest.replace(/\/index\.html$/, "/") || "/";
  }
  if (pathname.endsWith("/index.html")) return pathname.replace(/\/index\.html$/, "/") || "/";
  return pathname || "/";
}

function toUrl(path) {
  return `${basePath}${path}`;
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
  const pathname = getAppPath() === "/" ? "/dashboard" : getAppPath();
  return matchPath(pathname);
}

export function navigate(path) {
  clearPageState();
  window.history.pushState({}, "", toUrl(path));
  window.dispatchEvent(new Event("app:navigate"));
}

export function replace(path) {
  clearPageState();
  window.history.replaceState({}, "", toUrl(path));
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
