import { navigate } from "./router.js?v=202607031422";
import { canOperate, closeDrawer, closeModal, markAllNotificationsRead, markNotificationRead, openDrawer, openModal, removeNotification, state, toast } from "./store.js?v=202607031422";

export function h(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === "class") element.className = value;
    else if (key === "html") element.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value === true ? "" : value);
    }
  });
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child === undefined || child === null || child === false) return;
    if (typeof child === "string" || typeof child === "number") {
      element.append(document.createTextNode(String(child)));
    } else {
      element.append(child);
    }
  });
  return element;
}

export function icon(name) {
  const paths = {
    grid: "M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13 13h8v8h-8z",
    message: "M4 5h16v10H8l-4 4z",
    target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    building: "M4 21V5l8-3 8 3v16 M8 9h2 M8 13h2 M8 17h2 M14 9h2 M14 13h2 M14 17h2",
    chart: "M4 19V5 M4 19h17 M8 16v-5 M13 16V8 M18 16v-9",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4",
    plus: "M12 5v14 M5 12h14",
    refresh: "M20 6v6h-6 M4 18v-6h6 M18 9a6 6 0 0 0-10-3 M6 15a6 6 0 0 0 10 3",
    export: "M12 3v12 M8 7l4-4 4 4 M5 21h14",
    search: "M10 18a8 8 0 1 1 5.7-2.3L21 21",
    more: "M5 12h.01 M12 12h.01 M19 12h.01",
    edit: "M4 20h4l11-11-4-4L4 16z M14 6l4 4",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    warning: "M12 3 2 21h20z M12 9v5 M12 17h.01",
    lock: "M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v10H5z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8 M10 20h4",
    robot: "M12 8V5 M8 5h8 M5 10h14v8H5z M8 13h.01 M16 13h.01 M9 18v2 M15 18v2",
    file: "M6 3h8l4 4v14H6z M14 3v5h5"
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.grid}"/></svg>`;
}

export function button(label, options = {}) {
  const { variant = "secondary", iconName, onClick, disabled = false, permission, title } = options;
  if (permission && !canOperate(permission)) return null;
  return h(
    "button",
    {
      class: `btn btn-${variant}`,
      disabled,
      title: title || label,
      onclick: disabled ? undefined : onClick
    },
    [iconName ? h("span", { class: "btn-icon", html: icon(iconName) }) : null, h("span", {}, label)]
  );
}

export function tag(text, type = "default") {
  const normalized = String(text || "-");
  let tagType = type;
  if (normalized.startsWith("AI:")) tagType = "ai";
  if (["启用", "正常", "成功", "已完成", "已签约"].includes(normalized)) tagType = "success";
  if (["停用", "异常", "失败", "无效", "丢失", "已作废", "已终止"].includes(normalized)) tagType = "danger";
  if (["跟进中", "高意向", "执行中", "已分配"].includes(normalized)) tagType = "primary";
  if (["公海待分配", "待确认"].includes(normalized)) tagType = "warning";
  return h("span", { class: `tag tag-${tagType}` }, normalized.replace(/^AI:/, "AI "));
}

export function pageHeader({ title, description, breadcrumbs = [], actions = [] }) {
  const visibleActions = actions.filter(Boolean);
  return visibleActions.length ? h("div", { class: "pane-toolbar" }, visibleActions) : null;
}

export function toolbar(actions = [], batchText = "") {
  return h("div", { class: "toolbar" }, [
    h("div", { class: "toolbar-left" }, actions.filter(Boolean)),
    batchText ? h("div", { class: "batch-info" }, batchText) : null
  ]);
}

export function searchPanel(fields = [], actions = []) {
  return h("section", { class: "search-panel" }, [
    h(
      "div",
      { class: "search-grid" },
      fields.map((field) =>
        h("label", { class: "field" }, [
          h("span", {}, field.label),
          field.type === "select"
            ? h(
                "select",
                { onchange: field.onChange, value: field.value || "" },
                (field.options || []).map((option) =>
                  h("option", { value: option.value ?? option, selected: (option.value ?? option) === field.value }, option.label ?? option)
                )
              )
            : h("input", {
                type: field.type || "text",
                placeholder: field.placeholder || "",
                value: field.value || "",
                oninput: field.onInput,
                onkeydown: (event) => {
                  if (event.key === "Enter" && field.onEnter) field.onEnter(event);
                }
              })
        ])
      )
    ),
    h("div", { class: "search-actions" }, actions.filter(Boolean))
  ]);
}

