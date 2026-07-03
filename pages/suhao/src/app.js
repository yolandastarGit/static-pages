import { drawerLayer, h, icon, modalLayer, noPermission, notificationTrigger, toastLayer } from "./components.js?v=20260703074251";
import { navigation, users } from "./data.js?v=20260703074251";
import { getAppPath, getAppPathname, getCurrentRoute, navigate, replace } from "./router.js?v=20260703074251";
import { canAccess, closeAllChromeTabs, closeChromeTab, closeOtherChromeTabs, logout, notify, openChromeTab, setUser, state } from "./store.js?v=20260703074251";
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
  SiteDetailPage,
  SitesPage,
  UsersPage,
  WhatsappPage
} from "./pages.js?v=20260703074251";

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
  if (currentRoute && !currentRoute.public && canAccess(currentRoute.pageId)) {
    openChromeTab({ path: getAppPath(), title: currentRoute.title, pageId: currentRoute.pageId });
  }
  const content = currentRoute && (currentRoute.public || canAccess(currentRoute.pageId)) ? currentRoute.render(currentParams) : currentRoute ? noPermission() : NotFoundPage();

  if (currentRoute?.public) {
    return h("div", {}, [content, modalLayer(), toastLayer()]);
  }

  return h("div", { class: "app-shell" }, [
    sidebar(currentRoute),
    h("main", { class: "main-shell" }, [topbar(), h("div", { class: "content" }, [breadcrumbBar(currentRoute), dynamicTabs(currentRoute), h("div", { class: "tab-pane" }, content)])]),
    drawerLayer(),
    modalLayer(),
    toastLayer()
  ]);
}

