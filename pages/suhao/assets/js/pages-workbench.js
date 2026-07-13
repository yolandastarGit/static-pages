window.CRMWorkbenchPage = {
  render(root) {
    this.root = root;
    const role = CRM_MOCK.currentUser?.role || "";
    const showSiteFilter = role !== "业务员";
    this.workbenchState = { siteId: "" };
    const siteFilterHtml = showSiteFilter
      ? `<label class="wb-date-filter"><span>站点:</span><select id="workbenchSite"><option value="">全部可见站点</option>${CRMUI.optionList(CRM_MOCK.sites)}</select></label>`
      : "";
    root.innerHTML = `
      ${this.localStyles()}
      <div class="wb-page">
        <div class="wb-section-head">
          <div class="section-title">待办事项</div>
          ${siteFilterHtml}
        </div>
        <div class="wb-grid wb-grid-5">
          ${this.workCard({ title: "待回复线索", value: "23", action: "查看线索", route: "leads", query: "reply=pending", tone: "blue", icon: "message" })}
          ${this.workCard({ title: "邮件未读", value: "16", action: "查看未读邮件", route: "email", query: "unread=1", tone: "green", icon: "mail" })}
          ${this.workCard({ title: "跟进超时", value: "8", action: "查看超时线索", route: "leads", query: "overdue=1", tone: "orange", icon: "clock" })}
          ${this.workCard({ title: "新增线索", value: "15", action: "查看新增线索", route: "leads", query: "created=today", tone: "purple", icon: "userPlus" })}
          ${this.workCard({ title: "待分配", value: "12", action: "进入公海池", route: "publicPool", query: "", tone: "cyan", icon: "users", badge: "运营/协同/管理员" })}
        </div>

        <div class="section-title wb-title">我的业务</div>
        <div class="wb-grid wb-grid-3">
          ${this.workCard({ title: "在跟线索", value: "128", action: "查看线索", route: "leads", query: "", tone: "blue", icon: "file" })}
          ${this.workCard({ title: "高意向线索", value: "48", action: "查看高意向线索", route: "leads", query: "stage=highIntent", tone: "green", icon: "target" })}
          ${this.workCard({ title: "负责客户", value: "86", action: "查看客户", route: "customers", query: "", tone: "blue", icon: "user" })}
        </div>

        <div class="section-title wb-title">异常提醒</div>
        <div class="wb-grid wb-grid-4">
          ${this.workCard({ title: "无效线索", value: "4", action: "查看无效线索", route: "leads", query: "status=无效", tone: "red", icon: "alert" })}
          ${this.workCard({ title: "丢失线索", value: "2", action: "查看丢失线索", route: "leads", query: "status=丢失", tone: "red", icon: "alert" })}
          ${this.workCard({ title: "异常站点", value: "3", action: "进入站点管理", route: "sites", query: "", tone: "red", icon: "server", badge: "管理员/运营/协同" })}
          ${this.workCard({ title: "AI 服务不可用", value: "—", action: "前往AI能力管理（管理员）", route: "ai", query: "", tone: "gray", icon: "bot", badge: "全部" })}
        </div>

        <div class="section-title wb-title">快捷入口</div>
        <div class="wb-quick-card">
          ${this.quickEntry("邮件/WhatsApp", "email", "mail", "blue")}
          ${this.quickEntry("线索列表", "leads", "list", "green")}
          ${this.quickEntry("公海池", "publicPool", "user", "orange")}
          ${this.quickEntry("客户列表", "customers", "users", "blue")}
          ${this.quickEntry("合同中心", "contracts", "file", "purple", true)}
          ${this.quickEntry("销售经营", "analyticsSales", "chart", "blue")}
          ${this.quickEntry("获客分析", "analyticsAcquisition", "pie", "green")}
          ${this.quickEntry("客户经营", "analyticsCustomer", "share", "orange", true)}
          ${this.quickEntry("站点管理", "sites", "tool", "gray")}
          ${this.quickEntry("用户管理", "systemUsers", "userGlobe", "blue")}
          ${this.quickEntry("系统管理", "systemParams", "settings", "purple")}
        </div>
      </div>
    `;
    CRMUI.$("#workbenchSite")?.addEventListener("change", e => {
      this.workbenchState.siteId = e.target.value;
    });
    this.bindRoutes();
  },
  workCard(card) {
    const attrs = card.route ? `data-wb-route="${card.route}" data-wb-query="${card.query || ""}"` : "";
    return `
      <div class="wb-card" ${attrs}>
        <div class="wb-card-top">
          <div class="wb-card-title">${card.title}</div>
          ${card.badge ? `<span class="wb-badge">${card.badge}</span>` : ""}
        </div>
        <div class="wb-card-body">
          <div>
            <div class="wb-card-value wb-${card.tone}">${card.value}</div>
            <button class="wb-card-link" type="button">${card.action}<span>›</span></button>
          </div>
          <div class="wb-card-icon wb-bg-${card.tone}">${this.icon(card.icon)}</div>
        </div>
      </div>
    `;
  },
  quickEntry(label, route, icon, tone, divider = false) {
    return `
      <button class="wb-quick ${divider ? "with-divider" : ""}" type="button" data-wb-route="${route}" data-wb-query="">
        <span class="wb-quick-icon wb-solid-${tone}">${this.icon(icon)}</span>
        <span>${label}</span>
      </button>
    `;
  },
  bindRoutes() {
    CRMUI.$$("[data-wb-route]").forEach(el => el.addEventListener("click", () => {
      const route = el.dataset.wbRoute;
      if (route) CRMRouter.goto(route, this.parseQuery(el.dataset.wbQuery));
    }));
  },
  parseQuery(q) {
    return Object.fromEntries(new URLSearchParams(q || "").entries());
  },
  icon(name) {
    const paths = {
      message: `<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>`,
      mail: `<path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/>`,
      clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>`,
      userPlus: `<path d="M15 20a6 6 0 0 0-12 0"/><circle cx="9" cy="8" r="4"/><path d="M19 8v6M16 11h6"/>`,
      users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>`,
      file: `<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h3"/>`,
      target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M17 7l3-3M20 4v5M20 4h-5"/>`,
      user: `<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>`,
      userClock: `<path d="M14 20a7 7 0 0 0-12 0"/><circle cx="8" cy="8" r="4"/><circle cx="18" cy="16" r="4"/><path d="M18 14v2l1.5 1"/>`,
      alert: `<path d="M12 3 2 21h20z"/><path d="M12 9v5M12 17h.01"/>`,
      recycle: `<path d="m7 19-3-5h6"/><path d="m17 5 3 5h-6"/><path d="M7 19h10l3-5M17 5H7l-3 5"/>`,
      server: `<rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/><path d="M8 7h.01M8 17h.01"/>`,
      bot: `<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V4M8 12h.01M16 12h.01M9 18v2h6v-2"/>`,
      list: `<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>`,
      chart: `<path d="M4 19h16"/><path d="M7 16v-5M12 16V7M17 16v-9"/><path d="m7 11 5-4 5 2"/>`,
      pie: `<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M12 3a9 9 0 0 1 9 9h-9z"/>`,
      share: `<circle cx="7" cy="12" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="m10 10 4-2M10 14l4 2"/>`,
      tool: `<path d="m14.7 6.3 3 3"/><path d="M4 20l6.5-6.5"/><path d="M19 5a4 4 0 0 1-5.6 5.6L8 16l-4 1 1-4 5.4-5.4A4 4 0 0 1 19 5z"/>`,
      userGlobe: `<path d="M16 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15h8M18 11a6 6 0 0 1 0 8M18 11a6 6 0 0 0 0 8"/>`,
      settings: `<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.2.1-2-3 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3 .2.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h3.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3.4H21a1.7 1.7 0 0 0-1.6 1.3z"/>`
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  },
  localStyles() {
    return `<style>
      .wb-page{display:flex;flex-direction:column;gap:0}
      .wb-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      .wb-title{margin:18px 0 14px}
      .wb-date-filter{display:flex;align-items:center;gap:10px;color:var(--text);font-size:14px;font-weight:650}
      .wb-date-filter select{min-width:180px;height:32px;border:1px solid #d5deeb;border-radius:4px;padding:0 8px;background:#fff}
      .wb-grid{display:grid;gap:14px}
      .wb-grid-5{grid-template-columns:repeat(5,minmax(0,1fr))}
      .wb-grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
      .wb-grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
      .wb-card{position:relative;min-height:132px;padding:18px 18px;background:#fff;border:1px solid #e3e9f2;border-radius:6px;box-shadow:0 8px 18px rgba(16,24,40,.04);cursor:pointer;transition:border-color .16s ease,box-shadow .16s ease}
      .wb-card:hover{border-color:#b8cffd;box-shadow:0 10px 22px rgba(16,24,40,.08)}
      .wb-card-top{height:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
      .wb-card-title{font-size:15px;font-weight:750;color:#121a2b;white-space:nowrap}
      .wb-badge{padding:2px 8px;border-radius:4px;background:#e8f8ef;color:#1f8a44;font-size:12px;font-weight:650;white-space:nowrap}
      .wb-card-body{display:block;margin-top:12px}
      .wb-card-value{font-size:34px;line-height:1;font-weight:850;letter-spacing:0}
      .wb-blue{color:#1263f1}.wb-green{color:#12a538}.wb-orange{color:#ff6b16}.wb-purple{color:#7b4bd8}.wb-cyan{color:#05aeb8}.wb-red{color:#f5222d}.wb-gray{color:#c7ceda}
      .wb-card-link{margin-top:24px;padding:0;border:0;background:transparent;color:#1263f1;font-size:12px;font-weight:650;white-space:nowrap;cursor:pointer}
      .wb-card-link span{margin-left:6px;font-size:18px;vertical-align:-1px}
      .wb-card-icon{position:absolute;right:18px;top:48px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}
      .wb-card-icon svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      .wb-bg-blue{color:#1263f1;background:#eaf1ff}.wb-bg-green{color:#38a638;background:#eaf8e8}.wb-bg-orange{color:#ff6b16;background:#fff0e6}.wb-bg-purple{color:#7b4bd8;background:#f1eafa}.wb-bg-cyan{color:#05aeb8;background:#e6f8f8}.wb-bg-red{color:#f5222d;background:#ffe8ec}.wb-bg-gray{color:#5d6b82;background:#eef1f6}
      .wb-quick-card{display:grid;grid-template-columns:repeat(11,minmax(70px,1fr));align-items:center;gap:0;padding:16px 18px;background:#fff;border:1px solid #e3e9f2;border-radius:6px;box-shadow:0 8px 18px rgba(16,24,40,.04)}
      .wb-quick{position:relative;min-height:82px;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#1f2a3d;font-size:13px;cursor:pointer}
      .wb-quick.with-divider::after{content:"";position:absolute;right:-1px;top:10px;width:1px;height:54px;background:#d5deeb}
      .wb-quick-icon{width:46px;height:46px;border-radius:8px;display:grid;place-items:center;color:#fff;box-shadow:0 8px 16px rgba(18,99,241,.16)}
      .wb-quick-icon svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      .wb-solid-blue{background:#1263f1}.wb-solid-green{background:#32bf5b}.wb-solid-orange{background:#ff7a1a}.wb-solid-purple{background:#8559d8}.wb-solid-gray{background:#8c96a8}
      @media(max-width:1180px){.wb-grid-5{grid-template-columns:repeat(3,minmax(0,1fr))}.wb-grid-4,.wb-grid-3{grid-template-columns:repeat(2,minmax(0,1fr))}.wb-quick-card{grid-template-columns:repeat(6,minmax(80px,1fr))}}
      @media(max-width:760px){.wb-section-head{align-items:flex-start;flex-direction:column;gap:10px}.wb-grid-5,.wb-grid-4,.wb-grid-3,.wb-quick-card{grid-template-columns:1fr}}
    </style>`;
  }
};
