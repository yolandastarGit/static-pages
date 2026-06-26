const PAGE_MODULE_MAP = {
  "workbench": "workbench.html",
  "message-center": "workbench.html",
  "lead-all": "leads.html",
  "lead-pending": "leads.html",
  "lead-invalid": "leads.html",
  "lead-converted": "leads.html",
  "customer-profile": "customers.html",
  "follow-record": "customers.html",
  "contact-management": "customers.html",
  "customer-tag": "customers.html",
  "contract-list": "contracts.html",
  "contract-customer": "contracts.html",
  "communication-desk": "communication.html",
  "communication-email": "communication.html",
  "communication-whatsapp": "communication.html",
  "communication-config": "communication.html",
  "communication-workbench": "communication.html",
  "email-inbox": "communication.html",
  "email-sent": "communication.html",
  "email-drafts": "communication.html",
  "whatsapp-chat": "communication.html",
  "site-management": "system.html",
  "site-owner": "system.html",
  "site-page-management": "system.html",
  "site-form-management": "system.html",
  "site-stat": "system.html",
  "site-seo-analysis": "system.html",
  "channel-config": "system.html",
  "user-management": "system.html",
  "role-management": "system.html",
  "permission-management": "system.html",
  "menu-management": "system.html",
  "data-dictionary": "system.html",
  "param-config": "system.html",
  "system-log": "system.html",
  "data-analysis-hub": "system.html",
  "performance-analysis": "system.html",
  "customer-analysis": "system.html",
  "lead-analysis": "system.html",
  "funnel-analysis": "system.html",
  "communication-analysis": "system.html",
  "team-analysis": "system.html",
  "ai-analysis": "system.html"
};

const CRM_STATE_KEY = "crm_app_state_v1";
const CRM_NAV_OPTS_KEY = "crm_nav_opts_v1";
const CRM_SESSION_EMAIL_KEY = "crm_active_email_v1";
const LOGIN_STORAGE_KEYS = ["login_account", "login_password", "auth_token", "remember_me"];

function setActiveSessionEmail(email){
  try{ sessionStorage.setItem(CRM_SESSION_EMAIL_KEY, String(email || "").trim().toLowerCase()); }catch(e){}
}
function clearActiveSessionEmail(){
  try{
    sessionStorage.removeItem(CRM_SESSION_EMAIL_KEY);
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("login_account");
  }catch(e){}
}
function getActiveSessionUser(){
  try{
    const email = sessionStorage.getItem(CRM_SESSION_EMAIL_KEY);
    if(email){
      const key = String(email).trim().toLowerCase();
      if(reviewAccounts[key]) return reviewAccounts[key];
    }
    const sessToken = sessionStorage.getItem("auth_token");
    if(sessToken){
      const user = resolveSessionFromAuthToken(sessToken, "session");
      if(user) return user;
    }
  }catch(e){}
  const token = localStorage.getItem("auth_token");
  if(token) return resolveSessionFromAuthToken(token, "local");
  return null;
}

function resolvePageId(id){
  if(navRedirects[id]) return navRedirects[id];
  return id;
}

function getModuleForPage(pageId){
  const resolved = resolvePageId(pageId);
  return PAGE_MODULE_MAP[resolved] || PAGE_MODULE_MAP[pageId] || null;
}

function getCurrentModuleFile(){
  return window.CRM_MODULE_FILE || null;
}

