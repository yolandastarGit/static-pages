window.CRMAdminPage = {
  render(root, page, routeKey) {
    if (routeKey === "sites") return this.renderSites(root);
    if (routeKey === "notificationCenter") return this.renderNotificationCenter(root);
    if (routeKey === "systemCommunicationConfig") return this.renderCommunicationConfig(root);
    if (routeKey && routeKey.startsWith("system")) return this.renderSystemPage(root, routeKey);
    return this.renderAi(root);
  },
  renderAi(root) {
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="newAiProvider">新增配置</button>
      </div>
      <div class="section-title">AI 服务商列表</div>
      <div id="aiProviderTable"></div>
    `;
    this.renderAiProviderTable();
    CRMUI.$("#newAiProvider").addEventListener("click", () => this.openAiConfigModal());
  },
  renderAiProviderTable() {
    const providers = CRM_MOCK.aiProviders || [];
    CRMUI.$("#aiProviderTable").innerHTML = CRMUI.table([
      { title: "服务商名称", render: row => row.name },
      { title: "服务类型", render: row => row.type },
      { title: "默认模型", render: row => row.defaultModel },
      { title: "状态", render: row => CRMUI.badge(row.status) },
      { title: "更新时间", render: row => row.updatedAt },
      { title: "操作", render: row => `<button class="btn primary" data-ai-config="${row.id}">配置</button> <button class="btn" data-ai-delete="${row.id}">删除</button>` }
    ], providers, "暂无 AI 服务商配置");
    CRMUI.$$("[data-ai-config]").forEach(btn => btn.addEventListener("click", () => this.openAiConfigModal(CRM_MOCK.aiProviders.find(item => item.id === btn.dataset.aiConfig))));
    CRMUI.$$("[data-ai-delete]").forEach(btn => btn.addEventListener("click", () => this.openAiProviderDeleteModal(btn.dataset.aiDelete)));
  },
  aiConfigTemplate() {
    return JSON.parse(JSON.stringify(CRM_MOCK.aiConfig));
  },
  openAiConfigModal(provider) {
    const isEdit = Boolean(provider);
    const config = provider?.config || this.aiConfigTemplate();
    CRMUI.modal(isEdit ? `${provider.name} 配置` : "新增 AI 配置", `
      <div class="form-grid">
        ${CRMUI.formInput("服务商名称", "name", provider?.name || "")}
        ${CRMUI.formInput("服务类型", "type", provider?.type || "大语言模型")}
        ${CRMUI.formSelect("状态", "status", ["启用", "停用"].map(value => ({ value, label: value })), provider?.status || "启用")}
        ${CRMUI.formInput("API Key", "apiKey", config.api.apiKey)}
        ${CRMUI.formInput("Base URL", "baseUrl", config.api.baseUrl)}
        ${CRMUI.formInput("Model", "model", config.api.model)}
        ${CRMUI.formInput("Secret", "secret", config.api.secret)}
        ${CRMUI.formInput("Timeout（秒）", "timeout", config.api.timeout, "number")}
        ${CRMUI.formInput("Temperature", "temperature", config.api.temperature, "number")}
        ${CRMUI.formInput("Max Tokens", "maxTokens", config.api.maxTokens, "number")}
        ${CRMUI.formSelect("邮件分析", "mailAnalysis", ["开启", "关闭"].map(value => ({ value, label: value })), config.features.mailAnalysis)}
        ${CRMUI.formSelect("WhatsApp 会话分析", "whatsappAnalysis", ["开启", "关闭"].map(value => ({ value, label: value })), config.features.whatsappAnalysis)}
        ${CRMUI.formSelect("线索摘要生成", "leadSummary", ["开启", "关闭"].map(value => ({ value, label: value })), config.features.leadSummary)}
      </div>`, form => {
      if (!form.get("name") || !form.get("apiKey") || !form.get("baseUrl") || !form.get("model")) return CRMUI.toast("请完善服务商名称、API Key、Base URL 和 Model");
      const nextConfig = {
        api: {
          apiKey: form.get("apiKey"),
          baseUrl: form.get("baseUrl"),
          model: form.get("model"),
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
      nextProvider.name = form.get("name");
      nextProvider.type = form.get("type");
      nextProvider.defaultModel = nextConfig.api.model;
      nextProvider.status = form.get("status");
      nextProvider.updatedAt = "2026-07-03 17:40";
      nextProvider.config = nextConfig;
      if (!isEdit) CRM_MOCK.aiProviders.unshift(nextProvider);
      CRMUI.closeModal();
      CRMUI.toast(isEdit ? "AI 配置已保存" : "AI 配置已新增");
      this.renderAiProviderTable();
    });
  },
  openAiProviderDeleteModal(providerId) {
    const provider = CRM_MOCK.aiProviders.find(item => item.id === providerId);
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
        { title: "操作", render: s => `<button class="btn" data-site-edit="${s.id}">编辑</button> <button class="btn" data-site-config="${s.id}">配置</button> <button class="btn" data-site-toggle="${s.id}">${s.status === "启用" ? "停用" : "启用"}</button>` }
      ], rows);
      CRMUI.$$("[data-site-edit]").forEach(btn => btn.addEventListener("click", () => this.openSiteModal(CRM_MOCK.sites.find(s => s.id === btn.dataset.siteEdit), draw)));
      CRMUI.$$("[data-site-config]").forEach(btn => btn.addEventListener("click", () => this.openSiteConfigModal(CRM_MOCK.sites.find(s => s.id === btn.dataset.siteConfig), draw)));
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
  openSiteConfigModal(site, after) {
    site.config = site.config || { ai: "开启", publicPool: "开启", sync: "自动" };
    CRMUI.modal("站点配置", `
      <div class="form-grid">
        <div class="form-field"><label>站点名称</label><input value="${site.name}" disabled></div>
        ${CRMUI.formSelect("AI 识别", "ai", ["开启", "关闭"].map(v => ({ value: v, label: v })), site.config.ai)}
        ${CRMUI.formSelect("公海规则", "publicPool", ["开启", "关闭"].map(v => ({ value: v, label: v })), site.config.publicPool)}
        ${CRMUI.formSelect("同步方式", "sync", ["自动", "手动"].map(v => ({ value: v, label: v })), site.config.sync)}
      </div>`, form => {
      site.config.ai = form.get("ai");
      site.config.publicPool = form.get("publicPool");
      site.config.sync = form.get("sync");
      CRMUI.closeModal();
      CRMUI.toast("站点配置已保存");
      after();
    });
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
  renderNotificationCenter(root) {
    this.notificationState = { query: "" };
    root.innerHTML = `
      <div class="toolbar"><button class="btn primary" id="newNotificationRule">新增通知规则</button></div>
      <div class="filters card pad"><input id="notificationSearch" placeholder="搜索通知场景、渠道、对象"></div>
      <div id="notificationTable"></div>
    `;
    CRMUI.$("#newNotificationRule").addEventListener("click", () => this.openNotificationModal());
    CRMUI.$("#notificationSearch").addEventListener("input", e => {
      this.notificationState.query = e.target.value.toLowerCase();
      this.renderNotificationTable();
    });
    this.renderNotificationTable();
  },
  notificationRows() {
    const keyword = this.notificationState.query;
    return CRM_MOCK.notificationRules.filter(row => `${row.scene} ${row.channels.join(" ")} ${row.targets.join(" ")} ${row.status}`.toLowerCase().includes(keyword));
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
    CRMUI.modal(rule.id ? "编辑通知" : "新增通知规则", `
      <div class="form-grid">
        <div class="form-field"><label>通知场景</label><select name="scene">${CRM_MOCK.notificationScenes.map(scene => `<option value="${scene}" ${scene === rule.scene ? "selected" : ""}>${scene}</option>`).join("")}</select></div>
        ${CRMUI.formMultiSelect("通知渠道", "channels", CRM_MOCK.notificationChannels.map(item => ({ value: item, label: item })), rule.channels)}
        ${CRMUI.formMultiSelect("通知对象", "targets", targetOptions.map(item => ({ value: item, label: CRM_MOCK.notificationTargetOptions.includes(item) ? item : `${item}（已失效）` })), rule.targets)}
        ${CRMUI.formMultiSelect("指定用户", "userIds", userOptions, rule.userIds || [])}
        <div class="form-field full"><label>标题</label><input name="title" value="${rule.title}" required></div>
        <div class="form-field full"><label>正文</label><div class="rich-editor" contenteditable="true" data-field="body">${rule.body}</div><small class="muted">用于后续维护通知模板，支持富文本内容扩展。</small></div>
        <div class="form-field full"><label>状态</label><div class="radio-group">
          <label class="radio-card"><input type="radio" name="status" value="开启" ${rule.status === "开启" ? "checked" : ""}>开启</label>
          <label class="radio-card"><input type="radio" name="status" value="关闭" ${rule.status === "关闭" ? "checked" : ""}>关闭</label>
        </div></div>
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
    this.communicationState = { tab: q.tab === "whatsapp" ? "whatsapp" : "mail" };
    root.innerHTML = `
      <div class="tabs" id="communicationTabs">
        <div class="tab ${this.communicationState.tab === "mail" ? "active" : ""}" data-tab="mail">邮件服务配置</div>
        <div class="tab ${this.communicationState.tab === "whatsapp" ? "active" : ""}" data-tab="whatsapp">WhatsApp 服务配置</div>
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
    const isMail = this.communicationState.tab === "mail";
    isMail ? this.renderMailServiceConfig() : this.renderWhatsappServiceConfig();
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
              ${["MASTER_PASSWORD（子邮箱授权码）"].map(item => `<option value="${item}" ${item === config.authMode ? "selected" : ""}>${item}</option>`).join("")}
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
  renderWhatsappServiceConfig() {
    const config = CRM_MOCK.whatsappServiceConfig;
    CRMUI.$("#communicationTable").innerHTML = `
      <form class="mail-config-form" id="whatsappServiceForm">
        <section class="mail-config-section">
          <div class="mail-section-title"><span>基础配置</span></div>
          <div class="form-grid">
            ${CRMUI.formSelect("服务商（Provider）", "provider", ["Meta Cloud API", "第三方 BSP", "自定义 API"].map(value => ({ value, label: value })), config.provider)}
            ${CRMUI.formInput("Base URL", "baseUrl", config.baseUrl)}
            ${CRMUI.formInput("API Key", "apiKey", config.apiKey)}
            ${CRMUI.formInput("Access Token", "accessToken", config.accessToken, "password")}
            ${CRMUI.formInput("App ID", "appId", config.appId)}
            ${CRMUI.formInput("App Secret", "appSecret", config.appSecret, "password")}
            ${CRMUI.formInput("Business Account ID", "businessAccountId", config.businessAccountId)}
            ${CRMUI.formInput("Phone Number ID", "phoneNumberId", config.phoneNumberId)}
            ${CRMUI.formInput("Webhook URL", "webhookUrl", config.webhookUrl)}
            ${CRMUI.formInput("Webhook Verify Token", "webhookVerifyToken", config.webhookVerifyToken)}
            ${CRMUI.formInput("Callback 地址", "callbackUrl", config.callbackUrl)}
          </div>
        </section>
        <section class="mail-config-section">
          <div class="mail-section-title"><span>运行配置</span></div>
          <div class="form-grid">
            ${CRMUI.formInput("请求超时时间（Timeout）", "timeout", config.timeout, "number")}
            ${CRMUI.formInput("重试次数", "retryCount", config.retryCount, "number")}
            ${CRMUI.formSelect("是否启用", "enabled", [{ value: "true", label: "启用" }, { value: "false", label: "停用" }], String(Boolean(config.enabled)))}
            ${CRMUI.formInput("默认发送账号", "defaultSender", config.defaultSender)}
          </div>
        </section>
        <div class="mail-config-actions">
          <button class="btn primary" id="saveWhatsappService" type="submit">保存</button>
          <button class="btn" id="testWhatsappService" type="button">测试连接</button>
          <button class="btn" id="syncWhatsappService" type="button">同步</button>
        </div>
      </form>
    `;
    CRMUI.$("#whatsappServiceForm").addEventListener("submit", e => {
      e.preventDefault();
      this.saveWhatsappServiceConfig(new FormData(e.target));
    });
    CRMUI.$("#testWhatsappService").addEventListener("click", () => this.testWhatsappServiceConfig());
    CRMUI.$("#syncWhatsappService").addEventListener("click", () => this.syncWhatsappServiceConfig());
  },
  validateWhatsappServiceConfig(form) {
    const required = ["provider", "baseUrl", "apiKey", "accessToken", "webhookUrl", "webhookVerifyToken", "timeout", "retryCount"];
    const missing = required.find(name => !String(form.get(name) || "").trim());
    if (missing) {
      CRMUI.toast("请完善 WhatsApp 服务配置必填项");
      return false;
    }
    return true;
  },
  saveWhatsappServiceConfig(form) {
    if (!this.validateWhatsappServiceConfig(form)) return;
    Object.assign(CRM_MOCK.whatsappServiceConfig, {
      provider: form.get("provider"),
      baseUrl: form.get("baseUrl"),
      apiKey: form.get("apiKey"),
      accessToken: form.get("accessToken"),
      appId: form.get("appId"),
      appSecret: form.get("appSecret"),
      businessAccountId: form.get("businessAccountId"),
      phoneNumberId: form.get("phoneNumberId"),
      webhookUrl: form.get("webhookUrl"),
      webhookVerifyToken: form.get("webhookVerifyToken"),
      callbackUrl: form.get("callbackUrl"),
      timeout: Number(form.get("timeout")),
      retryCount: Number(form.get("retryCount")),
      enabled: form.get("enabled") === "true",
      defaultSender: form.get("defaultSender")
    });
    CRMUI.toast("WhatsApp 服务配置已保存");
  },
  testWhatsappServiceConfig() {
    const form = new FormData(CRMUI.$("#whatsappServiceForm"));
    if (!this.validateWhatsappServiceConfig(form)) return;
    const button = CRMUI.$("#testWhatsappService");
    button.disabled = true;
    button.textContent = "测试中";
    setTimeout(() => {
      button.disabled = false;
      button.textContent = "测试连接";
      CRMUI.toast("WhatsApp 服务连接测试通过");
    }, 700);
  },
  syncWhatsappServiceConfig() {
    const form = new FormData(CRMUI.$("#whatsappServiceForm"));
    if (!this.validateWhatsappServiceConfig(form)) return;
    const button = CRMUI.$("#syncWhatsappService");
    button.disabled = true;
    button.textContent = "同步中";
    setTimeout(() => {
      button.disabled = false;
      button.textContent = "同步";
      CRMUI.toast("WhatsApp 服务配置同步完成");
    }, 700);
  },
  renderEmailAccountTable() {
    const keyword = this.communicationState.query;
    const rows = (CRM_MOCK.emailAccounts || []).filter(account => `${account.email} ${account.provider} ${account.status} ${account.displayName}`.toLowerCase().includes(keyword));
    CRMUI.$("#communicationTable").innerHTML = CRMUI.table([
      { title: "邮箱账号", render: row => `<strong>${row.email}</strong><div class="small muted">${row.displayName}</div>` },
      { title: "邮箱服务商", render: row => row.provider },
      { title: "SMTP/IMAP 状态", render: row => `<span class="badge gray">SMTP ${row.smtpStatus}</span> <span class="badge gray">IMAP ${row.imapStatus}</span>` },
      { title: "默认账号", render: row => row.isDefault ? CRMUI.badge("开启") : `<span class="badge gray">否</span>` },
      { title: "状态", render: row => CRMUI.badge(row.status) },
      { title: "创建时间", render: row => row.createdAt },
      { title: "操作", render: row => `<button class="btn" data-mail-edit="${row.id}">编辑</button> <button class="btn" data-mail-verify="${row.id}">重新验证</button> <button class="btn" data-mail-toggle="${row.id}">${row.status === "启用" ? "停用" : "启用"}</button> ${row.isDefault ? "" : `<button class="btn" data-mail-default="${row.id}">设为默认</button>`} <button class="btn" data-mail-delete="${row.id}">删除</button>` }
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
    const row = account || { email: "", displayName: "", provider: "自定义邮箱", imapHost: "", imapPort: "993", imapSsl: "开启", imapUser: "", imapPassword: "", smtpHost: "", smtpPort: "465", smtpSsl: "开启", smtpUser: "", smtpPassword: "", isDefault: false, status: "启用" };
    CRMUI.modal(account ? "编辑邮箱" : "新增邮箱", `
      ${this.connectionSteps(account ? 1 : 0)}
      <input type="hidden" name="tested" value="${account ? "true" : "false"}">
      <div class="form-grid">
        ${CRMUI.formInput("邮箱地址", "email", row.email)}
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
    if (!form.get("email") || !form.get("imapHost") || !form.get("smtpHost")) return CRMUI.toast("请完善邮箱地址、IMAP Host 和 SMTP Host");
    const target = account || { id: `mail${Date.now()}`, createdAt: "2026-07-03 17:50" };
    Object.assign(target, {
      email: form.get("email"),
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
  renderSystemPage(root, routeKey) {
    const title = CRMRouter.titles[routeKey];
    const rows = {
      systemUsers: CRM_MOCK.users.map(u => ({ a: u.name, b: u.role, c: u.status, d: u.siteIds.map(CRMUI.siteName).join("、") })),
      systemRoles: [{ a: "业务员", b: "sales", c: "仅本人", d: "启用" }, { a: "销售主管", b: "supervisor", c: "本团队", d: "启用" }, { a: "管理员", b: "admin", c: "全部", d: "启用" }],
      systemMenus: this.flattenMenuRows(),
      systemDicts: [{ a: "线索状态", b: "高意向", c: "启用", d: "线索域" }, { a: "合同状态", b: "执行中", c: "启用", d: "合同域" }],
      systemParams: [{ a: "有效询盘自动入池", b: "开启", c: "业务规则", d: "立即生效" }, { a: "未跟进自动回收天数", b: "14 天", c: "业务规则", d: "立即生效" }],
      systemLogs: [{ a: "2026-07-02 10:12:09", b: "管理员", c: "配置", d: "更新站点规则" }, { a: "2026-07-02 09:20:11", b: "Chen Hao", c: "新增", d: "录入跟进记录" }]
    }[routeKey] || [];
    root.innerHTML = `
      <div class="toolbar">
        <button class="btn primary" id="systemEdit">编辑</button>
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
    draw();
  },
  flattenMenuRows() {
    const rows = [];
    CRMLayout.menu.forEach(item => {
      rows.push({ a: item.label, b: item.key || item.label, c: "启用", d: item.children ? "一级菜单" : "菜单" });
      (item.children || []).forEach(child => rows.push({ a: child.label, b: child.key, c: "启用", d: "二级菜单" }));
    });
    return rows;
  }
};
