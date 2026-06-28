import { drawerLayer, h, icon, modalLayer, noPermission, notificationTrigger, toastLayer } from "./components.js";
import { navigation, users } from "./data.js";
import { getAppPathname, getCurrentRoute, navigate, replace } from "./router.js";
import { canAccess, logout, notify, setUser, state } from "./store.js";
import {
  AcquisitionAnalyticsPage,
  AccountBindingPage,
  ChangePasswordPage,
  ContractsPage,
  ContractDetailPage,
  CustomerAnalyticsPage,
  CustomerDetailPage,
  CustomersPage,
  DashboardPage,
  FirstLoginPasswordPage,
  ForbiddenPage,
  ForgotPasswordPage,
  FollowLogsPage,
  LeadDetailPage,
  LeadsPage,
  LoginPage,
  LoginSecurityPage,
  LoadingPage,
  LogsPage,
  NetworkErrorPage,
  MailPage,
  NotFoundPage,
  ParamsPage,
  ProfilePage,
  PublicPoolPage,
  RolesPage,
  SalesAnalyticsPage,
  ServerErrorPage,
  SessionExpiredPage,
  SiteConfigPage,
  SiteDetailPage,
  SitesPage,
  UsersPage,
  WhatsappPage
} from "./pages.js";

export const routes = [
  { path: "/login", pageId: "public", title: "登录", public: true, render: LoginPage },
  { path: "/forgot-password", pageId: "public", title: "忘记密码", public: true, render: ForgotPasswordPage },
  { path: "/first-login-password", pageId: "public", title: "首次登录修改密码", public: true, render: FirstLoginPasswordPage },
  { path: "/session-expired", pageId: "public", title: "会话已过期", public: true, render: SessionExpiredPage },
  { path: "/403", pageId: "public", title: "无权限", public: true, render: ForbiddenPage },
  { path: "/500", pageId: "public", title: "系统异常", public: true, render: ServerErrorPage },
  { path: "/network-error", pageId: "public", title: "网络异常", public: true, render: NetworkErrorPage },
  { path: "/loading", pageId: "public", title: "系统加载中", public: true, render: LoadingPage },
  { path: "/dashboard", pageId: "dashboard", title: "工作台", render: DashboardPage },
  { path: "/communication/mail", pageId: "mail", title: "邮件", render: MailPage },
  { path: "/communication/whatsapp", pageId: "whatsapp", title: "WhatsApp", render: WhatsappPage },
  { path: "/leads", pageId: "lead-list", title: "线索列表", render: LeadsPage },
  { path: "/leads/public-pool", pageId: "public-pool", title: "公海池", render: PublicPoolPage },
  { path: "/leads/follow-logs", pageId: "lead-list", title: "跟进日志", render: FollowLogsPage },
  { path: "/leads/:id", pageId: "lead-list", title: "线索详情", render: LeadDetailPage },
  { path: "/customers", pageId: "customer-list", title: "客户列表", render: CustomersPage },
  { path: "/customers/:id", pageId: "customer-list", title: "客户详情", render: CustomerDetailPage },
  { path: "/contracts", pageId: "contract-center", title: "合同中心", render: ContractsPage },
  { path: "/contracts/:id", pageId: "contract-center", title: "合同详情", render: ContractDetailPage },
  { path: "/analytics/sales", pageId: "sales-analytics", title: "销售经营", render: SalesAnalyticsPage },
  { path: "/analytics/acquisition", pageId: "acquisition-analytics", title: "获客分析", render: AcquisitionAnalyticsPage },
  { path: "/analytics/customers", pageId: "customer-analytics", title: "客户经营", render: CustomerAnalyticsPage },
  { path: "/sites", pageId: "site-management", title: "站点管理", render: SitesPage },
  { path: "/sites/:id", pageId: "site-management", title: "站点详情", render: SiteDetailPage },
  { path: "/sites/:id/config", pageId: "site-management", title: "站点配置", render: SiteConfigPage },
  { path: "/user/profile", pageId: "dashboard", title: "我的资料", render: ProfilePage },
  { path: "/user/bindings", pageId: "dashboard", title: "账号绑定", render: AccountBindingPage },
  { path: "/user/password", pageId: "dashboard", title: "修改密码", render: ChangePasswordPage },
  { path: "/user/security", pageId: "dashboard", title: "登录安全", render: LoginSecurityPage },
  { path: "/system/users", pageId: "user-management", title: "用户管理", render: UsersPage },
  { path: "/system/roles", pageId: "role-permissions", title: "角色权限", render: RolesPage },
  { path: "/system/logs", pageId: "system-logs", title: "系统日志", render: LogsPage },
  { path: "/system/params", pageId: "system-params", title: "系统参数", render: ParamsPage },
  { path: "/404", pageId: "dashboard", title: "页面不存在", render: NotFoundPage }
];

export function App() {
  if (getAppPathname() === "/") replace("/dashboard");
  const { route, params } = getCurrentRoute();
  if (!state.auth.loggedIn && !route?.public) {
    replace(state.auth.expired ? "/session-expired" : "/login");
  }
  const current = getCurrentRoute();
  const currentRoute = current.route;
  const currentParams = current.params;
  const content = currentRoute && (currentRoute.public || canAccess(currentRoute.pageId)) ? currentRoute.render(currentParams) : currentRoute ? noPermission() : NotFoundPage();

  if (currentRoute?.public) {
    return h("div", {}, [content, modalLayer(), toastLayer()]);
  }

  return h("div", { class: "app-shell" }, [
    sidebar(currentRoute),
    h("main", { class: "main-shell" }, [topbar(currentRoute), h("div", { class: "content" }, content)]),
    drawerLayer(),
    modalLayer(),
    toastLayer()
  ]);
}

