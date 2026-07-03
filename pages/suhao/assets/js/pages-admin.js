window.CRMAdminPage = {
  render(root, page, routeKey) {
    if (routeKey === "sites") return this.renderSites(root);
    if (routeKey === "messageTemplates") return this.renderMessageTemplates(root);
    if (routeKey === "pushRules") return this.renderPushRules(root);
    if (routeKey && routeKey.startsWith("system")) return this.renderSystemPage(root, routeKey);
    return this.renderAi(root);
  },
  renderAi(root) {
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newAi">新增 AI 能力</button>
        <button class="btn" id="refreshAi">刷新</button>
      </div>
      <div class="grid cols-3">
        <div class="card metric"><div class="metric-label">启用能力</div><div class="metric-value" id="aiEnabled"></div><div class="metric-foot">邮件、WhatsApp、AI 提炼共用</div></div>
        <div class="card metric"><div class="metric-label">业务场景</div><div class="metric-value">3</div><div class="metric-foot">邮件分析 / 会话洞察 / 批量提炼</div></div>
        <div class="card metric"><div class="metric-label">降级策略</div><div class="metric-value">规则</div><div class="metric-foot">AI 不可用时仍可生成线索</div></div>
      </div>
      <div style="margin-top:16px" id="aiTable"></div>
    `;
    CRMUI.$("#newAi").addEventListener("click", () => this.openAiModal());
    CRMUI.$("#refreshAi").addEventListener("click", () => CRMUI.toast("AI 能力列表已刷新"));
    this.renderAiTable();
  },
  renderSites(root) {
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newSite">新增站点</button>
        <button class="btn" id="refreshSites">刷新</button>
      </div>
      <div class="filters card pad"><input id="siteSearch" placeholder="搜索站点名称或编码"></div>
      <div id="siteTable"></div>
    `;
    const draw = () => {
      const keyword = CRMUI.$("#siteSearch").value.toLowerCase();
      const rows = CRM_MOCK.sites.filter(s => `${s.name} ${s.code}`.toLowerCase().includes(keyword));
      CRMUI.$("#siteTable").innerHTML = CRMUI.table([
        { title: "站点名称", render: s => s.name },
        { title: "站点编码", render: s => s.code },
        { title: "域名", render: s => s.domain },
        { title: "负责人", render: s => CRMUI.userName(s.ownerId) },
        { title: "状态", render: s => CRMUI.badge(s.status) },
        { title: "操作", render: s => `<button class="btn" data-site-edit="${s.id}">编辑</button> <button class="btn" data-site-toggle="${s.id}">${s.status === "启用" ? "停用" : "启用"}</button>` }
      ], rows);
      CRMUI.$$("[data-site-edit]").forEach(btn => btn.addEventListener("click", () => this.openSiteModal(CRM_MOCK.sites.find(s => s.id === btn.dataset.siteEdit), draw)));
      CRMUI.$$("[data-site-toggle]").forEach(btn => btn.addEventListener("click", () => {
        const site = CRM_MOCK.sites.find(s => s.id === btn.dataset.siteToggle);
        site.status = site.status === "启用" ? "停用" : "启用";
        CRMUI.toast(`站点已${site.status}`);
        draw();
      }));
    };
    CRMUI.$("#siteSearch").addEventListener("input", draw);
    CRMUI.$("#newSite").addEventListener("click", () => this.openSiteModal(null, draw));
    CRMUI.$("#refreshSites").addEventListener("click", () => { CRMUI.toast("站点列表已刷新"); draw(); });
    draw();
  },
  openSiteModal(site, after) {
    CRMUI.modal(site ? "编辑站点" : "新增站点", `
      <div class="form-grid">
        ${CRMUI.formInput("站点名称", "name", site?.name || "")}
        ${CRMUI.formInput("站点编码", "code", site?.code || "")}
        ${CRMUI.formInput("域名", "domain", site?.domain || "")}
        ${CRMUI.formSelect("状态", "status", ["启用", "停用"].map(v => ({ value: v, label: v })), site?.status || "启用")}
      </div>`, form => {
      if (site) {
        site.name = form.get("name");
        site.domain = form.get("domain");
        site.status = form.get("status");
      } else {
        CRM_MOCK.sites.push({ id: `s${Date.now()}`, name: form.get("name"), code: form.get("code"), domain: form.get("domain"), status: form.get("status"), ownerId: CRM_MOCK.currentUser.id });
      }
      CRMUI.closeModal();
      CRMUI.toast("站点已保存");
      after();
    });
  },
  renderMessageTemplates(root) {
    root.innerHTML = `
      <div class="filters card pad"><input id="templateSearch" placeholder="搜索模板名称"><select><option>全部渠道</option><option>站内信</option><option>钉钉</option></select></div>
      <div id="templateTable"></div>
    `;
    const rows = [
      { code: "TPL-LEAD-ASSIGN", name: "线索分配模板", event: "线索分配", channel: "站内信 + 钉钉", status: "启用" },
      { code: "TPL-FOLLOW-DUE", name: "待跟进提醒模板", event: "待跟进超时", channel: "站内信", status: "启用" },
      { code: "TPL-CONTRACT-SIGN", name: "合同签约模板", event: "合同签约", channel: "站内信 + 钉钉", status: "启用" }
    ];
    const draw = () => {
      const keyword = CRMUI.$("#templateSearch").value.toLowerCase();
      CRMUI.$("#templateTable").innerHTML = CRMUI.table([
        { title: "模板编码", render: r => r.code },
        { title: "模板名称", render: r => r.name },
        { title: "触发事件类型", render: r => r.event },
        { title: "渠道", render: r => r.channel },
        { title: "状态", render: r => CRMUI.badge(r.status) }
      ], rows.filter(r => r.name.toLowerCase().includes(keyword)));
    };
    CRMUI.$("#templateSearch").addEventListener("input", draw);
    draw();
  },
  renderPushRules(root) {
    root.innerHTML = `
      <div class="toolbar"><button class="btn primary" id="newPushRule">新增推送</button></div>
      <div id="pushTable"></div>
    `;
    this.pushRows = this.pushRows || [
      { name: "线索分配通知", template: "线索分配模板", channel: "站内信 + 钉钉", target: "业务员", status: "启用" },
      { name: "合同签约通知", template: "合同签约模板", channel: "站内信", target: "销售主管", status: "启用" }
    ];
    const draw = () => {
      CRMUI.$("#pushTable").innerHTML = CRMUI.table([
        { title: "规则名称", render: r => r.name },
        { title: "关联模板", render: r => r.template },
        { title: "推送渠道", render: r => r.channel },
        { title: "推送对象", render: r => r.target },
        { title: "状态", render: r => CRMUI.badge(r.status) },
        { title: "操作", render: r => `<button class="btn" data-push="${r.name}">编辑</button>` }
      ], this.pushRows);
      CRMUI.$$("[data-push]").forEach(btn => btn.addEventListener("click", () => this.openPushModal(this.pushRows.find(r => r.name === btn.dataset.push), draw)));
    };
    CRMUI.$("#newPushRule").addEventListener("click", () => this.openPushModal(null, draw));
    draw();
  },
  openPushModal(row, after) {
    CRMUI.modal(row ? "编辑推送" : "新增推送", `
      <div class="form-grid">
        ${CRMUI.formInput("规则名称", "name", row?.name || "")}
        ${CRMUI.formSelect("关联模板", "template", ["线索分配模板", "待跟进提醒模板", "合同签约模板"].map(v => ({ value: v, label: v })), row?.template)}
        ${CRMUI.formSelect("推送渠道", "channel", ["站内信", "钉钉", "站内信 + 钉钉"].map(v => ({ value: v, label: v })), row?.channel)}
        ${CRMUI.formInput("推送对象", "target", row?.target || "业务员")}
      </div>`, form => {
      if (row) Object.assign(row, Object.fromEntries(form.entries()), { status: row.status });
      else this.pushRows.push({ ...Object.fromEntries(form.entries()), status: "启用" });
      CRMUI.closeModal();
      CRMUI.toast("推送规则已保存");
      after();
    });
  },
  renderSystemPage(root, routeKey) {
    const title = CRMRouter.titles[routeKey];
    const rows = {
      systemUsers: CRM_MOCK.users.map(u => ({ a: u.name, b: u.role, c: u.status, d: u.siteIds.map(CRMUI.siteName).join("、") })),
      systemRoles: [{ a: "业务员", b: "sales", c: "仅本人", d: "启用" }, { a: "销售主管", b: "supervisor", c: "本团队", d: "启用" }, { a: "管理员", b: "admin", c: "全部", d: "启用" }],
      systemMenus: this.flattenMenuRows(),
      systemDicts: [{ a: "线索状态", b: "高意向", c: "启用", d: "线索域" }, { a: "合同状态", b: "执行中", c: "启用", d: "合同域" }],
      systemParams: [{ a: "有效询盘自动入池", b: "开启", c: "业务规则", d: "立即生效" }, { a: "未跟进自动回收天数", b: "14 天", c: "业务规则", d: "立即生效" }],
      systemPushConfig: [{ a: "推送渠道", b: "站内信 + 钉钉", c: "启用", d: "立即生效" }, { a: "站内信保留天数", b: "365", c: "启用", d: "立即生效" }],
      systemMailConfig: [{ a: "SMTP 主机", b: "smtp.company.com", c: "465", d: "SSL" }, { a: "IMAP 主机", b: "imap.company.com", c: "993", d: "SSL" }],
      systemWhatsappConfig: [{ a: "API Endpoint", b: "https://wa-business.example.com", c: "启用", d: "Webhook 已配置" }],
      systemNoticeRules: [{ a: "线索分配通知", b: "线索分配", c: "站内信 + 钉钉", d: "启用" }, { a: "待跟进提醒", b: "待跟进超时", c: "站内信", d: "启用" }],
      systemSwitches: [{ a: "AI 能力总开关", b: "开启", c: "全局", d: "立即生效" }, { a: "维护模式", b: "关闭", c: "全局", d: "立即生效" }],
      systemLogs: [{ a: "2026-07-02 10:12:09", b: "Yolanda Wang", c: "配置", d: "更新站点规则" }, { a: "2026-07-02 09:20:11", b: "Chen Hao", c: "新增", d: "录入跟进记录" }]
    }[routeKey] || [];
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="systemEdit">编辑</button>
        <button class="btn" id="systemExport">导出</button>
      </div>
      <div class="filters card pad"><input id="systemSearch" placeholder="搜索${title}"></div>
      <div id="systemTable"></div>
    `;
    const draw = () => {
      const keyword = CRMUI.$("#systemSearch").value.toLowerCase();
      const filtered = rows.filter(r => Object.values(r).join(" ").toLowerCase().includes(keyword));
      CRMUI.$("#systemTable").innerHTML = CRMUI.table([
        { title: "名称/时间", render: r => r.a },
        { title: "编码/对象", render: r => r.b },
        { title: "状态/类型", render: r => r.c.includes("启用") || r.c.includes("关闭") ? CRMUI.badge(r.c) : r.c },
        { title: "说明", render: r => r.d }
      ], filtered);
    };
    CRMUI.$("#systemSearch").addEventListener("input", draw);
    CRMUI.$("#systemEdit").addEventListener("click", () => CRMUI.toast(`${title}已进入编辑状态`));
    CRMUI.$("#systemExport").addEventListener("click", () => CRMUI.toast(`${title}导出已生成`));
    draw();
  },
  flattenMenuRows() {
    const rows = [];
    CRMLayout.menu.forEach(item => {
      rows.push({ a: item.label, b: item.key || item.label, c: "启用", d: item.children ? "一级菜单" : "菜单" });
      (item.children || []).forEach(child => rows.push({ a: child.label, b: child.key, c: "启用", d: "二级菜单" }));
    });
    return rows;
  },
  renderAiTable() {
    CRMUI.$("#aiEnabled").textContent = CRM_MOCK.aiCapabilities.filter(a => a.status === "启用").length;
    CRMUI.$("#aiTable").innerHTML = CRMUI.table([
      { title: "AI 服务商", render: a => a.provider },
      { title: "AI 模型", render: a => a.model },
      { title: "API 端点", render: a => a.endpoint },
      { title: "状态", render: a => CRMUI.badge(a.status) },
      { title: "创建时间", render: a => a.createdAt },
      { title: "操作", render: a => `<button class="btn" data-edit-ai="${a.id}">编辑</button> <button class="btn" data-toggle-ai="${a.id}">${a.status === "启用" ? "停用" : "启用"}</button>` }
    ], CRM_MOCK.aiCapabilities);
    CRMUI.$$("[data-edit-ai]").forEach(btn => btn.addEventListener("click", () => this.openAiModal(CRM_MOCK.aiCapabilities.find(a => a.id === btn.dataset.editAi))));
    CRMUI.$$("[data-toggle-ai]").forEach(btn => btn.addEventListener("click", () => {
      const ai = CRM_MOCK.aiCapabilities.find(a => a.id === btn.dataset.toggleAi);
      ai.status = ai.status === "启用" ? "停用" : "启用";
      CRMUI.toast(`${ai.provider} ${ai.model} 已${ai.status}`);
      this.renderAiTable();
    }));
  },
  openAiModal(ai) {
    CRMUI.modal(ai ? "编辑 AI 能力" : "新增 AI 能力", `
      <div class="form-grid">
        ${CRMUI.formSelect("AI 服务商", "provider", ["OpenAI", "通义千问", "DeepSeek", "智谱 AI", "自定义"].map(v => ({ value: v, label: v })), ai?.provider)}
        ${CRMUI.formInput("AI 模型", "model", ai?.model || "GPT-4o")}
        ${CRMUI.formInput("API 端点", "endpoint", ai?.endpoint || "https://api.example.com/v1")}
        ${CRMUI.formSelect("启用状态", "status", ["启用", "停用"].map(v => ({ value: v, label: v })), ai?.status || "启用")}
      </div>`, form => {
      if (ai) {
        ai.provider = form.get("provider");
        ai.model = form.get("model");
        ai.endpoint = form.get("endpoint");
        ai.status = form.get("status");
      } else {
        CRM_MOCK.aiCapabilities.unshift({ id: `ai${Date.now()}`, provider: form.get("provider"), model: form.get("model"), endpoint: form.get("endpoint"), status: form.get("status"), createdAt: "2026-07-02" });
      }
      CRMUI.closeModal();
      CRMUI.toast("AI 能力已保存");
      this.renderAiTable();
    });
  }
};
