window.CRMTabStore = {
  storageKey: "suhao_crm_workspace",
  defaults() {
    const home = CRMRouter.createRoute("workbench");
    return {
      tabs: [home],
      activeId: home.id,
      sidebarOpen: {},
      fixedIds: [home.id],
      keepAliveIds: [home.id],
      selectedMenu: home.key
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return this.defaults();
      const state = { ...this.defaults(), ...JSON.parse(raw) };
      state.tabs = Array.isArray(state.tabs) && state.tabs.length ? state.tabs : this.defaults().tabs;
      state.fixedIds = Array.from(new Set([...(state.fixedIds || []), "workbench"]));
      state.keepAliveIds = Array.from(new Set(state.tabs.filter(tab => tab.keepAlive).map(tab => tab.id)));
      if (!state.tabs.some(tab => tab.id === "workbench")) state.tabs.unshift(CRMRouter.createRoute("workbench"));
      if (!state.tabs.some(tab => tab.id === state.activeId)) state.activeId = state.tabs[0].id;
      return state;
    } catch (error) {
      return this.defaults();
    }
  },
  save(state) {
    localStorage.setItem(this.storageKey, JSON.stringify({
      tabs: state.tabs,
      activeId: state.activeId,
      sidebarOpen: state.sidebarOpen,
      fixedIds: state.fixedIds,
      keepAliveIds: state.keepAliveIds,
      selectedMenu: state.selectedMenu
    }));
  }
};

