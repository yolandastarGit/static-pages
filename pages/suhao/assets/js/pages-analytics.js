window.CRMAnalyticsPage = {
  render(root, page, routeKey) {
    const tab = routeKey === "analyticsAcquisition" ? "acquisition" : routeKey === "analyticsCustomer" ? "customer" : "sales";
    const isCustomer = tab === "customer";
    const isSales = tab === "sales";
    const defaultRange = isSales ? this.salesReferenceRange() : tab === "acquisition" ? { start: "2025-07-01", end: "2025-07-31" } : isCustomer ? this.customerReferenceRange() : this.currentMonthRange();
    this.analyticsState = {
      tab,
      statRange: isCustomer ? "本年" : "本月",
      statTimeStart: defaultRange.start,
      statTimeEnd: defaultRange.end,
      siteId: ""
    };
    const filterGridStyle = isSales ? ` style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:14px 0;border:0;background:transparent;box-shadow:none"` : tab === "customer" ? ` style="grid-template-columns:320px 260px minmax(180px,1fr) max-content;align-items:center"` : "";
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions"></div>
        <div class="toolbar-filters">
          <div class="filters search-filter"${filterGridStyle}>
            ${tab === "sales" ? `
            <label class="filter-item" style="width:96px;grid-template-columns:auto 1fr"><span>统计时间:</span><select id="analyticsRange"><option selected>本月</option><option>本季度</option><option>本年</option></select></label>
            <label class="filter-item" style="width:300px;grid-template-columns:1fr"><span class="range-picker"><input type="date" id="analyticsStatStart" value="${this.analyticsState.statTimeStart}"><span class="range-separator">~</span><input type="date" id="analyticsStatEnd" value="${this.analyticsState.statTimeEnd}"></span></label>
            ` : tab === "acquisition" ? `
            <label class="filter-item"><span>统计时间</span><span class="range-picker"><input type="date" id="analyticsStatStart" value="${this.analyticsState.statTimeStart}"><span class="range-separator">~</span><input type="date" id="analyticsStatEnd" value="${this.analyticsState.statTimeEnd}"></span></label>
            ` : tab === "customer" ? `
            <label class="filter-item"><span>统计时间</span><span class="range-picker"><input type="date" id="analyticsStatStart" value="${this.analyticsState.statTimeStart}"><span class="range-separator">~</span><input type="date" id="analyticsStatEnd" value="${this.analyticsState.statTimeEnd}"></span></label>
            ` : `
            <label class="filter-item"><span>统计时间</span><select id="analyticsRange">
              ${this.rangeOptions(tab).map(item => `<option ${item === this.analyticsState.statRange ? "selected" : ""}>${item}</option>`).join("")}
            </select></label>
            <label class="filter-item"><span>时间范围</span><span class="range-picker"><input type="date" id="analyticsStatStart" value="${this.analyticsState.statTimeStart}"><span class="range-separator">-</span><input type="date" id="analyticsStatEnd" value="${this.analyticsState.statTimeEnd}"></span></label>
            `}
            ${this.showSiteFilter(tab) ? `<label class="filter-item" ${isSales ? `style="width:186px;grid-template-columns:auto 1fr"` : ""}><span>站点</span><select id="analyticsSite"><option value="">全部站点</option>${this.siteOptions()}</select></label>` : ""}
            ${isSales ? "" : `<div class="filter-actions"><button class="btn primary" id="analyticsQuery">查询</button><button class="btn" id="analyticsReset">重置</button>${tab === "acquisition" || tab === "customer" ? `<button class="btn" id="analyticsCollapse" type="button">收起⌃</button>` : ""}</div>`}
          </div>
        </div>
      </div>
      <div id="analyticsBody"></div>
    `;
    CRMUI.$("#analyticsRange")?.addEventListener("change", e => {
      const range = this.rangeByShortcut(e.target.value, tab);
      this.analyticsState.statRange = e.target.value;
      this.analyticsState.statTimeStart = range.start;
      this.analyticsState.statTimeEnd = range.end;
      CRMUI.$("#analyticsStatStart").value = range.start;
      CRMUI.$("#analyticsStatEnd").value = range.end;
      this.renderTab(tab);
    });
    CRMUI.$$("#analyticsStatStart,#analyticsStatEnd").forEach(input => input.addEventListener("change", e => {
      this.analyticsState.statRange = "自定义";
      if (CRMUI.$("#analyticsRange")) CRMUI.$("#analyticsRange").value = "自定义";
      this.analyticsState[input.id.endsWith("Start") ? "statTimeStart" : "statTimeEnd"] = e.target.value;
      this.renderTab(tab);
    }));
    CRMUI.$("#analyticsSite")?.addEventListener("change", e => {
      this.analyticsState.siteId = e.target.value;
      this.renderTab(tab);
    });
    CRMUI.$("#analyticsQuery")?.addEventListener("click", () => {
      CRMUI.toast("分析数据已刷新");
      this.renderTab(tab);
    });
    CRMUI.$("#analyticsReset")?.addEventListener("click", () => {
      const range = tab === "acquisition" ? { start: "2025-07-01", end: "2025-07-31" } : tab === "customer" ? this.customerReferenceRange() : this.currentMonthRange();
      this.analyticsState.statRange = tab === "customer" ? "本年" : "本月";
      this.analyticsState.statTimeStart = range.start;
      this.analyticsState.statTimeEnd = range.end;
      this.analyticsState.siteId = "";
      if (CRMUI.$("#analyticsRange")) CRMUI.$("#analyticsRange").value = this.analyticsState.statRange;
      CRMUI.$("#analyticsStatStart").value = range.start;
      CRMUI.$("#analyticsStatEnd").value = range.end;
      if (CRMUI.$("#analyticsSite")) CRMUI.$("#analyticsSite").value = "";
      this.renderTab(tab);
    });
    CRMUI.$("#analyticsCollapse")?.addEventListener("click", () => CRMUI.toast("筛选条件已收起"));
    this.renderTab(tab);
  },
  rangeOptions(tab) {
    return tab === "customer" ? ["本年", "本月", "本季度", "自定义"] : ["本月", "本周", "今日", "本季度", "自定义"];
  },
  today() {
    return new Date().toISOString().slice(0, 10);
  },
  currentMonthRange() {
    const now = new Date();
    return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), end: this.today() };
  },
  currentYearRange() {
    const now = new Date();
    return { start: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), end: this.today() };
  },
  salesReferenceRange() {
    return { start: "2025-07-01", end: "2025-07-31" };
  },
  customerReferenceRange() {
    return { start: "2025-01-01", end: "2025-07-31" };
  },
  rangeByShortcut(shortcut, tab) {
    const now = new Date();
    if (tab === "sales" && shortcut === "本月") return this.salesReferenceRange();
    if (shortcut === "今日") return { start: this.today(), end: this.today() };
    if (shortcut === "本周") {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      return { start: start.toISOString().slice(0, 10), end: this.today() };
    }
    if (shortcut === "本月") return this.currentMonthRange();
    if (shortcut === "本季度") {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      return { start: new Date(now.getFullYear(), qStart, 1).toISOString().slice(0, 10), end: this.today() };
    }
    if (shortcut === "本年") return this.currentYearRange();
    return { start: this.analyticsState?.statTimeStart || "", end: this.analyticsState?.statTimeEnd || "" };
  },
  showSiteFilter(tab) {
    return !(tab === "customer" && CRM_MOCK.currentUser.role === "业务员");
  },
  currentUser() {
    return CRM_MOCK.users.find(user => user.id === CRM_MOCK.currentUser.id) || CRM_MOCK.currentUser;
  },
  allowedSiteIds() {
    if (CRM_MOCK.currentUser.role === "系统管理员") return CRM_MOCK.sites.map(site => site.id);
    const user = this.currentUser();
    return user.siteIds || CRM_MOCK.currentUser.sites || [];
  },
  siteOptions() {
    const ids = new Set(this.allowedSiteIds());
    const sites = CRM_MOCK.currentUser.role === "系统管理员" ? CRM_MOCK.sites : CRM_MOCK.sites.filter(site => ids.has(site.id));
    return CRMUI.optionList(sites);
  },
  siteMatch(item, key = "siteId") {
    const selected = this.analyticsState.siteId;
    const allowed = this.allowedSiteIds();
    const value = item?.[key] || "";
    return (!selected || value === selected) && (!allowed.length || allowed.includes(value));
  },
  dateInRange(value) {
    const date = String(value || "").slice(0, 10);
    if (!date) return false;
    const { statTimeStart, statTimeEnd } = this.analyticsState;
    if (statTimeStart && date < statTimeStart) return false;
    if (statTimeEnd && date > statTimeEnd) return false;
    return true;
  },
  contractValid(contract) {
    return ["已签约"].includes(contract.status);
  },
  highIntentStages() {
    const dict = (CRM_MOCK.dictionaries || []).find(d => d.code === "followStage");
    const items = (dict?.items || []).filter(item => item.status !== "停用" && item.countAsHighIntent);
    return items.map(item => item.name);
  },
  isHighIntent(lead) {
    return this.highIntentStages().includes(lead.stage);
  },
  salesLeads() {
    return CRM_MOCK.leads.filter(lead => this.siteMatch(lead, "siteId") && this.dateInRange(lead.createdAt));
  },
  salesContracts() {
    return CRM_MOCK.contracts.filter(contract => this.contractValid(contract) && this.dateInRange(contract.signedAt) && this.siteMatch(this.contractCustomer(contract), "siteId"));
  },
  acquisitionMessages() {
    const mails = (CRM_MOCK.emails || []).filter(mail => mail.folder === "inbox" && this.dateInRange(mail.time) && this.siteMatch(mail, "siteId")).map(mail => ({ ...mail, channel: "邮件", country: this.countryFromLead(mail.leadId), products: this.productsFromLead(mail.leadId), focus: mail.aiTags || [], valid: Boolean(mail.leadId) }));
    const chats = (CRM_MOCK.whatsappConversations || []).filter(chat => this.dateInRange(chat.lastMessageTime) && this.siteMatch(chat, "siteId")).map(chat => ({ ...chat, channel: "WhatsApp", country: this.countryFromLead(chat.leadId) || this.countryFromLocation(chat.location), products: this.productsFromLead(chat.leadId), focus: chat.aiTags || [], valid: Boolean(chat.leadId) }));
    return [...mails, ...chats];
  },
  customerRows() {
    const customers = CRM_MOCK.customers.filter(customer => {
      const byRole = CRM_MOCK.currentUser.role !== "业务员" || customer.ownerId === CRM_MOCK.currentUser.id;
      return byRole && this.siteMatch(customer, "siteId");
    });
    return customers;
  },
  contractCustomer(contract) {
    return CRM_MOCK.customers.find(customer => customer.id === contract.customerId) || {};
  },
  customerContracts(customer) {
    return CRM_MOCK.contracts.filter(contract => contract.customerId === customer.id && this.contractValid(contract));
  },
  customerLeads(customer) {
    const ids = new Set(customer.leadIds || []);
    return CRM_MOCK.leads.filter(lead => ids.has(lead.id) || lead.customerId === customer.id);
  },
  customerLastInteraction(customer) {
    const leadIds = new Set(this.customerLeads(customer).map(lead => lead.id));
    const logDate = CRM_MOCK.followLogs.filter(log => leadIds.has(log.leadId)).map(log => log.createdAt).sort().at(-1);
    const mailDate = CRM_MOCK.emails.filter(mail => leadIds.has(mail.leadId)).map(mail => mail.time).sort().at(-1);
    const chatDate = CRM_MOCK.whatsappConversations.filter(chat => leadIds.has(chat.leadId)).map(chat => chat.lastMessageTime).sort().at(-1);
    return [logDate, mailDate, chatDate].filter(Boolean).sort().at(-1) || customer.createdAt;
  },
  isActiveCustomer(customer) {
    const date = new Date(String(this.customerLastInteraction(customer)).slice(0, 10));
    if (Number.isNaN(date.getTime())) return false;
    const diffDays = (new Date() - date) / 86400000;
    return diffDays <= 90;
  },
  renderTab(tab) {
    if (tab === "sales") this.renderSales();
    if (tab === "acquisition") this.renderAcquisition();
    if (tab === "customer") this.renderCustomer();
  },
  metricGrid(cards, columns = 4) {
    const cardLabel = card => {
      const tip = card.tip ? this.helpTip(card.tip) : "";
      return `${card.label}${tip}`;
    };
    if (columns === 7) {
      return `<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px">${cards.map(card => `
        <div class="card metric" style="min-height:100px;padding:16px 14px">
          <div class="metric-label">${cardLabel(card)}</div>
          <div class="metric-value" style="font-size:${String(card.value).length > 8 ? 18 : 25}px;white-space:nowrap">${card.value}</div>
          <div class="metric-foot">${card.foot || ""}</div>
        </div>
      `).join("")}</div>`;
    }
    const cls = columns === 6 ? "grid metric-grid-6" : `grid cols-${columns}`;
    return `<div class="${cls}">${cards.map(card => `
      <div class="card metric">
        <div class="metric-label">${cardLabel(card)}</div>
        <div class="metric-value">${card.value}</div>
        <div class="metric-foot">${card.foot || ""}</div>
      </div>
    `).join("")}</div>`;
  },
  helpTip(text) {
    const tip = CRMUI.escapeHtml(text);
    return `<span class="help-tooltip" data-tip="${tip}" tabindex="0" aria-label="${tip}">ⓘ</span>`;
  },
  pct(numerator, denominator) {
    if (!denominator) return "--";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  },
  money(value) {
    return `¥${Number(value || 0).toLocaleString()}`;
  },
  groupCount(rows, getter) {
    return rows.reduce((map, row) => {
      const key = getter(row) || "其他";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
  },
  topGroups(map, limit = 10) {
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit);
  },
  renderSales() {
    const data = this.salesReferenceData();
    CRMUI.$("#analyticsBody").innerHTML = `
      ${this.salesLocalStyles()}
      ${this.salesMetricGrid(data.metrics)}
      <div class="sales-ref-layout" style="margin-top:14px">
        <div class="card pad sales-funnel-card"><div class="card-title">销售漏斗 <span class="muted">ⓘ</span></div>${this.salesFunnel(data.funnel)}</div>
        <div class="card pad"><div class="card-title">线索状态分布</div><div class="chart-box sales-small-chart"><canvas id="salesStatusChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">跟进阶段分布</div><div class="chart-box sales-small-chart"><canvas id="salesStageChart"></canvas></div></div>
        <div class="card pad sales-rank-card" style="grid-row:span 2"><div class="card-title">销售人员排行 TOP10</div>
          <div class="sales-rank-tabs"><button class="active" type="button">按成交金额</button><button type="button">按转客户数</button></div>
          ${this.salesReferenceTable(["排名", "业务员（站点）", "线索数量", "跟进数", "转客户数", "成交金额"], data.rank.map(row => [row.rank, row.user, row.leads, row.follow, row.convert, row.amount]), "sales-rank-table")}
          ${this.salesPager("共 10 条")}
        </div>
        <div class="card pad"><div class="card-title">站点销售表现</div>${this.salesReferenceTable(["站点", "线索数量", "转客户数", "成交客户数", "合同金额", "成交转化率"], data.sites.map(row => [row.site, row.leads, row.convert, row.deal, row.amount, row.rate]), "sales-site-table")}${this.salesPager("共 6 条")}</div>
        <div class="card pad sales-trend-card" style="grid-column:span 2"><div class="card-title">线索增长与成交金额趋势（本年1月 → 当前月）</div><div class="chart-box" style="height:280px"><canvas id="salesGrowthTrendChart"></canvas></div></div>
      </div>
    `;
    this.renderSalesStatus("salesStatusChart", data.status);
    this.renderSalesStage("salesStageChart", data.stage);
    this.renderSalesTrend("salesGrowthTrendChart", data.trend);
  },
  salesReferenceData() {
    return {
      // 口径对齐 PRD §17.4：询盘总数=周期内创建的全部线索；有效线索数=当前状态≠无效/丢失（二者不得合并）
      metrics: [
        { label: "询盘总数", value: "6,842", delta: "较上期 +823 （+13.68%）", tone: "blue", icon: "chat" },
        { label: "有效线索数", value: "5,668", delta: "较上期 +612 （+12.10%）", tone: "green", icon: "user" },
        { label: "高意向线索数", value: "2,156", delta: "较上期 +312 （+16.88%）", tone: "purple", icon: "star" },
        { label: "已建客户数", value: "1,245", delta: "较上期 +156 （+14.33%）", tone: "blue", icon: "users" },
        { label: "已成交客户数", value: "386", delta: "较上期 +48 （+14.20%）", tone: "orange", icon: "cart" },
        { label: "合同金额", value: "¥3,256,780", delta: "较上期 +18.45%（+¥507,620）", tone: "blue", icon: "yen" },
        { label: "成交转化率", value: "6.81%", delta: "较上期 +0.58 个百分点", tone: "green", icon: "trend" }
      ],
      funnel: [
        { label: "全部消息（不去重）", value: "18,765", color: "#1768f2", rate: "" },
        { label: "识别为线索", value: "6,842", color: "#16b3a6", rate: "36.47%" },
        { label: "跟进中", value: "3,895", color: "#f6b51b", rate: "56.92%" },
        { label: "高意向", value: "2,156", color: "#8159d8", rate: "55.37%" },
        { label: "已转客户", value: "1,245", color: "#4f86ec", rate: "57.73%" },
        { label: "已成交", value: "386", color: "#21b85b", rate: "31.00%" }
      ],
      status: [
        { name: "待跟进", value: 2352, ratio: "30.6%" },
        { name: "跟进中", value: 3125, ratio: "40.6%" },
        { name: "已转客户", value: 1245, ratio: "16.2%" },
        { name: "无效", value: 953, ratio: "12.4%" },
        { name: "丢失", value: 221, ratio: "2.9%" }
      ],
      stage: [
        { name: "待首响", value: 1025 },
        { name: "已联系", value: 2368 },
        { name: "需求确认", value: 2856 },
        { name: "打样", value: 1685 },
        { name: "报价", value: 1325 },
        { name: "谈判", value: 845 }
      ],
      sites: [
        { site: "站点A", leads: "3,256", convert: 856, deal: 268, amount: "¥1,256,780", rate: "8.22%" },
        { site: "站点B", leads: "2,568", convert: 632, deal: 198, amount: "¥856,420", rate: "7.72%" },
        { site: "站点C", leads: "1,845", convert: 421, deal: 136, amount: "¥598,300", rate: "7.38%" },
        { site: "站点D", leads: "1,256", convert: 286, deal: 82, amount: "¥312,650", rate: "6.54%" },
        { site: "站点E", leads: 856, convert: 142, deal: 48, amount: "¥178,630", rate: "5.61%" },
        { site: "其他站点", leads: "1,024", convert: 218, deal: 76, amount: "¥53,560", rate: "4.82%" }
      ],
      rank: [
        { rank: 1, user: "张三（站点A）", leads: "1,256", follow: 856, convert: 268, amount: "¥856,200" },
        { rank: 2, user: "李四（站点B）", leads: "1,028", follow: 699, convert: 214, amount: "¥623,450" },
        { rank: 3, user: "王五（站点A）", leads: 856, follow: 612, convert: 186, amount: "¥512,300" },
        { rank: 4, user: "赵六（站点C）", leads: 745, follow: 498, convert: 131, amount: "¥368,900" },
        { rank: 5, user: "孙七（站点B）", leads: 612, follow: 421, convert: 109, amount: "¥289,600" },
        { rank: 6, user: "周八（站点A）", leads: 548, follow: 372, convert: 98, amount: "¥256,780" },
        { rank: 7, user: "吴九（站点D）", leads: 512, follow: 331, convert: 87, amount: "¥198,600" },
        { rank: 8, user: "郑十（站点C）", leads: 468, follow: 295, convert: 76, amount: "¥168,400" },
        { rank: 9, user: "刘一（站点E）", leads: 396, follow: 248, convert: 65, amount: "¥132,250" },
        { rank: 10, user: "陈二（站点D）", leads: 356, follow: 215, convert: 58, amount: "¥115,300" }
      ],
      trend: {
        labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        leads: [9856, 8562, 10238, 11256, 12568, 14256, 18765, null, null, null, null, null],
        amount: [85, 62, 138, 98, 196, 212, 326, null, null, null, null, null]
      }
    };
  },
  salesMetricGrid(cards) {
    return `<div class="sales-metric-grid">${cards.map(card => `
      <div class="card sales-metric-card">
        <div class="sales-metric-label">${card.label}</div>
        <div class="sales-metric-value sales-${card.tone}" style="font-size:${String(card.value).length > 8 ? 16 : 28}px">${card.value}</div>
        <div class="sales-metric-delta">${card.delta}</div>
        <div class="sales-metric-icon sales-bg-${card.tone}">${this.salesIcon(card.icon)}</div>
      </div>
    `).join("")}</div>`;
  },
  salesFunnel(rows) {
    return `<div class="sales-funnel">${rows.map((row, index) => `
      <div class="sales-funnel-row">
        <div class="sales-funnel-label">${row.label}</div>
        <div class="sales-funnel-bar" style="--w:${100 - index * 11}%;background:${row.color}">${row.value}</div>
        <div class="sales-funnel-rate">${row.rate}</div>
      </div>
    `).join("")}</div>`;
  },
  salesReferenceTable(headers, rows, cls = "") {
    return `<div class="table-wrap ${cls}" style="margin:0"><table style="font-size:12px"><thead><tr>${headers.map(header => `<th style="padding:9px 10px">${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row, rowIndex) => `<tr class="${rowIndex < 3 && cls.includes("rank") ? "sales-top-row" : ""}">${row.map((cell, index) => `<td style="padding:9px 10px">${index === 0 && cls.includes("rank") ? this.rankBadge(cell) : cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  },
  rankBadge(rank) {
    const cls = rank <= 3 ? `rank-${rank}` : "";
    return `<span class="sales-rank-badge ${cls}">${rank}</span>`;
  },
  salesPager(total) {
    return `<div class="sales-pager"><span class="muted">${total}</span><button class="btn" disabled>‹</button><button class="btn primary">1</button><button class="btn">›</button><button class="btn">10 条/页⌄</button></div>`;
  },
  renderSalesStatus(id, rows) {
    CRMUI.createChart(id, "doughnut", {
      labels: rows.map(row => `${row.name} ${row.value} (${row.ratio})`),
      datasets: [{ data: rows.map(row => row.value), backgroundColor: ["#1768f2", "#18b89a", "#f6b51b", "#7b5bd6", "#f5222d"] }]
    });
  },
  renderSalesStage(id, rows) {
    CRMUI.createChart(id, "bar", {
      labels: rows.map(row => row.name),
      datasets: [{ label: "线索数", data: rows.map(row => row.value), backgroundColor: "#1768f2" }]
    }, { plugins: { legend: { display: false } } });
  },
  renderSalesTrend(id, trend) {
    CRMUI.createChart(id, "bar", {
      labels: trend.labels,
      datasets: [
        { label: "线索数（左轴）", data: trend.leads, backgroundColor: "#1768f2" },
        { label: "成交金额（万元，右轴）", data: trend.amount, type: "line", borderColor: "#28b86a", backgroundColor: "rgba(40,184,106,.08)", tension: .35, yAxisID: "y1" }
      ]
    }, { scales: { y1: { position: "right" } } });
  },
  salesIcon(name) {
    const paths = {
      chat: `<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>`,
      user: `<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>`,
      star: `<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9z"/>`,
      users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>`,
      cart: `<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l3 12h10l3-8H7"/>`,
      yen: `<path d="M6 4l6 8 6-8"/><path d="M12 12v8M8 13h8M8 17h8"/>`,
      trend: `<path d="M4 17 10 11l4 4 6-8"/><path d="M14 7h6v6"/>`,
      file: `<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h3"/>`
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  },
  salesLocalStyles() {
    return `<style>
      .sales-metric-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}
      .sales-metric-card{position:relative;min-height:118px;padding:16px 12px;overflow:hidden}
      .sales-metric-label{font-size:14px;font-weight:750;color:#1f2a3d;margin-bottom:8px;white-space:nowrap}
      .sales-metric-value{font-size:28px;line-height:1.1;font-weight:850;letter-spacing:0;white-space:nowrap}
      .sales-metric-delta{margin-top:12px;color:#f5222d;font-size:11px;white-space:nowrap}
      .sales-blue{color:#1768f2}.sales-green{color:#16a34a}.sales-purple{color:#7b5bd6}.sales-orange{color:#ff7a1a}
      .sales-metric-icon{position:absolute;right:10px;top:32px;width:38px;height:38px;border-radius:50%;display:grid;place-items:center}
      .sales-metric-icon svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      .sales-bg-blue{color:#1768f2;background:#eaf2ff}.sales-bg-green{color:#20a857;background:#eaf8ed}.sales-bg-purple{color:#7b5bd6;background:#f1eafa}.sales-bg-orange{color:#ff7a1a;background:#fff0e4}
      .sales-ref-layout{display:grid;grid-template-columns:1.26fr .7fr 1.04fr 1.22fr;gap:12px;align-items:stretch}
      .sales-small-chart{height:250px}
      .sales-funnel{display:flex;flex-direction:column;gap:0;margin-top:12px}
      .sales-funnel-row{display:grid;grid-template-columns:96px minmax(180px,1fr) 58px;align-items:center;gap:10px;min-height:38px}
      .sales-funnel-label{font-size:13px;color:#1f2a3d}
      .sales-funnel-bar{width:var(--w);min-width:82px;justify-self:center;clip-path:polygon(7% 0,93% 0,84% 100%,16% 100%);height:38px;color:#fff;font-size:13px;font-weight:800;display:grid;place-items:center}
      .sales-funnel-rate{font-size:13px;color:#1f2a3d;text-align:right}
      .sales-rank-tabs{display:flex;gap:18px;border-bottom:1px solid #e6edf6;margin:8px -18px 8px;padding:0 18px}
      .sales-rank-tabs button{height:34px;border:0;background:transparent;color:#526070;font-weight:650;cursor:pointer}
      .sales-rank-tabs button.active{color:#1768f2;border-bottom:2px solid #1768f2}
      .sales-rank-table tr.sales-top-row{background:#fff8e8}
      .sales-rank-badge{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#eef2f7;color:#526070;font-size:12px;font-weight:800}
      .sales-rank-badge.rank-1{background:#ffb020;color:#fff}.sales-rank-badge.rank-2{background:#c7ceda;color:#fff}.sales-rank-badge.rank-3{background:#ff9d66;color:#fff}
      .sales-site-table table,.sales-rank-table table{white-space:nowrap}
      .sales-pager{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:10px}
      @media(max-width:1400px){.sales-metric-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.sales-ref-layout{grid-template-columns:1fr 1fr}.sales-rank-card{grid-row:auto!important}.sales-trend-card{grid-column:span 1!important}}
      @media(max-width:780px){.sales-metric-grid,.sales-ref-layout{grid-template-columns:1fr}}
    </style>`;
  },
  renderFunnel(...values) {
    const labels = ["全部消息", "识别为线索", "跟进中", "高意向", "已转客户", "已成交"];
    return `<div class="grid cols-3">${labels.map((label, index) => {
      const value = values[index] || 0;
      const prev = index === 0 ? value : values[index - 1] || 0;
      return `<div><div class="metric-label">${label}</div><div class="metric-value" style="font-size:22px">${value}</div><div class="metric-foot">${index ? `相邻转化 ${this.pct(value, prev)}` : "起点"}</div></div>`;
    }).join("")}</div>`;
  },
  salesRankTable() {
    const rows = CRM_MOCK.users.filter(user => user.role === "业务员").map(user => {
      const leads = CRM_MOCK.leads.filter(lead => lead.ownerId === user.id && this.dateInRange(lead.createdAt));
      const followCount = CRM_MOCK.followLogs.filter(log => log.userId === user.id && this.dateInRange(log.createdAt)).length;
      const contracts = CRM_MOCK.contracts.filter(contract => contract.ownerId === user.id && this.contractValid(contract) && this.dateInRange(contract.signedAt));
      const amount = contracts.reduce((sum, contract) => sum + Number(contract.amount || 0), 0);
      return { user, leads, followCount, convertCount: leads.filter(lead => lead.status === "已转客户" || lead.customerId).length, amount };
    }).sort((a, b) => b.amount - a.amount).slice(0, 10);
    return CRMUI.table([
      { title: "排名", render: (row, index) => index + 1 },
      { title: "业务员", render: row => `${row.user.name}<div class="small muted">${(row.user.siteIds || []).map(id => CRMUI.siteName(id)).join("、") || "-"}</div>` },
      { title: "线索数量", render: row => row.leads.length },
      { title: "跟进数", render: row => row.followCount },
      { title: "转客户数", render: row => row.convertCount },
      { title: "成交金额", render: row => this.money(row.amount) }
    ], rows, "暂无销售人员数据");
  },
  siteSalesTable() {
    const rows = CRM_MOCK.sites.map(site => {
      const leads = CRM_MOCK.leads.filter(lead => lead.siteId === site.id && this.dateInRange(lead.createdAt));
      const contracts = CRM_MOCK.contracts.filter(contract => {
        const customer = this.contractCustomer(contract);
        return customer.siteId === site.id && this.contractValid(contract) && this.dateInRange(contract.signedAt);
      });
      const dealCustomers = new Set(contracts.map(contract => contract.customerId));
      const amount = contracts.reduce((sum, contract) => sum + Number(contract.amount || 0), 0);
      return { site, leadCount: leads.length, convertCount: leads.filter(lead => lead.status === "已转客户" || lead.customerId).length, dealCount: dealCustomers.size, amount };
    }).filter(row => this.siteMatch(row.site, "id")).sort((a, b) => b.amount - a.amount).slice(0, 10);
    return CRMUI.table([
      { title: "站点", render: row => row.site.name },
      { title: "线索数量", render: row => row.leadCount },
      { title: "转客户数", render: row => row.convertCount },
      { title: "成交客户数", render: row => row.dealCount },
      { title: "合同金额", render: row => this.money(row.amount) },
      { title: "成交转化率", render: row => this.pct(row.dealCount, row.leadCount) }
    ], rows, "暂无站点销售数据");
  },
  renderAcquisition() {
    const messages = this.acquisitionMessages();
    const validMessages = messages.filter(item => item.valid);
    const pendingCount = messages.filter(item => item.pending).length;
    const invalidCount = Math.max(messages.length - validMessages.length - pendingCount, 0);
    const countries = new Set(messages.map(item => item.country).filter(Boolean));
    const leads = CRM_MOCK.leads.filter(lead => this.siteMatch(lead, "siteId") && this.dateInRange(lead.createdAt));
    const productMap = this.groupCount(leads.flatMap(lead => (lead.products || []).length ? lead.products : [lead.purchaseIntent || "其他"]).map(product => ({ product })), row => row.product);
    const productRows = this.topGroups(productMap, 8).map(([product, inquiry]) => {
      const leadCount = leads.filter(lead => (lead.products || []).includes(product) || lead.purchaseIntent === product).length;
      return { product, inquiry, leads: leadCount };
    });
    const cards = [
      { label: "消息总量", value: String(messages.length), foot: `统计周期：${this.analyticsState.statTimeStart} ~ ${this.analyticsState.statTimeEnd}` },
      { label: "生成线索数", value: String(validMessages.length), tip: "AI 或人工判定有效并成功生成的线索数量" },
      { label: "无效消息数", value: String(invalidCount), tip: "未生成线索的无效消息数量" },
      { label: "线索生成率", value: this.pct(validMessages.length, messages.length), tip: "生成线索数占消息总量的比例" },
      { label: "待判定数", value: String(pendingCount), tip: "AI 未完成或需要人工判定的消息数量" },
      { label: "覆盖国家数", value: String(countries.size), tip: "按国家/地区去重后的数量" }
    ];
    CRMUI.$("#analyticsBody").innerHTML = `
      ${this.metricGrid(cards, 6)}
      <div style="display:grid;grid-template-columns:1.05fr 1.25fr 1.3fr;gap:14px;margin-top:14px;align-items:stretch">
        <div class="card pad"><div class="card-title">消息量趋势</div><div class="chart-box" style="height:280px"><canvas id="inquiryTrendChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">来源渠道分布</div><div class="chart-box" style="height:150px"><canvas id="channelBarChart"></canvas></div>${this.channelTable(messages)}</div>
        <div class="card pad"><div class="card-title">国家/地区分布（TOP10 + 其他）</div><div style="display:grid;grid-template-columns:1fr 1.08fr;gap:12px"><div class="chart-box" style="height:245px"><canvas id="countryInquiryChart"></canvas></div>${this.countryInquiryTable(messages)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:.9fr 1.85fr;gap:14px;margin-top:14px;align-items:stretch">
        <div class="card pad"><div class="card-title">意向产品分析</div><div class="chart-box" style="height:255px"><canvas id="productInquiryChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">站点价值分析</div>${this.siteValueTable(messages)}</div>
      </div>
    `;
    this.renderInquiryTrend("inquiryTrendChart", messages);
    this.renderChannelBar("channelBarChart", messages);
    this.renderReferenceHorizontalBar("countryInquiryChart", this.countryInquiryRows(messages).slice(0, 10), "country", "inquiry", "消息量");
    this.renderReferenceHorizontalBar("productInquiryChart", productRows, "product", "inquiry", "消息量", true);
  },
  countryInquiryRows(messages) {
    const map = this.groupCount(messages, item => item.country || "其他");
    return this.topGroups(map, 11).map(([country, inquiry]) => {
      const list = messages.filter(item => (item.country || "其他") === country);
      const valid = list.filter(item => item.valid).length;
      const leadCount = list.filter(item => item.leadId).length;
      return { country, inquiry, valid, leads: leadCount };
    });
  },
  countryInquiryTable(messages) {
    const rows = this.countryInquiryRows(messages);
    return this.compactTable(["国家/地区", "消息量", "生成线索数"], rows.map(row => [row.country, row.inquiry, row.valid]));
  },
  acquisitionReferenceData() {
    return {
      trend: {
        labels: ["07-01", "07-04", "07-07", "07-10", "07-13", "07-16", "07-19", "07-22", "07-25", "07-28", "07-31"],
        inquiry: [108, 220, 184, 291, 112, 165, 190, 255, 138, 132, 126],
        valid: [42, 91, 72, 126, 54, 73, 85, 115, 66, 58, 41]
      },
      channels: [
        { channel: "自然搜索", inquiry: "1,256", ai: "1,198", validRate: "79.8%", leads: 642, conversion: "22.5%", growth: "▲ 18.3%" },
        { channel: "WhatsApp", inquiry: 912, ai: 895, validRate: "74.6%", leads: 441, conversion: "22.8%", growth: "▲ 12.7%" },
        { channel: "直接访问", inquiry: 699, ai: 672, validRate: "63.6%", leads: 372, conversion: "15.9%", growth: "▲ 8.4%" },
        { channel: "EDM", inquiry: 301, ai: 293, validRate: "55.4%", leads: 169, conversion: "14.1%", growth: "▼ 5.6%" },
        { channel: "社媒广告", inquiry: 154, ai: 149, validRate: "48.5%", leads: 92, conversion: "14.2%", growth: "▲ 6.3%" },
        { channel: "SEO内容", inquiry: 81, ai: 75, validRate: "37.8%", leads: 48, conversion: "13.8%", growth: "▼ 2.1%" },
        { channel: "其他", inquiry: 37, ai: 32, validRate: "53.1%", leads: 15, conversion: "25.1%", growth: "▲ 9.8%" }
      ],
      countries: [
        { country: "美国", inquiry: 612, valid: 418, leads: 312 },
        { country: "印度", inquiry: 459, valid: 332, leads: 241 },
        { country: "巴西", inquiry: 326, valid: 221, leads: 153 },
        { country: "土耳其", inquiry: 243, valid: 183, leads: 112 },
        { country: "俄罗斯", inquiry: 201, valid: 156, leads: 90 },
        { country: "德国", inquiry: 147, valid: 112, leads: 62 },
        { country: "越南", inquiry: 126, valid: 98, leads: 53 },
        { country: "法国", inquiry: 118, valid: 86, leads: 44 },
        { country: "英国", inquiry: 112, valid: 79, leads: 38 },
        { country: "墨西哥", inquiry: 98, valid: 71, leads: 35 },
        { country: "其他", inquiry: 323, valid: 199, leads: 118 },
        { country: "合计", inquiry: "2,763", valid: "1,775", leads: "1,255" }
      ],
      products: [
        { product: "化工原料", inquiry: 812, leads: 512 },
        { product: "塑料原料", inquiry: 642, leads: 402 },
        { product: "溶剂系列", inquiry: 321, leads: 324 },
        { product: "中间体", inquiry: 488, leads: 298 },
        { product: "树脂系列", inquiry: 186, leads: 186 },
        { product: "添加剂", inquiry: 271, leads: 152 },
        { product: "其他", inquiry: 193, leads: 102 }
      ],
      focus: [
        { name: "价格", value: 29.3 },
        { name: "交期", value: 18.7 },
        { name: "质量", value: 15.1 },
        { name: "定制", value: 11.3 },
        { name: "认证", value: 8.7 },
        { name: "MOQ", value: 6.4 },
        { name: "COA", value: 4.2 },
        { name: "付款", value: 3.6 },
        { name: "物流", value: 2.7 }
      ],
      sites: [
        { rank: 1, site: "www.chemworld.com", channel: "自然搜索", messages: 512, leads: 421, conversion: "22.1%", amount: "$1,298,450" },
        { rank: 2, site: "www.chemhub.com", channel: "直接访问", messages: 476, leads: 389, conversion: "19.6%", amount: "$1,156,230" },
        { rank: 3, site: "www.globalchem.com", channel: "自然搜索", messages: 398, leads: 332, conversion: "20.4%", amount: "$1,045,780" },
        { rank: 4, site: "www.chemicalmall.com", channel: "社媒广告", messages: 312, leads: 267, conversion: "20.8%", amount: "$945,660" },
        { rank: 5, site: "www.chemtrade.com", channel: "自然搜索", messages: 286, leads: 219, conversion: "17.9%", amount: "$812,340" },
        { rank: 6, site: "www.routelychem.net", channel: "EDM", messages: 218, leads: 156, conversion: "18.6%", amount: "$654,120" },
        { rank: 7, site: "www.whatsapplink.com", channel: "WhatsApp", messages: 204, leads: 138, conversion: "17.0%", amount: "$598,720" },
        { rank: 8, site: "www.alibaba.com", channel: "其他", messages: 176, leads: 102, conversion: "16.2%", amount: "$462,300" },
        { rank: 9, site: "www.1688.com", channel: "其他", messages: 198, leads: 88, conversion: "15.6%", amount: "$438,210" },
        { rank: 10, site: "www.directindustry.com", channel: "自然搜索", messages: 152, leads: 63, conversion: "14.5%", amount: "$312,880" }
      ]
    };
  },
  compactTable(headers, rows) {
    return `<div class="table-wrap" style="margin:0"><table style="font-size:12px"><thead><tr>${headers.map(header => `<th style="padding:8px 10px">${header}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td style="padding:7px 10px">${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  },
  renderReferenceTrend(id, trend) {
    CRMUI.createChart(id, "line", {
      labels: trend.labels,
      datasets: [
        { label: "消息总量", data: trend.inquiry, borderColor: "#1d6ff2", backgroundColor: "rgba(29,111,242,.08)", tension: .35 },
        { label: "生成线索数", data: trend.valid, borderColor: "#2eb84d", backgroundColor: "rgba(46,184,77,.08)", tension: .35 }
      ]
    });
  },
  renderReferenceChannelBar(id, rows) {
    CRMUI.createChart(id, "bar", {
      labels: rows.map(row => row.channel),
      datasets: [
        { label: "消息总量", data: rows.map(row => Number(String(row.inquiry).replace(/,/g, ""))), backgroundColor: "#1d6ff2" },
        { label: "生成线索数", data: rows.map(row => Number(String(row.leads).replace(/,/g, ""))), backgroundColor: "#37c65a" }
      ]
    });
  },
  renderReferenceHorizontalBar(id, rows, labelKey, valueKey, label, includeLeads = false) {
    const datasets = [{ label, data: rows.map(row => Number(String(row[valueKey]).replace(/,/g, ""))), backgroundColor: "#1d6ff2" }];
    if (includeLeads) datasets.push({ label: "线索数", data: rows.map(row => Number(String(row.leads).replace(/,/g, ""))), backgroundColor: "#37c65a" });
    CRMUI.createChart(id, "bar", {
      labels: rows.map(row => row[labelKey]),
      datasets
    }, { indexAxis: "y" });
  },
  renderReferenceFocus(id, rows) {
    CRMUI.createChart(id, "doughnut", {
      labels: rows.map(row => row.name),
      datasets: [{ data: rows.map(row => row.value), backgroundColor: ["#1d6ff2", "#37c65a", "#ffbd4a", "#ff675f", "#8b6cf6", "#00a6a6", "#ff944d", "#ff7aa2", "#98a2b3"] }]
    });
  },
  messageDate(item) {
    return String(item.time || item.lastMessageTime || item.createdAt || "").slice(0, 10);
  },
  inquiryTrendSeries(messages) {
    const map = {};
    messages.forEach(item => {
      const day = this.messageDate(item);
      if (!day) return;
      if (!map[day]) map[day] = { total: 0, valid: 0 };
      map[day].total += 1;
      if (item.valid) map[day].valid += 1;
    });
    const labels = Object.keys(map).sort();
    return { labels, total: labels.map(day => map[day].total), valid: labels.map(day => map[day].valid) };
  },
  renderInquiryTrend(id, messages) {
    const series = this.inquiryTrendSeries(messages);
    CRMUI.createChart(id, "line", {
      labels: series.labels,
      datasets: [
        { label: "消息总量", data: series.total, borderColor: "#0756d8", backgroundColor: "rgba(7,86,216,.12)", fill: true, tension: .35 },
        { label: "生成线索数", data: series.valid, borderColor: "#008a63", backgroundColor: "rgba(0,138,99,.10)", fill: true, tension: .35 }
      ]
    });
  },
  renderChannelBar(id, messages) {
    const channels = ["邮件", "WhatsApp", "官网询盘", "EDM", "展会", "客户转介绍", "其他"];
    const present = channels.filter(channel => messages.some(item => item.channel === channel));
    const labels = present.length ? present : channels.slice(0, 2);
    CRMUI.createChart(id, "bar", {
      labels,
      datasets: [
        { label: "消息总量", data: labels.map(channel => messages.filter(item => item.channel === channel).length), backgroundColor: "#c2d6f7" },
        { label: "生成线索数", data: labels.map(channel => messages.filter(item => item.channel === channel && item.valid).length), backgroundColor: "#008a63" }
      ]
    });
  },
  channelTable(messages) {
    const channels = ["邮件", "WhatsApp", "官网询盘", "EDM", "展会", "客户转介绍", "其他"];
    const rows = channels.map(channel => {
      const list = messages.filter(item => item.channel === channel);
      const generated = list.filter(item => item.valid);
      return {
        channel,
        total: list.length,
        generated: generated.length,
        rate: this.pct(generated.length, list.length),
        growth: list.length ? "+6.8%" : "-"
      };
    });
    return CRMUI.table([
      { title: "来源渠道", render: row => row.channel },
      { title: "消息总量", render: row => row.total },
      { title: "生成线索数", render: row => row.generated },
      { title: "线索生成率", render: row => row.rate },
      { title: "增长", render: row => row.growth }
    ], rows, "暂无渠道数据");
  },
  siteValueTable(messages) {
    const rows = CRM_MOCK.sites.map(site => {
      const list = messages.filter(item => item.siteId === site.id);
      const leads = CRM_MOCK.leads.filter(lead => lead.siteId === site.id && this.dateInRange(lead.createdAt));
      const contracts = CRM_MOCK.contracts.filter(contract => {
        const customer = this.contractCustomer(contract);
        return customer.siteId === site.id && this.contractValid(contract) && this.dateInRange(contract.signedAt);
      });
      const amount = contracts.reduce((sum, contract) => sum + Number(contract.amount || 0), 0);
      const channel = Array.from(new Set(list.map(item => item.channel))).join("、") || "-";
      return { site, channel, messageCount: list.length, leadCount: leads.length, conversion: this.pct(leads.length, list.length), amount };
    }).filter(row => this.siteMatch(row.site, "id")).sort((a, b) => b.amount - a.amount).slice(0, 10);
    return CRMUI.table([
      { title: "站点名称", render: row => row.site.name },
      { title: "渠道", render: row => row.channel },
      { title: "消息数量", render: row => row.messageCount },
      { title: "线索数量", render: row => row.leadCount },
      { title: "转化率", render: row => row.conversion },
      { title: "成交金额", render: row => this.money(row.amount) }
    ], rows, "暂无站点数据");
  },
  renderCustomer() {
    const data = this.customerReferenceData();
    const cards = [
      { label: "客户总数", value: "12,845", foot: "较上年 ▲ 12.6%" },
      { label: "新增客户数", value: "1,628", foot: "较上年 ▲ 8.7%" },
      { label: "成交客户数", value: "1,024", foot: "较上年 ▲ 11.3%" },
      { label: "客户合同金额", value: "¥3,286,500", foot: "较上年 ▲ 15.8%" },
      { label: "高意向客户数", value: "868", foot: "较上年 ▲ 9.4%" },
      { label: "活跃客户数", value: "6,532", foot: "较上年 ▲ 7.9%" },
      { label: "沉默客户数", value: "2,176", foot: "较上年 ▼ 6.2%" }
    ];
    CRMUI.$("#analyticsBody").innerHTML = `
      ${this.metricGrid(cards, 7)}
      <div style="display:grid;grid-template-columns:1.25fr 1.25fr .72fr .82fr;gap:14px;margin-top:14px;align-items:stretch">
        <div class="card pad"><div class="card-title">客户新增趋势</div><div class="chart-box" style="height:260px"><canvas id="customerNewTrendChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">客户成交分析</div><div class="chart-box" style="height:260px"><canvas id="customerDealChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">客户潜质分级分布</div><div class="chart-box" style="height:260px"><canvas id="customerLevelChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">客户国家/地区分布（TOP10 + 其他）</div><div class="chart-box" style="height:260px"><canvas id="customerCountryChart"></canvas></div></div>
      </div>
      <div style="display:grid;grid-template-columns:1.15fr .95fr 1.35fr;gap:14px;margin-top:14px;align-items:stretch">
        <div class="card pad"><div class="card-title">客户标签分布</div><div class="chart-box" style="height:260px"><canvas id="customerTagChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">客户活跃度 ${this.helpTip("90天内有跟进或消息互动的客户")}</div><div class="chart-box" style="height:260px"><canvas id="customerActiveChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">客户关注点分布 ${this.helpTip("按客户名下线索关注点统计客户数量")}</div><div class="chart-box" style="height:260px"><canvas id="customerFocusChart"></canvas></div></div>
      </div>
    `;
    this.renderCustomerReferenceLine("customerNewTrendChart", data.newTrend);
    this.renderCustomerDeal("customerDealChart", data.deal);
    this.renderCustomerDoughnut("customerLevelChart", data.level, "12,845", "客户总数");
    this.renderReferenceHorizontalBar("customerCountryChart", data.countries, "country", "count", "客户数");
    this.renderReferenceHorizontalBar("customerTagChart", data.tags, "tag", "count", "客户数");
    this.renderCustomerDoughnut("customerActiveChart", data.active, "12,845", "客户总数");
    this.renderReferenceHorizontalBar("customerFocusChart", data.focus, "name", "count", "客户数");
  },
  customerReferenceData() {
    return {
      newTrend: {
        labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        values: [120, 150, 210, 180, 260, 240, 278, null, null, null, null, null]
      },
      deal: {
        labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        rate: [12.0, 15.3, 18.2, 14.6, 19.8, 22.1, 24.6, null, null, null, null, null],
        amount: [120, 180, 250, 210, 330, 410, 512, null, null, null, null, null]
      },
      level: [
        { name: "高潜客户", value: 5268 },
        { name: "潜在客户", value: 4187 },
        { name: "一般客户", value: 3390 }
      ],
      countries: [
        { country: "美国", count: 2856 },
        { country: "印度", count: 1842 },
        { country: "巴西", count: 1236 },
        { country: "德国", count: 986 },
        { country: "韩国", count: 742 },
        { country: "越南", count: 628 },
        { country: "英国", count: 512 },
        { country: "日本", count: 468 },
        { country: "墨西哥", count: 436 },
        { country: "法国", count: 392 },
        { country: "其他", count: 2747 }
      ],
      tags: [
        { tag: "大客户", count: 2134 },
        { tag: "重点跟进", count: 1876 },
        { tag: "价格敏感", count: 1542 },
        { tag: "长期合作", count: 1398 },
        { tag: "样品阶段", count: 1126 },
        { tag: "潜力客户", count: 1012 },
        { tag: "渠道客户", count: 896 },
        { tag: "老客户唤醒", count: 632 }
      ],
      focus: [
        { name: "价格", count: 3842 },
        { name: "交期", count: 3126 },
        { name: "质量认证", count: 2458 },
        { name: "定制", count: 1680 },
        { name: "MOQ", count: 1246 },
        { name: "付款条件", count: 986 },
        { name: "包装", count: 812 },
        { name: "物流", count: 654 },
        { name: "其他", count: 428 }
      ],
      active: [
        { name: "活跃客户", value: 6532 },
        { name: "沉默客户", value: 2176 },
        { name: "其他客户", value: 4137 }
      ]
    };
  },
  renderCustomerReferenceLine(id, trend) {
    CRMUI.createChart(id, "line", {
      labels: trend.labels,
      datasets: [{ label: "新增客户数（家）", data: trend.values, borderColor: "#1d6ff2", backgroundColor: "rgba(29,111,242,.08)", tension: .35 }]
    });
  },
  renderCustomerDeal(id, deal) {
    CRMUI.createChart(id, "line", {
      labels: deal.labels,
      datasets: [
        { label: "成交客户占比（%）", data: deal.rate, borderColor: "#1d6ff2", backgroundColor: "rgba(29,111,242,.08)", tension: .35 },
        { label: "年度成交金额（万元）", data: deal.amount, borderColor: "#37c65a", backgroundColor: "rgba(55,198,90,.08)", tension: .35, yAxisID: "y1" }
      ]
    }, { scales: { y1: { position: "right" } } });
  },
  renderCustomerDoughnut(id, rows, centerValue, centerLabel) {
    CRMUI.createChart(id, "doughnut", {
      labels: rows.map(row => row.name),
      datasets: [{ data: rows.map(row => row.value), backgroundColor: ["#1d6ff2", "#37c65a", "#ffbd4a", "#a8b3c7"] }]
    });
  },
  countryFromLead(leadId) {
    const lead = CRM_MOCK.leads.find(item => item.id === leadId);
    const customer = lead?.customerId ? CRM_MOCK.customers.find(item => item.id === lead.customerId) : CRM_MOCK.customers.find(item => item.name === lead?.company || (item.leadIds || []).includes(lead?.id));
    return customer?.country || "";
  },
  countryFromLocation(location = "") {
    if (location.includes("UAE") || location.includes("Dubai")) return "阿联酋";
    if (location.includes("Germany")) return "德国";
    return "";
  },
  productsFromLead(leadId) {
    const lead = CRM_MOCK.leads.find(item => item.id === leadId);
    return lead?.products || [];
  },
  customerNewTrendSeries(customers) {
    const year = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const counts = new Array(12).fill(0);
    customers.forEach(customer => {
      const date = new Date(String(customer.createdAt || "").slice(0, 10));
      if (!Number.isNaN(date.getTime()) && date.getFullYear() === year) counts[date.getMonth()] += 1;
    });
    return {
      labels: Array.from({ length: currentMonth + 1 }, (_, index) => `${index + 1}月`),
      data: counts.slice(0, currentMonth + 1)
    };
  },
  renderCustomerNewTrend(id, customers) {
    const series = this.customerNewTrendSeries(customers);
    CRMUI.createChart(id, "line", {
      labels: series.labels,
      datasets: [{ label: "新增客户数", data: series.data, borderColor: "#0756d8", backgroundColor: "rgba(7,86,216,.12)", fill: true, tension: .35 }]
    });
  },
  renderPie(id, map) {
    const entries = this.topGroups(map, 10);
    CRMUI.createChart(id, "doughnut", {
      labels: entries.map(([name]) => name),
      datasets: [{ data: entries.map(([, value]) => value), backgroundColor: ["#0756d8", "#008a63", "#b85c00", "#6d3bd8", "#0f766e", "#64748b", "#d97706", "#2563eb", "#7c3aed", "#059669"] }]
    });
  },
  renderBar(id, map, label) {
    const entries = this.topGroups(map, 10);
    CRMUI.createChart(id, "bar", {
      labels: entries.map(([name]) => name),
      datasets: [{ label, data: entries.map(([, value]) => value), backgroundColor: "#c2d6f7" }]
    });
  }
};
