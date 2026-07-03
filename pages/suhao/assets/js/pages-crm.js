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
        <button class="btn" id="bulkAssign">批量分配</button>
        <button class="btn" id="bulkConvert">转高意向客户</button>
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
    CRMUI.$("#bulkAssign").addEventListener("click", () => this.openAssignModal());
    CRMUI.$("#bulkConvert").addEventListener("click", () => this.convertSelectedLeads());
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
        { title: "入池原因", render: l => l.poolReason || "系统采集" },
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
      { title: "操作", render: l => `<button class="btn" data-follow="${l.id}">跟进</button> <button class="btn" data-lead-tag="${l.id}">打标签</button> <button class="btn" data-lead="${l.id}">详情</button>` }
    ], rows, "暂无线索");
    CRMUI.$$("[data-lead]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      this.openLeadDrawer(CRM_MOCK.leads.find(l => l.id === el.dataset.lead));
    }));
    CRMUI.$$("[data-follow]").forEach(el => el.addEventListener("click", () => this.openFollowModal(el.dataset.follow)));
    CRMUI.$$("[data-lead-tag]").forEach(el => el.addEventListener("click", () => this.openLeadTagModal(el.dataset.leadTag)));
    CRMUI.$$("[data-check-lead]").forEach(el => el.addEventListener("change", () => {
      el.checked ? this.leadState.selected.add(el.dataset.checkLead) : this.leadState.selected.delete(el.dataset.checkLead);
    }));
  },
  leadTagOptions() {
    return Array.from(new Set([...(CRM_MOCK.leadTags || []), ...CRM_MOCK.leads.flatMap(lead => lead.manualTags)])).filter(Boolean);
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
  openLeadDrawer(lead) {
    const logs = CRM_MOCK.followLogs.filter(f => f.leadId === lead.id);
    CRMUI.drawer(`线索详情 ${lead.no}`, `
      <p>${CRMUI.badge(lead.status)} <span class="badge blue">${lead.stage}</span></p>
      <div class="grid cols-2">
        <div><div class="muted">企业名称</div><strong>${lead.company}</strong></div>
        <div><div class="muted">联系人</div><strong>${lead.contact}</strong></div>
        <div><div class="muted">来源站点</div><strong>${CRMUI.siteName(lead.siteId)}</strong></div>
        <div><div class="muted">采购意向</div><strong>${lead.purchaseIntent || "-"}</strong></div>
        <div><div class="muted">负责人</div><strong>${CRMUI.userName(lead.ownerId)}</strong></div>
      </div>
      <hr>
      <div class="section-title">AI 意向总结</div><p>${lead.aiSummary}</p>
      <p>${lead.aiTags.map(t => `<span class="badge blue">${t}</span>`).join(" ")}</p>
      <div class="section-title">跟进日志</div>
      ${CRMUI.table([
        { title: "时间", render: f => f.createdAt },
        { title: "方式", render: f => f.method },
        { title: "阶段", render: f => f.stage },
        { title: "内容", render: f => f.content }
      ], logs, "暂无跟进记录")}
      <div class="toolbar" style="margin-top:16px">
        <button class="btn primary" id="drawerFollow">录入跟进</button>
        <button class="btn" id="drawerStatus">修改状态</button>
        <button class="btn" id="drawerEmail">查看邮件</button>
      </div>
    `);
    CRMUI.$("#drawerFollow").addEventListener("click", () => this.openFollowModal(lead.id));
    CRMUI.$("#drawerStatus").addEventListener("click", () => this.openStatusModal(lead.id));
    CRMUI.$("#drawerEmail").addEventListener("click", () => CRMRouter.goto("email", { leadId: lead.id }));
  },
  openLeadModal() {
    CRMUI.modal("新增线索", `
      <div class="form-grid">
        ${CRMUI.formInput("企业名称", "company")}
        ${CRMUI.formInput("联系人", "contact")}
        ${CRMUI.formInput("邮箱", "email")}
        <div class="form-field"><label>来源站点</label><select name="siteId">${CRMUI.optionList(CRM_MOCK.sites)}</select></div>
        ${CRMUI.formSelect("采购意向", "purchaseIntent", (CRM_MOCK.purchaseIntentOptions || []).map(v => ({ value: v, label: v })))}
        ${CRMUI.formMultiSelect("线索标签", "tags", this.leadTagOptions().map(tag => ({ value: tag, label: tag })), ["手动录入"])}
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
    CRMUI.modal(`录入跟进 - ${lead.no}`, `
      <div class="form-grid">
        ${CRMUI.formSelect("跟进方式", "method", ["电话", "邮件", "WhatsApp", "会议", "备注"].map(v => ({ value: v, label: v })))}
        ${CRMUI.formSelect("阶段", "stage", ["待首响", "已联系", "需求确认", "报价", "高意向客户", "合同已成交"].map(v => ({ value: v, label: v })), lead.stage)}
        <div class="form-field full"><label>跟进内容</label><textarea name="content" required></textarea></div>
        ${CRMUI.formInput("下次跟进时间", "nextFollowAt", "2026-07-05 10:00")}
      </div>`, form => {
      const stage = form.get("stage");
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId, userId: CRM_MOCK.currentUser.id, method: form.get("method"), stage, content: form.get("content"), nextFollowAt: form.get("nextFollowAt"), createdAt: "2026-07-02 12:40" });
      lead.stage = stage;
      lead.lastFollowAt = "2026-07-02 12:40";
      lead.nextFollowAt = form.get("nextFollowAt");
      if (stage === "高意向客户") lead.status = "高意向";
      if (lead.status === "待跟进" || lead.status === "已分配") lead.status = "跟进中";
      CRMUI.closeModal();
      CRMUI.toast(stage === "高意向客户" ? "已进入高意向，系统将触发转高意向客户提醒" : "跟进记录已保存");
      this.renderLeadTable();
    });
  },
  openStatusModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    CRMUI.modal("修改状态", `
      <div class="form-grid">
        <div class="form-field"><label>当前状态</label><input value="${lead.status}" disabled></div>
        ${CRMUI.formSelect("目标状态", "status", ["跟进中", "高意向", "无效", "丢失"].map(v => ({ value: v, label: v })), lead.status)}
        <div class="form-field full"><label>变更原因</label><textarea name="reason" required></textarea></div>
      </div>`, form => {
      lead.status = form.get("status");
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `状态变更为 ${lead.status}：${form.get("reason")}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 12:45" });
      CRMUI.closeModal();
      CRMUI.toast("状态已更新");
      CRMUI.closeDrawer();
      this.renderLeadTable();
    });
  },
  openAssignModal() {
    const ids = Array.from(this.leadState.selected);
    if (!ids.length) return CRMUI.toast("请先选择线索");
    CRMUI.modal("批量分配", `
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
      this.leadState.selected.clear();
      CRMUI.closeModal();
      CRMUI.toast(`成功分配 ${ids.length} 条线索`);
      this.renderLeadTable();
    });
  },
  convertSelectedLeads() {
    const ids = Array.from(this.leadState.selected);
    if (!ids.length) return CRMUI.toast("请先选择线索");
    const invalid = ids.map(id => CRM_MOCK.leads.find(l => l.id === id)).filter(l => l.status !== "高意向");
    if (invalid.length) return CRMUI.toast("仅高意向线索可转高意向客户");
    ids.forEach(id => this.convertLead(CRM_MOCK.leads.find(l => l.id === id)));
    this.leadState.selected.clear();
    CRMUI.toast(`成功转高意向客户 ${ids.length} 条`);
    this.renderLeadTable();
  },
  convertLead(lead) {
    const customer = { id: `c${Date.now()}`, no: `CUS-2026-${Math.floor(Math.random() * 9000 + 1000)}`, name: lead.company, siteId: lead.siteId, country: "-", industry: "-", ownerId: lead.ownerId || CRM_MOCK.currentUser.id, status: "跟进中", tags: lead.manualTags, leadIds: [lead.id], contractIds: [], aiProfile: lead.aiSummary, createdAt: "2026-07-02" };
    CRM_MOCK.customers.unshift(customer);
    lead.customerId = customer.id;
    lead.status = "已成交";
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
    this.customerState = { query: "", status: "", siteId: "", selected: new Set() };
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newCustomer">新建客户</button>
        <button class="btn" id="transferCustomer">转高意向客户</button>
      </div>
      <div class="filters">
        <input id="customerSearch" placeholder="搜索客户名称、编号">
        <select id="customerStatus"><option value="">全部状态</option><option>跟进中</option><option>已成交</option><option>流失</option></select>
        <select id="customerSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select>
      </div>
      <div id="customerTable"></div>
    `;
    CRMUI.$("#customerSearch").addEventListener("input", e => { this.customerState.query = e.target.value.toLowerCase(); this.renderCustomerTable(); });
    CRMUI.$("#customerStatus").addEventListener("change", e => { this.customerState.status = e.target.value; this.renderCustomerTable(); });
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
      return text.includes(this.customerState.query) && (!this.customerState.status || c.status === this.customerState.status) && (!this.customerState.siteId || c.siteId === this.customerState.siteId);
    });
  },
  renderCustomerTable() {
    CRMUI.$("#customerTable").innerHTML = CRMUI.table([
      { title: "", render: c => `<input type="checkbox" data-check-customer="${c.id}" ${this.customerState.selected.has(c.id) ? "checked" : ""}>` },
      { title: "客户名称", render: c => `<a href="#" data-customer="${c.id}">${c.name}</a>` },
      { title: "编号", render: c => c.no },
      { title: "来源站点", render: c => CRMUI.siteName(c.siteId) },
      { title: "国家/行业", render: c => `${c.country} / ${c.industry}` },
      { title: "状态", render: c => CRMUI.badge(c.status) },
      { title: "负责人", render: c => CRMUI.userName(c.ownerId) },
      { title: "标签", render: c => c.tags.length ? c.tags.map(t => `<span class="badge gray">${t}</span>`).join(" ") : `<span class="muted">暂无标签</span>` },
      { title: "操作", render: c => `<button class="btn" data-customer="${c.id}">详情</button> <button class="btn" data-customer-tag="${c.id}">打标签</button> <button class="btn" data-customer-transfer="${c.id}">转高意向客户</button> <button class="btn" data-ai-profile="${c.id}">AI画像</button>` }
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
      CRMUI.modal("AI 客户画像", `<p>${c.aiProfile}</p><p class="muted">该画像为线索转高意向客户时同步的只读信息。</p>`, () => CRMUI.closeModal());
    }));
    CRMUI.$$("[data-customer-tag]").forEach(el => el.addEventListener("click", () => this.openCustomerTagModal(el.dataset.customerTag)));
    CRMUI.$$("[data-customer-transfer]").forEach(el => el.addEventListener("click", () => this.openTransferCustomerModal([el.dataset.customerTransfer], "single")));
    this.updateCustomerBatchAction();
  },
  updateCustomerBatchAction() {
    const button = CRMUI.$("#transferCustomer");
    if (!button) return;
    const count = this.customerState.selected.size;
    button.textContent = count ? `转高意向客户（${count}）` : "转高意向客户";
  },
  customerTagOptions() {
    return Array.from(new Set([...(CRM_MOCK.customerTags || []), ...CRM_MOCK.customers.flatMap(c => c.tags)])).filter(Boolean);
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
    CRMUI.drawer(`客户详情 ${customer.name}`, `
      <p>${CRMUI.badge(customer.status)} <span class="badge gray">${customer.no}</span></p>
      <div class="grid cols-2">
        <div><div class="muted">站点</div><strong>${CRMUI.siteName(customer.siteId)}</strong></div>
        <div><div class="muted">负责人</div><strong>${CRMUI.userName(customer.ownerId)}</strong></div>
        <div><div class="muted">国家</div><strong>${customer.country}</strong></div>
        <div><div class="muted">行业</div><strong>${customer.industry}</strong></div>
      </div>
      <div class="section-title">联系人</div>${CRMUI.table([
        { title: "姓名", render: c => c.name },
        { title: "职位", render: c => c.title },
        { title: "邮箱", render: c => c.email },
        { title: "标签", render: c => (c.tags || []).map(t => `<span class="badge gray">${t}</span>`).join(" ") || `<span class="muted">暂无标签</span>` },
        { title: "主要", render: c => c.primary ? "是" : "否" },
        { title: "操作", render: c => `<button class="btn" data-contact-tag="${c.id}">打标签</button>` }
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
      <div class="section-title">AI 客户画像</div><p>${customer.aiProfile}</p>
      <div class="toolbar"><button class="btn primary" id="addContract">新增合同</button><button class="btn" id="addContact">新增联系人</button></div>
    `);
    CRMUI.$("#addContract").addEventListener("click", () => this.openContractModal(customer.id));
    CRMUI.$("#addContact").addEventListener("click", () => this.openContactModal(customer.id));
    CRMUI.$$("[data-contact-tag]").forEach(btn => btn.addEventListener("click", () => this.openContactTagModal(btn.dataset.contactTag, customer.id)));
  },
  customerLeadHistory(customer) {
    const ids = new Set(customer.leadIds || []);
    return CRM_MOCK.leads.filter(lead => ids.has(lead.id) || lead.customerId === customer.id);
  },
  openCustomerModal() {
    CRMUI.modal("新建客户", `
      <div class="form-grid">
        ${CRMUI.formInput("客户名称", "name")}
        ${CRMUI.formInput("国家/地区", "country")}
        ${CRMUI.formInput("行业", "industry")}
        <div class="form-field"><label>来源站点</label><select name="siteId">${CRMUI.optionList(CRM_MOCK.sites)}</select></div>
      </div>`, form => {
      CRM_MOCK.customers.unshift({ id: `c${Date.now()}`, no: `CUS-2026-${Math.floor(Math.random() * 9000 + 1000)}`, name: form.get("name") || "新客户", siteId: form.get("siteId"), country: form.get("country") || "-", industry: form.get("industry") || "-", ownerId: CRM_MOCK.currentUser.id, status: "跟进中", tags: ["手动创建"], leadIds: [], contractIds: [], aiProfile: "手动创建客户，暂无 AI 画像数据。", createdAt: "2026-07-02" });
      CRMUI.closeModal();
      CRMUI.toast("客户已创建");
      this.renderCustomerTable();
    });
  },
  contactTagOptions() {
    return Array.from(new Set([...(CRM_MOCK.contactTags || []), ...CRM_MOCK.contacts.flatMap(contact => contact.tags || [])])).filter(Boolean);
  },
  openContactModal(customerId) {
    CRMUI.modal("新增联系人", `<div class="form-grid">${CRMUI.formInput("姓名", "name")}${CRMUI.formInput("职位", "title")}${CRMUI.formInput("邮箱", "email")}${CRMUI.formInput("电话", "phone")}${CRMUI.formMultiSelect("联系人标签", "tags", this.contactTagOptions().map(tag => ({ value: tag, label: tag })))}</div>`, form => {
      CRM_MOCK.contacts.push({ id: `p${Date.now()}`, customerId, name: form.get("name"), title: form.get("title"), email: form.get("email"), phone: form.get("phone"), whatsapp: "", role: "执行联系人", primary: false, aiDetected: false, tags: form.getAll("tags") });
      CRMUI.closeModal();
      CRMUI.toast("联系人已新增");
    });
  },
  openContactTagModal(contactId, customerId) {
    const contact = CRM_MOCK.contacts.find(item => item.id === contactId);
    CRMUI.modal("联系人打标签", `
      <div class="form-grid">
        <div class="form-field"><label>联系人</label><input value="${contact.name}" disabled></div>
        ${CRMUI.formMultiSelect("联系人标签", "tags", this.contactTagOptions().map(tag => ({ value: tag, label: tag })), contact.tags || [])}
      </div>`, form => {
      contact.tags = form.getAll("tags");
      CRMUI.closeModal();
      CRMUI.toast("联系人标签已更新");
      this.openCustomerDrawer(CRM_MOCK.customers.find(customer => customer.id === customerId));
    });
  },
  openTransferCustomerModal(customerIds, mode = "single") {
    const ids = Array.isArray(customerIds) ? customerIds : [customerIds];
    if (mode === "batch" && !ids.length) return CRMUI.toast("请先选择需要转移的客户。");
    const customers = CRM_MOCK.customers.filter(c => ids.includes(c.id));
    if (!customers.length) return CRMUI.toast("未找到需要转移的客户");
    const isBatch = mode === "batch";
    CRMUI.modal(isBatch ? "批量客户转移" : "客户转移", `
      <div class="form-grid">
        ${isBatch ? `<div class="form-field full"><label>已选择客户数量</label><input value="${customers.length} 个" disabled></div>` : `
          <div class="form-field"><label>客户名称</label><input value="${customers[0].name}" disabled></div>
          <div class="form-field"><label>当前负责人</label><input value="${CRMUI.userName(customers[0].ownerId)}" disabled></div>
        `}
        <div class="form-field"><label>转移目标业务员</label><select name="ownerId" required>${CRMUI.optionList(CRM_MOCK.users.filter(u => u.role === "业务员"))}</select></div>
        <div class="form-field full"><label>转移原因</label><textarea name="note" placeholder="请输入转移原因（选填）"></textarea></div>
      </div>`, form => {
      const ownerId = form.get("ownerId");
      if (!ownerId) return CRMUI.toast("请选择新的负责人");
      customers.forEach(customer => {
        customer.ownerId = ownerId;
      });
      if (isBatch) this.customerState.selected.clear();
      CRMUI.closeModal();
      CRMUI.toast(isBatch ? `已转移 ${customers.length} 个客户` : "客户已转移");
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
