window.CRMLayout = {
  menu: [
    { key: "workbench", icon: "⌂", label: "工作台" },
    { label: "沟通中心", icon: "◉", children: [{ key: "email", label: "邮件" }, { key: "whatsapp", label: "WhatsApp" }] },
    { label: "线索中心", icon: "◇", children: [{ key: "leads", label: "线索列表" }, { key: "publicPool", label: "公海池" }] },
    { label: "客户中心", icon: "□", children: [{ key: "customers", label: "客户列表" }, { key: "contracts", label: "合同中心" }] },
    { label: "分析中心", icon: "▣", children: [{ key: "analyticsSales", label: "销售经营" }, { key: "analyticsAcquisition", label: "获客分析" }, { key: "analyticsCustomer", label: "客户经营" }] },
    { label: "站点中心", icon: "◎", children: [{ key: "sites", label: "站点管理" }] },
    { key: "ai", icon: "✦", label: "AI能力管理" },
    { label: "消息管理", icon: "✉", children: [{ key: "messageTemplates", label: "消息模板" }, { key: "pushRules", label: "推送管理" }] },
    { label: "系统管理", icon: "⚙", children: [
      { key: "systemUsers", label: "用户管理" },
      { key: "systemRoles", label: "角色管理" },
      { key: "systemMenus", label: "菜单管理" },
      { key: "systemDicts", label: "字典管理" },
      { key: "systemParams", label: "系统参数" },
      { key: "systemPushConfig", label: "消息推送配置" },
      { key: "systemMailConfig", label: "邮件服务配置" },
      { key: "systemWhatsappConfig", label: "WhatsApp配置" },
      { key: "systemNoticeRules", label: "通知规则" },
      { key: "systemSwitches", label: "系统开关" },
      { key: "systemLogs", label: "系统日志" }
    ] }
  ],
  mount(pageKey) {
    const app = document.getElementById("app");
    const title = CRMRouter.titles[pageKey] || "AI 智能 CRM";
    app.innerHTML = `
      <div class="app-shell" id="shell">
        <aside class="sidebar">
          <div class="brand"><div class="brand-mark">AI</div><span>智能 CRM</span></div>
          <nav>${this.menu.map(item => this.renderMenuItem(item, pageKey)).join("")}</nav>
        </aside>
        <main class="main">
          <header class="topbar">
            <input class="global-search" id="globalSearch" placeholder="搜索线索、客户、邮件、合同" />
            <div class="top-actions">
              <button class="icon-btn" id="notifyBtn" title="通知">🔔</button>
              <button class="icon-btn" data-route="email" title="打开邮件">✉</button>
              <div class="avatar">${CRM_MOCK.currentUser.avatar}</div>
              <div>
                <strong>${CRM_MOCK.currentUser.name}</strong>
                <div class="small muted">${CRM_MOCK.currentUser.role}</div>
              </div>
            </div>
          </header>
          <section class="content">
            <div class="breadcrumb">AI 智能 CRM / ${title}</div>
            <div class="page-head">
              <h1 class="page-title">${title}</h1>
            </div>
            <div id="page-root"></div>
          </section>
        </main>
      </div>
      <div class="drawer-mask" id="drawerMask"></div>
      <div class="modal-mask" id="modalMask"></div>
      <div class="toast" id="toast"></div>
    `;
    document.querySelectorAll("[data-route]").forEach(el => {
      el.addEventListener("click", () => CRMRouter.goto(el.dataset.route));
    });
    document.querySelectorAll("[data-menu-parent]").forEach(el => {
      el.addEventListener("click", () => {
        el.closest(".nav-section").classList.toggle("open");
      });
    });
    document.getElementById("notifyBtn").addEventListener("click", () => {
      CRMUI.toast("3 条待跟进提醒、1 条线索分配通知");
    });
    document.getElementById("globalSearch").addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.value.trim()) {
        CRMRouter.goto("leads", { q: e.target.value.trim() });
      }
    });
    return document.getElementById("page-root");
  },
  renderMenuItem(item, pageKey) {
    if (!item.children) {
      return `<div class="nav-item ${item.key === pageKey ? "active" : ""}" data-route="${item.key}" title="${item.label}">
        <span>${item.icon}</span><span class="nav-label">${item.label}</span>
      </div>`;
    }
    const open = item.children.some(child => child.key === pageKey);
    return `<div class="nav-section ${open ? "open" : ""}">
      <div class="nav-parent" data-menu-parent>
        <span>${item.icon}</span><span class="nav-label">${item.label}</span><span class="nav-caret">⌄</span>
      </div>
      <div class="nav-children">
        ${item.children.map(child => `<div class="nav-child ${child.key === pageKey ? "active" : ""}" data-route="${child.key}" title="${child.label}"><span class="nav-label">${child.label}</span></div>`).join("")}
      </div>
    </div>`;
  }
};
