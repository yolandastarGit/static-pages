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
    systemParams: "ai.html?view=system-params",
    systemCommunicationConfig: "ai.html?view=system-communication-config",
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
    systemParams: "系统参数",
    systemCommunicationConfig: "沟通服务协议配置",
    systemLogs: "系统日志"
  },
  goto(name, params = {}) {
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
        "system-params": "systemParams",
        "system-communication-config": "systemCommunicationConfig",
        "system-logs": "systemLogs"
      }
    };
    return map[basePage]?.[view] || basePage;
  }
};