window.CRMWorkspace = {
  ready: false,
  state: null,
  pageMap: {},
  contextTabId: "",
  scrollPositions: {},
  init(initialRoute, pageMap) {
    this.pageMap = pageMap;
    this.state = CRMTabStore.load();
    const incoming = initialRoute || CRMRouter.createRoute("workbench");
    const shouldUseIncoming = incoming.key !== "workbench" || !this.state.activeId;
    if (!this.state.tabs.some(tab => tab.id === incoming.id)) this.state.tabs.push(incoming);
    if (shouldUseIncoming) this.state.activeId = incoming.id;
    this.state.tabs = this.state.tabs.map(tab => ({ ...CRMRouter.createRoute(tab.key, this.paramsFromUrl(tab.url)), ...tab }));
    this.ready = true;
    this.bindWorkspaceEvents();
    this.renderTabs();
    this.activate(this.state.activeId, { replace: true });
  },
  paramsFromUrl(url) {
    const search = url.split("?")[1] || "";
    return Object.fromEntries(new URLSearchParams(search).entries());
  },
  activeTab() {
    return this.state.tabs.find(tab => tab.id === this.state.activeId) || this.state.tabs[0];
  },
  activeRoot() {
    return document.querySelector(`.workspace-page.active`);
  },
  open(routeKey, params = {}) {
    const route = CRMRouter.createRoute(routeKey, params);
    if (!this.state.tabs.some(tab => tab.id === route.id)) this.state.tabs.push(route);
    this.activate(route.id);
  },
  activate(tabId, options = {}) {
    const tab = this.state.tabs.find(item => item.id === tabId) || this.state.tabs[0];
    if (!tab) return;
    this.saveActiveScroll();
    this.state.activeId = tab.id;
    this.state.selectedMenu = tab.key;
    if (tab.keepAlive && !this.state.keepAliveIds.includes(tab.id)) this.state.keepAliveIds.push(tab.id);
    this.renderTabs();
    this.renderPage(tab);
    this.updateShell(tab);
    CRMTabStore.save(this.state);
    if (options.replace) window.history.replaceState({ tabId: tab.id }, "", tab.url);
    else window.history.pushState({ tabId: tab.id }, "", tab.url);
  },
  renderPage(tab) {
    const host = document.getElementById("workspacePages");
    let page = document.getElementById(this.pageElementId(tab.id));
    if (!page) {
      page = document.createElement("section");
      page.id = this.pageElementId(tab.id);
      page.className = "workspace-page";
      page.dataset.tabId = tab.id;
      host.appendChild(page);
    }
    document.querySelectorAll(".workspace-page").forEach(item => item.classList.toggle("active", item.dataset.tabId === tab.id));
    if (!tab.keepAlive || !page.dataset.rendered) {
      page.innerHTML = "";
      const renderer = this.pageMap[tab.page];
      if (renderer) renderer.render(page, tab.page, tab.key);
      page.dataset.rendered = "true";
    }
    page.scrollTop = this.scrollPositions[tab.id] || 0;
  },
  pageElementId(tabId) {
    return `workspace-page-${tabId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  },
  renderTabs() {
    const tabs = document.getElementById("workspaceTabs");
    if (!tabs) return;
    tabs.innerHTML = this.state.tabs.map(tab => `
      <button class="workspace-tab ${tab.id === this.state.activeId ? "active" : ""} ${tab.fixed ? "fixed" : ""}"
        type="button" data-workspace-tab="${tab.id}" title="${tab.title}">
        <span class="workspace-tab-title">${tab.title}</span>
        ${tab.fixed ? `<span class="workspace-tab-pin">固定</span>` : `<span class="workspace-tab-close" data-close-tab="${tab.id}">×</span>`}
      </button>
    `).join("");
    tabs.querySelectorAll("[data-workspace-tab]").forEach(tabEl => {
      tabEl.addEventListener("click", event => {
        if (event.target.closest("[data-close-tab]")) return;
        this.activate(tabEl.dataset.workspaceTab);
      });
      tabEl.addEventListener("auxclick", event => {
        if (event.button === 1) this.close(tabEl.dataset.workspaceTab);
      });
      tabEl.addEventListener("dblclick", () => this.refresh(tabEl.dataset.workspaceTab));
      tabEl.addEventListener("contextmenu", event => this.openContextMenu(event, tabEl.dataset.workspaceTab));
    });
    tabs.querySelectorAll("[data-close-tab]").forEach(btn => btn.addEventListener("click", event => {
      event.stopPropagation();
      this.close(btn.dataset.closeTab);
    }));
  },
  updateShell(tab) {
    document.title = `${tab.title} - AI 智能 CRM`;
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) breadcrumb.innerHTML = this.breadcrumb(tab).map(item => `<span>${item}</span>`).join("<span class=\"breadcrumb-sep\">/</span>");
    CRMLayout.updateSidebar(["leadDetail", "followLogs", "publicPool"].includes(tab.key) ? "leads" : (tab.key === "customerDetail" ? "customers" : tab.key));
  },
  breadcrumb(tab) {
    return ["首页", tab.parent, tab.title].filter(Boolean);
  },
  saveActiveScroll() {
    const root = this.activeRoot();
    if (root?.dataset.tabId) this.scrollPositions[root.dataset.tabId] = root.scrollTop;
  },
  refresh(tabId = this.state.activeId) {
    const tab = this.state.tabs.find(item => item.id === tabId);
    const page = document.getElementById(this.pageElementId(tabId));
    if (!tab || !page) return;
    page.innerHTML = "";
    page.dataset.rendered = "";
    this.scrollPositions[tabId] = 0;
    this.activate(tabId, { replace: true });
    CRMUI.toast(`${tab.title}已刷新`);
  },
  close(tabId) {
    const tab = this.state.tabs.find(item => item.id === tabId);
    if (!tab || tab.fixed) return;
    const index = this.state.tabs.findIndex(item => item.id === tabId);
    this.state.tabs = this.state.tabs.filter(item => item.id !== tabId);
    this.state.keepAliveIds = this.state.keepAliveIds.filter(id => id !== tabId);
    document.getElementById(this.pageElementId(tabId))?.remove();
    if (this.state.activeId === tabId) {
      const next = this.state.tabs[Math.max(0, index - 1)] || this.state.tabs[0];
      this.activate(next.id, { replace: true });
    } else {
      this.renderTabs();
      CRMTabStore.save(this.state);
    }
  },
  closeMany(mode, tabId = this.contextTabId) {
    const index = this.state.tabs.findIndex(tab => tab.id === tabId);
    const keep = tab => tab.fixed || tab.id === tabId;
    let removable = [];
    if (mode === "other") removable = this.state.tabs.filter(tab => !keep(tab));
    if (mode === "left") removable = this.state.tabs.filter((tab, i) => i < index && !tab.fixed);
    if (mode === "right") removable = this.state.tabs.filter((tab, i) => i > index && !tab.fixed);
    if (mode === "all") removable = this.state.tabs.filter(tab => !tab.fixed);
    removable.forEach(tab => document.getElementById(this.pageElementId(tab.id))?.remove());
    const removeIds = new Set(removable.map(tab => tab.id));
    this.state.tabs = this.state.tabs.filter(tab => !removeIds.has(tab.id));
    this.state.keepAliveIds = this.state.keepAliveIds.filter(id => !removeIds.has(id));
    if (!this.state.tabs.some(tab => tab.id === this.state.activeId)) {
      this.state.activeId = this.state.tabs.find(tab => tab.id === tabId)?.id || "workbench";
    }
    this.activate(this.state.activeId, { replace: true });
    this.closeContextMenu();
  },
  openContextMenu(event, tabId) {
    event.preventDefault();
    this.contextTabId = tabId;
    const menu = document.getElementById("tabContextMenu");
    const tab = this.state.tabs.find(item => item.id === tabId);
    menu.innerHTML = `
      <button type="button" data-tab-action="refresh">刷新当前</button>
      <button type="button" data-tab-action="close" ${tab.fixed ? "disabled" : ""}>关闭当前</button>
      <button type="button" data-tab-action="other">关闭其它</button>
      <button type="button" data-tab-action="left">关闭左侧</button>
      <button type="button" data-tab-action="right">关闭右侧</button>
      <button type="button" data-tab-action="all">全部关闭</button>
    `;
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.classList.add("show");
    menu.querySelectorAll("[data-tab-action]").forEach(btn => btn.addEventListener("click", () => {
      const action = btn.dataset.tabAction;
      if (action === "refresh") this.refresh(tabId);
      if (action === "close") this.close(tabId);
      if (["other", "left", "right", "all"].includes(action)) this.closeMany(action, tabId);
      this.closeContextMenu();
    }));
  },
  closeContextMenu() {
    document.getElementById("tabContextMenu")?.classList.remove("show");
  },
  bindWorkspaceEvents() {
    document.addEventListener("click", event => {
      if (!event.target.closest("#tabContextMenu")) this.closeContextMenu();
    });
    window.addEventListener("popstate", () => {
      const route = CRMRouter.routeFromLocation(document.body.dataset.page || "workbench");
      if (!this.state.tabs.some(tab => tab.id === route.id)) this.state.tabs.push(route);
      this.activate(route.id, { replace: true });
    });
  }
};
