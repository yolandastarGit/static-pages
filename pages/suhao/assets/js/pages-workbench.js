window.CRMWorkbenchPage = {
  render(root) {
    root.innerHTML = `
      <div class="filters">
        <select id="timeRange"><option>本月</option><option>本周</option><option>本季度</option></select>
        <select id="siteFilter"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select>
        <button class="btn" id="refreshWorkbench">刷新数据</button>
      </div>
      <div class="grid metric-grid-6" id="metricGrid"></div>
      <div class="grid cols-2" style="margin-top:16px">
        <div class="card pad"><div class="card-title">销售漏斗</div><div class="chart-box"><canvas id="funnelChart"></canvas></div></div>
        <div class="card pad"><div class="card-title">成交额趋势</div><div class="chart-box"><canvas id="amountChart"></canvas></div></div>
      </div>
      <div class="grid cols-4" style="margin-top:16px">
        ${[
          ["公海池", "待分配线索", "publicPool", ""],
          ["线索列表", "跟进、打标、转高意向客户", "leads", ""],
          ["客户列表", "客户资产沉淀", "customers", ""],
          ["合同中心", "成交合同与追溯", "contracts", ""]
        ].map(item => `<div class="card metric" data-quick="${item[2]}" data-query="${item[3]}"><div class="metric-label">${item[0]}</div><div class="metric-foot">${item[1]}</div></div>`).join("")}
      </div>
    `;
    this.renderMetrics();
    this.renderCharts();
    CRMUI.$$("#timeRange,#siteFilter").forEach(el => el.addEventListener("change", () => {
      CRMUI.toast("工作台数据已按筛选条件刷新");
      this.renderMetrics();
    }));
    CRMUI.$("#refreshWorkbench").addEventListener("click", () => CRMUI.toast("工作台数据已刷新"));
    CRMUI.$$("[data-quick]").forEach(el => {
      el.addEventListener("click", () => {
        const params = Object.fromEntries(new URLSearchParams(el.dataset.query).entries());
        CRMRouter.goto(el.dataset.quick, params);
      });
    });
  },
  renderMetrics() {
    const leads = CRM_MOCK.leads;
    const contracts = CRM_MOCK.contracts;
    const activeCustomers = CRM_MOCK.customers.filter(c => c.status !== "流失").length;
    const metrics = [
      { label: "新增线索", value: leads.length, foot: "邮件 2 / WhatsApp 2", route: "leads" },
      { label: "今日待跟进", value: leads.filter(l => l.nextFollowAt && l.nextFollowAt.includes("2026-07")).length, foot: "点击查看线索", route: "leads" },
      { label: "成交额", value: `¥${contracts.reduce((s, c) => s + c.amount, 0).toLocaleString()}`, foot: "执行中合同 1 份", route: "customers" },
      { label: "有效线索率", value: "68.5%", foot: "198 / 289", route: "leads" },
      { label: "线索成交率", value: "17.2%", foot: "34 / 198", route: "analyticsSales" },
      { label: "客户活跃度", value: activeCustomers, foot: "近 30 天有互动", route: "customers" }
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
      labels: ["全部消息", "识别线索", "跟进中", "高意向", "转高意向客户"],
      datasets: [{ label: "数量", data: CRM_MOCK.analytics.funnel, backgroundColor: ["#0756d8", "#3f7fe7", "#77a5ef", "#a8c3f2", "#d6e3fa"] }]
    }, { indexAxis: "y" });
    CRMUI.createChart("amountChart", "line", {
      labels: CRM_MOCK.analytics.months,
      datasets: [{ label: "成交额(百万)", data: CRM_MOCK.analytics.amountTrend, borderColor: "#0756d8", backgroundColor: "rgba(7,86,216,.12)", fill: true, tension: .35 }]
    });
  }
};