export function dataTable({ columns, rows, rowKey = "id", onRowClick, selectable = true, selectedIds = [], onSelect }) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row[rowKey]));
  const selectionWidth = selectable ? 48 : 0;
  const leftColumn = columns.find((column) => column.fixed) || columns[0];
  const normalizedColumns = columns.map((column) => {
    const isLeft = column === leftColumn;
    return {
      ...column,
      width: column.width || (isLeft ? 280 : 160),
      fixedSide: isLeft ? "left" : ""
    };
  });
  const actionWidth = 236;
  const tableWidth = selectionWidth + normalizedColumns.reduce((sum, column) => sum + Number(column.width || 160), 0) + actionWidth;
  const cellClass = (column, extra = "") => {
    const classes = [extra];
    if (column.fixedSide === "left") classes.push("table-cell-fix-left table-cell-fix-left-last");
    return classes.filter(Boolean).join(" ");
  };
  return h("div", { class: "table-wrap" }, [
    h("table", { class: "data-table", style: `min-width:${tableWidth}px` }, [
      h("colgroup", {}, [
        selectable ? h("col", { style: `width:${selectionWidth}px` }) : null,
        ...normalizedColumns.map((column) => h("col", { style: `width:${column.width}px` })),
        h("col", { style: `width:${actionWidth}px` })
      ]),
      h("thead", {}, [
        h("tr", {}, [
          selectable
            ? h("th", { class: "select-col table-cell-fix-left table-cell-fix-left-first", style: "left:0" }, [
                h("input", {
                  type: "checkbox",
                  checked: allSelected,
                  onchange: (event) => onSelect?.(event.target.checked ? rows.map((row) => row[rowKey]) : [])
                })
              ])
            : null,
          ...normalizedColumns.map((column) =>
            h(
              "th",
              {
                class: cellClass(column),
                style: column.fixedSide === "left" ? `left:${selectionWidth}px` : ""
              },
              column.label
            )
          ),
          h("th", { class: "op-col table-cell-fix-right table-cell-fix-right-first", style: "right:0" }, "操作")
        ])
      ]),
      h(
        "tbody",
        {},
        rows.map((row, rowIndex) =>
          h("tr", { onclick: () => onRowClick?.(row) }, [
            selectable
              ? h("td", { class: "select-col table-cell-fix-left table-cell-fix-left-first", style: "left:0", onclick: (event) => event.stopPropagation() }, [
                  h("input", {
                    type: "checkbox",
                    checked: selectedIds.includes(row[rowKey]),
                    onchange: (event) => {
                      const next = event.target.checked
                        ? [...selectedIds, row[rowKey]]
                        : selectedIds.filter((id) => id !== row[rowKey]);
                      onSelect?.(next);
                    }
                  })
                ])
              : null,
            ...normalizedColumns.map((column) =>
              h(
                "td",
                {
                  class: cellClass(column),
                  style: column.fixedSide === "left" ? `left:${selectionWidth}px` : ""
                },
                column.render ? column.render(row, rowIndex) : row[column.key] ?? "-"
              )
            ),
            h("td", { class: "op-col table-cell-fix-right table-cell-fix-right-first", style: "right:0", onclick: (event) => event.stopPropagation() }, row.actions ? row.actions(row) : null)
          ])
        )
      )
    ]),
    rows.length ? pagination(rows.length) : emptyState("暂无数据", "当前条件下没有匹配记录。")
  ]);
}

export function pagination(total) {
  return h("div", { class: "pagination" }, [
    h("span", {}, `共 ${total} 条`),
    h("button", { class: "page-btn", disabled: true }, "上一页"),
    h("button", { class: "page-btn active" }, "1"),
    h("button", { class: "page-btn", disabled: total <= 50 }, "下一页")
  ]);
}

export function emptyState(title, description, action) {
  return h("div", { class: "state state-empty" }, [
    h("div", { class: "state-icon" }, "∅"),
    h("h3", {}, title),
    h("p", {}, description),
    action || null
  ]);
}

export function errorState(title = "数据加载失败", description = "请刷新页面或稍后重试。") {
  return h("div", { class: "state state-error" }, [
    h("div", { class: "state-icon", html: icon("warning") }),
    h("h3", {}, title),
    h("p", {}, description),
    button("重新加载", { iconName: "refresh", onClick: () => window.location.reload() })
  ]);
}

export function noPermission() {
  return h("div", { class: "state state-permission" }, [
    h("div", { class: "state-icon", html: icon("lock") }),
    h("h3", {}, "暂无访问权限"),
    h("p", {}, "当前账号没有访问该页面或数据的权限，请返回上一页或联系系统管理员。"),
    button("返回工作台", { iconName: "grid", onClick: () => navigate("/dashboard") })
  ]);
}

