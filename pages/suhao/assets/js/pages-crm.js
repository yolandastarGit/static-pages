window.CRMCrmPage = {
  render(root, page, routeKey) {
    if (page === "leads" && routeKey === "leadDetail") return this.renderLeadDetail(root);
    if (page === "leads" && routeKey === "publicPool") return this.renderPublicPool(root);
    if (page === "leads" && routeKey === "followLogs") return this.renderFollowLogs(root);
    if (page === "customers" && routeKey === "customerDetail") return this.renderCustomerDetail(root);
    if (page === "customers" && routeKey === "contracts") return this.renderContracts(root);
    page === "leads" ? this.renderLeads(root) : this.renderCustomers(root);
  },
  currentRouteParams() {
    const activeUrl = window.CRMWorkspace?.activeTab?.()?.url || window.location.href;
    const query = activeUrl.split("?")[1] || "";
    return Object.fromEntries(new URLSearchParams(query).entries());
  },
  openLeadDetail(leadOrId) {
    const id = typeof leadOrId === "string" ? leadOrId : leadOrId?.id;
    if (!id) return;
    CRMRouter.goto("leadDetail", { id });
  },
  openCustomerDetail(customerOrId) {
    const id = typeof customerOrId === "string" ? customerOrId : customerOrId?.id;
    if (!id) return;
    CRMRouter.goto("customerDetail", { id });
  },
  renderLeads(root) {
    const q = CRMRouter.query();
    if (q.id && q.view !== "detail") {
      this.openLeadDetail(q.id);
      return;
    }
    const tabs = ["全部", "待跟进", "跟进中", "已转客户", "已成交", "无效", "丢失"];
    // 默认创建时间=本月；工作台"新增线索"卡片 created=today 时改为今日；其余时间字段默认不限制
    const monthRange = this.currentMonthRange();
    const today = new Date().toISOString().slice(0, 10);
    const createdToday = q.created === "today";
    // 工作台"跟进超时"跳转：overdue=1 → 下次跟进时间 < 今日（end=昨日）
    const overdueEnd = q.overdue ? this.yesterdayStr() : "";
    this.leadState = {
      status: tabs.includes(q.status) ? q.status : "全部",
      statusGroup: q.statusGroup || "",
      query: q.q || "",
      siteId: "",
      sourceChannels: [],
      ownerId: "",
      tags: [],
      stage: "",
      purchaseIntent: "",
      overdue: q.overdue || "",
      reply: q.reply || "",
      createTimeStart: createdToday ? today : monthRange.start,
      createTimeEnd: createdToday ? today : monthRange.end,
      lastFollowUpTimeStart: "",
      lastFollowUpTimeEnd: "",
      nextFollowUpTimeStart: "",
      nextFollowUpTimeEnd: overdueEnd,
      updateTimeStart: "",
      updateTimeEnd: "",
      selected: new Set()
    };
    const channelOpts = ["邮件", "WhatsApp", "官网询盘", "自然询盘", "展会", "客户转介绍", "其他"].map(v => ({ value: v, label: v }));
    const tagOpts = this.leadTagOptions().map(tag => ({ value: tag, label: tag }));
    root.innerHTML = `
      <div class="tabs" id="leadTabs">${tabs.map(s => `<div class="tab ${s === this.leadState.status ? "active" : ""}" data-status="${s}">${s}</div>`).join("")}</div>
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn" id="globalFollowLogs">跟进日志</button>
          ${this.canBulkConvert() ? `<button class="btn" id="bulkConvert">转客户</button>` : ""}
          ${this.canEditLead() ? `<button class="btn primary" id="newLead">新增线索</button>` : ""}
          ${this.canEditLead() ? `<button class="btn" id="leadImport">批量导入</button>` : ""}
          ${this.canRecycle() ? `<button class="btn" id="bulkRecycle">回收至公海</button>` : ""}
          <button class="btn" id="leadExport">批量导出</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters search-filter">
            <label class="filter-item"><span>关键词</span><input id="leadSearch" value="${this.leadState.query}" placeholder="搜索线索编号、询盘联系人、企业名称、邮箱"></label>
            <label class="filter-item"><span>站点</span><select id="leadSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></label>
            <label class="filter-item"><span>线索状态</span><select id="leadStatusFilter">${tabs.map(status => `<option value="${status}" ${status === this.leadState.status ? "selected" : ""}>${status === "全部" ? "全部状态" : status}</option>`).join("")}</select></label>
            <label class="filter-item"><span>阶段</span><select id="leadStage"><option value="">全部阶段</option>${this.dictItems("followStage").map(item => `<option value="${item.name}">${item.name}</option>`).join("")}</select></label>
            <label class="filter-item"><span>意向产品</span><select id="leadIntent"><option value="">全部意向产品</option>${(CRM_MOCK.purchaseIntentOptions || []).map(item => `<option>${item}</option>`).join("")}</select></label>
            <div class="filter-item"><span>来源渠道</span>${CRMUI.multiSelect("leadSourceChannels", channelOpts, this.leadState.sourceChannels)}</div>
            <label class="filter-item"><span>负责人</span><select id="leadOwner"><option value="">全部负责人</option>${CRM_MOCK.users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}</select></label>
            <div class="filter-item"><span>标签</span>${CRMUI.multiSelect("leadTags", tagOpts, this.leadState.tags)}</div>
            <label class="filter-item"><span>创建时间</span><span class="range-picker"><input type="date" id="leadCreateTimeStart" value="${this.leadState.createTimeStart}"><span class="range-separator">-</span><input type="date" id="leadCreateTimeEnd" value="${this.leadState.createTimeEnd}"></span></label>
            <label class="filter-item"><span>最近跟进</span><span class="range-picker"><input type="date" id="leadLastFollowStart" value="${this.leadState.lastFollowUpTimeStart}"><span class="range-separator">-</span><input type="date" id="leadLastFollowEnd" value="${this.leadState.lastFollowUpTimeEnd}"></span></label>
            <label class="filter-item"><span>下次跟进</span><span class="range-picker"><input type="date" id="leadNextFollowStart" value="${this.leadState.nextFollowUpTimeStart}"><span class="range-separator">-</span><input type="date" id="leadNextFollowEnd" value="${this.leadState.nextFollowUpTimeEnd}"></span></label>
            <label class="filter-item"><span>更新时间</span><span class="range-picker"><input type="date" id="leadUpdateTimeStart" value="${this.leadState.updateTimeStart}"><span class="range-separator">-</span><input type="date" id="leadUpdateTimeEnd" value="${this.leadState.updateTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="leadQuery">查询</button><button class="btn" id="leadReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="leadTable"></div>
    `;
    CRMUI.$$(".tab").forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      this.leadState.status = tab.dataset.status;
      CRMUI.$("#leadStatusFilter").value = this.leadState.status;
      this.renderLeadTable();
    }));
    CRMUI.$("#leadSearch").addEventListener("input", e => { this.leadState.query = e.target.value.toLowerCase(); this.renderLeadTable(); });
    CRMUI.$("#leadSite").addEventListener("change", e => { this.leadState.siteId = e.target.value; this.renderLeadTable(); });
    CRMUI.$("#leadStatusFilter").addEventListener("change", e => {
      this.leadState.status = e.target.value;
      CRMUI.$$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.status === this.leadState.status));
      this.renderLeadTable();
    });
    CRMUI.$("#leadStage").addEventListener("change", e => { this.leadState.stage = e.target.value; this.renderLeadTable(); });
    CRMUI.$("#leadIntent").addEventListener("change", e => { this.leadState.purchaseIntent = e.target.value; this.renderLeadTable(); });
    CRMUI.$("#leadOwner").addEventListener("change", e => { this.leadState.ownerId = e.target.value; this.renderLeadTable(); });
    const syncLeadMultiFilters = () => {
      this.leadState.sourceChannels = this.checkedFilterValues("leadSourceChannels");
      this.leadState.tags = this.checkedFilterValues("leadTags");
      this.renderLeadTable();
    };
    CRMUI.$$('input[name="leadSourceChannels"],input[name="leadTags"]').forEach(el => el.addEventListener("change", syncLeadMultiFilters));
    CRMUI.$$("#leadCreateTimeStart,#leadCreateTimeEnd,#leadLastFollowStart,#leadLastFollowEnd,#leadNextFollowStart,#leadNextFollowEnd,#leadUpdateTimeStart,#leadUpdateTimeEnd").forEach(el => el.addEventListener("change", e => {
      // 映射控件 id → leadState 时间字段 key（Start/End）
      const suffix = el.id.endsWith("Start") ? "Start" : "End";
      const prefix = el.id.startsWith("leadCreateTime") ? "createTime"
        : el.id.startsWith("leadLastFollow") ? "lastFollowUpTime"
        : el.id.startsWith("leadNextFollow") ? "nextFollowUpTime"
        : "updateTime";
      this.leadState[`${prefix}${suffix}`] = e.target.value;
      this.renderLeadTable();
    }));
    CRMUI.$("#leadQuery").addEventListener("click", () => {
      syncLeadMultiFilters();
    });
    // 重置恢复线索列表默认时间范围（创建时间=本月，其余不限制）；保留权限范围（siteId 等清空为"全部"）
    CRMUI.$("#leadReset").addEventListener("click", () => {
      const range = this.currentMonthRange();
      this.leadState = { status: "全部", statusGroup: "", query: "", siteId: "", sourceChannels: [], ownerId: "", tags: [], stage: "", purchaseIntent: "", overdue: "", reply: "", createTimeStart: range.start, createTimeEnd: range.end, lastFollowUpTimeStart: "", lastFollowUpTimeEnd: "", nextFollowUpTimeStart: "", nextFollowUpTimeEnd: "", updateTimeStart: "", updateTimeEnd: "", selected: new Set() };
      this.renderLeads(root);
    });
    CRMUI.$("#newLead")?.addEventListener("click", () => this.openLeadModal());
    CRMUI.$("#bulkConvert")?.addEventListener("click", () => this.convertSelectedLeads());
    CRMUI.$("#leadImport")?.addEventListener("click", () => this.openBatchImportModal("线索"));
    CRMUI.$("#leadExport").addEventListener("click", () => this.openLeadExportModal());
    CRMUI.$("#globalFollowLogs").addEventListener("click", () => CRMRouter.goto("followLogs"));
    const bulkRecycleBtn = CRMUI.$("#bulkRecycle");
    if (bulkRecycleBtn) bulkRecycleBtn.addEventListener("click", () => this.recycleSelectedLeads());
    this.renderLeadTable();
  },
  // 当前月份起止（YYYY-MM-DD），用于"创建时间=本月"默认值
  currentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = now.toISOString().slice(0, 10);
    return { start, end };
  },
  // 昨日日期字符串（YYYY-MM-DD），用于工作台"跟进超时"跳转：下次跟进时间 < 今日
  yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  },
  // 日期区间匹配：值格式 YYYY-MM-DD 或 YYYY-MM-DD HH:mm；空值不限制；开始含当天起、结束含当天止
  dateInRange(value, start, end) {
    if (!start && !end) return true;
    const date = String(value || "").slice(0, 10);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  },
  renderPublicPool(root) {
    // 入池时间默认本月
    const monthRange = this.currentMonthRange();
    this.poolState = { siteId: "", query: "", channel: "", product: "", status: "", stage: "", ownerId: "", tag: "", start: monthRange.start, end: monthRange.end };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          ${this.canRecycle() ? `<button class="btn primary" id="poolAssign">批量分配</button>` : ""}
          <button class="btn" id="poolRefresh">刷新</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>站点</span><select id="poolSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></label>
            <label class="filter-item"><span>关键词</span><input id="poolSearch" placeholder="搜索线索编号、联系人、企业名称"></label>
            <label class="filter-item"><span>入池时间</span><span class="range-picker"><input type="date" id="poolStart" value="${monthRange.start}"><span class="range-separator">-</span><input type="date" id="poolEnd" value="${monthRange.end}"></span></label>
            <label class="filter-item"><span>来源渠道</span><select id="poolChannel"><option value="">全部来源渠道</option><option>邮件</option><option>WhatsApp</option><option>官网询盘</option><option>自然询盘</option><option>展会</option><option>客户转介绍</option><option>其他</option></select></label>
            <label class="filter-item"><span>意向产品</span><select id="poolProduct"><option value="">全部意向产品</option>${(CRM_MOCK.purchaseIntentOptions || []).map(item => `<option>${item}</option>`).join("")}</select></label>
            <label class="filter-item"><span>状态</span><select id="poolStatus"><option value="">全部状态</option><option>待分配</option><option>无效</option><option>丢失</option></select></label>
            <label class="filter-item"><span>阶段</span><select id="poolStage"><option value="">全部阶段</option>${this.dictItems("followStage").map(item => `<option value="${item.name}">${item.name}</option>`).join("")}</select></label>
            <label class="filter-item"><span>负责人</span><select id="poolOwner"><option value="">全部负责人</option>${CRM_MOCK.users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}</select></label>
            <label class="filter-item"><span>标签</span><select id="poolTag"><option value="">全部标签</option>${this.leadTagOptions().map(tag => `<option>${tag}</option>`).join("")}</select></label>
            <div class="filter-actions"><button class="btn" id="poolQuery">查询</button><button class="btn" id="poolReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="poolTable"></div>
    `;
    this.poolSelected = new Set();
    const draw = () => {
      const keyword = (CRMUI.$("#poolSearch").value || "").toLowerCase();
      const siteId = CRMUI.$("#poolSite").value;
      const channel = CRMUI.$("#poolChannel").value;
      const product = CRMUI.$("#poolProduct").value;
      const status = CRMUI.$("#poolStatus").value;
      const stage = CRMUI.$("#poolStage").value;
      const ownerId = CRMUI.$("#poolOwner").value;
      const tag = CRMUI.$("#poolTag").value;
      const start = CRMUI.$("#poolStart").value;
      const end = CRMUI.$("#poolEnd").value;
      const rows = CRM_MOCK.leads.filter(l => {
        // 入池时间筛选（不与创建时间混用）
        const poolDate = String(l.poolEnteredAt || l.createdAt || "").slice(0, 10);
        const byStart = !start || poolDate >= start;
        const byEnd = !end || poolDate <= end;
        const bySite = !siteId || l.siteId === siteId;
        const byStatus = !status || l.status === status;
        const byStage = !stage || l.stage === stage;
        const byOwner = !ownerId || l.ownerId === ownerId;
        const leadTags = [...(l.aiTags || []), ...(l.manualTags || [])];
        const byTag = !tag || leadTags.includes(tag);
        return this.isPublicPoolLead(l) && bySite && (!channel || l.channel === channel)
          && (!product || (l.products || []).includes(product)) && byStart && byEnd
          && byStatus && byStage && byOwner && byTag
          && `${l.no} ${l.company} ${l.contact}`.toLowerCase().includes(keyword);
      });
      CRMUI.$("#poolTable").innerHTML = CRMUI.table([
        { title: "", render: l => `<input type="checkbox" data-pool-check="${l.id}" ${this.isPoolAssignableLead(l) ? "" : `disabled title="终态线索不可分配"`}>` },
        { title: "线索编号", render: l => l.no },
        { title: "线索联系人", render: l => l.contact },
        { title: "来源渠道", render: l => l.channel },
        { title: "站点", render: l => CRMUI.siteName(l.siteId) },
        { title: "线索状态", render: l => CRMUI.badge(l.status) },
        { title: "入池时间", render: l => l.poolEnteredAt || l.createdAt },
        { title: "入池原因", render: l => l.poolReason || "运营专员手动回收" },
        { title: "意向产品", render: l => l.products.join("、") },
        { title: "操作", render: l => `${this.canRecycle() && this.isPoolAssignableLead(l) ? `<button class="btn" data-pool-assign="${l.id}">分配</button> <button class="btn" data-pool-exception="${l.id}">标记异常</button>` : ""} ${!this.isPoolAssignableLead(l) ? `<span class="muted">已终态</span>` : ""} <button class="btn" data-pool-detail="${l.id}">查看详情</button>` }
      ], rows, "公海池暂无线索");
      CRMUI.$$("[data-pool-check]").forEach(el => el.addEventListener("change", () => {
        if (el.disabled) return;
        el.checked ? this.poolSelected.add(el.dataset.poolCheck) : this.poolSelected.delete(el.dataset.poolCheck);
      }));
      CRMUI.$$("[data-pool-assign]").forEach(btn => btn.addEventListener("click", () => this.assignPoolLeads([btn.dataset.poolAssign], draw)));
      CRMUI.$$("[data-pool-exception]").forEach(btn => btn.addEventListener("click", () => this.openStatusModal(btn.dataset.poolException, draw)));
      CRMUI.$$("[data-pool-detail]").forEach(btn => btn.addEventListener("click", () => this.openLeadDetail(btn.dataset.poolDetail)));
    };
    CRMUI.$$("#poolSearch,#poolSite,#poolChannel,#poolProduct,#poolStatus,#poolStage,#poolOwner,#poolTag,#poolStart,#poolEnd").forEach(el => el.addEventListener("input", draw));
    CRMUI.$("#poolQuery").addEventListener("click", draw);
    CRMUI.$("#poolAssign")?.addEventListener("click", () => this.assignPoolLeads(Array.from(this.poolSelected), draw));
    CRMUI.$("#poolRefresh").addEventListener("click", () => { CRMUI.toast("公海池数据已刷新"); draw(); });
    // 重置恢复公海池默认时间范围（入池时间=本月）
    CRMUI.$("#poolReset").addEventListener("click", () => {
      const range = this.currentMonthRange();
      CRMUI.$("#poolSearch").value = "";
      CRMUI.$("#poolSite").value = "";
      CRMUI.$("#poolChannel").value = "";
      CRMUI.$("#poolProduct").value = "";
      CRMUI.$("#poolStatus").value = "";
      CRMUI.$("#poolStage").value = "";
      CRMUI.$("#poolOwner").value = "";
      CRMUI.$("#poolTag").value = "";
      CRMUI.$("#poolStart").value = range.start;
      CRMUI.$("#poolEnd").value = range.end;
      draw();
    });
    draw();
  },
  isPublicPoolLead(lead) {
    return ["待分配", "无效", "丢失"].includes(lead.status)
      && Boolean(lead.poolEnteredAt || lead.poolReason || lead.ownerId === "");
  },
  isPoolAssignableLead(lead) {
    return lead?.status === "待分配";
  },
  assignPoolLeads(ids, after) {
    if (!this.canRecycle()) return CRMUI.toast("当前角色无公海分配权限");
    if (!ids.length) return CRMUI.toast("请先选择公海线索");
    const assignableIds = ids.filter(id => this.isPoolAssignableLead(CRM_MOCK.leads.find(l => l.id === id)));
    if (!assignableIds.length) return CRMUI.toast("请选择待分配状态的公海线索");
    if (assignableIds.length !== ids.length) CRMUI.toast("已跳过终态线索");
    CRMUI.modal("分配线索", `
      <p>已选 ${assignableIds.length} 条可分配线索。</p>
      <div class="form-grid">
        <div class="form-field"><label>目标负责人</label><select name="ownerId">${CRMUI.optionList(CRM_MOCK.users.filter(u => u.role === "业务员" && u.status !== "禁用"))}</select></div>
        <div class="form-field full"><label>分配备注</label><textarea name="note"></textarea></div>
      </div>`, form => {
      const ownerId = form.get("ownerId");
      if (!ownerId) return CRMUI.toast("该负责人已不可用，请重新选择");
      assignableIds.forEach(id => {
        const lead = CRM_MOCK.leads.find(l => l.id === id);
        lead.ownerId = ownerId;
        lead.status = "待跟进";
        lead.poolReason = "";
        lead.poolEnteredAt = "";
      });
      CRMUI.closeModal();
      CRMUI.toast(`成功分配 ${assignableIds.length} 条线索`);
      if (typeof after === "function") after();
    });
  },
  leadRows() {
    const keyword = this.leadState.query;
    const s = this.leadState;
    return CRM_MOCK.leads.filter(l => {
      // 公海「待分配」仅公海池展示，不进线索列表（§9.1）
      if (l.status === "待分配") return false;
      const byStatus = s.status === "全部" || l.status === s.status;
      const byStatusGroup = s.statusGroup !== "invalidLost" || ["无效", "丢失"].includes(l.status);
      const bySite = !s.siteId || l.siteId === s.siteId;
      const byIntent = !s.purchaseIntent || l.purchaseIntent === s.purchaseIntent;
      const bySource = !(s.sourceChannels || []).length || (s.sourceChannels || []).includes(l.channel);
      const byOwner = !s.ownerId || l.ownerId === s.ownerId;
      const leadTags = [...(l.aiTags || []), ...(l.manualTags || [])];
      const byTag = !(s.tags || []).length || (s.tags || []).some(tag => leadTags.includes(tag));
      const byStage = !s.stage || l.stage === s.stage;
      const byReply = s.reply !== "pending" || this.hasPendingReply(l);
      // 时间范围筛选：各字段独立、空值不限制
      const byCreated = this.dateInRange(l.createdAt, s.createTimeStart, s.createTimeEnd);
      const byLastFollow = this.dateInRange(l.lastFollowAt, s.lastFollowUpTimeStart, s.lastFollowUpTimeEnd);
      const byNextFollow = this.dateInRange(l.nextFollowAt, s.nextFollowUpTimeStart, s.nextFollowUpTimeEnd);
      const byUpdate = this.dateInRange(l.updatedAt || l.createdAt, s.updateTimeStart, s.updateTimeEnd);
      // 工作台"跟进超时"跳转：overdue=1 → 仅展示有下次跟进时间且非终态的线索（nextFollowUpTimeEnd 已置为昨日）
      const byOverdue = !s.overdue || (l.nextFollowAt && !["已成交", "无效", "丢失"].includes(l.status));
      const text = `${l.no} ${l.company} ${l.contact} ${l.email} ${l.purchaseIntent || ""}`.toLowerCase();
      return byStatus && byStatusGroup && bySite && byIntent && bySource && byOwner && byTag && byStage && byOverdue && byReply && byCreated && byLastFollow && byNextFollow && byUpdate && text.includes(keyword);
    });
  },
  hasPendingReply(lead) {
    if (["已成交", "无效", "丢失"].includes(lead.status)) return false;
    const hasUnreadMail = (CRM_MOCK.emails || []).some(mail => mail.folder === "inbox" && mail.leadId === lead.id && mail.read === false);
    const hasUnreadWhatsapp = (CRM_MOCK.whatsappConversations || []).some(conversation => conversation.leadId === lead.id && Number(conversation.unreadCount || 0) > 0);
    return hasUnreadMail || hasUnreadWhatsapp;
  },
  renderLeadTable() {
    const rows = this.leadRows();
    CRMUI.$("#leadTable").innerHTML = CRMUI.table([
      { title: "", render: l => `<input type="checkbox" data-check-lead="${l.id}" ${this.leadState.selected.has(l.id) ? "checked" : ""}>` },
      { title: "线索编号", render: l => `<a href="#" data-lead="${l.id}">${l.no}</a>` },
      { title: "询盘联系人", render: l => `${l.contact || "匿名联系人"}${l.customerId ? `<div class="small"><a href="#" data-lead-customer="${l.customerId}">${CRMUI.customerName(l.customerId)}</a></div>` : ""}` },
      { title: "来源", render: l => l.channel || "—" },
      { title: "站点", render: l => CRMUI.siteName(l.siteId) },
      { title: "负责人", render: l => CRMUI.userName(l.ownerId) },
      { title: "状态", render: l => CRMUI.badge(l.status) },
      { title: "阶段", render: l => l.stage || "-" },
      { title: "标签", render: l => [...(l.aiTags || []), ...(l.manualTags || [])].slice(0, 3).map(t => `<span class="badge gray">${t}</span>`).join(" ") || "-" },
      { title: "关注点", render: l => this.renderFocusPoints(l.focusPoints) },
      { title: "意向产品", render: l => (l.products || []).slice(0, 2).join("、") || "-" },
      { title: "最近跟进", render: l => l.lastFollowAt || "-" },
      { title: "创建时间", render: l => l.createdAt || "-" },
      { title: "操作", render: l => `<button class="btn" data-follow="${l.id}">跟进</button> ${this.canEditLead() ? `<button class="btn" data-lead-tag="${l.id}">打标签</button> <button class="btn" data-lead-edit="${l.id}">编辑</button>` : ""} ${CRMUI.actionMore([
        `<button type="button" data-lead-detail="${l.id}">查看详情</button>`,
        `<button type="button" data-lead-related="${l.id}">查看关联消息</button>`,
        `<button type="button" data-lead-convert="${l.id}">转客户</button>`,
        `<button type="button" data-lead-exception="${l.id}">标记异常</button>`,
        `<button type="button" data-lead-owner="${l.id}">变更负责人</button>`,
        ...(this.canRecycle() && l.status !== "已成交" ? [`<button type="button" data-lead-recycle="${l.id}">回收至公海</button>`] : [])
      ])}` }
    ], rows, "暂无线索");
    CRMUI.$$("[data-lead]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      this.openLeadDetail(el.dataset.lead);
    }));
    CRMUI.$$("[data-follow]").forEach(el => el.addEventListener("click", () => this.openFollowModal(el.dataset.follow)));
    CRMUI.$$("[data-lead-tag]").forEach(el => el.addEventListener("click", () => this.openLeadTagModal(el.dataset.leadTag)));
    CRMUI.$$("[data-lead-edit]").forEach(el => el.addEventListener("click", () => this.openLeadModal(CRM_MOCK.leads.find(l => l.id === el.dataset.leadEdit))));
    CRMUI.$$("[data-lead-detail]").forEach(el => el.addEventListener("click", () => this.openLeadDetail(el.dataset.leadDetail)));
    CRMUI.$$("[data-lead-related]").forEach(el => el.addEventListener("click", () => {
      const lead = CRM_MOCK.leads.find(l => l.id === el.dataset.leadRelated);
      if (!lead) return;
      const hasMail = (CRM_MOCK.emails || []).some(m => m.leadId === lead.id);
      const hasWa = (CRM_MOCK.whatsappConversations || []).some(c => c.leadId === lead.id);
      const preferWa = String(lead.channel || "").includes("WhatsApp");
      if (hasMail && hasWa) return preferWa ? CRMRouter.goto("whatsapp", { leadId: lead.id }) : CRMRouter.goto("email", { leadId: lead.id });
      if (hasMail) return CRMRouter.goto("email", { leadId: lead.id });
      if (hasWa) return CRMRouter.goto("whatsapp", { leadId: lead.id });
      if (preferWa) return CRMRouter.goto("whatsapp", { leadId: lead.id });
      if (String(lead.channel || "").includes("邮件")) return CRMRouter.goto("email", { leadId: lead.id });
      CRMUI.toast("该线索暂无关联消息");
    }));
    CRMUI.$$("[data-lead-convert]").forEach(el => el.addEventListener("click", () => this.convertLeadFromDetail(el.dataset.leadConvert)));
    CRMUI.$$("[data-lead-exception]").forEach(el => el.addEventListener("click", () => this.openStatusModal(el.dataset.leadException)));
    CRMUI.$$("[data-lead-owner]").forEach(el => el.addEventListener("click", () => this.openLeadOwnerModal(el.dataset.leadOwner)));
    CRMUI.$$("[data-lead-recycle]").forEach(el => el.addEventListener("click", () => this.openRecycleModal(el.dataset.leadRecycle)));
    CRMUI.$$("[data-lead-customer]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      const customer = CRM_MOCK.customers.find(c => c.id === el.dataset.leadCustomer);
      if (customer) this.openCustomerDetail(customer);
    }));
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
  openSelectedFollowModal() {
    const ids = Array.from(this.leadState.selected);
    if (ids.length !== 1) return CRMUI.toast("请选择一条线索录入跟进");
    this.openFollowModal(ids[0]);
  },
  openBatchLeadTagModal() {
    const ids = Array.from(this.leadState.selected);
    if (!ids.length) return CRMUI.toast("请先选择线索");
    const leads = ids.map(id => CRM_MOCK.leads.find(l => l.id === id)).filter(Boolean);
    CRMUI.modal("批量打标签", `
      <div class="form-grid">
        <div class="form-field"><label>已选择线索</label><input value="${leads.length} 条" disabled></div>
        ${CRMUI.formMultiSelect("线索标签", "tags", this.leadTagOptions().map(tag => ({ value: tag, label: tag })), [])}
      </div>`, form => {
      const tags = form.getAll("tags");
      if (!tags.length) return CRMUI.toast("请选择线索标签");
      leads.forEach(lead => {
        lead.manualTags = Array.from(new Set([...(lead.manualTags || []), ...tags]));
      });
      CRMUI.closeModal();
      CRMUI.toast(`已为 ${leads.length} 条线索打标签`);
      this.renderLeadTable();
    });
  },
  openLeadExportModal() {
    const selectedCount = this.leadState.selected.size;
    const rows = this.leadRows();
    CRMUI.modal("导出线索", `
      <div class="form-grid">
        <div class="form-field"><label>导出范围</label><select name="scope">
          <option value="filtered">当前查询结果（${rows.length} 条）</option>
          <option value="selected" ${selectedCount ? "" : "disabled"}>已选择线索（${selectedCount} 条）</option>
        </select></div>
        ${CRMUI.formMultiSelect("导出字段", "fields", ["线索编号", "询盘联系人", "企业名称", "来源渠道", "站点", "负责人", "状态", "阶段", "关注点", "意向产品", "创建时间"].map(v => ({ value: v, label: v })), ["线索编号", "询盘联系人", "企业名称", "来源渠道", "站点", "负责人", "状态"])}
      </div>`, form => {
      const scope = form.get("scope");
      if (scope === "selected" && !selectedCount) return CRMUI.toast("请先选择需要导出的线索");
      CRMUI.closeModal();
      CRMUI.toast(scope === "selected" ? `已导出 ${selectedCount} 条线索` : `已导出当前查询结果 ${rows.length} 条`);
    });
  },
  leadFollowLogs(leadId) {
    return CRM_MOCK.followLogs
      .filter(log => log.leadId === leadId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  },
  renderFocusPoints(points) {
    const list = Array.isArray(points) ? points.filter(Boolean) : [];
    if (!list.length) return "-";
    const shown = list.slice(0, 3).map(t => `<span class="badge gray">${t}</span>`).join(" ");
    return list.length > 3 ? `${shown} <span class="muted">+${list.length - 3}</span>` : shown;
  },
  mergeFocusPoints(existing, incoming) {
    const set = new Set([...(existing || []), ...(incoming || [])].map(v => String(v || "").trim()).filter(Boolean));
    return Array.from(set);
  },
  renderLeadFollowLogTable(leadId) {
    return CRMUI.table([
      { title: "跟进时间", render: log => log.createdAt },
      { title: "跟进人", render: log => CRMUI.userName(log.userId) },
      { title: "跟进方式", render: log => log.method },
      { title: "跟进内容", render: log => log.content },
      { title: "客户关注", render: log => (log.focusPoints || []).join("、") || "-" },
      { title: "当前阶段", render: log => log.stage || "-" },
      { title: "下次跟进时间", render: log => log.nextFollowAt || "-" },
      { title: "附件", render: log => (log.attachments || []).length ? `${log.attachments.length} 个` : "-" }
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
        // 跟进时间（实际录入时间）与下次跟进时间分别筛选，不混用
        const followDate = String(row.log.createdAt || "").slice(0, 10);
        const nextDate = String(row.log.nextFollowAt || "").slice(0, 10);
        const leadText = keyword(`${row.lead?.no || ""} ${row.lead?.company || ""}`);
        const customerText = keyword(`${row.customerName} ${row.lead?.company || ""}`);
        const byLead = !state.leadNo || leadText.includes(keyword(state.leadNo));
        const byCustomer = !state.customer || customerText.includes(keyword(state.customer));
        const byUser = !state.userId || row.log.userId === state.userId;
        const byMethod = !state.method || row.log.method === state.method;
        const byStage = !state.stage || row.log.stage === state.stage;
        const byFollowStart = !state.followUpTimeStart || followDate >= state.followUpTimeStart;
        const byFollowEnd = !state.followUpTimeEnd || followDate <= state.followUpTimeEnd;
        const byNextStart = !state.nextFollowUpTimeStart || (nextDate && nextDate >= state.nextFollowUpTimeStart);
        const byNextEnd = !state.nextFollowUpTimeEnd || (nextDate && nextDate <= state.nextFollowUpTimeEnd);
        return byLead && byCustomer && byUser && byMethod && byStage && byFollowStart && byFollowEnd && byNextStart && byNextEnd;
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
      if (lead) this.openLeadDetail(lead.id);
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
    bindChange("followLogFollowStart", "followUpTimeStart");
    bindChange("followLogFollowEnd", "followUpTimeEnd");
    bindChange("followLogNextStart", "nextFollowUpTimeStart");
    bindChange("followLogNextEnd", "nextFollowUpTimeEnd");
    bindChange("followLogStage", "stage");
    CRMUI.$("#followLogQuery").addEventListener("click", () => this.renderGlobalFollowLogTable());
    // 重置恢复默认（跟进时间=本月，下次跟进时间=不限制）
    CRMUI.$("#followLogReset").addEventListener("click", () => {
      const range = this.currentMonthRange();
      this.globalFollowLogState = { leadNo: "", customer: "", userId: "", method: "", followUpTimeStart: range.start, followUpTimeEnd: range.end, nextFollowUpTimeStart: "", nextFollowUpTimeEnd: "", stage: "", page: 1, pageSize: this.listPageSize() };
      const activeRoot = window.CRMWorkspace?.activeRoot?.();
      if (activeRoot) this.renderFollowLogs(activeRoot);
    });
  },
  renderFollowLogs(root) {
    // 默认跟进时间=本月，下次跟进时间=不限制
    if (!this.globalFollowLogState || !this.globalFollowLogState.followUpTimeStart) {
      const range = this.currentMonthRange();
      this.globalFollowLogState = this.globalFollowLogState || { leadNo: "", customer: "", userId: "", method: "", followUpTimeStart: range.start, followUpTimeEnd: range.end, nextFollowUpTimeStart: "", nextFollowUpTimeEnd: "", stage: "", page: 1, pageSize: this.listPageSize() };
      if (!this.globalFollowLogState.followUpTimeStart) {
        this.globalFollowLogState.followUpTimeStart = range.start;
        this.globalFollowLogState.followUpTimeEnd = range.end;
      }
    }
    const state = this.globalFollowLogState;
    const role = CRM_MOCK.currentUser?.role || "";
    const scopeLabel = role === "系统管理员" ? "全部" : role === "运营专员" ? "负责站点" : role === "协同人" ? "授权站点" : "本人";
    const methodOptions = this.followLogFilterOptions("method").map(value => `<option value="${value}" ${state.method === value ? "selected" : ""}>${value}</option>`).join("");
    const stageOptions = this.followLogFilterOptions("stage").map(value => `<option value="${value}" ${state.stage === value ? "selected" : ""}>${value}</option>`).join("");
    const userOptions = CRM_MOCK.users.map(user => `<option value="${user.id}" ${state.userId === user.id ? "selected" : ""}>${user.name}</option>`).join("");
    root.innerHTML = `
      <div class="page-header-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div>
          <div class="muted" style="margin-bottom:4px">线索中心</div>
          <h2 style="margin:0">跟进日志</h2>
        </div>
        <div class="muted">当前显示：${scopeLabel}</div>
      </div>
      <div class="list-toolbar">
        <div class="toolbar-actions"></div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>线索编号</span><input id="followLogLeadNo" value="${state.leadNo}" placeholder="按线索编号查询"></label>
            <label class="filter-item"><span>客户</span><input id="followLogCustomer" value="${state.customer}" placeholder="按客户查询"></label>
            <label class="filter-item"><span>业务员</span><select id="followLogUser"><option value="">全部业务员</option>${userOptions}</select></label>
            <label class="filter-item"><span>跟进方式</span><select id="followLogMethod"><option value="">全部跟进方式</option>${methodOptions}</select></label>
            <label class="filter-item"><span>跟进时间</span><span class="range-picker"><input id="followLogFollowStart" type="date" value="${state.followUpTimeStart}"><span class="range-separator">-</span><input id="followLogFollowEnd" type="date" value="${state.followUpTimeEnd}"></span></label>
            <label class="filter-item"><span>下次跟进</span><span class="range-picker"><input id="followLogNextStart" type="date" value="${state.nextFollowUpTimeStart}"><span class="range-separator">-</span><input id="followLogNextEnd" type="date" value="${state.nextFollowUpTimeEnd}"></span></label>
            <label class="filter-item"><span>跟进状态</span><select id="followLogStage"><option value="">全部跟进状态</option>${stageOptions}</select></label>
            <div class="filter-actions"><button class="btn" type="button" id="followLogQuery">查询</button><button class="btn" type="button" id="followLogReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="globalFollowLogTable"></div>
    `;
    this.bindGlobalFollowLogFilters();
    this.renderGlobalFollowLogTable();
  },
  openGlobalFollowLogModal() {
    CRMRouter.goto("followLogs");
  },
  renderLeadDetail(root) {
    const params = this.currentRouteParams();
    const current = CRM_MOCK.leads.find(l => l.id === params.id);
    if (!current) {
      root.innerHTML = `<div class="empty-state"><p>线索不存在或已被删除</p><button class="btn" type="button" id="backToLeads">返回线索列表</button></div>`;
      CRMUI.$("#backToLeads")?.addEventListener("click", () => CRMRouter.goto("leads"));
      return;
    }
    const isConverted = ["已转客户", "已成交"].includes(current.status);
    const canConvert = this.canConvertLead(current);
    const convertBtnLabel = "转客户";
    const linkedCustomer = current.customerId ? CRM_MOCK.customers.find(c => c.id === current.customerId) : null;
    const linkedCustomerHtml = (current.customerId && linkedCustomer) ? `
      <div class="section-title detail-section-title">关联客户</div>
      <div class="detail-desc">
        <div><div class="muted">客户名称</div><strong><a href="#" data-linked-customer="${linkedCustomer.id}">${linkedCustomer.name}</a></strong></div>
        <div><div class="muted">客户潜质分级</div><strong>${linkedCustomer.potentialLevel ? CRMUI.badge(linkedCustomer.potentialLevel) : '<span class="muted">-</span>'}</strong></div>
      </div>` : "";
    root.innerHTML = `
      <div class="detail-page">
      <div class="page-header-row detail-page-header">
        <div>
          <div class="muted detail-page-eyebrow">线索详情</div>
          <h2 class="detail-page-title">${current.no} ${CRMUI.badge(current.status)} <span class="badge blue">${current.stage || "-"}</span></h2>
        </div>
        <div class="toolbar" style="margin:0">
          <button class="btn primary" id="detailFollow">录入跟进</button>
          <button class="btn" id="detailRelatedMsg">查看关联消息</button>
          <button class="btn" id="detailConvert" ${isConverted || !canConvert ? `disabled title="${isConverted ? "已转客户/已成交线索不可重复转客户" : "当前角色无转客户权限"}"` : ""}>${convertBtnLabel}</button>
        </div>
      </div>
      <div class="card pad detail-card">
        <div class="section-title detail-section-title">基础数据</div>
        <div class="detail-desc">
          <div><div class="muted">线索编号</div><strong>${current.no}</strong></div>
          <div><div class="muted">企业名称</div><strong>${current.company || "—"}</strong></div>
          <div><div class="muted">询盘联系人</div><strong>${current.contact || "匿名联系人"}</strong></div>
          <div><div class="muted">邮箱</div><strong>${current.email || "—"}</strong></div>
          <div><div class="muted">WhatsApp</div><strong>${current.whatsapp || "—"}</strong></div>
          <div><div class="muted">电话</div><strong>${current.phone || "—"}</strong></div>
          <div><div class="muted">意向产品</div><strong>${(current.products || []).join("、") || "—"}</strong></div>
          <div><div class="muted">标签</div><strong>${[...(current.aiTags || []), ...(current.manualTags || [])].join("、") || "—"}</strong></div>
          <div><div class="muted">关注点</div><strong>${(current.focusPoints || []).join("、") || "—"}</strong></div>
          <div><div class="muted">备注</div><strong>${current.remark || current.note || "—"}</strong></div>
          <div><div class="muted">状态阶段</div><strong>${current.status} · ${current.stage || "—"}</strong></div>
          <div><div class="muted">负责人</div><strong>${CRMUI.userName(current.ownerId)}</strong></div>
          <div><div class="muted">站点</div><strong>${CRMUI.siteName(current.siteId)}</strong></div>
          <div><div class="muted">来源渠道</div><strong>${current.channel || "—"}</strong></div>
          <div><div class="muted">创建时间</div><strong>${current.createdAt || "—"}</strong></div>
          <div><div class="muted">最近跟进</div><strong>${current.lastFollowAt || "—"}</strong></div>
          <div><div class="muted">下次跟进</div><strong>${current.nextFollowAt || "—"}</strong></div>
        </div>
        ${linkedCustomerHtml}
      </div>
      <div class="card pad detail-card detail-card-tabs">
        <div class="tabs" id="leadDetailTabs">
          <div class="tab active" data-detail-tab="follow">跟进日志</div>
          <div class="tab" data-detail-tab="contracts">关联合同</div>
          <div class="tab" data-detail-tab="profile">客户画像</div>
        </div>
        <div id="leadDetailPanelFollow">${this.renderLeadFollowLogTable(current.id)}</div>
        <div id="leadDetailPanelContracts" hidden>
          ${CRMUI.table([
            { title: "合同编号", render: c => `<a href="#" data-contract="${c.id}">${c.no}</a>` },
            { title: "合同名称", render: c => c.name },
            { title: "金额", render: c => `¥${c.amount.toLocaleString()}` },
            { title: "状态", render: c => CRMUI.badge(c.status) },
            { title: "签约时间", render: c => c.signedAt }
          ], CRM_MOCK.contracts.filter(c => c.leadId === current.id), "暂无关联合同")}
        </div>
        <div id="leadDetailPanelProfile" hidden>
          ${this.renderLeadProfilePanel(current)}
        </div>
      </div>
      </div>
    `;
    CRMUI.$$("[data-detail-tab]", root).forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("[data-detail-tab]", root).forEach(t => t.classList.toggle("active", t === tab));
      const key = tab.dataset.detailTab;
      CRMUI.$("#leadDetailPanelFollow").hidden = key !== "follow";
      CRMUI.$("#leadDetailPanelContracts").hidden = key !== "contracts";
      CRMUI.$("#leadDetailPanelProfile").hidden = key !== "profile";
    }));
    CRMUI.$("#detailFollow").addEventListener("click", () => this.openFollowModal(current.id));
    CRMUI.$("#detailConvert").addEventListener("click", () => this.convertLeadFromDetail(current.id));
    CRMUI.$("#detailRelatedMsg").addEventListener("click", () => {
      const hasMail = (CRM_MOCK.emails || []).some(m => m.leadId === current.id);
      const hasWa = (CRM_MOCK.whatsappConversations || []).some(c => c.leadId === current.id);
      const preferWa = String(current.channel || "").includes("WhatsApp");
      if (hasMail && hasWa) {
        return preferWa ? CRMRouter.goto("whatsapp", { leadId: current.id }) : CRMRouter.goto("email", { leadId: current.id });
      }
      if (hasMail) return CRMRouter.goto("email", { leadId: current.id });
      if (hasWa) return CRMRouter.goto("whatsapp", { leadId: current.id });
      if (preferWa) return CRMRouter.goto("whatsapp", { leadId: current.id });
      if (String(current.channel || "").includes("邮件")) return CRMRouter.goto("email", { leadId: current.id });
      CRMUI.toast("该线索暂无关联消息");
    });
    CRMUI.$("[data-linked-customer]")?.addEventListener("click", e => {
      e.preventDefault();
      const c = CRM_MOCK.customers.find(item => item.id === e.currentTarget.dataset.linkedCustomer);
      if (c) this.openCustomerDetail(c);
    });
  },
  refreshLeadDetailIfOpen(leadId) {
    const tab = window.CRMWorkspace?.activeTab?.();
    if (!tab || tab.key !== "leadDetail") return;
    const params = this.currentRouteParams();
    if (params.id !== leadId) return;
    const page = document.getElementById(window.CRMWorkspace.pageElementId(tab.id));
    if (!page) return;
    page.dataset.rendered = "";
    this.renderLeadDetail(page);
    page.dataset.rendered = "true";
  },
  // 线索详情「客户画像」：引用询盘联系人侧画像（消息 AI 分析产物），非意向总结（§7.9 / §11.5.3）
  companyProfileForLead(lead) {
    if (!lead) return null;
    const profiles = CRM_MOCK.companyProfiles || [];
    const emailDomain = String(lead.email || "").split("@")[1]?.toLowerCase();
    if (emailDomain) {
      const byDomain = profiles.find(item => item.domain && item.domain.toLowerCase() === emailDomain);
      if (byDomain) return byDomain;
    }
    const candidates = [lead.company].filter(Boolean).map(value => value.toLowerCase());
    if (!candidates.length) return null;
    return profiles.find(profile => {
      const names = [profile.company, profile.shortName, ...(profile.aliases || [])].filter(Boolean).map(value => value.toLowerCase());
      return candidates.some(candidate => names.some(name => candidate.includes(name) || name.includes(candidate)));
    }) || null;
  },
  renderLeadProfilePanel(lead) {
    const profile = this.companyProfileForLead(lead);
    const Comm = window.CRMCommunicationPage;
    if (!profile || !Comm) {
      return `<p class="muted">暂无客户画像数据，该线索为手动创建，暂无 AI 提取的企业信息</p>`;
    }
    return `
      <div class="lead-profile-stack">
        <div class="section-title detail-section-title">企业工商信息</div>
        ${Comm.renderCustomerProfile(profile)}
        <div class="section-title detail-section-title">过往参展信息</div>
        ${Comm.renderExhibitionHistory(profile)}
        <div class="section-title detail-section-title">企业风险提示</div>
        ${Comm.renderCompanyRisk(profile)}
      </div>
    `;
  },
  // 编辑弹窗：客户画像表单（与详情三块口径一致；人工优先 BR-017）
  renderLeadProfileEditFields(lead) {
    const profile = this.companyProfileForLead(lead) || {};
    const risk = profile.risk || {};
    const exhibitionsText = (profile.exhibitions || []).map(item => `${item.year || ""} ${item.name || ""}`.trim()).filter(Boolean).join("\n");
    return `
      <div class="form-field full"><div class="section-title detail-section-title" style="margin:8px 0 0">客户画像 · 企业工商信息</div></div>
      ${CRMUI.formInput("企业名称", "profileCompany", profile.company || lead?.company || "")}
      ${CRMUI.formInput("企业简称", "profileShortName", profile.shortName || "")}
      ${CRMUI.formInput("所属行业", "profileIndustry", profile.industry || "")}
      ${CRMUI.formInput("企业规模", "profileScale", profile.scale || "")}
      ${CRMUI.formInput("成立时间", "profileFoundedAt", profile.foundedAt || "")}
      ${CRMUI.formInput("注册资本", "profileRegisteredCapital", profile.registeredCapital || "")}
      ${CRMUI.formInput("法定代表人", "profileLegalRepresentative", profile.legalRepresentative || "")}
      ${CRMUI.formInput("企业所在地", "profileLocation", profile.location || "")}
      <div class="form-field full"><label>企业基本信息</label><textarea name="profileBasicInfo">${profile.basicInfo || ""}</textarea></div>
      <div class="form-field full"><label>企业工商信息</label><textarea name="profileRegistrationInfo">${profile.registrationInfo || ""}</textarea></div>
      <div class="form-field full"><label>主营业务</label><textarea name="profileMainBusiness">${profile.mainBusiness || ""}</textarea></div>
      <div class="form-field full"><label>企业简介</label><textarea name="profileIntro">${profile.intro || ""}</textarea></div>
      <div class="form-field full"><div class="section-title detail-section-title" style="margin:8px 0 0">客户画像 · 过往参展信息</div></div>
      <div class="form-field full"><label>参展记录（每行：年份 展会名称）</label><textarea name="profileExhibitions" placeholder="2025 Toy Fair New York">${exhibitionsText}</textarea></div>
      <div class="form-field full"><label>参展趋势</label><textarea name="profileExhibitionTrend">${profile.exhibitionTrend || ""}</textarea></div>
      <div class="form-field full"><div class="section-title detail-section-title" style="margin:8px 0 0">客户画像 · 企业风险提示</div></div>
      ${CRMUI.formSelect("风险等级", "profileRiskLevel", ["低", "中", "高"].map(v => ({ value: v, label: v })), risk.level || "低")}
      <div class="form-field full"><label>企业经营风险</label><textarea name="profileRiskOperation">${risk.operation || ""}</textarea></div>
      <div class="form-field full"><label>法律诉讼</label><textarea name="profileRiskLitigation">${risk.litigation || ""}</textarea></div>
      <div class="form-field full"><label>行政处罚</label><textarea name="profileRiskAdmin">${risk.administrativePenalty || ""}</textarea></div>
      <div class="form-field full"><label>经营异常</label><textarea name="profileRiskAbnormal">${risk.abnormal || ""}</textarea></div>
      <div class="form-field full"><label>失信记录</label><textarea name="profileRiskDishonesty">${risk.dishonesty || ""}</textarea></div>
      <div class="form-field full"><label>风险综述</label><textarea name="profileRiskSummary">${risk.summary || ""}</textarea></div>
    `;
  },
  ensureCompanyProfileForLead(lead) {
    let profile = this.companyProfileForLead(lead);
    if (profile) return profile;
    const domain = String(lead.email || "").split("@")[1]?.toLowerCase() || "";
    profile = {
      domain: domain || undefined,
      company: lead.company || "",
      shortName: "",
      basicInfo: "",
      registrationInfo: "",
      industry: "",
      scale: "",
      foundedAt: "",
      registeredCapital: "",
      legalRepresentative: "",
      mainBusiness: "",
      location: "",
      intro: "",
      exhibitions: [],
      exhibitionTrend: "",
      risk: {
        operation: "",
        litigation: "",
        administrativePenalty: "",
        abnormal: "",
        dishonesty: "",
        level: "低",
        summary: ""
      },
      humanEdited: true,
      aiRecommendation: ""
    };
    CRM_MOCK.companyProfiles = CRM_MOCK.companyProfiles || [];
    CRM_MOCK.companyProfiles.push(profile);
    return profile;
  },
  parseExhibitionLines(text) {
    return String(text || "").split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
      const match = line.match(/^(\d{4})\s+(.+)$/);
      if (match) return { year: match[1], name: match[2].trim() };
      return { year: "", name: line };
    });
  },
  applyLeadProfileForm(lead, form) {
    const profile = this.ensureCompanyProfileForLead(lead);
    const before = JSON.stringify({
      company: profile.company,
      shortName: profile.shortName,
      basicInfo: profile.basicInfo,
      registrationInfo: profile.registrationInfo,
      industry: profile.industry,
      scale: profile.scale,
      foundedAt: profile.foundedAt,
      registeredCapital: profile.registeredCapital,
      legalRepresentative: profile.legalRepresentative,
      mainBusiness: profile.mainBusiness,
      location: profile.location,
      intro: profile.intro,
      exhibitions: profile.exhibitions,
      exhibitionTrend: profile.exhibitionTrend,
      risk: profile.risk
    });
    Object.assign(profile, {
      company: form.get("profileCompany") || profile.company || lead.company || "",
      shortName: form.get("profileShortName") || "",
      basicInfo: form.get("profileBasicInfo") || "",
      registrationInfo: form.get("profileRegistrationInfo") || "",
      industry: form.get("profileIndustry") || "",
      scale: form.get("profileScale") || "",
      foundedAt: form.get("profileFoundedAt") || "",
      registeredCapital: form.get("profileRegisteredCapital") || "",
      legalRepresentative: form.get("profileLegalRepresentative") || "",
      mainBusiness: form.get("profileMainBusiness") || "",
      location: form.get("profileLocation") || "",
      intro: form.get("profileIntro") || "",
      exhibitions: this.parseExhibitionLines(form.get("profileExhibitions")),
      exhibitionTrend: form.get("profileExhibitionTrend") || "",
      humanEdited: true,
      risk: {
        operation: form.get("profileRiskOperation") || "",
        litigation: form.get("profileRiskLitigation") || "",
        administrativePenalty: form.get("profileRiskAdmin") || "",
        abnormal: form.get("profileRiskAbnormal") || "",
        dishonesty: form.get("profileRiskDishonesty") || "",
        level: form.get("profileRiskLevel") || "低",
        summary: form.get("profileRiskSummary") || ""
      }
    });
    const after = JSON.stringify({
      company: profile.company,
      shortName: profile.shortName,
      basicInfo: profile.basicInfo,
      registrationInfo: profile.registrationInfo,
      industry: profile.industry,
      scale: profile.scale,
      foundedAt: profile.foundedAt,
      registeredCapital: profile.registeredCapital,
      legalRepresentative: profile.legalRepresentative,
      mainBusiness: profile.mainBusiness,
      location: profile.location,
      intro: profile.intro,
      exhibitions: profile.exhibitions,
      exhibitionTrend: profile.exhibitionTrend,
      risk: profile.risk
    });
    return before !== after;
  },
  openLeadModal(lead) {
    const isEdit = Boolean(lead);
    const canChangeOwner = this.canRecycle();
    const focusOptions = this.dictItems("customerFocus").map(item => ({ value: item.name, label: item.name }));
    const tagOptions = this.dictItems("leadTag").map(item => ({ value: item.name, label: item.name }));
    const ownerOptions = CRM_MOCK.users.filter(u => ["业务员", "运营专员"].includes(u.role) && u.status !== "禁用");
    CRMUI.modal(isEdit ? "编辑线索" : "新增线索", `
      <div class="form-grid">
        ${isEdit ? `<div class="form-field"><label>线索编号</label><input value="${lead.no}" disabled></div>` : ""}
        ${CRMUI.formInput("企业名称（所属企业）", "company", lead?.company || "")}
        ${CRMUI.formInput("询盘联系人", "contact", lead?.contact || "")}
        ${CRMUI.formInput("邮箱", "email", lead?.email || "")}
        ${CRMUI.formInput("电话", "phone", lead?.phone || "")}
        ${CRMUI.formInput("WhatsApp", "whatsapp", lead?.whatsapp || "")}
        ${isEdit ? `<div class="form-field"><label>站点</label><input value="${CRMUI.siteName(lead.siteId)}" disabled></div>` : `<div class="form-field"><label>站点</label><select name="siteId">${CRMUI.optionList(CRM_MOCK.sites, lead?.siteId || "")}</select></div>`}
        <div class="form-field"><label>来源渠道</label><select name="channel"><option ${!lead?.channel || lead?.channel === "邮件" ? "selected" : ""}>邮件</option><option ${lead?.channel === "WhatsApp" ? "selected" : ""}>WhatsApp</option><option ${lead?.channel === "官网询盘" ? "selected" : ""}>官网询盘</option><option ${lead?.channel === "展会" ? "selected" : ""}>展会</option><option ${lead?.channel === "客户转介绍" ? "selected" : ""}>客户转介绍</option><option ${lead?.channel === "其他" ? "selected" : ""}>其他</option></select></div>
        ${( !isEdit || canChangeOwner) ? `<div class="form-field"><label>负责人</label><select name="ownerId">${CRMUI.optionList(ownerOptions, lead?.ownerId || CRM_MOCK.currentUser.id)}</select></div>` : `<div class="form-field"><label>负责人</label><input value="${CRMUI.userName(lead.ownerId)}" disabled></div>`}
        ${isEdit && canChangeOwner ? `<div class="form-field full"><label>变更说明</label><textarea name="ownerNote" placeholder="若修改负责人请填写变更说明"></textarea></div>` : ""}
        ${CRMUI.formInput("意向产品", "products", (lead?.products || []).join("、"))}
        ${CRMUI.formMultiSelect("线索标签", "manualTags", tagOptions, lead?.manualTags || [])}
        ${CRMUI.formMultiSelect("关注点", "focusPoints", focusOptions, lead?.focusPoints || [])}
        <div class="form-field full"><label>备注</label><textarea name="remark">${lead?.remark || lead?.note || ""}</textarea></div>
        ${isEdit ? this.renderLeadProfileEditFields(lead) : ""}
      </div>`, form => {
      const contact = (form.get("contact") || "").trim();
      const email = (form.get("email") || "").trim();
      const phone = (form.get("phone") || "").trim();
      const whatsapp = (form.get("whatsapp") || "").trim();
      if (!contact) return CRMUI.toast("请输入询盘联系人");
      if (!email && !phone && !whatsapp) return CRMUI.toast("邮箱、电话、WhatsApp 至少填写一项");
      const focusPoints = form.getAll("focusPoints");
      const manualTags = form.getAll("manualTags");
      const products = String(form.get("products") || "").split(/[、,，]/).map(v => v.trim()).filter(Boolean);
      const remark = form.get("remark") || "";
      const channel = form.get("channel") || "其他";
      const siteId = form.get("siteId");
      if (isEdit) {
        const nextOwnerId = canChangeOwner ? (form.get("ownerId") || lead.ownerId) : lead.ownerId;
        const ownerChanged = canChangeOwner && nextOwnerId && nextOwnerId !== lead.ownerId;
        if (ownerChanged && !(form.get("ownerNote") || "").trim()) return CRMUI.toast("修改负责人时请填写变更说明");
        const changes = [];
        const track = (label, before, after) => {
          if (String(before || "") !== String(after || "")) changes.push(`${label}由[${before || "-"}]变更为[${after || "-"}]`);
        };
        track("企业名称", lead.company, form.get("company") || "");
        track("询盘联系人", lead.contact, contact);
        track("邮箱", lead.email, email);
        track("电话", lead.phone, phone);
        track("WhatsApp", lead.whatsapp, whatsapp);
        track("来源渠道", lead.channel, channel);
        track("意向产品", (lead.products || []).join("、"), products.join("、"));
        track("备注", lead.remark || lead.note, remark);
        Object.assign(lead, {
          company: form.get("company") || "",
          contact,
          email,
          phone,
          whatsapp,
          channel,
          products,
          manualTags,
          focusPoints,
          remark,
          note: remark
        });
        const profileChanged = this.applyLeadProfileForm(lead, form);
        if (profileChanged) changes.push("更新了客户画像");
        if (ownerChanged) {
          lead.ownerId = nextOwnerId;
          CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId: lead.id, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `变更负责人：${form.get("ownerNote") || ""}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 13:10", focusPoints: [], attachments: [] });
        } else if (changes.length) {
          CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId: lead.id, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: changes.join("；"), nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 13:10", focusPoints: [], attachments: [] });
        }
        CRMUI.toast("线索信息已更新");
      } else {
        if (!siteId) return CRMUI.toast("请选择站点");
        CRM_MOCK.leads.unshift({
          id: `l${Date.now()}`,
          no: `LEAD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
          company: form.get("company") || "",
          contact: contact || "匿名联系人",
          email,
          phone,
          whatsapp,
          siteId,
          channel,
          ownerId: form.get("ownerId") || CRM_MOCK.currentUser.id,
          status: "待跟进",
          stage: "待首响",
          products,
          purchaseIntent: "",
          aiTags: [],
          manualTags,
          focusPoints,
          remark,
          note: remark,
          createdAt: "2026-07-02 12:30",
          lastFollowAt: "",
          nextFollowAt: "",
          customerId: "",
          aiSummary: "手动创建线索，暂无 AI 分析。"
        });
        CRMUI.toast("线索已新增");
      }
      CRMUI.closeModal();
      this.renderLeadTable();
      if (isEdit) this.refreshLeadDetailIfOpen(lead.id);
    });
  },
  openFollowModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    const methodOptions = this.dictItems("followMethod").map(item => ({ value: item.name, label: item.name }));
    const stageOptions = this.dictItems("followStage").map(item => ({ value: item.name, label: item.name }));
    CRMUI.modal(`录入跟进 - ${lead.no}`, `
      <div class="form-grid">
        <div class="form-field full"><label>线索编号</label><input value="${lead.no} · ${lead.company || lead.contact || ""}" disabled></div>
        ${CRMUI.formSelect("跟进方式", "method", methodOptions.length ? methodOptions : ["电话", "邮件", "WhatsApp", "会议", "备注"].map(v => ({ value: v, label: v })))}
        ${CRMUI.formSelect("当前阶段", "stage", stageOptions.length ? stageOptions : ["待首响", "已联系", "需求确认", "打样阶段", "报价阶段", "谈判阶段"].map(v => ({ value: v, label: v })), lead.stage)}
        ${CRMUI.formMultiSelect("客户关注", "focus", this.dictItems("customerFocus").map(item => ({ value: item.name, label: item.name })), [])}
        <div class="form-field full"><label>跟进内容</label><textarea name="content" required></textarea></div>
        <div class="form-field"><label>下次跟进时间</label><input type="datetime-local" name="nextFollowAt" value=""></div>
        <div class="form-field full"><label>跟进附件</label><input type="file" name="attachment" multiple></div>
      </div>`, form => {
      const stage = form.get("stage");
      const focusPoints = form.getAll("focus");
      const nextFollowAt = form.get("nextFollowAt") || "";
      const files = form.getAll ? form.getAll("attachment") : [];
      const attachments = (files || []).filter(f => f && f.name).map(f => f.name);
      CRM_MOCK.followLogs.unshift({
        id: `f${Date.now()}`,
        leadId,
        userId: CRM_MOCK.currentUser.id,
        method: form.get("method"),
        stage,
        content: form.get("content"),
        focusPoints,
        nextFollowAt,
        attachments,
        createdAt: "2026-07-02 12:40"
      });
      lead.stage = stage;
      lead.lastFollowAt = "2026-07-02 12:40";
      lead.nextFollowAt = nextFollowAt;
      lead.focusPoints = this.mergeFocusPoints(lead.focusPoints, focusPoints);
      const originalStatus = lead.status;
      const closedStatus = ["已成交", "无效", "丢失"].includes(originalStatus);
      if (!closedStatus && originalStatus === "待跟进") lead.status = "跟进中";
      CRMUI.closeModal();
      CRMUI.toast("跟进记录已保存");
      this.renderLeadTable();
      this.refreshLeadDetailIfOpen(leadId);
    });
  },
  openStatusModal(leadId, after) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    CRMUI.modal("标记异常", `
      <div class="form-grid">
        <div class="form-field"><label>当前状态</label><input value="${lead.status}" disabled></div>
        ${CRMUI.formSelect("异常类型", "status", ["无效", "丢失"].map(v => ({ value: v, label: v })), "无效")}
        <div class="form-field full"><label>异常备注</label><textarea name="reason" required></textarea></div>
      </div>`, form => {
      const target = form.get("status");
      const wasInPublicPool = this.isPublicPoolLead(lead);
      lead.status = target;
      if (wasInPublicPool) {
        lead.poolReason = lead.poolReason || "标记异常保留公海";
        lead.poolEnteredAt = lead.poolEnteredAt || "2026-07-02 12:45";
      }
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `标记异常：${lead.status}-${form.get("reason")}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 12:45" });
      CRMUI.closeModal();
      CRMUI.toast("线索已标记异常");
      CRMUI.closeDrawer();
      if (typeof after === "function") {
        after();
      } else if (CRMUI.$("#leadTable")) {
        this.renderLeadTable();
      }
    });
  },
  openLeadOwnerModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    if (!lead) return;
    CRMUI.modal("变更负责人", `
      <div class="form-grid">
        <div class="form-field"><label>线索编号</label><input value="${lead.no}" disabled></div>
        <div class="form-field"><label>客户名称</label><input value="${lead.company}" disabled></div>
        <div class="form-field"><label>分配状态</label><input value="${lead.status}" disabled></div>
        <div class="form-field"><label>站点</label><input value="${CRMUI.siteName(lead.siteId)}" disabled></div>
        <div class="form-field"><label>当前负责人</label><input value="${CRMUI.userName(lead.ownerId)}" disabled></div>
        <div class="form-field"><label>新负责人</label><select name="ownerId" required>${CRMUI.optionList(CRM_MOCK.users.filter(u => ["业务员", "运营专员"].includes(u.role) && u.status !== "禁用"), lead.ownerId)}</select></div>
        <div class="form-field full"><label>变更备注</label><textarea name="note" required></textarea></div>
      </div>`, form => {
      const ownerId = form.get("ownerId");
      if (!ownerId) return CRMUI.toast("请选择新负责人");
      if (ownerId === lead.ownerId) return CRMUI.toast("新负责人不可与当前负责人相同");
      lead.ownerId = ownerId;
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `变更负责人：${form.get("note") || ""}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 13:10" });
      CRMUI.closeModal();
      CRMUI.toast("负责人已变更");
      this.renderLeadTable();
    });
  },
  canRecycle() {
    const role = CRM_MOCK.currentUser?.role;
    return role === "运营专员" || role === "系统管理员";
  },
  checkedFilterValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
  },
  canEditLead() {
    return CRM_MOCK.currentUser?.role !== "协同人";
  },
  canEditCustomer() {
    return CRM_MOCK.currentUser?.role !== "协同人";
  },
  canBulkConvert() {
    return this.canRecycle();
  },
  canConvertLead(lead) {
    if (CRM_MOCK.currentUser?.role === "协同人") return false;
    if (lead?.status === "待分配") return this.canRecycle();
    return true;
  },
  openRecycleModal(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    if (!lead) return;
    if (lead.status === "已成交") return CRMUI.toast("已成交线索不可回收");
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
    const leads = ids.map(id => CRM_MOCK.leads.find(l => l.id === id)).filter(Boolean).filter(l => l.status !== "已成交");
    if (!leads.length) return CRMUI.toast("所选线索中没有可回收线索");
    CRMUI.modal("回收至公海", `
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
  // 执行回收：状态置为"待分配"，清空负责人，记录入池原因/时间，生成跟进记录
  executeRecycle(leads, reason) {
    const now = "2026-07-02 13:00";
    leads.forEach(lead => {
      lead.status = "待分配";
      lead.ownerId = "";
      lead.poolReason = "运营专员手动回收";
      lead.poolEnteredAt = now;
      CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}_${lead.id}`, leadId: lead.id, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `运营专员手动回收至公海：${reason}`, nextFollowAt: lead.nextFollowAt, createdAt: now });
    });
  },
  convertSelectedLeads() {
    if (!this.canBulkConvert()) return CRMUI.toast("当前角色无批量转客户权限");
    const ids = Array.from(this.leadState.selected);
    if (!ids.length) return CRMUI.toast("请先选择线索");
    const leads = ids.map(id => CRM_MOCK.leads.find(l => l.id === id)).filter(Boolean);
    const terminal = leads.filter(lead => ["已转客户", "已成交"].includes(lead.status));
    const actionable = leads.filter(lead => !["已转客户", "已成交"].includes(lead.status));
    let success = 0;
    actionable.forEach(lead => { if (this.convertLead(lead)) success += 1; });
    this.leadState.selected.clear();
    if (terminal.length && !actionable.length) {
      CRMUI.toast(`所选 ${terminal.length} 条为已转客户/已成交线索，已跳过`);
    } else if (terminal.length) {
      CRMUI.toast(`成功转客户 ${success} 条；${terminal.length} 条已转客户/已成交线索已跳过`);
    } else {
      CRMUI.toast(`成功转客户 ${success} 条`);
    }
    this.renderLeadTable();
  },
  isConvertedLead(lead) {
    return ["已转客户", "已成交"].includes(lead.status);
  },
  // 转客户：客户匹配（企业名称 + 站点精确匹配）→ 关联已有客户或新建客户 → 同步 AI 信息（BR-036）
  // 仅已转客户/已成交线索不可重复转化；无效/丢失允许按手动路径转客户
  convertLead(lead) {
    if (["已转客户", "已成交"].includes(lead.status)) {
      CRMUI.toast(`线索 ${lead.no} 已转客户/已成交，不可重复转客户`);
      return false;
    }
    const existing = CRM_MOCK.customers.find(c => c.name === lead.company && c.siteId === lead.siteId);
    const prefill = this.customerCountryIndustryFromLead(lead);
    let customer;
    let action;
    if (existing) {
      // 关联已有客户：线索负责人不变（BR-035）；国家/行业仅补空（BR-036）
      customer = existing;
      if (!customer.leadIds.includes(lead.id)) customer.leadIds.unshift(lead.id);
      this.applyCustomerCountryIndustryPrefill(customer, prefill, true);
      action = `关联已有客户 ${customer.name}`;
    } else {
      const customerName = lead.company || lead.contact || "未命名客户";
      customer = {
        id: `c${Date.now()}`,
        no: `CUS-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        name: customerName,
        siteId: lead.siteId,
        country: prefill.country || "",
        industry: prefill.industry || "",
        ownerId: lead.ownerId || CRM_MOCK.currentUser.id,
        potentialLevel: "可跟进",
        tags: [],
        leadIds: [lead.id],
        contractIds: [],
        transferRecords: [],
        aiProfile: "",
        createdAt: new Date().toISOString().slice(0, 10)
      };
      CRM_MOCK.customers.unshift(customer);
      action = `新建客户 ${customer.name}`;
    }
    lead.customerId = customer.id;
    lead.status = "已转客户";
    CRM_MOCK.followLogs.unshift({ id: `f${Date.now()}`, leadId: lead.id, userId: CRM_MOCK.currentUser.id, method: "备注", stage: lead.stage, content: `转客户：${action}`, nextFollowAt: lead.nextFollowAt, createdAt: "2026-07-02 12:50" });
    return true;
  },
  // 从线索关联工商画像提取国家/行业，并映射到客户域字典；匹配不上留空（BR-036）
  customerCountryIndustryFromLead(lead) {
    const profile = this.companyProfileForLead(lead);
    if (!profile) return { country: "", industry: "" };
    return {
      country: this.matchCustomerDictValue("country", profile.location || profile.country || ""),
      industry: this.matchCustomerDictValue("industry", profile.industry || "")
    };
  },
  applyCustomerCountryIndustryPrefill(customer, prefill, onlyEmpty) {
    if (!customer || !prefill) return;
    const empty = value => !value || value === "-";
    if (prefill.country && (!onlyEmpty || empty(customer.country))) customer.country = prefill.country;
    if (prefill.industry && (!onlyEmpty || empty(customer.industry))) customer.industry = prefill.industry;
  },
  matchCustomerDictValue(dictCode, raw) {
    const text = String(raw || "").trim();
    if (!text) return "";
    const items = this.dictItems(dictCode).map(item => item.name).filter(Boolean);
    const exact = items.find(name => name === text);
    if (exact) return exact;
    const contains = items.find(name => text.includes(name) || name.includes(text));
    if (contains) return contains;
    // 工商画像常用英文地名 → 字典中文（仅精确别名，匹配不上仍留空）
    if (dictCode === "country") {
      const aliases = [
        ["墨西哥", ["mexico"]],
        ["德国", ["germany", "deutschland"]],
        ["加拿大", ["canada"]],
        ["美国", ["united states", "u.s.a", "u.s.", "usa", "america"]],
        ["英国", ["united kingdom", "u.k.", "uk", "britain", "england"]],
        ["法国", ["france"]],
        ["意大利", ["italy"]],
        ["阿联酋", ["united arab emirates", "u.a.e", "uae", "dubai"]],
        ["日本", ["japan"]],
        ["韩国", ["south korea", "korea"]],
        ["印度", ["india"]],
        ["巴西", ["brazil"]],
        ["澳大利亚", ["australia"]],
        ["中国", ["china", "prc"]]
      ];
      const lower = text.toLowerCase();
      const hit = aliases.find(([, keys]) => keys.some(key => lower.includes(key)));
      if (hit && items.includes(hit[0])) return hit[0];
    }
    return "";
  },
  // 详情页入口：点击【转客户】
  convertLeadFromDetail(leadId) {
    const lead = CRM_MOCK.leads.find(l => l.id === leadId);
    if (!lead) return;
    if (!this.canConvertLead(lead)) return CRMUI.toast("当前角色无转客户权限");
    const ok = this.convertLead(lead);
    if (ok) {
      CRMUI.closeModal();
      CRMUI.toast("转客户成功");
      this.renderLeadTable();
      this.refreshLeadDetailIfOpen(lead.id);
    }
  },
  renderContracts(root) {
    // 签约日期默认本月，创建时间默认不限制
    const monthRange = this.currentMonthRange();
    this.contractState = { no: "", customerName: "", status: "", ownerId: "", amountMin: "", amountMax: "", signDateStart: monthRange.start, signDateEnd: monthRange.end, createTimeStart: "", createTimeEnd: "" };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="newContract">新增合同</button>
          <button class="btn" id="contractImport">批量导入</button>
          <button class="btn" id="contractExport">导出</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>合同编号</span><input id="contractNo" placeholder="按合同编号查询"></label>
            <label class="filter-item"><span>客户名称</span><input id="contractCustomer" placeholder="模糊搜客户名/邮箱"></label>
            <label class="filter-item"><span>状态</span><select id="contractStatus"><option value="">全部状态</option><option>已签约</option><option>失效</option></select></label>
            <label class="filter-item"><span>负责人</span><select id="contractOwner"><option value="">全部负责人</option>${CRM_MOCK.users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}</select></label>
            <label class="filter-item"><span>合同金额</span><span class="range-picker"><input type="number" id="contractAmountMin" placeholder="最小" min="0" step="0.01"><span class="range-separator">-</span><input type="number" id="contractAmountMax" placeholder="最大" min="0" step="0.01"></span></label>
            <label class="filter-item"><span>签约日期</span><span class="range-picker"><input type="date" id="contractSignStart" value="${this.contractState.signDateStart}"><span class="range-separator">-</span><input type="date" id="contractSignEnd" value="${this.contractState.signDateEnd}"></span></label>
            <label class="filter-item"><span>创建时间</span><span class="range-picker"><input type="date" id="contractCreateStart" value="${this.contractState.createTimeStart}"><span class="range-separator">-</span><input type="date" id="contractCreateEnd" value="${this.contractState.createTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="contractQuery">查询</button><button class="btn" id="contractReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="contractTable"></div>
    `;
    CRMUI.$("#contractNo").addEventListener("input", e => { this.contractState.no = e.target.value.toLowerCase(); this.renderContractTable(); });
    CRMUI.$("#contractCustomer").addEventListener("input", e => { this.contractState.customerName = e.target.value.toLowerCase(); this.renderContractTable(); });
    CRMUI.$("#contractStatus").addEventListener("change", e => { this.contractState.status = e.target.value; this.renderContractTable(); });
    CRMUI.$("#contractOwner").addEventListener("change", e => { this.contractState.ownerId = e.target.value; this.renderContractTable(); });
    CRMUI.$$("#contractAmountMin,#contractAmountMax").forEach(el => el.addEventListener("change", () => {
      this.contractState.amountMin = CRMUI.$("#contractAmountMin").value;
      this.contractState.amountMax = CRMUI.$("#contractAmountMax").value;
      this.renderContractTable();
    }));
    CRMUI.$$("#contractSignStart,#contractSignEnd,#contractCreateStart,#contractCreateEnd").forEach(el => el.addEventListener("change", e => {
      const suffix = el.id.endsWith("Start") ? "Start" : "End";
      const prefix = el.id.startsWith("contractSign") ? "signDate" : "createTime";
      this.contractState[`${prefix}${suffix}`] = e.target.value;
      this.renderContractTable();
    }));
    CRMUI.$("#contractQuery").addEventListener("click", () => {
      const min = CRMUI.$("#contractAmountMin").value;
      const max = CRMUI.$("#contractAmountMax").value;
      if (min !== "" && max !== "" && Number(min) > Number(max)) return CRMUI.toast("最小金额不能大于最大金额");
      this.contractState.amountMin = min;
      this.contractState.amountMax = max;
      this.renderContractTable();
    });
    // 重置恢复默认（签约日期=本月，创建时间=不限制）
    CRMUI.$("#contractReset").addEventListener("click", () => {
      const range = this.currentMonthRange();
      this.contractState.no = "";
      this.contractState.customerName = "";
      this.contractState.status = "";
      this.contractState.ownerId = "";
      this.contractState.amountMin = "";
      this.contractState.amountMax = "";
      this.contractState.signDateStart = range.start;
      this.contractState.signDateEnd = range.end;
      this.contractState.createTimeStart = "";
      this.contractState.createTimeEnd = "";
      CRMUI.$("#contractNo").value = "";
      CRMUI.$("#contractCustomer").value = "";
      CRMUI.$("#contractStatus").value = "";
      CRMUI.$("#contractOwner").value = "";
      CRMUI.$("#contractAmountMin").value = "";
      CRMUI.$("#contractAmountMax").value = "";
      CRMUI.$("#contractSignStart").value = range.start;
      CRMUI.$("#contractSignEnd").value = range.end;
      CRMUI.$("#contractCreateStart").value = "";
      CRMUI.$("#contractCreateEnd").value = "";
      this.renderContractTable();
    });
    CRMUI.$("#newContract").addEventListener("click", () => this.openContractModal(CRM_MOCK.customers[0].id, () => this.renderContractTable()));
    CRMUI.$("#contractImport").addEventListener("click", () => this.openBatchImportModal("合同"));
    CRMUI.$("#contractExport").addEventListener("click", () => this.openContractExportModal());
    this.renderContractTable();
  },
  renderContractTable() {
    const s = this.contractState;
    const rows = CRM_MOCK.contracts.filter(contract => {
      const customer = CRMUI.customerName(contract.customerId);
      const customerObj = CRM_MOCK.customers.find(c => c.id === contract.customerId);
      const customerEmail = (customerObj?.contacts || []).map(c => c.email || "").join(" ");
      // 签约日期与创建时间分别筛选、不混用；失效合同仍展示
      const signDate = String(contract.signedAt || "").slice(0, 10);
      const createDate = String(contract.createdAt || "").slice(0, 10);
      const bySignStart = !s.signDateStart || (signDate && signDate >= s.signDateStart);
      const bySignEnd = !s.signDateEnd || (signDate && signDate <= s.signDateEnd);
      const byCreateStart = !s.createTimeStart || (createDate && createDate >= s.createTimeStart);
      const byCreateEnd = !s.createTimeEnd || (createDate && createDate <= s.createTimeEnd);
      const byNo = !s.no || String(contract.no || "").toLowerCase().includes(s.no);
      const byCustomer = !s.customerName || `${customer} ${customerEmail}`.toLowerCase().includes(s.customerName);
      const byOwner = !s.ownerId || contract.ownerId === s.ownerId;
      const byAmountMin = s.amountMin === "" || Number(contract.amount) >= Number(s.amountMin);
      const byAmountMax = s.amountMax === "" || Number(contract.amount) <= Number(s.amountMax);
      return byNo && byCustomer && byOwner && byAmountMin && byAmountMax
        && (!s.status || contract.status === s.status)
        && bySignStart && bySignEnd && byCreateStart && byCreateEnd;
    });
    CRMUI.$("#contractTable").innerHTML = CRMUI.table([
      { title: "合同编号", render: c => `<a href="#" data-contract="${c.id}">${c.no}</a>` },
      { title: "合同名称", render: c => c.name },
      { title: "客户", render: c => CRMUI.customerName(c.customerId) },
      { title: "关联线索", render: c => this.renderContractLeadLink(c) },
      { title: "负责人", render: c => CRMUI.userName(c.ownerId) },
      { title: "金额", render: c => `¥${c.amount.toLocaleString()}` },
      { title: "签约日期", render: c => c.signedAt },
      { title: "状态", render: c => CRMUI.badge(c.status) },
      { title: "附件", render: c => `${c.attachments.length} 个附件` },
      { title: "操作", render: c => {
        const isVoid = c.status === "失效";
        return `<button class="btn" data-contract="${c.id}">详情</button> <button class="btn" data-contract-edit="${c.id}">编辑</button> ${CRMUI.actionMore([
          `<button type="button" class="danger" data-contract-void="${c.id}" ${isVoid ? "disabled title='已失效合同不可再作废'" : ""}>作废</button>`
        ])}`;
      } }
    ], rows, "暂无合同");
    CRMUI.$$("[data-contract]").forEach(btn => btn.addEventListener("click", e => {
      e.preventDefault();
      const c = CRM_MOCK.contracts.find(item => item.id === btn.dataset.contract);
      CRMUI.drawer(`合同详情 ${c.no}`, `
        <p>${CRMUI.badge(c.status)} <span class="badge gray">${c.no}</span></p>
        <div class="grid cols-2">
          <div><div class="muted">合同编号</div><strong>${c.no}</strong></div>
          <div><div class="muted">合同名称</div><strong>${c.name}</strong></div>
          <div><div class="muted">合同状态</div><strong>${CRMUI.badge(c.status)}</strong></div>
          <div><div class="muted">负责人</div><strong>${CRMUI.userName(c.ownerId)}</strong></div>
          <div><div class="muted">客户</div><strong>${CRMUI.customerName(c.customerId)}</strong></div>
          <div><div class="muted">关联线索</div><strong>${this.renderContractLeadLink(c)}</strong></div>
          <div><div class="muted">金额</div><strong>¥${c.amount.toLocaleString()}</strong></div>
          <div><div class="muted">签约日期</div><strong>${c.signedAt}</strong></div>
        </div>
        <div class="section-title">附件</div><p>${c.attachments.map(a => `<span class="badge gray">${a}</span>`).join(" ") || "无附件"}</p>
      `);
      this.bindContractLeadLinks();
    }));
    this.bindContractLeadLinks();
    CRMUI.$$("[data-contract-edit]").forEach(btn => btn.addEventListener("click", () => this.openEditContractModal(btn.dataset.contractEdit)));
    CRMUI.$$("[data-contract-void]").forEach(btn => btn.addEventListener("click", () => {
      const c = CRM_MOCK.contracts.find(item => item.id === btn.dataset.contractVoid);
      if (!c || c.status !== "已签约") return;
      this.voidContract(btn.dataset.contractVoid);
    }));
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
        if (lead) this.openLeadDetail(lead.id);
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
      .filter(user => ["业务员", "运营专员"].includes(user.role) && (user.status !== "禁用" || user.id === value))
      .map(user => `<option value="${user.id}" ${user.id === value ? "selected" : ""}>${user.name}</option>`)
      .join("");
  },
  contractFormFields(contract = {}) {
    const salesUsers = CRM_MOCK.users.filter(user => ["业务员", "运营专员"].includes(user.role) && user.status !== "禁用");
    const ownerId = contract.ownerId || salesUsers[0]?.id || CRM_MOCK.currentUser.id;
    const isEdit = Boolean(contract.id || contract.no);
    const statusOpts = [
      { value: "已签约", label: "已签约" },
      { value: "失效", label: "失效" }
    ];
    return `
      ${isEdit ? `<div class="form-field"><label>合同编号</label><input value="${contract.no || ""}" disabled></div>` : CRMUI.formInput("合同编号", "no")}
      ${CRMUI.formInput("合同名称", "name", contract.name || "")}
      <div class="form-field"><label>客户</label><select name="customerId" required ${isEdit ? "disabled" : ""}>${this.contractCustomerOptions(contract.customerId || "")}</select></div>
      <div class="form-field"><label>关联线索</label><select name="leadId" ${isEdit ? "disabled" : ""}>${this.contractLeadOptions(contract.leadId || "")}</select></div>
      <div class="form-field"><label>负责人</label><select name="ownerId" required>${this.contractOwnerOptions(ownerId)}</select></div>
      ${CRMUI.formInput("金额", "amount", contract.amount || "", "number")}
      ${CRMUI.formInput("签约日期", "signedAt", contract.signedAt || "2026-07-02", "date")}
      ${isEdit
        ? `${CRMUI.formSelect("合同状态", "status", statusOpts, contract.status || "已签约")}
           <div class="form-field full" id="voidReasonField" ${contract.status === "失效" ? "" : "hidden"}><label>失效原因</label><select name="voidReason"><option value="">请选择</option>${["业务取消", "重复创建", "信息错误", "客户主动放弃", "其他"].map(v => `<option value="${v}">${v}</option>`).join("")}</select></div>`
        : `<div class="form-field"><label>合同状态</label><input value="已签约" disabled><input type="hidden" name="status" value="已签约"></div>`}
      <div class="form-field full"><label>合同附件</label><input type="file" name="attachments" multiple></div>
    `;
  },
  openEditContractModal(id) {
    const c = CRM_MOCK.contracts.find(item => item.id === id);
    if (!c) return;
    CRMUI.modal("编辑合同", `
      <div class="form-grid">
        ${this.contractFormFields(c)}
      </div>`, form => {
      const nextStatus = form.get("status") || c.status;
      const prevStatus = c.status;
      if (nextStatus === "失效" && prevStatus === "已签约") {
        const reason = (form.get("voidReason") || "").trim();
        if (!reason) return CRMUI.toast("将状态改为失效时须填写失效原因");
        c.voidReason = reason;
      }
      c.name = form.get("name");
      c.amount = Number(form.get("amount"));
      c.signedAt = form.get("signedAt");
      c.ownerId = form.get("ownerId");
      // 关联线索编辑只读，不写回 form leadId
      c.status = nextStatus;
      if (prevStatus === "已签约" && nextStatus === "失效") this.rollbackLeadIfNeeded(c);
      if (prevStatus === "失效" && nextStatus === "已签约") this.markLeadDealByContract(c);
      CRMUI.closeModal();
      CRMUI.toast("合同已更新");
      this.renderContractTable();
    });
    const statusSelect = document.querySelector("#modalRoot select[name='status']") || document.querySelector(".modal-mask select[name='status']") || document.querySelector("select[name='status']");
    const reasonField = document.querySelector("#voidReasonField");
    if (statusSelect && reasonField) {
      const syncReason = () => { reasonField.hidden = statusSelect.value !== "失效"; };
      statusSelect.addEventListener("change", syncReason);
      syncReason();
    }
  },
  markLeadDealByContract(contract) {
    if (!contract.leadId) return;
    const lead = CRM_MOCK.leads.find(item => item.id === contract.leadId);
    if (!lead) return;
    lead.status = "已成交";
  },
  rollbackLeadIfNeeded(contract) {
    if (!contract.leadId) return;
    const lead = CRM_MOCK.leads.find(item => item.id === contract.leadId);
    if (!lead || lead.status !== "已成交") return;
    const hasOtherSigned = CRM_MOCK.contracts.some(item =>
      item.id !== contract.id && item.leadId === contract.leadId && item.status === "已签约"
    );
    if (hasOtherSigned) return;
    lead.status = "已转客户";
    CRM_MOCK.followLogs.unshift({
      id: `f${Date.now()}`,
      leadId: lead.id,
      userId: CRM_MOCK.currentUser.id,
      method: "系统",
      stage: lead.stage,
      content: `系统：合同[${contract.no}]已失效，线索状态由「已成交」变更为「已转客户」`,
      nextFollowAt: lead.nextFollowAt,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " ")
    });
  },
  voidContract(id) {
    const c = CRM_MOCK.contracts.find(item => item.id === id);
    if (!c || c.status !== "已签约") return;
    CRMUI.modal("作废合同", `
      <p>作废后合同状态变为「失效」，仍保留在列表中；不提供删除。亦可在【编辑合同】中改状态为失效。</p>
      <div class="form-grid">
        ${CRMUI.formSelect("作废原因", "reason", ["业务取消", "重复创建", "信息错误", "客户主动放弃", "其他"].map(v => ({ value: v, label: v })))}
        <div class="form-field full"><label>作废备注</label><textarea name="note"></textarea></div>
      </div>`, () => {
      c.status = "失效";
      this.rollbackLeadIfNeeded(c);
      CRMUI.closeModal();
      CRMUI.toast("合同已失效");
      this.renderContractTable();
    });
  },
  renderCustomers(root) {
    const q = CRMRouter.query();
    this.customerState = { query: "", potentialLevel: "", industry: "", country: "", siteId: "", ownerId: "", createTimeStart: "", createTimeEnd: "", lastFollowUpTimeStart: "", lastFollowUpTimeEnd: "", customerId: q.customerId || "", selected: new Set() };
    const levelOpts = this.dictItems("customerLevel").map(i => `<option value="${i.name}">${i.name}</option>`).join("");
    const industryOpts = this.dictItems("industry").map(i => `<option value="${i.name}">${i.name}</option>`).join("");
    const countryOpts = this.dictItems("country").map(i => `<option value="${i.name}">${i.name}</option>`).join("");
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="newCustomer">新建客户</button>
          <button class="btn" id="customerImport">批量导入</button>
          <button class="btn" id="customerExport">导出</button>
          <button class="btn" id="transferCustomer">变更负责人</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters search-filter">
            <label class="filter-item"><span>关键词</span><input id="customerSearch" placeholder="搜索客户名称、编号"></label>
            <label class="filter-item"><span>潜质分级</span><select id="customerPotentialLevel"><option value="">全部潜质分级</option>${levelOpts}</select></label>
            <label class="filter-item"><span>行业</span><select id="customerIndustry"><option value="">全部行业</option>${industryOpts}</select></label>
            <label class="filter-item"><span>国家/地区</span><select id="customerCountry"><option value="">全部国家/地区</option>${countryOpts}</select></label>
            <label class="filter-item"><span>站点</span><select id="customerSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></label>
            <label class="filter-item"><span>负责人</span><select id="customerOwner"><option value="">全部负责人</option>${CRM_MOCK.users.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}</select></label>
            <label class="filter-item"><span>创建时间</span><span class="range-picker"><input type="date" id="customerCreateTimeStart" value="${this.customerState.createTimeStart}"><span class="range-separator">-</span><input type="date" id="customerCreateTimeEnd" value="${this.customerState.createTimeEnd}"></span></label>
            <label class="filter-item"><span>最近跟进</span><span class="range-picker"><input type="date" id="customerLastFollowStart" value="${this.customerState.lastFollowUpTimeStart}"><span class="range-separator">-</span><input type="date" id="customerLastFollowEnd" value="${this.customerState.lastFollowUpTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="customerQuery">查询</button><button class="btn" id="customerReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="customerTable"></div>
    `;
    CRMUI.$("#customerSearch").addEventListener("input", e => { this.customerState.query = e.target.value.toLowerCase(); this.renderCustomerTable(); });
    CRMUI.$("#customerPotentialLevel").addEventListener("change", e => { this.customerState.potentialLevel = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerIndustry").addEventListener("change", e => { this.customerState.industry = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerCountry").addEventListener("change", e => { this.customerState.country = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerSite").addEventListener("change", e => { this.customerState.siteId = e.target.value; this.renderCustomerTable(); });
    CRMUI.$("#customerOwner").addEventListener("change", e => { this.customerState.ownerId = e.target.value; this.renderCustomerTable(); });
    CRMUI.$$("#customerCreateTimeStart,#customerCreateTimeEnd,#customerLastFollowStart,#customerLastFollowEnd").forEach(el => el.addEventListener("change", e => {
      const suffix = el.id.endsWith("Start") ? "Start" : "End";
      const prefix = el.id.startsWith("customerCreateTime") ? "createTime" : "lastFollowUpTime";
      this.customerState[`${prefix}${suffix}`] = e.target.value;
      this.renderCustomerTable();
    }));
    CRMUI.$("#customerQuery").addEventListener("click", () => this.renderCustomerTable());
    // 重置恢复默认（创建时间/最近跟进时间均不限制）
    CRMUI.$("#customerReset").addEventListener("click", () => { this.customerState = { query: "", potentialLevel: "", industry: "", country: "", siteId: "", ownerId: "", createTimeStart: "", createTimeEnd: "", lastFollowUpTimeStart: "", lastFollowUpTimeEnd: "", customerId: "", selected: new Set() }; this.renderCustomers(root); });
    CRMUI.$("#newCustomer").addEventListener("click", () => this.openCustomerModal());
    CRMUI.$("#customerImport").addEventListener("click", () => this.openBatchImportModal("客户"));
    CRMUI.$("#customerExport").addEventListener("click", () => this.openCustomerExportModal());
    CRMUI.$("#transferCustomer").addEventListener("click", () => this.openTransferCustomerModal(Array.from(this.customerState.selected), "batch"));
    this.renderCustomerTable();
    if (q.id) {
      const customer = CRM_MOCK.customers.find(c => c.id === q.id);
      if (customer) setTimeout(() => this.openCustomerDetail(customer), 0);
    }
  },
  // 客户最近一次关联跟进时间：取该客户名下线索的跟进记录最近一条 createdAt
  customerLastFollowAt(customer) {
    const leadIds = new Set(customer.leadIds || []);
    const logs = CRM_MOCK.followLogs.filter(log => log.leadId && leadIds.has(log.leadId));
    if (!logs.length) return "";
    return logs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0].createdAt;
  },
  customerRows() {
    const s = this.customerState;
    return CRM_MOCK.customers.filter(c => {
      const text = `${c.no} ${c.name}`.toLowerCase();
      const byCreated = this.dateInRange(c.createdAt, s.createTimeStart, s.createTimeEnd);
      // 最近跟进时间：后端待支持，前端先按本地数据过滤
      const lastFollow = this.customerLastFollowAt(c);
      const byLastFollow = !s.lastFollowUpTimeStart && !s.lastFollowUpTimeEnd ? true : (lastFollow ? this.dateInRange(lastFollow, s.lastFollowUpTimeStart, s.lastFollowUpTimeEnd) : false);
      return text.includes(s.query)
        && (!s.potentialLevel || c.potentialLevel === s.potentialLevel)
        && (!s.industry || c.industry === s.industry)
        && (!s.country || c.country === s.country)
        && (!s.siteId || c.siteId === s.siteId)
        && (!s.ownerId || c.ownerId === s.ownerId)
        && byCreated && byLastFollow;
    });
  },
  renderCustomerTable() {
    CRMUI.$("#customerTable").innerHTML = CRMUI.table([
      { title: "", render: c => `<input type="checkbox" data-check-customer="${c.id}" ${this.customerState.selected.has(c.id) ? "checked" : ""}>` },
      { title: "客户名称+编号", render: c => `<a href="#" data-customer="${c.id}">${c.name}</a><div class="small muted">${c.no}</div>` },
      { title: "站点", render: c => CRMUI.siteName(c.siteId) },
      { title: "国家/地区", render: c => c.country || "-" },
      { title: "行业", render: c => c.industry || "-" },
      { title: "客户潜质分级", render: c => c.potentialLevel ? CRMUI.badge(c.potentialLevel) : `<span class="muted">-</span>` },
      { title: "负责人", render: c => CRMUI.userName(c.ownerId) },
      { title: "客户标签", render: c => c.tags.length ? c.tags.slice(0, 3).map(t => `<span class="badge gray">${t}</span>`).join(" ") : `<span class="muted">暂无标签</span>` },
      { title: "关联线索数", render: c => { const n = (c.leadIds || []).length; return `<a href="#" data-customer-leads="${c.id}">${n}</a>`; } },
      { title: "关联合同数", render: c => CRM_MOCK.contracts.filter(ct => ct.customerId === c.id).length },
      { title: "最近签约合同", render: c => this.latestSignedContract(c) },
      { title: "操作", render: c => {
        const more = this.canEditCustomer() ? CRMUI.actionMore([
          `<button type="button" data-customer-tag="${c.id}">打标签</button>`,
          `<button type="button" data-customer-transfer="${c.id}">变更负责人</button>`,
          `<button type="button" data-customer-contact="${c.id}">添加联系人</button>`
        ]) : "";
        return `<button class="btn" data-customer="${c.id}">详情</button> ${this.canEditCustomer() ? `<button class="btn" data-customer-edit="${c.id}">编辑</button>` : ""} ${more}`;
      } }
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
      this.openCustomerDetail(el.dataset.customer);
    }));
    CRMUI.$$("[data-ai-profile]").forEach(el => el.addEventListener("click", () => {
      const c = CRM_MOCK.customers.find(item => item.id === el.dataset.aiProfile);
      if (!c) return;
      CRMUI.modal("AI 客户画像", this.renderCustomerProfilePanel(c), () => CRMUI.closeModal());
    }));
    CRMUI.$$("[data-customer-edit]").forEach(el => el.addEventListener("click", () => this.openCustomerModal(CRM_MOCK.customers.find(c => c.id === el.dataset.customerEdit))));
    CRMUI.$$("[data-customer-tag]").forEach(el => el.addEventListener("click", () => this.openCustomerTagModal(el.dataset.customerTag)));
    CRMUI.$$("[data-customer-transfer]").forEach(el => el.addEventListener("click", () => this.openTransferCustomerModal([el.dataset.customerTransfer], "single")));
    CRMUI.$$("[data-customer-contact]").forEach(el => el.addEventListener("click", () => this.openContactModal(el.dataset.customerContact)));
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
    button.textContent = count ? `变更负责人（${count}）` : "变更负责人";
  },
  latestSignedContract(customer) {
    const contracts = CRM_MOCK.contracts
      .filter(c => c.customerId === customer.id && c.status === "已签约")
      .sort((a, b) => String(b.signedAt).localeCompare(String(a.signedAt)));
    const latest = contracts[0];
    return latest ? `${latest.no}（${latest.signedAt}）` : "-";
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
  renderCustomerDetail(root) {
    const params = this.currentRouteParams();
    const customer = CRM_MOCK.customers.find(c => c.id === params.id);
    if (!customer) {
      root.innerHTML = `<div class="empty-state"><p>客户不存在或已被删除</p><button class="btn" type="button" id="backToCustomers">返回客户列表</button></div>`;
      CRMUI.$("#backToCustomers")?.addEventListener("click", () => CRMRouter.goto("customers"));
      return;
    }
    const contacts = CRM_MOCK.contacts.filter(c => c.customerId === customer.id);
    const contracts = CRM_MOCK.contracts
      .filter(c => c.customerId === customer.id)
      .slice()
      .sort((a, b) => String(b.signedAt || "").localeCompare(String(a.signedAt || "")));
    const leadHistory = this.customerLeadHistory(customer);
    const leadCount = (customer.leadIds || []).length;
    const primary = contacts.find(c => c.primary);
    const signed = contracts.filter(c => c.status === "已签约");
    const signedAmount = signed.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const latestSigned = signed.slice().sort((a, b) => String(b.signedAt).localeCompare(String(a.signedAt)))[0];
    root.innerHTML = `
      <div class="detail-page">
      <div class="page-header-row detail-page-header">
        <div>
          <div class="muted detail-page-eyebrow">客户详情（只读）</div>
          <h2 class="detail-page-title">${customer.name} ${customer.potentialLevel ? CRMUI.badge(customer.potentialLevel) : `<span class="badge gray">未分级</span>`} <span class="badge gray">${customer.no}</span></h2>
        </div>
      </div>
      <div class="card pad detail-card">
        <div class="section-title detail-section-title">基础信息</div>
        <div class="detail-desc">
          <div><div class="muted">客户名称</div><strong>${customer.name}</strong></div>
          <div><div class="muted">客户编号</div><strong>${customer.no}</strong></div>
          <div><div class="muted">关联线索数</div><strong>${leadCount}</strong></div>
          <div><div class="muted">站点</div><strong>${CRMUI.siteName(customer.siteId)}</strong></div>
          <div><div class="muted">负责人</div><strong>${CRMUI.userName(customer.ownerId)}</strong></div>
          <div><div class="muted">国家/地区</div><strong>${customer.country || "—"}</strong></div>
          <div><div class="muted">行业</div><strong>${customer.industry || "—"}</strong></div>
          <div><div class="muted">客户潜质分级</div><strong>${customer.potentialLevel ? CRMUI.badge(customer.potentialLevel) : "—"}</strong></div>
          <div class="full"><div class="muted">客户标签</div><strong>${(customer.tags || []).length ? customer.tags.map(t => `<span class="badge gray">${t}</span>`).join(" ") : "—"}</strong></div>
        </div>
      </div>
      <div class="card pad detail-card detail-card-tabs">
        <div class="tabs" id="customerDetailTabs">
          <div class="tab active" data-customer-tab="info">客户信息</div>
          <div class="tab" data-customer-tab="leads">线索记录</div>
          <div class="tab" data-customer-tab="contacts">客户联系人</div>
          <div class="tab" data-customer-tab="contracts">合作合同</div>
          <div class="tab" data-customer-tab="profile">AI 客户画像</div>
        </div>
        <div id="customerPanelInfo">
          <div class="detail-desc">
            <div><div class="muted">客户名称</div><strong>${customer.name}</strong></div>
            <div><div class="muted">国家/地区</div><strong>${customer.country || "—"}</strong></div>
            <div><div class="muted">行业</div><strong>${customer.industry || "—"}</strong></div>
            <div><div class="muted">客户潜质分级</div><strong>${customer.potentialLevel || "—"}</strong></div>
            <div><div class="muted">官网</div><strong>${customer.website || "—"}</strong></div>
            <div><div class="muted">联系方式</div><strong>${primary ? `${primary.phone || "—"} / ${primary.email || "—"}` : "—"}</strong></div>
            <div><div class="muted">负责人</div><strong>${CRMUI.userName(customer.ownerId)}</strong></div>
            <div><div class="muted">创建时间</div><strong>${customer.createdAt || "—"}</strong></div>
          </div>
        </div>
        <div id="customerPanelLeads" hidden>
          ${CRMUI.table([
            { title: "线索编号", render: lead => `<a href="#" data-open-lead="${lead.id}">${lead.no}</a>` },
            { title: "站点", render: lead => CRMUI.siteName(lead.siteId) },
            { title: "来源渠道", render: lead => lead.channel || "—" },
            { title: "询盘时间", render: lead => lead.createdAt || "—" },
            { title: "线索状态", render: lead => CRMUI.badge(lead.status) },
            { title: "负责人", render: lead => CRMUI.userName(lead.ownerId) }
          ], leadHistory, "暂无关联线索")}
        </div>
        <div id="customerPanelContacts" hidden>
          ${CRMUI.table([
            { title: "姓名", render: c => c.name },
            { title: "职位", render: c => c.title || "—" },
            { title: "邮箱", render: c => c.email || "—" },
            { title: "电话", render: c => c.phone || "—" },
            { title: "WhatsApp", render: c => c.whatsapp || "—" },
            { title: "联系角色", render: c => c.role || "—" },
            { title: "主要联系人", render: c => c.primary ? "⭐" : "—" }
          ], contacts, "暂无联系人")}
        </div>
        <div id="customerPanelContracts" hidden>
          <div class="grid cols-4" style="margin-bottom:12px">
            <div><div class="muted">累计合同数（已签约）</div><strong>${signed.length}</strong></div>
            <div><div class="muted">累计合同金额</div><strong>¥${signedAmount.toLocaleString()}</strong></div>
            <div><div class="muted">最近签约时间</div><strong>${latestSigned?.signedAt || "—"}</strong></div>
            <div><div class="muted">最近签约合同</div><strong>${latestSigned ? latestSigned.no : "—"}</strong></div>
          </div>
          ${CRMUI.table([
            { title: "合同编号", render: c => c.no },
            { title: "合同名称", render: c => c.name },
            { title: "金额", render: c => `¥${Number(c.amount || 0).toLocaleString()}` },
            { title: "签约时间", render: c => c.signedAt || "—" },
            { title: "合同状态", render: c => CRMUI.badge(c.status) }
          ], contracts, "暂无合作合同")}
        </div>
        <div id="customerPanelProfile" hidden>
          ${this.renderCustomerProfilePanel(customer)}
        </div>
      </div>
      </div>
    `;
    CRMUI.$$("[data-customer-tab]", root).forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("[data-customer-tab]", root).forEach(t => t.classList.toggle("active", t === tab));
      const key = tab.dataset.customerTab;
      CRMUI.$("#customerPanelInfo").hidden = key !== "info";
      CRMUI.$("#customerPanelLeads").hidden = key !== "leads";
      CRMUI.$("#customerPanelContacts").hidden = key !== "contacts";
      CRMUI.$("#customerPanelContracts").hidden = key !== "contracts";
      CRMUI.$("#customerPanelProfile").hidden = key !== "profile";
    }));
    CRMUI.$$("[data-open-lead]", root).forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      this.openLeadDetail(el.dataset.openLead);
    }));
  },
  renderCustomerProfilePanel(customer) {
    // 客户画像只展示结构化三块（工商/参展/风险）；禁止用 aiProfile 意向文案冒充画像，避免歧义
    const profile = this.companyProfileForCustomer(customer);
    const Comm = window.CRMCommunicationPage;
    if (profile && Comm) {
      return `
        <div class="lead-profile-stack">
          <div class="section-title detail-section-title">企业工商信息</div>
          ${Comm.renderCustomerProfile(profile)}
          <div class="section-title detail-section-title">过往参展信息</div>
          ${Comm.renderExhibitionHistory(profile)}
          <div class="section-title detail-section-title">企业风险提示</div>
          ${Comm.renderCompanyRisk(profile)}
        </div>
      `;
    }
    return `<p class="muted">当前客户暂无客户画像。暂无企业工商信息、过往参展信息与企业风险提示（未关联 AI 分析或尚未同步结构化画像）。</p>`;
  },
  companyProfileForCustomer(customer) {
    if (!customer) return null;
    // 优先按关联线索复用询盘侧画像（与线索详情口径一致）
    const leads = this.customerLeadHistory(customer);
    for (const lead of leads) {
      const fromLead = this.companyProfileForLead(lead);
      if (fromLead) return fromLead;
    }
    const profiles = CRM_MOCK.companyProfiles || [];
    const name = String(customer.name || "").toLowerCase();
    if (!name) return null;
    return profiles.find(profile => {
      const names = [profile.company, profile.shortName, ...(profile.aliases || [])].filter(Boolean).map(value => value.toLowerCase());
      return names.some(n => name.includes(n) || n.includes(name));
    }) || null;
  },
  customerLeadHistory(customer) {
    const ids = new Set(customer.leadIds || []);
    return CRM_MOCK.leads.filter(lead => ids.has(lead.id) || lead.customerId === customer.id);
  },
  customerTransferRecords(customer) {
    return (customer.transferRecords || []).slice().sort((a, b) => String(b.transferredAt).localeCompare(String(a.transferredAt)));
  },
  openCustomerModal(customer) {
    const isEdit = Boolean(customer);
    const countryOpts = this.dictItems("country").map(i => ({ value: i.name, label: i.name }));
    const industryOpts = this.dictItems("industry").map(i => ({ value: i.name, label: i.name }));
    const levelOpts = this.dictItems("customerLevel").map(i => ({ value: i.name, label: i.name }));
    CRMUI.modal(isEdit ? "编辑客户资料" : "新建客户", `
      <div class="form-grid">
        ${CRMUI.formInput("客户名称", "name", customer?.name || "")}
        ${CRMUI.formSelect("国家/地区", "country", countryOpts, customer?.country || "")}
        ${CRMUI.formSelect("行业", "industry", industryOpts, customer?.industry || "")}
        ${CRMUI.formSelect("客户潜质分级", "potentialLevel", levelOpts, customer?.potentialLevel || "可跟进")}
        <div class="form-field"><label>站点</label><select name="siteId" ${isEdit ? "disabled" : ""}>${CRMUI.optionList(CRM_MOCK.sites, customer?.siteId || "")}</select></div>
        ${!isEdit ? `<div class="form-field"><label>关联已有线索</label><select name="leadId"><option value="">不关联</option>${CRM_MOCK.leads.filter(l => !l.customerId).map(l => `<option value="${l.id}">${l.no} · ${l.company}</option>`).join("")}</select></div>
        ${CRMUI.formInput("客户联系人姓名", "contactName")}
        ${CRMUI.formInput("客户联系人职位", "contactTitle")}
        ${CRMUI.formInput("客户联系人邮箱", "contactEmail")}
        ${CRMUI.formInput("客户联系人电话", "contactPhone")}` : ""}
      </div>`, form => {
      if (!form.get("name")) return CRMUI.toast("请输入客户名称");
      if (isEdit) {
        Object.assign(customer, {
          country: form.get("country") || "-",
          industry: form.get("industry") || "-",
          potentialLevel: form.get("potentialLevel") || "可跟进"
        });
      } else {
        const newCustomer = { id: `c${Date.now()}`, no: `CUS-2026-${Math.floor(Math.random() * 9000 + 1000)}`, name: form.get("name") || "新客户", siteId: form.get("siteId"), country: form.get("country") || "-", industry: form.get("industry") || "-", ownerId: CRM_MOCK.currentUser.id, potentialLevel: form.get("potentialLevel") || "可跟进", tags: [], leadIds: [], contractIds: [], transferRecords: [], aiProfile: "暂无 AI 客户画像数据，该客户通过手动创建，未关联 AI 分析。", createdAt: "2026-07-02" };
        const leadId = form.get("leadId");
        if (leadId) {
          newCustomer.leadIds.push(leadId);
          const lead = CRM_MOCK.leads.find(l => l.id === leadId);
          if (lead) lead.customerId = newCustomer.id;
        }
        CRM_MOCK.customers.unshift(newCustomer);
        if (form.get("contactName")) CRM_MOCK.contacts.push({ id: `p${Date.now()}`, customerId: newCustomer.id, name: form.get("contactName"), title: form.get("contactTitle"), email: form.get("contactEmail"), phone: form.get("contactPhone"), whatsapp: "", role: "执行联系人", primary: true, aiDetected: false });
      }
      CRMUI.closeModal();
      CRMUI.toast(isEdit ? "客户资料已更新" : "客户已创建");
      this.renderCustomerTable();
    });
  },
  openContactModal(customerId) {
    if (!this.canEditCustomer()) return CRMUI.toast("当前角色无添加联系人权限");
    const customer = CRM_MOCK.customers.find(c => c.id === customerId);
    if (!customer) return CRMUI.toast("未找到客户");
    const roleOpts = ["决策人", "采购经理", "执行联系人", "关键联系人", "其他"].map(v => ({ value: v, label: v }));
    const existing = CRM_MOCK.contacts.filter(c => c.customerId === customerId);
    CRMUI.modal("添加联系人", `
      <div class="form-grid">
        <div class="form-field"><label>客户名称</label><input value="${customer.name}" disabled></div>
        ${CRMUI.formInput("姓名", "name")}
        ${CRMUI.formInput("职位", "title")}
        ${CRMUI.formInput("邮箱", "email")}
        ${CRMUI.formInput("电话", "phone")}
        ${CRMUI.formInput("WhatsApp", "whatsapp")}
        ${CRMUI.formSelect("联系角色", "role", roleOpts, "执行联系人")}
        <div class="form-field full"><label><input type="checkbox" name="primary" value="1" ${existing.length ? "" : "checked"}> 设为主要联系人</label></div>
      </div>`, form => {
      const name = (form.get("name") || "").trim();
      if (!name) return CRMUI.toast("请输入联系人姓名");
      const isPrimary = form.get("primary") === "1" || !existing.length;
      if (isPrimary) existing.forEach(c => { c.primary = false; });
      CRM_MOCK.contacts.push({
        id: `p${Date.now()}`,
        customerId,
        name,
        title: form.get("title") || "",
        email: form.get("email") || "",
        phone: form.get("phone") || "",
        whatsapp: form.get("whatsapp") || "",
        role: form.get("role") || "执行联系人",
        primary: isPrimary,
        aiDetected: false
      });
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
    // 转移目标为在职销售人员（业务员、运营专员），按客户站点过滤，不含已禁用
    const scopeSiteIds = Array.from(new Set(customers.map(c => c.siteId).filter(Boolean)));
    const salesUsers = CRM_MOCK.users.filter(u => ["业务员", "运营专员"].includes(u.role) && u.status !== "禁用" && (!scopeSiteIds.length || scopeSiteIds.includes(u.siteIds?.[0]) || (u.siteIds || []).some(s => scopeSiteIds.includes(s))));
    CRMUI.modal(isBatch ? "批量变更负责人" : "变更负责人", `
      <div class="form-grid">
        ${isBatch ? `<div class="form-field full"><label>已选择客户数量</label><input value="${customers.length} 个" disabled></div>` : `
          <div class="form-field"><label>客户名称</label><input value="${customers[0].name}" disabled></div>
          <div class="form-field"><label>当前负责人</label><input value="${CRMUI.userName(customers[0].ownerId)}" disabled></div>
        `}
        <div class="form-field"><label>新负责人</label><select name="ownerId" required>${CRMUI.optionList(salesUsers)}</select></div>
        <div class="form-field full"><label>变更备注</label><textarea name="note" required placeholder="请输入变更备注（必填）"></textarea></div>
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
        CRMUI.toast(`已变更 ${movedCount} 个客户负责人`);
      } else {
        CRMUI.toast("客户负责人已变更");
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
      const contract = {
        id: `ct${Date.now()}`,
        no: form.get("no"),
        name: form.get("name"),
        customerId: customerIdValue,
        leadId: form.get("leadId"),
        amount: Number(form.get("amount") || 0),
        signedAt: form.get("signedAt") || "2026-07-02",
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        status: "已签约",
        ownerId,
        attachments: []
      };
      CRM_MOCK.contracts.unshift(contract);
      this.markLeadDealByContract(contract);
      CRMUI.closeModal();
      CRMUI.toast("合同已新增");
      if (afterSave) afterSave();
    });
  },
  listPageSize() {
    const item = (CRM_MOCK.paramSettings || []).find(row => row.code === "list_page_size");
    const match = String(item?.value || "").match(/(\d+)/);
    return match ? Number(match[1]) : 20;
  },
  openBatchImportModal(entityLabel) {
    CRMUI.modal(`批量导入${entityLabel}`, `
      <div class="form-grid">
        <div class="form-field full"><label>导入文件</label><input type="file" name="file" accept=".xlsx,.xls,.csv"></div>
      </div>
      <p class="muted">请先【下载导入模板】，表头需与系统字段一致；重复记录将按规则跳过或覆盖。</p>
      <div class="toolbar"><button class="btn" type="button" id="downloadImportTemplate">下载导入模板</button></div>
    `, form => {
      if (!form.get("file")?.name) return CRMUI.toast("请上传导入文件");
      CRMUI.closeModal();
      CRMUI.modal("导入结果", `
        <div class="form-grid">
          <div class="form-field"><label>成功</label><input value="12 条" disabled></div>
          <div class="form-field"><label>跳过</label><input value="2 条（已存在）" disabled></div>
          <div class="form-field"><label>失败</label><input value="1 条" disabled></div>
          <div class="form-field full"><label>说明</label><textarea disabled>第 8 行：站点不在权限范围内</textarea></div>
        </div>
      `, () => CRMUI.closeModal());
      CRMUI.$("#modalForm button[type='submit']").textContent = "完成";
    });
    CRMUI.$("#downloadImportTemplate")?.addEventListener("click", () => CRMUI.toast(`已下载${entityLabel}导入模板`));
  },
  openCustomerExportModal() {
    const selectedCount = this.customerState.selected.size;
    const rows = this.customerRows();
    CRMUI.modal("导出客户", `
      <div class="form-grid">
        <div class="form-field"><label>导出范围</label><select name="scope">
          <option value="filtered">当前查询结果（${rows.length} 条）</option>
          <option value="selected" ${selectedCount ? "" : "disabled"}>已选择客户（${selectedCount} 条）</option>
        </select></div>
        ${CRMUI.formMultiSelect("导出字段", "fields", ["客户编号", "客户名称", "国家/地区", "行业", "客户潜质分级", "站点", "负责人", "创建时间"].map(v => ({ value: v, label: v })), ["客户编号", "客户名称", "站点", "负责人"])}
      </div>`, form => {
      const scope = form.get("scope");
      if (scope === "selected" && !selectedCount) return CRMUI.toast("请先选择需要导出的客户");
      CRMUI.closeModal();
      CRMUI.toast(scope === "selected" ? `已导出 ${selectedCount} 条客户` : `已导出当前查询结果 ${rows.length} 条`);
    });
  },
  openContractExportModal() {
    const rows = CRM_MOCK.contracts;
    CRMUI.modal("导出合同", `
      <div class="form-grid">
        <div class="form-field"><label>导出范围</label><select name="scope">
          <option value="filtered">当前查询结果（${rows.length} 条）</option>
        </select></div>
        ${CRMUI.formMultiSelect("导出字段", "fields", ["合同编号", "合同名称", "客户", "关联线索", "金额", "签约日期", "状态", "负责人"].map(v => ({ value: v, label: v })), ["合同编号", "合同名称", "客户", "金额", "签约日期", "状态"])}
      </div>`, () => {
      CRMUI.closeModal();
      CRMUI.toast(`已导出当前查询结果 ${rows.length} 条合同`);
    });
  }
};