function persistCrmState(){
  try{
    const state = {
      currentPage, commView, emailBox, contractView, customerTab, customerDetailTab,
      focusedCustomerIdx, siteScrollTarget, leadPoolTab, myLeadTab, invalidLeadTab,
      messageTab, selectedSiteStat, siteMgmtAdvancedOpen, siteOwnerPreviewSite,
      siteStatPeriod, siteStatAdvancedOpen, siteStatMonth, leadTaskView,
      leadPoolAdvancedOpen, leadTaskAdvancedOpen, leadConvertedAdvancedOpen,
      leadInvalidAdvancedOpen, customerAdvancedOpen, contactAdvancedOpen,
      followAdvancedOpen, tagCategoryFilter, contractAdvancedOpen, contractCustomerAdvancedOpen,
      commWorkbenchAdvancedOpen, emailInboxAdvancedOpen, emailSentAdvancedOpen,
      emailDraftAdvancedOpen, emailActiveIdx, currentMailAccountId, customerEmailActiveIdx,
      whatsappActiveIdx, whatsappFilterOpen, commConfigAdvancedOpen, analysisPeriod,
      analysisSite, analysisAdvancedOpen, funnelSchemeFilter, performanceView,
      userAdvancedOpen, roleAdvancedOpen, selectedRoleIdx, channelAdvancedOpen,
      logAdvancedOpen, listPageSizes, listPageNums, pageListStates,
      leadPoolFilters, leadPoolTagFilter, myLeadTagFilter,
      leadPoolSelected: [...leadPoolSelected], myLeadSelected: [...myLeadSelected],
      leadInvalidSelected: [...leadInvalidSelected], customerSelected: [...customerSelected],
      contactSelected: [...contactSelected], contractSelected: [...contractSelected],
      emailInboxSelected: [...emailInboxSelected], emailDraftSelected: [...emailDraftSelected],
      siteMgmtSelected: [...siteMgmtSelected], siteOwnerSelected: [...siteOwnerSelected],
      userSelected: [...userSelected], channelSelected: [...channelSelected],
      messageReadSet: [...messageReadSet],
      emailCustomerCtx, leadTagEditIdx, leadMarkAbnormalIdx, leadRestoreAbnormalIdx,
      openRowActionMenuId, isAIDrawerOpen, aiResultState, showAIModule
    };
    sessionStorage.setItem(CRM_STATE_KEY, JSON.stringify(state));
  }catch(e){ console.warn("persistCrmState", e); }
}