export function skeleton(lines = 5) {
  return h("div", { class: "skeleton-block" }, Array.from({ length: lines }, (_, index) => h("span", { style: `width:${80 - index * 7}%` })));
}

export function metricCard(label, value, meta = "", options = {}) {
  return h("div", { class: "metric-card", onclick: options.onClick }, [
    h("span", { class: "metric-label" }, label),
    h("strong", {}, value),
    h("span", { class: "metric-meta" }, meta)
  ]);
}

export function section(title, children, actions = []) {
  return h("section", { class: "card-section" }, [
    h("div", { class: "section-head" }, [h("div", { class: "section-title" }, title), h("div", { class: "section-actions" }, actions.filter(Boolean))]),
    h("div", { class: "section-body" }, children)
  ]);
}

export function infoGrid(items) {
  return h(
    "dl",
    { class: "info-grid" },
    items.flatMap((item) => [h("dt", {}, item.label), h("dd", {}, item.value || "-")])
  );
}

export function tabs(tabsConfig, active, onChange) {
  const queryKey = typeof onChange === "object" ? onChange.queryKey : "";
  const onTabChange = typeof onChange === "function" ? onChange : onChange?.onChange;
  const queryActive = queryKey ? new URLSearchParams(window.location.search).get(queryKey) : "";
  active = queryActive || active;
  let current = tabsConfig.find((item) => item.id === active) || tabsConfig[0];
  const panel = h("div", { class: "tab-panel" }, current.render());
  const buttons = tabsConfig.map((item) =>
    h(
      "button",
      {
        class: item.id === current.id ? "active" : "",
        onclick: (event) => {
          current = item;
          buttons.forEach((buttonElement) => buttonElement.classList.remove("active"));
          event.currentTarget.classList.add("active");
          panel.replaceChildren(current.render());
          if (queryKey) {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set(queryKey, item.id);
            window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
          }
          onTabChange?.(item.id);
        }
      },
      item.label
    )
  );
  return h("div", { class: "tabs-wrap" }, [h("div", { class: "tabs" }, buttons), panel]);
}

function notificationTypeIcon(type) {
  const iconMap = {
    lead: "target",
    customer: "building",
    contract: "file",
    system: "settings",
    ai: "robot",
    approval: "warning",
    site: "globe"
  };
  return iconMap[type] || "bell";
}

function notificationTargetExists(target = "") {
  if (!target) return false;
  const path = target.split("?")[0];
  if (path.startsWith("/leads/")) return state.data.leads.some((lead) => `/leads/${lead.id}` === path);
  if (path.startsWith("/customers/")) return state.data.customers.some((customer) => `/customers/${customer.id}` === path);
  if (path.startsWith("/contracts/")) return state.data.contracts.some((contract) => `/contracts/${contract.id}` === path);
  if (path.startsWith("/sites/")) {
    const siteId = path.split("/")[2];
    return state.data.sites.some((site) => site.id === siteId);
  }
  return ["/system/params", "/system/logs", "/dashboard"].includes(path);
}

export function NotificationCenter(filter = "all") {
  const items = [...state.data.notifications]
    .filter((notification) => (filter === "unread" ? !notification.read : filter === "read" ? notification.read : true))
    .sort((a, b) => b.time.localeCompare(a.time));
  return h("div", { class: "notification-center" }, [
    h("div", { class: "notification-toolbar" }, [
      h("div", { class: "tabs compact" }, [
        h("button", { class: filter === "all" ? "active" : "", onclick: () => openNotificationCenter("all") }, "全部"),
        h("button", { class: filter === "unread" ? "active" : "", onclick: () => openNotificationCenter("unread") }, "未读"),
        h("button", { class: filter === "read" ? "active" : "", onclick: () => openNotificationCenter("read") }, "已读")
      ]),
      h("button", {
        class: "btn btn-text",
        onclick: () => {
          markAllNotificationsRead();
          openNotificationCenter(filter);
        }
      }, "全部标记已读")
    ]),
    items.length ? h("div", { class: "notification-list" }, items.map((notification) => notificationItem(notification, filter))) : emptyState("暂无通知", "当前分类下没有通知。"),
    h("div", { class: "notification-footer" }, h("button", { class: "btn btn-secondary", onclick: () => toast("查看全部通知功能已预留") }, "查看全部通知"))
  ]);
}

function openNotificationCenter(filter = "all") {
  openDrawer({
    title: "通知中心",
    hideFooter: true,
    body: NotificationCenter(filter)
  });
}

