window.CRMCommunicationPage = {
  render(root, page) {
    page === "email" ? this.renderEmail(root) : this.renderWhatsApp(root);
  },
  renderEmail(root) {
    this.mailState = { folder: "inbox", selected: CRM_MOCK.emails[0].id, query: "" };
    root.innerHTML = `
      <div class="filters">
        <select id="mailbox">${CRM_MOCK.mailboxes.map(m => `<option>${m}</option>`).join("")}</select>
        <input id="mailSearch" placeholder="搜索主题、发件人、正文">
        <button class="btn" id="batchAi">批量 AI 提炼</button>
      </div>
      <div class="tabs">
        ${[["unread", "未读"], ["inbox", "收件箱"], ["sent", "已发送"], ["draft", "草稿箱"], ["trash", "垃圾箱"]].map((t, i) => `<div class="tab ${t[0] === "inbox" ? "active" : ""}" data-folder="${t[0]}">${t[1]} <span class="badge gray">${this.folderCount(t[0])}</span></div>`).join("")}
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
    this.renderMailList();
  },
  folderCount(folder) {
    return CRM_MOCK.emails.filter(mail => folder === "unread" ? !mail.read : mail.folder === folder).length;
  },
  getFilteredMails() {
    return CRM_MOCK.emails.filter(mail => {
      const byFolder = this.mailState.folder === "unread" ? !mail.read : mail.folder === this.mailState.folder;
      const text = `${mail.from} ${mail.subject} ${mail.body}`.toLowerCase();
      return byFolder && text.includes(this.mailState.query);
    });
  },
  renderMailList() {
    const mails = this.getFilteredMails();
    if (!mails.find(m => m.id === this.mailState.selected)) this.mailState.selected = mails[0]?.id;
    CRMUI.$("#mailList").innerHTML = mails.length ? mails.map(mail => `
      <div class="list-item ${mail.id === this.mailState.selected ? "active" : ""}" data-mail="${mail.id}">
        <strong>${mail.read ? mail.senderName : "● " + mail.senderName}</strong>
        <div>${mail.subject}</div>
        <div class="small muted">${mail.summary}</div>
        <div class="small muted">${mail.time}</div>
      </div>
    `).join("") : `<div class="pad muted">当前条件下没有邮件</div>`;
    CRMUI.$$("[data-mail]").forEach(el => el.addEventListener("click", () => {
      this.mailState.selected = el.dataset.mail;
      const mail = CRM_MOCK.emails.find(m => m.id === this.mailState.selected);
      mail.read = true;
      this.renderMailList();
    }));
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
    CRMUI.$("#mailAi").innerHTML = `
      <div class="card-title">AI 智能分析</div>
      <div class="ai-panel">
        <div><strong>意向总结</strong><p>${mail.aiSummary}</p></div>
        <div><strong>AI 标签</strong><p>${mail.aiTags.map(t => `<span class="badge blue">${t}</span>`).join(" ")}</p></div>
        <div><strong>风险提醒</strong><p class="muted">${mail.siteId ? "未发现明显安全风险。" : "来源站点未识别，生成线索前需手动选择。"}</p></div>
        <button class="btn" id="copyAi">复制总结</button>
      </div>
    `;
    CRMUI.$("#copyAi").addEventListener("click", () => CRMUI.toast("AI 总结已复制"));
    CRMUI.$("#generateLead").addEventListener("click", () => {
      if (mail.leadId) CRMRouter.goto("leads", { id: mail.leadId });
      else this.openGenerateLeadModal(mail);
    });
    CRMUI.$("#replyMail").addEventListener("click", () => CRMUI.toast("已打开回复编辑状态"));
    CRMUI.$("#forwardMail").addEventListener("click", () => CRMUI.toast("已打开转发编辑状态"));
  },
  openGenerateLeadModal(mail) {
    CRMUI.modal("确认生成线索", `
      <div class="form-grid">
        ${CRMUI.formInput("企业名称", "company", mail.senderName.includes("Unknown") ? "" : mail.senderName)}
        ${CRMUI.formInput("联系人", "contact", mail.senderName)}
        ${CRMUI.formInput("邮箱", "email", mail.from.match(/<(.+)>/)?.[1] || "")}
        <div class="form-field"><label>来源站点</label><select name="siteId" required><option value="">请选择</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></div>
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
        ownerId: "",
        status: "公海待分配",
        stage: "待首响",
        products: ["待识别"],
        aiTags: mail.aiTags,
        manualTags: [],
        createdAt: "2026-07-02 12:00",
        lastFollowAt: "",
        nextFollowAt: "",
        customerId: "",
        poolReason: "系统采集",
        poolEnteredAt: "2026-07-02 12:00",
        aiSummary: mail.aiSummary
      };
      CRM_MOCK.leads.unshift(lead);
      mail.leadId = lead.id;
      mail.siteId = form.get("siteId");
      CRMUI.closeModal();
      CRMUI.toast("线索已生成并进入公海池");
      this.renderMailDetail();
    });
  },
  openBatchAiModal() {
    CRMUI.modal("批量 AI 提炼", `
      <p>AI 将分析当前邮箱选中的邮件，提取客户名称、联系方式、采购意向和产品需求。</p>
      ${CRMUI.table([
        { title: "邮件主题", render: m => m.subject },
        { title: "客户名称", render: m => m.senderName },
        { title: "意向等级", render: () => CRMUI.badge("高意向") },
        { title: "结果", render: m => m.leadId ? "已生成线索" : "可应用" }
      ], CRM_MOCK.emails.slice(0, 3))}`, () => {
      CRMUI.closeModal();
      CRMUI.toast("批量 AI 提炼完成");
    });
  },
  renderWhatsApp(root) {
    this.chatState = { selected: CRM_MOCK.whatsappConversations[0].id, query: "" };
    root.innerHTML = `
      <div class="filters">
        <select><option>WA Business (+1 650-123-4567)</option></select>
        <input id="chatSearch" placeholder="搜索联系人、企业、消息">
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
    CRMUI.$("#refreshChat").addEventListener("click", () => CRMUI.toast("会话已刷新"));
    this.renderChatList();
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
    CRMUI.$("#chatBody").innerHTML = `
      <div class="detail-title">${c.name}</div><p class="muted">${c.company} · ${c.phone}</p>
      <div class="chat-body">${c.messages.map(m => `<div class="bubble ${m.from === "me" ? "me" : ""}">${m.text}<div class="small">${m.time}</div></div>`).join("")}</div>
      <div class="chat-input"><input id="chatInput" style="flex:1" placeholder="输入消息，Enter 发送"><button class="btn primary" id="sendMsg">发送</button></div>
    `;
    CRMUI.$("#chatInfo").innerHTML = `
      <div class="card-title">会话洞察</div>
      <p><strong>${c.name}</strong><br><span class="muted">${c.location}</span></p>
      <p>${c.aiSummary}</p>
      <p>${c.aiTags.map(t => `<span class="badge blue">${t}</span>`).join(" ")}</p>
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