function restoreCrmState(){
  try{
    const raw = sessionStorage.getItem(CRM_STATE_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    const assign = (k, v)=>{ if(v !== undefined) window[k] = v; };
    [
      "currentPage","commView","emailBox","contractView","customerTab","customerDetailTab",
      "focusedCustomerIdx","siteScrollTarget","leadPoolTab","myLeadTab","invalidLeadTab",
      "messageTab","selectedSiteStat","siteMgmtAdvancedOpen","siteOwnerPreviewSite",
      "siteStatPeriod","siteStatAdvancedOpen","siteStatMonth","leadTaskView",
      "leadPoolAdvancedOpen","leadTaskAdvancedOpen","leadConvertedAdvancedOpen",
      "leadInvalidAdvancedOpen","customerAdvancedOpen","contactAdvancedOpen",
      "followAdvancedOpen","tagCategoryFilter","contractAdvancedOpen","contractCustomerAdvancedOpen",
      "commWorkbenchAdvancedOpen","emailInboxAdvancedOpen","emailSentAdvancedOpen",
      "emailDraftAdvancedOpen","emailActiveIdx","currentMailAccountId","customerEmailActiveIdx",
      "whatsappActiveIdx","whatsappFilterOpen","commConfigAdvancedOpen","analysisPeriod",
      "analysisSite","analysisAdvancedOpen","funnelSchemeFilter","performanceView",
      "userAdvancedOpen","roleAdvancedOpen","selectedRoleIdx","channelAdvancedOpen",
      "logAdvancedOpen","listPageSizes","listPageNums","pageListStates",
      "leadPoolFilters","leadPoolTagFilter","myLeadTagFilter",
      "emailCustomerCtx","leadTagEditIdx","leadMarkAbnormalIdx","leadRestoreAbnormalIdx",
      "openRowActionMenuId","isAIDrawerOpen","aiResultState","showAIModule"
    ].forEach(k=>{ if(s[k] !== undefined) eval(k + " = s[k]"); });
    if(s.leadPoolSelected) leadPoolSelected = new Set(s.leadPoolSelected);
    if(s.myLeadSelected) myLeadSelected = new Set(s.myLeadSelected);
    if(s.leadInvalidSelected) leadInvalidSelected = new Set(s.leadInvalidSelected);
    if(s.customerSelected) customerSelected = new Set(s.customerSelected);
    if(s.contactSelected) contactSelected = new Set(s.contactSelected);
    if(s.contractSelected) contractSelected = new Set(s.contractSelected);
    if(s.emailInboxSelected) emailInboxSelected = new Set(s.emailInboxSelected);
    if(s.emailDraftSelected) emailDraftSelected = new Set(s.emailDraftSelected);
    if(s.siteMgmtSelected) siteMgmtSelected = new Set(s.siteMgmtSelected);
    if(s.siteOwnerSelected) siteOwnerSelected = new Set(s.siteOwnerSelected);
    if(s.userSelected) userSelected = new Set(s.userSelected);
    if(s.channelSelected) channelSelected = new Set(s.channelSelected);
    if(s.messageReadSet) messageReadSet = new Set(s.messageReadSet);
    if(s.aiResultState) aiResultState = s.aiResultState;
    if(s.showAIModule !== undefined) showAIModule = s.showAIModule;
  }catch(e){ console.warn("restoreCrmState", e); }
}

function consumeNavOpts(){
  try{
    const raw = sessionStorage.getItem(CRM_NAV_OPTS_KEY);
    if(!raw) return null;
    sessionStorage.removeItem(CRM_NAV_OPTS_KEY);
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function navToModule(moduleFile, pageId, opts){
  persistCrmState();
  if(opts) sessionStorage.setItem(CRM_NAV_OPTS_KEY, JSON.stringify(opts));
  const q = pageId ? ("?page=" + encodeURIComponent(pageId)) : "";
  window.location.href = moduleFile + q;
}

function renderSidebar(){
  const html = navGroups.map(g=>{
    const items = g.items.filter(([id])=>canAccessPage(id)).map(([id,label,icon])=>
      `<button class="nav-item ${isNavItemActive(id)?"active":""}" onclick="nav('${id}')"><span class="nav-icon">${icon}</span>${getRoleMenuLabel(id,label)}</button>`
    ).join("");
    if(!items) return "";
    return `<div class="nav-group"><div class="nav-title">${getRoleGroupLabel(g.title)}</div>${items}</div>`;
  }).filter(Boolean).join("");
  document.getElementById("sidebar").innerHTML = html || `<div class="empty" style="padding:20px;font-size:12px">暂无可用菜单</div>`;
}
function _navCore(id,opts){
  if(navRedirects[id]){
    if(id.startsWith("email-")) commView="email";
    else if(id==="whatsapp-chat") commView="whatsapp";
    else if(id==="communication-config") commView="config";
    else if(id==="contract-customer") contractView="customer";
    else if(id==="site-owner") siteScrollTarget="site-permissions";
    else if(id==="contact-management") customerTab="contacts";
    else if(id==="customer-tag") customerTab="tags";
    else if(id==="email-inbox") emailBox="inbox";
    else if(id==="email-sent") emailBox="sent";
    else if(id==="email-drafts") emailBox="draft";
    id = navRedirects[id];
  }
  if(!canAccessPage(id)){
    toast(`无权访问该页面`);
    return;
  }
  if(opts&&opts.commView) commView=opts.commView;
  if(opts&&opts.contractView) contractView=opts.contractView;
  if(opts&&opts.emailBox) emailBox=opts.emailBox;
  if(opts&&opts.customerTab) customerTab=opts.customerTab==="360"?"profile":opts.customerTab;
  if(opts&&opts.customerDetailTab) customerDetailTab=opts.customerDetailTab;
  if(opts&&opts.siteMgmtTab) siteScrollTarget=opts.siteMgmtTab==="owner"?"site-permissions":null;
  if(opts&&opts.emailId){ emailCustomerCtx=null; selectEmailById(opts.emailId); }
  if(opts&&opts.chatId) selectChatById(opts.chatId);
  if(opts&&opts.clearEmailCustomerCtx) emailCustomerCtx=null;
  if(opts?.messageId) setTimeout(()=>openMessageItem(opts.messageId),150);
  const commPageViews = {"communication-desk":"desk","communication-email":"email","communication-whatsapp":"whatsapp","communication-config":"config"};
  if(commPageViews[id] && !(opts&&opts.commView)) commView = commPageViews[id];
  if(opts?.commView==="workbench") commView="desk";
  if(commView==="workbench") commView="desk";
  currentPage = id;
  renderSidebar();
  renderPage();
  if(opts?.openCustomer){
    const cidx=datasets.customers.findIndex(c=>c.name===opts.openCustomer);
    if(cidx>=0){
      focusedCustomerIdx=cidx;
      if(opts.customerDetailTab) customerDetailTab=opts.customerDetailTab;
      setTimeout(()=>openDrawer("customers",cidx,{keepDetailTab:true}),150);
    }
  }
  window.scrollTo(0,0);
}
function renderPage(){
  closeRowActionMenu();
  try{
    /* MODULE: message-center - 消息中心 */
    if(currentPage==="message-center"){ renderMessageCenter(); return; }

    /* MODULE: framework - 权限拦截（403） */
    if(!canAccessPage(currentPage)){ renderForbiddenPage(); return; }

    /* MODULE: workbench - 首页工作台 */
    if(currentPage==="workbench"){ renderWorkbench(); return; }

    const meta = pageMeta[currentPage];

    /* MODULE: framework - 未注册 pageId 开发占位 */
    if(!meta) return renderDevelopingPage(currentPage);

    /* --- pageMeta 页面模块路由（renderGeneric → renderCustom） --- */
    switch(currentPage){
      /* MODULE: lead-all - 公海池 */
      case "lead-all":
      /* MODULE: lead-pending - 我的线索 */
      case "lead-pending":
      /* MODULE: lead-invalid - 异常线索 */
      case "lead-invalid":
      /* MODULE: lead-converted - 转化记录 */
      case "lead-converted":
      /* MODULE: site-management - 站点管理 */
      case "site-management":
      /* MODULE: site-page-management - 页面管理 */
      case "site-page-management":
      /* MODULE: site-form-management - 表单管理 */
      case "site-form-management":
      /* MODULE: site-seo-analysis - SEO 分析 */
      case "site-seo-analysis":
      /* MODULE: customer-profile - 客户列表 */
      case "customer-profile":
      /* MODULE: follow-record - 跟进记录 */
      case "follow-record":
      /* MODULE: contract-list - 合同中心 */
      case "contract-list":
      /* MODULE: lead-analysis - 询盘分析 */
      case "lead-analysis":
      /* MODULE: data-analysis-hub - 分析总览 */
      case "data-analysis-hub":
      /* MODULE: customer-analysis - 客户分析 */
      case "customer-analysis":
      /* MODULE: communication-analysis - 沟通分析 */
      case "communication-analysis":
      /* MODULE: team-analysis - 团队分析 */
      case "team-analysis":
      /* MODULE: ai-analysis - AI 洞察 */
      case "ai-analysis":
      /* MODULE: funnel-analysis - 成交分析 */
      case "funnel-analysis":
      /* MODULE: performance-analysis - 销售分析 */
      case "performance-analysis":
      /* MODULE: site-stat - 站点统计 */
      case "site-stat":
      /* MODULE: user-management - 用户管理 */
      case "user-management":
      /* MODULE: role-management - 角色管理 */
      case "role-management":
      /* MODULE: permission-management - 权限管理 */
      case "permission-management":
      /* MODULE: menu-management - 菜单管理 */
      case "menu-management":
      /* MODULE: data-dictionary - 数据字典 */
      case "data-dictionary":
      /* MODULE: param-config - 参数配置 */
      case "param-config":
      /* MODULE: channel-config - 来源管理 */
      case "channel-config":
      /* MODULE: communication-desk - 沟通工作台 */
      case "communication-desk":
      /* MODULE: communication-email - 邮件中心 */
      case "communication-email":
      /* MODULE: communication-whatsapp - WhatsApp */
      case "communication-whatsapp":
      /* MODULE: communication-config - 沟通账号设置 */
      case "communication-config":
      /* MODULE: communication-workbench - 沟通工作台（深链兼容） */
      case "communication-workbench":
      /* MODULE: system-log - 系统日志 */
      case "system-log":
      default: break;
    }
    renderGeneric(meta);
  }catch(err){
    console.error("renderPage error:", currentPage, err);
    renderDevelopingPage(currentPage, "页面渲染异常，已切换为开发占位");
  }finally{
    updateNotifyBadge();
    renderAiConfigDrawer();
    syncAiInsightPanelDom();
  }
}
function switchLoginTab(type,el){
  document.querySelectorAll(".login-tab").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("loginPwd").classList.toggle("hidden",type!=="pwd");
  document.getElementById("loginSso").classList.toggle("hidden",type!=="sso");
  const btn = document.getElementById("loginBtn");
  if(btn) btn.style.display = type==="pwd" ? "" : "none";
  document.getElementById("loginError").classList.remove("show");
  if(type==="sso") initDingTalkQr();
}
function initDingTalkQr(){
  const box = document.getElementById("dingTalkQr");
  if(!box) return;
  box.style.opacity = "0.4";
  box.style.transition = "opacity .25s ease";
  requestAnimationFrame(()=>{ box.style.opacity = "1"; });
}
function renderLoginPage(){
  const el = document.getElementById("loginView");
  if(!el) return;
  el.innerHTML = `<div class="login-shell">
    <section class="login-info" style="display:flex;align-items:center;justify-content:center;padding:42px">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;width:100%">
        <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true" style="display:block">
          <rect width="88" height="88" rx="18" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.28)" stroke-width="1"/>
          <text x="44" y="52" text-anchor="middle" fill="#fff" font-size="26" font-weight="800" font-family="PingFang SC,Microsoft YaHei,Arial,sans-serif">CRM</text>
        </svg>
        <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.02em">苏豪 B2B CRM</span>
      </div>
    </section>
    <section class="login-card">
      <div class="login-brand"><div class="brand-mark">CRM</div><span>系统登录</span></div>
      <div class="login-tabs">
        <button type="button" class="login-tab active" onclick="switchLoginTab('pwd',this)">账号密码</button>
        <button type="button" class="login-tab" onclick="switchLoginTab('sso',this)">钉钉登录</button>
      </div>
      <div class="login-pane" id="loginPwd">
        <div class="login-field"><label>登录账号</label><input id="loginEmail" type="email" placeholder="work@sutex.net.cn" autocomplete="username"></div>
        <div class="login-field"><label>登录密码</label><input id="loginPassword" type="password" placeholder="请输入密码" autocomplete="current-password"></div>
        <div class="login-row"><label><input type="checkbox" id="rememberMe"> 记住账号</label><a href="javascript:void(0)" onclick="toast('请联系管理员重置密码')">忘记密码</a></div>
      </div>
      <div class="login-pane hidden" id="loginSso">
        <div class="qr-box" id="dingTalkQr" role="img" aria-label="钉钉登录二维码"></div>
        <div class="login-note">请使用钉钉 App 扫描上方二维码登录<br><a href="javascript:void(0)" onclick="initDingTalkQr();toast('二维码已刷新')">刷新二维码</a></div>
        <button type="button" class="login-sso" style="margin-top:14px" onclick="enterApp()">模拟扫码成功（演示）</button>
      </div>
      <div class="login-error" id="loginError">邮箱或密码错误，请重新输入</div>
      <button type="button" class="login-submit" id="loginBtn" onclick="doLogin()">登 录</button>
      <p style="margin-top:20px;font-size:11px;color:var(--soft);line-height:1.7;text-align:center">演示账号（密码均为 123456）：admin@sutex.net.cn · operator@sutex.net.cn · seller@sutex.net.cn · collab@sutex.net.cn · guest@sutex.net.cn<br><span style="font-size:10px;color:#b0bac9">不同账号对应不同角色权限，登录后自动生效</span></p>
    </section>
  </div>`;
  applyRememberedLoginForm();
}
function clearLoginStorage(){
  LOGIN_STORAGE_KEYS.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
}
function createAuthToken(email){
  return "tok_"+String(email||"").trim().toLowerCase();
}
function resolveSessionFromAuthToken(token, scope){
  if(!token) return null;
  const email = token.startsWith("tok_")
    ? token.slice(4)
    : (scope === "session" ? sessionStorage.getItem("login_account") : null) || localStorage.getItem("login_account");
  if(!email) return null;
  const key = String(email).trim().toLowerCase();
  if(reviewAccounts[key]) return reviewAccounts[key];
  const dsUser = typeof datasets !== "undefined" && datasets.users
    ? datasets.users.find(u => u.account.toLowerCase() === key)
    : null;
  if(dsUser && dsUser.state !== "冻结"){
    if(typeof syncReviewAccountFromUser === "function") syncReviewAccountFromUser(dsUser);
    return reviewAccounts[key] || (typeof buildSessionUserFromDataset === "function" ? buildSessionUserFromDataset(dsUser) : null);
  }
  return null;
}
function resolvePasswordLogin(emailKey, password){
  const key = String(emailKey || "").trim().toLowerCase();
  const pwd = String(password || "");
  const legacy = reviewAccounts[key];
  if(legacy && pwd === "123456") return { session: legacy, email: key };
  const dsUser = typeof datasets !== "undefined" && datasets.users
    ? datasets.users.find(u => u.account.toLowerCase() === key)
    : null;
  if(!dsUser) return null;
  if(dsUser.state === "冻结") return { frozen: true };
  if(pwd !== (dsUser.password || "123456")) return null;
  if(typeof syncReviewAccountFromUser === "function") syncReviewAccountFromUser(dsUser);
  return {
    session: reviewAccounts[key] || (typeof buildSessionUserFromDataset === "function" ? buildSessionUserFromDataset(dsUser) : null),
    email: key
  };
}
function persistLoginCredentials(email,remember){
  const acct = String(email || "").trim().toLowerCase();
  const token = createAuthToken(acct);
  try{
    sessionStorage.setItem("auth_token", token);
    sessionStorage.setItem("login_account", acct);
    if(remember){
      localStorage.setItem("remember_me", "1");
      localStorage.setItem("login_account", acct);
      localStorage.setItem("auth_token", token);
    }else{
      localStorage.removeItem("remember_me");
      localStorage.removeItem("login_account");
      localStorage.removeItem("auth_token");
    }
    localStorage.removeItem("login_password");
  }catch(e){}
}
function applyRememberedLoginForm(){
  if(localStorage.getItem("remember_me")!=="1") return;
  const emailEl=document.getElementById("loginEmail");
  const pwdEl=document.getElementById("loginPassword");
  const rememberEl=document.getElementById("rememberMe");
  const account=localStorage.getItem("login_account");
  if(emailEl&&account) emailEl.value=account;
  if(rememberEl) rememberEl.checked=true;
  if(!localStorage.getItem("auth_token")){
    const pwd=localStorage.getItem("login_password");
    if(pwdEl&&pwd) pwdEl.value=pwd;
  }
}
function tryAutoLoginFromStorage(){
  const acct = getActiveSessionUser();
  if(!acct) return false;
  sessionUser = acct;
  enterApp();
  return true;
}
function doLogin(){
  const email = document.getElementById("loginEmail");
  const pwd = document.getElementById("loginPassword");
  const rememberEl = document.getElementById("rememberMe");
  const err = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  if(!email || !pwd || !err || !btn) return;
  err.classList.remove("show"); email.classList.remove("err"); pwd.classList.remove("err");
  if(!email.value.trim() || !pwd.value.trim()){
    err.textContent = "请输入邮箱和密码"; err.classList.add("show");
    if(!email.value.trim()) email.classList.add("err");
    if(!pwd.value.trim()) pwd.classList.add("err");
    return;
  }
  btn.innerHTML = '<span class="spinner"></span> 登录中...'; btn.classList.add("loading");
  setTimeout(()=>{
    btn.innerHTML = "登 录"; btn.classList.remove("loading");
    const emailKey = email.value.trim().toLowerCase();
    const login = resolvePasswordLogin(emailKey, pwd.value);
    if(login?.frozen){
      err.textContent = "系统账号已冻结，无法登录。"; err.classList.add("show"); pwd.classList.add("err"); pwd.value = ""; pwd.focus();
      return;
    }
    if(login?.session){
      sessionUser = login.session;
      setActiveSessionEmail(login.email);
      persistLoginCredentials(login.email, !!rememberEl?.checked);
      enterApp();
    } else {
      err.textContent = "邮箱或密码错误，请重新输入"; err.classList.add("show"); pwd.classList.add("err"); pwd.value = ""; pwd.focus();
    }
  },500);
}
function enterApp(){
  const emailKey = sessionStorage.getItem(CRM_SESSION_EMAIL_KEY)
    || Object.keys(reviewAccounts).find(k => reviewAccounts[k] === sessionUser);
  if(emailKey){
    setActiveSessionEmail(emailKey);
    if(!sessionStorage.getItem("auth_token")){
      persistLoginCredentials(emailKey, localStorage.getItem("remember_me") === "1");
    }
  }
  persistCrmState();
  const mod = getModuleForPage(currentPage || "workbench") || "workbench.html";
  if(!window.CRM_MODULE_FILE){
    window.location.href = mod + "?page=" + encodeURIComponent(currentPage || "workbench");
    return;
  }
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appView").style.display = "block";
  applySessionUser();
  renderSidebar();
  renderPage();
  updateNotifyBadge();
  toast(`欢迎，${sessionUser.name}`);
}
function logout(){
  try{
    clearLoginStorage();
    clearActiveSessionEmail();
    sessionStorage.removeItem(CRM_STATE_KEY);
    sessionStorage.removeItem(CRM_NAV_OPTS_KEY);
  }catch(e){ console.warn("logout", e); }
  window.location.href = "index.html?logout=1";
}
function nav(id, opts){
  let targetId = id;
  if(navRedirects[targetId]) targetId = navRedirects[targetId];
  const targetModule = getModuleForPage(targetId);
  const currentModule = getCurrentModuleFile();
  if(targetModule && currentModule && targetModule !== currentModule){
    _applyNavOptsBeforeRedirect(id, opts);
    navToModule(targetModule, id, opts);
    return;
  }
  _navCore(id, opts);
}

function _applyNavOptsBeforeRedirect(id, opts){
  if(!opts) return;
  if(opts.commView) commView = opts.commView;
  if(opts.contractView) contractView = opts.contractView;
  if(opts.emailBox) emailBox = opts.emailBox;
  if(opts.customerTab) customerTab = opts.customerTab === "360" ? "profile" : opts.customerTab;
  if(opts.customerDetailTab) customerDetailTab = opts.customerDetailTab;
  if(opts.siteMgmtTab) siteScrollTarget = opts.siteMgmtTab === "owner" ? "site-permissions" : null;
  if(id.startsWith("email-")) commView = "email";
  else if(id === "whatsapp-chat") commView = "whatsapp";
  else if(id === "communication-config") commView = "config";
  else if(id === "contract-customer") contractView = "customer";
  else if(id === "site-owner") siteScrollTarget = "site-permissions";
  else if(id === "contact-management") customerTab = "contacts";
  else if(id === "customer-tag") customerTab = "tags";
  else if(id === "email-inbox") emailBox = "inbox";
  else if(id === "email-sent") emailBox = "sent";
  else if(id === "email-drafts") emailBox = "draft";
}

function bootstrapModulePage(defaultPage){
  restoreCrmState();
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page");
  const navOpts = consumeNavOpts() || {};
  const acct = getActiveSessionUser();
  if(!acct){
    window.location.href = "index.html";
    return;
  }
  sessionUser = acct;
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appView").style.display = "block";
  applySessionUser();
  applyAIModuleVisibility();
  const pageId = pageParam || currentPage || defaultPage;
  _navCore(pageId, navOpts);
  updateNotifyBadge();
}

function bootstrapLoginPage(){
  window.CRM_MODULE_FILE = null;
  const params = new URLSearchParams(window.location.search);
  const isLogout = params.get("logout") === "1";
  renderLoginPage();
  document.getElementById("loginView").style.display = "flex";
  document.getElementById("appView").style.display = "none";
  document.addEventListener("keydown",e=>{
    if(e.key !== "Enter" || document.getElementById("loginView").style.display === "none") return;
    const ssoPane = document.getElementById("loginSso");
    if(ssoPane && !ssoPane.classList.contains("hidden")) return;
    doLogin();
  });
  if(!isLogout && tryAutoLoginFromStorage()){
    return;
  }
  applyAIModuleVisibility();
  if(isLogout){
    try{ history.replaceState(null, "", "index.html"); }catch(e){}
    toast("已安全退出");
  }
}

function toast(msg){ const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2400); }
