window.CRMRouter = {
  routes: {
    workbench: "workbench.html",
    leads: "leads.html?view=list",
    publicPool: "leads.html?view=pool",
    customers: "customers.html?view=list",
    contracts: "customers.html?view=contracts",
    email: "email.html",
    whatsapp: "whatsapp.html",
    analyticsSales: "analytics.html?view=sales",
    analyticsAcquisition: "analytics.html?view=acquisition",
    analyticsCustomer: "analytics.html?view=customer",
    sites: "ai.html?view=sites",
    ai: "ai.html?view=ai",
    notificationCenter: "ai.html?view=notification-center",
    systemUsers: "ai.html?view=system-users",
    systemRoles: "ai.html?view=system-roles",
    systemMenus: "ai.html?view=system-menus",
    systemDicts: "ai.html?view=system-dicts",
    paramSettings: "ai.html?view=param-settings",
    systemParams: "ai.html?view=system-params",
    systemCommunicationConfig: "ai.html?view=system-communication-config",
    systemConfig: "ai.html?view=system-config",
    systemLogs: "ai.html?view=system-logs"
  },
  titles: {
    workbench: "工作台",
    leads: "线索列表",
    publicPool: "公海池",
    customers: "客户列表",
    contracts: "合同中心",
    email: "邮件中心",
    whatsapp: "WhatsApp",
    analyticsSales: "销售经营",
    analyticsAcquisition: "获客分析",
    analyticsCustomer: "客户经营",
    sites: "站点管理",
    ai: "AI 能力管理",
    notificationCenter: "通知中心",
    systemUsers: "用户管理",
    systemRoles: "角色管理",
    systemMenus: "菜单管理",
    systemDicts: "字典管理",
    paramSettings: "参数设置",
    systemParams: "系统参数",
    systemCommunicationConfig: "沟通服务协议配置",
    systemConfig: "系统配置",
    systemLogs: "系统日志"
  },
  meta: {
    workbench: { title: "工作台", page: "workbench", fixed: true, keepAlive: true },
    leads: { title: "线索列表", page: "leads", parent: "线索中心", keepAlive: true },
    publicPool: { title: "公海池", page: "leads", parent: "线索中心", keepAlive: true },
    customers: { title: "客户列表", page: "customers", parent: "客户中心", keepAlive: true },
    contracts: { title: "合同中心", page: "customers", parent: "客户中心", keepAlive: true },
    email: { title: "邮件中心", page: "email", parent: "沟通中心", keepAlive: true },
    whatsapp: { title: "WhatsApp", page: "whatsapp", parent: "沟通中心", keepAlive: true },
    analyticsSales: { title: "销售经营", page: "analytics", parent: "分析中心", keepAlive: true },
    analyticsAcquisition: { title: "获客分析", page: "analytics", parent: "分析中心", keepAlive: true },
    analyticsCustomer: { title: "客户经营", page: "analytics", parent: "分析中心", keepAlive: true },
    sites: { title: "站点管理", page: "ai", parent: "站点中心", keepAlive: true },
    ai: { title: "AI 能力管理", page: "ai", keepAlive: true },
    notificationCenter: { title: "通知中心", page: "ai", parent: "通知管理", keepAlive: true },
    systemUsers: { title: "用户管理", page: "ai", parent: "系统管理", keepAlive: true },
    systemRoles: { title: "角色管理", page: "ai", parent: "系统管理", keepAlive: true },
    systemMenus: { title: "菜单管理", page: "ai", parent: "系统管理", keepAlive: true },
    systemDicts: { title: "字典管理", page: "ai", parent: "系统管理", keepAlive: true },
    paramSettings: { title: "参数设置", page: "ai", parent: "系统管理", keepAlive: true },
    systemParams: { title: "系统参数", page: "ai", parent: "系统管理", keepAlive: true },
    systemCommunicationConfig: { title: "沟通服务协议配置", page: "ai", parent: "系统管理", keepAlive: true },
    systemConfig: { title: "系统配置", page: "ai", parent: "系统管理", keepAlive: true },
    systemLogs: { title: "系统日志", page: "ai", parent: "系统管理", keepAlive: true }
  },
  goto(name, params = {}) {
    if (window.CRMWorkspace?.ready) {
      window.CRMWorkspace.open(name, params);
      return;
    }
    const url = this.routes[name] || this.routes.workbench;
    const [path, existing = ""] = url.split("?");
    const query = new URLSearchParams(existing);
    Object.entries(params).forEach(([key, value]) => query.set(key, value));
    const qs = query.toString();
    window.location.href = qs ? `${path}?${qs}` : path;
  },
  query() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
  },
  routeUrl(name, params = {}) {
    const url = this.routes[name] || this.routes.workbench;
    const [path, existing = ""] = url.split("?");
    const query = new URLSearchParams(existing);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const qs = query.toString();
    return qs ? `${path}?${qs}` : path;
  },
  routeIdentity(name, params = {}) {
    const url = this.routeUrl(name, params);
    const [path, search = ""] = url.split("?");
    const query = new URLSearchParams(search);
    const view = query.get("view");
    if (view) query.delete("view");
    const suffix = query.toString();
    return suffix ? `${name}?${suffix}` : name;
  },
  pageForKey(routeKey) {
    return this.meta[routeKey]?.page || routeKey;
  },
  routeFromLocation(basePage = document.body.dataset.page || "workbench") {
    const key = this.currentKey(basePage);
    return this.createRoute(key, Object.fromEntries(new URLSearchParams(window.location.search).entries()));
  },
  createRoute(name, params = {}) {
    const meta = this.meta[name] || { title: this.titles[name] || name, page: this.pageForKey(name), keepAlive: true };
    const url = this.routeUrl(name, params);
    return {
      id: this.routeIdentity(name, params),
      key: name,
      page: meta.page || this.pageForKey(name),
      title: meta.title || this.titles[name] || name,
      parent: meta.parent || "",
      fixed: Boolean(meta.fixed),
      keepAlive: meta.keepAlive !== false,
      url
    };
  },
  currentKey(basePage) {
    const view = this.query().view;
    const map = {
      leads: { pool: "publicPool", list: "leads" },
      customers: { contracts: "contracts", list: "customers" },
      analytics: { acquisition: "analyticsAcquisition", customer: "analyticsCustomer", sales: "analyticsSales" },
      ai: {
        sites: "sites",
        ai: "ai",
        "notification-center": "notificationCenter",
        "system-users": "systemUsers",
        "system-roles": "systemRoles",
        "system-menus": "systemMenus",
        "system-dicts": "systemDicts",
        "param-settings": "paramSettings",
        "system-params": "systemParams",
        "system-communication-config": "systemCommunicationConfig",
        "system-config": "systemConfig",
        "system-logs": "systemLogs"
      }
    };
    return map[basePage]?.[view] || basePage;
  }
};
