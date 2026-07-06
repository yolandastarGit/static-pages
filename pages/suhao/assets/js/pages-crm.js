window.CRMCrmPage = {
  render(root, page, routeKey) {
    if (page === "leads" && routeKey === "publicPool") return this.renderPublicPool(root);
    if (page === "customers" && routeKey === "contracts") return this.renderContracts(root);
    page === "leads" ? this.renderLeads(root) : this.renderCustomers(root);
  },
  renderLeads(root) {
    const q = CRMRouter.query();
    const tabs = ["全部", "待跟进", "跟进中", "高意向", "已成交", "无效", "丢失"];
    this.leadState = { status: tabs.includes(q.status) ? q.status : "全部", query: q.q || "", siteId: "", purchaseIntent: "", selected: new Set() };
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newLead">新增线索</button>
        <button class="btn" id="bulkConvert">转高意向客户</button>
        ${this.canRecycle() ? `<button class="btn" id="bulkRecycle">批量回收至公海</button>` : ""}
        <button class="btn" id="globalFollowLogs">跟进日志</button>
      </div>
      <div class="tabs" id="leadTabs">${tabs.map(s => `<div class="tab ${s === this.leadState.status ? "active" : ""}" data-status="${s}">${s}</div>`).join("")}</div>
      <div class="filters">
        <input id="leadSearch" value="${this.leadState.query}" placeholder="搜索编号、企业、联系人、采购意向">
        <select id="leadSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select>
        <select><option>全部阶段</option><option>待首响</option><option>需求确认</option><option>报价</option></select>
        <select id="leadIntent"><option value="">全部采购意向</option>${(CRM_MOCK.purchaseIntentOptions || []).map(item => `<option>${item}</option>`).join("")}</select>
        <select><option>全部产品</option><option>CNC 铝件</option><option>毛绒玩具</option></select>
        <button class="btn" id="leadReset">重置</button>
      </div>
      <div id="leadTable"></div>
    `;
    CRMUI.$$(".tab").forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      this.leadState.status = tab.dataset.status;
      this.renderLeadTable();
    }));
    CRMUI.$("#leadSearch").addEventListener("input", e => { this.leadState.query = e.target.value.toLowerCase(); this.renderLeadTable(); });
    CRMUI.$("#leadSite").addEventListener("change", e => { this.leadState.siteId = e.target.value; this.renderLeadTable(); });
    CRMUI.$("#leadIntent").addEventListener("change", e => { this.leadState.purchaseIntent = e.target.value; this.renderLeadTable(); });
    CRMUI.$("#leadReset").addEventListener("click", () => { this.leadState = { status: "全部", query: "", siteId: "", purchaseIntent: "", selected: new Set() }; this.renderLeads(root); });
    CRMUI.$("#newLead").addEventListener("click", () => this.openLeadModal());
    CRMUI.$("#bulkConvert").addEventListener("click", () => this.convertSelectedLeads());
    CRMUI.$("#globalFollowLogs").addEventListener("click", () => this.openGlobalFollowLogModal());
    const bulkRecycleBtn = CRMUI.$("#bulkRecycle");
    if (bulkRecycleBtn) bulkRecycleBtn.addEventListener("click", () => this.recycleSelectedLeads());
    this.renderLeadTable();
    if (q.id) {
      const lead = CRM_MOCK.leads.find(l => l.id === q.id);
      if (lead) setTimeout(() => this.openLeadDrawer(lead), 100);
    }
  },
  renderPublicPool(root) {
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="poolAssign">批量分配</button>
        <button class="btn" id="poolRefresh">刷新</button>
      </div>
      <div class="filters card pad">
        <select id="poolSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select>
        <input id="poolSearch" placeholder="搜索线索编号、联系人、企业名称">
        <select id="poolChannel"><option value="">全部来源</option><option>邮件</option><option>WhatsApp</option><option>其他</option></select>
      </div>
      <div id="poolTable"></div>
    `;
    this.poolSelected = new Set();
    const draw = () => {
      const keyword = CRMUI.$("#poolSearch").value.toLowerCase();
      const siteId = CRMUI.$("#poolSite").value;
      const channel = CRMUI.$("#poolChannel").value;
      const rows = CRM_MOCK.leads.filter(l => l.status === "公海待分配" && (!siteId || l.siteId === siteId) && (!channel || l.channel === channel) && `${l.no} ${l.company} ${l.contact}`.toLowerCase().includes(keyword));
      CRMUI.$("#poolTable").innerHTML = CRMUI.table([
        { title: "", render: l => `<input type="checkbox" data-pool-check="${l.id}">` },
        { title: "线索编号", render: l => l.no },
        { title: "线索联系人", render: l => l.contact },
        { title: "来源渠道", render: l => l.channel },
        { title: "来源站点", render: l => CRMUI.siteName(l.siteId) },
        { title: "入池时间", render: l => l.poolEnteredAt || l.createdAt },
        { title: "入池原因", render: l => l.poolReason || "运营专员手动回收" },
        { title: "意向产品", render: l => l.products.join("、") },
        { title: "操作", render: l => `<button class="btn" data-pool-assign="${l.id}">分配</button> <button class="btn" data-pool-detail="${l.id}">查看详情</button>` }
      ], rows, "公海池暂无线索");
      CRMUI.$$("[data-pool-check]").forEach(el => el.addEventListener("change", () => el.checked ? this.poolSelected.add(el.dataset.poolCheck) : this.poolSelected.delete(el.dataset.poolCheck)));
      CRMUI.$$("[data-pool-assign]").forEach(btn => btn.addEventListener("click", () => this.assignPoolLeads([btn.dataset.poolAssign], draw)));
      CRMUI.$$("[data-pool-detail]").forEach(btn => btn.addEventListener("click", () => this.openLeadDrawer(CRM_MOCK.leads.find(l => l.id === btn.dataset.poolDetail))));
    };
    CRMUI.$$("#poolSearch,#poolSite,#poolChannel").forEach(el => el.addEventListener("input", draw));
    CRMUI.$("#poolAssign").addEventListener("click", () => this.assignPoolLeads(Array.from(this.poolSelected), draw));
    CRMUI.$("#poolRefresh").addEventListener("click", () => { CRMUI.toast("公海池数据已刷新"); draw(); });
    draw();
  },
  assignPoolLeads(ids, after) {
    if (!ids.length) return CRMUI.toast("请先选择公海线索");
    CRMUI.modal("分配线索", `
      <p>已选 ${ids.length} 条线索。</p>
      <div class="form-grid">
        <div class="form-field"><label>目标负责人</label><select name="ownerId">${CRMUI.optionList(CRM_MOCK.users.filter(u => u.role === "业务员"))}</select></div>
        <div class="form-field full"><label>分配备注</label><textarea name="note"></textarea></div>
      </div>`, form => {
      ids.forEach(id => {
        const lead = CRM_MOCK.leads.find(l => l.id === id);
        lead.ownerId = form.get("ownerId");
        lead.status = "待跟进";
      });
      CRMUI.closeModal();
      CRMUI.toast(`成功分配 ${ids.length} 条线索`);
      after();
    });
  },
  leadRows() {
    const keyword = this.leadState.query;
    return CRM_MOCK.leads.filter(l => {
      const byStatus = this.leadState.status === "全部" || (this.leadState.status === "待跟进" ? l.status === "待跟进" || (Boolean(l.nextFollowAt) && ["跟进中", "高意向"].includes(l.status)) : l.status === this.leadState.status);
      const bySite = !this.leadState.siteId || l.siteId === this.leadState.siteId;
      const byIntent = !this.leadState.purchaseIntent || l.purchaseIntent === this.leadState.purchaseIntent;
      const text = `${l.no} ${l.company} ${l.contact} ${l.email} ${l.purchaseIntent || ""}`.toLowerCase();
      return byStatus && bySite && byIntent && text.includes(keyword);
    });
  },
  renderLeadTable() {
    const rows = this.leadRows();
    CRMUI.$("#leadTable").innerHTML = CRMUI.table([
      { title: "", render: l => `<input type="checkbox" data-check-lead="${l.id}" ${this.leadState.selected.has(l.id) ? "checked" : ""}>` },
      { title: "线索编号", render: l => `<a href="#" data-lead="${l.id}">${l.no}</a>` },
      { title: "客户/企业", render: l => l.company },
      { title: "联系人", render: l => l.contact },
      { title: "来源", render: l => `${l.channel} · ${CRMUI.siteName(l.siteId)}` },
      { title: "采购意向", render: l => l.purchaseIntent || "-" },
      { title: "负责人", render: l => CRMUI.userName(l.ownerId) },
      { title: "状态", render: l => CRMUI.badge(l.status) },
      { title: "阶段", render: l => l.stage },
      { title: "标签", render: l => [...l.aiTags, ...l.manualTags].slice(0, 3).map(t => `<span class="badge gray">${t}</span>`).join(" ") },
      { title: "操作", render: l => `<button class="btn" data-follow="${l.id}">跟进</button> <button class="btn" data-lead-tag="${l.id}">打标签</button> ${this.canRecycle() && ["待跟进", "跟进中"].includes(l.status) ? `<button class="btn" data-recycle="${l.id}">回收至公海</button>` : ""} <button class="btn" data-lead="${l.id}">详情</button>` }
    ], rows, "暂无线索");
    CRMUI.$$("[data-lead]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      this.openLeadDrawer(CRM_MOCK.leads.find(l => l.id === el.dataset.lead));
    }));
    CRMUI.$$("[data-follow]").forEach(el => el.addEventListener("click", () => this.openFollowModal(el.dataset.follow)));
    CRMUI.$$("[data-lead-tag]").forEach(el => el.addEventListener("click", () => this.openLeadTagModal(el.dataset.leadTag)));
    CRMUI.$$("[data-recycle]").forEach(el => el.addEventListener("click", () => this.openRecycleModal(el.dataset.recycle)));
    CRMUI.$$("[data-check-lead]").forEach(el => el.addEventListener("change", () => {
      el.checked ? this.leadState.selected.add(el.dataset.checkLead) : this.leadState.selected.delete(el.dataset.checkLead);
    }));
  },
  leadTagOptions() {
    // 读字典（线索手动标签），并并入线索已用但字典未收录的标签
    const dictTags = this.dictItems("leadTag").map(item => item.name);
    const usedTags = CRM_MOCK.leads.flatMap(lead => lead.manualTags || []);
    return Array.from(new Set([...dictTags, ...usedTags])).filter(Boolean);
  },
  // 业务字典取数：返回启用且按 sort 升序的字典项
  dictItems(code) {
    const dict = (CRM_MOCK.dictionaries || []).find(d => d.code === code);
    if (!dict) return [];
    return (dict.items || []).filter(item => item.status !== "停用").sort((a, b) => (a.sort || 0) - (b.sort || 0));
  },
  openLeadTagModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    CRMUI.modal("线索打标签", `
      <div class="form-grid">
        <div class="form-field"><label>线索编号</label><input value="${lead.no}" disabled></div>
        ${CRMUI.formMultiSelect("线索标签", "tags", this.leadTagOptions().map(tag => ({ value: tag, label: tag })), lead.manualTags)}
      </div>`, form => {
      lead.manualTags = form.getAll("tags");
      CRMUI.closeModal();
      CRMUI.toast("线索标签已更新");
      this.renderLeadTable();
    });
  },
  leadFollowLogs(leadId) {
    return CRM_MOCK.followLogs
      .filter(log => log.leadId === leadId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
  renderLeadFollowLogTable(leadId) {
    return CRMUI.table([
      { title: "跟进时间", render: log => log.createdAt },
      { title: "跟进人", render: log => CRMUI.userName(log.userId) },
      { title: "跟进方式", render: log => log.method },
      { title: "跟进内容", render: log => log.content },
      { title: "当前跟进状态", render: log => log.stage },
      { title: "下次跟进时间", render: log => log.nextFollowAt || "-" }
    ], this.leadFollowLogs(leadId), "暂无跟进记录");
  },
  followLogLead(log) {
    return CRM_MOCK.leads.find(lead => lead.id === log.leadId);
  },
  followLogCustomer(log, lead = this.followLogLead(log)) {
    if (!lead) return "";
    if (lead.customerId) return CRMUI.customerName(lead.customerId);
    const customer = CRM_MOCK.customers.find(item => (item.leadIds || []).includes(lead.id) || item.name === lead.company);
    return customer?.name || "";
  },
  followLogFilterOptions(key) {
    return Array.from(new Set(CRM_MOCK.followLogs.map(log => log[key]).filter(Boolean)));
  },
  globalFollowLogRows() {
    const state = this.globalFollowLogState || {};
    const keyword = value => String(value || "").toLowerCase();
    return CRM_MOCK.followLogs
      .map(log => {
        const lead = this.followLogLead(log);
        const customerName = this.followLogCustomer(log, lead);
        return { log, lead, customerName };
      })
      .filter(row => {
        const createdDate = String(row.log.createdAt || "").slice(0, 10);
        const leadText = keyword(`${row.lead?.no || ""} ${row.lead?.company || ""}`);
        const customerText = keyword(`${row.customerName} ${row.lead?.company || ""}`);
        const byLead = !state.leadNo || leadText.includes(keyword(state.leadNo));
        const byCustomer = !state.customer || customerText.includes(keyword(state.customer));
        const byUser = !state.userId || row.log.userId === state.userId;
        const byMethod = !state.method || row.log.method === state.method;
        const byStage = !state.stage || row.log.stage === state.stage;
        const byStart = !state.start || createdDate >= state.start;
        const byEnd = !state.end || createdDate <= state.end;
        return byLead && byCustomer && byUser && byMethod && byStage && byStart && byEnd;
      })
      .sort((a, b) => String(b.log.createdAt).localeCompare(String(a.log.createdAt)));
  },
  renderGlobalFollowLogTable() {
    const state = this.globalFollowLogState;
    const allRows = this.globalFollowLogRows();
    const totalPages = Math.max(1, Math.ceil(allRows.length / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = (state.page - 1) * state.pageSize;
    const rows = allRows.slice(start, start + state.pageSize);
    const table = CRMUI.table([
      { title: "跟进时间", render: row => row.log.createdAt },
      { title: "跟进人", render: row => CRMUI.userName(row.log.userId) },
      { title: "关联线索编号", render: row => row.lead ? `<a href="#" data-global-follow-lead="${row.lead.id}">${row.lead.no}</a>` : "-" },
      { title: "关联客户", render: row => row.customerName || "-" },
      { title: "跟进方式", render: row => row.log.method },
      { title: "跟进内容", render: row => row.log.content },
      { title: "当前跟进状态", render: row => row.log.stage },
      { title: "下次跟进时间", render: row => row.log.nextFollowAt || "-" }
    ], rows, "暂无跟进记录");
    CRMUI.$("#globalFollowLogTable").innerHTML = `
      ${table}
      <div class="toolbar" style="justify-content:flex-end;margin-top:12px">
        <span class="muted">第 ${state.page} / ${totalPages} 页，共 ${allRows.length} 条</span>
        <button class="btn" type="button" id="followLogPrev" ${state.page <= 1 ? "disabled" : ""}>上一页</button>
        <button class="btn" type="button" id="followLogNext" ${state.page >= totalPages ? "disabled" : ""}>下一页</button>
      </div>
    `;
    CRMUI.$("#followLogPrev")?.addEventListener("click", () => {
      state.page -= 1;
      this.renderGlobalFollowLogTable();
    });
    CRMUI.$("#followLogNext")?.addEventListener("click", () => {
      state.page += 1;
      this.renderGlobalFollowLogTable();
    });
    CRMUI.$$("[data-global-follow-lead]").forEach(link => link.addEventListener("click", e => {
      e.preventDefault();
      const lead = CRM_MOCK.leads.find(item => item.id === link.dataset.globalFollowLead);
      if (lead) this.openLeadDrawer(lead);
    }));
  },
  bindGlobalFollowLogFilters() {
    const bindInput = (id, key) => {
      CRMUI.$(`#${id}`).addEventListener("input", e => {
        this.globalFollowLogState[key] = e.target.value;
        this.globalFollowLogState.page = 1;
        this.renderGlobalFollowLogTable();
      });
    };
    const bindChange = (id, key) => {
      CRMUI.$(`#${id}`).addEventListener("change", e => {
        this.globalFollowLogState[key] = e.target.value;
        this.globalFollowLogState.page = 1;
        this.renderGlobalFollowLogTable();
      });
    };
    bindInput("followLogLeadNo", "leadNo");
    bindInput("followLogCustomer", "customer");
    bindChange("followLogUser", "userId");
    bindChange("followLogMethod", "method");
    bindChange("followLogStart", "start");
    bindChange("followLogEnd", "end");
    bindChange("followLogStage", "stage");
    CRMUI.$("#followLogReset").addEventListener("click", () => {
      this.globalFollowLogState = { leadNo: "", customer: "", userId: "", method: "", start: "", end: "", stage: "", page: 1, pageSize: 5 };
      this.openGlobalFollowLogModal();
    });
  },
  openGlobalFollowLogModal() {
    this.globalFollowLogState = this.globalFollowLogState || { leadNo: "", customer: "", userId: "", method: "", start: "", end: "", stage: "", page: 1, pageSize: 5 };
    const state = this.globalFollowLogState;
    const methodOptions = this.followLogFilterOptions("method").map(value => `<option value="${value}" ${state.method === value ? "selected" : ""}>${value}</option>`).join("");
    const stageOptions = this.followLogFilterOptions("stage").map(value => `<option value="${value}" ${state.stage === value ? "selected" : ""}>${value}</option>`).join("");
    const userOptions = CRM_MOCK.users.map(user => `<option value="${user.id}" ${state.userId === user.id ? "selected" : ""}>${user.name}</option>`).join("");
    CRMUI.modal("跟进日志", `
      <div class="filters card pad">
        <input id="followLogLeadNo" value="${state.leadNo}" placeholder="按线索编号查询">
        <input id="followLogCustomer" value="${state.customer}" placeholder="按客户查询">
        <select id="followLogUser"><option value="">全部业务员</option>${userOptions}</select>
        <select id="followLogMethod"><option value="">全部跟进方式</option>${methodOptions}</select>
        <input id="followLogStart" type="date" value="${state.start}">
        <input id="followLogEnd" type="date" value="${state.end}">
        <select id="followLogStage"><option value="">全部跟进状态</option>${stageOptions}</select>
        <button class="btn" type="button" id="followLogReset">重置</button>
      </div>
      <div id="globalFollowLogTable" style="max-height:420px;overflow:auto"></div>
    `, () => CRMUI.closeModal());
    CRMUI.$("#modalForm button[type='submit']").textContent = "关闭";
    this.bindGlobalFollowLogFilters();
    this.renderGlobalFollowLogTable();
  },
  openLeadDrawer(lead) {
    const current = CRM_MOCK.leads.find(l => l.id === lead.id) || lead;
    const isTerminal = ["已成交", "无效", "丢失"].includes(current.status);
    const convertBtnLabel = "转高意向客户";
    // 关联客户：仅已成交线索展示客户名称 + 客户潜质分级（PRD §6.3.5 关联对象区）
    const linkedCustomer = current.customerId ? CRM_MOCK.customers.find(c => c.id === current.customerId) : null;
    const linkedCustomerHtml = (current.status === "已成交" && linkedCustomer) ? `
      <div class="section-title">关联客户</div>
      <div class="grid cols-2">
        <div><div class="muted">客户名称</div><strong><a href="#" data-linked-customer="${linkedCustomer.id}">${linkedCustomer.name}</a></strong></div>
        <div><div class="muted">客户潜质分级</div><strong>${linkedCustomer.potentialLevel ? CRMUI.badge(linkedCustomer.potentialLevel) : '<span class="muted">-</span>'}</strong></div>
      </div>` : "";
    CRMUI.drawer(`线索详情 ${current.no}`, `
      <p>${CRMUI.badge(current.status)} <span class="badge blue">${current.stage}</span></p>
      <div class="grid cols-2">
        <div><div class="muted">企业名称</div><strong>${current.company}</strong></div>
        <div><div class="muted">联系人</div><strong>${current.contact}</strong></div>
        <div><div class="muted">来源站点</div><strong>${CRMUI.siteName(current.siteId)}</strong></div>
        <div><div class="muted">采购意向</div><strong>${current.purchaseIntent || "-"}</strong></div>
        <div><div class="muted">负责人</div><strong>${CRMUI.userName(current.ownerId)}</strong></div>
      </div>
      <hr>
      ${linkedCustomerHtml}
      <div class="section-title">AI 意向总结</div><p>${current.aiSummary}</p>
      <p>${current.aiTags.map(t => `<span class="badge blue">${t}</span>`).join(" ")}</p>
      <div class="section-title">跟进日志</div>
      ${this.renderLeadFollowLogTable(current.id)}
      <div class="toolbar" style="margin-top:16px">
        <button class="btn primary" id="drawerFollow">录入跟进</button>
        <button class="btn" id="drawerStatus">修改状态</button>
        <button class="btn" id="drawerConvert" ${isTerminal ? "disabled title=\"终态线索不可转高意向客户\"" : ""}>${isTerminal ? "转高意向客户" : convertBtnLabel}</button>
        ${this.canRecycle() && ["待跟进", "跟进中"].includes(current.status) ? `<button class="btn" id="drawerRecycle">回收至公海</button>` : ""}
        <button class="btn" id="drawerEmail">查看邮件</button>
      </div>
    `);
    CRMUI.$("#drawerFollow").addEventListener("click", () => this.openFollowModal(current.id));
    CRMUI.$("#drawerStatus").addEventListener("click", () => this.openStatusModal(current.id));
    CRMUI.$("#drawerConvert").addEventListener("click", () => this.convertLeadFromDetail(current.id));
    const drawerRecycleBtn = CRMUI.$("#drawerRecycle");
    if (drawerRecycleBtn) drawerRecycleBtn.addEventListener("click", () => this.openRecycleModal(current.id));
    CRMUI.$("#drawerEmail").addEventListener("click", () => CRMRouter.goto("email", { leadId: current.id }));
    CRMUI.$("[data-linked-customer]")?.addEventListener("click", e => {
      e.preventDefault();
      const c = CRM_MOCK.customers.find(item => item.id === e.currentTarget.dataset.linkedCustomer);
      if (c) this.openCustomerDrawer(c);
    });
  },
  openLeadModal() {
    CRMUI.modal("新增线索", `
      <div class="form-grid">
        ${CRMUI.formInput("企业名称", "company")}
        ${CRMUI.formInput("联系人", "contact")}
        ${CRMUI.formInput("邮箱", "email")}
        <div class="form-field"><label>来源站点</label><select name="siteId">${CRMUI.optionList(CRM_MOCK.sites)}</select></div>
        ${CRMUI.formSelect("采购意向", "purchaseIntent", (CRM_MOCK.purchaseIntentOptions || []).map(v => ({ value: v, label: v })))}
        ${CRMUI.formMultiSelect("线索标签", "tags", this.leadTagOptions().map(tag => ({ value: tag, label: tag })), [])}
      </div>`, form => {
      CRM_MOCK.leads.unshift({
        id: `l${Date.now()}`,
        no: `LEAD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        company: form.get("company") || "新线索企业",
        contact: form.get("contact") || "匿名联系人",
        email: form.get("email"),
        phone: "",
        siteId: form.get("siteId"),
        channel: "其他",
        ownerId: CRM_MOCK.currentUser.id,
        status: "待跟进",
        stage: "待首响",
        products: ["待确认"],
        purchaseIntent: form.get("purchaseIntent"),
        aiTags: [],
        manualTags: form.getAll("tags"),
        createdAt: "2026-07-02 12:30",
        lastFollowAt: "",
        nextFollowAt: "",
        customerId: "",
        aiSummary: "手动创建线索，暂无 AI 分析。"
      });
      CRMUI.closeModal();
      CRMUI.toast("线索已新增");
      this.renderLeadTable();
    });
  },
  openFollowModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    const methodOptions = this.dictItems("followMethod").map(item => ({ value: item.name, label: item.name }));
    const stageOptions = this.dictItems("followStage").map(item => ({ value: item.name, label: item.name }));
    CRMUI.modal(`录入跟进 - ${lead.no}`, `
      <div class="form-grid">
        ${CRMUI.formSelect("跟进方式", "method", methodOptions.length ? methodOptions : ["电话", "邮件", "WhatsApp", "会议", "备注"].map(v => ({ value: v, label: v })))}
        ${CRMUI.formSelect("阶段", "stage", stageOptions.length ? stageOptions : ["待首响", "已联系", "需求确认", "报价", "高意向客户", "合同已成交"].map(v => ({ value: v, label: v })), lead.stage)}
        <div class="form-field full"><label>跟进内容</label><textarea name="content" required></textarea></div>
        ${CRMUI.formInput("下次跟进时间", "nextFollowAt", "2026-07-05 10:00")}
      </div>`, form => {
      const stage = form.get("stage");
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId, userId: CRM_MOCK.currentUser.id, method: form.get("method"), stage, content: form.get("content"), nextFollowAt: form.get("nextFollowAt"), createdAt: "2026-07-02 12:40" });
      lead.stage = stage;
      lead.lastFollowAt = "2026-07-02 12:40";
      lead.nextFollowAt = form.get("nextFollowAt");
      // 阶段触发高意向：读取跟进阶段字典项的"是否触发高意向"标记位（BR-038b）
      const stageItem = (CRM_MOCK.dictionaries || []).find(d => d.code === "followStage")?.items.find(item => item.name === stage);
      const triggerHighIntent = stageItem?.triggerHighIntent === true || stage === "高意向客户";
      if (triggerHighIntent) lead.status = "高意向";
      if (lead.status === "待跟进") lead.status = "跟进中";
      CRMUI.closeModal();
      CRMUI.toast(triggerHighIntent ? "已进入高意向，系统将触发转高意向客户提醒" : "跟进记录已保存");
      this.renderLeadTable();
    });
  },
  openStatusModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    const lossReasonOpts = (CRM_MOCK.lossReasonOptions || []).map(v => ({ value: v, label: v }));
    CRMUI.modal("修改状态", `
      <div class="form-grid">
        <div class="form-field"><label>当前状态</label><input value="${lead.status}" disabled></div>
        ${CRMUI.formSelect("目标状态", "status", ["跟进中", "高意向", "无效", "丢失"].map(v => ({ value: v, label: v })), lead.status)}
        <div class="form-field full" id="lossReasonWrap" style="display:none"><label>丢失原因</label><select name="lossReason"><option value="">请选择丢失原因</option>${lossReasonOpts.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}</select></div>
        <div class="form-field full"><label>变更原因</label><textarea name="reason" required></textarea></div>
      </div>`, form => {
      const target = form.get("status");
      if (target === "丢失" && !form.get("lossReason")) {
        CRMUI.toast("请选择丢失原因");
        return;
      }
      lead.status = target;
      const lossPart = target === "丢失" ? `（丢失原因：${form.get("lossReason")}）` : "";
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `状态变更为 ${lead.status}${lossPart}：${form.get("reason")}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 12:45" });
      CRMUI.closeModal();
      CRMUI.toast("状态已更新");
      CRMUI.closeDrawer();
      this.renderLeadTable();
    });
    // 目标状态=丢失时显示"丢失原因"下拉
    const statusSel = CRMUI.$('select[name="status"]');
    const reasonWrap = CRMUI.$("#lossReasonWrap");
    if (statusSel && reasonWrap) {
      statusSel.addEventListener("change", e => { reasonWrap.style.display = e.target.value === "丢失" ? "" : "none"; });
    }
  },
  // 公海回收权限：仅运营专员/系统管理员（PRD §6.2.8/§15.4 兜底手动回收路径）
  canRecycle() {
    const role = CRM_MOCK.currentUser?.role;
    return role === "运营专员" || role === "系统管理员";
  },
  openRecycleModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    if (!lead) return;
    if (!["待跟进", "跟进中"].includes(lead.status)) return CRMUI.toast("仅待跟进/跟进中状态线索可回收");
    CRMUI.modal("回收至公海池", `
      <div class="form-grid">
        <div class="form-field"><label>线索编号</label><input value="${lead.no}" disabled></div>
        <div class="form-field"><label>当前负责人</label><input value="${CRMUI.userName(lead.ownerId)}" disabled></div>
        <div class="form-field"><label>当前状态</label><input value="${lead.status}" disabled></div>
        <div class="form-field full"><label>回收原因</label><textarea name="reason" required placeholder="请填写回收原因，将记入跟进记录"></textarea></div>
      </div>`, form => {
      this.executeRecycle([lead], form.get("reason") || "");
      CRMUI.closeModal();
      CRMUI.toast("线索已回收至公海池");
      CRMUI.closeDrawer();
      this.renderLeadTable();
    });
  },
  recycleSelectedLeads() {
    const ids = Array.from(this.leadState.selected);
    if (!ids.length) return CRMUI.toast("请先选择线索");
    const leads = ids.map(id => CRM_MOCK.leads.find(l => l.id === id)).filter(Boolean).filter(l => ["待跟进", "跟进中"].includes(l.status));
    if (!leads.length) return CRMUI.toast("所选线索中没有可回收的待跟进/跟进中线索");
    CRMUI.modal("批量回收至公海池", `
      <div class="form-grid">
        <div class="form-field"><label>可回收线索数</label><input value="${leads.length}" disabled></div>
        <div class="form-field full"><label>回收原因</label><textarea name="reason" required placeholder="统一回收原因，将记入每条线索的跟进记录"></textarea></div>
      </div>`, form => {
      this.executeRecycle(leads, form.get("reason") || "");
      CRMUI.closeModal();
      CRMUI.toast(`已回收 ${leads.length} 条线索至公海池`);
      this.leadState.selected = new Set();
      this.renderLeadTable();
    });
  },
  // 执行回收：状态置为"公海待分配"，清空负责人，记录入池原因/时间，生成跟进记录
  executeRecycle(leads, reason) {
    const now = "2026-07-02 13:00";
    leads.forEach(lead => {
      lead.status = "公海待分配";
      lead.ownerId = "";
      lead.poolReason = "运营专员手动回收";
      lead.poolEnteredAt = now;
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}_${lead.id}`, leadId: lead.id, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `运营专员手动回收至公海：${reason}`, nextFollowAt: lead.nextFollowAt, createdAt: now });
    });
  },
  convertSelectedLeads() {
    const ids = Array.from(this.leadState.selected);
    if (!ids.length) return CRMUI.toast("请先选择线索");
    const leads = ids.map(id => CRM_MOCK.leads.find(l => l.id === id)).filter(Boolean);
    // 终态线索（已成交/无效/丢失）自动排除并单独标注
    const terminal = leads.filter(lead => ["已成交", "无效", "丢失"].includes(lead.status));
    const actionable = leads.filter(lead => !["已成交", "无效", "丢失"].includes(lead.status));
    let success = 0;
    actionable.forEach(lead => { if (this.convertLead(lead)) success += 1; });
    this.leadState.selected.clear();
    if (terminal.length && !actionable.length) {
      CRMUI.toast(`所选 ${terminal.length} 条为终态线索，已跳过`);
    } else if (terminal.length) {
      CRMUI.toast(`成功转高意向客户 ${success} 条；${terminal.length} 条终态线索已跳过`);
    } else {
      CRMUI.toast(`成功转高意向客户 ${success} 条`);
    }
    this.renderLeadTable();
  },
  isConvertedLead(lead) {
    return lead.status === "已成交";
  },
  // 转高意向客户：客户匹配（企业名称 + 来源站点精确匹配）→ 关联已有客户或新建客户 → 同步 AI 信息
  // 终态线索（已成交/无效/丢失）不可转化；转高意向客户为必然成功的业务动作，异常按系统异常处理
  convertLead(lead) {
    const terminalStatuses = ["已成交", "无效", "丢失"];
    if (terminalStatuses.includes(lead.status)) {
      CRMUI.toast(`线索 ${lead.no} 处于终态（${lead.status}），不可转高意向客户`);
      return false;
    }
    const existing = CRM_MOCK.customers.find(c => c.name === lead.company && c.siteId === lead.siteId);
    let customer;
    let action;
    if (existing) {
      // 关联已有客户：线索负责人不变（BR-035/§15.5），联系人按邮箱/手机号去重由客户详情承载
      customer = existing;
      if (!customer.leadIds.includes(lead.id)) customer.leadIds.unshift(lead.id);
      // 同步 AI 信息：保留客户既有画像，叠加线索 AI 摘要
      if (lead.aiSummary && !customer.aiProfile?.includes(lead.aiSummary)) {
        customer.aiProfile = `${customer.aiProfile || ""}${customer.aiProfile ? " | " : ""}${lead.aiSummary}`.trim();
      }
      action = `关联已有客户 ${customer.name}`;
    } else {
      customer = { id: `c${Date.now()}`, no: `CUS-2026-${Math.floor(Math.random() * 9000 + 1000)}`, name: lead.company, siteId: lead.siteId, country: "-", industry: "-", ownerId: lead.ownerId || CRM_MOCK.currentUser.id, potentialLevel: "潜在", tags: [...(lead.manualTags || [])], leadIds: [lead.id], contractIds: [], transferRecords: [], aiProfile: lead.aiSummary, createdAt: "2026-07-02" };
      CRM_MOCK.customers.unshift(customer);
      action = `新建客户 ${customer.name}`;
    }
    lead.customerId = customer.id;
    lead.status = "已成交";
    // 自动生成跟进记录（跟进方式=备注，内容为转高意向客户说明）
    CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId: lead.id, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `转高意向客户：${action}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 12:50" });
    return true;
  },
  // 详情页入口：点击【转高意向客户】
  convertLeadFromDetail(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    if (!lead) return;
    const ok = this.convertLead(lead);
    if (ok) {
      CRMUI.closeModal();
      CRMUI.toast("转高意向客户成功");
      this.renderLeadTable();
      this.openLeadDrawer(lead);
    }
  },
  renderContracts(root) {
    this.contractState = { query: "", status: "" };
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newContract">新增合同</button>
      </div>
      <div class="filters card pad">
        <input id="contractSearch" placeholder="搜索合同编号、客户名称、关联线索、负责人">
        <select id="contractStatus"><option value="">全部状态</option><option>已签约</option><option>执行中</option><option>已完成</option><option>已终止</option><option>已作废</option></select>
        <select><option>全部负责人</option>${CRM_MOCK.users.map(u => `<option>${u.name}</option>`).join("")}</select>
      </div>
      <div id="contractTable"></div>
    `;
    CRMUI.$("#contractSearch").addEventListener("input", e => { this.contractState.query = e.target.value.toLowerCase(); this.renderContractTable(); });
    CRMUI.$("#contractStatus").addEventListener("change", e => { this.contractState.status = e.target.value; this.renderContractTable(); });
    CRMUI.$("#newContract").addEventListener("click", () => this.openContractModal(CRM_MOCK.customers[0].id, () => this.renderContractTable()));
    this.renderContractTable();
  },
  renderContractTable() {
    const rows = CRM_MOCK.contracts.filter(contract => {
      const customer = CRMUI.customerName(contract.customerId);
      const lead = this.contractLead(contract);
      const owner = CRMUI.userName(contract.ownerId);
      return `${contract.no} ${contract.name} ${customer} ${lead?.no || ""} ${lead?.company || ""} ${owner}`.toLowerCase().includes(this.contractState.query) && (!this.contractState.status || contract.status === this.contractState.status);
    });
    CRMUI.$("#contractTable").innerHTML = CRMUI.table([
      { title: "合同编号", render: c => `<a href="#" data-contract="${c.id}">${c.no}</a>` },
      { title: "合同名称", render: c => c.name },
      { title: "客户", render: c => CRMUI.customerName(c.customerId) },
      { title: "关联线索", render: c => this.renderContractLeadLink(c) },
      { title: "业务负责人", render: c => CRMUI.userName(c.ownerId) },
      { title: "金额", render: c => `¥${c.amount.toLocaleString()}` },
      { title: "签约日期", render: c => c.signedAt },
      { title: "状态", render: c => CRMUI.badge(c.status) },
      { title: "附件", render: c => `${c.attachments.length} 个附件` },
      { title: "操作", render: c => `<button class="btn" data-contract="${c.id}">详情</button> <button class="btn" data-contract-edit="${c.id}">编辑</button> <button class="btn danger" data-contract-void="${c.id}">作废</button>` }
    ], rows, "暂无合同");
    CRMUI.$$("[data-contract]").forEach(btn => btn.addEventListener("click", e => {
      e.preventDefault();
      const c = CRM_MOCK.contracts.find(item => item.id === btn.dataset.contract);
      CRMUI.drawer(`合同详情 ${c.no}`, `
        <p>${CRMUI.badge(c.status)} <span class="badge gray">${CRMUI.customerName(c.customerId)}</span></p>
        <div class="grid cols-2">
          <div><div class="muted">合同名称</div><strong>${c.name}</strong></div>
          <div><div class="muted">关联线索</div><strong>${this.renderContractLeadLink(c)}</strong></div>
          <div><div class="muted">业务负责人</div><strong>${CRMUI.userName(c.ownerId)}</strong></div>
          <div><div class="muted">金额</div><strong>¥${c.amount.toLocaleString()}</strong></div>
          <div><div class="muted">签约日期</div><strong>${c.signedAt}</strong></div>
        </div>
        <div class="section-title">附件</div><p>${c.attachments.map(a => `<span class="badge gray">${a}</span>`).join(" ") || "无附件"}</p>
      `);
      this.bindContractLeadLinks();
    }));
    this.bindContractLeadLinks();
    CRMUI.$$("[data-contract-edit]").forEach(btn => btn.addEventListener("click", () => this.openEditContractModal(btn.dataset.contractEdit)));
    CRMUI.$$("[data-contract-void]").forEach(btn => btn.addEventListener("click", () => this.voidContract(btn.dataset.contractVoid)));
  },
  contractLead(contract) {
    return CRM_MOCK.leads.find(lead => lead.id === contract.leadId);
  },
  renderContractLeadLink(contract) {
    const lead = this.contractLead(contract);
    if (!lead) return `<span class="muted">未关联</span>`;
    return `<a href="#" data-contract-lead="${lead.id}">${lead.no || lead.company}</a>`;
  },
  bindContractLeadLinks() {
    document.querySelectorAll("[data-contract-lead]").forEach(link => {
      if (link.dataset.leadBound) return;
      link.dataset.leadBound = "true";
      link.addEventListener("click", e => {
        e.preventDefault();
        const lead = CRM_MOCK.leads.find(item => item.id === link.dataset.contractLead);
        if (lead) this.openLeadDrawer(lead);
      });
    });
  },
  contractCustomerOptions(value = "") {
    return CRM_MOCK.customers.map(customer => `<option value="${customer.id}" ${customer.id === value ? "selected" : ""}>${customer.name}</option>`).join("");
  },
  contractLeadOptions(value = "") {
    return `<option value="">未关联</option>${CRM_MOCK.leads.map(lead => `<option value="${lead.id}" ${lead.id === value ? "selected" : ""}>${lead.no} · ${lead.company}</option>`).join("")}`;
  },
  contractOwnerOptions(value = "") {
    return CRM_MOCK.users
      .filter(user => user.role === "业务员")
      .map(user => `<option value="${user.id}" ${user.id === value ? "selected" : ""}>${user.name}</option>`)
      .join("");
  },
  contractFormFields(contract = {}) {
    const salesUsers = CRM_MOCK.users.filter(user => user.role === "业务员");
    const ownerId = contract.ownerId || salesUsers[0]?.id || CRM_MOCK.currentUser.id;
    return `
      ${contract.no ? `<div class="form-field"><label>合同编号</label><input value="${contract.no}" disabled></div>` : CRMUI.formInput("合同编号", "no")}
      ${CRMUI.formInput("合同名称", "name", contract.name || "")}
      <div class="form-field"><label>客户</label><select name="customerId" required>${this.contractCustomerOptions(contract.customerId || "")}</select></div>
      <div class="form-field"><label>关联线索</label><select name="leadId">${this.contractLeadOptions(contract.leadId || "")}</select></div>
      <div class="form-field"><label>业务负责人</label><select name="ownerId" required>${this.contractOwnerOptions(ownerId)}</select></div>
      ${CRMUI.formInput("金额", "amount", contract.amount || "", "number")}
      ${CRMUI.formSelect("合同状态", "status", ["已签约", "执行中", "已完成", "已终止"].map(v => ({ value: v, label: v })), contract.status || "已签约")}
    `;
  },
  openEditContractModal(id) {
    const c = CRM_MOCK.contracts.find(item => item.id === id);
    CRMUI.modal("编辑合同", `
      <div class="form-grid">
        ${this.contractFormFields(c)}
      </div>`, form => {
      c.name = form.get("name");
      c.amount = Number(form.get("amount"));
      c.status = form.get("status");
      c.customerId = form.get("customerId");
      c.leadId = form.get("leadId");
      c.ownerId = form.get("ownerId");
      CRMUI.closeModal();
      CRMUI.toast("合同已更新");
      this.renderContractTable();
    });
  },
  voidContract(id) {
    const c = CRM_MOCK.contracts.find(item => item.id === id);
    CRMUI.modal("作废合同", `
      <p>作废后合同进入终态，历史数据保留。</p>
      <div class="form-grid">
        ${CRMUI.formSelect("作废原因", "reason", ["业务取消", "重复创建", "信息错误", "客户主动放弃", "其他"].map(v => ({ value: v, label: v })))}
        <div class="form-field full"><label>作废备注</label><textarea name="note"></textarea></div>
      </div>`, () => {
      c.status = "已作废";
      CRMUI.closeModal();
      CRMUI.toast("合同已作废");
      this.renderContractTable();
    });
  },
  renderCustomers(root) {
    const q = CRMRouter.query();
    this.customerState = { query: "", potentialLevel: "", industry: "", country: "", siteId: "", selected: new Set() };
    const levelOpts = this.dictItems("customerLevel").map(i => `<option value="${i.name}">${i.name}</option>`).join("");
    const industryOpts = this.dictItems("industry").map(i => `<option value="${i.name}">${i.name}</option>`).join("");
    const countryOpts = this.dictItems("country").map(i => `<option value="${i.name}">${i.name}</option>`).join("");
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newCustomer">新建客户</button>
        <button class="btn" id="transferCustomer">客户负责人转移</button>
      </div>
      <div class="filters">
        <input id="customerSearch" placeholder="搜索客户名称、编号">
        <select id="customerPotentialLevel"><option value="">全部潜质分级</option>${levelOpts}</select>
        <select id="customerIndustry"><option value="">全部行业</option>${industryOpts}</select>
        <select id="customerCountry"><option value="">全部国家/地区</option>${countryOpts}</select>
        <select id="customerSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select>
      </div>
      <div id="customerTable"></div>
    `;
    CRMUI.$("#customerSearch").addEventListener("input", e => { this.customerState.query = e.target.value.toLowerCase(); this.renderCustomerTable(); });
    CRMUI.$("#customerPotentialLevel").addEventListener("change", e => { this.customerState.potentialLevel = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerIndustry").addEventListener("change", e => { this.customerState.industry = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerCountry").addEventListener("change", e => { this.customerState.country = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerSite").addEventListener("change", e => { this.customerState.siteId = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#newCustomer").addEventListener("click", () => this.openCustomerModal());
    CRMUI.$("#transferCustomer").addEventListener("click", () => this.openTransferCustomerModal(Array.from(this.customerState.selected), "batch"));
    this.renderCustomerTable();
    if (q.id) {
      const customer = CRM_MOCK.customers.find(c => c.id === q.id);
      if (customer) setTimeout(() => this.openCustomerDrawer(customer), 100);
    }
  },
  customerRows() {
    return CRM_MOCK.customers.filter(c => {
      const text = `${c.no} ${c.name}`.toLowerCase();
      return text.includes(this.customerState.query)
        && (!this.customerState.potentialLevel || c.potentialLevel === this.customerState.potentialLevel)
        && (!this.customerState.industry || c.industry === this.customerState.industry)
        && (!this.customerState.country || c.country === this.customerState.country)
        && (!this.customerState.siteId || c.siteId === this.customerState.siteId);
    });
  },
  renderCustomerTable() {
    CRMUI.$("#customerTable").innerHTML = CRMUI.table([
      { title: "", render: c => `<input type="checkbox" data-check-customer="${c.id}" ${this.customerState.selected.has(c.id) ? "checked" : ""}>` },
      { title: "客户名称", render: c => `<a href="#" data-customer="${c.id}">${c.name}</a>` },
      { title: "编号", render: c => c.no },
      { title: "来源站点", render: c => CRMUI.siteName(c.siteId) },
      { title: "国家/行业", render: c => `${c.country} / ${c.industry}` },
      { title: "潜质分级", render: c => c.potentialLevel ? CRMUI.badge(c.potentialLevel) : `<span class="muted">-</span>` },
      { title: "关联线索数", render: c => { const n = (c.leadIds || []).length; return `<a href="#" data-customer-leads="${c.id}">${n}</a>`; } },
      { title: "负责人", render: c => CRMUI.userName(c.ownerId) },
      { title: "标签", render: c => c.tags.length ? c.tags.map(t => `<span class="badge gray">${t}</span>`).join(" ") : `<span class="muted">暂无标签</span>` },
      { title: "操作", render: c => `<button class="btn" data-customer="${c.id}">详情</button> <button class="btn" data-customer-tag="${c.id}">打标签</button> <button class="btn" data-customer-transfer="${c.id}">客户负责人转移</button> <button class="btn" data-ai-profile="${c.id}">AI画像</button>` }
    ], this.customerRows(), "暂无客户");
    CRMUI.$$("[data-check-customer]").forEach(el => {
      el.addEventListener("click", e => e.stopPropagation());
      el.addEventListener("change", () => {
        el.checked ? this.customerState.selected.add(el.dataset.checkCustomer) : this.customerState.selected.delete(el.dataset.checkCustomer);
        this.updateCustomerBatchAction();
      });
    });
    CRMUI.$$("[data-customer]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      this.openCustomerDrawer(CRM_MOCK.customers.find(c => c.id === el.dataset.customer));
    }));
    CRMUI.$$("[data-ai-profile]").forEach(el => el.addEventListener("click", () => {
      const c = CRM_MOCK.customers.find(item => item.id === el.dataset.aiProfile);
      CRMUI.modal("AI 客户画像", `<p>${c.aiProfile}</p><p class="muted">该画像为线索转化为客户时同步的只读信息。</p>`, () => CRMUI.closeModal());
    }));
    CRMUI.$$("[data-customer-tag]").forEach(el => el.addEventListener("click", () => this.openCustomerTagModal(el.dataset.customerTag)));
    CRMUI.$$("[data-customer-transfer]").forEach(el => el.addEventListener("click", () => this.openTransferCustomerModal([el.dataset.customerTransfer], "single")));
    CRMUI.$$("[data-customer-leads]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      CRMRouter.goto("leads", { customerId: el.dataset.customerLeads });
    }));
    this.updateCustomerBatchAction();
  },
  updateCustomerBatchAction() {
    const button = CRMUI.$("#transferCustomer");
    if (!button) return;
    const count = this.customerState.selected.size;
    button.textContent = count ? `客户负责人转移（${count}）` : "客户负责人转移";
  },
  customerTagOptions() {
    // 读字典（客户标签），并并入客户已用但字典未收录的标签
    const dictTags = this.dictItems("customerTag").map(item => item.name);
    const usedTags = CRM_MOCK.customers.flatMap(c => c.tags || []);
    return Array.from(new Set([...dictTags, ...usedTags])).filter(Boolean);
  },
  openCustomerTagModal(customerId) {
    const customer = CRM_MOCK.customers.find(c => c.id === customerId);
    const options = this.customerTagOptions();
    CRMUI.modal("客户打标签", `
      <div class="form-grid">
        <div class="form-field"><label>客户名称</label><input value="${customer.name}" disabled></div>
        ${CRMUI.formMultiSelect("客户标签", "tags", options.map(tag => ({ value: tag, label: tag })), customer.tags)}
      </div>`, form => {
      customer.tags = form.getAll("tags");
      CRMUI.closeModal();
      CRMUI.toast("客户标签已更新");
      this.renderCustomerTable();
    });
  },
  openCustomerDrawer(customer) {
    const contacts = CRM_MOCK.contacts.filter(c => c.customerId === customer.id);
    const contracts = CRM_MOCK.contracts.filter(c => c.customerId === customer.id);
    const leadHistory = this.customerLeadHistory(customer);
    const transferRecords = this.customerTransferRecords(customer);
    const distribution = this.customerLeadStatusDistribution(customer);
    const leadCount = (customer.leadIds || []).length;
    CRMUI.drawer(`客户详情 ${customer.name}`, `
      <p>${customer.potentialLevel ? CRMUI.badge(customer.potentialLevel) : `<span class="badge gray">未分级</span>`} <span class="badge gray">${customer.no}</span></p>
      <div class="grid cols-2">
        <div><div class="muted">站点</div><strong>${CRMUI.siteName(customer.siteId)}</strong></div>
        <div><div class="muted">负责人</div><strong>${CRMUI.userName(customer.ownerId)}</strong></div>
        <div><div class="muted">国家</div><strong>${customer.country}</strong></div>
        <div><div class="muted">行业</div><strong>${customer.industry}</strong></div>
        <div><div class="muted">关联线索数</div><strong>${leadCount} 条线索</strong></div>
        <div class="full"><div class="muted">关联线索状态分布</div><strong>${distribution}</strong></div>
      </div>
      <div class="section-title">联系人</div>${CRMUI.table([
        { title: "姓名", render: c => c.name },
        { title: "职位", render: c => c.title },
        { title: "邮箱", render: c => c.email },
        { title: "主要", render: c => c.primary ? "是" : "否" }
      ], contacts, "暂无联系人")}
      <div class="section-title">合作合同</div>${CRMUI.table([
        { title: "合同编号", render: c => c.no },
        { title: "合同名称", render: c => c.name },
        { title: "金额", render: c => `¥${c.amount.toLocaleString()}` },
        { title: "状态", render: c => CRMUI.badge(c.status) }
      ], contracts, "暂无合作合同")}
      <div class="section-title">线索历史记录</div>${CRMUI.table([
        { title: "线索编号", render: lead => lead.no },
        { title: "负责的业务员", render: lead => CRMUI.userName(lead.ownerId) },
        { title: "来源站点", render: lead => CRMUI.siteName(lead.siteId) }
      ], leadHistory, "暂无线索历史记录")}
      <div class="section-title">客户负责人转移记录</div>${CRMUI.table([
        { title: "原业务负责人", render: record => CRMUI.userName(record.fromOwnerId) },
        { title: "新业务负责人", render: record => CRMUI.userName(record.toOwnerId) },
        { title: "转移时间", render: record => record.transferredAt },
        { title: "转移人", render: record => CRMUI.userName(record.operatorId) },
        { title: "转移备注", render: record => record.reason || "-" }
      ], transferRecords, "暂无客户负责人转移记录")}
      <div class="section-title">AI 客户画像</div><p>${customer.aiProfile}</p>
      <div class="toolbar"><button class="btn primary" id="addContract">新增合同</button><button class="btn" id="addContact">新增联系人</button></div>
    `);
    CRMUI.$("#addContract").addEventListener("click", () => this.openContractModal(customer.id));
    CRMUI.$("#addContact").addEventListener("click", () => this.openContactModal(customer.id));
  },
  customerLeadStatusDistribution(customer) {
    const leads = this.customerLeadHistory(customer);
    if (!leads.length) return `<span class="muted">暂无线索</span>`;
    const counts = {};
    leads.forEach(lead => { counts[lead.status] = (counts[lead.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => `<span class="badge gray">${status} ${count}</span>`).join(" ");
  },
  customerLeadHistory(customer) {
    const ids = new Set(customer.leadIds || []);
    return CRM_MOCK.leads.filter(lead => ids.has(lead.id) || lead.customerId === customer.id);
  },
  customerTransferRecords(customer) {
    return (customer.transferRecords || []).slice().sort((a, b) => String(b.transferredAt).localeCompare(String(a.transferredAt)));
  },
  openCustomerModal() {
    const countryOpts = this.dictItems("country").map(i => ({ value: i.name, label: i.name }));
    const industryOpts = this.dictItems("industry").map(i => ({ value: i.name, label: i.name }));
    const levelOpts = this.dictItems("customerLevel").map(i => ({ value: i.name, label: i.name }));
    CRMUI.modal("新建客户", `
      <div class="form-grid">
        ${CRMUI.formInput("客户名称", "name")}
        ${CRMUI.formSelect("国家/地区", "country", countryOpts)}
        ${CRMUI.formSelect("行业", "industry", industryOpts)}
        ${CRMUI.formSelect("客户潜质分级", "potentialLevel", levelOpts, "潜在")}
        <div class="form-field"><label>来源站点</label><select name="siteId">${CRMUI.optionList(CRM_MOCK.sites)}</select></div>
      </div>`, form => {
      CRM_MOCK.customers.unshift({ id: `c${Date.now()}`, no: `CUS-2026-${Math.floor(Math.random() * 9000 + 1000)}`, name: form.get("name") || "新客户", siteId: form.get("siteId"), country: form.get("country") || "-", industry: form.get("industry") || "-", ownerId: CRM_MOCK.currentUser.id, potentialLevel: form.get("potentialLevel") || "潜在", tags: ["手动创建"], leadIds: [], contractIds: [], transferRecords: [], aiProfile: "手动创建客户，暂无 AI 画像数据。", createdAt: "2026-07-02" });
      CRMUI.closeModal();
      CRMUI.toast("客户已创建");
      this.renderCustomerTable();
    });
  },
  openContactModal(customerId) {
    CRMUI.modal("新增联系人", `<div class="form-grid">${CRMUI.formInput("姓名", "name")}${CRMUI.formInput("职位", "title")}${CRMUI.formInput("邮箱", "email")}${CRMUI.formInput("电话", "phone")}</div>`, form => {
      CRM_MOCK.contacts.push({ id: `p${Date.now()}`, customerId, name: form.get("name"), title: form.get("title"), email: form.get("email"), phone: form.get("phone"), whatsapp: "", role: "执行联系人", primary: false, aiDetected: false });
      CRMUI.closeModal();
      CRMUI.toast("联系人已新增");
    });
  },
  openTransferCustomerModal(customerIds, mode = "single") {
    const ids = Array.isArray(customerIds) ? customerIds : [customerIds];
    if (mode === "batch" && !ids.length) return CRMUI.toast("请先选择需要转移的客户。");
    const customers = CRM_MOCK.customers.filter(c => ids.includes(c.id));
    if (!customers.length) return CRMUI.toast("未找到需要转移的客户");
    const isBatch = mode === "batch";
    // 转移目标为在职销售人员（业务员、运营专员），按客户所属站点过滤，不含已禁用
    const scopeSiteIds = Array.from(new Set(customers.map(c => c.siteId).filter(Boolean)));
    const salesUsers = CRM_MOCK.users.filter(u => ["业务员", "运营专员"].includes(u.role) && u.status !== "禁用" && (!scopeSiteIds.length || scopeSiteIds.includes(u.siteIds?.[0]) || (u.siteIds || []).some(s => scopeSiteIds.includes(s))));
    CRMUI.modal(isBatch ? "批量客户负责人转移" : "客户负责人转移", `
      <div class="form-grid">
        ${isBatch ? `<div class="form-field full"><label>已选择客户数量</label><input value="${customers.length} 个" disabled></div>` : `
          <div class="form-field"><label>客户名称</label><input value="${customers[0].name}" disabled></div>
          <div class="form-field"><label>当前负责人</label><input value="${CRMUI.userName(customers[0].ownerId)}" disabled></div>
        `}
        <div class="form-field"><label>转移目标销售人员</label><select name="ownerId" required>${CRMUI.optionList(salesUsers)}</select></div>
        <div class="form-field full"><label>转移备注</label><textarea name="note" required placeholder="请输入转移原因（必填）"></textarea></div>
      </div>`, form => {
      const ownerId = form.get("ownerId");
      if (!ownerId) return CRMUI.toast("请选择新的负责人");
      const note = (form.get("note") || "").trim();
      if (!note) return CRMUI.toast("请填写转移备注");
      // 校验新负责人与当前相同：单条直接拦截，批量逐条跳过
      let sameCount = 0;
      let movedCount = 0;
      customers.forEach(customer => {
        const fromOwnerId = customer.ownerId;
        if (fromOwnerId === ownerId) { sameCount += 1; return; }
        customer.transferRecords = customer.transferRecords || [];
        customer.transferRecords.unshift({
          id: `tr${Date.now()}${customer.id}`,
          fromOwnerId,
          toOwnerId: ownerId,
          transferredAt: "2026-07-05 10:30",
          operatorId: CRM_MOCK.currentUser.id,
          reason: note
        });
        customer.ownerId = ownerId;
        movedCount += 1;
      });
      if (isBatch) this.customerState.selected.clear();
      CRMUI.closeModal();
      if (isBatch && sameCount) {
        CRMUI.toast(`成功转移 ${movedCount} 个；${sameCount} 个新负责人与当前相同已跳过`);
      } else if (isBatch) {
        CRMUI.toast(`已转移 ${movedCount} 个客户`);
      } else {
        CRMUI.toast("客户已转移");
      }
      this.renderCustomerTable();
    });
  },
  openContractModal(customerId, afterSave) {
    CRMUI.modal("新增合同", `<div class="form-grid">${this.contractFormFields({ customerId })}</div>`, form => {
      const customerIdValue = form.get("customerId");
      const ownerId = form.get("ownerId");
      if (!customerIdValue) return CRMUI.toast("请选择客户");
      if (!ownerId) return CRMUI.toast("请选择业务负责人");
      CRM_MOCK.contracts.unshift({ id: `ct${Date.now()}`, no: form.get("no"), name: form.get("name"), customerId: customerIdValue, leadId: form.get("leadId"), amount: Number(form.get("amount") || 0), signedAt: "2026-07-02", status: form.get("status"), ownerId, attachments: [] });
      CRMUI.closeModal();
      CRMUI.toast("合同已新增");
      if (afterSave) afterSave();
    });
  }
};
