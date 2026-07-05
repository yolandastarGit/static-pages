window.CRMCommunicationPage = {
  render(root, page) {
    page === "email" ? this.renderEmail(root) : this.renderWhatsApp(root);
  },
  renderEmail(root) {
    this.mailRoot = root;
    this.mailState = { folder: "inbox", selected: CRM_MOCK.emails[0].id, query: "", batchSelected: new Set() };
    root.innerHTML = `
      <div class="filters">
        <select id="mailbox">${CRM_MOCK.mailboxes.map(m => `<option>${m}</option>`).join("")}</select>
        <input id="mailSearch" placeholder="搜索主题、发件人、正文">
        <button class="btn" id="batchAi">批量 AI 提炼</button>
        <button class="btn" id="batchDeleteMail" hidden>批量删除</button>
      </div>
      <div class="tabs" id="mailTabs">
        ${[["inbox", "收件箱"], ["sent", "已发送"], ["draft", "草稿箱"], ["trash", "垃圾箱"]].map(t => `<div class="tab ${t[0] === "inbox" ? "active" : ""}" data-folder="${t[0]}">${t[1]} <span class="badge gray">${this.folderCount(t[0])}</span></div>`).join("")}
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
      this.mailState.query = e.target.value.toLowerCase();
      this.renderMailList();
    });
    CRMUI.$("#batchAi").addEventListener("click", () => this.openBatchAiModal());
    CRMUI.$("#batchDeleteMail").addEventListener("click", () => this.openBatchDeleteMailModal());
    this.renderMailList();
  },
  folderCount(folder) {
    return CRM_MOCK.emails.filter(mail => mail.folder === folder).length;
  },
  getFilteredMails() {
    return CRM_MOCK.emails.filter(mail => {
      const byFolder = mail.folder === this.mailState.folder;
      const text = `${mail.from} ${mail.subject} ${mail.body}`.toLowerCase();
      return byFolder && text.includes(this.mailState.query);
    });
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
        <button class="btn mail-delete-btn" type="button" data-mail-delete="${mail.id}">删除</button>
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
    CRMUI.$$("[data-mail-delete]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        this.openDeleteMailModal(btn.dataset.mailDelete);
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
      <p class="muted">${mail.time} · 来源站点：${mail.siteId ? CRMUI.siteName(mail.siteId) : `<span class="badge red">待确认</span>`}</p>
      <div style="line-height:1.8;margin:18px 0">${mail.body}</div>
      <div>${mail.attachments.map(a => `<span class="badge gray">${a}</span>`).join(" ") || `<span class="muted">无附件</span>`}</div>
      <div class="toolbar" style="margin-top:18px">
        <button class="btn primary" id="generateLead">${mail.leadId ? "查看线索" : "生成线索"}</button>
        <button class="btn" id="replyMail">回复</button>
        <button class="btn" id="forwardMail">转发</button>
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
        warning: mail.siteId ? "未发现明显安全风险。" : "来源站点未识别，生成线索前需手动选择。"
      })}
      <button class="btn" id="copyAi">复制总结</button>
    `;
    CRMUI.$("#copyAi").addEventListener("click", () => CRMUI.toast("AI 总结已复制"));
    CRMUI.$("#generateLead").addEventListener("click", () => {
      if (mail.leadId) CRMRouter.goto("leads", { id: mail.leadId });
      else this.openGenerateLeadModal(mail);
    });
    CRMUI.$("#replyMail").addEventListener("click", () => CRMUI.toast("已打开回复编辑状态"));
    CRMUI.$("#forwardMail").addEventListener("click", () => CRMUI.toast("已打开转发编辑状态"));
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
    button.textContent = `批量删除${this.mailState.batchSelected.size >= 2 ? `（${this.mailState.batchSelected.size}）` : ""}`;
  },
  openDeleteMailModal(mailId) {
    CRMUI.modal("删除邮件", `
      <p>确定删除该邮件吗？</p>
      <p class="muted">删除后不可恢复。</p>
    `, () => {
      this.deleteMails([mailId]);
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "确认删除";
  },
  openBatchDeleteMailModal() {
    const ids = Array.from(this.mailState.batchSelected);
    if (!ids.length) return CRMUI.toast("请选择至少一封邮件");
    CRMUI.modal("批量删除", `
      <p>已选择 <strong>${ids.length}</strong> 封邮件。</p>
      <p class="muted">是否确认删除？</p>
    `, () => {
      this.deleteMails(ids);
    });
    CRMUI.$("#modalForm button[type='submit']").textContent = "确认删除";
  },
  deleteMails(ids) {
    try {
      const idSet = new Set(ids);
      const before = CRM_MOCK.emails.length;
      CRM_MOCK.emails = CRM_MOCK.emails.filter(mail => !idSet.has(mail.id));
      if (CRM_MOCK.emails.length === before) throw new Error("未找到需要删除的邮件");
      ids.forEach(id => this.mailState.batchSelected.delete(id));
      if (idSet.has(this.mailState.selected)) {
        const next = this.getFilteredMails()[0] || CRM_MOCK.emails[0];
        this.mailState.selected = next?.id || "";
      }
      CRMUI.closeModal();
      CRMUI.toast(ids.length > 1 ? "邮件已批量删除" : "邮件已删除");
      this.renderMailTabs();
      this.renderMailList();
    } catch (error) {
      CRMUI.toast(`删除失败：${error.message || "请稍后重试"}`);
    }
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
  openGenerateLeadModal(mail) {
    // 业务规则 BR-024/BR-026：邮件生成线索天然归属当前绑定业务员，默认状态"待跟进"，不进入公海池
    const me = CRM_MOCK.currentUser;
    const defaultSiteId = (me.siteIds && me.siteIds[0]) || CRM_MOCK.sites[0]?.id || "";
    CRMUI.modal("确认生成线索", `
      <div class="form-grid">
        ${CRMUI.formInput("企业名称", "company", mail.senderName.includes("Unknown") ? "" : mail.senderName)}
        ${CRMUI.formInput("联系人", "contact", mail.senderName)}
        ${CRMUI.formInput("邮箱", "email", mail.from.match(/<(.+)>/)?.[1] || "")}
        <div class="form-field"><label>来源站点</label><select name="siteId" required><option value="">请选择</option>${CRM_MOCK.sites.map(s => `<option value="${s.id}" ${s.id === defaultSiteId ? "selected" : ""}>${s.name}</option>`).join("")}</select></div>
        ${CRMUI.formSelect("采购意向", "purchaseIntent", (CRM_MOCK.purchaseIntentOptions || []).map(v => ({ value: v, label: v })))}
      </div>`, form => {
      const lead = {
        id: `l${Date.now()}`,
        no: `LEAD-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        company: form.get("company") || "未命名企业",
        contact: form.get("contact"),
        email: form.get("email"),
        phone: "",
        siteId: form.get("siteId"),
        channel: "邮件",
        ownerId: me.id,
        status: "待跟进",
        stage: "待首响",
        products: ["待识别"],
        purchaseIntent: form.get("purchaseIntent"),
        aiTags: mail.aiTags,
        manualTags: [],
        createdAt: "2026-07-02 12:00",
        lastFollowAt: "",
        nextFollowAt: "",
        customerId: "",
        aiSummary: mail.aiSummary
      };
      CRM_MOCK.leads.unshift(lead);
      mail.leadId = lead.id;
      mail.siteId = form.get("siteId");
      CRMUI.closeModal();
      CRMUI.toast("线索已生成并归属当前业务员");
      this.renderMailDetail();
    });
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
  renderWhatsApp(root) {
    this.chatState = { selected: CRM_MOCK.whatsappConversations[0].id, query: "" };
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
    root.innerHTML = `
      <div class="filters whatsapp-account-bar">
        <div class="bound-account">
          <span class="badge green">已绑定</span>
          <strong>${account.account}</strong>
          <span class="muted">最近同步 ${account.lastSyncAt || "-"}</span>
        </div>
        <input id="chatSearch" placeholder="搜索联系人、企业、消息">
        <button class="btn" id="reauthorizeWhatsappAccount">重新授权</button>
        <button class="btn" id="unbindWhatsappAccount">解绑</button>
        <button class="btn" id="refreshChat">刷新</button>
      </div>
      <div class="split">
        <div class="card whatsapp-contact-panel" id="chatList"></div>
        <div class="card pad" id="chatBody"></div>
        <div class="card pad" id="chatInfo"></div>
      </div>
    `;
    CRMUI.$("#chatSearch").addEventListener("input", e => {
      this.chatState.query = e.target.value.toLowerCase();
      this.renderChatList();
    });
    CRMUI.$("#reauthorizeWhatsappAccount").addEventListener("click", () => this.renderWhatsAppBindFlow(root, true));
    CRMUI.$("#unbindWhatsappAccount").addEventListener("click", () => {
      CRM_MOCK.personalWhatsappAccount = null;
      CRMUI.toast("WhatsApp 已解绑");
      this.renderWhatsApp(root);
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
    const list = CRM_MOCK.whatsappConversations.filter(c => `${c.name} ${c.company} ${c.messages.map(m => m.text).join(" ")}`.toLowerCase().includes(this.chatState.query));
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
    const profile = this.companyProfileForWhatsApp(c);
    CRMUI.$("#chatBody").innerHTML = `
      <div class="detail-title">${c.name}</div><p class="muted">${c.company} · ${c.phone}</p>
      <div class="chat-body">${c.messages.map(m => `<div class="bubble ${m.from === "me" ? "me" : ""}">${m.text}<div class="small">${m.time}</div></div>`).join("")}</div>
      <div class="chat-input"><input id="chatInput" style="flex:1" placeholder="输入消息，Enter 发送"><button class="btn primary" id="sendMsg">发送</button></div>
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
        <button class="btn primary" id="chatLead">${c.leadId ? "查看线索详情" : "生成线索"}</button>
        ${c.customerId ? `<button class="btn" id="chatCustomer">查看客户</button>` : ""}
      </div>
    `;
    const send = () => {
      const input = CRMUI.$("#chatInput");
      if (!input.value.trim()) return;
      c.messages.push({ id: `wm${Date.now()}`, from: "me", text: input.value.trim(), time: "刚刚" });
      input.value = "";
      this.renderChatDetail();
    };
    CRMUI.$("#sendMsg").addEventListener("click", send);
    CRMUI.$("#chatInput").addEventListener("keydown", e => { if (e.key === "Enter") send(); });
    CRMUI.$("#chatLead").addEventListener("click", () => CRMRouter.goto("leads", { id: c.leadId }));
    const customerBtn = CRMUI.$("#chatCustomer");
    if (customerBtn) customerBtn.addEventListener("click", () => CRMRouter.goto("customers", { id: c.customerId }));
  }
};
