import { App, routes } from "./app.js";
import { defineRoutes } from "./router.js";
import { subscribe } from "./store.js";

const root = document.getElementById("app");

defineRoutes(routes, routes.find((route) => route.path === "/404"));

function render() {
  root.replaceChildren(App());
}

window.addEventListener("popstate", render);
window.addEventListener("hashchange", render);
window.addEventListener("app:navigate", render);
subscribe(render);

render();
