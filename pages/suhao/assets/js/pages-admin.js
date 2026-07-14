window.CRMAdminPage = {
  render(root, page, routeKey) {
    if (routeKey === "sites") return this.renderSites(root);
    if (routeKey === "siteOperationData") return this.renderSiteOperationData(root);
    if (routeKey === "notificationCenter") return this.renderNotificationCenter(root);
    if (routeKey === "systemCommunicationConfig") return this.renderCommunicationConfig(root);
    if (routeKey === "systemLogs") return this.renderSystemLogs(root);
    if (routeKey && routeKey.startsWith("system")) return this.renderSystemPage(root, routeKey);
    return this.renderAi(root);
  },
  renderAi(root) {
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="newAiProvider">新增 AI 能力</button>
          <button class="btn" id="refreshAiProvider">刷新</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter" style="grid-template-columns:repeat(4,minmax(0,1fr))">
            <label class="filter-item"><span>关键词</span><input id="aiSearch" placeholder="搜索能力名称 / 服务商"></label>
            <label class="filter-item"><span>状态</span><select id="aiStatus"><option value="">全部状态</option><option>启用</option><option>停用</option></select></label>
            <label class="filter-item"><span>业务关联</span><select id="aiBusinessScene"><option value="">全部场景</option>${this.aiBusinessScenes().map(scene => `<option value="${scene}">${scene}</option>`).join("")}</select></label>
            <div class="filter-actions"><button class="btn" id="aiQuery">查询</button><button class="btn" id="aiReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="aiProviderTable"></div>
    `;
    this.aiState = { query: "", status: "", businessScene: "" };
    this.renderAiProviderTable();
    CRMUI.$("#newAiProvider").addEventListener("click", () => this.openAiConfigModal());
    CRMUI.$("#refreshAiProvider").addEventListener("click", () => { CRMUI.toast("AI 能力列表已刷新"); this.renderAiProviderTable(); });
    CRMUI.$("#aiSearch").addEventListener("input", e => { this.aiState.query = e.target.value.toLowerCase(); this.renderAiProviderTable(); });
    CRMUI.$("#aiStatus").addEventListener("change", e => { this.aiState.status = e.target.value; this.renderAiProviderTable(); });
    CRMUI.$("#aiBusinessScene").addEventListener("change", e => { this.aiState.businessScene = e.target.value; this.renderAiProviderTable(); });
    CRMUI.$("#aiQuery").addEventListener("click", () => this.renderAiProviderTable());
    CRMUI.$("#aiReset").addEventListener("click", () => {
      this.aiState = { query: "", status: "", businessScene: "" };
      CRMUI.$("#aiSearch").value = "";
      CRMUI.$("#aiStatus").value = "";
      CRMUI.$("#aiBusinessScene").value = "";
      this.renderAiProviderTable();
    });
  },
  renderAiProviderTable() {
    const providers = (CRM_MOCK.aiProviders || []).filter(row => {
      const scenes = this.aiBusinessSceneValues(row);
      const text = `${row.capabilityName || row.name} ${row.name} ${row.defaultModel} ${scenes.join(" ")}`.toLowerCase();
      return text.includes(this.aiState?.query || "")
        && (!this.aiState?.status || row.status === this.aiState.status)
        && (!this.aiState?.businessScene || scenes.includes(this.aiState.businessScene));
    });
    CRMUI.$("#aiProviderTable").innerHTML = CRMUI.table([
      { title: "能力名称", render: row => row.capabilityName || `${row.name} 意向分析` },
      { title: "AI 服务商", render: row => row.name },
      { title: "AI 模型", render: row => row.defaultModel },
      { title: "业务关联", render: row => this.renderAiBusinessScenes(row) },
      { title: "API 端点", render: row => row.config?.api?.baseUrl || "-" },
      { title: "状态", render: row => CRMUI.badge(row.status) },
      { title: "创建时间", render: row => row.createdAt || row.updatedAt },
      { title: "操作", render: row => `<button class="btn" data-ai-config="${row.id}">编辑</button> <button class="btn" data-ai-toggle="${row.id}">${row.status === "启用" ? "停用" : "启用"}</button> <button class="btn danger" data-ai-delete="${row.id}" ${row.status === "启用" ? "disabled title='启用状态不可删除'" : ""}>删除</button>` }
    ], providers, "暂无 AI 服务商配置");
    CRMUI.$$("[data-ai-config]").forEach(btn => btn.addEventListener("click", () => this.openAiConfigModal(CRM_MOCK.aiProviders.find(item => item.id === btn.dataset.aiConfig))));
    CRMUI.$$("[data-ai-toggle]").forEach(btn => btn.addEventListener("click", () => {
      const row = CRM_MOCK.aiProviders.find(item => item.id === btn.dataset.aiToggle);
      row.status = row.status === "启用" ? "停用" : "启用";
      CRMUI.toast(`AI 能力已${row.status}`);
      this.renderAiProviderTable();
    }));
    CRMUI.$$("[data-ai-delete]").forEach(btn => btn.addEventListener("click", () => this.openAiProviderDeleteModal(btn.dataset.aiDelete)));
  },
  maskApiKey(key) {
    if (!key) return "";
    const value = String(key);
    if (value.length <= 4) return "sk-****";
    return `sk-****${value.slice(-4)}`;
  },
  aiConfigTemplate() {
    return JSON.parse(JSON.stringify(CRM_MOCK.aiConfig));
  },
  aiBusinessScenes() {
    return CRM_MOCK.aiBusinessScenes || ["邮件意向分析", "WhatsApp 意向分析", "AI 自动提取企业信息", "批量 AI 提炼"];
  },
  aiBusinessSceneValues(provider = {}) {
    const scenes = provider.businessScene ?? provider.businessScenes ?? [];
    return Array.isArray(scenes) ? scenes.filter(Boolean) : String(scenes || "").split(/[,，]/).map(item => item.trim()).filter(Boolean);
  },
  occupiedAiBusinessScenes(currentProviderId = "") {
    return (CRM_MOCK.aiProviders || []).reduce((map, item) => {
      if (item.id === currentProviderId) return map;
      this.aiBusinessSceneValues(item).forEach(scene => { if (!map[scene]) map[scene] = item; });
      return map;
    }, {});
  },
  aiBusinessSceneOptions(provider) {
    const occupied = this.occupiedAiBusinessScenes(provider?.id);
    return this.aiBusinessScenes().map(scene => {
      const owner = occupied[scene];
      return {
        value: scene,
        label: owner ? `${scene}（已占用）` : scene,
        disabled: Boolean(owner),
        title: owner ? `已被「${owner.capabilityName || owner.name}」占用` : ""
      };
    });
  },
  renderAiBusinessScenes(row) {
    const scenes = this.aiBusinessSceneValues(row);
    return scenes.length ? scenes.map(scene => `<span class="badge blue">${scene}</span>`).join(" ") : "-";
  },
  openAiConfigModal(provider) {
    const isEdit = Boolean(provider);
    const config = provider?.config || this.aiConfigTemplate();
    const providerNames = CRM_MOCK.aiProviderOptions || [];
    const providerOpts = providerNames.map(v => ({ value: v, label: v }));
    const currentProvider = provider?.name && providerNames.includes(provider.name) ? provider.name : (provider ? "自定义" : providerNames[0] || "");
    const modelOpts = (CRM_MOCK.aiModelOptions?.[currentProvider] || []).map(v => ({ value: v, label: v }));
    const isCustomProvider = currentProvider === "自定义";
    const selectedScenes = this.aiBusinessSceneValues(provider);
    CRMUI.modal(isEdit ? `${provider.name} 配置` : "新增 AI 配置", `
      <div class="form-grid">
        ${CRMUI.formInput("能力名称", "capabilityName", provider?.capabilityName || `${provider?.name || "AI"} 意向分析`)}
        ${CRMUI.formMultiSelect("业务关联", "businessScene", this.aiBusinessSceneOptions(provider), selectedScenes)}
        ${CRMUI.formSelect("AI 服务商", "name", providerOpts, currentProvider)}
        ${CRMUI.formSelect("启用状态", "status", ["启用", "停用"].map(value => ({ value, label: value })), provider?.status || "启用")}
        ${isEdit ? `<div class="form-field"><label>API Key</label><input name="apiKey" type="password" value="" placeholder="留空则不修改，当前：${this.maskApiKey(config.api.apiKey)}"></div>` : CRMUI.formInput("API Key", "apiKey", "", "password")}
        ${CRMUI.formInput("API 端点", "baseUrl", config.api.baseUrl)}
        <div class="form-field" id="modelSelectWrap"><label>AI 模型</label><select name="model">${modelOpts.map(o => `<option value="${o.value}" ${o.value === config.api.model ? "selected" : ""}>${o.label}</option>`).join("")}</select></div>
        <div class="form-field" id="modelInputWrap" style="display:${isCustomProvider ? "" : "none"}"><label>AI 模型（自定义）</label><input name="modelCustom" type="text" value="${isCustomProvider ? config.api.model : ""}" placeholder="自定义模型名"></div>
      </div>`, form => {
      const providerName = form.get("name");
      const model = providerName === "自定义" ? (form.get("modelCustom") || "").trim() : form.get("model");
      if (!providerName || !form.get("baseUrl") || !model) return CRMUI.toast("请完善 AI 服务商、API Key、Base URL 和 AI 模型");
      const apiKey = form.get("apiKey") || (isEdit ? config.api.apiKey : "");
      if (!apiKey) return CRMUI.toast("请填写 API Key");
      const businessScene = form.getAll("businessScene").filter(Boolean);
      if (!businessScene.length) return CRMUI.toast("请选择业务关联");
      const occupied = this.occupiedAiBusinessScenes(provider?.id);
      const occupiedScene = businessScene.find(scene => occupied[scene]);
      if (occupiedScene) return CRMUI.toast(`「${occupiedScene}」已被其它 AI 能力占用`);
      const nextConfig = {
        api: {
          apiKey,
          baseUrl: form.get("baseUrl"),
          model,
          secret: form.get("secret"),
          timeout: Number(form.get("timeout") || 30),
          temperature: Number(form.get("temperature") || 0.2),
          maxTokens: Number(form.get("maxTokens") || 4096)
        },
        features: {
          mailAnalysis: form.get("mailAnalysis"),
          whatsappAnalysis: form.get("whatsappAnalysis"),
          leadSummary: form.get("leadSummary")
        }
      };
      const nextProvider = provider || { id: `aip${Date.now()}` };
      nextProvider.name = providerName;
      nextProvider.capabilityName = form.get("capabilityName");
      nextProvider.businessScene = businessScene;
      nextProvider.type = "大语言模型";
      nextProvider.defaultModel = model;
      nextProvider.status = form.get("status");
      nextProvider.createdAt = nextProvider.createdAt || "2026-07-03 17:40";
      nextProvider.updatedAt = "2026-07-03 17:40";
      nextProvider.config = nextConfig;
      if (!isEdit) CRM_MOCK.aiProviders.unshift(nextProvider);
      CRMUI.closeModal();
      CRMUI.toast(isEdit ? "AI 配置已保存" : "AI 配置已新增");
      this.renderAiProviderTable();
    });
    // AI 服务商与模型联动：切换服务商时刷新模型下拉；选"自定义"时降级为文本输入
    const providerSel = CRMUI.$('select[name="name"]');
    const modelSelectWrap = CRMUI.$("#modelSelectWrap");
    const modelInputWrap = CRMUI.$("#modelInputWrap");
    if (providerSel && modelSelectWrap && modelInputWrap) {
      providerSel.addEventListener("change", e => {
        const val = e.target.value;
        const opts = CRM_MOCK.aiModelOptions?.[val] || [];
        modelSelectWrap.querySelector("select").innerHTML = opts.map(m => `<option value="${m}">${m}</option>`).join("");
        if (val === "自定义") {
          modelSelectWrap.style.display = "none";
          modelInputWrap.style.display = "";
        } else {
          modelSelectWrap.style.display = "";
          modelInputWrap.style.display = "none";
        }
      });
    }
  },
  openAiProviderDeleteModal(providerId) {
    const provider = CRM_MOCK.aiProviders.find(item => item.id === providerId);
    if (provider.status === "启用") return CRMUI.toast("启用状态不可删除，请先停用");
    CRMUI.modal("删除 AI 服务商", `
      <p>确认删除「${provider.name}」？删除后该服务商配置将不再显示。</p>
    `, () => {
      CRM_MOCK.aiProviders = CRM_MOCK.aiProviders.filter(item => item.id !== providerId);
      CRMUI.closeModal();
      CRMUI.toast("AI 服务商已删除");
      this.renderAiProviderTable();
    });
  },
  renderSites(root) {
    this.siteState = { query: "", createTimeStart: "", createTimeEnd: "" };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="newSite">新增站点</button>
          <button class="btn" id="refreshSites">刷新</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="siteSearch" placeholder="搜索站点名称或站点 ID"></label>
            <label class="filter-item"><span>创建时间</span><span class="range-picker"><input type="date" id="siteCreateTimeStart" value="${this.siteState.createTimeStart}"><span class="range-separator">-</span><input type="date" id="siteCreateTimeEnd" value="${this.siteState.createTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="siteQuery">查询</button><button class="btn" id="siteReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="siteTable"></div>
    `;
    const draw = () => {
      const keyword = CRMUI.$("#siteSearch").value.toLowerCase();
      const start = CRMUI.$("#siteCreateTimeStart").value;
      const end = CRMUI.$("#siteCreateTimeEnd").value;
      const rows = CRM_MOCK.sites.filter(s => {
        const text = `${s.name} ${s.id}`.toLowerCase();
        const created = String(s.createdAt || "").slice(0, 10);
        const byStart = !start || (created && created >= start);
        const byEnd = !end || (created && created <= end);
        return text.includes(keyword) && byStart && byEnd;
      });
      CRMUI.$("#siteTable").innerHTML = CRMUI.table([
        { title: "站点名称", render: s => s.name },
        { title: "站点 ID", render: s => s.id },
        { title: "站点域名", render: s => s.domain },
        { title: "状态", render: s => CRMUI.badge(s.status) },
        { title: "回收规则", render: () => "手动回收" },
        { title: "绑定运营人员", render: s => this.siteOperatorName(s.boundEmailOwnerId || s.ownerId) },
        { title: "主邮箱", render: s => s.boundEmail || "-" },
        { title: "操作", render: s => `<button class="btn" data-site-edit="${s.id}">编辑</button> <button class="btn" data-site-toggle="${s.id}">${s.status === "启用" ? "停用" : "启用"}</button>` }
      ], rows, "暂无站点");
      CRMUI.$$("[data-site-edit]").forEach(btn => btn.addEventListener("click", () => this.openSiteModal(CRM_MOCK.sites.find(s => s.id === btn.dataset.siteEdit), draw)));
      CRMUI.$$("[data-site-toggle]").forEach(btn => btn.addEventListener("click", () => {
        const site = CRM_MOCK.sites.find(s => s.id === btn.dataset.siteToggle);
        if (site.status === "启用") {
          CRMUI.modal("停用站点", `<p>停用后该站点将不再接收新消息、公海回收暂停，历史数据保留。确认停用？</p>`, () => {
            site.status = "停用";
            CRMUI.closeModal();
            CRMUI.toast("站点已停用");
            draw();
          });
        } else {
          site.status = "启用";
          CRMUI.toast("站点已启用");
          draw();
        }
      }));
    };
    // 时间筛选 change 用 input 事件统一触发重绘（绑定一次，避免重复绑定）
    CRMUI.$$("#siteSearch,#siteCreateTimeStart,#siteCreateTimeEnd").forEach(el => el.addEventListener("input", draw));
    CRMUI.$("#siteQuery").addEventListener("click", draw);
    // 重置恢复默认（创建时间=不限制）
    CRMUI.$("#siteReset").addEventListener("click", () => {
      this.siteState = { query: "", createTimeStart: "", createTimeEnd: "" };
      CRMUI.$("#siteSearch").value = "";
      CRMUI.$("#siteCreateTimeStart").value = "";
      CRMUI.$("#siteCreateTimeEnd").value = "";
      draw();
    });
    CRMUI.$("#newSite").addEventListener("click", () => this.openSiteModal(null, draw));
    CRMUI.$("#refreshSites").addEventListener("click", () => { CRMUI.toast("站点列表已刷新"); draw(); });
    draw();
  },
  siteOperatorName(userId) {
    if (!userId) return "-";
    return (CRM_MOCK.users || []).find(user => user.id === userId)?.name || "-";
  },
  siteOperatorOptions(value = "") {
    return (CRM_MOCK.users || [])
      .filter(user => user.role === "运营专员" && user.status === "启用")
      .map(user => `<option value="${user.id}" ${user.id === value ? "selected" : ""}>${user.name} · ${user.role}</option>`)
      .join("");
  },
  siteEmailOptions(operatorId, value = "") {
    const occupied = new Set((CRM_MOCK.sites || []).map(site => site.boundEmail).filter(email => email && email !== value));
    return (CRM_MOCK.personalEmailAccounts || [])
      .filter(account => account.userId === operatorId && account.status !== "已解绑" && !occupied.has(account.email))
      .map(account => `<option value="${account.email}" ${account.email === value ? "selected" : ""}>${account.email}</option>`)
      .join("");
  },
  bindSiteOperatorEmailCascade() {
    const ownerSelect = CRMUI.$("select[name='boundEmailOwnerId']");
    const emailSelect = CRMUI.$("select[name='boundEmail']");
    if (!ownerSelect || !emailSelect) return;
    ownerSelect.addEventListener("change", e => {
      emailSelect.innerHTML = `<option value="">请选择主邮箱</option>${this.siteEmailOptions(e.target.value, "")}`;
    });
  },
  renderSiteOperationData(root) {
    this.siteOperationState = { siteId: "", periodType: "", periodStart: "", periodEnd: "" };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="newSiteOperation">新增</button>
          <button class="btn" id="importSiteOperation">批量导入</button>
          <button class="btn" id="downloadSiteOperationTpl">下载导入模板</button>
          <button class="btn" id="exportSiteOperation">导出</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>站点</span><select id="siteOperationSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></label>
            <label class="filter-item"><span>周期类型</span><select id="siteOperationPeriodType"><option value="">全部类型</option><option>月</option><option>周</option></select></label>
            <label class="filter-item"><span>统计周期</span><span class="range-picker"><input id="siteOperationPeriodStart" placeholder="2026-01 / 2026-W01"><span class="range-separator">-</span><input id="siteOperationPeriodEnd" placeholder="2026-12 / 2026-W52"></span></label>
            <div class="filter-actions"><button class="btn" id="siteOperationQuery">查询</button><button class="btn" id="siteOperationReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="siteOperationTable"></div>
    `;
    const bind = () => this.renderSiteOperationTable();
    CRMUI.$("#siteOperationSite").addEventListener("change", e => { this.siteOperationState.siteId = e.target.value; bind(); });
    CRMUI.$("#siteOperationPeriodType").addEventListener("change", e => { this.siteOperationState.periodType = e.target.value; bind(); });
    CRMUI.$("#siteOperationPeriodStart").addEventListener("input", e => { this.siteOperationState.periodStart = e.target.value; bind(); });
    CRMUI.$("#siteOperationPeriodEnd").addEventListener("input", e => { this.siteOperationState.periodEnd = e.target.value; bind(); });
    CRMUI.$("#siteOperationQuery").addEventListener("click", bind);
    CRMUI.$("#siteOperationReset").addEventListener("click", () => {
      this.siteOperationState = { siteId: "", periodType: "", periodStart: "", periodEnd: "" };
      CRMUI.$("#siteOperationSite").value = "";
      CRMUI.$("#siteOperationPeriodType").value = "";
      CRMUI.$("#siteOperationPeriodStart").value = "";
      CRMUI.$("#siteOperationPeriodEnd").value = "";
      bind();
    });
    CRMUI.$("#newSiteOperation").addEventListener("click", () => this.openSiteOperationModal());
    CRMUI.$("#importSiteOperation").addEventListener("click", () => this.openSiteOperationImportModal());
    CRMUI.$("#downloadSiteOperationTpl").addEventListener("click", () => CRMUI.toast("已下载站点运营数据导入模板"));
    CRMUI.$("#exportSiteOperation").addEventListener("click", () => CRMUI.toast("站点运营数据导出任务已提交"));
    bind();
  },
  siteOperationRows() {
    const s = this.siteOperationState || {};
    return (CRM_MOCK.siteOperationData || []).filter(row => {
      const bySite = !s.siteId || row.siteId === s.siteId;
      const byType = !s.periodType || row.periodType === s.periodType;
      const byStart = !s.periodStart || row.period >= s.periodStart;
      const byEnd = !s.periodEnd || row.period <= s.periodEnd;
      return bySite && byType && byStart && byEnd;
    }).sort((a, b) => String(b.period).localeCompare(String(a.period)));
  },
  siteOperationColumns() {
    return [
      { title: "站点", render: row => CRMUI.siteName(row.siteId) },
      { title: "统计周期类型", render: row => row.periodType },
      { title: "统计周期", render: row => row.period },
      { title: "广告花费", render: row => this.emptyMetric(row.adSpend) },
      { title: "网站浏览次数", render: row => this.emptyMetric(row.websiteVisits) },
      { title: "询盘量", render: row => this.emptyMetric(row.inquiryCount) },
      { title: "高潜询盘量", render: row => this.emptyMetric(row.highIntentInquiryCount) },
      { title: "询盘转化率", render: row => this.percentMetric(row.inquiryConversionRate) },
      { title: "单个询盘成本", render: row => this.emptyMetric(row.costPerInquiry) },
      { title: "高潜询盘成本", render: row => this.emptyMetric(row.costPerHighIntentInquiry) },
      { title: "平均访问时长", render: row => this.emptyMetric(row.avgVisitDuration) },
      { title: "网站跳出率", render: row => this.percentMetric(row.bounceRate) },
      { title: "GSC 曝光量", render: row => this.emptyMetric(row.gscImpressions) },
      { title: "GSC 点击次数", render: row => this.emptyMetric(row.gscClicks) },
      { title: "GSC 出词数", render: row => this.emptyMetric(row.gscKeywords) },
      { title: "GSC 平均排名", render: row => this.emptyMetric(row.gscAvgPosition) },
      { title: "操作", render: row => `<button class="btn" data-site-operation-edit="${row.id}">编辑</button> <button class="btn danger" data-site-operation-delete="${row.id}">删除</button>` }
    ];
  },
  emptyMetric(value) {
    return value === "" || value === undefined || value === null ? "--" : value;
  },
  percentMetric(value) {
    return value === "" || value === undefined || value === null ? "--" : `${value}%`;
  },
  renderSiteOperationTable() {
    CRMUI.$("#siteOperationTable").innerHTML = CRMUI.table(this.siteOperationColumns(), this.siteOperationRows(), "暂无站点运营数据");
    CRMUI.$$("[data-site-operation-edit]").forEach(btn => btn.addEventListener("click", () => this.openSiteOperationModal(CRM_MOCK.siteOperationData.find(row => row.id === btn.dataset.siteOperationEdit))));
    CRMUI.$$("[data-site-operation-delete]").forEach(btn => btn.addEventListener("click", () => {
      CRMUI.modal("删除站点运营数据", `<p>确认删除该周期站点运营数据？</p>`, () => {
        CRM_MOCK.siteOperationData = (CRM_MOCK.siteOperationData || []).filter(row => row.id !== btn.dataset.siteOperationDelete);
        CRMUI.closeModal();
        CRMUI.toast("站点运营数据已删除");
        this.renderSiteOperationTable();
      });
    }));
  },
  siteOperationFormFields(row = {}) {
    const isEdit = Boolean(row.id);
    return `
      <div class="form-field"><label>站点</label><select name="siteId" ${isEdit ? "disabled" : ""}>${CRMUI.optionList(CRM_MOCK.sites, row.siteId)}</select></div>
      ${isEdit ? `<div class="form-field"><label>统计周期类型</label><input value="${row.periodType || "-"}" disabled></div>` : CRMUI.formSelect("统计周期类型", "periodType", ["月", "周"].map(v => ({ value: v, label: v })), row.periodType || "月")}
      ${isEdit ? `<div class="form-field"><label>统计周期</label><input value="${row.period || "-"}" disabled></div>` : CRMUI.formInput("统计周期", "period", row.period || "", "text")}
      ${CRMUI.formInput("广告花费", "adSpend", row.adSpend || "", "number")}
      ${CRMUI.formInput("网站浏览次数", "websiteVisits", row.websiteVisits || "", "number")}
      ${CRMUI.formInput("询盘量", "inquiryCount", row.inquiryCount || "", "number")}
      ${CRMUI.formInput("高潜询盘量", "highIntentInquiryCount", row.highIntentInquiryCount || "", "number")}
      ${CRMUI.formInput("询盘转化率", "inquiryConversionRate", row.inquiryConversionRate || "", "number")}
      ${CRMUI.formInput("单个询盘成本", "costPerInquiry", row.costPerInquiry || "", "number")}
      ${CRMUI.formInput("高潜询盘成本", "costPerHighIntentInquiry", row.costPerHighIntentInquiry || "", "number")}
      ${CRMUI.formInput("平均访问时长", "avgVisitDuration", row.avgVisitDuration || "", "number")}
      ${CRMUI.formInput("网站跳出率", "bounceRate", row.bounceRate || "", "number")}
      ${CRMUI.formInput("GSC 曝光量", "gscImpressions", row.gscImpressions || "", "number")}
      ${CRMUI.formInput("GSC 点击次数", "gscClicks", row.gscClicks || "", "number")}
      ${CRMUI.formInput("GSC 出词数", "gscKeywords", row.gscKeywords || "", "number")}
      ${CRMUI.formInput("GSC 平均排名", "gscAvgPosition", row.gscAvgPosition || "", "number")}
    `;
  },
  openSiteOperationModal(row) {
    CRMUI.modal(row ? "编辑站点运营数据" : "新增站点运营数据", `<div class="form-grid">${this.siteOperationFormFields(row || {})}</div>`, form => {
      const siteId = row?.siteId || form.get("siteId");
      const periodType = row?.periodType || form.get("periodType");
      const period = row?.period || form.get("period");
      if (!siteId || !periodType || !period) return CRMUI.toast("请完善站点、周期类型和统计周期");
      const duplicated = (CRM_MOCK.siteOperationData || []).find(item => item.id !== row?.id && item.siteId === siteId && item.periodType === periodType && item.period === period);
      if (duplicated) return CRMUI.toast("该站点该周期数据已存在，请编辑或使用导入覆盖");
      const target = row || { id: `sod${Date.now()}` };
      Object.assign(target, {
        siteId, periodType, period,
        adSpend: form.get("adSpend"), websiteVisits: form.get("websiteVisits"), inquiryCount: form.get("inquiryCount"), highIntentInquiryCount: form.get("highIntentInquiryCount"),
        inquiryConversionRate: form.get("inquiryConversionRate"), costPerInquiry: form.get("costPerInquiry"), costPerHighIntentInquiry: form.get("costPerHighIntentInquiry"),
        avgVisitDuration: form.get("avgVisitDuration"), bounceRate: form.get("bounceRate"), gscImpressions: form.get("gscImpressions"), gscClicks: form.get("gscClicks"), gscKeywords: form.get("gscKeywords"), gscAvgPosition: form.get("gscAvgPosition")
      });
      if (!row) (CRM_MOCK.siteOperationData || (CRM_MOCK.siteOperationData = [])).unshift(target);
      CRMUI.closeModal();
      CRMUI.toast("站点运营数据已保存");
      this.renderSiteOperationTable();
    });
  },
  openSiteOperationImportModal() {
    CRMUI.modal("批量导入站点运营数据", `
      <div class="form-grid">
        <div class="form-field full"><label>导入文件</label><input type="file" name="file" accept=".xlsx,.xls,.csv"></div>
      </div>
      <p class="muted">导入字段需与列表字段保持一致，重复周期按行覆盖。</p>
    `, form => {
      if (!form.get("file")?.name) return CRMUI.toast("请上传导入文件");
      CRMUI.closeModal();
      CRMUI.toast("导入完成：成功 8 条，覆盖 2 条，失败 0 条");
    });
  },
  openSiteModal(site, after) {
    const isEdit = Boolean(site);
    const operatorId = site?.boundEmailOwnerId || "";
    const aiValue = site?.config?.ai || "开启";
    CRMUI.modal(isEdit ? "编辑站点" : "新增站点", `
      <div class="form-grid">
        ${CRMUI.formInput("站点名称", "name", site?.name || "")}
        ${CRMUI.formInput("站点域名", "domain", site?.domain || "")}
        ${isEdit
          ? `<div class="form-field"><label>站点 ID</label><input value="${site.id}" disabled></div>`
          : `<div class="form-field full"><small class="muted">站点 ID 将在保存后由系统自动生成，创建后不可修改</small></div>`}
        <div class="form-field"><label>绑定运营人员</label><select name="boundEmailOwnerId"><option value="">请选择运营人员</option>${this.siteOperatorOptions(operatorId)}</select></div>
        <div class="form-field"><label>主邮箱</label><select name="boundEmail"><option value="">请选择主邮箱</option>${this.siteEmailOptions(operatorId, site?.boundEmail || "")}</select></div>
        ${CRMUI.formSelect("启用 AI 识别", "ai", ["开启", "关闭"].map(v => ({ value: v, label: v })), aiValue)}
        <div class="form-field full"><label>回收规则</label><input value="手动回收" disabled><small class="muted">公海回收仅支持运营专员手动处理</small></div>
      </div>`, form => {
      const name = (form.get("name") || "").trim();
      const domain = (form.get("domain") || "").trim();
      const nextOwner = form.get("boundEmailOwnerId");
      const nextEmail = form.get("boundEmail");
      const ai = form.get("ai") || "开启";
      if (!name) return CRMUI.toast("请输入站点名称");
      if (!domain) return CRMUI.toast("请输入站点域名");
      if (!nextOwner) return CRMUI.toast("请选择绑定运营人员");
      if (!nextEmail) return CRMUI.toast("请选择主邮箱");
      const duplicated = (CRM_MOCK.sites || []).find(item => item.id !== site?.id && item.boundEmail === nextEmail);
      if (duplicated) return CRMUI.toast("该邮箱已绑定，不可重复绑定");
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      if (isEdit) {
        site.name = name;
        site.domain = domain;
        site.config = site.config || { ai: "开启", sync: "自动" };
        site.config.ai = ai;
        const emailChanged = site.boundEmail !== nextEmail || site.boundEmailOwnerId !== nextOwner;
        site.boundEmailOwnerId = nextOwner;
        site.boundEmail = nextEmail;
        if (emailChanged) site.boundEmailAt = now;
      } else {
        CRM_MOCK.sites.push({
          id: `SITE-${Date.now()}`,
          name,
          domain,
          status: "启用",
          ownerId: nextOwner,
          boundEmailOwnerId: nextOwner,
          boundEmail: nextEmail,
          boundEmailAt: now,
          createdAt: now,
          config: { ai, publicPool: "关闭", sync: "自动" }
        });
      }
      CRMUI.closeModal();
      CRMUI.toast("站点已保存");
      after();
    });
    this.bindSiteOperatorEmailCascade();
  },
  renderNotificationCenter(root) {
    this.notificationState = { query: "", status: "" };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions"></div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="notificationSearch" placeholder="搜索通知场景"></label>
            <label class="filter-item"><span>状态</span><select id="notificationStatus"><option value="">全部状态</option><option>开启</option><option>关闭</option></select></label>
            <div class="filter-actions"><button class="btn" id="notificationQuery">查询</button><button class="btn" id="notificationReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="notificationTable"></div>
    `;
    CRMUI.$("#notificationSearch").addEventListener("input", e => {
      this.notificationState.query = e.target.value.toLowerCase();
      this.renderNotificationTable();
    });
    CRMUI.$("#notificationStatus").addEventListener("change", e => {
      this.notificationState.status = e.target.value;
      this.renderNotificationTable();
    });
    CRMUI.$("#notificationQuery").addEventListener("click", () => this.renderNotificationTable());
    CRMUI.$("#notificationReset").addEventListener("click", () => {
      this.notificationState = { query: "", status: "" };
      CRMUI.$("#notificationSearch").value = "";
      CRMUI.$("#notificationStatus").value = "";
      this.renderNotificationTable();
    });
    this.renderNotificationTable();
  },
  notificationRows() {
    const keyword = this.notificationState.query;
    return CRM_MOCK.notificationRules.filter(row => `${row.scene} ${row.channels.join(" ")} ${row.targets.join(" ")} ${row.status}`.toLowerCase().includes(keyword) && (!this.notificationState.status || row.status === this.notificationState.status));
  },
  renderNotificationTable() {
    CRMUI.$("#notificationTable").innerHTML = CRMUI.table([
      { title: "通知场景", render: row => row.scene },
      { title: "通知渠道", render: row => row.channels.map(item => `<span class="badge blue">${item}</span>`).join(" ") || `<span class="muted">未配置</span>` },
      { title: "通知对象", render: row => this.renderNotificationTargets(row) },
      { title: "状态", render: row => CRMUI.badge(row.status) },
      { title: "操作", render: row => `<button class="btn" data-notification-edit="${row.id}">编辑</button>` }
    ], this.notificationRows(), "暂无通知规则");
    CRMUI.$$("[data-notification-edit]").forEach(btn => btn.addEventListener("click", () => this.openNotificationModal(btn.dataset.notificationEdit)));
  },
  renderNotificationTargets(row) {
    const users = (row.userIds || []).map(id => CRMUI.userName(id)).filter(name => name !== "-");
    return [...row.targets, ...users].map(item => `<span class="badge gray">${item}</span>`).join(" ") || `<span class="muted">未配置</span>`;
  },
  openNotificationModal(ruleId) {
    const rule = CRM_MOCK.notificationRules.find(item => item.id === ruleId) || {
      id: "",
      scene: CRM_MOCK.notificationScenes[0],
      channels: ["站内信"],
      targets: ["当前负责人"],
      userIds: [],
      title: "",
      body: "",
      status: "开启"
    };
    const targetOptions = Array.from(new Set([...CRM_MOCK.notificationTargetOptions, ...rule.targets]));
    const validUserIds = new Set(CRM_MOCK.users.map(user => user.id));
    const userOptions = [
      ...CRM_MOCK.users.map(user => ({ value: user.id, label: `${user.name} · ${user.role}` })),
      ...(rule.userIds || []).filter(id => !validUserIds.has(id)).map(id => ({ value: id, label: `${id}（已失效）` }))
    ];
    CRMUI.modal("编辑通知", `
      <div class="form-grid">
        <div class="form-field"><label>通知场景</label><input name="scene" value="${rule.scene}" readonly></div>
        ${CRMUI.formMultiSelect("通知渠道", "channels", CRM_MOCK.notificationChannels.map(item => ({ value: item, label: item })), rule.channels)}
        ${CRMUI.formMultiSelect("通知对象", "targets", targetOptions.map(item => ({ value: item, label: CRM_MOCK.notificationTargetOptions.includes(item) ? item : `${item}（已失效）` })), rule.targets)}
        ${CRMUI.formMultiSelect("指定用户", "userIds", userOptions, rule.userIds || [])}
        <div class="form-field full"><label>标题</label><input name="title" value="${rule.title}" required></div>
        <div class="form-field full"><label>正文</label><div class="rich-editor" contenteditable="true" data-field="body">${rule.body}</div></div>
        ${CRMUI.formSelect("状态", "status", ["开启", "关闭"].map(value => ({ value, label: value })), rule.status)}
      </div>
      <div class="notice-confirm" id="disableNotificationConfirm" hidden>
        <strong>确认停用该通知规则？</strong>
        <p class="muted">停用后该通知规则将立即停止推送。</p>
        <div class="toolbar"><button type="button" class="btn primary" id="confirmDisableNotification">确认停用</button><button type="button" class="btn" id="cancelDisableNotification">继续编辑</button></div>
      </div>
    `, form => this.saveNotificationRule(rule, form, false, !rule.id));
    CRMUI.$("#confirmDisableNotification").addEventListener("click", () => this.saveNotificationRule(rule, new FormData(CRMUI.$("#modalForm")), true, !rule.id));
    CRMUI.$("#cancelDisableNotification").addEventListener("click", () => CRMUI.$("#disableNotificationConfirm").hidden = true);
  },
  saveNotificationRule(rule, form, confirmedDisable, isNew = false) {
    const body = CRMUI.$("[data-field='body']")?.innerHTML.trim() || "";
    const channels = form.getAll("channels");
    const targets = form.getAll("targets");
    const userIds = form.getAll("userIds");
    const status = form.get("status");
    const hasInvalidUser = userIds.some(id => !CRM_MOCK.users.find(user => user.id === id));
    const hasInvalidTarget = targets.some(target => !CRM_MOCK.notificationTargetOptions.includes(target));
    if (!channels.length) return CRMUI.toast("请至少选择一个通知渠道");
    if (status === "开启" && !targets.length) return CRMUI.toast("通知对象为空时禁止启用");
    if (targets.includes("指定用户") && !userIds.length) return CRMUI.toast("请选择指定用户");
    if (hasInvalidUser || hasInvalidTarget) return CRMUI.toast("推送对象中包含已失效的用户/角色，请重新选择。");
    if (!form.get("title") || !body) return CRMUI.toast("请完善通知标题和正文");
    if (rule.status === "开启" && status === "关闭" && !confirmedDisable) {
      CRMUI.$("#disableNotificationConfirm").hidden = false;
      return;
    }
    try {
      Object.assign(rule, { scene: form.get("scene"), channels, targets, userIds, title: form.get("title"), body, status });
      if (isNew) {
        rule.id = `nr${Date.now()}`;
        CRM_MOCK.notificationRules.unshift(rule);
      }
      CRMUI.closeModal();
      CRMUI.toast(status === "开启" ? "通知规则已保存并立即生效" : "通知规则已停用");
      CRMLayout.ensureNotifications();
      CRMLayout.renderNotificationBadge();
      this.renderNotificationTable();
    } catch (error) {
      CRMUI.toast(`保存失败：${error.message || "请稍后重试"}`);
    }
  },
  renderCommunicationConfig(root) {
    const q = CRMRouter.query();
    const validTabs = ["mail", "dingtalk"];
    this.communicationState = { tab: validTabs.includes(q.tab) ? q.tab : "mail" };
    root.innerHTML = `
      <div class="tabs" id="communicationTabs">
        <div class="tab ${this.communicationState.tab === "mail" ? "active" : ""}" data-tab="mail">邮箱服务配置</div>
        <div class="tab ${this.communicationState.tab === "dingtalk" ? "active" : ""}" data-tab="dingtalk">钉钉应用配置</div>
      </div>
      <div id="communicationTable"></div>
    `;
    CRMUI.$$("[data-tab]", CRMUI.$("#communicationTabs")).forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("[data-tab]", CRMUI.$("#communicationTabs")).forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      this.communicationState.tab = tab.dataset.tab;
      this.renderCommunicationTable();
    }));
    this.renderCommunicationTable();
  },
  renderCommunicationTable() {
    const tab = this.communicationState.tab;
    if (tab === "mail") return this.renderMailServiceConfig();
    if (tab === "dingtalk") return this.renderDingTalkServiceConfig();
  },
  mailNumberStepper(name, value) {
    return `<div class="mail-stepper" data-stepper="${name}">
      <button class="btn" type="button" data-step="${name}" data-delta="-1">−</button>
      <input name="${name}" type="number" value="${value}">
      <button class="btn" type="button" data-step="${name}" data-delta="1">＋</button>
    </div>`;
  },
  renderMailServiceConfig() {
    const config = CRM_MOCK.mailServiceConfig;
    CRMUI.$("#communicationTable").innerHTML = `
      <form class="mail-config-form" id="mailServiceForm">
        <section class="mail-config-section">
          <div class="mail-section-title"><span>IMAP（收件）</span></div>
          <div class="mail-config-row">
            <label>IMAP 服务器</label>
            <input name="imapServer" value="${config.imapServer}">
          </div>
          <div class="mail-config-row compact">
            <label>IMAP 端口</label>
            ${this.mailNumberStepper("imapPort", config.imapPort)}
            <label class="mail-check"><input type="checkbox" name="imapSsl" ${config.imapSsl ? "checked" : ""}> SSL</label>
          </div>
        </section>
        <section class="mail-config-section">
          <div class="mail-section-title"><span>SMTP（发件）</span></div>
          <div class="mail-config-row">
            <label>SMTP 服务器</label>
            <input name="smtpServer" value="${config.smtpServer}">
          </div>
          <div class="mail-config-row compact">
            <label>SMTP 端口</label>
            ${this.mailNumberStepper("smtpPort", config.smtpPort)}
            <label class="mail-check"><input type="checkbox" name="smtpSsl" ${config.smtpSsl ? "checked" : ""}> SSL</label>
          </div>
        </section>
        <section class="mail-config-section">
          <div class="mail-section-title"><span>主账号凭据</span></div>
          <div class="mail-config-row">
            <label>主账号用户名</label>
            <input name="masterUsername" value="${config.masterUsername}">
          </div>
          <div class="mail-config-row">
            <label>主账号密码</label>
            <input name="masterPassword" type="password" placeholder="已配置，留空则不修改">
          </div>
          <div class="mail-config-row">
            <label>认证模式</label>
            <select name="authMode">
              ${(CRM_MOCK.mailAuthModes || ["MASTER_PASSWORD（子邮箱授权码）"]).map(item => `<option value="${item}" ${item === config.authMode ? "selected" : ""}>${item}</option>`).join("")}
            </select>
          </div>
          <div class="mail-config-row compact with-help">
            <label>拉取间隔(秒)</label>
            ${this.mailNumberStepper("pullInterval", config.pullInterval)}
            <small>定时任务按此间隔拉取，默认 1800 秒（半小时），保存后即时生效</small>
          </div>
        </section>
        <div class="mail-config-actions">
          <button class="btn primary" id="saveMailService" type="submit">保存</button>
          <button class="btn" id="syncMailService" type="button">同步</button>
        </div>
      </form>
    `;
    CRMUI.$$("[data-step]").forEach(btn => btn.addEventListener("click", () => {
      const input = CRMUI.$(`input[name='${btn.dataset.step}']`);
      const next = Math.max(0, Number(input.value || 0) + Number(btn.dataset.delta));
      input.value = next;
    }));
    CRMUI.$("#mailServiceForm").addEventListener("submit", e => {
      e.preventDefault();
      this.saveMailServiceConfig(new FormData(e.target));
    });
    CRMUI.$("#syncMailService").addEventListener("click", () => this.syncMailServiceConfig());
  },
  renderWhatsAppServiceConfig() {
    const config = CRM_MOCK.whatsappServiceConfig || (CRM_MOCK.whatsappServiceConfig = { apiEndpoint: "", accessToken: "", webhookUrl: "", enabled: true });
    CRMUI.$("#communicationTable").innerHTML = `
      <form class="mail-config-form" id="whatsappServiceForm">
        <section class="mail-config-section">
          <div class="mail-section-title"><span>WhatsApp 接入配置</span></div>
          <div class="mail-config-row">
            <label>API 端点</label>
            <input name="apiEndpoint" value="${config.apiEndpoint || ""}">
          </div>
          <div class="mail-config-row">
            <label>Access Token</label>
            <input name="accessToken" type="password" placeholder="${config.accessToken ? "已配置，留空则不修改" : "请输入 Access Token"}">
          </div>
          <div class="mail-config-row">
            <label>Webhook 地址</label>
            <input name="webhookUrl" value="${config.webhookUrl || ""}">
          </div>
          <div class="mail-config-row compact">
            <label class="mail-check"><input type="checkbox" name="enabled" ${config.enabled ? "checked" : ""}> 启用 WhatsApp 消息接收</label>
          </div>
        </section>
        <div class="mail-config-actions">
          <button class="btn primary" type="submit">保存</button>
          <button class="btn" id="testWhatsappService" type="button">测试连接</button>
        </div>
      </form>
    `;
    CRMUI.$("#whatsappServiceForm").addEventListener("submit", e => {
      e.preventDefault();
      const form = new FormData(e.target);
      if (!form.get("apiEndpoint") || !form.get("webhookUrl")) return CRMUI.toast("请完善 WhatsApp 服务配置必填项");
      config.apiEndpoint = form.get("apiEndpoint");
      config.webhookUrl = form.get("webhookUrl");
      config.enabled = form.get("enabled") === "on";
      if (form.get("accessToken")) config.accessToken = form.get("accessToken");
      CRMUI.toast("WhatsApp 服务配置已保存");
    });
    CRMUI.$("#testWhatsappService").addEventListener("click", () => CRMUI.toast("WhatsApp 服务连接测试通过"));
  },
  validateMailServiceConfig(form) {
    const required = ["imapServer", "imapPort", "smtpServer", "smtpPort", "masterUsername", "authMode", "pullInterval"];
    const missing = required.find(name => !String(form.get(name) || "").trim());
    if (missing) {
      CRMUI.toast("请完善邮件服务配置必填项");
      return false;
    }
    return true;
  },
  saveMailServiceConfig(form) {
    if (!this.validateMailServiceConfig(form)) return;
    const config = CRM_MOCK.mailServiceConfig;
    Object.assign(config, {
      imapServer: form.get("imapServer"),
      imapPort: Number(form.get("imapPort")),
      imapSsl: form.get("imapSsl") === "on",
      smtpServer: form.get("smtpServer"),
      smtpPort: Number(form.get("smtpPort")),
      smtpSsl: form.get("smtpSsl") === "on",
      masterUsername: form.get("masterUsername"),
      authMode: form.get("authMode"),
      pullInterval: Number(form.get("pullInterval"))
    });
    if (form.get("masterPassword")) config.masterPassword = form.get("masterPassword");
    CRMUI.toast("邮件服务配置已保存");
  },
  syncMailServiceConfig() {
    const form = new FormData(CRMUI.$("#mailServiceForm"));
    if (!this.validateMailServiceConfig(form)) return;
    const button = CRMUI.$("#syncMailService");
    button.disabled = true;
    button.textContent = "同步中";
    setTimeout(() => {
      button.disabled = false;
      button.textContent = "同步";
      CRMUI.toast("邮件同步完成");
    }, 700);
  },
  renderDingTalkServiceConfig() {
    const config = CRM_MOCK.dingTalkServiceConfig;
    CRMUI.$("#communicationTable").innerHTML = `
      <form class="mail-config-form" id="dingTalkServiceForm">
        <section class="mail-config-section">
          <div class="mail-section-title"><span>钉钉应用凭证</span></div>
          <div class="mail-config-row">
            <label>钉钉应用 AppKey</label>
            <input name="appKey" value="${config.appKey}">
          </div>
          <div class="mail-config-row">
            <label>钉钉应用 AppSecret</label>
            <input name="appSecret" type="password" placeholder="已配置，留空则不修改">
          </div>
          <div class="mail-config-row">
            <label>扫码回调地址</label>
            <input name="callbackUrl" value="${config.callbackUrl}">
          </div>
          <div class="mail-config-row">
            <label>钉钉企业 CorpId</label>
            <input name="corpId" value="${config.corpId || ""}" placeholder="不填则不限定企业">
          </div>
          <div class="mail-config-row compact">
            <label class="mail-check"><input type="checkbox" name="enabled" ${config.enabled ? "checked" : ""}> 启用钉钉扫码登录</label>
          </div>
        </section>
        <div class="mail-config-actions">
          <button class="btn primary" id="saveDingTalkService" type="submit">保存</button>
          <button class="btn" id="syncDingTalkEmployees" type="button">同步钉钉员工</button>
          <button class="btn" id="testDingTalkScan" type="button">测试扫码</button>
        </div>
      </form>
    `;
    CRMUI.$("#dingTalkServiceForm").addEventListener("submit", e => {
      e.preventDefault();
      const form = new FormData(e.target);
      if (!form.get("appKey") || !form.get("callbackUrl")) return CRMUI.toast("请完善钉钉应用配置必填项");
      Object.assign(config, {
        appKey: form.get("appKey"),
        callbackUrl: form.get("callbackUrl"),
        corpId: form.get("corpId"),
        enabled: form.get("enabled") === "on"
      });
      if (form.get("appSecret")) config.appSecret = form.get("appSecret");
      CRMUI.toast("钉钉应用配置已保存");
    });
    CRMUI.$("#syncDingTalkEmployees").addEventListener("click", () => CRMUI.toast("钉钉员工同步完成"));
    CRMUI.$("#testDingTalkScan").addEventListener("click", () => CRMUI.toast("钉钉扫码测试通过，应用凭证配置有效"));
  },
  renderPushServiceConfig() {
    const config = CRM_MOCK.pushServiceConfig;
    const channelOptions = ["站内信", "钉钉"].map(value => ({ value, label: value }));
    CRMUI.$("#communicationTable").innerHTML = `
      <form class="mail-config-form" id="pushServiceForm">
        <section class="mail-config-section">
          <div class="mail-section-title"><span>推送通道</span></div>
          <div class="mail-config-row">
            <label>推送渠道</label>
            ${CRMUI.multiSelect("channels", channelOptions, config.channels)}
          </div>
          <div class="mail-config-row">
            <label>钉钉机器人 Webhook</label>
            <input name="dingTalkRobotWebhook" value="${config.dingTalkRobotWebhook || ""}" placeholder="复用钉钉应用凭证">
          </div>
          <div class="mail-config-row compact with-help">
            <label>站内信保留天数</label>
            ${this.mailNumberStepper("inboxRetentionDays", config.inboxRetentionDays)}
            <small>站内信消息保留时长</small>
          </div>
        </section>
        <div class="mail-config-actions">
          <button class="btn primary" id="savePushService" type="submit">保存</button>
          <button class="btn" id="testPushService" type="button">测试推送</button>
        </div>
      </form>
    `;
    CRMUI.$$("[data-step]").forEach(btn => btn.addEventListener("click", () => {
      const input = CRMUI.$(`input[name='${btn.dataset.step}']`);
      const next = Math.max(0, Number(input.value || 0) + Number(btn.dataset.delta));
      input.value = next;
    }));
    CRMUI.$("#pushServiceForm").addEventListener("submit", e => {
      e.preventDefault();
      const form = new FormData(e.target);
      const channels = form.getAll("channels");
      if (!channels.length) return CRMUI.toast("请至少选择一个推送渠道");
      Object.assign(config, {
        channels,
        dingTalkRobotWebhook: form.get("dingTalkRobotWebhook"),
        inboxRetentionDays: Number(form.get("inboxRetentionDays"))
      });
      CRMUI.toast("消息推送配置已保存");
    });
    CRMUI.$("#testPushService").addEventListener("click", () => CRMUI.toast("测试推送成功，请到目标账号确认"));
  },
  renderEmailAccountTable() {
    const keyword = this.communicationState.query;
    const rows = (CRM_MOCK.emailAccounts || []).filter(account => `${account.email} ${account.provider} ${account.status} ${account.displayName} ${CRMUI.siteName(account.siteId)}`.toLowerCase().includes(keyword));
    CRMUI.$("#communicationTable").innerHTML = CRMUI.table([
      { title: "邮箱账号", render: row => `<strong>${row.email}</strong><div class="small muted">${row.displayName}</div>` },
      { title: "关联站点", render: row => CRMUI.siteName(row.siteId) },
      { title: "邮箱服务商", render: row => row.provider },
      { title: "SMTP/IMAP 状态", render: row => `<span class="badge gray">SMTP ${row.smtpStatus}</span> <span class="badge gray">IMAP ${row.imapStatus}</span>` },
      { title: "默认账号", render: row => row.isDefault ? CRMUI.badge("开启") : `<span class="badge gray">否</span>` },
      { title: "状态", render: row => CRMUI.badge(row.status) },
      { title: "创建时间", render: row => row.createdAt },
      { title: "操作", render: row => `<button class="btn" data-mail-edit="${row.id}">编辑</button> <button class="btn" data-mail-verify="${row.id}">重新验证</button> ${CRMUI.actionMore([
        `<button type="button" data-mail-toggle="${row.id}">${row.status === "启用" ? "停用" : "启用"}</button>`,
        row.isDefault ? "" : `<button type="button" data-mail-default="${row.id}">设为默认</button>`,
        `<button type="button" class="danger" data-mail-delete="${row.id}">删除</button>`
      ].filter(Boolean))}` }
    ], rows, "暂无邮箱账号");
    CRMUI.$$("[data-mail-edit]").forEach(btn => btn.addEventListener("click", () => this.openEmailAccountModal(CRM_MOCK.emailAccounts.find(item => item.id === btn.dataset.mailEdit))));
    CRMUI.$$("[data-mail-verify]").forEach(btn => btn.addEventListener("click", () => this.verifyEmailAccount(btn.dataset.mailVerify)));
    CRMUI.$$("[data-mail-toggle]").forEach(btn => btn.addEventListener("click", () => this.toggleCommunicationAccount("mail", btn.dataset.mailToggle)));
    CRMUI.$$("[data-mail-default]").forEach(btn => btn.addEventListener("click", () => this.markDefaultCommunicationAccount("mail", btn.dataset.mailDefault)));
    CRMUI.$$("[data-mail-delete]").forEach(btn => btn.addEventListener("click", () => this.deleteCommunicationAccount("mail", btn.dataset.mailDelete)));
  },
  setDefaultAccount(type, account) {
    const rows = CRM_MOCK.emailAccounts;
    if (account.isDefault) rows.forEach(item => item.isDefault = item.id === account.id);
  },
  syncMailboxes() {
    CRM_MOCK.mailboxes = (CRM_MOCK.emailAccounts || []).filter(account => account.status === "启用").map(account => account.email);
  },
  connectionSteps(current) {
    return `<div class="step-row">${["填写配置", "连接测试", "保存完成"].map((label, index) => `<span class="step-pill ${index <= current ? "active" : ""}">${index + 1}. ${label}</span>`).join("")}</div>`;
  },
  openEmailAccountModal(account) {
    const row = account || { email: "", siteId: "", displayName: "", provider: "自定义邮箱", imapHost: "", imapPort: "993", imapSsl: "开启", imapUser: "", imapPassword: "", smtpHost: "", smtpPort: "465", smtpSsl: "开启", smtpUser: "", smtpPassword: "", isDefault: false, status: "启用" };
    CRMUI.modal(account ? "编辑邮箱" : "新增邮箱", `
      ${this.connectionSteps(account ? 1 : 0)}
      <input type="hidden" name="tested" value="${account ? "true" : "false"}">
      <div class="form-grid">
        ${CRMUI.formInput("邮箱地址", "email", row.email)}
        <div class="form-field"><label>关联站点</label><select name="siteId"><option value="">请选择关联站点</option>${CRMUI.optionList(CRM_MOCK.sites, row.siteId)}</select></div>
        ${CRMUI.formInput("显示名称", "displayName", row.displayName)}
        ${CRMUI.formInput("邮箱服务商", "provider", row.provider)}
        ${CRMUI.formInput("IMAP Host", "imapHost", row.imapHost)}
        ${CRMUI.formInput("IMAP Port", "imapPort", row.imapPort, "number")}
        ${CRMUI.formSelect("IMAP SSL", "imapSsl", ["开启", "关闭"].map(value => ({ value, label: value })), row.imapSsl)}
        ${CRMUI.formInput("IMAP 用户名", "imapUser", row.imapUser)}
        ${CRMUI.formInput("IMAP 密码/授权码", "imapPassword", row.imapPassword, "password")}
        ${CRMUI.formInput("SMTP Host", "smtpHost", row.smtpHost)}
        ${CRMUI.formInput("SMTP Port", "smtpPort", row.smtpPort, "number")}
        ${CRMUI.formSelect("SMTP SSL", "smtpSsl", ["开启", "关闭"].map(value => ({ value, label: value })), row.smtpSsl)}
        ${CRMUI.formInput("SMTP 用户名", "smtpUser", row.smtpUser)}
        ${CRMUI.formInput("SMTP 密码/授权码", "smtpPassword", row.smtpPassword, "password")}
        ${CRMUI.formSelect("默认账号", "isDefault", [{ value: "true", label: "是" }, { value: "false", label: "否" }], String(Boolean(row.isDefault)))}
        ${CRMUI.formSelect("是否启用", "status", ["启用", "停用"].map(value => ({ value, label: value })), row.status)}
      </div>
      <div class="toolbar"><button class="btn" type="button" id="testEmailConnection">连接测试</button><span class="muted" id="emailTestStatus">${account ? "已通过连接测试" : "保存前需先完成连接测试"}</span></div>
    `, form => this.saveEmailAccount(account, form));
    CRMUI.$("#testEmailConnection").addEventListener("click", () => {
      CRMUI.$("input[name='tested']").value = "true";
      CRMUI.$("#emailTestStatus").textContent = "连接测试通过";
      CRMUI.toast("邮箱连接测试通过");
    });
  },
  saveEmailAccount(account, form) {
    if (form.get("tested") !== "true") return CRMUI.toast("请先完成连接测试");
    if (!form.get("siteId")) return CRMUI.toast("请选择邮箱关联站点");
    if (!form.get("email") || !form.get("imapHost") || !form.get("smtpHost")) return CRMUI.toast("请完善邮箱地址、IMAP Host 和 SMTP Host");
    const target = account || { id: `mail${Date.now()}`, createdAt: "2026-07-03 17:50" };
    Object.assign(target, {
      email: form.get("email"),
      siteId: form.get("siteId"),
      displayName: form.get("displayName"),
      provider: form.get("provider"),
      imapHost: form.get("imapHost"),
      imapPort: form.get("imapPort"),
      imapSsl: form.get("imapSsl"),
      imapUser: form.get("imapUser"),
      imapPassword: form.get("imapPassword"),
      smtpHost: form.get("smtpHost"),
      smtpPort: form.get("smtpPort"),
      smtpSsl: form.get("smtpSsl"),
      smtpUser: form.get("smtpUser"),
      smtpPassword: form.get("smtpPassword"),
      imapStatus: "已验证",
      smtpStatus: "已验证",
      isDefault: form.get("isDefault") === "true",
      status: form.get("status")
    });
    if (!account) CRM_MOCK.emailAccounts.unshift(target);
    this.setDefaultAccount("mail", target);
    this.syncMailboxes();
    CRMUI.closeModal();
    CRMUI.toast("邮箱账号已保存");
    this.renderCommunicationTable();
  },
  verifyEmailAccount(accountId) {
    const account = CRM_MOCK.emailAccounts.find(item => item.id === accountId);
    account.imapStatus = "已验证";
    account.smtpStatus = "已验证";
    CRMUI.toast("邮箱账号重新验证通过");
    this.renderCommunicationTable();
  },
  toggleCommunicationAccount(type, accountId) {
    const rows = CRM_MOCK.emailAccounts;
    const account = rows.find(item => item.id === accountId);
    account.status = account.status === "启用" ? "停用" : "启用";
    if (type === "mail") this.syncMailboxes();
    CRMUI.toast(`账号已${account.status}`);
    this.renderCommunicationTable();
  },
  markDefaultCommunicationAccount(type, accountId) {
    const rows = CRM_MOCK.emailAccounts;
    const account = rows.find(item => item.id === accountId);
    account.isDefault = true;
    this.setDefaultAccount(type, account);
    CRMUI.toast("默认账号已更新");
    this.renderCommunicationTable();
  },
  deleteCommunicationAccount(type, accountId) {
    const rows = CRM_MOCK.emailAccounts;
    const account = rows.find(item => item.id === accountId);
    CRMUI.modal("删除邮箱", `<p>确认删除「${account.email}」？</p>`, () => {
      CRM_MOCK.emailAccounts = CRM_MOCK.emailAccounts.filter(item => item.id !== accountId);
      this.syncMailboxes();
      CRMUI.closeModal();
      CRMUI.toast("账号已删除");
      this.renderCommunicationTable();
    });
  },
  renderSystemUsers(root) {
    this.userState = { query: "", role: "", status: "", siteId: "", createTimeStart: "", createTimeEnd: "", page: 1, pageSize: 5 };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="newSystemUser">新增用户</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="systemSearch" placeholder="搜索用户姓名、登录账号、手机号、邮箱"></label>
            <label class="filter-item"><span>角色</span><select id="systemRole"><option value="">全部角色</option>${this.systemUserRoles().map(role => `<option value="${role}">${role}</option>`).join("")}</select></label>
            <label class="filter-item"><span>站点</span><select id="systemSite"><option value="">全部站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></label>
            <label class="filter-item"><span>状态</span><select id="systemStatus"><option value="">全部状态</option><option>启用</option><option>禁用</option></select></label>
            <label class="filter-item"><span>创建时间</span><span class="range-picker"><input type="date" id="systemCreateTimeStart" value="${this.userState.createTimeStart}"><span class="range-separator">-</span><input type="date" id="systemCreateTimeEnd" value="${this.userState.createTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="systemQuery">查询</button><button class="btn" id="systemReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="systemTable"></div>
    `;
    CRMUI.$("#systemSearch").addEventListener("input", e => {
      this.userState.query = e.target.value.toLowerCase();
      this.userState.page = 1;
      this.renderSystemUserTable();
    });
    CRMUI.$("#systemRole").addEventListener("change", e => {
      this.userState.role = e.target.value;
      this.userState.page = 1;
      this.renderSystemUserTable();
    });
    CRMUI.$("#systemStatus").addEventListener("change", e => {
      this.userState.status = e.target.value;
      this.userState.page = 1;
      this.renderSystemUserTable();
    });
    CRMUI.$("#systemSite").addEventListener("change", e => {
      this.userState.siteId = e.target.value;
      this.userState.page = 1;
      this.renderSystemUserTable();
    });
    CRMUI.$$("#systemCreateTimeStart,#systemCreateTimeEnd").forEach(el => el.addEventListener("change", e => {
      const suffix = el.id.endsWith("Start") ? "Start" : "End";
      this.userState[`createTime${suffix}`] = e.target.value;
      this.userState.page = 1;
      this.renderSystemUserTable();
    }));
    CRMUI.$("#systemQuery").addEventListener("click", () => this.renderSystemUserTable());
    // 重置恢复默认（创建时间=不限制）
    CRMUI.$("#systemReset").addEventListener("click", () => {
      this.userState = { query: "", role: "", status: "", siteId: "", createTimeStart: "", createTimeEnd: "", page: 1, pageSize: this.userState.pageSize };
      this.renderSystemUsers(root);
    });
    CRMUI.$("#newSystemUser").addEventListener("click", () => this.openSystemUserModal());
    this.renderSystemUserTable();
  },
  systemUserRoles() {
    return Array.from(new Set(CRM_MOCK.users.map(user => user.role).filter(Boolean)));
  },
  systemUserRows() {
    const keyword = this.userState.query;
    return CRM_MOCK.users.filter(user => {
      const text = `${user.name} ${user.account || ""} ${user.phone || ""} ${user.email || ""} ${user.role} ${user.status}`.toLowerCase();
      const bySite = !this.userState.siteId || (user.siteIds || []).includes(this.userState.siteId);
      // 创建时间筛选（按日期粒度，空值不限制）
      const created = String(user.createdAt || "").slice(0, 10);
      const byStart = !this.userState.createTimeStart || (created && created >= this.userState.createTimeStart);
      const byEnd = !this.userState.createTimeEnd || (created && created <= this.userState.createTimeEnd);
      return text.includes(keyword) && (!this.userState.role || user.role === this.userState.role) && (!this.userState.status || user.status === this.userState.status) && bySite && byStart && byEnd;
    });
  },
  renderSystemUserTable() {
    const rows = this.systemUserRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / this.userState.pageSize));
    this.userState.page = Math.min(Math.max(1, this.userState.page), totalPages);
    const start = (this.userState.page - 1) * this.userState.pageSize;
    const pageRows = rows.slice(start, start + this.userState.pageSize);
    CRMUI.$("#systemTable").innerHTML = CRMUI.table([
      { title: "用户姓名", render: user => user.name },
      { title: "登录账号", render: user => user.account || "-" },
      { title: "手机号", render: user => user.phone || "-" },
      { title: "邮箱", render: user => user.email || "-" },
      { title: "所属角色", render: user => user.role },
      { title: "授权站点", render: user => (user.siteIds || []).map(CRMUI.siteName).slice(0, 2).join("、") + ((user.siteIds || []).length > 2 ? ` 等 ${(user.siteIds || []).length} 个` : "") || "-" },
      { title: "状态", render: user => CRMUI.badge(user.status) },
      { title: "创建时间", render: user => user.createdAt || "-" },
      { title: "操作", render: user => `<button class="btn" data-system-user-edit="${user.id}">编辑</button> <button class="btn ${user.status === "启用" ? "danger" : ""}" data-system-user-toggle="${user.id}">${user.status === "启用" ? "禁用" : "启用"}</button> <button class="btn" data-system-user-reset="${user.id}">重置密码</button> ${CRMUI.actionMore([`<button type="button" data-system-user-detail="${user.id}">详情</button>`])}` }
    ], pageRows, "暂无用户") + `
      <div class="toolbar" style="justify-content:flex-end;margin-top:12px">
        <span class="muted">第 ${this.userState.page} / ${totalPages} 页，共 ${rows.length} 条</span>
        <button class="btn" id="systemUserPrev" ${this.userState.page <= 1 ? "disabled" : ""}>上一页</button>
        <button class="btn" id="systemUserNext" ${this.userState.page >= totalPages ? "disabled" : ""}>下一页</button>
      </div>
    `;
    CRMUI.$$("[data-system-user-edit]").forEach(btn => btn.addEventListener("click", () => this.openSystemUserModal(CRM_MOCK.users.find(user => user.id === btn.dataset.systemUserEdit))));
    CRMUI.$$("[data-system-user-toggle]").forEach(btn => btn.addEventListener("click", () => this.openSystemUserToggleModal(btn.dataset.systemUserToggle)));
    CRMUI.$$("[data-system-user-reset]").forEach(btn => btn.addEventListener("click", () => this.openSystemUserResetPasswordModal(btn.dataset.systemUserReset)));
    CRMUI.$$("[data-system-user-detail]").forEach(btn => btn.addEventListener("click", () => this.openSystemUserDetailModal(btn.dataset.systemUserDetail)));
    CRMUI.$("#systemUserPrev")?.addEventListener("click", () => {
      this.userState.page -= 1;
      this.renderSystemUserTable();
    });
    CRMUI.$("#systemUserNext")?.addEventListener("click", () => {
      this.userState.page += 1;
      this.renderSystemUserTable();
    });
  },
  systemUserSiteOptions(values = []) {
    const selected = new Set(values);
    return CRM_MOCK.sites.map(site => `<option value="${site.id}" ${selected.has(site.id) ? "selected" : ""}>${site.name}</option>`).join("");
  },
  systemDingTalkAccountOptions(user = {}) {
    const accounts = Array.from(new Set([...(CRM_MOCK.dingTalkAccounts || []), ...CRM_MOCK.users.map(item => item.dingTalkAccount).filter(Boolean)]));
    return [
      `<option value="">未关联 / 解除关联</option>`,
      ...accounts.map(account => {
        const owner = CRM_MOCK.users.find(item => item.dingTalkAccount === account && item.id !== user.id);
        const disabled = owner ? "disabled" : "";
        const label = owner ? `${account}（已关联：${owner.name}）` : account;
        return `<option value="${account}" ${user.dingTalkAccount === account ? "selected" : ""} ${disabled}>${label}</option>`;
      })
    ].join("");
  },
  openSystemUserModal(user) {
    const isEdit = Boolean(user);
    const roleOptions = this.systemUserRoles().map(role => ({ value: role, label: role }));
    CRMUI.modal(isEdit ? "编辑用户" : "新增用户", `
      <div class="form-grid">
        ${CRMUI.formInput("用户姓名", "name", user?.name || "")}
        <div class="form-field"><label>登录账号</label><input name="account" value="${user?.account || ""}" ${isEdit ? "disabled" : ""}></div>
        ${CRMUI.formInput("手机号", "phone", user?.phone || "")}
        ${CRMUI.formInput("邮箱", "email", user?.email || "")}
        <div class="form-field"><label>绑定钉钉员工</label><select name="dingTalkAccount">${this.systemDingTalkAccountOptions(user || {})}</select></div>
        ${CRMUI.formSelect("所属角色", "role", roleOptions, user?.role || roleOptions[0]?.value || "")}
        ${CRMUI.formSelect("所属团队", "team", ["销售一组", "销售二组", "区域协同组"].map(value => ({ value, label: value })), user?.team || "")}
        ${CRMUI.formSelect("状态", "status", ["启用", "禁用"].map(value => ({ value, label: value })), user?.status || "启用")}
        ${CRMUI.formMultiSelect("授权站点", "siteIds", CRM_MOCK.sites.map(site => ({ value: site.id, label: site.name })), user?.siteIds || [])}
      </div>`, form => {
      const name = form.get("name").trim();
      const account = isEdit ? user.account : form.get("account").trim();
      const dingTalkAccount = form.get("dingTalkAccount");
      if (!name || !account) return CRMUI.toast("请填写用户姓名和登录账号");
      const phone = form.get("phone").trim();
      const email = form.get("email").trim();
      if (phone && !/^1\d{10}$/.test(phone)) return CRMUI.toast("请输入正确的手机号");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return CRMUI.toast("请输入正确的邮箱");
      const siteIds = form.getAll("siteIds");
      if (!siteIds.length) return CRMUI.toast("请至少选择一个站点");
      const duplicated = CRM_MOCK.users.find(item => item.account === account && item.id !== user?.id);
      if (duplicated) return CRMUI.toast("登录账号已存在");
      const duplicatedDingTalk = dingTalkAccount && CRM_MOCK.users.find(item => item.dingTalkAccount === dingTalkAccount && item.id !== user?.id);
      if (duplicatedDingTalk) return CRMUI.toast("该钉钉账号已关联其他用户");
      const target = user || { id: `u${Date.now()}`, dingTalkStatus: "未绑定", dingTalkAccount: "", createdAt: "2026-07-05 10:30" };
      Object.assign(target, {
        name,
        account,
        phone,
        email,
        dingTalkAccount,
        dingTalkStatus: dingTalkAccount ? "已绑定" : "未绑定",
        role: form.get("role"),
        team: form.get("team"),
        status: form.get("status"),
        siteIds
      });
      if (!isEdit) CRM_MOCK.users.unshift(target);
      this.syncAuthUser(target, !isEdit);
      CRMUI.closeModal();
      CRMUI.toast(isEdit ? "用户已更新" : "用户已新增");
      this.renderSystemUserTable();
    });
  },
  syncAuthUser(user, isNew) {
    CRM_MOCK.authUsers = CRM_MOCK.authUsers || [];
    const authUser = CRM_MOCK.authUsers.find(item => item.userId === user.id);
    if (authUser) {
      authUser.username = user.account;
      authUser.email = user.email;
    } else if (isNew) {
      CRM_MOCK.authUsers.push({ username: user.account, email: user.email, password: "123456", userId: user.id });
    }
  },
  openSystemUserResetPasswordModal(userId) {
    const user = CRM_MOCK.users.find(item => item.id === userId);
    if (!user) return CRMUI.toast("未找到用户");
    CRMUI.modal("重置密码", `<p>重置后用户「${user.name}」密码将恢复为初始密码（123456）。确定重置吗？</p>`, () => {
      const authUser = (CRM_MOCK.authUsers || []).find(item => item.userId === user.id);
      if (authUser) authUser.password = "123456";
      CRMUI.closeModal();
      CRMUI.toast("密码已重置");
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "确认重置";
  },
  openSystemUserToggleModal(userId) {
    const user = CRM_MOCK.users.find(item => item.id === userId);
    if (!user) return CRMUI.toast("未找到用户");
    if (user.id === CRM_MOCK.currentUser.id && user.status === "启用") return CRMUI.toast("当前登录用户不可禁用");
    const nextStatus = user.status === "启用" ? "禁用" : "启用";
    if (nextStatus === "禁用" && user.role === "系统管理员") return CRMUI.toast("系统管理员不可禁用");
    if (nextStatus === "启用") {
      user.status = "启用";
      CRMUI.toast("用户已启用");
      this.renderSystemUserTable();
      return;
    }
    const message = `禁用后「${user.name}」无法登录系统，名下数据保持原状态。确定禁用该用户吗？`;
    CRMUI.modal(`${nextStatus}用户`, `<p>${message}</p>`, () => {
      user.status = nextStatus;
      CRMUI.closeModal();
      CRMUI.toast(`用户已${nextStatus}`);
      this.renderSystemUserTable();
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "确认禁用";
  },
  openSystemUserDetailModal(userId) {
    const user = CRM_MOCK.users.find(item => item.id === userId);
    CRMUI.modal("用户详情", `
      <div class="grid cols-2">
        <div><div class="muted">用户姓名</div><strong>${user.name}</strong></div>
        <div><div class="muted">登录账号</div><strong>${user.account || "-"}</strong></div>
        <div><div class="muted">手机号</div><strong>${user.phone || "-"}</strong></div>
        <div><div class="muted">邮箱</div><strong>${user.email || "-"}</strong></div>
        <div><div class="muted">所属角色</div><strong>${user.role}</strong></div>
        <div><div class="muted">授权站点</div><strong>${(user.siteIds || []).map(CRMUI.siteName).join("、") || "-"}</strong></div>
        <div><div class="muted">所属团队</div><strong>${user.team || "-"}</strong></div>
        <div><div class="muted">状态</div><strong>${user.status}</strong></div>
      </div>
    `, () => CRMUI.closeModal());
    CRMUI.$("#modalForm button[type='submit']").textContent = "关闭";
  },
  renderSystemPage(root, routeKey) {
    if (routeKey === "systemUsers") return this.renderSystemUsers(root);
    if (routeKey === "systemRoles") return this.renderSystemRoles(root);
    if (routeKey === "systemMenus") return this.renderSystemMenus(root);
    if (routeKey === "systemDicts") return this.renderSystemDicts(root);
    if (routeKey === "systemParams") return this.renderParamSettings(root);
    const title = CRMRouter.titles[routeKey];
    const rows = {
      systemLogs: [{ a: "2026-07-02 10:12:09", b: "管理员", c: "配置", d: "更新站点规则" }, { a: "2026-07-02 09:20:11", b: "Chen Hao", c: "新增", d: "录入跟进记录" }]
    }[routeKey] || [];
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="systemEdit">编辑</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="systemSearch" placeholder="搜索${title}"></label>
            <div class="filter-actions"><button class="btn" id="systemQuery">查询</button><button class="btn" id="systemReset">重置</button></div>
          </div>
        </div>
      </div>
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
    CRMUI.$("#systemQuery").addEventListener("click", draw);
    CRMUI.$("#systemReset").addEventListener("click", () => {
      CRMUI.$("#systemSearch").value = "";
      draw();
    });
    CRMUI.$("#systemEdit").addEventListener("click", () => CRMUI.toast(`${title}已进入编辑状态`));
    draw();
  },
  ensureSystemMenus() {
    if (Array.isArray(CRM_MOCK.systemMenus) && CRM_MOCK.systemMenus.length) return CRM_MOCK.systemMenus;
    const menus = [];
    let seq = 1;
    const walk = (items, parentId = null, depth = 0) => {
      (items || []).forEach((item, index) => {
        const id = `m${seq++}`;
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
        const type = hasChildren || !item.key ? "目录" : "菜单";
        const path = type === "目录" ? "#" : `/${item.key}`;
        const perm = type === "目录" ? "-" : (item.key || "-");
        menus.push({
          id,
          parentId,
          name: item.label,
          icon: item.icon || (type === "目录" ? "📁" : "📄"),
          key: item.key || "",
          path,
          type,
          visible: "显示",
          perm,
          sort: index,
          depth,
          builtin: true
        });
        if (hasChildren) walk(item.children, id, depth + 1);
      });
    };
    walk(CRMLayout.menu || []);
    CRM_MOCK.systemMenus = menus;
    return menus;
  },
  renderSystemMenus(root) {
    this.ensureSystemMenus();
    this.menuState = this.menuState || { query: "", selectedId: "", collapsed: new Set(), expandedAll: true };
    if (this.menuState.expandedAll && this.menuState.collapsed.size) {
      // keep current collapse state
    } else if (this.menuState.expandedAll) {
      this.menuState.collapsed = new Set();
    }
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="menuAdd">新增</button>
          <button class="btn soft-green" id="menuEdit">修改</button>
          <button class="btn soft-cyan" id="menuSaveSort">保存排序</button>
          <button class="btn" id="menuExpandToggle">展开/折叠</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="menuSearch" placeholder="菜单名称 / 请求地址 / 权限标识" value="${this.menuState.query || ""}"></label>
            <div class="filter-actions"><button class="btn" id="menuQuery">查询</button><button class="btn" id="menuReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="menuTable"></div>
    `;
    const draw = () => this.renderSystemMenusTable();
    CRMUI.$("#menuSearch").addEventListener("input", e => { this.menuState.query = e.target.value; draw(); });
    CRMUI.$("#menuQuery").addEventListener("click", draw);
    CRMUI.$("#menuReset").addEventListener("click", () => {
      this.menuState.query = "";
      this.menuState.selectedId = "";
      CRMUI.$("#menuSearch").value = "";
      draw();
    });
    CRMUI.$("#menuAdd").addEventListener("click", () => CRMUI.toast("系统菜单暂不支持新增"));
    CRMUI.$("#menuEdit").addEventListener("click", () => {
      if (!this.menuState.selectedId) return CRMUI.toast("请先选择要修改的菜单");
      this.openMenuModal(CRM_MOCK.systemMenus.find(m => m.id === this.menuState.selectedId));
    });
    CRMUI.$("#menuSaveSort").addEventListener("click", () => this.saveMenuSort());
    CRMUI.$("#menuExpandToggle").addEventListener("click", () => {
      const parents = CRM_MOCK.systemMenus.filter(m => CRM_MOCK.systemMenus.some(c => c.parentId === m.id));
      const allCollapsed = parents.every(p => this.menuState.collapsed.has(p.id));
      this.menuState.collapsed = allCollapsed ? new Set() : new Set(parents.map(p => p.id));
      this.menuState.expandedAll = allCollapsed;
      draw();
    });
    draw();
  },
  menuChildren(parentId) {
    return (CRM_MOCK.systemMenus || [])
      .filter(m => m.parentId === parentId)
      .sort((a, b) => Number(a.sort) - Number(b.sort));
  },
  menuFlatRows() {
    const keyword = (this.menuState?.query || "").toLowerCase();
    const roots = this.menuChildren(null);
    const out = [];
    if (keyword) {
      const matched = (CRM_MOCK.systemMenus || []).filter(m =>
        `${m.name} ${m.path} ${m.perm} ${m.type}`.toLowerCase().includes(keyword)
      );
      const keep = new Set();
      matched.forEach(m => {
        let cur = m;
        while (cur) {
          keep.add(cur.id);
          cur = CRM_MOCK.systemMenus.find(x => x.id === cur.parentId);
        }
      });
      const walkKeep = list => {
        list.forEach(menu => {
          if (keep.has(menu.id)) out.push(menu);
          walkKeep(this.menuChildren(menu.id));
        });
      };
      walkKeep(roots);
      return out;
    }
    const walk = list => {
      list.forEach(menu => {
        out.push(menu);
        if (this.menuChildren(menu.id).length && !this.menuState.collapsed.has(menu.id)) {
          walk(this.menuChildren(menu.id));
        }
      });
    };
    walk(roots);
    return out;
  },
  renderSystemMenusTable() {
    const rows = this.menuFlatRows();
    CRMUI.$("#menuTable").innerHTML = CRMUI.table([
      {
        title: "",
        render: menu => `<input type="radio" name="menuSelect" data-menu-select="${menu.id}" ${this.menuState.selectedId === menu.id ? "checked" : ""}>`
      },
      {
        title: "菜单名称",
        render: menu => {
          const hasChildren = this.menuChildren(menu.id).length > 0;
          const collapsed = this.menuState.collapsed.has(menu.id);
          const pad = (menu.depth || 0) * 18;
          return `
            <div class="menu-tree-name" style="padding-left:${pad}px">
              <button type="button" class="menu-tree-toggle ${hasChildren ? "" : "is-leaf"}" data-menu-toggle="${menu.id}">${hasChildren ? (collapsed ? "▸" : "▾") : "·"}</button>
              <span class="menu-tree-icon">${menu.icon || "📄"}</span>
              <span>${menu.name}</span>
            </div>
          `;
        }
      },
      {
        title: "排序",
        render: menu => `<input class="menu-sort-input" type="number" data-menu-sort="${menu.id}" value="${menu.sort}">`
      },
      { title: "请求地址", render: menu => menu.path || "-" },
      {
        title: "类型",
        render: menu => `<span class="badge ${menu.type === "目录" ? "blue" : "green"}">${menu.type}</span>`
      },
      {
        title: "可见",
        render: menu => `<span class="badge cyan">${menu.visible || "显示"}</span>`
      },
      { title: "权限标识", render: menu => menu.perm || "-" },
      {
        title: "操作",
        render: menu => `
          <button class="btn" data-menu-edit="${menu.id}">编辑</button>
          <button class="btn soft-cyan" data-menu-add-child="${menu.id}">新增</button>
          <button class="btn danger" data-menu-del="${menu.id}">删除</button>
        `
      }
    ], rows, "暂无菜单");
    CRMUI.$$("[data-menu-select]").forEach(el => el.addEventListener("change", () => {
      this.menuState.selectedId = el.dataset.menuSelect;
    }));
    CRMUI.$$("[data-menu-toggle]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.menuToggle;
      if (!this.menuChildren(id).length) return;
      if (this.menuState.collapsed.has(id)) this.menuState.collapsed.delete(id);
      else this.menuState.collapsed.add(id);
      this.renderSystemMenusTable();
    }));
    CRMUI.$$("[data-menu-edit]").forEach(btn => btn.addEventListener("click", () => {
      this.menuState.selectedId = btn.dataset.menuEdit;
      this.openMenuModal(CRM_MOCK.systemMenus.find(m => m.id === btn.dataset.menuEdit));
    }));
    CRMUI.$$("[data-menu-add-child]").forEach(btn => btn.addEventListener("click", () => {
      CRMUI.toast("系统菜单暂不支持新增子菜单");
    }));
    CRMUI.$$("[data-menu-del]").forEach(btn => btn.addEventListener("click", () => {
      const menu = CRM_MOCK.systemMenus.find(m => m.id === btn.dataset.menuDel);
      if (!menu) return;
      if (menu.builtin) return CRMUI.toast("系统内置菜单不可删除");
      CRMUI.modal("删除菜单", `<p>确认删除菜单「${menu.name}」？</p>`, () => {
        CRM_MOCK.systemMenus = CRM_MOCK.systemMenus.filter(m => m.id !== menu.id && m.parentId !== menu.id);
        CRMUI.closeModal();
        CRMUI.toast("菜单已删除");
        this.renderSystemMenusTable();
      });
    }));
  },
  saveMenuSort() {
    CRMUI.$$("[data-menu-sort]").forEach(input => {
      const menu = CRM_MOCK.systemMenus.find(m => m.id === input.dataset.menuSort);
      if (menu) menu.sort = Number(input.value || 0);
    });
    CRMUI.toast("菜单排序已保存");
    this.renderSystemMenusTable();
  },
  openMenuModal(menu) {
    if (!menu) return;
    const typeOpts = ["目录", "菜单"].map(v => ({ value: v, label: v }));
    const visibleOpts = ["显示", "隐藏"].map(v => ({ value: v, label: v }));
    CRMUI.modal("修改菜单", `
      <div class="form-grid">
        ${CRMUI.formInput("菜单名称", "name", menu.name)}
        ${CRMUI.formSelect("类型", "type", typeOpts, menu.type)}
        ${CRMUI.formInput("请求地址", "path", menu.path)}
        ${CRMUI.formInput("权限标识", "perm", menu.perm === "-" ? "" : menu.perm)}
        ${CRMUI.formInput("显示顺序", "sort", menu.sort, "number")}
        ${CRMUI.formSelect("可见", "visible", visibleOpts, menu.visible || "显示")}
        <div class="form-field full"><small class="muted">系统内置菜单仅支持维护名称、排序、权限标识和可见状态。</small></div>
      </div>
    `, form => {
      const name = (form.get("name") || "").trim();
      if (!name) return CRMUI.toast("请输入菜单名称");
      menu.name = name;
      menu.type = form.get("type") || menu.type;
      menu.path = (form.get("path") || "").trim() || (menu.type === "目录" ? "#" : menu.path);
      menu.perm = (form.get("perm") || "").trim() || (menu.type === "目录" ? "-" : menu.perm);
      menu.sort = Number(form.get("sort") || 0);
      menu.visible = form.get("visible") || "显示";
      CRMUI.closeModal();
      CRMUI.toast("菜单已保存");
      this.renderSystemMenusTable();
    });
  },
  renderSystemRoles(root) {
    this.roleState = this.roleState || { query: "", status: "", selected: new Set() };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="roleAdd">新增</button>
          <button class="btn soft-green" id="roleEdit">修改</button>
          <button class="btn soft-red" id="roleDelete">删除</button>
          <button class="btn soft-amber" id="roleExport">导出</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="roleSearch" placeholder="角色名称 / 权限字符" value="${this.roleState.query || ""}"></label>
            <label class="filter-item"><span>状态</span><select id="roleStatus">
              <option value="">全部状态</option>
              <option value="启用" ${this.roleState.status === "启用" ? "selected" : ""}>启用</option>
              <option value="停用" ${this.roleState.status === "停用" ? "selected" : ""}>停用</option>
            </select></label>
            <div class="filter-actions"><button class="btn" id="roleQuery">查询</button><button class="btn" id="roleReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="roleTable"></div>
    `;
    const draw = () => this.renderSystemRolesTable();
    CRMUI.$("#roleSearch").addEventListener("input", e => { this.roleState.query = e.target.value; draw(); });
    CRMUI.$("#roleStatus").addEventListener("change", e => { this.roleState.status = e.target.value; draw(); });
    CRMUI.$("#roleQuery").addEventListener("click", draw);
    CRMUI.$("#roleReset").addEventListener("click", () => {
      this.roleState.query = "";
      this.roleState.status = "";
      this.roleState.selected = new Set();
      CRMUI.$("#roleSearch").value = "";
      CRMUI.$("#roleStatus").value = "";
      draw();
    });
    CRMUI.$("#roleAdd").addEventListener("click", () => CRMUI.toast("系统角色暂不支持新增"));
    CRMUI.$("#roleEdit").addEventListener("click", () => this.openSelectedRoleEdit());
    CRMUI.$("#roleDelete").addEventListener("click", () => this.deleteSelectedRoles());
    CRMUI.$("#roleExport").addEventListener("click", () => CRMUI.toast("角色列表导出任务已提交"));
    draw();
  },
  roleRows() {
    const keyword = (this.roleState?.query || "").toLowerCase();
    const status = this.roleState?.status || "";
    return (CRM_MOCK.roles || [])
      .filter(role => {
        const text = `${role.id} ${role.name} ${role.code} ${role.dataScope}`.toLowerCase();
        return text.includes(keyword) && (!status || role.status === status);
      })
      .sort((a, b) => Number(a.sort) - Number(b.sort));
  },
  roleDataScopeBadge(scope) {
    const color = {
      "全部数据权限": "green",
      "仅本人数据权限": "red",
      "负责站点数据权限": "blue",
      "授权站点数据权限": "amber"
    }[scope] || "gray";
    return `<span class="badge ${color}">${scope}</span>`;
  },
  roleStatusSwitch(role) {
    const on = role.status === "启用";
    const disabled = role.protected ? "disabled title='系统管理员不可停用'" : "";
    return `<button type="button" class="status-switch ${on ? "on" : ""}" data-role-toggle="${role.id}" ${disabled} aria-label="${on ? "启用" : "停用"}"></button>`;
  },
  renderSystemRolesTable() {
    const rows = this.roleRows();
    const selected = this.roleState.selected || new Set();
    CRMUI.$("#roleTable").innerHTML = CRMUI.table([
      {
        title: `<input type="checkbox" id="roleCheckAll" ${rows.length && rows.every(r => selected.has(String(r.id))) ? "checked" : ""}>`,
        render: role => `<input type="checkbox" data-role-check="${role.id}" ${selected.has(String(role.id)) ? "checked" : ""} ${role.protected ? "disabled title='系统管理员不可勾选删除'" : ""}>`
      },
      { title: "角色编号", render: role => role.id },
      { title: "角色名称", render: role => `<button type="button" class="role-name-link" data-role-view="${role.id}">${role.name}</button>` },
      { title: "权限字符", render: role => `<code>${role.code}</code>` },
      { title: "数据权限", render: role => this.roleDataScopeBadge(role.dataScope) },
      { title: "显示顺序", render: role => role.sort },
      { title: "角色状态", render: role => this.roleStatusSwitch(role) },
      { title: "创建时间", render: role => role.createdAt },
      {
        title: "操作",
        render: role => role.protected
          ? `<span class="muted">—</span>`
          : `<button class="btn" data-role-edit="${role.id}">编辑</button> <button class="btn danger" data-role-del="${role.id}">删除</button>`
      }
    ], rows, "暂无角色");
    CRMUI.$("#roleCheckAll")?.addEventListener("change", e => {
      this.roleState.selected = new Set();
      if (e.target.checked) {
        rows.filter(r => !r.protected).forEach(r => this.roleState.selected.add(String(r.id)));
      }
      this.renderSystemRolesTable();
    });
    CRMUI.$$("[data-role-check]").forEach(el => el.addEventListener("change", e => {
      if (e.target.checked) this.roleState.selected.add(el.dataset.roleCheck);
      else this.roleState.selected.delete(el.dataset.roleCheck);
    }));
    CRMUI.$$("[data-role-view]").forEach(btn => btn.addEventListener("click", () => this.openRoleModal(CRM_MOCK.roles.find(r => String(r.id) === btn.dataset.roleView), true)));
    CRMUI.$$("[data-role-edit]").forEach(btn => btn.addEventListener("click", () => this.openRoleModal(CRM_MOCK.roles.find(r => String(r.id) === btn.dataset.roleEdit))));
    CRMUI.$$("[data-role-del]").forEach(btn => btn.addEventListener("click", () => this.deleteRoleById(btn.dataset.roleDel)));
    CRMUI.$$("[data-role-toggle]").forEach(btn => btn.addEventListener("click", () => {
      const role = CRM_MOCK.roles.find(r => String(r.id) === btn.dataset.roleToggle);
      if (!role || role.protected) return CRMUI.toast("系统管理员不可停用");
      role.status = role.status === "启用" ? "停用" : "启用";
      CRMUI.toast(`角色已${role.status}`);
      this.renderSystemRolesTable();
    }));
  },
  openSelectedRoleEdit() {
    const ids = [...(this.roleState.selected || [])];
    if (!ids.length) return CRMUI.toast("请先勾选要修改的角色");
    if (ids.length > 1) return CRMUI.toast("一次仅可修改一个角色");
    const role = CRM_MOCK.roles.find(r => String(r.id) === ids[0]);
    if (!role) return;
    if (role.protected) return CRMUI.toast("系统管理员不可修改");
    this.openRoleModal(role);
  },
  deleteSelectedRoles() {
    const ids = [...(this.roleState.selected || [])];
    if (!ids.length) return CRMUI.toast("请先勾选要删除的角色");
    const targets = CRM_MOCK.roles.filter(r => ids.includes(String(r.id)));
    if (targets.some(r => r.protected || r.builtin)) return CRMUI.toast("系统内置角色不可删除");
    CRMUI.modal("删除角色", `<p>确认删除已选 ${targets.length} 个角色？</p>`, () => {
      CRM_MOCK.roles = CRM_MOCK.roles.filter(r => !ids.includes(String(r.id)));
      this.roleState.selected = new Set();
      CRMUI.closeModal();
      CRMUI.toast("角色已删除");
      this.renderSystemRolesTable();
    });
  },
  deleteRoleById(id) {
    const role = CRM_MOCK.roles.find(r => String(r.id) === String(id));
    if (!role) return;
    if (role.protected || role.builtin) return CRMUI.toast("系统内置角色不可删除");
    CRMUI.modal("删除角色", `<p>确认删除角色「${role.name}」？</p>`, () => {
      CRM_MOCK.roles = CRM_MOCK.roles.filter(r => String(r.id) !== String(id));
      this.roleState.selected?.delete(String(id));
      CRMUI.closeModal();
      CRMUI.toast("角色已删除");
      this.renderSystemRolesTable();
    });
  },
  openRoleModal(role, readonly = false) {
    if (!role) return;
    const locked = role.protected || readonly;
    const scopeOpts = ["全部数据权限", "负责站点数据权限", "仅本人数据权限", "授权站点数据权限"].map(v => ({ value: v, label: v }));
    CRMUI.modal(readonly ? "角色详情" : "修改角色", `
      <div class="form-grid">
        <div class="form-field"><label>角色编号</label><input value="${role.id}" disabled></div>
        ${CRMUI.formInput("角色名称", "name", role.name)}
        ${CRMUI.formInput("权限字符", "code", role.code)}
        ${CRMUI.formSelect("数据权限", "dataScope", scopeOpts, role.dataScope)}
        ${CRMUI.formInput("显示顺序", "sort", role.sort, "number")}
        <div class="form-field"><label>创建时间</label><input value="${role.createdAt}" disabled></div>
        ${locked ? `<div class="form-field full"><small class="muted">${role.protected ? "系统管理员为内置保护角色，不可降权/停用/删除。" : "当前为只读查看。"}</small></div>` : `<div class="form-field full"><small class="muted">系统内置角色仅支持维护名称、顺序和数据权限展示。</small></div>`}
      </div>
    `, form => {
      if (readonly) return CRMUI.closeModal();
      if (role.protected) return CRMUI.toast("系统管理员不可修改");
      const name = (form.get("name") || "").trim();
      const code = (form.get("code") || "").trim();
      if (!name) return CRMUI.toast("请输入角色名称");
      if (!code) return CRMUI.toast("请输入权限字符");
      role.name = name;
      role.code = code;
      role.dataScope = form.get("dataScope") || role.dataScope;
      role.sort = Number(form.get("sort") || role.sort) || role.sort;
      CRMUI.closeModal();
      CRMUI.toast("角色已保存");
      this.renderSystemRolesTable();
    });
    if (readonly || role.protected) {
      CRMUI.$$("#modalForm input:not([disabled]), #modalForm select").forEach(el => { el.disabled = true; });
      const submit = CRMUI.$("#modalForm button[type='submit']");
      if (submit) submit.textContent = "关闭";
    }
  },
  renderSystemDicts(root) {
    this.dictState = this.dictState || { activeDictCode: "followStage", keyword: "", status: "", expandedDomains: {} };
    this.dictState.root = root;
    const dicts = CRM_MOCK.dictionaries || [];
    if (!dicts.find(d => d.code === this.dictState.activeDictCode) && dicts.length) this.dictState.activeDictCode = dicts[0].code;
    dicts.forEach(dict => {
      const domain = dict.domain || "默认分类";
      if (this.dictState.expandedDomains[domain] === undefined) this.dictState.expandedDomains[domain] = true;
    });
    root.innerHTML = `
      <div class="dict-management-layout">
        <aside class="dict-tree-panel">
          <div class="dict-panel-head">
            <strong>字典分类</strong>
          </div>
          <div id="dictCategoryList"></div>
        </aside>
        <section class="dict-list-panel">
          <div class="dict-list-head">
            <strong id="dictActiveTitle"></strong>
          </div>
          <div class="list-toolbar">
            <div class="toolbar-actions">
              <button class="btn primary" id="dictItemAdd">新增</button>
            </div>
            <div class="toolbar-filters">
              <div class="dict-filter-bar search-filter">
                <label class="filter-item"><span>关键词</span><input id="dictItemSearch" placeholder="字典名称 / 字典编码"></label>
                <label class="filter-item"><span>状态</span><select id="dictItemStatus">
                  <option value="">全部状态</option>
                  <option value="启用">启用</option>
                  <option value="停用">停用</option>
                </select></label>
                <div class="filter-actions"><button class="btn primary" id="dictItemSearchBtn">查询</button><button class="btn" id="dictItemSearchReset">重置</button></div>
              </div>
            </div>
          </div>
          <div id="dictItemTable"></div>
        </section>
      </div>
    `;
    const groupedDicts = dicts.reduce((groups, dict) => {
      const domain = dict.domain || "默认分类";
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(dict);
      return groups;
    }, {});
    const drawCategories = () => {
      CRMUI.$("#dictCategoryList").innerHTML = Object.entries(groupedDicts).map(([domain, items]) => {
        const expanded = this.dictState.expandedDomains[domain] !== false;
        return `
          <div class="dict-tree-group">
            <button class="dict-tree-domain" data-dict-domain="${domain}" type="button">
              <span class="dict-tree-caret">${expanded ? "▾" : "▸"}</span>
              <span>${domain}</span>
            </button>
            <div class="dict-tree-children" ${expanded ? "" : "hidden"}>
              ${items.map(d => `
                <button class="dict-tree-node ${d.code === this.dictState.activeDictCode ? "active" : ""}" data-dict-code="${d.code}" type="button">
                  <span class="dict-tree-branch"></span>
                  <span class="dict-tree-main">${d.name}</span>
                </button>
              `).join("")}
            </div>
          </div>
        `;
      }).join("");
      CRMUI.$$("[data-dict-domain]").forEach(el => el.addEventListener("click", () => {
        this.dictState.expandedDomains[el.dataset.dictDomain] = this.dictState.expandedDomains[el.dataset.dictDomain] === false;
        drawCategories();
      }));
      CRMUI.$$("[data-dict-code]").forEach(el => el.addEventListener("click", () => {
        const treePanel = CRMUI.$(".dict-tree-panel");
        const treeScrollTop = treePanel ? treePanel.scrollTop : 0;
        this.dictState.activeDictCode = el.dataset.dictCode;
        this.dictState.keyword = "";
        this.dictState.status = "";
        CRMUI.$("#dictItemSearch").value = "";
        CRMUI.$("#dictItemStatus").value = "";
        drawCategories();
        drawItems();
        if (treePanel) requestAnimationFrame(() => { treePanel.scrollTop = treeScrollTop; });
      }));
    };
    const drawItems = () => {
      const dict = dicts.find(d => d.code === this.dictState.activeDictCode);
      if (!dict) { CRMUI.$("#dictItemTable").innerHTML = '<p class="muted">暂无字典</p>'; return; }
      CRMUI.$("#dictActiveTitle").textContent = dict.name;
      const extension = this.dictExtensionConfig(dict);
      const columns = [
        { title: "字典名称", render: item => item.name },
        { title: "字典编码", render: item => item.code },
        { title: "排序", render: item => item.sort },
        { title: extension.title, render: item => extension.render(item) },
        { title: "状态", render: item => CRMUI.badge(item.status) },
        { title: "创建时间", render: item => item.createdAt || item.updatedAt || "-" },
        { title: "操作", render: item => `<button class="btn" data-dict-item-edit="${item.id}">编辑</button> <button class="btn" data-dict-item-toggle="${item.id}">${item.status === "启用" ? "停用" : "启用"}</button> <button class="btn" data-dict-item-del="${item.id}">删除</button>` }
      ];
      const keyword = (this.dictState.keyword || "").toLowerCase();
      const status = this.dictState.status || "";
      const sortedItems = [...dict.items]
        .filter(item => `${item.name} ${item.code} ${item.status} ${item.remark || ""}`.toLowerCase().includes(keyword))
        .filter(item => !status || item.status === status)
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
      CRMUI.$("#dictItemTable").innerHTML = CRMUI.table(columns, sortedItems, "暂无字典项");
      CRMUI.$$("[data-dict-item-edit]").forEach(el => el.addEventListener("click", () => this.openDictItemModal(dict, el.dataset.dictItemEdit)));
      CRMUI.$$("[data-dict-item-toggle]").forEach(el => el.addEventListener("click", () => {
        const item = dict.items.find(i => i.id === el.dataset.dictItemToggle);
        if (item) { item.status = item.status === "启用" ? "停用" : "启用"; CRMUI.toast(`已${item.status}字典项「${item.name}」`); drawItems(); }
      }));
      CRMUI.$$("[data-dict-item-del]").forEach(el => el.addEventListener("click", () => {
        const item = dict.items.find(i => i.id === el.dataset.dictItemDel);
        if (!item) return;
        CRMUI.modal("删除字典项", `
          <p>确定删除字典项「<strong>${item.name}</strong>」吗？</p>
          <p class="muted">删除后不可恢复。</p>
        `, () => {
          const idx = dict.items.findIndex(i => i.id === item.id);
          if (idx >= 0) {
            const removed = dict.items.splice(idx, 1)[0];
            CRMUI.closeModal();
            CRMUI.toast(`已删除字典项「${removed.name}」`);
            drawItems();
            drawCategories();
          }
        });
      }));
    };
    CRMUI.$("#dictItemAdd").addEventListener("click", () => this.openDictItemModal(dicts.find(d => d.code === this.dictState.activeDictCode)));
    CRMUI.$("#dictItemSearch").value = this.dictState.keyword || "";
    CRMUI.$("#dictItemStatus").value = this.dictState.status || "";
    CRMUI.$("#dictItemSearchBtn").addEventListener("click", () => {
      this.dictState.keyword = CRMUI.$("#dictItemSearch").value;
      this.dictState.status = CRMUI.$("#dictItemStatus").value;
      drawItems();
    });
    CRMUI.$("#dictItemSearchReset").addEventListener("click", () => {
      this.dictState.keyword = "";
      this.dictState.status = "";
      CRMUI.$("#dictItemSearch").value = "";
      CRMUI.$("#dictItemStatus").value = "";
      drawItems();
    });
    drawCategories();
    drawItems();
  },
  dictExtensionConfig(dict) {
    if (dict.code === "followStage") return {
      title: "是否允许转客户",
      render: item => item.allowHighIntent ? '<span class="badge blue">是</span>' : "否"
    };
    if (dict.code === "customerLevel") return {
      title: "分级颜色",
      render: item => item.color ? `<span class="dict-color-dot" style="background:${item.color}"></span>${item.color}` : "-"
    };
    if (dict.code === "customerTag" || dict.code === "leadTag") return {
      title: "标签颜色",
      render: item => item.color ? `<span class="dict-color-dot" style="background:${item.color}"></span>${item.color}` : "-"
    };
    if (dict.code === "country") return {
      title: "国家编码",
      render: item => item.countryCode || item.isoCode || "-"
    };
    return {
      title: "扩展属性",
      render: () => "-"
    };
  },
  openDictItemModal(dict, itemId) {
    const isEdit = Boolean(itemId);
    const item = isEdit ? dict.items.find(i => i.id === itemId) : { name: "", code: "", sort: dict.items.length + 1, status: "启用", allowHighIntent: false };
    const isFollowStage = dict.code === "followStage";
    const hasColor = dict.code === "customerLevel" || dict.code === "customerTag" || dict.code === "leadTag";
    CRMUI.modal(isEdit ? "编辑字典项" : "新增字典项", `
      <div class="form-grid">
        <div class="form-field"><label>所属分类</label><input value="${dict.name}" readonly></div>
        ${CRMUI.formInput("字典名称", "name", item.name)}
        ${CRMUI.formInput("字典编码", "code", item.code)}
        ${CRMUI.formInput("排序", "sort", String(item.sort), "number")}
        ${CRMUI.formSelect("状态", "status", ["启用", "停用"].map(v => ({ value: v, label: v })), item.status)}
        ${isFollowStage ? `<div class="form-field"><label>是否允许转客户</label><select name="allowHighIntent"><option value="false" ${!item.allowHighIntent ? "selected" : ""}>否</option><option value="true" ${item.allowHighIntent ? "selected" : ""}>是</option></select></div>` : ""}
        ${hasColor ? `<div class="form-field"><label>${dict.code === "customerLevel" ? "分级颜色" : "标签颜色"}</label><input name="color" value="${item.color || ""}" placeholder="#2563eb"></div>` : ""}
      </div>`, form => {
      const name = (form.get("name") || "").trim();
      if (!name) return CRMUI.toast("请填写字典名称");
      if (!(form.get("code") || "").trim()) return CRMUI.toast("请填写字典编码");
      const code = (form.get("code") || "").trim() || name;
      const sort = Number(form.get("sort")) || (dict.items.length + 1);
      if (isEdit) {
        item.name = name; item.code = code; item.sort = sort; item.status = form.get("status");
        if (isFollowStage) item.allowHighIntent = form.get("allowHighIntent") === "true";
        if (hasColor) item.color = (form.get("color") || "").trim();
      } else {
        const newItem = { id: `${dict.code}${Date.now()}`, name, code, sort, status: form.get("status") };
        if (isFollowStage) newItem.allowHighIntent = form.get("allowHighIntent") === "true";
        if (hasColor) newItem.color = (form.get("color") || "").trim();
        dict.items.push(newItem);
      }
      CRMUI.closeModal();
      CRMUI.toast(isEdit ? "字典项已更新" : "字典项已新增");
      this.renderSystemDicts(this.dictState.root);
    });
  },
  // 系统日志：登录日志 / 操作日志 / 配置变更 三 Tab，分别使用登录时间 / 操作时间 / 变更时间筛选，默认近 7 天
  renderSystemLogs(root) {
    // 默认时间范围近 7 天
    const last7Days = this.last7DaysRange();
    this.logState = this.logState || { tab: "login", login: { query: "", loginTimeStart: last7Days.start, loginTimeEnd: last7Days.end }, operate: { query: "", operateTimeStart: last7Days.start, operateTimeEnd: last7Days.end }, change: { query: "", changeTimeStart: last7Days.start, changeTimeEnd: last7Days.end } };
    const tabs = [["login", "登录日志"], ["operate", "操作日志"]];
    root.innerHTML = `
      <div class="tabs" id="systemLogTabs">${tabs.map(t => `<div class="tab ${t[0] === this.logState.tab ? "active" : ""}" data-logtab="${t[0]}">${t[1]}</div>`).join("")}</div>
      <div id="systemLogBody"></div>
    `;
    CRMUI.$$("#systemLogTabs .tab").forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("#systemLogTabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      this.logState.tab = tab.dataset.logtab;
      this.renderSystemLogBody();
    }));
    this.renderSystemLogBody();
  },
  // 近 7 天日期范围（YYYY-MM-DD），用于系统日志默认时间范围
  last7DaysRange() {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    return { start, end };
  },
  logDateInRange(value, start, end) {
    if (!start && !end) return true;
    const date = String(value || "").slice(0, 10);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  },
  renderSystemLogBody() {
    const tab = this.logState.tab;
    const state = this.logState[tab];
    // 时间字段名按 Tab 区分：login→loginTime / operate→operateTime / change→changeTime
    const timeKey = tab === "login" ? "loginTime" : tab === "operate" ? "operateTime" : "changeTime";
    const timeLabel = tab === "login" ? "登录时间" : tab === "operate" ? "操作时间" : "变更时间";
    CRMUI.$("#systemLogBody").innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions"></div>
        <div class="toolbar-filters">
          <div class="filters card pad search-filter">
            <label class="filter-item"><span>关键词</span><input id="logQuery" value="${state.query}" placeholder="搜索关键词"></label>
            <label class="filter-item"><span>${timeLabel}</span><span class="range-picker"><input type="date" id="logTimeStart" value="${state[`${timeKey}Start`] || ""}"><span class="range-separator">-</span><input type="date" id="logTimeEnd" value="${state[`${timeKey}End`] || ""}"></span></label>
            <div class="filter-actions"><button class="btn" id="logQueryBtn">查询</button><button class="btn" id="logReset">重置</button></div>
          </div>
        </div>
      </div>
      <div id="systemLogTable"></div>
    `;
    CRMUI.$("#logQuery").addEventListener("input", e => { state.query = e.target.value.toLowerCase(); this.renderSystemLogTable(tab); });
    CRMUI.$("#logTimeStart").addEventListener("change", e => { state[`${timeKey}Start`] = e.target.value; this.renderSystemLogTable(tab); });
    CRMUI.$("#logTimeEnd").addEventListener("change", e => { state[`${timeKey}End`] = e.target.value; this.renderSystemLogTable(tab); });
    CRMUI.$("#logQueryBtn").addEventListener("click", () => this.renderSystemLogTable(tab));
    // 重置恢复该 Tab 默认时间范围（近 7 天），不改变当前 Tab
    CRMUI.$("#logReset").addEventListener("click", () => {
      const range = this.last7DaysRange();
      state.query = "";
      state[`${timeKey}Start`] = range.start;
      state[`${timeKey}End`] = range.end;
      this.renderSystemLogBody();
    });
    this.renderSystemLogTable(tab);
  },
  renderSystemLogTable(tab) {
    const state = this.logState[tab];
    const timeKey = tab === "login" ? "loginTime" : tab === "operate" ? "operateTime" : "changeTime";
    let columns, rows;
    if (tab === "login") {
      rows = (CRM_MOCK.loginLogs || []).filter(log => {
        const text = `${log.account} ${log.name} ${log.ip} ${log.method} ${log.result} ${log.browser} ${log.os}`.toLowerCase();
        return text.includes(state.query) && this.logDateInRange(log.loginTime, state.loginTimeStart, state.loginTimeEnd);
      });
      columns = [
        { title: "登录时间", render: log => log.loginTime },
        { title: "账号", render: log => log.account },
        { title: "姓名", render: log => log.name },
        { title: "IP", render: log => log.ip },
        { title: "方式", render: log => log.method },
        { title: "结果", render: log => log.result === "成功" ? '<span class="badge green">成功</span>' : '<span class="badge red">失败</span>' },
        { title: "浏览器", render: log => log.browser },
        { title: "操作系统", render: log => log.os }
      ];
    } else if (tab === "operate") {
      rows = (CRM_MOCK.operateLogs || []).filter(log => {
        const text = `${log.user} ${log.type} ${log.object} ${log.objectName} ${log.content} ${log.ip}`.toLowerCase();
        return text.includes(state.query) && this.logDateInRange(log.operateTime, state.operateTimeStart, state.operateTimeEnd);
      });
      columns = [
        { title: "操作时间", render: log => log.operateTime },
        { title: "操作人", render: log => log.user },
        { title: "操作类型", render: log => log.type },
        { title: "业务对象", render: log => log.object },
        { title: "对象名称", render: log => log.objectName },
        { title: "操作内容", render: log => log.content },
        { title: "IP", render: log => log.ip }
      ];
    } else {
      rows = (CRM_MOCK.configChangeLogs || []).filter(log => {
        const text = `${log.user} ${log.type} ${log.item} ${log.before} ${log.after} ${log.ip}`.toLowerCase();
        return text.includes(state.query) && this.logDateInRange(log.changeTime, state.changeTimeStart, state.changeTimeEnd);
      });
      columns = [
        { title: "变更时间", render: log => log.changeTime },
        { title: "操作人", render: log => log.user },
        { title: "变更类型", render: log => log.type },
        { title: "配置项", render: log => log.item },
        { title: "变更前", render: log => log.before },
        { title: "变更后", render: log => log.after },
        { title: "IP", render: log => log.ip }
      ];
    }
    CRMUI.$("#systemLogTable").innerHTML = CRMUI.table(columns, rows, "暂无日志记录");
  },
  // 系统参数：登录安全 / 密码设置 / 通用参数 / 业务规则 四 Tab，禁止单页堆全部参数（对齐 PRD §23.6）
  renderParamSettings(root) {
    this.paramState = this.paramState || { tab: "login" };
    const tabs = [
      ["login", "登录安全"],
      ["password", "密码设置"],
      ["general", "通用参数"],
      ["business", "业务规则"]
    ];
    root.innerHTML = `
      <div class="tabs" id="systemParamTabs">${tabs.map(t => `<div class="tab ${t[0] === this.paramState.tab ? "active" : ""}" data-param-tab="${t[0]}">${t[1]}</div>`).join("")}</div>
      <div id="systemParamBody"></div>
    `;
    CRMUI.$$("#systemParamTabs .tab").forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("#systemParamTabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      this.paramState.tab = tab.dataset.paramTab;
      this.renderParamSettingsBody();
    }));
    this.renderParamSettingsBody();
  },
  renderParamSettingsBody() {
    const tab = this.paramState.tab;
    const body = CRMUI.$("#systemParamBody");
    if (!body) return;
    // 仅展示当前可配置参数，未启用参数保留在 mock 数据中。
    const items = (CRM_MOCK.paramSettings || []).filter(item => !item.deferred);
    const byTab = {
      login: item => item.group === "login" || ["session_timeout", "login_fail_lock_threshold", "login_lock_duration", "single_login", "session_refresh_interval"].includes(item.code),
      password: item => item.group === "password" || ["password_min_length", "password_complexity", "first_login_change_password"].includes(item.code),
      general: item => item.group === "general" || ["list_page_size", "export_max_rows"].includes(item.code)
    };
    const redraw = () => this.renderParamSettingsBody();
    if (tab === "business") {
      body.innerHTML = `
        <div id="businessRuleSettingsTable"></div>
      `;
      const rules = (CRM_MOCK.businessRuleSettings || []).filter(item => !item.deferred);
      CRMUI.$("#businessRuleSettingsTable").innerHTML = CRMUI.table([
        { title: "规则", render: item => `<strong>${item.name}</strong>` },
        { title: "当前配置", render: item => item.value },
        { title: "说明", render: item => `<span class="muted">${item.desc}</span>` },
        { title: "生效时间", render: item => item.effect },
        { title: "操作", render: item => `<button class="btn" data-business-rule-edit="${item.id}">编辑</button>` }
      ], rules, "暂无业务规则");
      CRMUI.$$("[data-business-rule-edit]").forEach(el => el.addEventListener("click", () => this.openBusinessRuleModal(el.dataset.businessRuleEdit, redraw)));
      return;
    }
    const rows = items.filter(byTab[tab] || (() => false));
    body.innerHTML = `<div id="systemParamTable"></div>`;
    CRMUI.$("#systemParamTable").innerHTML = CRMUI.table([
      { title: "参数名称", render: item => `<strong>${item.name}</strong>` },
      { title: "参数键", render: item => `<code>${item.code}</code>` },
      { title: "当前值", render: item => item.value },
      { title: "说明", render: item => `<span class="muted">${item.desc}</span>` },
      { title: "生效时间", render: item => item.effect },
      { title: "操作", render: item => `<button class="btn" data-param-edit="${item.id}">编辑</button>` }
    ], rows, "暂无参数");
    CRMUI.$$("[data-param-edit]").forEach(el => el.addEventListener("click", () => this.openParamSettingModal(el.dataset.paramEdit, redraw)));
  },
  openParamSettingModal(itemId, redraw) {
    const item = (CRM_MOCK.paramSettings || []).find(i => i.id === itemId);
    if (!item) return;
    CRMUI.modal(`编辑参数 - ${item.name}`, `
      <div class="form-grid">
        <div class="form-field full"><label>参数键</label><input value="${item.code}" disabled></div>
        <div class="form-field full"><label>参数值</label><input name="value" value="${item.value}" required></div>
        <div class="form-field full"><label>说明</label><input value="${item.desc}" disabled></div>
        <div class="form-field full"><small class="muted">生效时间：${item.effect}</small></div>
      </div>`, form => {
      const value = (form.get("value") || "").trim();
      if (!value) return CRMUI.toast("请填写参数值");
      item.value = value;
      CRMUI.closeModal();
      CRMUI.toast(`参数「${item.name}」已保存，${item.effect}`);
      redraw();
    });
  },
  openBusinessRuleModal(itemId, redraw) {
    const item = (CRM_MOCK.businessRuleSettings || []).find(i => i.id === itemId);
    if (!item) return;
    CRMUI.modal(`编辑业务规则 - ${item.name}`, `
      <div class="form-grid">
        <div class="form-field full"><label>规则名称</label><input value="${item.name}" disabled></div>
        <div class="form-field full"><label>当前配置</label><input name="value" value="${item.value}" required></div>
        <div class="form-field full"><label>说明</label><input value="${item.desc}" disabled></div>
        <div class="form-field full"><small class="muted">生效时间：${item.effect}</small></div>
      </div>`, form => {
      const value = (form.get("value") || "").trim();
      if (!value) return CRMUI.toast("请填写配置值");
      item.value = value;
      CRMUI.closeModal();
      CRMUI.toast(`业务规则「${item.name}」已保存`);
      redraw();
    });
  }
};
