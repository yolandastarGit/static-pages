window.CRMCommunicationPage = {
  render(root, page, routeKey) {
    if (page === "email" && routeKey === "emailCompose") {
      this.renderComposeMailPage(root);
      return;
    }
    page === "email" ? this.renderEmail(root) : this.renderWhatsApp(root);
  },
  renderEmail(root) {
    this.mailRoot = root;
    this.mailState = { folder: "inbox", selected: CRM_MOCK.emails[0].id, mailbox: "", query: "", mailTimeStart: "", mailTimeEnd: "", batchSelected: new Set() };
    const mailboxOptions = (CRM_MOCK.mailboxes || []).map(mailbox => `<option value="${mailbox}">${mailbox}（${CRMUI.siteName(this.mailboxSiteId(mailbox))}）</option>`).join("");
    root.innerHTML = `
      <div class="tabs" id="mailTabs">
        ${[["inbox", "收件箱"], ["sent", "已发送"], ["draft", "草稿箱"], ["trash", "垃圾箱"]].map(t => `<div class="tab ${t[0] === "inbox" ? "active" : ""}" data-folder="${t[0]}">${t[1]} <span class="badge gray">${this.folderCount(t[0])}</span></div>`).join("")}
      </div>
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn primary" id="composeMail">写邮件</button>
          <button class="btn" id="batchReadMail">批量标记已读</button>
          <button class="btn" id="batchAi">批量 AI 提炼</button>
          <button class="btn" id="batchDeleteMail" hidden>批量删除</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters search-filter">
            <label class="filter-item"><span>邮箱</span><select id="mailbox"><option value="">全部邮箱</option>${mailboxOptions}</select></label>
            <label class="filter-item"><span>关键词</span><input id="mailSearch" placeholder="搜索主题、发件人、正文"></label>
            <label class="filter-item"><span>邮件时间</span><span class="range-picker"><input type="date" id="mailTimeStart" value="${this.mailState.mailTimeStart}"><span class="range-separator">-</span><input type="date" id="mailTimeEnd" value="${this.mailState.mailTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="mailQuery">查询</button><button class="btn" id="mailReset">重置</button></div>
          </div>
        </div>
      </div>
      <div class="split">
        <div class="card" id="mailList"></div>
        <div class="card pad" id="mailBody"></div>
        <div class="card pad" id="mailAi"></div>
      </div>
    `;
    CRMUI.$$(".tab").forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      this.mailState.folder = tab.dataset.folder;
      this.renderMailList();
    }));
    CRMUI.$("#mailSearch").addEventListener("input", e => {
      const value = e.target.value.toLowerCase();
      clearTimeout(this._mailSearchTimer);
      this._mailSearchTimer = setTimeout(() => {
        this.mailState.query = value;
        this.renderMailList();
      }, 300);
    });
    CRMUI.$("#mailbox").addEventListener("change", e => {
      this.mailState.mailbox = e.target.value;
      this.renderMailList();
    });
    CRMUI.$("#mailTimeStart").addEventListener("change", e => { this.mailState.mailTimeStart = e.target.value; this.renderMailList(); });
    CRMUI.$("#mailTimeEnd").addEventListener("change", e => { this.mailState.mailTimeEnd = e.target.value; this.renderMailList(); });
    CRMUI.$("#mailQuery").addEventListener("click", () => this.renderMailList());
    CRMUI.$("#mailReset").addEventListener("click", () => {
      this.mailState.query = "";
      this.mailState.mailbox = "";
      this.mailState.mailTimeStart = "";
      this.mailState.mailTimeEnd = "";
      CRMUI.$("#mailSearch").value = "";
      CRMUI.$("#mailbox").value = "";
      CRMUI.$("#mailTimeStart").value = "";
      CRMUI.$("#mailTimeEnd").value = "";
      this.renderMailList();
    });
    CRMUI.$("#batchAi").addEventListener("click", () => this.openBatchAiModal());
    CRMUI.$("#composeMail").addEventListener("click", () => this.openComposeMailPage({
      mode: "compose",
      mailbox: this.mailState.mailbox || ""
    }));
    CRMUI.$("#batchReadMail").addEventListener("click", () => this.markSelectedMailsRead());
    CRMUI.$("#batchDeleteMail").addEventListener("click", () => this.openBatchDeleteMailModal());
    this.renderMailList();
  },
  folderCount(folder) {
    return CRM_MOCK.emails.filter(mail => mail.folder === folder).length;
  },
  getFilteredMails() {
    const start = this.mailState.mailTimeStart || "";
    const end = this.mailState.mailTimeEnd || "";
    const mailbox = this.mailState.mailbox || "";
    if (start && end && start > end) return [];
    return CRM_MOCK.emails.filter(mail => {
      const byFolder = mail.folder === this.mailState.folder;
      const byMailbox = !mailbox || mail.mailbox === mailbox;
      const text = `${mail.from} ${mail.subject} ${mail.body}`.toLowerCase();
      // 邮件时间：按文件夹语义均取 mail.time（收件/发送/最后保存/原邮件时间），按日期粒度比较
      const mailDate = String(mail.time || "").slice(0, 10);
      const byStart = !start || mailDate >= start;
      const byEnd = !end || mailDate <= end;
      return byFolder && byMailbox && byStart && byEnd && text.includes(this.mailState.query);
    });
  },
  mailboxSiteId(mailbox) {
    const siteBound = (CRM_MOCK.sites || []).find(site => site.boundEmail === mailbox);
    const currentPersonal = (CRM_MOCK.personalEmailAccounts || []).find(account => account.userId === CRM_MOCK.currentUser.id && account.email === mailbox);
    const systemAccount = (CRM_MOCK.emailAccounts || []).find(account => account.email === mailbox);
    return siteBound?.id || currentPersonal?.siteId || systemAccount?.siteId || "";
  },
  isSiteMainMailbox(mailbox) {
    return Boolean((CRM_MOCK.sites || []).find(site => site.boundEmail === mailbox));
  },
  mailboxOwnerId(mailbox) {
    const siteBound = (CRM_MOCK.sites || []).find(site => site.boundEmail === mailbox);
    const personal = (CRM_MOCK.personalEmailAccounts || []).find(account => account.email === mailbox);
    return siteBound?.boundEmailOwnerId || personal?.userId || CRM_MOCK.currentUser.id;
  },
  mailSiteId(mail) {
    return this.mailboxSiteId(mail.mailbox) || mail.siteId || "";
  },
  renderMailList() {
    const mails = this.getFilteredMails();
    if (!mails.find(m => m.id === this.mailState.selected)) this.mailState.selected = mails[0]?.id;
    CRMUI.$("#mailList").innerHTML = mails.length ? mails.map(mail => `
      <div class="list-item ${mail.id === this.mailState.selected ? "active" : ""}" data-mail="${mail.id}">
        <label class="mail-checkline" title="选择邮件">
          <input type="checkbox" data-mail-check="${mail.id}" ${this.mailState.batchSelected.has(mail.id) ? "checked" : ""}>
        </label>
        <div class="mail-list-main">
          <strong>${mail.read ? mail.senderName : "● " + mail.senderName}</strong>
          <div>${mail.subject}</div>
          <div class="small muted">${mail.summary}</div>
          <div class="small muted">${mail.time}</div>
        </div>
      </div>
    `).join("") : `<div class="pad muted">当前条件下没有邮件</div>`;
    CRMUI.$$("[data-mail]").forEach(el => el.addEventListener("click", () => {
      this.mailState.selected = el.dataset.mail;
      const mail = CRM_MOCK.emails.find(m => m.id === this.mailState.selected);
      mail.read = true;
      this.renderMailList();
    }));
    CRMUI.$$("[data-mail-check]").forEach(el => {
      el.addEventListener("click", e => e.stopPropagation());
      el.addEventListener("change", () => {
        el.checked ? this.mailState.batchSelected.add(el.dataset.mailCheck) : this.mailState.batchSelected.delete(el.dataset.mailCheck);
        this.updateMailBatchActions();
      });
    });
    this.updateMailBatchActions();
    this.renderMailDetail();
  },
  renderMailDetail() {
    const mail = CRM_MOCK.emails.find(m => m.id === this.mailState.selected);
    if (!mail) {
      CRMUI.$("#mailBody").innerHTML = `<div class="muted">请选择一封邮件</div>`;
      CRMUI.$("#mailAi").innerHTML = "";
      return;
    }
    CRMUI.$("#mailBody").innerHTML = `
      <div class="detail-title">${mail.subject}</div>
      <p class="muted">${mail.from} → ${mail.mailbox}</p>
      <p class="muted">${mail.time} · 站点：${this.mailSiteId(mail) ? CRMUI.siteName(this.mailSiteId(mail)) : `<span class="badge red">未识别</span>`}</p>
      <div style="line-height:1.8;margin:18px 0">${mail.body}</div>
      <div>${mail.attachments.map(a => `<span class="badge gray">${a}</span>`).join(" ") || `<span class="muted">无附件</span>`}</div>
      <div class="toolbar" style="margin-top:18px">
        ${this.mailState.folder === "trash" ? `
          <button class="btn primary" id="restoreMail">恢复</button>
          <button class="btn danger" id="purgeMail">永久删除</button>
        ` : `
          <button class="btn primary" id="generateLead">${mail.leadId ? "查看线索" : "生成线索"}</button>
          ${CRM_MOCK.currentUser.role === "运营专员" && this.isSiteMainMailbox(mail.mailbox) ? `<button class="btn" id="transferMailToSales">转派给业务员</button>` : ""}
          <button class="btn" id="replyMail">回复</button>
          <button class="btn" id="forwardMail">转发</button>
          <button class="btn danger" id="deleteMailDetail">删除</button>
        `}
      </div>
    `;
    const profile = this.companyProfileForMail(mail);
    CRMUI.$("#mailAi").innerHTML = `
      <div class="card-title">AI 智能分析</div>
      ${this.renderCommunicationAiPanel({
        summaryTitle: "邮件摘要",
        summary: mail.aiSummary,
        profile,
        tags: mail.aiTags,
        recommendation: profile?.aiRecommendation || "建议结合邮件内容、企业资料和历史 CRM 记录确认客户价值，并安排下一步跟进。",
        warning: mail.siteId ? "未发现明显安全风险。" : "站点未识别，生成线索前需手动选择。"
      })}
      <button class="btn" id="copyAi">复制总结</button>
    `;
    CRMUI.$("#copyAi").addEventListener("click", () => CRMUI.toast("AI 总结已复制"));
    if (this.mailState.folder === "trash") {
      CRMUI.$("#restoreMail").addEventListener("click", () => this.restoreMails([mail.id]));
      CRMUI.$("#purgeMail").addEventListener("click", () => this.openPurgeMailModal([mail.id]));
      return;
    }
    CRMUI.$("#generateLead").addEventListener("click", () => {
      if (mail.leadId) CRMRouter.goto("leadDetail", { id: mail.leadId });
      else this.openGenerateLeadModal(mail);
    });
    CRMUI.$("#transferMailToSales")?.addEventListener("click", () => this.openMailTransferModal(mail));
    CRMUI.$("#replyMail").addEventListener("click", () => this.openComposeMailPage({ mode: "reply", mailId: mail.id, mailbox: mail.mailbox || "" }));
    CRMUI.$("#forwardMail").addEventListener("click", () => this.openComposeMailPage({ mode: "forward", mailId: mail.id, mailbox: mail.mailbox || "" }));
    CRMUI.$("#deleteMailDetail").addEventListener("click", () => this.openDeleteMailModal(mail.id));
  },
  openMailTransferModal(mail) {
    const me = CRM_MOCK.currentUser;
    if (me.role !== "运营专员") return CRMUI.toast("仅运营专员可转派站点主邮箱邮件");
    if (!this.isSiteMainMailbox(mail.mailbox)) return CRMUI.toast("仅站点主邮箱支持转派给业务员");
    const siteId = this.mailSiteId(mail);
    const sales = CRM_MOCK.users.filter(user => {
      if (user.role !== "业务员" || user.status !== "启用") return false;
      if (!siteId) return true;
      return (user.siteIds || []).includes(siteId);
    });
    if (!sales.length) return CRMUI.toast("本站点暂无可用业务员");
    const senderEmail = (mail.from.match(/<(.+)>/)?.[1] || mail.from || "").trim().toLowerCase();
    const linkedLead = mail.leadId ? CRM_MOCK.leads.find(item => item.id === mail.leadId) : null;
    const matchedLead = !linkedLead ? (CRM_MOCK.leads || []).find(lead => {
      if (!siteId || lead.siteId !== siteId) return false;
      if (["无效", "丢失"].includes(lead.status)) return false;
      return String(lead.email || "").trim().toLowerCase() === senderEmail && senderEmail;
    }) : null;
    const linkedOwner = linkedLead ? CRM_MOCK.users.find(u => u.id === linkedLead.ownerId) : null;
    const matchedOwner = matchedLead ? CRM_MOCK.users.find(u => u.id === matchedLead.ownerId) : null;
    const isSalesOwner = owner => owner && owner.role === "业务员";
    let rule = "T3";
    let tip = "当前邮件未关联线索：仅投递邮件，不新建线索、不自动挂旧线索。";
    let lockOwnerId = "";
    let defaultOwnerId = sales[0]?.id || "";
    if (linkedLead && isSalesOwner(linkedOwner)) {
      rule = "T2";
      lockOwnerId = linkedOwner.id;
      defaultOwnerId = linkedOwner.id;
      tip = `T2：邮件已关联线索，负责人为 ${linkedOwner.name}，仅可转派给本人。`;
    } else if (linkedLead && linkedLead.ownerId === me.id) {
      rule = "T1";
      tip = "T1：邮件已关联线索且负责人为当前运营，可选业务员并变更负责人。";
    } else if (linkedLead) {
      return CRMUI.toast("当前线索负责人不是您，无法按 T1 转派；若负责人为业务员请走 T2 场景");
    } else if (matchedLead && isSalesOwner(matchedOwner)) {
      rule = "T3";
      defaultOwnerId = matchedOwner.id;
      tip = `T3：未关联线索；同发件人已有线索负责人 ${matchedOwner.name}（默认选中，可改；不自动合并线索）。`;
    }
    const ownerSelect = lockOwnerId
      ? `<div class="form-field"><label>目标业务员</label><input value="${linkedOwner.name}" disabled><input type="hidden" name="ownerId" value="${lockOwnerId}"><small class="muted">${tip}</small></div>`
      : `<div class="form-field"><label>目标业务员</label><select name="ownerId">${sales.map(user => `<option value="${user.id}" ${user.id === defaultOwnerId ? "selected" : ""}>${user.name}</option>`).join("")}</select><small class="muted">${tip}</small></div>`;
    CRMUI.modal(`转派给业务员（${rule}）`, `
      <div class="form-grid">
        <div class="form-field"><label>邮件主题</label><input value="${mail.subject}" disabled></div>
        ${ownerSelect}
        <div class="form-field full"><label>转派备注</label><textarea name="note"></textarea></div>
      </div>`, form => {
      const ownerId = form.get("ownerId");
      if (!ownerId) return CRMUI.toast("请选择目标业务员");
      if (lockOwnerId && ownerId !== lockOwnerId) return CRMUI.toast("该邮件已关联线索，仅可转派给原负责人");
      mail.transferredTo = ownerId;
      mail.transferSource = "转派";
      if (linkedLead) {
        linkedLead.ownerId = ownerId;
        CRMUI.toast(rule === "T2" ? `已投递至 ${linkedOwner.name}（负责人不变）` : "已投递，线索负责人已变更");
      } else {
        CRMUI.toast("已投递邮件（未建线索、未挂旧线索）");
      }
      CRMUI.closeModal();
      this.renderMailDetail();
    });
  },
  channelOptions(defaultChannel = "邮件") {
    const channels = ["邮件", "官网询盘", "自然询盘", "WhatsApp", "展会", "客户转介绍", "其他"];
    return channels.map(name => ({ value: name, label: name }));
  },
  ownerOptions(defaultOwnerId = "") {
    return (CRM_MOCK.users || [])
      .filter(user => ["业务员", "运营专员", "系统管理员"].includes(user.role) && user.status === "启用")
      .map(user => ({ value: user.id, label: `${user.name}（${user.role}）` }));
  },
  customerOptions(siteId = "") {
    const rows = (CRM_MOCK.customers || []).filter(c => !siteId || c.siteId === siteId);
    return [{ value: "", label: "不选择 / 输入新企业名称" }, ...rows.map(c => ({ value: c.id, label: c.name }))];
  },
  siteOptions(defaultSiteId = "") {
    return (CRM_MOCK.sites || []).map(s => ({ value: s.id, label: s.name }));
  },
  hasAiPrefill(source = {}) {
    return Boolean(source.aiSummary || (source.aiTags && source.aiTags.length) || source.aiIntentProduct);
  },
  openGenerateLeadModal(mail) {
    const me = CRM_MOCK.currentUser;
    const defaultSiteId = this.mailSiteId(mail) || me.siteIds?.[0] || "";
    const aiOk = this.hasAiPrefill(mail);
    const email = aiOk ? (mail.from.match(/<(.+)>/)?.[1] || "") : "";
    const contact = aiOk ? (mail.senderName || "") : "";
    const company = aiOk && mail.senderName && !String(mail.senderName).includes("Unknown") ? mail.senderName : "";
    const products = aiOk ? (mail.aiIntentProduct || (mail.aiTags || []).slice(0, 2).join("、") || "") : "";
    const tagSeed = aiOk ? (mail.aiTags || []) : [];
    const matchedCustomer = (CRM_MOCK.customers || []).find(c => c.siteId === defaultSiteId && c.name === company);
    CRMUI.modal("确认生成线索", `
      <div class="form-grid">
        ${CRMUI.formSelect("选择已有客户", "customerId", this.customerOptions(defaultSiteId), matchedCustomer?.id || "")}
        ${CRMUI.formInput("企业名称（所属企业）", "company", matchedCustomer?.name || company)}
        ${CRMUI.formInput("询盘联系人", "contact", contact)}
        ${CRMUI.formInput("邮箱", "email", email)}
        ${CRMUI.formInput("电话", "phone", aiOk ? (mail.phone || "") : "")}
        ${CRMUI.formInput("WhatsApp", "whatsapp", aiOk ? (mail.whatsapp || "") : "")}
        ${CRMUI.formSelect("站点", "siteId", this.siteOptions(defaultSiteId), defaultSiteId)}
        ${CRMUI.formSelect("来源渠道", "channel", this.channelOptions("邮件"), "邮件")}
        ${CRMUI.formSelect("负责人", "ownerId", this.ownerOptions(me.id), me.id)}
        ${CRMUI.formInput("意向产品", "products", products)}
        ${CRMUI.formMultiSelect("线索标签", "tags", (CRM_MOCK.dictionaries.find(d => d.code === "leadTag")?.items || []).map(i => ({ value: i.name, label: i.name })), tagSeed)}
        ${CRMUI.formMultiSelect("关注点", "focusPoints", (CRM_MOCK.dictionaries.find(d => d.code === "customerFocus")?.items || []).filter(i => i.status !== "停用").map(i => ({ value: i.name, label: i.displayGroup ? `${i.displayGroup} / ${i.name}` : i.name })), [])}
        <div class="form-field full"><label>备注</label><textarea name="remark"></textarea></div>
        <div class="form-field full"><small class="muted">${aiOk ? "已按 AI/消息信息预填，可修改。" : "AI 不可用或无分析结果：业务字段未预填，请手动填写；站点/来源/负责人已默认带入。"}</small></div>
      </div>`, form => {
      const contactName = (form.get("contact") || "").trim();
      const mailAddr = (form.get("email") || "").trim();
      const phone = (form.get("phone") || "").trim();
      const whatsapp = (form.get("whatsapp") || "").trim();
      if (!contactName) return CRMUI.toast("请填写询盘联系人");
      if (!mailAddr && !phone && !whatsapp) return CRMUI.toast("邮箱、电话、WhatsApp 至少填写一项");
      if (!form.get("siteId")) return CRMUI.toast("请选择站点");
      if (!form.get("ownerId")) return CRMUI.toast("请选择负责人");
      const customerId = form.get("customerId") || "";
      const customer = customerId ? CRM_MOCK.customers.find(c => c.id === customerId) : null;
      const companyName = (form.get("company") || customer?.name || "").trim();
      const lead = {
        id: `l${Date.now()}`,
        no: `LEAD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        company: companyName || contactName,
        contact: contactName,
        email: mailAddr,
        phone,
        whatsapp,
        siteId: form.get("siteId"),
        channel: form.get("channel") || "邮件",
        ownerId: form.get("ownerId"),
        status: "待跟进",
        stage: "待首响",
        products: String(form.get("products") || "").split(/[、,，]/).map(v => v.trim()).filter(Boolean),
        purchaseIntent: "",
        aiTags: mail.aiTags || [],
        manualTags: form.getAll("tags"),
        focusPoints: form.getAll("focusPoints"),
        remark: form.get("remark") || "",
        createdAt: "2026-07-02 12:00",
        lastFollowAt: "",
        nextFollowAt: "",
        customerId: customerId || "",
        aiSummary: mail.aiSummary || "",
        sourceType: "消息侧人工生成"
      };
      CRM_MOCK.leads.unshift(lead);
      mail.leadId = lead.id;
      mail.siteId = form.get("siteId");
      CRMUI.closeModal();
      CRMUI.toast("线索已生成");
      this.renderMailDetail();
    });
  },
  openComposeMailPage(params = {}) {
    CRMRouter.goto("emailCompose", params);
  },
  renderComposeMailPage(root) {
    const params = this.currentRouteParams();
    const sourceMail = params.mailId ? CRM_MOCK.emails.find(mail => mail.id === params.mailId) : null;
    const isReply = params.mode === "reply" && sourceMail;
    const isForward = params.mode === "forward" && sourceMail;
    const lockFrom = Boolean(isReply || isForward);
    const mailboxes = CRM_MOCK.mailboxes || [];
    const lockedMailbox = sourceMail?.mailbox || params.mailbox || mailboxes[0] || "";
    const preferredMailbox = params.mailbox && mailboxes.includes(params.mailbox)
      ? params.mailbox
      : (mailboxes[0] || "");
    const fromMailbox = lockFrom ? lockedMailbox : preferredMailbox;
    const subject = isReply ? `Re: ${sourceMail.subject.replace(/^Re:\s*/i, "")}` : isForward ? `Fwd: ${sourceMail.subject.replace(/^Fwd:\s*/i, "")}` : "";
    const to = isReply ? sourceMail.from : "";
    const bodyHtml = isForward
      ? `<p></p><hr><p><strong>---------- 转发邮件 ----------</strong><br>发件人：${this.escapeHtml(sourceMail.from)}<br>时间：${this.escapeHtml(sourceMail.time)}<br>主题：${this.escapeHtml(sourceMail.subject)}</p><p>${this.escapeHtml(sourceMail.body).replace(/\n/g, "<br>")}</p>`
      : "<p><br></p>";
    const fonts = ["默认字体", "宋体", "微软雅黑", "Arial", "Georgia", "Verdana"];
    const sizes = [
      { label: "字号", value: "3" },
      { label: "小", value: "2" },
      { label: "正常", value: "3" },
      { label: "大", value: "4" },
      { label: "更大", value: "5" }
    ];
    const fromField = lockFrom
      ? `<div class="form-field compose-from"><label>发件人</label><input name="from" value="${this.escapeHtml(fromMailbox)}" readonly title="回复/转发锁定为当前查看邮箱，不可切换"><small class="muted">已锁定为当前查看邮箱，不可切换</small></div>`
      : `<div class="form-field compose-from"><label>发件人</label><select name="from">${mailboxes.map(mailbox => `<option value="${mailbox}" ${mailbox === fromMailbox ? "selected" : ""}>${mailbox}</option>`).join("")}</select>${mailboxes.length > 1 ? `<small class="muted">空白写邮件可切换本人可用发件邮箱</small>` : ""}</div>`;
    root.innerHTML = `
      <div class="card pad compose-mail-page">
        <div class="detail-title">${isReply ? "回复邮件" : isForward ? "转发邮件" : "写邮件"}</div>
        <form id="composeMailForm" class="compose-mail-form">
          <div class="compose-recipients">
            ${CRMUI.formInput("收件人", "to", to)}
            <div class="compose-cc-toggle"><button type="button" class="btn linkish" id="toggleComposeCc">抄送</button></div>
            <div id="composeCcFields" class="compose-cc-fields" hidden>
              ${CRMUI.formInput("抄送", "cc", "")}
            </div>
          </div>
          <div class="compose-subject">
            ${CRMUI.formInput("主题", "subject", subject)}
          </div>
          <div class="compose-editor-wrap">
            <div class="compose-editor-toolbar" id="composeEditorToolbar" role="toolbar" aria-label="编辑工具栏">
              <button type="button" class="compose-tool" data-cmd="undo" title="撤销">撤销</button>
              <button type="button" class="compose-tool" data-cmd="redo" title="重做">重做</button>
              <span class="compose-tool-sep"></span>
              <button type="button" class="compose-tool" data-action="image" title="插入图片">图片</button>
              <button type="button" class="compose-tool" data-action="link" title="插入链接">插入</button>
              <button type="button" class="compose-tool" data-action="importDoc" title="导入文档">导入文档</button>
              <button type="button" class="compose-tool" data-action="schedule" title="日程">日程</button>
              <button type="button" class="compose-tool" data-action="emoji" title="表情">表情</button>
              <span class="compose-tool-sep"></span>
              <select class="compose-tool-select" data-action="formatBlock" title="格式">
                <option value="">格式</option>
                <option value="P">正文</option>
                <option value="H1">标题 1</option>
                <option value="H2">标题 2</option>
                <option value="H3">标题 3</option>
                <option value="BLOCKQUOTE">引用</option>
                <option value="PRE">代码块</option>
              </select>
              <select class="compose-tool-select" data-action="fontName" title="字体">
                ${fonts.map((f, i) => `<option value="${i === 0 ? "" : f}">${f}</option>`).join("")}
              </select>
              <select class="compose-tool-select" data-action="fontSize" title="字号">
                ${sizes.map(s => `<option value="${s.value}">${s.label}</option>`).join("")}
              </select>
              <span class="compose-tool-sep"></span>
              <button type="button" class="compose-tool" data-cmd="bold" title="加粗"><b>B</b></button>
              <button type="button" class="compose-tool" data-cmd="italic" title="斜体"><i>I</i></button>
              <button type="button" class="compose-tool" data-cmd="underline" title="下划线"><u>U</u></button>
              <button type="button" class="compose-tool" data-cmd="strikeThrough" title="删除线"><s>S</s></button>
              <label class="compose-tool compose-color" title="字体颜色">A<input type="color" data-action="foreColor" value="#1f2a37"></label>
              <label class="compose-tool compose-color" title="背景色">▣<input type="color" data-action="hiliteColor" value="#fff59d"></label>
              <span class="compose-tool-sep"></span>
              <button type="button" class="compose-tool" data-cmd="insertUnorderedList" title="无序列表">列表</button>
              <button type="button" class="compose-tool" data-cmd="insertOrderedList" title="有序列表">编号</button>
              <button type="button" class="compose-tool" data-cmd="outdent" title="减少缩进">⇤</button>
              <button type="button" class="compose-tool" data-cmd="indent" title="增加缩进">⇥</button>
              <button type="button" class="compose-tool" data-cmd="formatBlock" data-value="blockquote" title="引用">引用</button>
              <button type="button" class="compose-tool" data-cmd="formatBlock" data-value="pre" title="代码">代码</button>
            </div>
            <div id="composeMailBody" class="compose-editor-body" contenteditable="true" role="textbox" aria-label="邮件正文" data-placeholder="请输入邮件正文…">${bodyHtml}</div>
            <input id="composeImageInput" type="file" accept="image/*" hidden>
          </div>
          <div class="form-field full"><label>附件</label><input name="attachment" type="file" multiple></div>
          <div class="compose-footer">
            ${fromField}
            <div class="compose-actions">
              <button class="btn" id="saveMailDraft" type="button">保存草稿</button>
              <button class="btn" id="cancelComposeMail" type="button">取消</button>
              <button class="btn primary" id="sendComposeMail" type="button" ${!mailboxes.length ? "disabled" : ""}>发送</button>
            </div>
          </div>
        </form>
      </div>
    `;
    if (!mailboxes.length) CRMUI.toast("暂无可用发件邮箱，请先绑定邮箱");
    this.bindComposeEditor();
    CRMUI.$("#toggleComposeCc")?.addEventListener("click", () => {
      const panel = CRMUI.$("#composeCcFields");
      if (!panel) return;
      panel.hidden = !panel.hidden;
    });
    CRMUI.$("#sendComposeMail").addEventListener("click", () => {
      const form = new FormData(CRMUI.$("#composeMailForm"));
      const bodyEl = CRMUI.$("#composeMailBody");
      const text = (bodyEl?.innerText || "").trim();
      if (!form.get("to")) return CRMUI.toast("请填写收件人");
      if (!form.get("subject")) return CRMUI.toast("请填写邮件主题");
      if (!text) return CRMUI.toast("请填写邮件正文");
      CRMUI.toast("发送成功");
      CRMRouter.goto("email");
    });
    CRMUI.$("#saveMailDraft").addEventListener("click", () => CRMUI.toast("草稿已保存"));
    CRMUI.$("#cancelComposeMail").addEventListener("click", () => CRMRouter.goto("email"));
  },
  escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  bindComposeEditor() {
    const editor = CRMUI.$("#composeMailBody");
    const toolbar = CRMUI.$("#composeEditorToolbar");
    const imageInput = CRMUI.$("#composeImageInput");
    if (!editor || !toolbar) return;
    const focusEditor = () => editor.focus();
    const run = (cmd, value = null) => {
      focusEditor();
      try {
        document.execCommand(cmd, false, value);
      } catch (_) {
        CRMUI.toast("当前浏览器不支持该编辑操作");
      }
    };
    toolbar.querySelectorAll("[data-cmd]").forEach(btn => {
      btn.addEventListener("mousedown", e => e.preventDefault());
      btn.addEventListener("click", () => {
        const cmd = btn.dataset.cmd;
        const value = btn.dataset.value || null;
        if (cmd === "formatBlock" && value) return run("formatBlock", value);
        run(cmd, value);
      });
    });
    toolbar.querySelectorAll("select[data-action]").forEach(select => {
      select.addEventListener("change", () => {
        const action = select.dataset.action;
        const value = select.value;
        if (!value) return;
        if (action === "formatBlock") run("formatBlock", value);
        if (action === "fontName") run("fontName", value);
        if (action === "fontSize") run("fontSize", value);
        select.selectedIndex = 0;
      });
    });
    toolbar.querySelectorAll("input[type=color][data-action]").forEach(input => {
      input.addEventListener("input", () => {
        const action = input.dataset.action;
        if (action === "foreColor") run("foreColor", input.value);
        if (action === "hiliteColor") {
          if (!document.execCommand("hiliteColor", false, input.value)) run("backColor", input.value);
        }
      });
    });
    toolbar.querySelectorAll("[data-action]:not(select):not(input)").forEach(btn => {
      btn.addEventListener("mousedown", e => e.preventDefault());
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "image") return imageInput?.click();
        if (action === "link") {
          const url = window.prompt("请输入链接地址", "https://");
          if (url) run("createLink", url);
          return;
        }
        if (action === "emoji") {
          run("insertText", "😊");
          return;
        }
        if (action === "importDoc") return CRMUI.toast("已选择导入文档（原型演示）");
        if (action === "schedule") return CRMUI.toast("日程插入（原型演示）");
      });
    });
    imageInput?.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        focusEditor();
        document.execCommand("insertImage", false, reader.result);
        CRMUI.toast("图片已插入");
      };
      reader.readAsDataURL(file);
      imageInput.value = "";
    });
  },
  currentRouteParams() {
    const activeUrl = window.CRMWorkspace?.activeTab?.()?.url || window.location.href;
    const query = activeUrl.split("?")[1] || "";
    return Object.fromEntries(new URLSearchParams(query).entries());
  },
  markSelectedMailsRead() {
    const ids = Array.from(this.mailState.batchSelected);
    if (!ids.length) return CRMUI.toast("请选择至少一封邮件");
    CRM_MOCK.emails.forEach(mail => { if (ids.includes(mail.id)) mail.read = true; });
    CRMUI.toast(`已标记 ${ids.length} 封邮件为已读`);
    this.renderMailList();
  },
  companyProfileForMail(mail) {
    const domain = mail.from.match(/@([^>\s]+)/)?.[1] || "";
    return (CRM_MOCK.companyProfiles || []).find(item => item.domain === domain);
  },
  companyProfileForWhatsApp(conversation) {
    const lead = CRM_MOCK.leads.find(item => item.id === conversation.leadId);
    const customer = CRM_MOCK.customers.find(item => item.id === conversation.customerId);
    const candidates = [conversation.company, lead?.company, customer?.name].filter(Boolean).map(value => value.toLowerCase());
    return (CRM_MOCK.companyProfiles || []).find(profile => {
      const names = [profile.company, profile.shortName, ...(profile.aliases || [])].filter(Boolean).map(value => value.toLowerCase());
      return candidates.some(candidate => names.some(name => candidate.includes(name) || name.includes(candidate)));
    });
  },
  renderCommunicationAiPanel({ summaryTitle, summary, profile, tags = [], recommendation, warning }) {
    return `
      <div class="ai-panel">
        <div>
          <strong>${summaryTitle}</strong>
          <p>${summary}</p>
          ${tags.length ? `<p>${tags.map(t => `<span class="badge blue">${t}</span>`).join(" ")}</p>` : ""}
        </div>
        <div>
          <strong>客户画像</strong>
          ${this.renderCustomerProfile(profile)}
        </div>
        <div>
          <strong>参展资料</strong>
          ${this.renderExhibitionHistory(profile)}
        </div>
        <div>
          <strong>企业风险信息</strong>
          ${this.renderCompanyRisk(profile)}
        </div>
        <div>
          <strong>AI 综合建议</strong>
          <p>${recommendation || profile?.aiRecommendation || "建议结合沟通内容、企业画像、历史参展和风险信息综合判断客户价值，并制定下一步动作。"}</p>
        </div>
        <div>
          <strong>风险提示</strong>
          <p class="muted">${warning || "未发现明显安全风险。"}</p>
        </div>
      </div>
    `;
  },
  renderCustomerProfile(profile) {
    if (!profile) return `<p class="muted">暂未匹配到企业工商信息，建议先完善客户企业档案。</p>`;
    return `
      <div class="ai-info-grid">
        <span>企业名称</span><strong>${profile.company}</strong>
        <span>企业简称</span><strong>${profile.shortName || "-"}</strong>
        <span>企业基本信息</span><strong>${profile.basicInfo}</strong>
        <span>企业工商信息</span><strong>${profile.registrationInfo}</strong>
        <span>所属行业</span><strong>${profile.industry}</strong>
        <span>企业规模</span><strong>${profile.scale}</strong>
        <span>成立时间</span><strong>${profile.foundedAt}</strong>
        <span>注册资本</span><strong>${profile.registeredCapital}</strong>
        <span>法定代表人</span><strong>${profile.legalRepresentative || "-"}</strong>
        <span>主营业务</span><strong>${profile.mainBusiness}</strong>
        <span>企业所在地</span><strong>${profile.location || "-"}</strong>
      </div>
      <p>${profile.intro}</p>
    `;
  },
  renderExhibitionHistory(profile) {
    if (!profile) return `<p class="muted">暂无企业历史参展数据。</p>`;
    const exhibitions = profile.exhibitions || [];
    return `
      <div class="ai-info-grid">
        <span>近几年参加展会次数</span><strong>${exhibitions.length}</strong>
        <span>最近一次参展时间</span><strong>${exhibitions[0]?.year || "-"}</strong>
        <span>参展年份</span><strong>${exhibitions.map(item => item.year).join("、") || "-"}</strong>
        <span>展会名称</span><strong>${exhibitions.map(item => item.name).join("、") || "-"}</strong>
        <span>参展活跃度分析</span><strong>${exhibitions.length >= 3 ? "高" : exhibitions.length ? "中" : "低"}</strong>
        <span>参展趋势</span><strong>${profile.exhibitionTrend}</strong>
      </div>
    `;
  },
  renderCompanyRisk(profile) {
    if (!profile?.risk) return `<p class="muted">暂无企业风险数据，建议完善工商及风控资料后再生成风险判断。</p>`;
    const risk = profile.risk;
    return `
      <div class="ai-info-grid">
        <span>企业经营风险</span><strong>${risk.operation}</strong>
        <span>法律诉讼</span><strong>${risk.litigation}</strong>
        <span>行政处罚</span><strong>${risk.administrativePenalty}</strong>
        <span>经营异常</span><strong>${risk.abnormal}</strong>
        <span>失信记录</span><strong>${risk.dishonesty}</strong>
        <span>风险等级</span><strong>${CRMUI.badge(risk.level)}</strong>
        <span>AI 风险总结</span><strong>${risk.summary}</strong>
      </div>
    `;
  },
  updateMailBatchActions() {
    const button = CRMUI.$("#batchDeleteMail");
    if (!button) return;
    button.hidden = this.mailState.batchSelected.size < 2;
    const count = this.mailState.batchSelected.size >= 2 ? `（${this.mailState.batchSelected.size}）` : "";
    button.textContent = this.mailState.folder === "trash" ? `永久删除${count}` : `批量删除${count}`;
  },
  openDeleteMailModal(mailId) {
    CRMUI.modal("删除邮件", `
      <p>确定将该邮件移至垃圾箱吗？</p>
      <p class="muted">可在垃圾箱中恢复；永久删除需二次确认。</p>
    `, () => {
      this.deleteMails([mailId]);
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "移至垃圾箱";
  },
  openBatchDeleteMailModal() {
    const ids = Array.from(this.mailState.batchSelected);
    if (!ids.length) return CRMUI.toast("请选择至少一封邮件");
    if (this.mailState.folder === "trash") {
      return this.openPurgeMailModal(ids);
    }
    CRMUI.modal("批量删除", `
      <p>已选择 <strong>${ids.length}</strong> 封邮件。</p>
      <p class="muted">将移至垃圾箱，可稍后恢复。</p>
    `, () => {
      this.deleteMails(ids);
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "移至垃圾箱";
  },
  openPurgeMailModal(ids) {
    CRMUI.modal("永久删除", `
      <p>已选择 <strong>${ids.length}</strong> 封邮件。</p>
      <p class="muted">永久删除后不可恢复，确认继续？</p>
    `, () => {
      this.purgeMails(ids);
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "永久删除";
  },
  deleteMails(ids) {
    try {
      const idSet = new Set(ids);
      let moved = 0;
      CRM_MOCK.emails.forEach(mail => {
        if (!idSet.has(mail.id) || mail.folder === "trash") return;
        mail.previousFolder = mail.folder;
        mail.folder = "trash";
        moved += 1;
      });
      if (!moved) throw new Error("未找到需要删除的邮件");
      ids.forEach(id => this.mailState.batchSelected.delete(id));
      if (idSet.has(this.mailState.selected)) {
        const next = this.getFilteredMails()[0] || CRM_MOCK.emails.find(mail => mail.folder === this.mailState.folder);
        this.mailState.selected = next?.id || "";
      }
      CRMUI.closeModal();
      CRMUI.toast(ids.length > 1 ? "已批量移至垃圾箱" : "已移至垃圾箱");
      this.renderMailTabs();
      this.renderMailList();
    } catch (error) {
      CRMUI.toast(`删除失败：${error.message || "请稍后重试"}`);
    }
  },
  restoreMails(ids) {
    const idSet = new Set(ids);
    let restored = 0;
    CRM_MOCK.emails.forEach(mail => {
      if (!idSet.has(mail.id) || mail.folder !== "trash") return;
      mail.folder = mail.previousFolder || "inbox";
      delete mail.previousFolder;
      restored += 1;
    });
    if (!restored) return CRMUI.toast("未找到可恢复的邮件");
    ids.forEach(id => this.mailState.batchSelected.delete(id));
    CRMUI.toast(ids.length > 1 ? "已批量恢复" : "邮件已恢复");
    this.renderMailTabs();
    this.renderMailList();
  },
  purgeMails(ids) {
    const idSet = new Set(ids);
    const before = CRM_MOCK.emails.length;
    CRM_MOCK.emails = CRM_MOCK.emails.filter(mail => !(idSet.has(mail.id) && mail.folder === "trash"));
    if (CRM_MOCK.emails.length === before) return CRMUI.toast("未找到可永久删除的邮件");
    ids.forEach(id => this.mailState.batchSelected.delete(id));
    if (idSet.has(this.mailState.selected)) {
      const next = this.getFilteredMails()[0];
      this.mailState.selected = next?.id || "";
    }
    CRMUI.closeModal();
    CRMUI.toast("邮件已永久删除");
    this.renderMailTabs();
    this.renderMailList();
  },
  renderMailTabs() {
    const tabs = [["inbox", "收件箱"], ["sent", "已发送"], ["draft", "草稿箱"], ["trash", "垃圾箱"]];
    CRMUI.$("#mailTabs").innerHTML = tabs.map(t => `<div class="tab ${t[0] === this.mailState.folder ? "active" : ""}" data-folder="${t[0]}">${t[1]} <span class="badge gray">${this.folderCount(t[0])}</span></div>`).join("");
    CRMUI.$$("[data-folder]", CRMUI.$("#mailTabs")).forEach(tab => tab.addEventListener("click", () => {
      CRMUI.$$("[data-folder]", CRMUI.$("#mailTabs")).forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      this.mailState.folder = tab.dataset.folder;
      this.renderMailList();
    }));
  },
  openBatchAiModal() {
    const selectedMails = CRM_MOCK.emails.filter(mail => this.mailState.batchSelected.has(mail.id));
    if (!selectedMails.length) return CRMUI.toast("请选择至少一封邮件");
    CRMUI.modal("批量 AI 提炼", `
      <p>已选择 <strong>${selectedMails.length}</strong> 封邮件。</p>
      <p class="muted">是否立即开始 AI 提炼，并生成 PDF 报告？</p>
      ${CRMUI.table([
        { title: "邮件主题", render: m => m.subject },
        { title: "发件人", render: m => m.senderName },
        { title: "时间", render: m => m.time }
      ], selectedMails)}`, () => {
      this.generateBatchAiPdf(selectedMails);
    });
    const submit = CRMUI.$("#modalForm button[type='submit']");
    submit.textContent = "确认生成";
  },
  generateBatchAiPdf(mails) {
    const submit = CRMUI.$("#modalForm button[type='submit']");
    submit.disabled = true;
    submit.textContent = "生成中";
    setTimeout(() => {
      try {
        const blob = new Blob([this.buildBatchAiPdf(mails)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `mail-ai-report-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        CRMUI.closeModal();
        CRMUI.toast("PDF 已生成并下载成功。");
      } catch (error) {
        submit.disabled = false;
        submit.textContent = "确认生成";
        CRMUI.toast(`生成失败：${error.message || "请稍后重试"}`);
      }
    }, 500);
  },
  buildBatchAiPdf(mails) {
    const escapePdf = value => String(value || "").replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, " ");
    const lines = [
      "Batch AI Extraction Report",
      `Generated At: ${new Date().toLocaleString()}`,
      `Selected Emails: ${mails.length}`,
      ""
    ];
    mails.forEach((mail, index) => {
      lines.push(
        `${index + 1}. ${mail.subject}`,
        `From: ${mail.from}`,
        `Time: ${mail.time}`,
        `AI Summary: ${mail.aiSummary}`,
        `AI Tags: ${(mail.aiTags || []).join(", ")}`,
        ""
      );
    });
    const textOps = lines.map((line, index) => `BT /F1 10 Tf 40 ${780 - index * 18} Td (${escapePdf(line).slice(0, 100)}) Tj ET`).join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return pdf;
  },
  canOperateWhatsApp() {
    return CRM_MOCK.currentUser.role === "业务员";
  },
  canViewWhatsApp() {
    return ["业务员", "运营专员", "协同人", "系统管理员"].includes(CRM_MOCK.currentUser.role);
  },
  isWhatsAppReadOnly() {
    return !this.canOperateWhatsApp();
  },
  allowedWhatsAppSiteIds() {
    if (CRM_MOCK.currentUser.role === "系统管理员") return null;
    const user = CRM_MOCK.users.find(item => item.id === CRM_MOCK.currentUser.id) || CRM_MOCK.currentUser;
    return user.siteIds || CRM_MOCK.currentUser.sites || [];
  },
  whatsappConversationsForUser() {
    const allowed = this.allowedWhatsAppSiteIds();
    return (CRM_MOCK.whatsappConversations || []).filter(conversation => !allowed || allowed.includes(conversation.siteId));
  },
  renderWhatsApp(root) {
    if (!this.canViewWhatsApp()) {
      root.innerHTML = `<div class="card pad muted">当前角色不支持查看 WhatsApp 会话。</div>`;
      return;
    }
    const conversations = this.whatsappConversationsForUser();
    if (this.canOperateWhatsApp()) {
      const account = this.personalWhatsappAccount();
      if (!account) {
        root.innerHTML = `
          <div class="card pad account-empty">
            <div class="section-title">未绑定 WhatsApp 账号</div>
            <p class="muted">一个用户仅允许绑定一个 WhatsApp 账号。绑定后即可查看并同步 WhatsApp 会话。</p>
            <button class="btn primary" id="bindWhatsappAccount" type="button">绑定 WhatsApp</button>
          </div>
        `;
        CRMUI.$("#bindWhatsappAccount").addEventListener("click", () => this.renderWhatsAppBindFlow(root));
        return;
      }
    }
    this.chatState = { selected: conversations[0]?.id || "", query: "", lastMessageTimeStart: "", lastMessageTimeEnd: "" };
    root.innerHTML = `
      <div class="list-toolbar">
        <div class="toolbar-actions">
          <button class="btn" id="refreshChat">刷新</button>
        </div>
        <div class="toolbar-filters">
          <div class="filters whatsapp-account-bar search-filter">
            <label class="filter-item"><span>关键词</span><input id="chatSearch" placeholder="搜索联系人、企业、消息"></label>
            <label class="filter-item"><span>消息时间</span><span class="range-picker"><input type="date" id="chatTimeStart" value="${this.chatState.lastMessageTimeStart}"><span class="range-separator">-</span><input type="date" id="chatTimeEnd" value="${this.chatState.lastMessageTimeEnd}"></span></label>
            <div class="filter-actions"><button class="btn" id="chatQuery">查询</button><button class="btn" id="chatReset">重置</button></div>
          </div>
        </div>
      </div>
      <div class="split">
        <div class="card whatsapp-contact-panel" id="chatList"></div>
        <div class="card pad" id="chatBody"></div>
        <div class="card pad" id="chatInfo"></div>
      </div>
    `;
    CRMUI.$("#chatSearch").addEventListener("input", e => {
      const value = e.target.value.toLowerCase();
      clearTimeout(this._chatSearchTimer);
      this._chatSearchTimer = setTimeout(() => {
        this.chatState.query = value;
        this.renderChatList();
      }, 300);
    });
    CRMUI.$("#chatTimeStart").addEventListener("change", e => { this.chatState.lastMessageTimeStart = e.target.value; this.renderChatList(); });
    CRMUI.$("#chatTimeEnd").addEventListener("change", e => { this.chatState.lastMessageTimeEnd = e.target.value; this.renderChatList(); });
    CRMUI.$("#chatQuery").addEventListener("click", () => this.renderChatList());
    CRMUI.$("#chatReset").addEventListener("click", () => {
      this.chatState.query = "";
      this.chatState.lastMessageTimeStart = "";
      this.chatState.lastMessageTimeEnd = "";
      CRMUI.$("#chatSearch").value = "";
      CRMUI.$("#chatTimeStart").value = "";
      CRMUI.$("#chatTimeEnd").value = "";
      this.renderChatList();
    });
    CRMUI.$("#refreshChat").addEventListener("click", () => CRMUI.toast("会话已刷新"));
    this.renderChatList();
  },
  personalWhatsappAccount() {
    const account = CRM_MOCK.personalWhatsappAccount;
    return account && account.userId === CRM_MOCK.currentUser.id ? account : null;
  },
  renderWhatsAppBindFlow(root, isReauth = false) {
    root.innerHTML = `
      <div class="account-bind-flow">
        <div class="step-row"><span class="step-pill active">1. 生成二维码</span><span class="step-pill active">2. 扫码授权</span><span class="step-pill">3. 绑定成功</span></div>
        <div class="whatsapp-qr">
          <div class="qr-box"><span>WA</span></div>
          <div>
            <div class="section-title">${isReauth ? "重新授权 WhatsApp" : "绑定 WhatsApp"}</div>
            <p class="muted">请使用 WhatsApp 扫描二维码完成授权。系统仅允许当前用户绑定一个 WhatsApp 账号。</p>
            <div class="toolbar">
              <button class="btn" type="button" id="backWhatsappPage">返回</button>
              <button class="btn primary" type="button" id="finishWhatsappPageAuth">模拟扫码授权成功</button>
            </div>
          </div>
        </div>
      </div>
    `;
    CRMUI.$("#backWhatsappPage").addEventListener("click", () => this.renderWhatsApp(root));
    CRMUI.$("#finishWhatsappPageAuth").addEventListener("click", () => {
      CRM_MOCK.personalWhatsappAccount = { id: "pwa01", userId: CRM_MOCK.currentUser.id, account: "+1 650-123-4567", status: "已绑定", lastSyncAt: "2026-07-04 09:30", boundAt: "2026-07-04 09:30" };
      CRMUI.toast("WhatsApp 授权成功");
      this.renderWhatsApp(root);
    });
  },
  renderChatList() {
    const start = this.chatState.lastMessageTimeStart || "";
    const end = this.chatState.lastMessageTimeEnd || "";
    const list = this.whatsappConversationsForUser().filter(c => {
      const text = `${c.name} ${c.company} ${c.messages.map(m => m.text).join(" ")}`.toLowerCase();
      // 最近消息时间：取会话最近一条消息时间，按日期粒度比较；空值不限制
      const msgDate = String(c.lastMessageTime || "").slice(0, 10);
      const byStart = !start || msgDate >= start;
      const byEnd = !end || msgDate <= end;
      return text.includes(this.chatState.query) && byStart && byEnd;
    });
    if (!list.find(item => item.id === this.chatState.selected)) {
      this.chatState.selected = list[0]?.id || "";
    }
    CRMUI.$("#chatList").innerHTML = this.renderContactList(list);
    CRMUI.$$("[data-chat]").forEach(el => el.addEventListener("click", () => {
      this.chatState.selected = el.dataset.chat;
      this.renderChatList();
    }));
    this.renderChatDetail();
  },
  renderContactList(list) {
    if (!list.length) return `<div class="wa-contact-empty">未找到相关会话</div>`;
    return `<div class="wa-contact-list">${list.map(contact => this.renderContactItem(contact)).join("")}</div>`;
  },
  renderContactItem(contact) {
    const active = contact.id === this.chatState.selected ? "active" : "";
    const lastMessage = contact.messages.at(-1);
    return `
      <button class="wa-contact-item ${active}" data-chat="${contact.id}" type="button" title="${contact.name}">
        ${this.renderContactAvatar(contact)}
        <span class="wa-contact-main">
          <span class="wa-contact-name">${contact.name}</span>
          <span class="wa-contact-preview">${this.renderContactPreview(contact, lastMessage)}</span>
        </span>
        <span class="wa-contact-meta">
          <span class="wa-contact-time ${contact.unreadCount ? "unread" : ""}">${contact.listTime || lastMessage?.time || ""}</span>
          ${contact.unreadCount ? `<span class="wa-unread-count">${contact.unreadCount}</span>` : ""}
        </span>
      </button>
    `;
  },
  renderContactAvatar(contact) {
    const initials = contact.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
    return `<span class="wa-avatar wa-avatar-${contact.avatarTone || "blue"}"><span>${initials}</span></span>`;
  },
  renderContactPreview(contact, lastMessage) {
    const icon = contact.previewIcon ? `<span class="wa-preview-icon">${contact.previewIcon}</span>` : "";
    const text = lastMessage?.text || contact.company || "";
    return `${icon}<span>${text}</span>`;
  },
  renderChatDetail() {
    const c = CRM_MOCK.whatsappConversations.find(item => item.id === this.chatState.selected);
    if (!c) {
      CRMUI.$("#chatBody").innerHTML = `<div class="muted">请选择一条会话</div>`;
      CRMUI.$("#chatInfo").innerHTML = "";
      return;
    }
    const profile = this.companyProfileForWhatsApp(c);
    const readOnly = this.isWhatsAppReadOnly();
    const canGenerateLead = this.canOperateWhatsApp() || CRM_MOCK.currentUser.role === "系统管理员";
    CRMUI.$("#chatBody").innerHTML = `
      <div class="detail-title">${c.name}</div><p class="muted">${c.company} · ${c.phone}${c.siteId ? ` · ${CRMUI.siteName(c.siteId)}` : ""}</p>
      <div class="chat-body">${c.messages.map(m => `<div class="bubble ${m.from === "me" ? "me" : ""}">${m.text}<div class="small">${m.time}</div></div>`).join("")}</div>
      ${readOnly ? `<p class="muted small" title="当前会话不可回复或发送消息">只读会话</p>` : `<div class="chat-input"><textarea id="chatInput" style="flex:1" placeholder="输入消息，Enter 发送，Shift+Enter 换行"></textarea><button class="btn" id="uploadChatImage">上传图片</button><button class="btn" id="uploadChatFile">上传文件</button><button class="btn primary" id="sendMsg">发送</button></div>`}
    `;
    CRMUI.$("#chatInfo").innerHTML = `
      <div class="card-title">AI 智能分析</div>
      ${this.renderCommunicationAiPanel({
        summaryTitle: "会话摘要",
        summary: c.aiSummary,
        profile,
        tags: c.aiTags,
        recommendation: profile?.aiRecommendation || "建议结合 WhatsApp 会话内容、联系人信息、客户资料和历史 CRM 记录确定跟进优先级。",
        warning: profile?.risk?.summary || "未发现明显安全风险。"
      })}
      <div class="toolbar">
        ${canGenerateLead ? `<button class="btn primary" id="chatLead">${c.leadId ? "查看线索详情" : "生成线索"}</button>` : ""}
        ${c.customerId ? `<button class="btn" id="chatCustomer">查看客户</button>` : ""}
      </div>
    `;
    if (!readOnly) {
      const send = () => {
        const input = CRMUI.$("#chatInput");
        if (!input.value.trim()) return;
        c.messages.push({ id: `wm${Date.now()}`, from: "me", text: input.value.trim(), time: "刚刚" });
        input.value = "";
        this.renderChatDetail();
      };
      CRMUI.$("#sendMsg").addEventListener("click", send);
      CRMUI.$("#chatInput").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
      CRMUI.$("#uploadChatImage").addEventListener("click", () => CRMUI.toast("已打开图片上传入口"));
      CRMUI.$("#uploadChatFile").addEventListener("click", () => CRMUI.toast("已打开文件上传入口"));
    }
    CRMUI.$("#chatLead")?.addEventListener("click", () => c.leadId ? CRMRouter.goto("leadDetail", { id: c.leadId }) : this.openWhatsappGenerateLeadModal(c));
    const customerBtn = CRMUI.$("#chatCustomer");
    if (customerBtn) customerBtn.addEventListener("click", () => CRMRouter.goto("customerDetail", { id: c.customerId }));
  },
  openWhatsappGenerateLeadModal(conversation) {
    const me = CRM_MOCK.currentUser;
    const authorizedSiteId = me?.siteIds?.[0] || "";
    if (!authorizedSiteId) return CRMUI.toast("当前业务员未配置授权站点，无法生成线索");
    const aiOk = this.hasAiPrefill(conversation);
    const companyGuess = aiOk ? (conversation.company || "") : "";
    const matchedCustomer = (CRM_MOCK.customers || []).find(c => c.siteId === authorizedSiteId && (c.name === companyGuess || c.company === companyGuess));
    const tagSeed = aiOk ? (conversation.aiTags || []) : [];
    CRMUI.modal("确认生成线索", `
      <div class="form-grid">
        ${CRMUI.formSelect("选择已有客户", "customerId", this.customerOptions(authorizedSiteId), matchedCustomer?.id || "")}
        ${CRMUI.formInput("企业名称（所属企业）", "company", matchedCustomer?.name || matchedCustomer?.company || companyGuess)}
        ${CRMUI.formInput("询盘联系人", "contact", aiOk ? (conversation.name || "") : "")}
        ${CRMUI.formInput("邮箱", "email", aiOk ? (conversation.email || "") : "")}
        <div class="form-field"><label>电话</label><input name="phone" value="${this.escapeHtml(conversation.phone || "")}" readonly><small class="muted">WhatsApp 会话号，只读</small></div>
        ${CRMUI.formInput("WhatsApp", "whatsapp", conversation.phone || "")}
        ${CRMUI.formSelect("站点", "siteId", this.siteOptions(authorizedSiteId), authorizedSiteId)}
        ${CRMUI.formSelect("来源渠道", "channel", this.channelOptions("WhatsApp"), "WhatsApp")}
        ${CRMUI.formSelect("负责人", "ownerId", this.ownerOptions(me.id), me.id)}
        ${CRMUI.formInput("意向产品", "products", aiOk ? (conversation.aiIntentProduct || "") : "")}
        ${CRMUI.formMultiSelect("线索标签", "tags", (CRM_MOCK.dictionaries.find(d => d.code === "leadTag")?.items || []).map(i => ({ value: i.name, label: i.name })), tagSeed)}
        ${CRMUI.formMultiSelect("关注点", "focusPoints", (CRM_MOCK.dictionaries.find(d => d.code === "customerFocus")?.items || []).filter(i => i.status !== "停用").map(i => ({ value: i.name, label: i.displayGroup ? `${i.displayGroup} / ${i.name}` : i.name })), [])}
        <div class="form-field full"><label>备注</label><textarea name="remark"></textarea></div>
        <div class="form-field full"><small class="muted">${aiOk ? "已按 AI/消息信息预填；来源/站点/负责人可改（如改为官网询盘）。" : "AI 不可用或无分析结果：业务字段未预填；电话只读，站点/来源/负责人已默认带入可改。"}</small></div>
      </div>`, form => {
      const contactName = (form.get("contact") || "").trim();
      const phone = (form.get("phone") || "").trim();
      const mailAddr = (form.get("email") || "").trim();
      const whatsapp = (form.get("whatsapp") || "").trim() || phone;
      if (!contactName) return CRMUI.toast("请填写询盘联系人");
      if (!mailAddr && !phone && !whatsapp) return CRMUI.toast("邮箱、电话、WhatsApp 至少填写一项");
      if (!form.get("siteId")) return CRMUI.toast("请选择站点");
      if (!form.get("ownerId")) return CRMUI.toast("请选择负责人");
      const customerId = form.get("customerId") || "";
      const customer = customerId ? CRM_MOCK.customers.find(c => c.id === customerId) : null;
      const companyName = (form.get("company") || customer?.name || customer?.company || "").trim();
      const lead = {
        id: `l${Date.now()}`,
        no: `LEAD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        company: companyName || contactName,
        contact: contactName,
        email: mailAddr,
        phone,
        whatsapp,
        siteId: form.get("siteId"),
        channel: form.get("channel") || "WhatsApp",
        ownerId: form.get("ownerId"),
        status: "待跟进",
        stage: "待首响",
        products: String(form.get("products") || "").split(/[、,，]/).map(v => v.trim()).filter(Boolean),
        purchaseIntent: "",
        aiTags: conversation.aiTags || [],
        manualTags: form.getAll("tags"),
        focusPoints: form.getAll("focusPoints"),
        remark: form.get("remark") || "",
        createdAt: "2026-07-02 12:20",
        lastFollowAt: "",
        nextFollowAt: "",
        customerId: customerId || "",
        aiSummary: conversation.aiSummary || "",
        sourceType: "消息侧人工生成"
      };
      CRM_MOCK.leads.unshift(lead);
      conversation.leadId = lead.id;
      CRMUI.closeModal();
      CRMUI.toast("线索已生成");
      this.renderChatDetail();
    });
  }
};
