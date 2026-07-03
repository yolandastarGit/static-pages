console.info("[suhao deploy 20260703073031]");
console.info("[suhao deploy 202607031422]");
import { App, routes } from "./app.js?v=20260703073031";
import { defineRoutes } from "./router.js?v=20260703073031";
import { subscribe } from "./store.js?v=20260703073031";

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