function sidebar(activeRoute) {
  const activeGroupId = activeRoute ? findActiveGroupId(activeRoute.pageId) : "dashboard";
  const expandedGroupId = state.ui.expandedMenu || readExpandedMenu() || activeGroupId;
  return h("aside", { class: "sidebar" }, [
    h("div", { class: "brand" }, [
      h("div", { class: "brand-mark" }, "AI"),
      h("div", {}, [h("strong", {}, "AI 智能 CRM"), h("span", {}, "企业销售管理后台")])
    ]),
    h(
      "nav",
      {},
      navigation.map((item) =>
        h("div", { class: "nav-group" }, [
          item.path
            ? navLink(item, activeRoute)
            : h(
                "button",
                {
                  class: `nav-parent ${expandedGroupId === item.id ? "open" : ""} ${activeGroupId === item.id ? "current" : ""}`,
                  onclick: () => {
                    const next = expandedGroupId === item.id ? "" : item.id;
                    state.ui.expandedMenu = next;
                    writeExpandedMenu(next);
                    notify();
                  }
                },
                [
                  h("span", { class: "nav-parent-main" }, [h("span", { html: icon(item.icon) }), h("span", {}, item.label)]),
                  h("span", { class: "nav-caret" }, "›")
                ]
              ),
          item.children && expandedGroupId === item.id
            ? h("div", { class: "nav-children" }, item.children.filter((child) => canAccess(child.id)).map((child) => navLink(child, activeRoute)))
            : null
        ])
      )
    )
  ]);
}

function navLink(item, activeRoute) {
  const active = activeRoute?.pageId === item.id || activeRoute?.path === item.path;
  return h("a", { href: item.path, class: `nav-item ${active ? "active" : ""}`, onclick: (event) => { event.preventDefault(); navigate(item.path); } }, [
    item.icon ? h("span", { html: icon(item.icon) }) : null,
    h("span", {}, item.label)
  ]);
}

function topbar(route) {
  return h("header", { class: "topbar" }, [
    h("div", { class: "topbar-left" }, [
      h("div", { class: "topbar-brand" }, [h("span", { class: "brand-mark mini" }, "AI"), h("strong", {}, "AI 智能 CRM")])
    ]),
    h("div", { class: "topbar-center" }, [
      h("div", { class: "header-breadcrumbs" }, getHeaderBreadcrumbs(route).map((item, index) => h("span", {}, `${index ? " / " : ""}${item}`)))
    ]),
    h("div", { class: "topbar-right" }, [
      h("label", { class: "global-search" }, [h("span", { html: icon("search") }), h("input", { placeholder: "全局搜索线索、客户、合同" })]),
      notificationTrigger(),
      h("div", { class: "topbar-user" }, [
        h("span", { class: "avatar" }, state.user.name.slice(0, 1)),
        h("div", { class: "topbar-user-text" }, [h("strong", {}, state.user.name), h("span", {}, `${state.user.role} · ${state.user.dataScope || ""}`)])
      ]),
      h(
        "select",
        { class: "header-select user-select", onchange: (event) => setUser(event.target.value) },
        users.map((user) => h("option", { value: user.id, selected: user.id === state.user.id }, `${user.name}（${user.role}）`))
      ),
      h("select", { class: "header-select account-select", onchange: (event) => handleAccountAction(event.target.value) }, [
        h("option", { value: "" }, "账号设置"),
        h("option", { value: "/user/profile" }, "我的资料"),
        h("option", { value: "/user/bindings" }, "账号绑定"),
        h("option", { value: "/user/password" }, "修改密码"),
        h("option", { value: "/user/security" }, "登录安全"),
        h("option", { value: "logout" }, "退出登录")
      ])
    ])
  ]);
}

function handleAccountAction(value) {
  if (!value) return;
  if (value === "logout") {
    logout(false);
    navigate("/login");
    return;
  }
  navigate(value);
}

function findActiveGroupId(pageId) {
  if (pageId === "role-permissions") return "system";
  for (const item of navigation) {
    if (item.id === pageId) return item.id;
    if (item.children?.some((child) => child.id === pageId)) return item.id;
  }
  return "dashboard";
}

function getHeaderBreadcrumbs(route) {
  if (!route) return ["工作台"];
  const group = navigation.find((item) => item.id === route.pageId || item.children?.some((child) => child.id === route.pageId));
  const child = group?.children?.find((item) => item.id === route.pageId);
  if (!group || group.path) return [route.title || "工作台"];
  return [group.label, child?.label || route.title];
}

function readExpandedMenu() {
  try {
    return window.localStorage?.getItem("crm.expandedMenu") || "";
  } catch {
    return "";
  }
}

function writeExpandedMenu(value) {
  try {
    if (value) window.localStorage?.setItem("crm.expandedMenu", value);
    else window.localStorage?.removeItem("crm.expandedMenu");
  } catch {
    // localStorage may be unavailable in restricted contexts.
  }
}
