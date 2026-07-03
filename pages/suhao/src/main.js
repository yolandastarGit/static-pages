console.info("[suhao deploy 202607031422]");
import { App, routes } from "./app.js?v=202607031422";
import { defineRoutes } from "./router.js?v=202607031422";
import { subscribe } from "./store.js?v=202607031422";

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
