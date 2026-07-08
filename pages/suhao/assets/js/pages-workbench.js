window.CRMWorkbenchPage = {
  render(root) {
    const role = this.workbenchRole();
    root.innerHTML = `
      <div class="filters">
        <select id="timeRange"><option>当天</option><option>本周</option><option>本月</option><option>自定义</option></select>
        <select id="siteFilter"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select>
        <button class="btn" id="refreshWorkbench">刷新数据</button>
        <span class="muted" style="margin-left:auto">${this.roleLabel(role)}视图${this.isFallbackRole(role) ? "（二期前按运营专员视图渲染）" : ""}</span>
      </div>
      <div class="grid metric-grid-6" id="metricGrid"></div>
      <div class="card pad" style="margin-top:16px">
        <div class="card-title">今日待办</div>
        <div class="grid cols-4" id="todoGrid"></div>
      </div>
      <div class="card pad" style="margin-top:12px">
        <div class="card-title">风险预警</div>
        <div class="grid cols-4" id="alertGrid"></div>
      </div>
      <div class="grid cols-4" style="margin-top:16px">
        ${[
          ["公海池", "回收线索再分配", "publicPool", ""],
          ["线索列表", "跟进、打标、转高意向客户", "leads", ""],
          ["客户列表", "客户资产沉淀", "customers", ""],
          ["合同中心", "成交合同与追溯", "contracts", ""]
        ].map(item => `<div class="card metric" data-quick="${item[2]}" data-query="${item[3]}"><div class="metric-label">${item[0]}</div><div class="metric-foot">${item[1]}</div></div>`).join("")}
      </div>
    `;
    this.renderMetrics();
    this.renderTodoAndAlerts(role);
    CRMUI.$$("#timeRange,#siteFilter").forEach(el => el.addEventListener("change", () => {
      CRMUI.toast("工作台数据已按筛选条件刷新");
      this.renderMetrics();
      this.renderTodoAndAlerts(role);
      this.bindCardRoutes();
    }));
    CRMUI.$("#refreshWorkbench").addEventListener("click", () => CRMUI.toast("工作台数据已刷新"));
    CRMUI.$$("[data-quick]").forEach(el => {
      el.addEventListener("click", () => {
        const params = Object.fromEntries(new URLSearchParams(el.dataset.query).entries());
        CRMRouter.goto(el.dataset.quick, params);
      });
    });
    this.bindCardRoutes();
  },
  // MVP 仅实现业务员/运营专员视图；协同人/系统管理员按运营专员视图兜底（PRD §4.12）
  workbenchRole() {
    const role = CRM_MOCK.currentUser?.role;
    return role === "业务员" ? "业务员" : "运营专员";
  },
  roleLabel(role) { return role; },
  isFallbackRole(role) { return CRM_MOCK.currentUser?.role !== "业务员" && CRM_MOCK.currentUser?.role !== "运营专员"; },
  parseQuery(q) { return Object.fromEntries(new URLSearchParams(q || "").entries()); },
  bindCardRoutes() {
    CRMUI.$$("[data-todo-route]").forEach(el => el.addEventListener("click", () => CRMRouter.goto(el.dataset.todoRoute, this.parseQuery(el.dataset.todoQuery))));
    CRMUI.$$("[data-alert-route]").forEach(el => el.addEventListener("click", () => CRMRouter.goto(el.dataset.alertRoute, this.parseQuery(el.dataset.alertQuery))));
  },
  siteScope() {
    const siteId = CRMUI.$("#siteFilter")?.value || "";
    return siteId;
  },
  myLeads() {
    const siteId = this.siteScope();
    return CRM_MOCK.leads.filter(l => l.ownerId === CRM_MOCK.currentUser.id && (!siteId || l.siteId === siteId));
  },
  teamLeads() {
    const siteId = this.siteScope();
    // 运营专员本团队：简化为同站点线索（MVP 无团队结构，按站点收敛）
    return CRM_MOCK.leads.filter(l => (!siteId || l.siteId === siteId));
  },
  unreadEmails() {
    return (CRM_MOCK.emails || []).filter(m => m.folder === "inbox" && m.read === false).length;
  },
  newLeadCount(leads) {
    const today = new Date().toISOString().slice(0, 10);
    return leads.filter(l => String(l.createdAt || "").startsWith(today)).length;
  },
  pendingReplyCount(leads) {
    const leadIds = new Set(leads.filter(l => !["已成交", "无效", "丢失"].includes(l.status)).map(l => l.id));
    const pending = new Set();
    (CRM_MOCK.emails || []).forEach(mail => {
      if (mail.folder === "inbox" && mail.leadId && leadIds.has(mail.leadId) && mail.read === false) pending.add(mail.leadId);
    });
    (CRM_MOCK.whatsappConversations || []).forEach(conversation => {
      if (conversation.leadId && leadIds.has(conversation.leadId) && Number(conversation.unreadCount || 0) > 0) pending.add(conversation.leadId);
    });
    return pending.size;
  },
  renderTodoAndAlerts(role) {
    const isSales = role === "业务员";
    const scopeLeads = isSales ? this.myLeads() : this.teamLeads();
    const todoCards = isSales ? [
      { label: "新增线索", value: this.newLeadCount(scopeLeads), route: "leads", query: "created=today", foot: "本人线索" },
      { label: "待回复线索", value: this.pendingReplyCount(scopeLeads), route: "leads", query: "reply=pending", foot: "关联消息未回复" },
      { label: "邮件未读", value: this.unreadEmails(), route: "email", query: "", foot: "本人邮箱" },
      { label: "跟进超时", value: scopeLeads.filter(l => l.nextFollowAt && !["已成交", "无效", "丢失"].includes(l.status)).length, route: "leads", query: "overdue=1", foot: "本人线索" }
    ] : [
      { label: "待分配", value: CRM_MOCK.leads.filter(l => l.status === "待分配" && (!this.siteScope() || l.siteId === this.siteScope())).length, route: "publicPool", query: "", foot: "负责站点" },
      { label: "待回复线索", value: this.pendingReplyCount(scopeLeads), route: "leads", query: "reply=pending", foot: "本团队" },
      { label: "邮件未读", value: this.unreadEmails(), route: "email", query: "", foot: "本人邮箱" },
      { label: "跟进超时", value: scopeLeads.filter(l => l.nextFollowAt && !["已成交", "无效", "丢失"].includes(l.status)).length, route: "leads", query: "overdue=1", foot: "本团队" }
    ];
    const alertCards = isSales ? [
      { label: "无效·丢失线索", value: scopeLeads.filter(l => l.status === "无效" || l.status === "丢失").length, route: "leads", query: "statusGroup=invalidLost", foot: "仅本人" },
      { label: "超期回收线索", value: CRM_MOCK.leads.filter(l => l.status === "待分配" && l.poolReason === "超期回收").length, route: "publicPool", query: "", foot: "仅本人" },
      { label: "异常站点", value: CRM_MOCK.sites.filter(s => s.status === "停用" && (!this.siteScope() || s.id === this.siteScope())).length, route: "sites", query: "", foot: "授权站点" }
    ] : [
      { label: "无效·丢失线索", value: scopeLeads.filter(l => l.status === "无效" || l.status === "丢失").length, route: "leads", query: "statusGroup=invalidLost", foot: "本团队" },
      { label: "超期回收线索", value: CRM_MOCK.leads.filter(l => l.status === "待分配" && l.poolReason === "超期回收").length, route: "publicPool", query: "", foot: "负责站点" },
      { label: "异常站点", value: CRM_MOCK.sites.filter(s => s.status === "停用" && (!this.siteScope() || s.id === this.siteScope())).length, route: "sites", query: "", foot: "负责站点" }
    ];
    const renderCards = cards => cards.map(c => `
      <div class="card metric" ${c.route ? `data-todo-route="${c.route}" data-todo-query="${c.query}"` : ""} style="${c.route ? "cursor:pointer" : ""}">
        <div class="metric-label">${c.label}</div>
        <div class="metric-value">${c.value}</div>
        <div class="metric-foot">${c.foot}</div>
      </div>
    `).join("");
    CRMUI.$("#todoGrid").innerHTML = renderCards(todoCards);
    const renderAlertCards = cards => cards.map(c => `
      <div class="card metric" ${c.route ? `data-alert-route="${c.route}" data-alert-query="${c.query}"` : ""} style="${c.route ? "cursor:pointer" : ""}">
        <div class="metric-label">${c.label}</div>
        <div class="metric-value">${c.value}</div>
        <div class="metric-foot">${c.foot}</div>
      </div>
    `).join("");
    CRMUI.$("#alertGrid").innerHTML = renderAlertCards(alertCards);
  },
  renderMetrics() {
    const role = this.workbenchRole();
    const isSales = role === "业务员";
    const leads = isSales ? this.myLeads() : this.teamLeads();
    const siteId = this.siteScope();
    const customers = CRM_MOCK.customers.filter(customer => (!siteId || customer.siteId === siteId) && (!isSales || customer.ownerId === CRM_MOCK.currentUser.id));
    const contracts = CRM_MOCK.contracts.filter(contract => (!isSales || contract.ownerId === CRM_MOCK.currentUser.id));
    const metrics = [
      { label: isSales ? "我的线索" : "团队线索", value: leads.length, foot: "按当前站点筛选", route: "leads" },
      { label: isSales ? "我的客户" : "客户总数", value: customers.length, foot: "客户资产", route: "customers" },
      { label: isSales ? "我的合同" : "合同总数", value: contracts.length, foot: "合同记录", route: "contracts" },
      { label: "成交金额", value: `¥${contracts.reduce((s, c) => s + c.amount, 0).toLocaleString()}`, foot: "合同金额汇总", route: "contracts" },
      { label: "公海线索", value: CRM_MOCK.leads.filter(l => l.status === "待分配" && (!siteId || l.siteId === siteId)).length, foot: "待分配", route: "publicPool" },
      { label: "启用站点", value: CRM_MOCK.sites.filter(s => s.status === "启用" && (!siteId || s.id === siteId)).length, foot: "消息接入范围", route: "sites" }
    ];
    CRMUI.$("#metricGrid").innerHTML = metrics.map(m => `
      <div class="card metric" data-route="${m.route}">
        <div class="metric-label">${m.label}</div>
        <div class="metric-value">${m.value}</div>
        <div class="metric-foot">${m.foot}</div>
      </div>
    `).join("");
    CRMUI.$$("[data-route]", CRMUI.$("#metricGrid")).forEach(el => el.addEventListener("click", () => CRMRouter.goto(el.dataset.route)));
  },
  renderCharts() {
    CRMUI.createChart("funnelChart", "bar", {
      labels: ["全部消息", "识别为线索", "跟进中", "已转客户", "已成交"],
      datasets: [{ label: "数量", data: CRM_MOCK.analytics.funnel, backgroundColor: ["#0756d8", "#3f7fe7", "#77a5ef", "#a8c3f2", "#d6e3fa"] }]
    }, { indexAxis: "y" });
    CRMUI.createChart("amountChart", "line", {
      labels: CRM_MOCK.analytics.months,
      datasets: [{ label: "成交额(百万)", data: CRM_MOCK.analytics.amountTrend, borderColor: "#0756d8", backgroundColor: "rgba(7,86,216,.12)", fill: true, tension: .35 }]
    });
  }
};