function sidebar(activeRoute) {
  const activeGroupId = activeRoute ? findActiveGroupId(activeRoute.pageId) : "dashboard";
  const expandedGroupId = state.ui.expandedMenu || readExpandedMenu() || activeGroupId;
  const parentGroups = navigation.filter((item) => item.children?.length);
  const visibleChildren = (item) => item.children.filter((child) => canAccess(child.id));
  return h("aside", { class: "sidebar" }, [
    h("div", { class: "brand" }, [
      h("div", { class: "brand-mark" }, "AI"),
      h("div", {}, [h("strong", {}, "AI 智能 CRM"), h("span", {}, "企业销售管理后台")])
    ]),
    h(
      "nav",
      {},
      navigation.map((item) => {
        const children = item.children ? visibleChildren(item) : [];
        const isOpen = expandedGroupId === item.id;
        const parentIndex = parentGroups.findIndex((group) => group.id === item.id);
        return h("div", { class: `nav-group ${isOpen ? "open" : ""}` }, [
          item.path || !children.length
            ? navLink(item, activeRoute)
            : h(
                "button",
                {
                  class: `nav-parent ${isOpen ? "open" : ""} ${activeGroupId === item.id ? "current" : ""}`,
                  "aria-expanded": String(isOpen),
                  "aria-controls": `nav-children-${item.id}`,
                  onclick: () => {
                    const next = isOpen ? "" : item.id;
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
          item.children
            ? h("div", {
                id: `nav-children-${item.id}`,
                class: `nav-children ${isOpen ? "open" : ""}`,
                style: `--child-count:${Math.max(children.length, 1)};--parent-index:${Math.max(parentIndex, 0)}`
              }, children.map((child) => navLink(child, activeRoute)))
            : null
        ]);
      })
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

function dynamicTabs(activeRoute) {
  const activePath = getAppPath();
  const activePathname = getAppPathname();
  const tabs = state.ui.openTabs.length ? state.ui.openTabs : [{ path: "/dashboard", title: "工作台", pageId: "dashboard", pinned: true }];
  return h("div", { class: "chrome-tabs-shell" }, [
    h("div", { class: "chrome-tabs", role: "tablist" }, tabs.map((item) =>
      h("div", { class: `chrome-tab ${new URL(item.path, window.location.origin).pathname === activePathname ? "active" : ""}`, role: "tab", title: item.title }, [
        h("a", {
          href: item.path,
          onclick: (event) => {
            event.preventDefault();
            navigate(item.path);
          }
        }, item.title),
        item.pinned || tabs.length <= 1
          ? null
          : h("button", {
              class: "chrome-tab-close",
              title: "关闭当前标签",
              onclick: (event) => {
                event.preventDefault();
                event.stopPropagation();
                const nextPath = closeChromeTab(item.path, activePath);
                if (nextPath !== activePath) navigate(nextPath);
                else notify();
              }
            }, "×")
      ])
    )),
    h("div", { class: "chrome-tab-actions" }, [
      h("button", {
        class: "icon-btn",
        title: "关闭当前",
        disabled: activeRoute?.path === "/dashboard" || tabs.length <= 1,
        onclick: () => {
          const nextPath = closeChromeTab(activePath, activePath);
          if (nextPath !== activePath) navigate(nextPath);
          else notify();
        }
      }, "×"),
      h("button", {
        class: "icon-btn",
        title: "关闭其它",
        disabled: tabs.length <= 1,
        onclick: () => {
          closeOtherChromeTabs(activePath);
          notify();
        }
      }, "□"),
      h("button", {
        class: "icon-btn",
        title: "关闭全部",
        disabled: tabs.length <= 1,
        onclick: () => {
          closeAllChromeTabs();
          if (activePath !== "/dashboard") navigate("/dashboard");
          else notify();
        }
      }, "⌂")
    ])
  ]);
}

function topbar() {
  return h("header", { class: "topbar" }, [
    h("div", { class: "topbar-left" }, [
      h("div", { class: "topbar-brand" }, [h("span", { class: "brand-mark mini" }, "AI"), h("strong", {}, "AI 智能 CRM")])
    ]),
    h("div", { class: "topbar-center" }),
    h("div", { class: "topbar-right" }, [
      h("label", { class: "global-search" }, [h("span", { html: icon("search") }), h("input", { placeholder: "全局搜索线索、客户、合同" })]),
      notificationTrigger(),
      h(
        "select",
        { class: "header-select user-select", onchange: (event) => setUser(event.target.value) },
        users.map((user) => h("option", { value: user.id, selected: user.id === state.user.id }, roleSwitcherLabel(user)))
      ),
      avatarDropdown()
    ])
  ]);
}

function roleSwitcherLabel(user) {
  const sameRoleIndex = users.filter((item) => item.role === user.role).findIndex((item) => item.id === user.id);
  const sameRoleCount = users.filter((item) => item.role === user.role).length;
  return sameRoleCount > 1 ? `${user.role} ${sameRoleIndex + 1}` : user.role;
}

function avatarDropdown() {
  return h("div", { class: "avatar-dropdown" }, [
    h("button", {
      class: "topbar-user",
      title: "账号菜单",
      onclick: () => {
        state.ui.userMenuOpen = !state.ui.userMenuOpen;
        notify();
      }
    }, [
      h("span", { class: "avatar" }, state.user.name.slice(0, 1))
    ]),
    state.ui.userMenuOpen
      ? h("div", { class: "avatar-menu" }, [
          h("div", { class: "avatar-menu-head" }, [
            h("strong", {}, state.user.name),
            h("span", {}, state.user.role)
          ]),
          h("div", { class: "avatar-menu-divider" }),
          avatarMenuItem("我的资料", "/user/profile"),
          avatarMenuItem("账号绑定", "/user/bindings"),
          avatarMenuItem("修改密码", "/user/password"),
          h("button", { class: "avatar-menu-item danger", onclick: () => handleAccountAction("logout") }, [h("span", { class: "avatar-menu-dot" }), h("span", {}, "退出登录")])
        ])
      : null
  ]);
}

function avatarMenuItem(label, path) {
  return h("button", { class: "avatar-menu-item", onclick: () => handleAccountAction(path) }, [h("span", { class: "avatar-menu-dot" }), h("span", {}, label)]);
}

function breadcrumbBar(route) {
  return h("div", { class: "content-breadcrumbs" }, getHeaderBreadcrumbs(route).map((item, index) => h("span", {}, `${index ? " / " : ""}${item}`)));
}

function handleAccountAction(value) {
  if (!value) return;
  state.ui.userMenuOpen = false;
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
  if (route.pageId === "role-permissions") return ["系统管理", "用户管理", route.title];
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