function notificationItem(notification, filter) {
  return h("div", { class: `notification-item ${notification.read ? "is-read" : "is-unread"}` }, [
    h("button", {
      class: "notification-main",
      onclick: () => {
        markNotificationRead(notification.id);
        closeDrawer();
        if (notificationTargetExists(notification.target)) navigate(notification.target);
        else toast("当前数据不存在或已删除", "error");
      }
    }, [
      h("span", { class: `notification-type type-${notification.type}`, html: icon(notificationTypeIcon(notification.type)) }),
      h("span", { class: "notification-content" }, [
        h("strong", {}, notification.title),
        h("span", {}, notification.summary),
        h("em", {}, `${notification.module} · ${notification.time}`)
      ]),
      h("span", { class: `notification-status ${notification.read ? "read" : "unread"}` }, notification.read ? "已读" : "未读")
    ]),
    h("div", { class: "notification-actions" }, [
      notification.read ? null : h("button", { class: "btn btn-text", onclick: () => { markNotificationRead(notification.id); openNotificationCenter(filter); } }, "标记已读"),
      h("button", { class: "btn btn-text", onclick: () => { removeNotification(notification.id); openNotificationCenter(filter); } }, "删除")
    ])
  ]);
}

export function notificationTrigger() {
  const unread = state.data.notifications.filter((notification) => !notification.read).length;
  const badge = unread > 99 ? "99+" : String(unread);
  return h("button", { class: "notification-trigger", title: "通知", onclick: openNotificationCenter }, [
    h("span", { class: "notification-trigger-icon", html: icon("bell") }),
    h("span", {}, "通知"),
    unread ? h("span", { class: "notification-badge" }, badge) : null
  ]);
}

export function drawerLayer() {
  const drawer = state.ui.drawer;
  if (!drawer) return null;
  return h("div", { class: "overlay drawer-overlay" }, [
    h("aside", { class: "drawer" }, [
      h("div", { class: "drawer-head" }, [
        h("h2", {}, drawer.title),
        h("button", { class: "icon-btn", onclick: closeDrawer }, "×")
      ]),
      h("div", { class: "drawer-body" }, drawer.body),
      drawer.hideFooter ? null : h("div", { class: "drawer-foot" }, [
        button("取消", { onClick: closeDrawer }),
        button(drawer.okText || "保存", {
          variant: "primary",
          onClick: () => {
            drawer.onSubmit?.();
            closeDrawer();
          }
        })
      ])
    ])
  ]);
}

export function modalLayer() {
  const modal = state.ui.modal;
  if (!modal) return null;
  return h("div", { class: "overlay modal-overlay" }, [
    h("div", { class: "modal" }, [
      h("div", { class: "modal-head" }, [h("h2", {}, modal.title), h("button", { class: "icon-btn", onclick: closeModal }, "×")]),
      h("div", { class: "modal-body" }, modal.body),
      h("div", { class: "modal-foot" }, [
        button("取消", { onClick: closeModal }),
        button(modal.okText || "确认", {
          variant: modal.danger ? "danger" : "primary",
          onClick: () => {
            modal.onConfirm?.();
            closeModal();
          }
        })
      ])
    ])
  ]);
}

export function toastLayer() {
  if (!state.ui.toast) return null;
  return h("div", { class: `toast toast-${state.ui.toast.type}` }, state.ui.toast.message);
}

export function simpleForm(fields) {
  return h(
    "div",
    { class: "form-grid" },
    fields.map((field) =>
      h("label", { class: field.full ? "field full" : "field" }, [
        h("span", {}, `${field.label}${field.required ? " *" : ""}`),
        field.type === "select"
          ? h("select", {}, (field.options || []).map((option) => h("option", {}, option)))
          : field.type === "upload"
            ? h("input", { type: "file" })
            : field.type === "tree-select"
              ? h("select", {}, (field.options || []).map((option) => h("option", {}, option)))
              : field.type === "autocomplete"
                ? h("input", { type: "text", list: field.listId || "", value: field.value || "", placeholder: field.placeholder || "" })
          : field.type === "textarea"
            ? h("textarea", { placeholder: field.placeholder || "", rows: 4 }, field.value || "")
            : h("input", { type: field.type || "text", value: field.value || "", placeholder: field.placeholder || "" })
      ])
    )
  );
}

export function confirmAction({ title, message, okText = "确认", danger = false, onConfirm }) {
  openModal({
    title,
    danger,
    okText,
    body: h("p", { class: "confirm-message" }, message),
    onConfirm: () => {
      onConfirm?.();
      toast(`${okText}成功`);
    }
  });
}
