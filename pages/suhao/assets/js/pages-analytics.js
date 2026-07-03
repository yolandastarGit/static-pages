window.CRMAnalyticsPage = {
  render(root, page, routeKey) {
    const initial = routeKey === "analyticsAcquisition" ? "acquisition" : routeKey === "analyticsCustomer" ? "customer" : "sales";
    root.innerHTML = `
      <div class="filters">
        <select id="analyticsRange"><option>本月</option><option>本季度</option><option>本年</option></select>
        <select><option>全部站点</option>${CRM_MOCK.sites.map(s => `<option>${s.name}</option>`).join("")}</select>
        <button class="btn primary" id="refreshAnalytics">刷新</button>
      </div>
      <div id="analyticsBody"></div>
    `;
    CRMUI.$("#refreshAnalytics").addEventListener("click", () => {
      CRMUI.toast("分析数据已刷新");
      this.renderTab(initial);
    });
    this.renderTab(initial);
  },
  renderTab(tab) {
    const body = CRMUI.$("#analyticsBody");
    if (tab === "sales") {
      body.innerHTML = `
        <div class="grid cols-4">${CRM_MOCK.analytics.metrics.map(m => `<div class="card metric"><div class="metric-label">${m.label}</div><div class="metric-value">${m.value}</div><div class="metric-foot">${m.foot}</div></div>`).join("")}</div>
        <div class="grid cols-2" style="margin-top:16px">
          <div class="card pad"><div class="card-title">线索增长与成交金额</div><div class="chart-box"><canvas id="salesTrend"></canvas></div></div>
          <div class="card pad"><div class="card-title">销售排行榜</div>${this.rankTable()}</div>
        </div>`;
      CRMUI.createChart("salesTrend", "bar", {
        labels: CRM_MOCK.analytics.months,
        datasets: [
          { label: "新增线索", data: CRM_MOCK.analytics.leadsTrend, backgroundColor: "#c2d6f7" },
          { label: "成交额(百万)", data: CRM_MOCK.analytics.amountTrend, type: "line", borderColor: "#008a63", yAxisID: "y1" }
        ]
      }, { scales: { y1: { position: "right" } } });
    }
    if (tab === "acquisition") {
      const c = CRM_MOCK.analytics.channels;
      body.innerHTML = `
        <div class="grid cols-2">
          ${["email", "whatsapp"].map(key => `<div class="card pad"><div class="card-title">${key === "email" ? "邮件效能" : "WhatsApp 效能"}</div>
            <div class="grid cols-3">
              <div><div class="metric-label">消息总量</div><div class="metric-value">${c[key].total}</div></div>
              <div><div class="metric-label">AI识别</div><div class="metric-value">${c[key].ai}</div></div>
              <div><div class="metric-label">转化率</div><div class="metric-value">${c[key].conversion}</div></div>
            </div></div>`).join("")}
        </div>
        <div class="card pad" style="margin-top:16px"><div class="card-title">来源站点价值</div>${CRMUI.table([
          { title: "站点", render: s => s.name }, { title: "渠道", render: () => "混合" }, { title: "消息数量", render: () => "12,450" }, { title: "线索数量", render: () => "842" }, { title: "成交金额", render: () => "¥1,245,000" }
        ], CRM_MOCK.sites.filter(s => s.status === "启用"))}</div>`;
    }
    if (tab === "customer") {
      body.innerHTML = `
        <div class="grid cols-4">
          <div class="card metric"><div class="metric-label">客户总数</div><div class="metric-value">${CRM_MOCK.customers.length}</div><div class="metric-foot">较上期 +12.4%</div></div>
          <div class="card metric"><div class="metric-label">新增客户</div><div class="metric-value">846</div><div class="metric-foot">本月</div></div>
          <div class="card metric"><div class="metric-label">成交客户</div><div class="metric-value">1</div><div class="metric-foot">合同去重</div></div>
          <div class="card metric"><div class="metric-label">客户增长率</div><div class="metric-value">24.5%</div><div class="metric-foot">稳定增长</div></div>
        </div>
        <div class="grid cols-2" style="margin-top:16px">
          <div class="card pad"><div class="card-title">行业分布</div><div class="chart-box"><canvas id="industryChart"></canvas></div></div>
          <div class="card pad"><div class="card-title">国家分布</div><div class="chart-box"><canvas id="countryChart"></canvas></div></div>
        </div>`;
      CRMUI.createChart("industryChart", "doughnut", { labels: Object.keys(CRM_MOCK.analytics.customersByIndustry), datasets: [{ data: Object.values(CRM_MOCK.analytics.customersByIndustry), backgroundColor: ["#0756d8", "#008a63", "#b85c00", "#6d3bd8", "#98a2b3"] }] });
      CRMUI.createChart("countryChart", "bar", { labels: Object.keys(CRM_MOCK.analytics.customersByCountry), datasets: [{ label: "客户数", data: Object.values(CRM_MOCK.analytics.customersByCountry), backgroundColor: "#c2d6f7" }] });
    }
  },
  rankTable() {
    const rows = CRM_MOCK.users.filter(u => u.role.includes("业务员")).map((u, index) => ({ ...u, rank: index + 1 }));
    return CRMUI.table([
      { title: "排名", render: r => r.rank },
      { title: "业务员", render: r => r.name },
      { title: "线索数", render: () => "128" },
      { title: "转高意向客户数", render: () => "34" },
      { title: "成交金额", render: () => "¥860,000" }
    ], rows);
  }
};
