window.CRMLayout = {
  menu: [
    { key: "workbench", icon: "⌂", label: "工作台" },
    { label: "沟通中心", icon: "◉", children: [{ key: "email", label: "邮件" }, { key: "whatsapp", label: "WhatsApp" }] },
    { label: "线索中心", icon: "◇", children: [{ key: "leads", label: "线索列表" }, { key: "publicPool", label: "公海池" }] },
    { label: "客户中心", icon: "□", children: [{ key: "customers", label: "客户列表" }, { key: "contracts", label: "合同中心" }] },
    { label: "分析中心", icon: "▣", children: [{ key: "analyticsSales", label: "销售经营" }, { key: "analyticsAcquisition", label: "获客分析" }, { key: "analyticsCustomer", label: "客户经营" }] },
    { label: "站点中心", icon: "◎", children: [{ key: "sites", label: "站点管理" }] },
    { key: "ai", icon: "✦", label: "AI能力管理" },
    { label: "通知管理", icon: "✉", children: [{ key: "notificationCenter", label: "通知中心" }] },
    { label: "系统管理", icon: "⚙", children: [
      { key: "systemUsers", label: "用户管理" },
      { key: "systemRoles", label: "角色管理" },
      { key: "systemMenus", label: "菜单管理" },
      { key: "systemDicts", label: "字典管理" },
      { key: "paramSettings", label: "参数设置" },
      { key: "systemParams", label: "系统参数" },
      { key: "systemCommunicationConfig", label: "沟通服务协议配置" },
      { key: "systemConfig", label: "系统配置" },
      { key: "systemLogs", label: "系统日志" }
    ] }
  ],
  mount(pageKey) {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="app-shell" id="shell">
        <main class="main">
          <header class="topbar">
            <div class="header-brand"><div class="brand-mark">AI</div><span>智能 CRM</span></div>
            <div class="header-center">
              <div class="breadcrumb" id="breadcrumb"></div>
            </div>
            <div class="top-actions">
              <button class="icon-btn" id="globalSearchBtn" title="搜索">⌕</button>
              <div class="notification-entry" id="notificationEntry">
                <button class="icon-btn" id="notifyBtn" title="通知" type="button" aria-expanded="false">🔔<span class="notify-badge" id="notifyBadge"></span></button>
                <div class="notification-popover" id="notificationPopover"></div>
              </div>
              <div class="user-menu" id="userMenu">
                <button class="user-trigger" id="userMenuTrigger" type="button" aria-expanded="false">
                  <span class="avatar">${CRM_MOCK.currentUser.avatar}</span>
                  <span class="user-summary">
                    <strong>${CRM_MOCK.currentUser.name}</strong>
                    <span class="small muted">${CRM_MOCK.currentUser.role}</span>
                  </span>
                </button>
                <div class="user-dropdown" id="userDropdown">
                  <button type="button" data-user-action="profile">我的资料</button>
                  <button type="button" data-user-action="password">修改密码</button>
                  <button type="button" data-user-action="bind">绑定账号</button>
                  <button type="button" data-user-action="logout">退出登录</button>
                </div>
              </div>
            </div>
          </header>
          <div class="workspace-shell">
            <aside class="sidebar">
              <nav>${this.menu.map(item => this.renderMenuItem(item, pageKey)).join("")}</nav>
            </aside>
            <section class="workspace">
              <div class="workspace-tabs" id="workspaceTabs"></div>
              <div class="workspace-pages" id="workspacePages"></div>
            </section>
          </div>
        </main>
      </div>
      <div class="drawer-mask" id="drawerMask"></div>
      <div class="modal-mask" id="modalMask"></div>
      <div class="tab-context-menu" id="tabContextMenu"></div>
      <div class="toast" id="toast"></div>
    `;
    this.restoreSidebarOpen(pageKey);
    document.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => CRMRouter.goto(el.dataset.route)));
    document.querySelectorAll("[data-menu-parent]").forEach(el => {
      el.addEventListener("click", () => {
        const section = el.closest(".nav-section");
        section.classList.toggle("open");
        this.persistSidebarOpen();
      });
    });
    this.ensureNotifications();
    this.renderNotificationBadge();
    document.getElementById("notifyBtn").addEventListener("click", e => {
      e.stopPropagation();
      this.toggleNotificationPanel();
    });
    document.getElementById("globalSearchBtn").addEventListener("click", () => {
      CRMUI.toast("搜索面板待接入");
    });
    this.bindUserMenu();
    document.getElementById("notificationEntry").addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", () => this.closeNotificationPanel());
  },
  ensureNotifications() {
    const routeMap = {
      "新线索分配": { route: "leads", params: { id: "l01" } },
      "新客户分配": { route: "customers", params: { id: "c02" } },
      "商机阶段变更": { route: "leads", params: { id: "l02" } },
      "合同到期提醒": { route: "contracts", params: {} },
      "线索状态变更": { route: "leads", params: { id: "l01" } },
      "待跟进超时": { route: "leads", params: { status: "待跟进" } },
      "客户负责人转移": { route: "customers", params: { id: "c02" } },
      "合同创建": { route: "contracts", params: {} },
      "合同状态变更": { route: "contracts", params: {} },
      "邮件未读数量提醒": { route: "email", params: {} },
      "邮件未读超时提醒": { route: "email", params: {} }
    };
    const times = ["刚刚", "10 分钟前", "28 分钟前", "1 小时前", "2 小时前", "今天 09:40", "昨天 18:22", "昨天 15:08", "昨天 11:30", "2026-07-02 16:20", "2026-07-02 10:05"];
    CRM_MOCK.notifications = Array.isArray(CRM_MOCK.notifications) ? CRM_MOCK.notifications : [];
    (CRM_MOCK.notificationRules || []).forEach((rule, index) => {
      const route = routeMap[rule.scene] || { route: "notificationCenter", params: {} };
      const existing = CRM_MOCK.notifications.find(item => item.ruleId === rule.id);
      const payload = {
        ruleId: rule.id,
        scene: rule.scene,
        title: rule.title,
        summary: this.notificationText(rule.body),
        route: route.route,
        params: route.params
      };
      if (existing) Object.assign(existing, payload);
      else CRM_MOCK.notifications.push({
        id: `notice-${rule.id}`,
        ...payload,
        receivedAt: times[index] || "刚刚",
        read: index > 2 || rule.status === "关闭"
      });
    });
  },
  notificationText(html = "") {
    const holder = document.createElement("div");
    holder.innerHTML = html;
    return (holder.textContent || holder.innerText || "").trim();
  },
  unreadNotifications() {
    return (CRM_MOCK.notifications || []).filter(item => !item.read).length;
  },
  renderNotificationBadge() {
    this.ensureNotifications();
    const badge = document.getElementById("notifyBadge");
    if (!badge) return;
    const count = this.unreadNotifications();
    badge.hidden = count === 0;
    badge.textContent = count > 99 ? "99+" : String(count);
  },
  toggleNotificationPanel() {
    const entry = document.getElementById("notificationEntry");
    const trigger = document.getElementById("notifyBtn");
    const isOpen = entry.classList.toggle("open");
    trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) this.renderNotificationPanel();
  },
  closeNotificationPanel() {
    const entry = document.getElementById("notificationEntry");
    const trigger = document.getElementById("notifyBtn");
    if (!entry || !trigger) return;
    entry.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  },
  renderNotificationPanel() {
    this.ensureNotifications();
    const panel = document.getElementById("notificationPopover");
    const notifications = CRM_MOCK.notifications || [];
    panel.innerHTML = `
      <div class="notification-head">
        <strong>通知</strong>
        <button class="link-btn" type="button" id="markAllNotificationsRead">标记全部已读</button>
      </div>
      <div class="notification-list">
        ${notifications.length ? notifications.map(item => `
          <button class="notification-item ${item.read ? "" : "unread"}" type="button" data-notification-id="${item.id}">
            <span class="notification-main">
              <span class="notification-title">${item.title}</span>
              <span class="notification-summary">${item.summary}</span>
              <span class="notification-meta"><span>通知场景：${item.scene}</span><span>接收时间：${item.receivedAt}</span></span>
            </span>
            <span class="notification-state">${item.read ? "已读" : "未读"}</span>
          </button>
        `).join("") : `<div class="notification-empty">暂无通知</div>`}
      </div>
      <div class="notification-foot"><button class="btn" type="button" id="viewAllNotifications">查看全部通知</button></div>
    `;
    document.getElementById("markAllNotificationsRead").addEventListener("click", () => {
      notifications.forEach(item => item.read = true);
      this.renderNotificationBadge();
      this.renderNotificationPanel();
    });
    document.querySelectorAll("[data-notification-id]").forEach(item => item.addEventListener("click", () => this.openNotification(item.dataset.notificationId)));
    document.getElementById("viewAllNotifications").addEventListener("click", () => {
      this.closeNotificationPanel();
      CRMRouter.goto("notificationCenter");
    });
  },
  openNotification(notificationId) {
    const notification = (CRM_MOCK.notifications || []).find(item => item.id === notificationId);
    if (!notification) return;
    notification.read = true;
    this.renderNotificationBadge();
    this.closeNotificationPanel();
    CRMRouter.goto(notification.route, notification.params || {});
  },
  restoreSidebarOpen(pageKey) {
    const saved = window.CRMTabStore?.load().sidebarOpen || {};
    document.querySelectorAll(".nav-section").forEach(section => {
      const key = section.dataset.menuSection;
      if (saved[key] === true) section.classList.add("open");
      if (saved[key] === false) section.classList.remove("open");
      if (section.querySelector(`[data-route="${pageKey}"]`)) section.classList.add("open");
    });
  },
  persistSidebarOpen() {
    if (!window.CRMWorkspace?.state) return;
    const sidebarOpen = {};
    document.querySelectorAll(".nav-section").forEach(section => {
      sidebarOpen[section.dataset.menuSection] = section.classList.contains("open");
    });
    CRMWorkspace.state.sidebarOpen = sidebarOpen;
    CRMTabStore.save(CRMWorkspace.state);
  },
  updateSidebar(pageKey) {
    document.querySelectorAll("[data-route]").forEach(item => item.classList.toggle("active", item.dataset.route === pageKey));
    document.querySelectorAll(".nav-section").forEach(section => {
      if (section.querySelector(`[data-route="${pageKey}"]`)) section.classList.add("open");
    });
    this.persistSidebarOpen();
  },
  bindUserMenu() {
    const menu = document.getElementById("userMenu");
    const trigger = document.getElementById("userMenuTrigger");
    const close = () => {
      menu.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    };
    trigger.addEventListener("click", e => {
      e.stopPropagation();
      const open = menu.classList.toggle("open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", close);
    menu.addEventListener("click", e => e.stopPropagation());
    document.querySelectorAll("[data-user-action]").forEach(item => {
      item.addEventListener("click", () => {
        close();
        const action = item.dataset.userAction;
        if (action === "profile") this.openProfileModal();
        if (action === "password") this.openChangePasswordModal();
        if (action === "bind") this.openBindAccountModal();
        if (action === "logout") CRMAuth.logout();
      });
    });
  },
  openProfileModal() {
    CRMUI.modal("我的资料", `
      <div class="form-grid">
        <div class="form-field"><label>姓名</label><input value="${CRM_MOCK.currentUser.name}" disabled></div>
        <div class="form-field"><label>角色</label><input value="${CRM_MOCK.currentUser.role}" disabled></div>
        <div class="form-field full"><label>管理站点</label><input value="${CRM_MOCK.currentUser.sites.map(CRMUI.siteName).join("、")}" disabled></div>
        <div class="form-field full"><small class="muted">个人中心完整页化（资料可编辑、头像上传等）二期开放；如需修改基本信息，请联系系统管理员在用户管理中维护。</small></div>
      </div>`, () => CRMUI.closeModal());
  },
  // 修改密码（MVP 最小补丁：弹窗形态，校验旧密码 + 新密码二次确认）
  openChangePasswordModal() {
    CRMUI.modal("修改密码", `
      <div class="form-grid">
        <div class="form-field full"><label>当前密码</label><input type="password" name="oldPassword" required placeholder="请输入当前登录密码"></div>
        <div class="form-field full"><label>新密码</label><input type="password" name="newPassword" required placeholder="请输入新密码（不少于 6 位）"></div>
        <div class="form-field full"><label>确认新密码</label><input type="password" name="confirmPassword" required placeholder="请再次输入新密码"></div>
      </div>`, form => {
      const oldPwd = form.get("oldPassword") || "";
      const newPwd = form.get("newPassword") || "";
      const confirmPwd = form.get("confirmPassword") || "";
      if (!oldPwd) return CRMUI.toast("请输入当前密码");
      if (newPwd.length < 6) return CRMUI.toast("新密码不少于 6 位");
      if (newPwd !== confirmPwd) return CRMUI.toast("两次输入的新密码不一致");
      if (newPwd === oldPwd) return CRMUI.toast("新密码不能与当前密码相同");
      // mock：仅记录变更，不持久化（MVP 无真实鉴权后端）
      CRM_MOCK.currentUser.passwordUpdatedAt = "2026-07-05 22:00";
      CRMUI.closeModal();
      CRMUI.toast("密码已修改，下次登录请使用新密码");
    });
  },
  openBindAccountModal() {
    CRMUI.modal("绑定账号", `
      <div class="account-bind-head">
        <div>
          <div class="section-title">个人中心 / 我的账号 / 绑定账号</div>
          <p class="muted">管理当前登录用户自己的邮箱及 WhatsApp 绑定。</p>
        </div>
      </div>
      <div class="tabs account-bind-tabs" id="personalBindTabs">
        <div class="tab active" data-personal-bind-tab="email">邮箱绑定</div>
        <div class="tab" data-personal-bind-tab="whatsapp">WhatsApp 绑定</div>
      </div>
      <div id="personalBindBody"></div>
    `, () => CRMUI.closeModal());
    this.personalBindTab = "email";
    CRMUI.$$("[data-personal-bind-tab]").forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("[data-personal-bind-tab]").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      this.personalBindTab = tab.dataset.personalBindTab;
      this.renderPersonalBindBody();
    }));
    this.renderPersonalBindBody();
  },
  personalEmails() {
    return (CRM_MOCK.personalEmailAccounts || []).filter(item => item.userId === CRM_MOCK.currentUser.id);
  },
  renderPersonalBindBody() {
    this.personalBindTab === "email" ? this.renderPersonalEmailBinding() : this.renderPersonalWhatsappBinding();
  },
  renderPersonalEmailBinding() {
    const rows = this.personalEmails();
    CRMUI.$("#personalBindBody").innerHTML = `
      <div class="toolbar"><button class="btn primary" type="button" id="newPersonalEmail">新增邮箱</button></div>
      ${CRMUI.table([
        { title: "邮箱地址", render: row => row.email },
        { title: "默认邮箱", render: row => row.isDefault ? CRMUI.badge("开启") : `<span class="badge gray">否</span>` },
        { title: "状态", render: row => CRMUI.badge(row.status) },
        { title: "绑定时间", render: row => row.boundAt },
        { title: "操作", render: row => `<button class="btn" type="button" data-personal-email-edit="${row.id}">编辑</button> <button class="btn" type="button" data-personal-email-verify="${row.id}">重新验证</button> ${row.isDefault ? "" : `<button class="btn" type="button" data-personal-email-default="${row.id}">设为默认</button>`} <button class="btn" type="button" data-personal-email-delete="${row.id}">删除</button>` }
      ], rows, "暂无绑定邮箱")}
    `;
    CRMUI.$("#newPersonalEmail").addEventListener("click", () => this.renderPersonalEmailForm());
    CRMUI.$$("[data-personal-email-edit]").forEach(btn => btn.addEventListener("click", () => this.renderPersonalEmailForm(rows.find(item => item.id === btn.dataset.personalEmailEdit))));
    CRMUI.$$("[data-personal-email-verify]").forEach(btn => btn.addEventListener("click", () => this.verifyPersonalEmail(btn.dataset.personalEmailVerify)));
    CRMUI.$$("[data-personal-email-default]").forEach(btn => btn.addEventListener("click", () => this.setDefaultPersonalEmail(btn.dataset.personalEmailDefault)));
    CRMUI.$$("[data-personal-email-delete]").forEach(btn => btn.addEventListener("click", () => this.deletePersonalEmail(btn.dataset.personalEmailDelete)));
  },
  renderPersonalEmailForm(account) {
    CRMUI.$("#personalBindBody").innerHTML = `
      <div class="account-bind-flow">
        <div class="step-row"><span class="step-pill active">1. 填写邮箱</span><span class="step-pill" id="emailVerifyStep">2. 系统验证连接</span><span class="step-pill">3. 完成绑定</span></div>
        <div class="form-grid">
          ${CRMUI.formInput("邮箱地址", "personalEmail", account?.email || "")}
          ${CRMUI.formInput("邮箱授权码", "personalEmailCode", "", "password")}
        </div>
        <input type="hidden" id="personalEmailVerified" value="${account ? "true" : "false"}">
        <div class="toolbar">
          <button class="btn" type="button" id="backPersonalEmailList">返回列表</button>
          <button class="btn" type="button" id="verifyPersonalEmailForm">验证连接</button>
          <button class="btn primary" type="button" id="savePersonalEmail">完成绑定</button>
        </div>
      </div>
    `;
    CRMUI.$("#backPersonalEmailList").addEventListener("click", () => this.renderPersonalEmailBinding());
    CRMUI.$("#verifyPersonalEmailForm").addEventListener("click", () => {
      const email = CRMUI.$("input[name='personalEmail']").value.trim();
      const code = CRMUI.$("input[name='personalEmailCode']").value.trim();
      if (!email || (!account && !code)) return CRMUI.toast("请填写邮箱地址和邮箱授权码");
      CRMUI.$("#personalEmailVerified").value = "true";
      CRMUI.$("#emailVerifyStep").classList.add("active");
      CRMUI.toast("邮箱验证成功");
    });
    CRMUI.$("#savePersonalEmail").addEventListener("click", () => this.savePersonalEmail(account));
  },
  savePersonalEmail(account) {
    const email = CRMUI.$("input[name='personalEmail']").value.trim();
    if (!email) return CRMUI.toast("请填写邮箱地址");
    if (CRMUI.$("#personalEmailVerified").value !== "true") return CRMUI.toast("请先完成邮箱验证");
    if (account) {
      account.email = email;
      account.status = "已验证";
    } else {
      const isFirst = this.personalEmails().length === 0;
      (CRM_MOCK.personalEmailAccounts || (CRM_MOCK.personalEmailAccounts = [])).unshift({ id: `pe${Date.now()}`, userId: CRM_MOCK.currentUser.id, email, isDefault: isFirst, status: "已验证", boundAt: "2026-07-03 18:10" });
    }
    CRMUI.toast("邮箱绑定已保存");
    this.renderPersonalEmailBinding();
  },
  verifyPersonalEmail(emailId) {
    const account = this.personalEmails().find(item => item.id === emailId);
    account.status = "已验证";
    CRMUI.toast("邮箱重新验证成功");
    this.renderPersonalEmailBinding();
  },
  setDefaultPersonalEmail(emailId) {
    this.personalEmails().forEach(item => item.isDefault = item.id === emailId);
    CRMUI.toast("默认邮箱已更新");
    this.renderPersonalEmailBinding();
  },
  deletePersonalEmail(emailId) {
    CRM_MOCK.personalEmailAccounts = (CRM_MOCK.personalEmailAccounts || []).filter(item => item.id !== emailId);
    const rows = this.personalEmails();
    if (rows.length && !rows.some(item => item.isDefault)) rows[0].isDefault = true;
    CRMUI.toast("邮箱绑定已删除");
    this.renderPersonalEmailBinding();
  },
  personalWhatsapp() {
    const account = CRM_MOCK.personalWhatsappAccount;
    return account && account.userId === CRM_MOCK.currentUser.id ? account : null;
  },
  renderPersonalWhatsappBinding() {
    const account = this.personalWhatsapp();
    CRMUI.$("#personalBindBody").innerHTML = account ? `
      ${CRMUI.table([
        { title: "WhatsApp 账号", render: row => row.account },
        { title: "绑定状态", render: row => CRMUI.badge(row.status) },
        { title: "最近同步时间", render: row => row.lastSyncAt || "-" },
        { title: "操作", render: () => `<button class="btn" type="button" id="reauthorizeWhatsapp">重新授权</button> <button class="btn" type="button" id="unbindWhatsapp">解绑</button>` }
      ], [account])}
    ` : `
      <div class="card pad account-empty">
        <div class="section-title">未绑定 WhatsApp 账号</div>
        <p class="muted">一个用户仅允许绑定一个 WhatsApp 账号。</p>
        <button class="btn primary" type="button" id="bindWhatsapp">绑定 WhatsApp</button>
      </div>
    `;
    const bind = CRMUI.$("#bindWhatsapp");
    if (bind) bind.addEventListener("click", () => this.renderWhatsappQrFlow());
    const reauthorize = CRMUI.$("#reauthorizeWhatsapp");
    if (reauthorize) reauthorize.addEventListener("click", () => this.renderWhatsappQrFlow(true));
    const unbind = CRMUI.$("#unbindWhatsapp");
    if (unbind) unbind.addEventListener("click", () => {
      CRM_MOCK.personalWhatsappAccount = null;
      CRMUI.toast("WhatsApp 已解绑");
      this.renderPersonalWhatsappBinding();
    });
  },
  renderWhatsappQrFlow(isReauth = false) {
    CRMUI.$("#personalBindBody").innerHTML = `
      <div class="account-bind-flow">
        <div class="step-row"><span class="step-pill active">1. 生成二维码</span><span class="step-pill active">2. 扫码授权</span><span class="step-pill">3. 绑定成功</span></div>
        <div class="whatsapp-qr">
          <div class="qr-box"><span>WA</span></div>
          <div>
            <div class="section-title">${isReauth ? "重新授权 WhatsApp" : "绑定 WhatsApp"}</div>
            <p class="muted">请使用 WhatsApp 扫描二维码完成授权。</p>
            <div class="toolbar">
              <button class="btn" type="button" id="backWhatsappList">返回</button>
              <button class="btn primary" type="button" id="finishWhatsappAuth">模拟扫码授权成功</button>
            </div>
          </div>
        </div>
      </div>
    `;
    CRMUI.$("#backWhatsappList").addEventListener("click", () => this.renderPersonalWhatsappBinding());
    CRMUI.$("#finishWhatsappAuth").addEventListener("click", () => {
      CRM_MOCK.personalWhatsappAccount = { id: "pwa01", userId: CRM_MOCK.currentUser.id, account: "+1 650-123-4567", status: "已绑定", lastSyncAt: "2026-07-03 18:10", boundAt: "2026-07-03 18:10" };
      CRMUI.toast("WhatsApp 授权成功");
      this.renderPersonalWhatsappBinding();
    });
  },
  renderMenuItem(item, pageKey) {
    if (!item.children) {
      return `<div class="nav-item ${item.key === pageKey ? "active" : ""}" data-route="${item.key}" title="${item.label}">
        <span>${item.icon}</span><span class="nav-label">${item.label}</span>
      </div>`;
    }
    const open = item.children.some(child => child.key === pageKey);
    return `<div class="nav-section ${open ? "open" : ""}" data-menu-section="${item.label}">
      <div class="nav-parent" data-menu-parent>
        <span>${item.icon}</span><span class="nav-label">${item.label}</span><span class="nav-caret">⌄</span>
      </div>
      <div class="nav-children">
        ${item.children.map(child => `<div class="nav-child ${child.key === pageKey ? "active" : ""}" data-route="${child.key}" title="${child.label}"><span class="nav-label">${child.label}</span></div>`).join("")}
      </div>
    </div>`;
  }
};
