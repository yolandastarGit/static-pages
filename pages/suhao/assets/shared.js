/* V4 架构：按业务对象组织菜单，非按功能碎片。已合并页面通过 nav() 重定向保留深链兼容。 */
const navGroups = [
  {title:"工作台",items:[["workbench","首页看板","□"]]},
  {title:"线索中心",items:[["lead-all","公海池","▽"],["lead-pending","我的线索","!"],["lead-invalid","异常线索","×"],["follow-record","跟进日志","◷"]]},
  {title:"客户中心",items:[["customer-profile","客户列表","◉"]]},
  {title:"标签管理",items:[["customer-tag","标签管理","◇"]]},
  {title:"合同中心",items:[["contract-list","合同中心","▣"]]},
  {title:"沟通中心",items:[["communication-desk","沟通工作台","▤"],["communication-email","邮件","✉"],["communication-whatsapp","WhatsApp","◈"],["communication-config","账号设置","⚙"]]},
  {title:"站点中心",items:[["site-management","站点管理","◎"],["site-page-management","页面管理","▣"],["site-form-management","表单管理","▤"],["channel-config","来源管理","⌬"]]},
  {title:"数据分析",items:[["data-analysis-hub","数据总览","▰"],["performance-analysis","销售分析","▤"],["customer-analysis","客户分析","◉"],["lead-analysis","询盘分析","▧"],["funnel-analysis","成交分析","▾"],["team-analysis","运营分析","☷"]]},
  {title:"系统管理",items:[["user-management","用户管理","☷"],["role-management","角色管理","⚇"],["permission-management","权限管理","⚿"],["menu-management","菜单管理","☰"],["data-dictionary","数据字典","▦"],["param-config","参数配置","⚙"],["system-log","系统日志","≡"]]}
];
const COMM_CENTER_PAGES = ["communication-desk","communication-email","communication-whatsapp","communication-config"];
function isCommCenterPage(pageId){ return COMM_CENTER_PAGES.includes(pageId||currentPage); }
const SITE_CENTER_PAGES = ["site-management","site-page-management","site-form-management","channel-config"];
const DATA_ANALYSIS_PAGES = ["data-analysis-hub","performance-analysis","customer-analysis","lead-analysis","funnel-analysis","team-analysis"];
const CRM_PHASE1_INQUIRY_SOURCES = ["邮件","WhatsApp","官网","展会","手动录入"];
const CRM_INQUIRY_SOURCE_MAP = {
  "邮件":["邮件营销","自然询盘","邮件"],
  "WhatsApp":["WhatsApp"],
  "官网":["官网询盘","SEM广告","网站表单"],
  "展会":["展会"],
  "手动录入":["其他","客户转介绍","手动录入","接口拉取"]
};
const SYSTEM_ADMIN_PAGES = ["user-management","role-management","permission-management","menu-management","data-dictionary","param-config","system-log"];
const navRedirects = {
  "contact-management":"customer-profile",
  "customer-tag":"customer-profile",
  "contract-customer":"contract-list",
  "communication-workbench":"communication-desk",
  "email-inbox":"communication-email",
  "email-sent":"communication-email",
  "email-drafts":"communication-email",
  "whatsapp-chat":"communication-whatsapp",
  "site-owner":"site-management"
};

let isAIDrawerOpen = false;
let showAIModule = false;
let aiResultState = { status: "idle", lastRunAt: null, pageId: null, result: null };

const AI_PROVIDERS=[
  {id:"openai",name:"OpenAI",models:["gpt-4o","gpt-4o-mini","gpt-4-turbo"],endpoint:"https://api.openai.com/v1"},
  {id:"azure",name:"Azure OpenAI",models:["gpt-4o","gpt-35-turbo"],endpoint:""},
  {id:"anthropic",name:"Anthropic",models:["claude-3-5-sonnet","claude-3-haiku"],endpoint:"https://api.anthropic.com/v1"},
  {id:"qwen",name:"通义千问",models:["qwen-max","qwen-plus","qwen-turbo"],endpoint:"https://dashscope.aliyuncs.com/compatible-mode/v1"},
  {id:"ernie",name:"文心一言",models:["ernie-4.0","ernie-3.5"],endpoint:""},
  {id:"custom",name:"自定义兼容接口",models:["自定义模型"],endpoint:""}
];
const DEFAULT_AI_CONFIG={
  enabled:true,
  status:"enabled",
  provider:"openai",
  apiKey:"sk-demo-production-config",
  model:"gpt-4o",
  endpoint:"https://api.openai.com/v1",
  lastTestAt:"2026-06-16 08:00",
  lastTestResult:"success",
  lastError:"",
  configuredAt:"2026-06-16 08:00",
  quotaUsed:128,
  quotaLimit:10000,
  usageLog:[{time:"2026-06-16 08:00",module:"ai-analysis",action:"全局分析",model:"gpt-4o"}]
};
function getAiConfig(){ return datasets.aiConfig||(datasets.aiConfig={...DEFAULT_AI_CONFIG}); }
const AI_CONFIG_STORAGE_KEY = "crm_ai_config_v2";
function persistAiConfig(){
  try{
    sessionStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify({
      ...getAiConfig(),
      aiAnalysisResult: datasets.aiAnalysisResult || aiResultState.result || null
    }));
  }catch(e){ console.warn("persistAiConfig", e); }
}
function restoreAiConfigFromStorage(){
  try{
    Object.assign(datasets.aiConfig, {...DEFAULT_AI_CONFIG, ...datasets.aiConfig});
    const raw = sessionStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if(!raw) return;
    const stored = JSON.parse(raw);
    if(!stored || typeof stored !== "object") return;
    const {aiAnalysisResult,...cfg} = stored;
    Object.assign(datasets.aiConfig, {...DEFAULT_AI_CONFIG, ...cfg});
    if(aiAnalysisResult){
      datasets.aiAnalysisResult = aiAnalysisResult;
      aiResultState.result = aiAnalysisResult;
      aiResultState.status = "ready";
      aiResultState.pageId = aiAnalysisResult.meta?.pageId || aiResultState.pageId;
    }
  }catch(e){ console.warn("restoreAiConfig", e); }
}
function syncAiRuntimeState(){
  showAIModule = canUseAiFeature();
  persistAiConfig();
  applyAIModuleVisibility();
  if(typeof persistCrmState === "function") persistCrmState();
}
function renderAiConnectedStatusBar(){
  return "";
}
function getAiStatus(){
  return getAiConfig().status||"disabled";
}
function isAiConfigured(){
  const c=getAiConfig();
  return !!(c.provider&&c.apiKey&&c.model);
}
function canUseAiFeature(){
  const c=getAiConfig();
  return c.enabled===true&&c.status==="enabled"&&isAiConfigured();
}
function aiStatusLabel(s){ return {disabled:"未启用",enabled:"已启用",error:"异常",quota:"额度不足"}[s]||s; }
function aiStatusTagCls(s){ return {disabled:"gray",enabled:"green",error:"red",quota:"warn"}[s]||"gray"; }
function aiProviderName(id){ return AI_PROVIDERS.find(p=>p.id===id)?.name||id||"—"; }
function collectAIPageData(pageId){
  const pid=pageId||currentPage||"ai-analysis";
  const leads=datasets.leads.filter(isActiveLead);
  const poolLeads=leads.filter(isPublicPoolLead);
  const aClassLeads=leads.filter(l=>l.score==="A类");
  const overdueTasks=(typeof getTaskRows==="function"?getTaskRows():datasets.tasks).filter(t=>isTaskOverdue(t.overdue));
  const preCrmEmails=getEmailInboxRows().filter(e=>e.convertMode==="未入库"||e.convertMode==="待确认转线索");
  const preCrmChats=getChatRows().filter(c=>c.convertMode==="未入库");
  const invalidLeads=typeof getInvalidLeadRows==="function"?getInvalidLeadRows():leads.filter(isAbnormalLead);
  const commPending=getCommDeskRows().filter(r=>r.pending);
  const intelKeys=Object.keys(datasets.leadIntelligence||{});
  const highIntel=leads.filter(l=>{
    const intel=getLeadIntelligence(l);
    return intel&&(intel.valueScore>=85||intel.worthFollow!==false&&intel.valueScore>=70);
  });
  const highIntentLeads=leads.filter(l=>getLeadIntentLevel(l)==="高意向");
  return {
    pageId:pid,
    leads,
    poolLeads,
    aClassLeads,
    highIntentLeads,
    overdueTasks,
    preCrmEmails,
    preCrmChats,
    invalidLeads,
    commPending,
    highIntel,
    expiringPool:poolLeads.filter(isExpiringPoolLead),
    intelCount:intelKeys.length,
    contractCount:datasets.contracts.length,
    contractTotalAmount:formatContractTotalAmount(datasets.contracts),
    activeContracts:datasets.contracts.filter(c=>displayContractState(c.state,c)==="生效中").length,
    completedContracts:datasets.contracts.filter(c=>displayContractState(c.state,c)==="已完成").length
  };
}
function clearAiResultState(){
  aiResultState={status:"disabled",lastRunAt:null,pageId:currentPage,result:null};
  datasets.aiAnalysisResult=null;
}
function setAiResultState(patch){
  aiResultState={...aiResultState,...patch};
  if(patch.result!==undefined) datasets.aiAnalysisResult=patch.result;
  if(canUseAiFeature()) persistAiConfig();
}
const AI_ENGINE={
  run(config,pageData){
    config=config||getAiConfig();
    if(!config.enabled||config.status!=="enabled"||!isAiConfigured()){
      clearAiResultState();
      return null;
    }
    const data=pageData||collectAIPageData(currentPage);
    setAiResultState({status:"running",pageId:data.pageId});
    const insights=[];
    const recommendations=[];
    const riskNotes=[];
    if(data.highIntentLeads?.length){
      const ids=data.highIntentLeads.slice(0,3).map(l=>l.id).join("、");
      insights.push(`可见范围内共 ${data.highIntentLeads.length} 条高意向线索（${ids}${data.highIntentLeads.length>3?" 等":""}），建议优先分配跟进。`);
    }
    if(data.poolLeads.length)
      insights.push(`公海池 ${data.poolLeads.length} 条待分配线索，${data.expiringPool.length} 条已进入超时/即将过期窗口。`);
    if(data.preCrmEmails.length||data.preCrmChats.length)
      insights.push(`沟通渠道待入库：邮件 ${data.preCrmEmails.length} 封、WhatsApp ${data.preCrmChats.length} 条，尚未进入 CRM 跟进流程。`);
    if(data.intelCount)
      insights.push(`Lead Intelligence 已生成 ${data.intelCount} 条线索画像，其中 ${data.highIntel.length} 条判定为高价值跟进对象。`);
    const validRate=data.leads.length?Math.round((data.leads.length-data.invalidLeads.length)/data.leads.length*100):0;
    insights.push(`当前可见有效线索 ${data.leads.length} 条（有效率约 ${validRate}%），已录入合同 ${data.contractCount} 份（生效中 ${data.activeContracts} / 已完成 ${data.completedContracts}），累计金额 ${data.contractTotalAmount}。`);
    if(data.overdueTasks.length){
      const sample=data.overdueTasks[0];
      recommendations.push(`优先处理 ${data.overdueTasks.length} 项超期任务：${sample?.customer||sample?.lead||sample?.id||"—"}（${sample?.task||"跟进"}）。`);
    }
    if(data.preCrmEmails.length)
      recommendations.push(`确认 ${data.preCrmEmails.length} 封待识别来件（${data.preCrmEmails.slice(0,2).map(e=>e.subject||e.id).join("；")}），建议 24 小时内转线索或分配。`);
    const poolHigh=data.highIntentLeads?.filter(isPublicPoolLead)||[];
    if(poolHigh.length)
      recommendations.push(`公海池 ${poolHigh.length} 条高意向线索待分配，建议运营推送业务员优先处理。`);
    if(data.commPending.length)
      recommendations.push(`沟通工作台 ${data.commPending.length} 条待处理会话，按 AI 优先级排序可缩短首响时间。`);
    if(!recommendations.length)
      recommendations.push(`当前无紧急积压，建议维持跟进节奏并持续启用来件 AI 识别。`);
    if(data.invalidLeads.length)
      riskNotes.push(`${data.invalidLeads.length} 条异常/无效线索待处理，需定期归档以免污染公海池统计。`);
    if(data.expiringPool.length)
      riskNotes.push(`${data.expiringPool.length} 条公海线索进入时长偏高，存在超时释放或流失风险。`);
    data.overdueTasks.slice(0,3).forEach(t=>{
      riskNotes.push(`超期任务 ${t.id}：${t.customer||t.lead} · ${t.task}（负责人 ${t.owner}）。`);
    });
    datasets.leads.filter(l=>(l.next||"").includes("超期")||(l.age||"").includes("超期")).slice(0,2).forEach(l=>{
      if(!riskNotes.some(n=>n.includes(l.id))) riskNotes.push(`线索 ${l.id}（${l.name}）跟进超期，阶段 ${l.stage}。`);
    });
    if(!riskNotes.length)
      riskNotes.push(`未发现高风险积压；建议持续监控公海超时与来件积压指标。`);
    const analyzedAt=new Date().toISOString().slice(0,16).replace("T"," ");
    const result={
      insights,
      recommendations,
      riskNotes,
      meta:{
        model:config.model,
        provider:config.provider,
        providerName:aiProviderName(config.provider),
        analyzedAt,
        pageId:data.pageId,
        dataPoints:{
          leads:data.leads.length,
          pool:data.poolLeads.length,
          aClass:data.aClassLeads.length,
          preCrm:data.preCrmEmails.length+data.preCrmChats.length,
          overdueTasks:data.overdueTasks.length,
          commPending:data.commPending.length
        }
      }
    };
    if(!config.usageLog) config.usageLog=[];
    config.usageLog.unshift({time:analyzedAt,module:data.pageId,action:"全局分析",model:config.model});
    config.quotaUsed=(config.quotaUsed||0)+1;
    setAiResultState({status:"ready",lastRunAt:analyzedAt,pageId:data.pageId,result});
    return result;
  }
};
function runAIAnalysis(config,pageData){
  return AI_ENGINE.run(config,pageData);
}
function refreshAiAnalysis(){
  if(!canUseAiFeature()){ toast("请先完成并启用 AI 配置"); openAiConfigPage(); return; }
  const result=AI_ENGINE.run(getAiConfig(),collectAIPageData(currentPage));
  if(!result){ toast("AI 分析未能生成结果"); return; }
  syncAiRuntimeState();
  toast(`AI 分析已完成 · ${aiProviderName(getAiConfig().provider)} · ${getAiConfig().model||"—"}`);
  renderPage();
}
function applyAIModuleVisibility(){
  showAIModule = canUseAiFeature();
  document.documentElement.classList.toggle("ai-module-hidden",!showAIModule);
}
function renderAiInsightPanel(){
  if(!canUseAiFeature()) return "";
  return renderAiInsightPanelHtml();
}
function renderAiInsightPanelHtml(){
  if(!showAIModule) return "";
  if(!canUseAiFeature()) return "";
  const r=aiResultState.result;
  if(aiResultState.status==="running")
    return `<section class="panel ai-insight-panel-wrap"><div class="panel-body"><div class="ai-insight-panel loading">AI 引擎正在分析当前业务数据…</div></div></section>`;
  if(!r) return "";
  return `<section class="panel ai-insight-panel-wrap"><div class="panel-head"><div class="panel-title">◈ AI 分析结果</div><span style="font-size:11px;color:var(--soft)">${r.meta.providerName} · ${r.meta.model} · ${r.meta.analyzedAt}</span></div><div class="panel-body"><div class="ai-insight-panel">
    <div class="ai-insight-block"><div class="ai-insight-block-title">洞察 · Insights</div><ul class="ai-insight-list">${r.insights.map(i=>`<li>${i}</li>`).join("")}</ul></div>
    <div class="ai-insight-block"><div class="ai-insight-block-title">建议 · Recommendations</div><ul class="ai-insight-list recommend">${r.recommendations.map(i=>`<li>${i}</li>`).join("")}</ul></div>
    <div class="ai-insight-block"><div class="ai-insight-block-title">风险提示 · Risk Notes</div><ul class="ai-insight-list risk">${r.riskNotes.map(i=>`<li>${i}</li>`).join("")}</ul></div>
  </div></div></section>`;
}
function syncAiInsightPanelDom(){
  applyAIModuleVisibility();
  const host=document.getElementById("aiInsightPanelHost");
  if(!host) return;
  if(!showAIModule){ host.innerHTML=""; return; }
  const inlinePages=["param-config","ai-analysis"];
  let html="";
  if(canUseAiFeature()&&!inlinePages.includes(currentPage)){
    html=aiResultState.result?renderAiInsightPanelHtml():"";
  }
  host.innerHTML=html;
}
function syncAiAnalysisOnPageLoad(){
  const cfg=getAiConfig();
  if(!cfg.enabled||cfg.status!=="enabled"||!isAiConfigured()) return;
  if(!["ai-analysis","param-config"].includes(currentPage)) return;
  if(aiResultState.pageId===currentPage&&aiResultState.result) return;
  AI_ENGINE.run(cfg,collectAIPageData(currentPage));
}
function aiFormFieldId(name, inDrawer){ return inDrawer ? `drawer-${name}` : name; }
function getAiFormEl(name){
  if(isAIDrawerOpen){
    const drawerEl=document.getElementById(aiFormFieldId(name,true));
    if(drawerEl) return drawerEl;
  }
  return document.getElementById(name);
}
function setIsAIDrawerOpen(open){
  isAIDrawerOpen=!!open;
  if(!isAIDrawerOpen) cleanupAiDrawerState();
  renderAiConfigDrawer();
}
function closeAiConfigDrawer(e){
  if(!e||e.target.id==="aiDrawerMask") setIsAIDrawerOpen(false);
}
function cleanupAiDrawerState(){
  const body=document.getElementById("aiDrawerBody");
  if(body) body.innerHTML="";
}
function renderAiConfigDrawer(){
  const mask=document.getElementById("aiDrawerMask");
  const body=document.getElementById("aiDrawerBody");
  if(!mask||!body) return;
  mask.classList.toggle("open",isAIDrawerOpen);
  mask.setAttribute("aria-hidden",isAIDrawerOpen?"false":"true");
  if(isAIDrawerOpen){
    body.innerHTML=renderAiConfigFormHtml({inDrawer:true});
    document.body.classList.add("ai-drawer-open");
  }else{
    cleanupAiDrawerState();
    document.body.classList.remove("ai-drawer-open");
  }
}
function renderAiConfigFormHtml(opts={}){
  const inDrawer=!!opts.inDrawer;
  const cfg=getAiConfig();
  const st=getAiStatus();
  const canWrite=currentRole==="管理员";
  const providerOpts=AI_PROVIDERS.map(p=>`<option value="${p.id}" ${cfg.provider===p.id?"selected":""}>${p.name}</option>`).join("");
  const curProvider=AI_PROVIDERS.find(p=>p.id===cfg.provider)||AI_PROVIDERS[0];
  const modelOpts=(curProvider?.models||["gpt-4o"]).map(m=>`<option ${cfg.model===m?"selected":""}>${m}</option>`).join("");
  const fid=k=>aiFormFieldId(k,inDrawer);
  return `<div class="ai-config-panel"${inDrawer?"":" id=\"aiConfigPanel\""}>
    <div class="ai-config-head">
      <div>${inDrawer?"":`<h3>AI 能力配置</h3>`}<div style="font-size:12px;color:var(--muted);margin-top:${inDrawer?0:4}px">管理 AI 服务商、模型与 API 参数；当前环境已接入生产模型服务。</div></div>
      <div class="ai-config-status">当前状态 ${tag(aiStatusLabel(st))}</div>
    </div>
    <div class="form-grid">
      <div class="field"><label>AI 服务商 <span style="color:var(--danger)">*</span></label><select id="${fid("aiProvider")}" ${canWrite?"":"disabled"} onchange="onAiProviderChange(this)"><option value="">请选择</option>${providerOpts}</select></div>
      <div class="field"><label>模型 <span style="color:var(--danger)">*</span></label><select id="${fid("aiModel")}" ${canWrite?"":"disabled"}>${modelOpts}</select></div>
      <div class="field span-2"><label>API Key <span style="color:var(--danger)">*</span></label><input id="${fid("aiApiKey")}" type="password" placeholder="sk-..." value="${cfg.apiKey?("••••••"+cfg.apiKey.slice(-4)):""}" ${canWrite?"":"readonly"}></div>
      <div class="field span-2"><label>API Endpoint</label><input id="${fid("aiEndpoint")}" placeholder="留空则使用服务商默认地址" value="${cfg.endpoint||""}" ${canWrite?"":"readonly"}></div>
      <div class="field"><label>启用 AI 增强能力</label><label class="lead-tag-filter-item" style="margin-top:6px"><input type="checkbox" id="${fid("aiEnabledToggle")}" ${cfg.enabled?"checked":""} ${canWrite?"":"disabled"}><span>完成配置并测试通过后开启</span></label></div>
      <div class="field"><label>本月用量</label><input readonly value="${cfg.quotaUsed||0} / ${cfg.quotaLimit||10000} 次"></div>
    </div>
    ${canWrite?`<div class="toolbar-actions" style="margin-top:12px;flex-wrap:wrap;gap:8px"><button type="button" class="btn" onclick="testAiConnection()">测试连接并启用</button><button type="button" class="btn primary" onclick="saveAiConfigFromForm()">保存配置</button>${cfg.enabled?`<button type="button" class="btn danger" onclick="disableAiCapability()">关闭 AI 能力</button>`:""}${inDrawer?`<button type="button" class="btn" onclick="setIsAIDrawerOpen(false)">取消</button>`:""}</div>`:`<p style="font-size:12px;color:var(--soft);margin-top:10px">仅管理员可配置 AI 能力</p>${inDrawer?`<div class="toolbar-actions" style="margin-top:10px"><button type="button" class="btn" onclick="setIsAIDrawerOpen(false)">关闭</button></div>`:""}`}
    <div class="ai-config-meta">
      ${cfg.configuredAt||cfg.provider?`最近配置：${cfg.configuredAt||"—"} · 服务商 ${aiProviderName(cfg.provider)} · 模型 ${cfg.model||"—"}`:""}
      ${cfg.lastTestAt?`<br>最近测试：${cfg.lastTestAt} · ${cfg.lastTestResult==="success"?"连接正常":cfg.lastError||"失败"}`:""}
      ${cfg.enabled&&cfg.model?`<br>AI 生成内容将记录：生成时间、使用模型（${cfg.model}）、操作人/模块来源`:""}
    </div>
  </div>`;
}
function openAiConfigPage(){
  if(currentPage==="param-config"){
    setTimeout(()=>{ document.getElementById("aiConfigPanel")?.scrollIntoView({behavior:"smooth",block:"start"}); },120);
    return;
  }
  setIsAIDrawerOpen(true);
}
function aiDisabledPlaceholder(){
  return "";
}
function aiErrorPlaceholder(msg){
  return `<div class="ai-gate-placeholder error"><strong>AI 服务异常</strong><p>${msg||getAiConfig().lastError||"请检查 API 配置与网络连接"}</p>${currentRole==="管理员"?`<button type="button" class="btn small primary" onclick="openAiConfigPage()">检查配置</button>`:""}</div>`;
}
function aiQuotaPlaceholder(){
  const c=getAiConfig();
  return `<div class="ai-gate-placeholder warn"><strong>AI 额度不足</strong><p>本月已用 ${c.quotaUsed||0} / ${c.quotaLimit||10000} 次，请联系管理员扩容或等待下个计费周期。</p>${currentRole==="管理员"?`<button type="button" class="btn small" onclick="openAiConfigPage()">查看配置</button>`:""}</div>`;
}
function renderAiGateContent(enabledHtml,opts={}){
  const st=getAiStatus();
  if(st==="quota") return aiQuotaPlaceholder();
  if(st==="error") return aiErrorPlaceholder();
  return typeof enabledHtml==="function"?enabledHtml():enabledHtml;
}
function aiInsightPanelShell(title,inner){
  return `<aside class="context-panel comm-intel-panel"><div class="context-head">◈ ${title}</div><div class="context-body ci-body">${inner}</div></aside>`;
}
function testAiConnection(){
  const provider=getAiFormEl("aiProvider")?.value;
  const apiKey=getAiFormEl("aiApiKey")?.value?.trim();
  const model=getAiFormEl("aiModel")?.value;
  if(!provider||!apiKey||!model){ toast("请先填写 AI 服务商、API Key 与模型"); return; }
  toast("正在测试 AI 连接…");
  setTimeout(()=>{
    const c=getAiConfig();
    c.provider=provider; c.apiKey=apiKey; c.model=model;
    c.endpoint=getAiFormEl("aiEndpoint")?.value?.trim()||AI_PROVIDERS.find(p=>p.id===provider)?.endpoint||"";
    c.lastTestAt=new Date().toISOString().slice(0,16).replace("T"," ");
    c.lastTestResult="success"; c.lastError=""; c.status="enabled"; c.enabled=true;
    c.configuredAt=c.configuredAt||c.lastTestAt;
    const toggle=getAiFormEl("aiEnabledToggle");
    if(toggle) toggle.checked=true;
    runAIAnalysis(c,collectAIPageData(currentPage));
    syncAiRuntimeState();
    setIsAIDrawerOpen(false);
    toast(`AI 连接成功 · ${aiProviderName(c.provider)} · ${c.model} · 能力已启用`);
    renderPage();
    syncAiInsightPanelDom();
  },900);
}
function saveAiConfigFromForm(){
  const provider=getAiFormEl("aiProvider")?.value;
  const rawKey=getAiFormEl("aiApiKey")?.value?.trim();
  const cfg=getAiConfig();
  const apiKey=rawKey&&rawKey.startsWith("••••")?cfg.apiKey:rawKey;
  const model=getAiFormEl("aiModel")?.value;
  const endpoint=getAiFormEl("aiEndpoint")?.value?.trim();
  const enabled=getAiFormEl("aiEnabledToggle")?.checked;
  if(enabled&&(!provider||!apiKey||!model)){ toast("启用 AI 前须完成服务商、API Key 与模型配置"); return; }
  Object.assign(cfg,{provider,apiKey,model,endpoint:endpoint||AI_PROVIDERS.find(p=>p.id===provider)?.endpoint||"",enabled:!!enabled,status:enabled&&provider&&apiKey&&model?"enabled":"disabled",configuredAt:enabled?new Date().toISOString().slice(0,16).replace("T"," "):cfg.configuredAt});
  if(enabled&&!cfg.lastTestAt) cfg.lastTestAt=cfg.configuredAt;
  if(enabled) cfg.lastTestResult=cfg.lastTestResult||"success";
  let analysisResult=null;
  if(cfg.enabled&&cfg.status==="enabled"){
    analysisResult=runAIAnalysis(cfg,collectAIPageData(currentPage));
    if(!analysisResult){ toast("配置已保存，但 AI 分析未能生成结果"); }
  }else clearAiResultState();
  syncAiRuntimeState();
  setIsAIDrawerOpen(false);
  toast(enabled?(analysisResult?`AI 已连接 · ${aiProviderName(cfg.provider)} · ${cfg.model} · 分析结果已更新`:`AI 已连接 · ${aiProviderName(cfg.provider)} · ${cfg.model} · 配置已保存`): "AI 能力已关闭，CRM 基础功能不受影响");
  renderPage();
  syncAiInsightPanelDom();
}
function disableAiCapability(){
  const c=getAiConfig();
  c.enabled=false; c.status="disabled";
  clearAiResultState();
  syncAiRuntimeState();
  setIsAIDrawerOpen(false);
  toast("AI 增强能力已关闭");
  renderPage();
  syncAiInsightPanelDom();
}
function onAiProviderChange(sel){
  const p=AI_PROVIDERS.find(x=>x.id===sel.value);
  const modelSel=getAiFormEl("aiModel");
  const ep=getAiFormEl("aiEndpoint");
  if(modelSel&&p) modelSel.innerHTML=p.models.map(m=>`<option>${m}</option>`).join("");
  if(ep&&p&&p.endpoint) ep.value=p.endpoint;
}

/* —— 角色权限模型（菜单 / 页面 / 按钮 / 数据范围）—— */
const ROLES = ["管理员","运营专员","协同人","外贸业务员","访客"];
const roleScopes = {
  "管理员":{scope:"全部站点 · 全量数据",sites:["全部站点","天猫苏豪站","苏豪独立站A","苏豪独立站B"],owner:null},
  "运营专员":{scope:"负责站点全部数据 · 可分配 · 可运营分析",sites:["天猫苏豪站","苏豪独立站A"],owner:null},
  "协同人":{scope:"授权站点团队数据 · 只读+监督 · 不可编辑业务",sites:["天猫苏豪站"],owner:null},
  "外贸业务员":{scope:"本人负责线索 · 客户 · 合同 · 沟通",sites:["天猫苏豪站"],owner:"张明远"},
  "访客":{scope:"指定看板与授权数据 · 只读 · 禁止修改",sites:["指定看板"],owner:null}
};
const roleMenuAccess = {
  "管理员":["workbench","lead-all","lead-pending","lead-invalid","lead-converted","customer-profile","follow-record","contract-list","communication-desk","communication-email","communication-whatsapp","communication-config","site-management","site-page-management","site-form-management","channel-config","data-analysis-hub","lead-analysis","customer-analysis","funnel-analysis","performance-analysis","communication-analysis","team-analysis","ai-analysis","site-stat","site-seo-analysis","user-management","role-management","permission-management","menu-management","data-dictionary","param-config","system-log"],
  "运营专员":["workbench","lead-all","lead-pending","lead-invalid","lead-converted","customer-profile","follow-record","contract-list","communication-desk","communication-email","communication-whatsapp","communication-config","site-management","site-page-management","site-form-management","channel-config","data-analysis-hub","lead-analysis","customer-analysis","funnel-analysis","performance-analysis","communication-analysis","team-analysis","ai-analysis","site-stat","site-seo-analysis","user-management"],
  "协同人":["workbench","lead-all","lead-pending","lead-invalid","lead-converted","customer-profile","follow-record","contract-list","communication-desk","communication-email","communication-whatsapp","communication-config","data-analysis-hub","lead-analysis","customer-analysis","funnel-analysis","performance-analysis","communication-analysis","team-analysis","ai-analysis","site-stat","site-seo-analysis"],
  "外贸业务员":["workbench","lead-all","lead-pending","lead-invalid","lead-converted","customer-profile","follow-record","contract-list","communication-desk","communication-email","communication-whatsapp","communication-config","data-analysis-hub","performance-analysis","site-stat"],
  "访客":["workbench","data-analysis-hub","lead-analysis","customer-analysis","funnel-analysis","communication-analysis","team-analysis","ai-analysis","site-stat","site-seo-analysis","customer-profile","contract-list","communication-desk","communication-email","communication-whatsapp","communication-config"]
};
const roleMenuLabels = {
  "外贸业务员":{"lead-pending":"我的线索","lead-all":"公海池","lead-invalid":"我的异常线索","follow-record":"跟进日志","customer-profile":"我的客户","contract-list":"我的合同","communication-desk":"沟通工作台","communication-email":"邮件","communication-whatsapp":"WhatsApp","performance-analysis":"我的绩效","site-stat":"站点统计","workbench":"首页"},
  "访客":{"workbench":"看板","data-analysis-hub":"分析总览","lead-analysis":"询盘看板","customer-analysis":"客户看板","funnel-analysis":"成交看板","communication-analysis":"沟通看板","team-analysis":"团队看板","ai-analysis":"AI看板","site-stat":"站点看板","site-seo-analysis":"SEO看板","customer-profile":"客户看板","contract-list":"合同看板","communication-desk":"沟通看板","communication-email":"邮件看板","communication-whatsapp":"WhatsApp看板"}
};
const roleGroupLabels = {
  "外贸业务员":{"线索中心":"我的工作","客户中心":"我的客户","合同中心":"我的合同","站点中心":"我的站点"},
  "访客":{"工作台":"看板","站点中心":"站点看板","数据分析":"数据看板","客户中心":"授权数据","合同中心":"授权数据","沟通中心":"授权数据"}
};
const rolePageMode = {
  "workbench":{"管理员":"full","运营专员":"full","协同人":"full","外贸业务员":"full","访客":"read"},
  "lead-all":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"none"},
  "lead-pending":{"管理员":"full","运营专员":"full","协同人":"supervise","外贸业务员":"full","访客":"none"},
  "lead-invalid":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"none"},
  "lead-converted":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"none"},
  "customer-profile":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"read"},
  "follow-record":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"read"},
  "contract-list":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"read"},
  "communication-desk":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"read"},
  "communication-email":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"read"},
  "communication-whatsapp":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"read"},
  "communication-config":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"read"},
  "lead-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"none","访客":"read"},
  "data-analysis-hub":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"read"},
  "customer-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"none","访客":"read"},
  "communication-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"read"},
  "team-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"none","访客":"read"},
  "ai-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"read"},
  "funnel-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"none","访客":"read"},
  "performance-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"full","访客":"none"},
  "site-stat":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"read"},
  "user-management":{"管理员":"full","运营专员":"full","协同人":"none","外贸业务员":"none","访客":"none"},
  "role-management":{"管理员":"full","运营专员":"none","协同人":"none","外贸业务员":"none","访客":"none"},
  "channel-config":{"管理员":"full","运营专员":"full","协同人":"none","外贸业务员":"none","访客":"none"},
  "site-management":{"管理员":"full","运营专员":"full","协同人":"none","外贸业务员":"none","访客":"none"},
  "site-seo-analysis":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"read","访客":"read"},
  "permission-management":{"管理员":"full","运营专员":"none","协同人":"none","外贸业务员":"none","访客":"none"},
  "menu-management":{"管理员":"full","运营专员":"none","协同人":"none","外贸业务员":"none","访客":"none"},
  "data-dictionary":{"管理员":"full","运营专员":"none","协同人":"none","外贸业务员":"none","访客":"none"},
  "param-config":{"管理员":"full","运营专员":"none","协同人":"none","外贸业务员":"none","访客":"none"},
  "site-page-management":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"none","访客":"none"},
  "site-form-management":{"管理员":"full","运营专员":"full","协同人":"read","外贸业务员":"none","访客":"none"},
  "system-log":{"管理员":"full","运营专员":"none","协同人":"none","外贸业务员":"none","访客":"none"}
};
const permMatrixRows = [
  ["客户查看",["√","√","√","√(本人)","√"]],
  ["客户编辑",["√","√","×","√(本人)","×"]],
  ["线索分配",["√","√","×","×","×"]],
  ["线索分配",["√","√","×","√","×"]],
  ["跟进新增",["√","√","×","√","×"]],
  ["合同查看",["√","√","√","√(本人)","√"]],
  ["合同编辑",["√","√","×","×","×"]],
  ["沟通发送",["√","√","×","√","×"]],
  ["数据分析",["√","√","√","√(个人)","√(只读)"]],
  ["站点中心",["√","√","√(只读)","√(只读)","√(只读)"]],
  ["用户管理",["√","√(站点)","×","×","×"]],
  ["角色管理",["√","×","×","×","×"]],
  ["系统配置",["√","×","×","×","×"]],
  ["系统日志",["√","×","×","×","×"]]
];
function getAccessiblePages(role){ return roleMenuAccess[role] || roleMenuAccess["管理员"]; }
function canAccessPage(pageId,role){
  if(pageId==="message-center") return true;
  const pages = getAccessiblePages(role||currentRole);
  if(pageId==="customer-tag"||pageId==="contact-management") return pages.includes("customer-profile");
  return pages.includes(pageId);
}
function isNavItemActive(navId){
  if(navId==="customer-tag") return currentPage==="customer-profile"&&customerTab==="tags";
  if(navId==="customer-profile") return currentPage==="customer-profile"&&customerTab!=="tags";
  if(navId==="contact-management") return false;
  return navId===currentPage;
}
function getPageMode(pageId,role){
  role = role || currentRole;
  if(!canAccessPage(pageId,role)) return "none";
  return rolePageMode[pageId]?.[role] || "full";
}
function getScopeText(role){ return roleScopes[role||currentRole]?.scope || ""; }
function getRoleMenuLabel(pageId,defaultLabel,role){
  role = role || currentRole;
  if(pageId==="workbench") return role==="访客"?"看板":role==="外贸业务员"?"首页":"首页看板";
  return (roleMenuLabels[role]||{})[pageId] || defaultLabel;
}
function getRoleGroupLabel(title){ return (roleGroupLabels[currentRole]||{})[title] || title; }
function getPageTitle(pageId){
  if(pageId==="workbench") return currentRole==="访客"?"看板":currentRole==="外贸业务员"?"首页": "工作台";
  if(pageId==="message-center") return "消息中心";
  if(pageId==="customer-profile"&&customerTab==="tags") return "标签管理";
  return getRoleMenuLabel(pageId, pageMeta[pageId]?.title || pageId);
}
function pageModeLabel(mode){
  return {"full":"可编辑","read":"只读","supervise":"只读+监督","none":"无权限"}[mode] || mode;
}
function pageModeTag(mode){
  return {"full":"green","read":"gray","supervise":"blue","none":"red"}[mode] || "gray";
}
/**
 * PAGE ID: forbidden
 * MODULE TYPE: detail
 * OWNER DOMAIN: system
 */
function renderForbiddenPage(){
  const title = pageMeta[currentPage]?.title || currentPage;
  document.getElementById("app").innerHTML = `
    <div class="state-block forbidden">
      <div style="font-size:36px;margin-bottom:10px">🔒</div>
      <strong style="font-size:16px;display:block;margin-bottom:8px;color:#b45309">无权访问此页面</strong>
      <p style="font-size:13px;line-height:1.7;margin-bottom:16px">您没有访问「${title}」的权限。请通过左侧菜单进入您有权限的功能，或联系系统管理员。</p>
      <div class="head-actions" style="justify-content:center"><button class="btn primary" onclick="nav('workbench')">返回${currentRole==="访客"?"看板":"首页"}</button></div>
    </div>`;
}
/**
 * PAGE ID: developing
 * MODULE TYPE: detail
 * OWNER DOMAIN: system
 */
function renderDevelopingPage(pageId, detail){
  const title = pageMeta[pageId]?.title || pageId;
  document.getElementById("app").innerHTML = `
    <div class="state-block empty">
      <div style="font-size:36px;margin-bottom:10px">🛠</div>
      <strong style="font-size:16px;display:block;margin-bottom:8px">页面开发中</strong>
      <p style="font-size:13px;line-height:1.7;margin-bottom:16px;color:var(--muted)">「${title}」功能尚未上线，可先浏览其他模块。${detail?`<br><span style="font-size:12px;color:var(--soft)">${detail}</span>`:""}</p>
      <div class="head-actions" style="justify-content:center"><button class="btn primary" onclick="nav('workbench')">返回${currentRole==="访客"?"看板":"首页"}</button><button class="btn" onclick="history.length>1?history.back():nav('workbench')">返回上一页</button></div>
    </div>`;
}
function renderPageDevelopingBlock(title){
  return `<div class="state-block empty" style="margin:14px 0"><div style="font-size:28px;margin-bottom:8px">🛠</div><strong>页面开发中</strong><p style="font-size:12px;margin-top:6px;color:var(--soft)">「${title||"当前页面"}」内容尚未完成，可先浏览其他功能模块。</p></div>`;
}

const datasets = {
  leads:[
    {id:"LEAD-2026-0913",inquiryTime:"2026-06-16 09:13",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"Harbor Linens LLC",contact:"+1-212-9901",country:"美国",intent:"酒店布草",score:"A类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"待认领",age:"38分钟",status:"待跟进",tags:"高意向 / 待分配",capture:"会话识别",route:"待运营分配"},
    {id:"LEAD-2026-0912",inquiryTime:"2026-06-16 07:30",site:"苏豪独立站A",source:"邮件",channel:"自然询盘",name:"Luna Fabrics",contact:"buying@lunafabrics.es",country:"西班牙",intent:"羊毛披肩",score:"B类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"待认领",age:"2小时",status:"待跟进",tags:"MOQ关注 / 首次来信",capture:"邮件识别",route:"进入公共线索池"},
    {id:"LEAD-2026-0911",inquiryTime:"2026-06-16 09:05",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Global Trade Co.",contact:"info@globaltrade.com",country:"美国",intent:"羊毛系列",score:"A类",stage:"报价打样",owner:"张明远",assignStatus:"已分配",age:"2小时",status:"跟进中",tags:"样品意向 / 高潜",capture:"自动生成",route:"按站点自动分配"},
    {id:"LEAD-2026-0910",inquiryTime:"2026-06-15 16:20",site:"苏豪独立站A",source:"邮件",channel:"自然询盘",name:"Sun Fashion Ltd.",contact:"purchase@sunfashion.co.uk",country:"英国",intent:"开司米围巾",score:"B类",stage:"待首响",owner:"李晓燕",assignStatus:"已分配",age:"5小时",status:"待跟进",tags:"MOQ关注",capture:"邮件转线索",route:"人工确认分配"},
    {id:"LEAD-2026-0909",inquiryTime:"2026-06-15 14:00",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"Bella Home Deco",contact:"+49-171-8823",country:"德国",intent:"家居纺织品",score:"A类",stage:"已成交",owner:"张明远",assignStatus:"已分配",age:"1天",status:"已成交",tags:"合同已成交",capture:"会话转线索",route:"合同 PC-2026-0156 · 2026-06-15",last:"2026-06-15 16:20"},
    {id:"LEAD-2026-0908",inquiryTime:"2026-06-14 10:30",site:"苏豪独立站B",source:"接口拉取",channel:"自然询盘",name:"Moda Italia S.p.A",contact:"orders@modaitalia.it",country:"意大利",intent:"羊毛大衣",score:"C类",stage:"报价打样",owner:"王芳",assignStatus:"已分配",age:"2天",status:"跟进中",tags:"样品反馈中",capture:"接口入池",route:"按负责人流转"},
    {id:"LEAD-2026-0907",inquiryTime:"2026-06-12 18:00",site:"苏豪独立站B",source:"手动录入",channel:"其他",name:"Pacific Textiles",contact:"contact@pacifictx.au",country:"澳大利亚",intent:"待确认",score:"D类",stage:"已失效",owner:"-",assignStatus:"未分配",age:"4天",status:"已失效",tags:"信息不完整",capture:"手工录入",route:"进入异常处理",invalidType:"信息不完整",processStatus:"待处理",invalidReason:"联系方式无法验证，产品意向描述不完整",processedTime:"-",processedBy:"-"},
    {id:"LEAD-2026-0888",inquiryTime:"2026-06-10 15:00",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Bella Home Deco",contact:"anna@homedeco.de",country:"德国",intent:"家居纺织品",score:"D类",stage:"已失效",owner:"-",assignStatus:"未分配",age:"6天",status:"已失效",tags:"重复线索",capture:"自动去重",route:"进入异常处理",invalidType:"重复线索",processStatus:"待处理",invalidReason:"与 LEAD-2026-0909 客户主体重复，系统自动拦截",processedTime:"-",processedBy:"-"},
    {id:"LEAD-2026-0876",inquiryTime:"2026-06-08 11:00",site:"未授权外部站",source:"接口拉取",channel:"其他",name:"Quick Buy LLC",contact:"-",country:"美国",intent:"-",score:"D类",stage:"已失效",owner:"-",assignStatus:"未分配",age:"8天",status:"已失效",tags:"站点未授权",capture:"接口入池",route:"进入异常处理",invalidType:"站点未授权",processStatus:"待处理",invalidReason:"来源站点未在 CRM 授权范围内，接口拉取已阻断",processedTime:"-",processedBy:"-"},
    {id:"LEAD-2026-0862",inquiryTime:"2026-06-05 09:30",site:"苏豪独立站B",source:"邮件",channel:"自然询盘",name:"Unknown Buyer",contact:"invalid-email",country:"-",intent:"-",score:"D类",stage:"已失效",owner:"-",assignStatus:"未分配",age:"11天",status:"已失效",tags:"无有效负责人",capture:"邮件识别",route:"进入异常处理",invalidType:"无负责人",processStatus:"已归档",invalidReason:"多次自动分配失败后标记失效",processedTime:"2026-06-07 14:00",processedBy:"刘运营"},
    {id:"LEAD-2026-0890",inquiryTime:"2026-06-12 10:00",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"Spam Account",contact:"+99-0000",country:"未知",intent:"-",score:"D类",stage:"已失效",owner:"-",assignStatus:"未分配",age:"4天",status:"已失效",tags:"垃圾询盘",capture:"会话识别",route:"进入异常处理",invalidType:"无效线索",processStatus:"已归档",invalidReason:"AI 识别为垃圾广告信息，自动归档",processedTime:"2026-06-13 09:00",processedBy:"系统"},
    {id:"LEAD-2026-0885",inquiryTime:"2026-06-11 14:20",site:"天猫苏豪站",source:"邮件",channel:"SEM广告",name:"Retail Outlet Inc.",contact:"info@retail-outlet.com",country:"加拿大",intent:"低价采购",score:"D类",stage:"已失效",owner:"张明远",assignStatus:"已分配",age:"5天",status:"已失效",tags:"无意向",capture:"邮件转线索",route:"业务员标记无效",invalidType:"无效线索",processStatus:"待处理",invalidReason:"客户明确表示无采购意向，请求停止联系",processedTime:"-",processedBy:"-"},
    {id:"LEAD-2026-0914",inquiryTime:"2026-06-16 08:10",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Nordic Home AB",contact:"info@nordichome.se",country:"瑞典",intent:"家居毯",score:"B类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"未分配",age:"1小时",status:"待跟进",tags:"首次询盘",capture:"自动生成",route:"进入公共线索池"},
    {id:"LEAD-2026-0915",inquiryTime:"2026-06-15 11:00",site:"苏豪独立站A",source:"接口拉取",channel:"LinkedIn",name:"Textile Importers SA",contact:"buy@textileimp.pt",country:"葡萄牙",intent:"混纺面料",score:"C类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"未分配",age:"1天",status:"待跟进",tags:"待确认意向",capture:"接口入池",route:"待运营分配"},
    {id:"LEAD-2026-0916",inquiryTime:"2026-06-16 06:45",site:"苏豪独立站B",source:"邮件",channel:"展会",name:"Casa Moda SRL",contact:"buying@casamoda.it",country:"意大利",intent:"围巾批发",score:"A类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"待认领",age:"3小时",status:"待跟进",tags:"高意向 / MOQ",capture:"邮件识别",route:"待运营分配"},
    {id:"LEAD-2026-0917",inquiryTime:"2026-05-20 11:00",site:"天猫苏豪站",source:"邮件",channel:"自然询盘",name:"HomeStyle Trading Co.",contact:"sales@homestyletrade.com",country:"法国",intent:"装饰靠垫",score:"B类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"已回收",age:"27天",status:"待跟进",tags:"回收待分配 / 曾跟进",capture:"邮件识别",route:"超时回收入池",prevOwner:"王芳",assignedAt:"2026-05-28 10:00",recycledAt:"2026-06-14 09:00",recycleReason:"超过7天未跟进，系统自动回收"},
    {id:"LEAD-2026-0918",inquiryTime:"2026-06-10 08:30",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"Urban Living Ltd.",contact:"+44-7911-223344",country:"英国",intent:"窗帘布艺",score:"A类",stage:"待认领",owner:"-",assignStatus:"未分配",poolStatus:"超时释放",age:"6天",status:"待跟进",tags:"超时释放 / 高潜",capture:"会话识别",route:"首响超时自动释放",prevOwner:"张明远",assignedAt:"2026-06-10 09:00",recycledAt:"2026-06-15 09:00",recycleReason:"分配后48小时未首响，自动释放回公海池"},
    {id:"LEAD-2026-0854",inquiryTime:"2026-06-07 10:20",site:"苏豪独立站A",source:"邮件",channel:"客户转介绍",name:"Nordic Style AB",contact:"erik@nordicstyle.se",country:"瑞典",intent:"秋季羊毛毯",score:"B类",stage:"深度沟通",owner:"李晓燕",assignStatus:"已分配",age:"9天",status:"跟进中",tags:"样品敏感 / 价格敏感",capture:"邮件转线索",route:"人工确认分配"},
    {id:"LEAD-2026-0788",inquiryTime:"2026-04-20 15:30",site:"苏豪独立站B",source:"网站表单",channel:"官网询盘",name:"Euro Furniture GmbH",contact:"hans@eurofurniture.de",country:"德国",intent:"实木家具面料",score:"B类",stage:"已成交",owner:"王芳",assignStatus:"已分配",age:"—",status:"已成交",tags:"首单询盘",capture:"网站表单",route:"转客户后关联"},
    {id:"LEAD-2026-0920",inquiryTime:"2026-03-08 14:20",site:"苏豪独立站A",source:"邮件",channel:"自然询盘",name:"Bella Home Deco",contact:"anna@homedeco.de",country:"德国",intent:"春季家居系列",score:"B类",stage:"已成交",owner:"张明远",assignStatus:"已分配",age:"—",status:"已成交",tags:"历史询盘",capture:"邮件转线索",route:"合同 PC-2026-0157 · 2026-05-20",last:"2026-05-20 14:30"},
    {id:"LEAD-2026-0921",inquiryTime:"2026-05-01 11:30",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Global Trade Co.",contact:"info@globaltrade.com",country:"美国",intent:"混纺面料补货",score:"A类",stage:"深度沟通",owner:"张明远",assignStatus:"已分配",age:"—",status:"跟进中",tags:"复购询盘",capture:"关联已有客户",route:"同主体二次询盘"},
    {id:"LEAD-2026-0922",inquiryTime:"2026-04-18 09:15",site:"苏豪独立站B",source:"展会",channel:"展会",name:"Nordic Style AB",contact:"erik@nordicstyle.se",country:"瑞典",intent:"亚麻混纺毯",score:"B类",stage:"已成交",owner:"李晓燕",assignStatus:"已分配",age:"—",status:"已成交",tags:"展会获客",capture:"展会名片",route:"关联已有客户"},
    {id:"LEAD-2026-0923",inquiryTime:"2026-06-16 10:20",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Alpine Textile AG",contact:"procurement@alpine-textile.ch",country:"瑞士",intent:"功能性面料",score:"A类",stage:"待首响",owner:"张明远",assignStatus:"已分配",age:"30分钟",status:"待跟进",tags:"新分配 / AI推荐",capture:"自动生成",route:"运营分配"},
    {id:"LEAD-2026-0924",inquiryTime:"2026-06-16 08:00",site:"苏豪独立站A",source:"接口拉取",channel:"LinkedIn",name:"Prime Fabrics Inc.",contact:"import@primefabrics.com",country:"美国",intent:"混纺纱线",score:"B类",stage:"首次联系",owner:"张明远",assignStatus:"已分配",age:"2小时",status:"待跟进",tags:"新导入",capture:"接口入池",route:"批量导入分配"},
    {id:"LEAD-2026-0925",inquiryTime:"2026-06-16 09:50",site:"天猫苏豪站",source:"邮件",channel:"自然询盘",name:"Meridian Home Ltd.",contact:"buyers@meridianhome.co.uk",country:"英国",intent:"家纺套件",score:"A类",stage:"待首响",owner:"张明远",assignStatus:"已分配",age:"1小时",status:"待跟进",tags:"高意向 / AI识别有效",capture:"邮件识别",route:"AI识别后分配"},
    {id:"LEAD-2026-0926",inquiryTime:"2026-05-10 14:00",site:"天猫苏豪站",source:"邮件",channel:"自然询盘",name:"Classic Linens Co.",contact:"info@classiclinens.fr",country:"法国",intent:"亚麻床品",score:"B类",stage:"已关闭",owner:"张明远",assignStatus:"已分配",age:"—",status:"已关闭",tags:"长期无回复",capture:"邮件转线索",route:"长期无回复关闭",last:"2026-05-28 11:00"},
    {id:"LEAD-2026-0927",inquiryTime:"2026-04-22 09:30",site:"苏豪独立站A",source:"网站表单",channel:"官网询盘",name:"Budget Home Import",contact:"buyer@budgethome.us",country:"美国",intent:"低价家纺",score:"C类",stage:"已关闭",owner:"张明远",assignStatus:"已分配",age:"—",status:"已关闭",tags:"价格原因",capture:"网站表单",route:"价格原因关闭",last:"2026-05-20 09:30"},
    {id:"LEAD-2026-0928",inquiryTime:"2026-05-05 16:00",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"StyleCraft BV",contact:"+31-612-889900",country:"荷兰",intent:"装饰面料",score:"B类",stage:"已关闭",owner:"张明远",assignStatus:"已分配",age:"—",status:"已关闭",tags:"竞争对手成交",capture:"会话识别",route:"客户选择竞品",last:"2026-06-01 16:00"},
    {id:"LEAD-2026-0929",inquiryTime:"2026-04-08 11:20",site:"苏豪独立站B",source:"邮件",channel:"自然询盘",name:"Ocean Trade LLC",contact:"sales@oceantrade.com",country:"美国",intent:"混纺毯",score:"C类",stage:"已关闭",owner:"李晓燕",assignStatus:"已分配",age:"—",status:"已关闭",tags:"无采购需求",capture:"邮件转线索",route:"客户确认无需求",last:"2026-05-15 10:00"},
    {id:"LEAD-2026-0930",inquiryTime:"2026-05-18 13:40",site:"天猫苏豪站",source:"展会",channel:"展会",name:"Fabric World SA",contact:"procurement@fabricworld.es",country:"西班牙",intent:"工业用布",score:"B类",stage:"已关闭",owner:"张明远",assignStatus:"已分配",age:"—",status:"已关闭",tags:"产品不匹配",capture:"展会名片",route:"规格不符关闭",last:"2026-06-05 14:20"},
    {id:"LEAD-2026-0931",inquiryTime:"2026-06-16 11:05",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"Coastal Bedding Co.",contact:"+61-412-8801",country:"澳大利亚",intent:"床品套件",score:"B类",stage:"待首响",owner:"张明远",assignStatus:"已分配",age:"15分钟",status:"待跟进",tags:"运营分配 / 待首响",capture:"会话识别",route:"新分配待联系"},
    {id:"LEAD-2026-0932",inquiryTime:"2026-06-16 07:15",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Sunrise Imports Ltd.",contact:"sales@sunrise-imports.ca",country:"加拿大",intent:"棉麻混纺",score:"A类",stage:"首次联系",owner:"张明远",assignStatus:"已分配",age:"3小时",status:"待跟进",tags:"批量导入",capture:"手工录入",route:"CRM批量导入分配"},
    {id:"LEAD-2026-0933",inquiryTime:"2026-06-14 09:00",site:"天猫苏豪站",source:"邮件",channel:"自然询盘",name:"Verona Textiles SRL",contact:"buy@verona-textiles.it",country:"意大利",intent:"羊毛围巾",score:"B类",stage:"待首响",owner:"张明远",assignStatus:"已分配",age:"2天",status:"跟进中",tags:"已完成首次联系",capture:"邮件转线索",route:"首响完成 · 需求梳理中",last:"2026-06-15 10:30"},
    {id:"LEAD-2026-0934",inquiryTime:"2026-06-10 14:30",site:"天猫苏豪站",source:"WhatsApp",channel:"WhatsApp",name:"Nordic Comfort AS",contact:"+47-901-22334",country:"挪威",intent:"家居靠垫",score:"A类",stage:"深度沟通",owner:"张明远",assignStatus:"已分配",age:"6天",status:"跟进中",tags:"需求确认中",capture:"会话识别",route:"确认Q3补货需求",last:"2026-06-14 16:00"},
    {id:"LEAD-2026-0935",inquiryTime:"2026-06-08 11:00",site:"天猫苏豪站",source:"展会",channel:"展会",name:"Maison Decor FR",contact:"achats@maisondecor.fr",country:"法国",intent:"装饰织物",score:"B类",stage:"报价打样",owner:"张明远",assignStatus:"已分配",age:"8天",status:"跟进中",tags:"样品寄送中",capture:"展会名片",route:"DHL样品在途",last:"2026-06-13 09:00"},
    {id:"LEAD-2026-0936",inquiryTime:"2026-06-05 10:20",site:"天猫苏豪站",source:"邮件",channel:"客户转介绍",name:"Heritage Wool Co.",contact:"procurement@heritagewool.co.uk",country:"英国",intent:"传统羊毛毯",score:"A类",stage:"报价阶段",owner:"张明远",assignStatus:"已分配",age:"11天",status:"跟进中",tags:"报价阶段",capture:"客户转介绍",route:"报价单已发送",last:"2026-06-12 11:30"},
    {id:"LEAD-2026-0937",inquiryTime:"2026-05-28 15:00",site:"天猫苏豪站",source:"网站表单",channel:"官网询盘",name:"Elite Home GmbH",contact:"einkauf@elitehome.de",country:"德国",intent:"高端家纺",score:"A类",stage:"谈判阶段",owner:"张明远",assignStatus:"已分配",age:"19天",status:"跟进中",tags:"合同条款谈判",capture:"网站表单",route:"交期与付款条款协商",last:"2026-06-11 14:00"},
    {id:"LEAD-2026-0938",inquiryTime:"2026-06-12 08:45",site:"天猫苏豪站",source:"LinkedIn",channel:"LinkedIn",name:"Pacific Linen Supply",contact:"buying@pacificlinen.com",country:"美国",intent:"酒店布草",score:"B类",stage:"跟进中",owner:"张明远",assignStatus:"已分配",age:"4天",status:"跟进中",tags:"MOQ协商",capture:"接口入池",route:"样品反馈待确认",last:"2026-06-15 17:20"},
    {id:"LEAD-2026-0939",inquiryTime:"2026-04-15 10:00",site:"天猫苏豪站",source:"邮件",channel:"自然询盘",name:"Royal Textile House",contact:"orders@royaltextile.hk",country:"中国香港",intent:"丝绸混纺",score:"A类",stage:"已成交",owner:"张明远",assignStatus:"已分配",age:"—",status:"已成交",tags:"合同已录入",capture:"邮件转线索",route:"合同 PC-2026-0171 · 2026-05-28",last:"2026-05-28 16:40"}
  ],
  leadSourceStats:[
    {channel:"SEM广告",leads:28,customers:8,deals:3,amount:"$86,400",rate:"10.7%"},
    {channel:"自然询盘",leads:62,customers:24,deals:8,amount:"$142,800",rate:"12.9%"},
    {channel:"官网询盘",leads:48,customers:18,deals:6,amount:"$98,600",rate:"12.5%"},
    {channel:"WhatsApp",leads:36,customers:14,deals:5,amount:"$76,200",rate:"13.9%"},
    {channel:"邮件营销",leads:22,customers:9,deals:2,amount:"$41,500",rate:"9.1%"},
    {channel:"Facebook",leads:18,customers:6,deals:1,amount:"$18,900",rate:"5.6%"},
    {channel:"LinkedIn",leads:14,customers:5,deals:2,amount:"$32,400",rate:"14.3%"},
    {channel:"Instagram",leads:12,customers:4,deals:1,amount:"$12,800",rate:"8.3%"},
    {channel:"TikTok",leads:8,customers:2,deals:0,amount:"$0",rate:"0%"},
    {channel:"展会",leads:16,customers:7,deals:3,amount:"$54,300",rate:"18.8%"},
    {channel:"客户转介绍",leads:10,customers:6,deals:4,amount:"$68,500",rate:"40.0%"},
    {channel:"其他",leads:6,customers:1,deals:0,amount:"$0",rate:"0%"}
  ],
  customers:[
    {id:"CUS-2026-0081",site:"天猫苏豪站",name:"Global Trade Co.",country:"美国",level:"A类",owner:"张明远",contacts:3,last:"2026-06-16 09:30",next:"2026-06-17",contracts:"1 / $18,600",lock:"独占",sourceLead:"LEAD-2026-0911",customerTags:"高意向 / MOQ关注",industry:"贸易",status:"跟进中",channel:"官网询盘",phone:"+1-555-0181 / info@globaltrade.com",website:"www.globaltrade.com",created:"2026-06-16 09:08"},
    {id:"CUS-2026-0079",site:"天猫苏豪站",name:"Bella Home Deco",country:"德国",level:"A类",owner:"张明远",contacts:2,last:"2026-06-15 16:20",next:"2026-06-21",contracts:"2 / $41,300",lock:"独占",sourceLead:"LEAD-2026-0909",customerTags:"合同推进中 / 大客户",industry:"家居",status:"已成交",channel:"WhatsApp",phone:"+49-171-8823 / anna@homedeco.de",website:"www.homedeco.de",created:"2026-05-20 14:30"},
    {id:"CUS-2026-0065",site:"苏豪独立站A",name:"Nordic Style AB",country:"瑞典",level:"B类",owner:"李晓燕",contacts:1,last:"2026-06-08 11:12",next:"2026-06-16",contracts:"1 / $28,500",lock:"独占",sourceLead:"LEAD-2026-0854",customerTags:"样品敏感 / 价格敏感",industry:"批发",status:"跟进中",channel:"客户转介绍",phone:"erik@nordicstyle.se",website:"www.nordicstyle.se",created:"2026-06-09 09:30"},
    {id:"CUS-2026-0051",site:"苏豪独立站B",name:"Euro Furniture GmbH",country:"德国",level:"B类",owner:"王芳",contacts:4,last:"2026-06-02 13:40",next:"已超期",contracts:"1 / €45,200",lock:"公海",sourceLead:"LEAD-2026-0788",customerTags:"超期未跟进",industry:"家具",status:"公海待领",channel:"官网询盘",phone:"hans@eurofurniture.de",website:"www.eurofurniture.de",created:"2026-04-12 10:00"},
    {id:"CUS-2026-0048",site:"苏豪独立站A",name:"Moda Italia S.p.A",country:"意大利",level:"C类",owner:"王芳",contacts:2,last:"2026-06-15 16:30",next:"2026-06-18",contracts:"0",lock:"独占",sourceLead:"LEAD-2026-0908",customerTags:"样品敏感",industry:"服装",status:"培育中",channel:"自然询盘",phone:"mario@modaitalia.it",website:"www.modaitalia.it",created:"2026-06-14 10:30"}
  ],
  customerAttachments:{
    "CUS-2026-0081":[
      {id:"ATT-C-001",name:"Global Trade 公司简介.pdf",category:"公司资料",size:"1.2MB",time:"2026-06-16",uploader:"张明远"},
      {id:"ATT-C-002",name:"羊毛系列产品需求.docx",category:"产品需求文件",size:"856KB",time:"2026-06-16",uploader:"Michael Johnson"},
      {id:"ATT-C-003",name:"Spring2026_Quotation.pdf",category:"报价文件",size:"420KB",time:"2026-06-16",uploader:"张明远"}
    ],
    "CUS-2026-0079":[
      {id:"ATT-C-004",name:"Bella Home 企业资质.zip",category:"公司资料",size:"3.4MB",time:"2026-05-25",uploader:"Anna Keller"},
      {id:"ATT-C-005",name:"PC-2026-0156_Signed.pdf",category:"合同文件",size:"980KB",time:"2026-06-15",uploader:"张明远"},
      {id:"ATT-C-006",name:"Q3补货产品清单.xlsx",category:"产品需求文件",size:"245KB",time:"2026-06-02",uploader:"Thomas Weber"}
    ],
    "CUS-2026-0065":[
      {id:"ATT-C-007",name:"Nordic Style 秋季样品方案.pdf",category:"报价文件",size:"680KB",time:"2026-06-07",uploader:"李晓燕"},
      {id:"ATT-C-008",name:"羊毛毯色卡确认.jpg",category:"其他附件",size:"1.8MB",time:"2026-06-05",uploader:"Erik Lund"}
    ],
    "CUS-2026-0051":[
      {id:"ATT-C-009",name:"Euro Furniture 历史合同.pdf",category:"合同文件",size:"1.1MB",time:"2026-05-26",uploader:"王芳"}
    ],
    "CUS-2026-0048":[
      {id:"ATT-C-010",name:"围巾样品清单.pdf",category:"产品需求文件",size:"320KB",time:"2026-06-14",uploader:"王芳"},
      {id:"ATT-C-011",name:"Moda Italia 公司介绍.pptx",category:"公司资料",size:"2.1MB",time:"2026-06-14",uploader:"Mario Rossi"}
    ]
  },
  leadIntelligence:{
    "LEAD-2026-0913":{
      identifiedCompany:"Harbor Linens International LLC",inquiryName:"Harbor Linens LLC",logo:"HL",website:"www.harborlinens.com",
      identifySources:["WhatsApp 会话签名","企业邮箱域名 harborlinens.com","LinkedIn 公司页","询盘内容 NLP"],
      industry:"酒店布草 /  hospitality textile",country:"美国",city:"New York",founded:"2015",employees:"200-500人",revenue:"$2000万-5000万",
      scaleLabel:"中大型企业",purchaseScale:"$150-300万/年",natures:["品牌商","分销商"],certs:["ISO9001","OEKO-TEX Standard 100"],
      mainMarkets:["北美","加勒比"],valueScore:91,valueLabel:"A级客户",dealProbability:78,
      scoreDims:{scale:88,match:92,potential:90,active:85,influence:82,history:45},
      purchaseStage:"供应商筛选",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"高",orderSize:"大单",intentSummary:"酒店连锁年度布草采购，关注 MOQ、交期与 OEKO-TEX 认证",
      risks:[],suggestions:["建议24小时内联系采购负责人","建议突出 OEKO-TEX 与酒店供应链案例","建议提供样品测试方案","建议安排线上产品目录演示"],
      nextAction:"建议24小时内联系 · 发送酒店布草产品目录与认证清单",worthFollow:true,
      aiSummary:"美国中大型酒店布草品牌商，员工约 300 人，年采购规模 $150-300 万。询盘明确酒店连锁场景，行业与苏豪产品线高度匹配。首次接触，无历史合作，但企业规模与采购意向均为 A 级信号。",
      dataSources:["WhatsApp 会话","企业域名检索","LinkedIn","询盘 NLP"],analyzedAt:"2026-06-16 09:14"
    },
    "LEAD-2026-0912":{
      identifiedCompany:"Luna Fabrics S.L.",inquiryName:"Luna Fabrics",logo:"LF",website:"www.lunafabrics.es",
      identifySources:["企业邮箱域名 lunafabrics.es","邮件签名 Luna Fabrics · Barcelona","官网 WHOIS","询盘正文"],
      industry:"纺织品批发",country:"西班牙",city:"Barcelona",founded:"2008",employees:"50-200人",revenue:"€800万-1500万",
      scaleLabel:"中型企业",purchaseScale:"€80-150万/年",natures:["贸易商","分销商"],certs:["ISO9001"],
      mainMarkets:["西班牙","葡萄牙"],valueScore:74,valueLabel:"B级客户",dealProbability:62,
      scoreDims:{scale:72,match:78,potential:75,active:70,influence:65,history:40},
      purchaseStage:"需求收集",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"中",orderSize:"中单",intentSummary:"羊毛披肩批发，关注 MOQ 与价格区间，首次来信",
      risks:["采购需求描述较笼统，需确认具体 SKU 与数量"],
      suggestions:["建议48小时内首响并确认 MOQ","建议发送羊毛披肩系列目录","建议询问目标价位与起订量","可提供西班牙市场参考案例"],
      nextAction:"建议发送产品目录 · 确认 MOQ 与目标价位",worthFollow:true,
      aiSummary:"西班牙中型纺织品批发商，邮箱域名与签名一致识别为 Luna Fabrics S.L.。产品意向为羊毛披肩，与苏豪品类匹配。首次询盘，需通过首响确认采购量级。",
      dataSources:["邮件域名","邮件签名","企业官网","询盘 NLP"],analyzedAt:"2026-06-16 07:32"
    },
    "LEAD-2026-0911":{
      identifiedCompany:"Global Trade Co.",inquiryName:"Global Trade Co.",logo:"GT",website:"www.globaltrade.com",
      identifySources:["网站表单","企业邮箱 info@globaltrade.com","历史 CRM 匹配"],
      industry:"纺织品贸易",country:"美国",city:"New York",founded:"2008",employees:"200-500人",revenue:"5000万-1亿 USD",
      scaleLabel:"中型企业",purchaseScale:"$200-500万/年",natures:["贸易商"],certs:["ISO9001","OEKO-TEX Standard 100","C-TPAT"],
      mainMarkets:["北美","欧洲"],valueScore:78,valueLabel:"A级客户",dealProbability:72,
      scoreDims:{scale:82,match:85,potential:85,active:92,influence:70,history:62},
      purchaseStage:"样品评估",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"高",orderSize:"中单",intentSummary:"羊毛系列样品意向，已分配业务员张明远，沟通活跃",
      risks:[],suggestions:["建议优先联系采购经理 Michael Johnson","建议推进 50 pcs 样品单测试","建议同步 MOQ 与交期条款","建议关联最近邮件报价跟进"],
      nextAction:"建议推进样品单 · 确认 MOQ 与交期",worthFollow:true,syncedCustomerId:"CUS-2026-0081",
      aiSummary:"美国中型纺织品贸易商，与 CRM 客户档案已关联。当前处于样品评估阶段，邮件与 WhatsApp 双渠道活跃，成交概率 72%。",
      dataSources:["网站表单","邮件记录","CRM 客户档案","跟进记录"],analyzedAt:"2026-06-16 09:06"
    },
    "LEAD-2026-0910":{
      identifiedCompany:"Sun Fashion Ltd.",inquiryName:"Sun Fashion Ltd.",logo:"SF",website:"www.sunfashion.co.uk",
      identifySources:["邮件域名 sunfashion.co.uk","邮件签名","Companies House 英国工商"],
      industry:"服装配饰批发",country:"英国",city:"London",founded:"2011",employees:"50-200人",revenue:"£500万-1000万",
      scaleLabel:"中型企业",purchaseScale:"£60-120万/年",natures:["贸易商","零售商"],certs:["ISO9001"],
      mainMarkets:["英国","爱尔兰"],valueScore:71,valueLabel:"B级客户",dealProbability:58,
      scoreDims:{scale:68,match:80,potential:72,active:75,influence:60,history:35},
      purchaseStage:"供应商筛选",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"高",orderSize:"中单",intentSummary:"开司米围巾 MOQ 关注，首响任务已超期",
      risks:["首响超期 2 小时，影响转化","MOQ 敏感，需快速给出明确报价"],
      suggestions:["建议立即首响并致歉延迟","建议明确开司米围巾 MOQ 与报价","建议提供英国市场发货案例","可附样品单模板加速决策"],
      nextAction:"建议立即首响 · 发送 MOQ 与报价方案",worthFollow:true,
      aiSummary:"英国中型服装配饰贸易商，开司米围巾询盘与苏豪产品线匹配。首响已超期，需优先处理以保住 B 级转化机会。",
      dataSources:["邮件域名","英国工商数据","询盘 NLP"],analyzedAt:"2026-06-15 16:22"
    },
    "LEAD-2026-0916":{
      identifiedCompany:"Casa Moda SRL",inquiryName:"Casa Moda SRL",logo:"CM",website:"www.casamoda.it",
      identifySources:["邮件域名 casamoda.it","邮件签名","意大利企业注册库","询盘正文"],
      industry:"时尚配饰分销",country:"意大利",city:"Milan",founded:"2010",employees:"200-500人",revenue:"€2000万-4000万",
      scaleLabel:"中型企业",purchaseScale:"€100-300万/年",natures:["分销商","品牌商"],certs:["ISO9001","OEKO-TEX","Made in Italy 渠道"],
      mainMarkets:["意大利","法国","德国"],valueScore:86,valueLabel:"A级客户",dealProbability:70,
      scoreDims:{scale:80,match:88,potential:86,active:78,influence:75,history:42},
      purchaseStage:"需求收集",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"高",orderSize:"大单",intentSummary:"围巾批发，MOQ 与色系要求明确，高意向待分配",
      risks:[],suggestions:["建议24小时内分配并首响","建议发送围巾全系列目录","建议安排线上会议介绍产能","建议突出欧洲市场交付案例"],
      nextAction:"建议24小时内分配 · 发送产品目录",worthFollow:true,
      aiSummary:"意大利中型时尚配饰分销商，企业规模与采购意向均为 A 级。围巾批发与苏豪核心品类高度匹配，建议运营优先分配。",
      dataSources:["邮件域名","意大利工商","企业官网","询盘 NLP"],analyzedAt:"2026-06-16 06:47"
    },
    "LEAD-2026-0914":{
      identifiedCompany:"Nordic Home AB",inquiryName:"Nordic Home AB",logo:"NH",website:"www.nordichome.se",
      identifySources:["网站表单","邮箱域名 nordichome.se","瑞典企业注册"],
      industry:"家居纺织零售",country:"瑞典",city:"Stockholm",founded:"2016",employees:"50-200人",revenue:"5000万-1亿 SEK",
      scaleLabel:"小型企业",purchaseScale:"$80-150万/年",natures:["零售商"],certs:["OEKO-TEX","FSC"],
      mainMarkets:["瑞典","挪威"],valueScore:68,valueLabel:"B级客户",dealProbability:55,
      scoreDims:{scale:65,match:75,potential:70,active:60,influence:58,history:30},
      purchaseStage:"需求收集",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"中",orderSize:"小单",intentSummary:"家居毯首次询盘，需确认季节采购计划",
      risks:["首次询盘，采购量级待确认"],suggestions:["建议48小时内首响","建议了解秋季采购计划","建议发送家居毯系列目录"],
      nextAction:"建议首响确认采购计划 · 发送目录",worthFollow:true,
      aiSummary:"瑞典家居纺织零售商，首次询盘家居毯品类。企业规模中等，需通过首响确认采购量级与合作意愿。",
      dataSources:["网站表单","邮箱域名","瑞典工商"],analyzedAt:"2026-06-16 08:12"
    },
    "LEAD-2026-0908":{
      identifiedCompany:"Moda Italia S.p.A",inquiryName:"Moda Italia S.p.A",logo:"MI",website:"www.modaitalia.it",
      identifySources:["接口拉取","企业邮箱 orders@modaitalia.it","CRM 客户匹配"],
      industry:"服装",country:"意大利",city:"Milan",founded:"2010",employees:"200-500人",revenue:"3000万-5000万 EUR",
      scaleLabel:"中型企业",purchaseScale:"€100-300万/年",natures:["分销商"],certs:["ISO9001","OEKO-TEX","GRS"],
      mainMarkets:["意大利","法国","西班牙"],valueScore:68,valueLabel:"C级客户",dealProbability:58,
      scoreDims:{scale:75,match:80,potential:80,active:78,influence:65,history:48},
      purchaseStage:"样品评估",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"中",orderSize:"中单",intentSummary:"羊毛大衣样品反馈中，已转客户跟进",
      risks:["样品反馈待确认，需本周内跟进"],suggestions:["建议跟进深色样品反馈","建议6/18前确认颜色方案","建议准备报价与首单试产方案"],
      nextAction:"建议跟进样品反馈 · 推进报价",worthFollow:true,syncedCustomerId:"CUS-2026-0048",
      aiSummary:"意大利中高端服装分销商，已转客户 Moda Italia，处于样品评估阶段。样品驱动型采购，需及时跟进颜色反馈。",
      dataSources:["接口拉取","CRM 客户档案","邮件","WhatsApp"],analyzedAt:"2026-06-14 10:32"
    },
    "LEAD-2026-0909":{
      identifiedCompany:"Bella Home Deco GmbH",inquiryName:"Bella Home Deco",logo:"BH",website:"www.homedeco.de",
      identifySources:["WhatsApp 号码 +49","历史客户匹配","CRM 档案"],
      industry:"家居纺织",country:"德国",city:"Munich",founded:"2012",employees:"500-1000人",revenue:"5000万-1亿 EUR",
      scaleLabel:"中型企业",purchaseScale:"€300-600万/年",natures:["品牌商"],certs:["ISO9001","ISO14001","BSCI","Sedex"],
      mainMarkets:["德国","奥地利","瑞士"],valueScore:92,valueLabel:"A级客户",dealProbability:90,
      scoreDims:{scale:90,match:88,potential:88,active:88,influence:85,history:95},
      purchaseStage:"准备下单",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"中",orderSize:"大单",intentSummary:"已成交客户，合同 PC-2026-0156 已同步",
      risks:[],suggestions:["建议确认下一季新品打样计划","建议维护战略客户关系"],nextAction:"建议确认交期 · 推进下一季新品",worthFollow:true,syncedCustomerId:"CUS-2026-0079",
      aiSummary:"德国战略客户，已从线索转化为客户并完成成交。画像继承至客户 360，无需重新分析。",
      dataSources:["WhatsApp","CRM 客户档案","合同记录"],analyzedAt:"2026-06-15 14:02"
    },
    "LEAD-2026-0854":{
      identifiedCompany:"Nordic Style AB",inquiryName:"Nordic Style AB",logo:"NS",website:"www.nordicstyle.se",
      identifySources:["邮件 erik@nordicstyle.se","CRM 客户匹配"],
      industry:"批发零售",country:"瑞典",city:"Stockholm",founded:"2015",employees:"50-200人",revenue:"1000万-5000万 SEK",
      scaleLabel:"小型企业",purchaseScale:"$80-150万/年",natures:["零售商"],certs:["ISO9001","OEKO-TEX"],
      mainMarkets:["瑞典","挪威","芬兰"],valueScore:74,valueLabel:"B级客户",dealProbability:65,
      scoreDims:{scale:68,match:78,potential:78,active:70,influence:62,history:72},
      purchaseStage:"样品评估",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"中",orderSize:"中单",intentSummary:"秋季羊毛毯，价格敏感，已转客户",
      risks:["样品反馈待确认","价格敏感需本周内跟进"],suggestions:["建议发送秋季样品方案","建议回应价格敏感点"],
      nextAction:"建议本周内发送样品方案",worthFollow:true,syncedCustomerId:"CUS-2026-0065",
      aiSummary:"瑞典北欧风格家居零售商，已转客户。处于样品方案确认阶段，对价格与交期较为敏感。",
      dataSources:["邮件","CRM 客户档案","合同记录"],analyzedAt:"2026-06-08 11:05"
    },
    "LEAD-2026-0907":{
      identifiedCompany:"Pacific Textiles（待验证）",inquiryName:"Pacific Textiles",logo:"?",website:"—",
      identifySources:["手动录入","联系方式校验失败"],
      industry:"待确认",country:"澳大利亚",city:"—",founded:"—",employees:"未知",revenue:"—",
      scaleLabel:"无法识别",purchaseScale:"—",natures:[],certs:[],
      mainMarkets:[],valueScore:28,valueLabel:"D级客户",dealProbability:12,
      scoreDims:{scale:20,match:30,potential:25,active:15,influence:20,history:0},
      purchaseStage:"需求收集",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"低",orderSize:"—",intentSummary:"产品意向描述不完整，联系方式无法验证",
      risks:["官网长期未更新 / 无法找到","企业规模较小 / 无法验证","采购需求不明确","疑似低质量询盘"],
      suggestions:["不建议投入大量跟进时间","建议运营确认后归档","如需恢复需补充完整企业信息"],
      nextAction:"建议确认归档 · 暂不投入跟进",worthFollow:false,
      aiSummary:"AI 无法验证企业主体，联系方式与产品意向均不完整。系统标记为低质量异常线索，不建议业务员优先投入。",
      dataSources:["手动录入","域名校验失败"],analyzedAt:"2026-06-12 18:05"
    },
    "LEAD-2026-0888":{
      identifiedCompany:"Bella Home Deco GmbH",inquiryName:"Bella Home Deco",logo:"BH",website:"www.homedeco.de",
      identifySources:["重复线索检测","与 LEAD-2026-0909 主体匹配"],
      industry:"家居纺织",country:"德国",city:"Munich",founded:"2012",employees:"500-1000人",revenue:"5000万-1亿 EUR",
      scaleLabel:"中型企业",purchaseScale:"€300-600万/年",natures:["品牌商"],certs:["ISO9001","BSCI"],
      mainMarkets:["德国","奥地利"],valueScore:92,valueLabel:"A级客户",dealProbability:90,
      scoreDims:{scale:90,match:88,potential:88,active:88,influence:85,history:95},
      purchaseStage:"准备下单",purchaseStages:["需求收集","供应商筛选","样品评估","商务谈判","准备下单"],
      urgency:"低",orderSize:"—",intentSummary:"与 LEAD-2026-0909 重复，系统自动拦截",
      risks:["重复线索 · 与已有成交客户主体相同"],suggestions:["无需跟进 · 关联至 LEAD-2026-0909","建议运营确认后归档"],
      nextAction:"重复线索 · 无需跟进",worthFollow:false,
      aiSummary:"AI 识别为 Bella Home Deco 重复询盘，与已成交线索 LEAD-2026-0909 客户主体相同，建议归档。",
      dataSources:["去重规则","CRM 匹配"],analyzedAt:"2026-06-10 15:02"
    }
  },
  senderIntelligence:{
    "MAIL-IN-006":{
      senderEmail:"john@abc-tech.de",inquiryName:"John Schmidt",identifiedCompany:"ABC Technology GmbH",logo:"AT",website:"www.abc-tech.de",country:"德国",city:"Stuttgart",
      industry:"工业纺织品 / Technical Textiles",mainProducts:["工业用布","防护面料","OEM 定制"],
      founded:"2001",employees:"800+",revenue:"€5000万-1亿",companyTypes:["制造商","出口型企业"],
      identifySources:["邮件域名 abc-tech.de","官网 WHOIS","邮件签名","LinkedIn 公司页","邮件正文 NLP"],
      credibilityScore:92,credibilityLevel:"高",opportunityLevel:"A级机会",
      opportunityReasons:["员工规模 800+","出口型制造企业","与目标客户画像高度匹配","OEM 批量采购意向明确"],
      valueJudgment:"高价值询盘",worthFollow:true,valueLabel:"建议优先跟进",
      purchaseIntent:"OEM 工业纺织品合作",purchaseStage:"需求收集",topics:["OEM","认证","MOQ","交期","样品"],
      dealSignals:["索要报价","讨论交期","OEM合作"],riskSignals:[],emailSummary:"德国 ABC Technology GmbH 首次来信，寻求 OEM 工业纺织品合作伙伴。邮件署名与域名一致，企业规模较大，采购意向明确。",
      actionSuggestions:["建议24小时内回复","建议发送产品目录","建议发送认证资料","建议安排线上会议","建议转销售负责人处理"],
      analyzedAt:"2026-06-16 10:45",crmStatus:"none"
    },
    "MAIL-IN-005":{
      senderEmail:"buying@lunafabrics.es",inquiryName:"Luna Fabrics",identifiedCompany:"Luna Fabrics S.L.",logo:"LF",website:"www.lunafabrics.es",country:"西班牙",city:"Barcelona",
      industry:"纺织品批发",mainProducts:["羊毛披肩","混纺围巾","季节性 shawl"],
      founded:"2008",employees:"50-200人",revenue:"€800万-1500万",companyTypes:["贸易商","分销商"],
      identifySources:["邮件域名 lunafabrics.es","邮件签名 Luna Fabrics · Barcelona","官网","询盘正文"],
      credibilityScore:86,credibilityLevel:"高",opportunityLevel:"B级机会",
      opportunityReasons:["中型纺织品批发商","产品品类与苏豪匹配","首次来信意向明确","关注 MOQ 与批发价"],
      valueJudgment:"高价值询盘",worthFollow:true,valueLabel:"建议优先跟进",
      purchaseIntent:"羊毛披肩批发",purchaseStage:"需求收集",topics:["价格","MOQ","样品","物流"],
      dealSignals:["索要报价","批发询价"],riskSignals:[],emailSummary:"西班牙 Luna Fabrics 首次批发询盘，关注羊毛披肩价格与 MOQ，建议 48 小时内首响。",
      actionSuggestions:["建议24小时内回复","建议发送产品目录","建议确认 MOQ 与目标价位","建议询问样品需求"],
      analyzedAt:"2026-06-16 08:52",crmStatus:"pending",lead:"LEAD-2026-0912"
    },
    "MAIL-IN-002":{
      senderEmail:"purchase@sunfashion.co.uk",inquiryName:"Sun Fashion Ltd.",identifiedCompany:"Sun Fashion Ltd.",logo:"SF",website:"www.sunfashion.co.uk",country:"英国",city:"London",
      industry:"服装配饰批发",mainProducts:["开司米围巾","羊毛配饰"],
      founded:"2011",employees:"50-200人",revenue:"£500万-1000万",companyTypes:["贸易商","零售商"],
      identifySources:["邮件域名 sunfashion.co.uk","Companies House 英国工商","邮件正文"],
      credibilityScore:78,credibilityLevel:"中",opportunityLevel:"B级机会",
      opportunityReasons:["英国中型批发商","产品品类匹配","有效询盘已识别"],
      valueJudgment:"高价值询盘",worthFollow:true,valueLabel:"建议优先跟进",
      purchaseIntent:"开司米围巾 MOQ 咨询",purchaseStage:"供应商筛选",topics:["MOQ","价格","开司米"],
      dealSignals:["索要报价","MOQ咨询"],riskSignals:["首响待完成"],emailSummary:"英国 Sun Fashion 询问开司米围巾 MOQ，已识别为有效询盘，待确认采购量后转入跟进。",
      actionSuggestions:["建议今日内发送首响报价","建议确认采购量级","建议同步 WhatsApp 跟进"],
      analyzedAt:"2026-06-16 09:05",crmStatus:"pending",lead:"LEAD-2026-0910"
    },
    "WA-003":{
      senderEmail:"+44-7711-2200",inquiryName:"Helen Smith",identifiedCompany:"Sun Fashion Ltd.",logo:"SF",website:"www.sunfashion.co.uk",country:"英国",city:"London",
      industry:"服装配饰批发",mainProducts:["开司米围巾","羊毛配饰"],
      founded:"2011",employees:"50-200人",revenue:"£500万-1000万",companyTypes:["贸易商"],
      identifySources:["WhatsApp 号码","会话签名","邮件域名交叉验证"],
      credibilityScore:76,credibilityLevel:"中",opportunityLevel:"B级机会",
      opportunityReasons:["与邮件询盘主体一致","WhatsApp 主动追问 MOQ","双渠道验证企业真实性"],
      valueJudgment:"高价值询盘",worthFollow:true,valueLabel:"建议优先跟进",
      purchaseIntent:"开司米围巾 MOQ",purchaseStage:"供应商筛选",topics:["MOQ","价格"],
      dealSignals:["主动追问","MOQ咨询"],riskSignals:["待回复"],emailSummary:"Sun Fashion 通过 WhatsApp 追问开司米围巾 MOQ，与邮件询盘为同一主体，建议尽快回复。",
      actionSuggestions:["建议2小时内回复 WhatsApp","建议同步邮件报价","建议确认采购量级"],
      analyzedAt:"2026-06-16 09:10",crmStatus:"pending",lead:"LEAD-2026-0910"
    },
    "WA-006":{
      senderEmail:"+1-212-9901",inquiryName:"James Porter",identifiedCompany:"Harbor Linens International LLC",logo:"HL",website:"www.harborlinens.com",country:"美国",city:"New York",
      industry:"酒店布草",mainProducts:["酒店布草","hospitality textile"],
      founded:"2015",employees:"200-500人",revenue:"$2000万-5000万",companyTypes:["品牌商","分销商"],
      identifySources:["WhatsApp 号码","企业邮箱域名","LinkedIn","会话 NLP"],
      credibilityScore:91,credibilityLevel:"高",opportunityLevel:"A级机会",
      opportunityReasons:["中大型酒店布草品牌商","高意向 WhatsApp 询盘","尚未进入 CRM"],
      valueJudgment:"高价值询盘",worthFollow:true,valueLabel:"建议优先跟进",
      purchaseIntent:"酒店连锁年度布草采购",purchaseStage:"供应商筛选",topics:["MOQ","认证","交期","样品"],
      dealSignals:["高意向询盘","样品意向"],riskSignals:[],emailSummary:"美国 Harbor Linens 陌生 WhatsApp 询盘，AI 已识别企业背景与采购潜力，建议 24 小时内回复。",
      actionSuggestions:["建议24小时内联系","建议发送酒店布草目录","建议突出 OEKO-TEX 认证","建议转线索或加入公海池"],
      analyzedAt:"2026-06-16 09:14",crmStatus:"none"
    },
    "LEAD-2026-0913":{
      senderEmail:"+1-212-9901",inquiryName:"Harbor Linens LLC",identifiedCompany:"Harbor Linens International LLC",logo:"HL",website:"www.harborlinens.com",country:"美国",city:"New York",
      industry:"酒店布草",mainProducts:["酒店布草","hospitality textile"],
      founded:"2015",employees:"200-500人",revenue:"$2000万-5000万",companyTypes:["品牌商","分销商"],
      identifySources:["WhatsApp 会话","企业邮箱域名","LinkedIn","询盘 NLP"],
      credibilityScore:91,credibilityLevel:"高",opportunityLevel:"A级机会",
      opportunityReasons:["中大型酒店布草品牌商","高意向 WhatsApp 询盘","尚未分配负责人"],
      valueJudgment:"高价值询盘",worthFollow:true,valueLabel:"建议优先跟进",
      purchaseIntent:"酒店连锁年度布草采购",purchaseStage:"供应商筛选",topics:["MOQ","认证","交期","样品"],
      dealSignals:["高意向询盘","样品意向"],riskSignals:[],emailSummary:"美国 Harbor Linens 高意向 WhatsApp 询盘，尚未分配，建议运营优先分配。",
      actionSuggestions:["建议24小时内联系","建议发送酒店布草目录","建议突出 OEKO-TEX 认证","建议分配至外贸业务员"],
      analyzedAt:"2026-06-16 09:14",crmStatus:"pool",lead:"LEAD-2026-0913"
    }
  },
  companyBackground:{
    "LEAD-2026-0913":{
      status:"verified",companyName:"Harbor Linens International LLC",
      intro:"美国纽约酒店布草品牌商，200-500 人规模，主营 hospitality textile 分销与连锁供应，年营收约 $2000万-5000万。",
      industry:"酒店布草 / Hospitality Textile",mainBusiness:"酒店布草批发 · 连锁年度采购 · OEKO-TEX 认证供应",
      scaleInfo:"200-500 人 · 年营收 $2000万-5000万 · 年采购 $150-300万",marketInfo:"北美 · 加勒比",
      inquiryRelevance:"当前 WhatsApp 询盘关注酒店布草样品与 MOQ，与企业主营及连锁采购场景高度一致。",
      credibilityScore:91,credibilityLevel:"高",
      matchSources:["WhatsApp 会话签名","企业邮箱域名 harborlinens.com","LinkedIn 公司页","官网公开信息"],
      analyzedAt:"2026-06-16 09:14"
    },
    "WA-006":{
      status:"verified",companyName:"Harbor Linens International LLC",
      intro:"美国纽约酒店布草品牌商，200-500 人规模，主营 hospitality textile 分销与连锁供应，年营收约 $2000万-5000万。",
      industry:"酒店布草 / Hospitality Textile",mainBusiness:"酒店布草批发 · 连锁年度采购 · OEKO-TEX 认证供应",
      scaleInfo:"200-500 人 · 年营收 $2000万-5000万 · 年采购 $150-300万",marketInfo:"北美 · 美国纽约",
      inquiryRelevance:"WhatsApp 会话关注 hospitality linen 样品单与 50 pcs 首单可行性，与酒店布草采购场景一致。",
      credibilityScore:91,credibilityLevel:"高",
      matchSources:["WhatsApp 会话 NLP","号码归属地验证","LinkedIn 公司页","官网公开信息"],
      analyzedAt:"2026-06-16 09:14"
    },
    "LEAD-2026-0912":{
      status:"verified",companyName:"Luna Fabrics S.L.",
      intro:"西班牙巴塞罗那中型纺织品批发商，2008 年成立，主营羊毛披肩与混纺围巾批发。",
      industry:"纺织品批发",mainBusiness:"羊毛披肩 · 混纺围巾 · 季节性 shawl 分销",
      scaleInfo:"50-200 人 · 年营收 €800万-1500万",marketInfo:"西班牙 · 葡萄牙",
      inquiryRelevance:"邮件询盘关注羊毛披肩批发价与 MOQ，与 Luna Fabrics 公开业务方向一致。",
      credibilityScore:86,credibilityLevel:"高",
      matchSources:["企业邮箱域名 lunafabrics.es","邮件签名","官网","西班牙企业公开信息"],
      analyzedAt:"2026-06-16 08:52"
    },
    "LEAD-2026-0911":{
      status:"verified",companyName:"Global Trade Co.",
      intro:"美国纽约中型纺织品贸易商，已与 CRM 客户档案关联，双渠道沟通活跃。",
      industry:"纺织品贸易",mainBusiness:"羊毛系列贸易 · 北美/欧洲分销",
      scaleInfo:"200-500 人 · 年营收 $5000万-1亿",marketInfo:"北美 · 欧洲",
      inquiryRelevance:"网站表单询盘关注羊毛系列与 MOQ，与客户历史采购品类一致。",
      credibilityScore:88,credibilityLevel:"高",
      matchSources:["网站表单","企业邮箱 info@globaltrade.com","CRM 客户档案匹配"],
      analyzedAt:"2026-06-16 09:06"
    },
    "LEAD-2026-0916":{
      status:"verified",companyName:"Casa Moda SRL",
      intro:"意大利米兰时尚配饰分销商，主营围巾与季节性配饰批发。",
      industry:"时尚配饰分销",mainBusiness:"围巾批发 · 欧洲渠道分销",
      scaleInfo:"200-500 人 · 年营收 €2000万-4000万",marketInfo:"意大利 · 法国 · 德国",
      inquiryRelevance:"展会渠道来信咨询围巾批发 MOQ，与企业分销定位匹配。",
      credibilityScore:84,credibilityLevel:"高",
      matchSources:["企业邮箱域名 casamoda.it","意大利企业注册库","邮件签名"],
      analyzedAt:"2026-06-16 06:47"
    },
    "MAIL-IN-006":{
      status:"verified",companyName:"ABC Technology GmbH",
      intro:"德国斯图加特工业纺织品制造商，800+ 员工，出口型 OEM 企业，寻求工业/防护面料合作伙伴。",
      industry:"工业纺织品 / Technical Textiles",mainBusiness:"工业用布 · 防护面料 · OEM 定制",
      scaleInfo:"800+ 人 · 年营收 €5000万-1亿",marketInfo:"德国 · 欧盟出口市场",
      inquiryRelevance:"OEM 工业纺织品合作询盘，与 ABC Technology 公开制造与出口业务一致。",
      credibilityScore:92,credibilityLevel:"高",
      matchSources:["邮件域名 abc-tech.de","官网 WHOIS","LinkedIn 公司页","邮件签名"],
      analyzedAt:"2026-06-16 10:45"
    },
    "WA-006":{
      status:"verified",companyName:"Harbor Linens International LLC",
      intro:"美国纽约酒店布草品牌商，200-500 人规模，主营 hospitality textile。",
      industry:"酒店布草",mainBusiness:"酒店布草 · 连锁年度采购",
      scaleInfo:"200-500 人 · 年营收 $2000万-5000万",marketInfo:"北美 · 加勒比",
      inquiryRelevance:"WhatsApp 陌生询盘关注酒店布草样品，与企业公开业务一致。",
      credibilityScore:91,credibilityLevel:"高",
      matchSources:["WhatsApp 会话","企业邮箱域名","LinkedIn"],
      analyzedAt:"2026-06-16 09:14"
    },
    "LEAD-2026-0918":{
      status:"unverified",emptyReason:"仅有 WhatsApp 号码，未能匹配到可验证的企业注册或官网公开信息，暂不展示公司背景。"
    },
    "LEAD-2026-0907":{
      status:"not_found",emptyReason:"联系方式无法验证，产品意向不完整，AI 未找到可靠企业主体信息。"
    },
    "LEAD-2026-0890":{
      status:"not_found",emptyReason:"AI 识别为垃圾广告询盘，无可信企业信息。"
    },
    "MAIL-IN-007":{
      status:"personal",emptyReason:"来件使用个人邮箱 gmail.com，署名仅为个人姓名，未识别可靠企业主体。"
    },
    "LEAD-2026-0915":{
      status:"unverified",emptyReason:"企业邮箱域名存在，但未匹配到葡萄牙工商注册或官网等可靠公开信息，暂不生成公司摘要。"
    }
  },
  commIntelligence:{
    "Global Trade Co.":{
      customer:"Global Trade Co.",lead:"LEAD-2026-0911",commStatus:"积极",commStatusLabel:"积极沟通中",
      topics:["价格","样品","MOQ","交期","认证"],
      purchaseStage:"报价比较",purchaseStages:["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"],
      attentionLevel:"高",attentionReason:"邮件回复率 95% · WhatsApp 互动频繁 · 客户主动发起 3 次",
      activity:{period:"近7天",email:12,whatsapp:18,meeting:2,trend:[4,5,6,7,8,9,11]},
      sentiment:"积极",dealSignals:["索要报价","索要样品","讨论交期","询问付款"],dealScore:85,
      riskSignals:[],riskLevel:"低",
      nextActions:["建议发送样品方案","建议跟进报价确认","建议安排技术会议"],
      aiSummary:"客户近期重点关注 MOQ、样品单与交期。已进入报价比较阶段。近两周邮件与 WhatsApp 双渠道沟通频率明显增加，成交信号较强。建议推进样品测试并确认付款条件。",
      analyzedAt:"2026-06-16 10:30",dataSources:["邮件 MAIL-IN-001","WhatsApp WA-001","跟进 FOL-001","跟进 FOL-002"]
    },
    "Sun Fashion Ltd.":{
      customer:"Sun Fashion Ltd.",lead:"LEAD-2026-0910",commStatus:"风险",commStatusLabel:"首响超期 · 需关注",
      topics:["MOQ","价格","开司米"],
      purchaseStage:"供应商筛选",purchaseStages:["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"],
      attentionLevel:"中",attentionReason:"邮件已回复 1 次 · WhatsApp 待回复 · 首响任务超期",
      activity:{period:"近7天",email:5,whatsapp:3,meeting:0,trend:[2,3,2,1,1,2,1]},
      sentiment:"中性",dealSignals:["索要报价"],dealScore:52,
      riskSignals:["首响超期","沟通频率偏低"],riskLevel:"中",
      nextActions:["建议今日内发送首响报价","建议确认采购量级","建议同步 WhatsApp 跟进"],
      aiSummary:"客户通过邮件询问开司米围巾 MOQ，已识别为有效询盘。首响邮件已发送但 WhatsApp 尚未回复，当前处于供应商筛选阶段。需尽快完成首响并确认采购量。",
      analyzedAt:"2026-06-16 09:00",dataSources:["邮件 MAIL-IN-002","WhatsApp WA-003","跟进记录"]
    },
    "Bella Home Deco":{
      customer:"Bella Home Deco",lead:"LEAD-2026-0909",commStatus:"积极",commStatusLabel:"积极沟通中",
      topics:["合同","交期","付款方式","售后"],
      purchaseStage:"准备下单",purchaseStages:["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"],
      attentionLevel:"高",attentionReason:"订单已确认 · WhatsApp 实时互动 · 会议参与 2 次",
      activity:{period:"近7天",email:8,whatsapp:14,meeting:2,trend:[5,6,7,8,9,10,12]},
      sentiment:"积极",dealSignals:["讨论交期","询问付款","预约会议"],dealScore:92,
      riskSignals:[],riskLevel:"低",
      nextActions:["建议补发签章合同","建议确认交期节点","建议推进下一季新品打样"],
      aiSummary:"客户已确认订单 PC-2026-0156，沟通情绪积极。当前处于准备下单阶段，重点关注合同附件与交期确认。建议维护战略客户关系并推进下一季新品。",
      analyzedAt:"2026-06-16 09:45",dataSources:["邮件 MAIL-IN-003","WhatsApp WA-002","跟进 FOL-003"]
    },
    "Moda Italia S.p.A":{
      customer:"Moda Italia S.p.A",lead:"LEAD-2026-0908",commStatus:"正常",commStatusLabel:"正常跟进中",
      topics:["样品","交期","颜色","物流"],
      purchaseStage:"样品测试",purchaseStages:["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"],
      attentionLevel:"中",attentionReason:"邮件回复稳定 · 样品阶段沟通 · 客户主动询问交期",
      activity:{period:"近7天",email:6,whatsapp:5,meeting:1,trend:[3,4,4,5,4,5,6]},
      sentiment:"中性",dealSignals:["索要样品","讨论交期"],dealScore:68,
      riskSignals:["样品反馈待确认"],riskLevel:"低",
      nextActions:["建议跟进样品颜色反馈","建议6/18前确认样品方案","建议准备首单试产报价"],
      aiSummary:"客户处于样品测试阶段，近期通过邮件与 WhatsApp 询问样品发货时间。沟通节奏正常，需及时跟进深色样品反馈并推进报价。",
      analyzedAt:"2026-06-15 17:00",dataSources:["邮件 MAIL-IN-004","WhatsApp WA-005","跟进 FOL-005","跟进 FOL-006"]
    },
    "Luna Fabrics":{
      customer:"Luna Fabrics",lead:"LEAD-2026-0912",commStatus:"积极",commStatusLabel:"积极沟通中",
      topics:["价格","MOQ","样品","物流"],
      purchaseStage:"需求收集",purchaseStages:["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"],
      attentionLevel:"高",attentionReason:"首次询盘 · 24h 内回复 · 高意向邮件",
      activity:{period:"近7天",email:3,whatsapp:0,meeting:0,trend:[0,0,0,0,1,2,3]},
      sentiment:"积极",dealSignals:["索要报价"],dealScore:74,
      riskSignals:[],riskLevel:"低",
      nextActions:["建议48小时内发送产品目录","建议确认 MOQ 与目标价位","建议询问样品需求"],
      aiSummary:"西班牙批发商首次来信，关注羊毛披肩批发价格与 MOQ。处于需求收集阶段，首响响应及时，建议快速报价并确认样品意向。",
      analyzedAt:"2026-06-16 08:50",dataSources:["邮件 MAIL-IN-005"]
    },
    "Nordic Style AB":{
      customer:"Nordic Style AB",lead:"LEAD-2026-0854",commStatus:"冷淡",commStatusLabel:"沟通频率下降",
      topics:["价格","样品","交期"],
      purchaseStage:"商务谈判",purchaseStages:["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"],
      attentionLevel:"低",attentionReason:"近 7 天仅 1 次互动 · 样品方案待发送 · 跟进超期",
      activity:{period:"近7天",email:2,whatsapp:1,meeting:0,trend:[3,2,2,1,1,1,1]},
      sentiment:"中性",dealSignals:[],dealScore:45,
      riskSignals:["沟通频率下降","跟进超期"],riskLevel:"中",
      nextActions:["建议发送秋季样品方案","建议电话确认采购意向","建议重新约定跟进时间"],
      aiSummary:"客户处于商务谈判阶段，但近一周沟通频率明显下降。样品方案承诺尚未发送，存在跟进超期风险。建议主动电话沟通并补发方案。",
      analyzedAt:"2026-06-14 11:00",dataSources:["WhatsApp WA-004","跟进 FOL-004"]
    }
  },
  customerProfiles:{
    "CUS-2026-0081":{
      shortName:"Global Trade",website:"www.globaltrade.com",logo:"GT",city:"New York",founded:"2008",scale:"中型企业",employees:"200-500人",revenue:"5000万-1亿 USD",industry:"纺织品贸易",subIndustry:"羊毛/混纺进出口",nature:"私营有限责任公司",
      companyIntro:"美国中型纺织品贸易商，主营羊毛与混纺面料进出口，服务北美批发与零售渠道。",
      mainBusiness:"羊毛系列、混纺面料批发；年度框架协议 + 批次订单模式。",
      targetMarket:"北美、欧洲批发与零售渠道",
      certified:true,certs:["ISO9001","OEKO-TEX Standard 100","C-TPAT"],
      purchaseProfile:{focusedProducts:"羊毛系列、开司米围巾",productDirection:"春季新品 + MOQ 灵活试单",purchaseNeeds:"50 pcs 样品单先行，确认 MOQ 与运费条款",concerns:"MOQ 灵活性、样品费、运费承担方式"},
      bizType:"贸易商",mainMarkets:["北美","欧洲"],purchaseMode:"年度框架协议 + 批次订单",purchaseFreq:"季度采购",annualPurchase:"$200-500万",productLines:["羊毛系列","混纺面料","开司米围巾"],
      valueScore:78,scoreDims:{scale:82,potential:85,history:62,active:92,probability:72},valueLabel:"A类客户",followPriority:"重点跟进",isTarget:true,coopStage:"打样中",dealProbability:"72%",
      activityLabel:"近7天活跃",healthStatus:"健康",healthRisks:[],
      aiSummary:"该客户为美国中型纺织品贸易商，采购周期约60-90天。近30天活跃度较高，邮件与 WhatsApp 双渠道并行。主要关注 MOQ 灵活性、样品单条款与运费承担方式。",
      aiAnalysis:"客户为美国中型纺织品贸易商，主要关注 MOQ 灵活性与样品单条款。近30天沟通频率较高，邮件与 WhatsApp 双渠道并行。历史尚无成交合同，但跟进节奏稳定。预计成交概率 72%。建议优先推进 50 pcs 样品单测试，同步确认羊毛系列 MOQ 与交期。",
      aiSuggestion:"建议优先推进 50 pcs 样品单测试，同步确认羊毛系列 MOQ 与交期，预计 2 周内可进入商务谈判。",
      dataSources:["CRM录入","网站表单","邮件记录","WhatsApp","跟进记录","合同记录"]
    },
    "CUS-2026-0079":{
      shortName:"Bella Home",website:"www.homedeco.de",logo:"BH",city:"Munich",founded:"2012",scale:"中型企业",employees:"500-1000人",revenue:"5000万-1亿 EUR",industry:"家居纺织",subIndustry:"家居装饰品批发",nature:" GmbH 有限责任公司",
      companyIntro:"德国中型家居纺织品牌商，专注家居装饰品与季节性系列，DACH 区域核心供应商。",
      mainBusiness:"家居纺织品 ODM + 年度采购计划，覆盖装饰毯与季节性系列。",
      targetMarket:"德国、奥地利、瑞士零售与批发渠道",
      purchaseProfile:{focusedProducts:"家居纺织品、装饰毯",productDirection:"Q3 补货 + 下一季新品打样",purchaseNeeds:"OEKO-TEX / BSCI 认证清单、交期确认",concerns:"交期、合同附件同步、认证合规"},
      certified:true,certs:["ISO9001","ISO14001","BSCI","Sedex","OEKO-TEX","GRS"],
      bizType:"品牌商",mainMarkets:["德国","奥地利","瑞士"],purchaseMode:"ODM + 年度采购计划",purchaseFreq:"月度补货",annualPurchase:"€300-600万",productLines:["家居纺织品","装饰毯","季节性系列"],
      valueScore:92,scoreDims:{scale:90,potential:88,history:95,active:88,probability:90},valueLabel:"A类客户",followPriority:"战略客户",isTarget:true,coopStage:"成交",dealProbability:"90%",
      activityLabel:"近7天活跃",healthStatus:"健康",healthRisks:[],
      aiSummary:"该客户为德国中型家居纺织品牌商，已与苏豪完成 2 份合同（累计 $41,300）。WhatsApp 为主要沟通渠道，采购决策周期约 45 天，对交期与合同附件同步要求高。",
      aiAnalysis:"客户为德国中型家居纺织品牌商，主要关注产品认证与交付能力。近30天沟通频率较高，WhatsApp 为主要渠道。历史成交率较好，累计合同 $41,300。预计成交概率 90%。建议确认交期并推进下一季新品打样，维护战略客户关系。",
      aiSuggestion:"合同 PC-2026-0156 已成交，建议确认交期并推进下一季新品打样，维护战略客户关系。",
      dataSources:["CRM录入","WhatsApp","邮件记录","跟进记录","合同记录","外部企业信息"]
    },
    "CUS-2026-0065":{
      shortName:"Nordic Style",website:"www.nordicstyle.se",logo:"NS",city:"Stockholm",founded:"2015",scale:"小型企业",employees:"50-200人",revenue:"1000万-5000万 SEK",industry:"批发零售",subIndustry:"北欧风格家居纺织",nature:"AB 股份有限公司",
      certified:true,certs:["ISO9001","OEKO-TEX","FSC"],
      bizType:"零售商",mainMarkets:["瑞典","挪威","芬兰"],purchaseMode:"季节性批次采购",purchaseFreq:"季度采购",annualPurchase:"$80-150万",productLines:["羊毛毯","季节性家居 textile"],
      valueScore:74,scoreDims:{scale:68,potential:78,history:72,active:70,probability:65},valueLabel:"B类客户",followPriority:"正常跟进",isTarget:true,coopStage:"打样中",dealProbability:"65%",
      activityLabel:"近30天活跃",healthStatus:"一般",healthRisks:["样品反馈待确认，需本周内跟进"],
      aiSummary:"该客户为瑞典北欧风格家居零售商，已完成 1 份合同（$28,500）。当前处于秋季样品方案确认阶段，对价格与样品交期较为敏感。",
      aiAnalysis:"客户为瑞典北欧风格家居零售商，主要关注价格与样品交期。近30天有稳定沟通，已完成 1 份合同。预计成交概率 65%。建议本周内发送秋季样品方案，重点回应价格敏感点。",
      aiSuggestion:"建议本周内发送秋季样品方案，重点回应价格敏感点，跟进样品反馈后可推进二次报价。",
      dataSources:["CRM录入","邮件记录","WhatsApp","跟进记录","合同记录"]
    },
    "CUS-2026-0051":{
      shortName:"Euro Furniture",website:"www.eurofurniture.de",logo:"EF",city:"Berlin",founded:"2005",scale:"中大型企业",employees:"1000+人",revenue:"1亿+ EUR",industry:"家具制造",subIndustry:"家具纺织品配套",nature:" GmbH 有限责任公司",
      certified:true,certs:["ISO9001","ISO14001","FSC","BSCI","REACH"],
      bizType:"制造商",mainMarkets:["德国","法国","波兰"],purchaseMode:"项目制 + 年度框架",purchaseFreq:"半年度采购",annualPurchase:"€500万+",productLines:["家具配套纺织品","装饰面料"],
      valueScore:55,scoreDims:{scale:88,potential:70,history:45,active:32,probability:40},valueLabel:"B类客户",followPriority:"待激活",isTarget:false,coopStage:"需求确认",dealProbability:"40%",
      activityLabel:"30天未活跃",healthStatus:"风险",healthRisks:["报价后超过14天未跟进","客户处于公海池","站点已暂停，归属待确认"],
      aiSummary:"该客户为德国大型家具制造商，历史合同 €45,200 但已超期 14 天未跟进。当前处于公海状态，站点苏豪独立站B 已暂停，需确认后续归属与激活策略。",
      aiAnalysis:"客户为德国大型家具制造商，采购潜力大但近期沟通停滞。历史有 €45,200 成交记录，当前处于公海且站点暂停。预计成交概率 40%。建议运营确认归属后重新分配，优先补发交期说明重启沟通。",
      aiSuggestion:"建议运营确认站点恢复计划后重新分配负责人，优先补发交期说明重启沟通。",
      dataSources:["CRM录入","网站表单","邮件记录","跟进记录","合同记录","外部企业信息"]
    },
    "CUS-2026-0048":{
      shortName:"Moda Italia",website:"www.modaitalia.it",logo:"MI",city:"Milan",founded:"2010",scale:"中型企业",employees:"200-500人",revenue:"3000万-5000万 EUR",industry:"服装",subIndustry:"高端围巾/配饰",nature:"S.p.A 股份有限公司",
      companyIntro:"意大利中高端服装分销商，样品驱动型采购模式。",
      mainBusiness:"羊毛大衣、围巾、披肩季节性采购。",
      targetMarket:"意大利、法国、西班牙分销渠道",
      purchaseProfile:{focusedProducts:"羊毛围巾、披肩",productDirection:"深色系样品测试",purchaseNeeds:"样品清单与颜色反馈",concerns:"样品颜色、首单试产条款"},
      certified:true,certs:["ISO9001","OEKO-TEX","GRS","Made in Italy"],
      bizType:"分销商",mainMarkets:["意大利","法国","西班牙"],purchaseMode:"样品驱动 + 首单试产",purchaseFreq:"季节性采购",annualPurchase:"€100-300万",productLines:["羊毛大衣","围巾","披肩"],
      valueScore:68,scoreDims:{scale:75,potential:80,history:48,active:78,probability:58},valueLabel:"C类客户",followPriority:"培育中",isTarget:true,coopStage:"打样中",dealProbability:"58%",
      activityLabel:"近7天活跃",healthStatus:"健康",healthRisks:[],
      aiSummary:"该客户为意大利中高端服装分销商，当前处于样品反馈阶段。邮件与 WhatsApp 均有活跃沟通，偏好深色系样品，暂无关联合同。",
      aiAnalysis:"客户为意大利中高端服装分销商，样品驱动型采购模式。近30天沟通频率较高，偏好深色系样品，暂无成交记录。预计成交概率 58%。建议 6/18 前跟进颜色反馈，确认后可推进报价与首单试产。",
      aiSuggestion:"样品清单已发送，建议 6/18 前跟进颜色反馈，确认后可推进报价与首单试产。",
      dataSources:["CRM录入","邮件记录","WhatsApp","接口拉取","跟进记录"]
    }
  },
  sites:[
    {id:"SITE-001",name:"天猫苏豪站",domain:"sutex.tmall.com",status:"运营中",dept:"外贸事业部",operator:"刘运营",seller:"张明远",collab:"陈协同",leads:128,customers:86,conversion:"26.6%"},
    {id:"SITE-002",name:"苏豪独立站A",domain:"www.sutex-a.com",status:"运营中",dept:"外贸事业部",operator:"刘运营",seller:"李晓燕",collab:"周协同",leads:82,customers:49,conversion:"22.0%"},
    {id:"SITE-003",name:"苏豪独立站B",domain:"www.sutex-b.com",status:"暂停",dept:"外贸事业部",operator:"赵运营",seller:"王芳",collab:"-",leads:44,customers:21,conversion:"13.8%"}
  ],
  contracts:[
    {id:"PC-2026-0171",customer:"Royal Textile House",site:"天猫苏豪站",lead:"LEAD-2026-0939",amount:"$22,400",date:"2026-05-28",latestDeal:"2026-05-28 16:40",seller:"张明远",source:"邮件",sync:"普泽同步",state:"已完成",external:"普泽系统已同步",attachment:"PDF / 1个附件"},
    {id:"PC-2026-0160",customer:"Global Trade Co.",site:"天猫苏豪站",lead:"LEAD-2026-0911",amount:"$18,600",date:"2026-06-16",latestDeal:"2026-06-19 14:20",seller:"张明远",source:"网站表单",sync:"普成同步",state:"已完成",external:"普成系统已同步",attachment:"PDF / 2个附件"},
    {id:"PC-2026-0156",customer:"Bella Home Deco",site:"天猫苏豪站",lead:"LEAD-2026-0909",amount:"$12,800",date:"2026-06-15",latestDeal:"2026-06-18 09:45",seller:"张明远",source:"WhatsApp",sync:"普泽同步",state:"已完成",external:"普泽系统已同步",attachment:"PDF / 1个附件"},
    {id:"PC-2026-0157",customer:"Bella Home Deco",site:"天猫苏豪站",lead:"LEAD-2026-0909",amount:"$28,500",date:"2026-05-20",latestDeal:"2026-06-10 11:00",seller:"张明远",source:"WhatsApp",sync:"普泽同步",state:"已完成",external:"普泽系统已同步",attachment:"PDF / 1个附件"},
    {id:"PC-2026-0148",customer:"Nordic Style AB",site:"苏豪独立站A",lead:"LEAD-2026-0854",amount:"$28,500",date:"2026-06-12",latestDeal:"2026-06-14 17:30",seller:"李晓燕",source:"邮件",sync:"导入完成",state:"已完成",external:"导入完成",attachment:"PDF / 1个附件"},
    {id:"PC-2026-0132",customer:"Euro Furniture GmbH",site:"苏豪独立站B",lead:"LEAD-2026-0788",amount:"€45,200",date:"2026-05-26",latestDeal:"2026-06-03 11:15",seller:"王芳",source:"网站表单",sync:"待同步",state:"已完成",external:"外部系统待同步",attachment:"无附件"},
    {id:"PC-2026-0120",customer:"Luna Fabrics",site:"苏豪独立站A",lead:"LEAD-2026-0912",amount:"$9,800",date:"2026-06-20",latestDeal:"-",seller:"李晓燕",source:"手动录入",sync:"导入完成",state:"生效中",external:"导入完成",attachment:"无附件"}
  ],
  contractCustomers:[
    {customer:"Bella Home Deco",site:"天猫苏豪站",owner:"张明远",contracts:2,amount:"$41,300",latest:"PC-2026-0156",latestSignDate:"2026-06-15",lead:"LEAD-2026-0909",contact:"Anna Keller",risk:"无",customerId:"CUS-2026-0079"},
    {customer:"Nordic Style AB",site:"苏豪独立站A",owner:"李晓燕",contracts:1,amount:"$28,500",latest:"PC-2026-0148",latestSignDate:"2026-06-12",lead:"LEAD-2026-0854",contact:"Erik Lund",risk:"待回款关注",customerId:"CUS-2026-0065"},
    {customer:"Euro Furniture GmbH",site:"苏豪独立站B",owner:"王芳",contracts:1,amount:"€45,200",latest:"PC-2026-0132",latestSignDate:"2026-05-26",lead:"LEAD-2026-0788",contact:"Hans Mueller",risk:"站点暂停，需确认后续归属",customerId:"CUS-2026-0051"},
    {customer:"Global Trade Co.",site:"天猫苏豪站",owner:"张明远",contracts:1,amount:"$18,600",latest:"PC-2026-0160",latestSignDate:"2026-06-16",lead:"LEAD-2026-0911",contact:"Michael Johnson",risk:"报价打样中",customerId:"CUS-2026-0081"},
    {customer:"Moda Italia S.p.A",site:"苏豪独立站A",owner:"王芳",contracts:0,amount:"-",latest:"-",latestSignDate:"-",lead:"LEAD-2026-0908",contact:"Mario Rossi",risk:"样品阶段，暂无合同",customerId:"CUS-2026-0048"}
  ],
  emails:[
    {id:"MAIL-IN-001",box:"inbox",accountId:"ACC-001",mailbox:"zsn@sutex.net.cn",time:"今天 09:31",from:"info@globaltrade.com",to:"zsn@sutex.net.cn",customer:"Global Trade Co.",subject:"Re: Spring 2026 Product Catalog Request",summary:"Thank you for sending the catalog. We are interested in the wool series and MOQ details.",aiIntent:"高意向 / 询价",aiBrief:"客户重点关注 MOQ、样品单与运费承担方式。",convertMode:"已关联线索",status:"未读",owner:"张明远",lead:"LEAD-2026-0911"},
    {id:"MAIL-IN-002",box:"inbox",accountId:"ACC-003",mailbox:"sales@sutex.net.cn",time:"昨天 17:20",from:"purchase@sunfashion.co.uk",to:"sales@sutex.net.cn",customer:"Sun Fashion Ltd.",subject:"Inquiry: Cashmere Scarves MOQ",summary:"Could you please let us know the minimum order quantity for cashmere scarves?",aiIntent:"待转线索",aiBrief:"已识别为有效询盘，建议补充确认采购量后转入跟进。",convertMode:"待确认转线索",status:"未读",owner:"李晓燕",lead:"LEAD-2026-0910"},
    {id:"MAIL-IN-003",box:"inbox",accountId:"ACC-001",mailbox:"zsn@sutex.net.cn",time:"昨天 14:05",from:"bella@homedeco.de",to:"zsn@sutex.net.cn",customer:"Bella Home Deco",subject:"Order Confirmation - PC-2026-0156",summary:"We confirm the order for the following products and need the signed contract copy.",aiIntent:"成交确认",aiBrief:"客户确认下单，需补发签章合同并同步历史沟通。",convertMode:"已关联合同",status:"已读",owner:"张明远",lead:"LEAD-2026-0909"},
    {id:"MAIL-IN-004",box:"inbox",accountId:"ACC-001",mailbox:"zsn@sutex.net.cn",time:"2天前",from:"orders@modaitalia.it",to:"zsn@sutex.net.cn",customer:"Moda Italia S.p.A",subject:"Product Sample Request",summary:"We would like to request samples of your new autumn collection.",aiIntent:"样品申请",aiBrief:"建议回复打样周期，并将邮件沉淀到跟进日志。",convertMode:"已关联线索",status:"未读",owner:"王芳",lead:"LEAD-2026-0908"},
    {id:"MAIL-IN-005",box:"inbox",accountId:"ACC-003",mailbox:"sales@sutex.net.cn",time:"今天 08:45",from:"buying@lunafabrics.es",to:"sales@sutex.net.cn",customer:"Luna Fabrics",subject:"Inquiry: Wool Shawl Wholesale Pricing",summary:"We are a textile wholesaler in Spain looking for wool shawls. Please share your wholesale price list and MOQ.",aiIntent:"高意向 / 询价",aiBrief:"客户为西班牙纺织品批发商，首次联系，建议快速报价并确认样品需求。",convertMode:"待确认转线索",status:"未读",owner:"李晓燕",lead:"LEAD-2026-0912"},
    {id:"MAIL-IN-006",box:"inbox",accountId:"ACC-001",mailbox:"zsn@sutex.net.cn",time:"今天 10:38",from:"john@abc-tech.de",to:"zsn@sutex.net.cn",customer:"ABC Technology GmbH",subject:"OEM Technical Textiles Partnership Inquiry",summary:"We are ABC Technology GmbH from Stuttgart. We are looking for OEM partners for industrial and technical textiles for export markets.",aiIntent:"高意向 / OEM",aiBrief:"德国制造企业首次来信，AI 已自动识别企业背景，建议优先跟进。",convertMode:"未入库",status:"未读",owner:"张明远",lead:"-"},
    {id:"MAIL-IN-007",box:"inbox",accountId:"ACC-003",mailbox:"sales@sutex.net.cn",time:"今天 11:05",from:"david.shop@gmail.com",to:"sales@sutex.net.cn",customer:"David",subject:"Scarf price inquiry",summary:"Hi, I'm looking for scarf suppliers. Can you send me your price list?",aiIntent:"待评估",aiBrief:"个人 Gmail 来信，仅署名 David，未识别企业主体。",convertMode:"未入库",status:"未读",owner:"李晓燕",lead:"-"},
    {id:"MAIL-SENT-001",box:"sent",accountId:"ACC-002",mailbox:"noreply@sutex.net.cn",time:"今天 10:12",from:"noreply@sutex.net.cn",to:"info@globaltrade.com",customer:"Global Trade Co.",subject:"Spring 2026 Wool Series Quotation",summary:"Attached please find the quotation and catalog for wool series products.",aiIntent:"AI草拟后人工修改",aiBrief:"已补充样品单和 MOQ 条款。",convertMode:"已发送",status:"已发送",owner:"张明远",lead:"LEAD-2026-0911"},
    {id:"MAIL-SENT-002",box:"sent",accountId:"ACC-003",mailbox:"sales@sutex.net.cn",time:"昨天 18:02",from:"sales@sutex.net.cn",to:"purchase@sunfashion.co.uk",customer:"Sun Fashion Ltd.",subject:"Re: Cashmere Scarves MOQ",summary:"We shared MOQ, sample cost and estimated delivery schedule.",aiIntent:"人工回复",aiBrief:"无",convertMode:"已发送",status:"已发送",owner:"李晓燕",lead:"LEAD-2026-0910"},
    {id:"MAIL-DRAFT-001",box:"draft",accountId:"ACC-003",mailbox:"sales@sutex.net.cn",time:"今天 11:20",from:"sales@sutex.net.cn",to:"orders@modaitalia.it",customer:"Moda Italia S.p.A",subject:"Re: Product Sample Request",summary:"Draft reply about autumn collection samples, lead time and sample fee.",aiIntent:"AI建议草稿",aiBrief:"待人工确认附件和交期承诺。",convertMode:"草稿待发送",status:"草稿",owner:"王芳",lead:"LEAD-2026-0908"},
    {id:"MAIL-DRAFT-002",box:"draft",accountId:"ACC-002",mailbox:"noreply@sutex.net.cn",time:"昨天 16:45",from:"noreply@sutex.net.cn",to:"anna@homedeco.de",customer:"Bella Home Deco",subject:"Signed Contract Copy - PC-2026-0156",summary:"Draft for sending signed contract copy and confirming delivery schedule.",aiIntent:"合同同步",aiBrief:"待人工补充交期说明。",convertMode:"草稿待发送",status:"草稿",owner:"张明远",lead:"LEAD-2026-0909"}
  ],
  chats:[
    {id:"WA-001",time:"今天 09:31",customer:"Global Trade Co.",contact:"Michael Johnson",account:"WhatsApp Business 主账号",phone:"+1-555-0181",preview:"Can you offer a sample order of 50 pcs first?",status:"待回复",owner:"张明远",lead:"LEAD-2026-0911",last:"09:31",unread:2,stage:"报价打样",warehouse:"实时入库",summary:"本小时沟通摘要已生成",convertMode:"已关联线索"},
    {id:"WA-002",time:"昨天 16:20",customer:"Bella Home Deco",contact:"Anna Keller",account:"WhatsApp Business 主账号",phone:"+49-171-8823",preview:"Order confirmed! Please send the signed contract copy.",status:"已回复",owner:"张明远",lead:"LEAD-2026-0909",last:"昨天",unread:0,stage:"已成交",warehouse:"实时入库",summary:"当日沟通摘要已生成",convertMode:"已转客户"},
    {id:"WA-003",time:"昨天 11:12",customer:"Sun Fashion Ltd.",contact:"Helen Smith",account:"WhatsApp Business 主账号",phone:"+44-7711-2200",preview:"Could you check the MOQ for cashmere scarves?",status:"待回复",owner:"李晓燕",lead:"LEAD-2026-0910",last:"昨天",unread:1,stage:"待首响",warehouse:"实时入库",summary:"待生成本小时沟通摘要",convertMode:"待确认转线索"},
    {id:"WA-004",time:"2天前",customer:"Nordic Style AB",contact:"Erik Lund",account:"WhatsApp Business 备用账号",phone:"+46-70-1122",preview:"Hi, I need a quote for autumn wool blankets.",status:"已回复",owner:"李晓燕",lead:"LEAD-2026-0854",last:"2天前",unread:0,stage:"深度沟通",warehouse:"实时入库",summary:"当日沟通摘要已生成",convertMode:"已转客户"},
    {id:"WA-005",time:"3天前",customer:"Moda Italia S.p.A",contact:"Mario Rossi",account:"WhatsApp Business 备用账号",phone:"+39-331-8899",preview:"When can you ship the samples?",status:"已回复",owner:"王芳",lead:"LEAD-2026-0908",last:"3天前",unread:0,stage:"报价打样",warehouse:"实时入库",summary:"当日沟通摘要已生成",convertMode:"已关联线索"},
    {id:"WA-006",time:"今天 09:13",customer:"Harbor Linens LLC",contact:"James Porter",account:"WhatsApp Business 主账号",phone:"+1-212-9901",preview:"We need hospitality linen sample — 50 pcs first order possible?",status:"待回复",owner:"张明远",lead:"-",last:"09:13",unread:3,stage:"待认领",warehouse:"实时入库",summary:"陌生 WhatsApp 询盘 · AI 来件人洞察已生成",convertMode:"未入库"}
  ],
  commAccounts:[
    {id:"ACC-001",type:"邮箱 IMAP",name:"主收件邮箱",account:"zsn@sutex.net.cn",server:"imap.163.com:993 / SSL",purpose:"收件 + 入库",status:"正常",forward:"开启",warehouse:"自动入库",lastSync:"2026-06-16 09:15",owner:"运营统一"},
    {id:"ACC-002",type:"邮箱 SMTP",name:"统一发件邮箱",account:"noreply@sutex.net.cn",server:"smtp.163.com:465 / SSL",purpose:"发件 + 转发",status:"正常",forward:"开启",warehouse:"—",lastSync:"2026-06-16 10:12",owner:"运营统一"},
    {id:"ACC-003",type:"邮箱 IMAP",name:"销售备用邮箱",account:"sales@sutex.net.cn",server:"imap.exmail.qq.com:993 / SSL",purpose:"多邮箱接入",status:"正常",forward:"按规则",warehouse:"自动入库",lastSync:"2026-06-16 08:50",owner:"销售组"},
    {id:"ACC-004",type:"WhatsApp",name:"WhatsApp Business 主账号",account:"+86 138****8888",server:"Meta Cloud API",purpose:"客户会话",status:"正常",forward:"—",warehouse:"实时入库",lastSync:"2026-06-16 09:31",owner:"外贸事业部"},
    {id:"ACC-005",type:"WhatsApp",name:"WhatsApp Business 备用账号",account:"+86 139****6666",server:"Meta Cloud API",purpose:"备用会话",status:"正常",forward:"—",warehouse:"实时入库",lastSync:"2026-06-15 18:20",owner:"外贸事业部"}
  ],
  contacts:[
    {id:"CON-001",customer:"Global Trade Co.",name:"Michael Johnson",role:"采购经理",email:"michael@globaltrade.com",phone:"+1-212-555-0181",whatsapp:"+1-555-0181",decision:"关键决策人",contactRole:"决策人",aiRole:"决策人",last:"2026-06-16",owner:"张明远"},
    {id:"CON-002",customer:"Bella Home Deco",name:"Anna Keller",role:"Owner",email:"anna@homedeco.de",phone:"+49-89-1234567",whatsapp:"+49-171-8823",decision:"老板",contactRole:"决策人",aiRole:"决策人",last:"2026-06-15",owner:"张明远"},
    {id:"CON-003",customer:"Nordic Style AB",name:"Erik Lund",role:"采购",email:"erik@nordicstyle.se",phone:"+46-8-123456",whatsapp:"-",decision:"影响人",contactRole:"采购负责人",aiRole:"采购负责人",last:"2026-06-08",owner:"李晓燕"},
    {id:"CON-004",customer:"Global Trade Co.",name:"Sarah Chen",role:"供应链",email:"sarah@globaltrade.com",phone:"+1-212-555-0199",whatsapp:"-",decision:"执行联系人",contactRole:"执行联系人",aiRole:"关键联系人",last:"2026-06-14",owner:"张明远"},
    {id:"CON-005",customer:"Bella Home Deco",name:"Thomas Weber",role:"采购助理",email:"thomas@homedeco.de",phone:"+49-89-1234568",whatsapp:"-",decision:"执行联系人",contactRole:"执行联系人",aiRole:"关键联系人",last:"2026-06-10",owner:"张明远"},
    {id:"CON-006",customer:"Euro Furniture GmbH",name:"Hans Mueller",role:"采购总监",email:"hans@eurofurniture.de",phone:"+49-30-9988776",whatsapp:"+49-170-9988",decision:"关键决策人",contactRole:"决策人",aiRole:"决策人",last:"2026-06-02",owner:"王芳"},
    {id:"CON-007",customer:"Moda Italia S.p.A",name:"Mario Rossi",role:"采购经理",email:"mario@modaitalia.it",phone:"+39-02-8877665",whatsapp:"+39-331-8899",decision:"关键决策人",contactRole:"采购负责人",aiRole:"采购负责人",last:"2026-06-15",owner:"王芳"}
  ],
  tags:[
    {id:"TAG-001",code:"TAG-HIGH-INTENT",name:"高意向",category:"客户等级",target:"客户",mode:"手动+AI自动",status:"启用",color:"green",count:42,rule:"产品意向包含 wool/cashmere",createdAt:"2026-01-10",updatedAt:"2026-06-01"},
    {id:"TAG-002",code:"TAG-MOQ",name:"MOQ关注",category:"产品偏好",target:"客户",mode:"手动",status:"启用",color:"amber",count:28,rule:"询盘内容提及 MOQ / minimum order",createdAt:"2026-01-12",updatedAt:"2026-05-18"},
    {id:"TAG-003",code:"TAG-SAMPLE",name:"样品敏感",category:"产品偏好",target:"客户",mode:"手动",status:"启用",color:"blue",count:15,rule:"业务员手工打标",createdAt:"2026-02-01",updatedAt:"2026-06-10"},
    {id:"TAG-004",code:"TAG-PRICE",name:"价格敏感",category:"风险",target:"客户",mode:"手动",status:"启用",color:"amber",count:12,rule:"报价阶段多次议价",createdAt:"2026-02-15",updatedAt:"2026-05-22"},
    {id:"TAG-005",code:"TAG-BIG",name:"大客户",category:"客户等级",target:"客户",mode:"手动",status:"启用",color:"green",count:8,rule:"累计合同金额超 $50K",createdAt:"2026-03-01",updatedAt:"2026-06-12"},
    {id:"TAG-006",code:"TAG-OVERDUE",name:"超期未跟进",category:"风险",target:"客户",mode:"AI自动",status:"启用",color:"red",count:6,rule:"下次跟进时间小于今日",createdAt:"2026-03-10",updatedAt:"2026-06-16"},
    {id:"TAG-007",code:"TAG-CONTRACT",name:"合同推进中",category:"客户等级",target:"客户",mode:"AI自动",status:"启用",color:"cyan",count:10,rule:"关联合同为生效中状态",createdAt:"2026-03-15",updatedAt:"2026-06-14"},
    {id:"TAG-008",code:"TAG-FIRST",name:"待首响",category:"风险",target:"线索",mode:"AI自动",status:"启用",color:"red",count:18,rule:"分配后 2 小时未首响",createdAt:"2026-04-01",updatedAt:"2026-06-16"},
    {id:"TAG-009",code:"TAG-REGION-EU",name:"欧洲市场",category:"区域市场",target:"客户",mode:"手动+AI自动",status:"启用",color:"blue",count:35,rule:"国家属于欧洲区域",createdAt:"2026-04-10",updatedAt:"2026-06-08"},
    {id:"TAG-010",code:"TAG-LEGACY",name:"旧版标签",category:"产品偏好",target:"客户",mode:"手动",status:"停用",color:"gray",count:0,rule:"已停用，不可新打标",createdAt:"2025-12-01",updatedAt:"2026-03-01"}
  ],
  leadTagPresets:[
    {code:"LT-HIGH",name:"高意向",category:"意向等级",createdAt:"2026-01-15",updatedAt:"2026-05-20"},
    {code:"LT-EU",name:"欧洲市场",category:"区域市场",createdAt:"2026-01-15",updatedAt:"2026-05-10"},
    {code:"LT-US",name:"北美市场",category:"区域市场",createdAt:"2026-01-15",updatedAt:"2026-05-10"},
    {code:"LT-AIREC",name:"AI推荐",category:"AI洞察",createdAt:"2026-02-01",updatedAt:"2026-06-16"},
    {code:"LT-CONTACT",name:"已联系",category:"跟进状态",createdAt:"2026-01-20",updatedAt:"2026-05-25"},
    {code:"LT-EXPO",name:"展会客户",category:"来源类型",createdAt:"2026-02-10",updatedAt:"2026-05-18"},
    {code:"LT-REF",name:"老客户介绍",category:"来源类型",createdAt:"2026-02-10",updatedAt:"2026-05-18"},
    {code:"LT-KEY",name:"重点跟进",category:"跟进状态",createdAt:"2026-01-20",updatedAt:"2026-06-01"},
    {code:"LT-MOQ",name:"MOQ关注",category:"产品偏好",createdAt:"2026-02-05",updatedAt:"2026-05-30"},
    {code:"LT-SAMPLE",name:"样品意向",category:"产品偏好",createdAt:"2026-02-05",updatedAt:"2026-05-30"},
    {code:"LT-URGENT",name:"紧急需求",category:"AI洞察",createdAt:"2026-02-01",updatedAt:"2026-06-16"},
    {code:"LT-MATCH",name:"产品匹配",category:"AI洞察",createdAt:"2026-02-01",updatedAt:"2026-06-16"}
  ],
  leadTagAssignments:{
    "LEAD-2026-0913":[
      {name:"高意向",source:"ai",status:"confirmed"},
      {name:"AI推荐",source:"ai",status:"confirmed"},
      {name:"高采购意向",source:"ai",status:"pending"},
      {name:"产品匹配",source:"ai",status:"pending"},
      {name:"北美市场",source:"system",preset:"LT-US"},
      {name:"重点跟进",source:"business",owner:"张明远"}
    ],
    "LEAD-2026-0912":[
      {name:"MOQ关注",source:"system",preset:"LT-MOQ"},
      {name:"欧洲市场",source:"system",preset:"LT-EU"},
      {name:"展会客户",source:"business",owner:"李晓燕"}
    ],
    "LEAD-2026-0911":[
      {name:"高意向",source:"ai",status:"confirmed"},
      {name:"样品意向",source:"system",preset:"LT-SAMPLE"},
      {name:"已联系",source:"business",owner:"张明远"},
      {name:"重点跟进",source:"business",owner:"张明远"}
    ],
    "LEAD-2026-0910":[
      {name:"MOQ关注",source:"system",preset:"LT-MOQ"},
      {name:"待首响",source:"system",preset:"LT-CONTACT"},
      {name:"欧洲市场",source:"system",preset:"LT-EU"}
    ],
    "LEAD-2026-0908":[
      {name:"样品意向",source:"business",owner:"王芳"},
      {name:"欧洲市场",source:"system",preset:"LT-EU"},
      {name:"已联系",source:"business",owner:"王芳"}
    ],
    "LEAD-2026-0916":[
      {name:"高意向",source:"ai",status:"confirmed"},
      {name:"AI推荐",source:"ai",status:"confirmed"},
      {name:"紧急需求",source:"ai",status:"pending"},
      {name:"欧洲市场",source:"system",preset:"LT-EU"}
    ],
    "LEAD-2026-0854":[
      {name:"MOQ关注",source:"system",preset:"LT-MOQ"},
      {name:"老客户介绍",source:"business",owner:"李晓燕"},
      {name:"已联系",source:"business",owner:"李晓燕"}
    ],
    "LEAD-2026-0918":[
      {name:"高意向",source:"ai",status:"confirmed"},
      {name:"AI推荐",source:"ai",status:"confirmed"},
      {name:"欧洲市场",source:"system",preset:"LT-EU"},
      {name:"超时释放",source:"system",preset:"LT-KEY"}
    ]
  },
  leadTagHistory:{
    "LEAD-2026-0913":[
      {time:"2026-06-16 09:15",action:"AI打标",detail:"推荐标签：高采购意向、产品匹配、紧急需求",operator:"AI引擎"},
      {time:"2026-06-16 09:14",action:"确认AI标签",detail:"高意向、AI推荐",operator:"系统"},
      {time:"2026-06-16 09:13",action:"系统预设",detail:"自动打标：北美市场",operator:"系统"},
      {time:"2026-06-16 09:10",action:"添加业务标签",detail:"重点跟进",operator:"张明远"}
    ],
    "LEAD-2026-0911":[
      {time:"2026-06-16 09:08",action:"转客户标签映射",detail:"保留线索标签历史；高意向、MOQ关注 已映射为客户标签（未覆盖原有客户标签）",operator:"张明远"},
      {time:"2026-06-16 09:06",action:"确认AI标签",detail:"高意向",operator:"张明远"},
      {time:"2026-06-16 09:05",action:"添加业务标签",detail:"重点跟进、已联系",operator:"张明远"}
    ]
  },
  aiConfig:{...DEFAULT_AI_CONFIG},
  aiAnalysisResult:null,
  systemRuleGroups:[
    {title:"线索入池规则",rules:[
      {name:"有效询盘自动入池",desc:"站点接口、网站表单等渠道识别的有效询盘，自动进入公海池等待分配。",value:"开启"}
    ]},
    {title:"邮件采集规则",rules:[
      {name:"采集邮箱来件自动创建线索",desc:"运营邮箱收到来件后，按解析规则生成线索或进入待确认队列。",value:"开启"},
      {name:"陌生发件人自动创建线索",desc:"发件人未匹配现有客户/联系人时，是否自动创建新线索。",value:"关闭"}
    ]},
    {title:"线索过期规则",note:"超过设定时间未跟进，线索将自动退回公海池。",rules:[
      {name:"未跟进自动回收天数",desc:"业务员负责线索在期限内无任何跟进记录时，系统自动回收至公海池。",value:"14天"}
    ]},
    {title:"客户分配规则",rules:[
      {name:"客户负责人变更是否同步线索负责人",desc:"客户转移或负责人调整时，关联线索负责人是否一并更新。",value:"是"}
    ]},
    {title:"合同归属规则",rules:[
      {name:"新增合同自动归属客户负责人",desc:"录入或关联合同时，默认将合同业务员设为客户当前负责人。",value:"是"}
    ]},
    {title:"消息提醒规则",rules:[
      {name:"线索分配提醒",desc:"线索分配至业务员时，向负责人发送站内消息/待办提醒。",value:"开启"},
      {name:"待跟进提醒",desc:"线索/客户超过跟进周期未更新时，推送待跟进提醒。",value:"开启"},
      {name:"合同签约提醒",desc:"合同状态变更为已签约时，通知客户负责人与运营协同人。",value:"开启"}
    ]}
  ],
  follow:[
    {id:"FOL-001",time:"2026-06-16 09:30",customer:"Global Trade Co.",target:"客户 + 线索 LEAD-2026-0911",method:"邮件",state:"报价打样",summary:"发送羊毛系列报价单，客户关注 MOQ 灵活性与样品运费。",feedback:"关注 MOQ、样品费、运费",nextPlan:"2026-06-17 二次报价确认",owner:"张明远",collection:"自动采集+人工补充",keywords:"MOQ / 样品费 / 运费",origin:"原始邮件 MAIL-IN-001"},
    {id:"FOL-002",time:"2026-06-16 09:15",customer:"Global Trade Co.",target:"线索 LEAD-2026-0911",method:"邮件",state:"首次联系",summary:"通过邮件回复客户询盘，确认产品目录已发送并询问具体需求。",feedback:"等待客户确认产品系列",nextPlan:"2026-06-16 发送报价",owner:"张明远",collection:"人工录入",keywords:"首响 / 产品目录",origin:"邮件"},
    {id:"FOL-003",time:"2026-06-15 16:20",customer:"Bella Home Deco",target:"客户 + 合同 PC-2026-0156",method:"WhatsApp",state:"已成交",summary:"客户确认订单，合同 PC-2026-0156 已完成关联展示。",feedback:"确认订单并要求同步合同附件",nextPlan:"2026-06-21 交期确认",owner:"张明远",collection:"会话自动沉淀",keywords:"订单确认 / 合同附件",origin:"WhatsApp WA-002"},
    {id:"FOL-004",time:"2026-06-08 11:12",customer:"Nordic Style AB",target:"客户 CUS-2026-0065",method:"电话",state:"深度沟通",summary:"确认秋季产品需求，约定本周内提供样品方案。",feedback:"需要秋季样品方案",nextPlan:"2026-06-16 发送样品方案",owner:"李晓燕",collection:"人工录入",keywords:"秋季需求 / 样品方案",origin:"电话纪要"},
    {id:"FOL-005",time:"2026-06-15 16:30",customer:"Moda Italia S.p.A",target:"客户 + 线索 LEAD-2026-0908",method:"邮件",state:"报价打样",summary:"发送样品清单及报价，客户确认样品颜色偏好为深色系。",feedback:"确认深色系样品偏好",nextPlan:"2026-06-18 跟进样品反馈",owner:"王芳",collection:"人工录入",keywords:"样品清单 / 颜色偏好",origin:"邮件"},
    {id:"FOL-006",time:"2026-06-15 09:00",customer:"Moda Italia S.p.A",target:"线索 LEAD-2026-0908",method:"邮件",state:"首次联系",summary:"回复客户样品申请邮件，确认打样周期及样品费用安排。",feedback:"等待样品费用确认",nextPlan:"2026-06-16 发送样品清单",owner:"王芳",collection:"人工录入",keywords:"样品申请 / 打样周期",origin:"原始邮件 MAIL-IN-004"},
    {id:"FOL-007",time:"2026-06-02 13:40",customer:"Euro Furniture GmbH",target:"客户 CUS-2026-0051",method:"邮件",state:"深度沟通",summary:"讨论秋季家具纺织品合作方案，客户要求补充交期说明。",feedback:"关注交期与 MOQ",nextPlan:"已超期，需重新跟进",owner:"王芳",collection:"人工录入",keywords:"交期 / MOQ",origin:"邮件"},
    {id:"FOL-008",time:"2026-06-14 10:30",customer:"Moda Italia S.p.A",target:"线索 LEAD-2026-0908",method:"系统",state:"收到询盘",summary:"客户通过接口拉取进入询盘池，产品意向：羊毛大衣。",feedback:"-",nextPlan:"-",owner:"系统",collection:"自动采集",keywords:"接口入池 / 羊毛大衣",origin:"系统"},
    {id:"FOL-009",time:"2026-05-28 11:00",customer:"Classic Linens Co.",target:"线索 LEAD-2026-0926",method:"邮件",state:"深度沟通",summary:"连续三轮邮件未获回复，标记为长期无回复流失。",feedback:"无回复",nextPlan:"—",owner:"张明远",collection:"人工录入",keywords:"无回复 / 流失",origin:"邮件"},
    {id:"FOL-010",time:"2026-05-20 09:30",customer:"Budget Home Import",target:"线索 LEAD-2026-0927",method:"电话",state:"报价阶段",summary:"客户反馈目标价低于报价 18%，无法接受我方 MOQ 条款。",feedback:"价格原因放弃",nextPlan:"—",owner:"张明远",collection:"人工录入",keywords:"价格 / 流失",origin:"电话纪要"},
    {id:"FOL-011",time:"2026-06-01 16:00",customer:"StyleCraft BV",target:"线索 LEAD-2026-0928",method:"WhatsApp",state:"谈判阶段",summary:"客户确认已与竞争对手签约，终止本轮采购。",feedback:"竞争对手成交",nextPlan:"—",owner:"张明远",collection:"会话自动沉淀",keywords:"竞品 / 流失",origin:"WhatsApp"},
    {id:"FOL-012",time:"2026-05-15 10:00",customer:"Ocean Trade LLC",target:"线索 LEAD-2026-0929",method:"邮件",state:"首次联系",summary:"客户回复暂无采购计划，请求停止后续联系。",feedback:"无采购需求",nextPlan:"—",owner:"李晓燕",collection:"人工录入",keywords:"无需求 / 流失",origin:"邮件"},
    {id:"FOL-013",time:"2026-06-05 14:20",customer:"Fabric World SA",target:"线索 LEAD-2026-0930",method:"邮件",state:"样品阶段",summary:"样品测试后反馈规格不匹配，终止合作洽谈。",feedback:"产品规格不符",nextPlan:"—",owner:"张明远",collection:"人工录入",keywords:"产品不匹配 / 流失",origin:"邮件"},
    {id:"FOL-014",time:"2026-06-15 10:30",customer:"Verona Textiles SRL",target:"线索 LEAD-2026-0933",method:"邮件",state:"首次联系",summary:"完成首响并确认客户对羊毛围巾系列的基础需求。",feedback:"等待确认具体规格",nextPlan:"2026-06-17 发送目录",owner:"张明远",collection:"人工录入",keywords:"首响 / 需求收集",origin:"邮件"},
    {id:"FOL-015",time:"2026-06-14 16:00",customer:"Nordic Comfort AS",target:"线索 LEAD-2026-0934",method:"WhatsApp",state:"深度沟通",summary:"确认 Q3 靠垫补货数量与色系偏好，进入需求确认阶段。",feedback:"关注交期与认证",nextPlan:"2026-06-18 样品方案",owner:"张明远",collection:"会话自动沉淀",keywords:"需求确认 / Q3补货",origin:"WhatsApp"},
    {id:"FOL-016",time:"2026-06-13 09:00",customer:"Maison Decor FR",target:"线索 LEAD-2026-0935",method:"邮件",state:"报价打样",summary:"样品已寄出，物流单号 DHL 8294756123，等待客户测试反馈。",feedback:"等待样品签收",nextPlan:"2026-06-20 跟进样品",owner:"张明远",collection:"人工录入",keywords:"样品寄送 / 打样",origin:"邮件"},
    {id:"FOL-017",time:"2026-06-12 11:30",customer:"Heritage Wool Co.",target:"线索 LEAD-2026-0936",method:"邮件",state:"报价阶段",summary:"发送传统羊毛毯系列报价单，客户关注 MOQ 与交期。",feedback:"价格可接受，待确认交期",nextPlan:"2026-06-19 二次确认",owner:"张明远",collection:"人工录入",keywords:"报价 / MOQ",origin:"邮件"},
    {id:"FOL-018",time:"2026-06-11 14:00",customer:"Elite Home GmbH",target:"线索 LEAD-2026-0937",method:"电话",state:"谈判阶段",summary:"与客户采购总监电话沟通付款条款与分批交货方案。",feedback:"需内部审批",nextPlan:"2026-06-20 合同草案",owner:"张明远",collection:"人工录入",keywords:"谈判 / 付款条款",origin:"电话纪要"},
    {id:"FOL-019",time:"2026-05-28 16:40",customer:"Royal Textile House",target:"线索 LEAD-2026-0939",method:"邮件",state:"已成交",summary:"合同 PC-2026-0171 已录入并完成 CRM 关联。",feedback:"确认签约",nextPlan:"2026-06-10 首批发货",owner:"张明远",collection:"自动采集+人工补充",keywords:"成交 / 合同录入",origin:"邮件"}
  ],
  tasks:[
    {id:"TASK-001",lead:"LEAD-2026-0911",site:"天猫苏豪站",customer:"Global Trade Co.",task:"报价二次跟进",deadline:"今日 16:00",overdue:"未超期",priority:"高",owner:"张明远",next:"确认 MOQ、样品费和运费承担方式",stage:"跟进中",relatedEmail:"MAIL-IN-001"},
    {id:"TASK-002",lead:"LEAD-2026-0910",site:"苏豪独立站A",customer:"Sun Fashion Ltd.",task:"首响联系",deadline:"今日 11:30",overdue:"已超期 2小时",priority:"高",owner:"李晓燕",next:"发送开司米围巾初步报价并确认采购量",stage:"待首响",relatedEmail:"MAIL-IN-002"},
    {id:"TASK-003",lead:"LEAD-2026-0908",site:"苏豪独立站B",customer:"Moda Italia S.p.A",task:"样品反馈跟进",deadline:"明日 10:00",overdue:"未超期",priority:"中",owner:"王芳",next:"跟进样品收货情况和颜色反馈",stage:"报价打样",relatedEmail:"MAIL-IN-004"},
    {id:"TASK-004",lead:"LEAD-2026-0907",site:"苏豪独立站B",customer:"Pacific Textiles",task:"无效确认",deadline:"今日 18:00",overdue:"未超期",priority:"低",owner:"李晓燕",next:"确认联系方式是否有效，必要时标记无效",stage:"待确认",relatedEmail:"-"},
    {id:"TASK-005",lead:"LEAD-2026-0912",site:"苏豪独立站A",customer:"Luna Fabrics",task:"首次询盘跟进",deadline:"明日 14:00",overdue:"未超期",priority:"中",owner:"李晓燕",next:"回复羊毛披肩报价并确认采购意向",stage:"待首响",relatedEmail:"MAIL-IN-005"},
    {id:"TASK-006",lead:"LEAD-2026-0909",site:"天猫苏豪站",customer:"Bella Home Deco",task:"合同附件补发",deadline:"今日 17:00",overdue:"未超期",priority:"中",owner:"张明远",next:"发送签章合同副本并确认交期",stage:"已成交",relatedEmail:"MAIL-IN-003",relatedWa:"WA-002"},
    {id:"TASK-007",lead:"LEAD-2026-0913",site:"天猫苏豪站",customer:"Harbor Linens LLC",task:"WhatsApp 首响",deadline:"今日 12:00",overdue:"已超期 1小时",priority:"高",owner:"张明远",next:"回复样品单 50 pcs 请求并确认 MOQ",stage:"待首响",relatedEmail:"-",relatedWa:"WA-001"}
  ],
  conversions:[
    {id:"CONV-013",lead:"LEAD-2026-0939",customer:"Royal Textile House",source:"邮件",node:"合同成交",customerId:"-",owner:"张明远",time:"2026-05-28 16:40",result:"合同 PC-2026-0171 已录入并完成 CRM 关联展示",site:"天猫苏豪站",path:"邮件转线索后人工跟进成交",contract:"PC-2026-0171",scheme:"方案二"},
    {id:"CONV-012",lead:"LEAD-2026-0911",customer:"Global Trade Co.",source:"网站表单",node:"培育中",customerId:"CUS-2026-0081",owner:"张明远",time:"2026-06-16 10:12",result:"已发送报价，客户关注 MOQ 与样品单，当前报价打样推进中",site:"天猫苏豪站",path:"方案一：自动建线索后人工跟进",contract:"PC-2026-0160",scheme:"方案一"},
    {id:"CONV-011",lead:"LEAD-2026-0911",customer:"Global Trade Co.",source:"网站表单",node:"转客户",customerId:"CUS-2026-0081",owner:"张明远",time:"2026-06-16 09:08",result:"按站点规则自动分配后转客户，进入客户档案",site:"天猫苏豪站",path:"方案一：网站表单自动生成线索",contract:"-",scheme:"方案一"},
    {id:"CONV-010",lead:"LEAD-2026-0909",customer:"Bella Home Deco",source:"WhatsApp",node:"合同成交",customerId:"CUS-2026-0079",owner:"张明远",time:"2026-06-15 16:20",result:"合同 PC-2026-0156 已录入并完成 CRM 关联展示",site:"天猫苏豪站",path:"方案一：沟通命中规则自动建线索",contract:"PC-2026-0156",scheme:"方案一"},
    {id:"CONV-009",lead:"LEAD-2026-0909",customer:"Bella Home Deco",source:"WhatsApp",node:"转客户",customerId:"CUS-2026-0079",owner:"张明远",time:"2026-06-10 14:30",result:"WhatsApp 会话识别后人工确认转客户",site:"天猫苏豪站",path:"方案一：会话转线索",contract:"-",scheme:"方案一"},
    {id:"CONV-008",lead:"LEAD-2026-0854",customer:"Nordic Style AB",source:"邮件",node:"合同成交",customerId:"CUS-2026-0065",owner:"李晓燕",time:"2026-06-12 17:30",result:"合同 PC-2026-0148 已关联，普成同步完成",site:"苏豪独立站A",path:"方案二：邮件会话人工转线索",contract:"PC-2026-0148",scheme:"方案二"},
    {id:"CONV-007",lead:"LEAD-2026-0854",customer:"Nordic Style AB",source:"邮件",node:"转客户",customerId:"CUS-2026-0065",owner:"李晓燕",time:"2026-06-09 09:30",result:"业务员在沟通工作台确认后转入客户档案",site:"苏豪独立站A",path:"方案二：邮件先保留在沟通台",contract:"-",scheme:"方案二"},
    {id:"CONV-006",lead:"LEAD-2026-0908",customer:"Moda Italia S.p.A",source:"接口拉取",node:"培育中",customerId:"-",owner:"王芳",time:"2026-06-15 16:30",result:"样品清单已发送，等待客户颜色反馈，处于报价打样阶段",site:"苏豪独立站B",path:"方案一：接口入池后按负责人流转",contract:"-",scheme:"方案一"},
    {id:"CONV-005",lead:"LEAD-2026-0910",customer:"Sun Fashion Ltd.",source:"邮件",node:"培育中",customerId:"-",owner:"李晓燕",time:"2026-06-15 18:02",result:"首响邮件已发送，待客户确认 MOQ，当前待首响",site:"苏豪独立站A",path:"方案二：邮件转线索后人工分配",contract:"-",scheme:"方案二"},
    {id:"CONV-004",lead:"LEAD-2026-0910",customer:"Sun Fashion Ltd.",source:"邮件",node:"线索分配",customerId:"-",owner:"李晓燕",time:"2026-06-15 16:25",result:"邮件转线索后人工确认分配至李晓燕",site:"苏豪独立站A",path:"方案二",contract:"-",scheme:"方案二"},
    {id:"CONV-003",lead:"LEAD-2026-0912",customer:"Luna Fabrics",source:"邮件",node:"线索分配",customerId:"-",owner:"李晓燕",time:"2026-06-16 08:00",result:"高意向邮件识别后分配至李晓燕，待首响",site:"苏豪独立站A",path:"方案二",contract:"-",scheme:"方案二"},
    {id:"CONV-002",lead:"LEAD-2026-0911",customer:"Global Trade Co.",source:"网站表单",node:"线索分配",customerId:"-",owner:"张明远",time:"2026-06-16 09:05",result:"网站表单自动生成线索并按站点规则分配",site:"天猫苏豪站",path:"方案一",contract:"-",scheme:"方案一"},
    {id:"CONV-001",lead:"LEAD-2026-0909",customer:"Bella Home Deco",source:"WhatsApp",node:"线索分配",customerId:"-",owner:"张明远",time:"2026-06-08 09:20",result:"WhatsApp 会话识别入库并分配负责人",site:"天猫苏豪站",path:"方案一",contract:"-",scheme:"方案一"}
  ],
  users:[
    {id:"USR-001",account:"admin@sutex.net.cn",name:"系统管理员",role:"管理员",sites:"全部站点",state:"正常",login:"2026-06-16 09:15",dept:"信息技术部",phone:"138****0001",created:"2024-01-10",lastOp:"2026-06-15 权限调整",password:"123456",dingtalkId:"DT-001",dingtalkName:"系统管理员"},
    {id:"USR-002",account:"liuyy@sutex.net.cn",name:"刘运营",role:"运营专员",sites:"天猫苏豪站、苏豪独立站A",state:"正常",login:"2026-06-16 08:22",dept:"外贸事业部",phone:"138****0002",created:"2024-03-15",lastOp:"2026-06-14 站点授权",password:"123456",dingtalkId:"DT-002",dingtalkName:"刘运营"},
    {id:"USR-003",account:"chenxt@sutex.net.cn",name:"陈协同",role:"协同人",sites:"天猫苏豪站",state:"正常",login:"2026-06-15 18:40",dept:"外贸事业部",phone:"138****0003",created:"2024-06-01",lastOp:"2026-06-15 协同授权",password:"123456",dingtalkId:"DT-003",dingtalkName:"陈协同"},
    {id:"USR-004",account:"zhangmy@sutex.net.cn",name:"张明远",role:"外贸业务员",sites:"天猫苏豪站",state:"正常",login:"2026-06-16 08:45",dept:"外贸事业部",phone:"138****0004",created:"2024-08-20",lastOp:"2026-06-16 登录",password:"123456",dingtalkId:"DT-004",dingtalkName:"张明远"},
    {id:"USR-005",account:"lixy@sutex.net.cn",name:"李晓燕",role:"外贸业务员",sites:"苏豪独立站A",state:"正常",login:"2026-06-16 08:30",dept:"外贸事业部",phone:"138****0005",created:"2024-09-05",lastOp:"2026-06-15 站点绑定",password:"123456",dingtalkId:"DT-005",dingtalkName:"李晓燕"},
    {id:"USR-006",account:"wangf@sutex.net.cn",name:"王芳",role:"外贸业务员",sites:"苏豪独立站B",state:"正常",login:"2026-06-15 17:10",dept:"外贸事业部",phone:"138****0006",created:"2024-10-12",lastOp:"2026-06-14 角色确认",password:"123456",dingtalkId:null,dingtalkName:null},
    {id:"USR-007",account:"visitor@sutex.net.cn",name:"访客账号",role:"访客",sites:"指定看板",state:"冻结",login:"-",dept:"—",phone:"—",created:"2025-02-01",lastOp:"2026-05-20 账号冻结",password:"123456",dingtalkId:null,dingtalkName:null}
  ],
  roles:[
    {id:"ROLE-001",name:"管理员",type:"预置",userCount:1,status:"启用",preset:true,deletable:false,scope:"全站",desc:"全局配置、权限、站点与渠道",menus:9,perms:{view:1,create:1,edit:1,delete:1,export:1,assign:1,transfer:1,auth:1}},
    {id:"ROLE-002",name:"运营专员",type:"预置",userCount:1,status:"启用",preset:true,deletable:false,scope:"负责站点全部线索与客户",desc:"站点线索与客户运营、分配与授权",menus:8,perms:{view:1,create:1,edit:1,delete:0,export:1,assign:1,transfer:1,auth:1}},
    {id:"ROLE-003",name:"协同人",type:"预置",userCount:1,status:"启用",preset:true,deletable:false,scope:"授权站点全部线索与客户，可监督带教",desc:"监督带教、协同跟进，不可分配/删除",menus:6,perms:{view:1,create:0,edit:0,delete:0,export:1,assign:0,transfer:0,auth:0}},
    {id:"ROLE-004",name:"外贸业务员",type:"预置",userCount:3,status:"启用",preset:true,deletable:false,scope:"本人负责客户、线索、联系人",desc:"本人线索客户跟进、沟通与合同关联",menus:7,perms:{view:1,create:1,edit:1,delete:0,export:1,assign:0,transfer:0,auth:0}},
    {id:"ROLE-005",name:"访客",type:"预置",userCount:1,status:"启用",preset:true,deletable:false,scope:"看板与指定页面，只读",desc:"只读看板，无写操作",menus:3,perms:{view:1,create:0,edit:0,delete:0,export:0,assign:0,transfer:0,auth:0}},
    {id:"ROLE-006",name:"区域督导",type:"自定义",userCount:0,status:"停用",preset:false,deletable:true,scope:"多站点只读 + 导出",desc:"跨站点监督视图，不可编辑主数据",menus:5,perms:{view:1,create:0,edit:0,delete:0,export:1,assign:0,transfer:0,auth:0}}
  ],
  channels:[
    {id:"CH-001",name:"天猫苏豪站-网站表单",type:"网站接口",source:"未迟建站",site:"天猫苏豪站",frequency:"每30分钟",status:"正常",lastPull:"2026-06-16 09:15 / 8条",endpoint:"api.weichi.com/leads/sutex",auth:"API Key",leadRule:"自动入池 + 按站点分配"},
    {id:"CH-002",name:"苏豪独立站A-网站表单",type:"网站接口",source:"苏豪自有系统",site:"苏豪独立站A",frequency:"每30分钟",status:"正常",lastPull:"2026-06-16 09:00 / 5条",endpoint:"crm.sutex-a.com/api/inquiry",auth:"OAuth",leadRule:"人工确认转线索"},
    {id:"CH-003",name:"运营邮箱主收件箱",type:"邮箱",source:"IMAP + 转发规则",site:"全部可见站点",frequency:"每15分钟",status:"正常",lastPull:"2026-06-16 09:31 / 3封",endpoint:"imap.163.com:993",auth:"SSL",leadRule:"AI 识别后待确认转线索"},
    {id:"CH-004",name:"WhatsApp Business 主账号",type:"WhatsApp",source:"Meta Cloud API",site:"全部可见站点",frequency:"实时推送",status:"正常",lastPull:"2026-06-16 09:31 / 2条",endpoint:"Meta Cloud API",auth:"Webhook",leadRule:"会话实时入库"},
    {id:"CH-005",name:"苏豪独立站B-API拉取",type:"网站接口",source:"苏豪自有系统",site:"苏豪独立站B",frequency:"暂停拉取",status:"异常",lastPull:"2026-06-10 18:00 / 0条",endpoint:"crm.sutex-b.com/api/inquiry",auth:"API Key",leadRule:"暂停入池"},
    {id:"CH-006",name:"手动导入",type:"手动",source:"Excel 模板",site:"全部站点",frequency:"按需",status:"可用",lastPull:"2026-06-14 批量导入 12 条",endpoint:"—",auth:"—",leadRule:"行级校验 + 失败明细"}
  ],
  sitePages:[
    {id:"PG-001",name:"春季羊毛系列落地页",site:"天猫苏豪站",type:"落地页",url:"/landing/spring-wool-2026",uv:3240,leads:52,status:"发布中",updated:"2026-06-15"},
    {id:"PG-002",name:"酒店布草专题页",site:"天猫苏豪站",type:"专题页",url:"/topic/hospitality-linen",uv:1860,leads:28,status:"发布中",updated:"2026-06-12"},
    {id:"PG-003",name:"618 活动页",site:"苏豪独立站A",type:"活动页",url:"/campaign/618-2026",uv:4520,leads:64,status:"已下线",updated:"2026-06-20"},
    {id:"PG-004",name:"开司米围巾批发",site:"苏豪独立站A",type:"落地页",url:"/landing/cashmere-scarf",uv:980,leads:14,status:"发布中",updated:"2026-06-10"},
    {id:"PG-005",name:"家居纺织品首页",site:"苏豪独立站B",type:"落地页",url:"/home-textile",uv:720,leads:8,status:"草稿",updated:"2026-06-08"}
  ],
  siteForms:[
    {id:"FM-001",name:"官网询盘表单",site:"天猫苏豪站",fields:8,submissions:52,conversion:"8.2%",status:"启用",source:"官网询盘"},
    {id:"FM-002",name:"样品申请表单",site:"天猫苏豪站",fields:12,submissions:18,conversion:"12.5%",status:"启用",source:"官网询盘"},
    {id:"FM-003",name:"独立站 A 联系表单",site:"苏豪独立站A",fields:6,submissions:34,conversion:"6.8%",status:"启用",source:"自然询盘"},
    {id:"FM-004",name:"展会扫码表单",site:"全部站点",fields:5,submissions:16,conversion:"18.0%",status:"启用",source:"展会"},
    {id:"FM-005",name:"独立站 B 询盘表单",site:"苏豪独立站B",fields:7,submissions:4,conversion:"2.1%",status:"暂停",source:"自然询盘"}
  ],
  siteSeoKeywords:[
    {keyword:"wool scarf supplier",site:"苏豪独立站A",rank:8,indexed:156,volume:1200,trend:"up",traffic:420},
    {keyword:"cashmere wholesale",site:"苏豪独立站A",rank:15,indexed:98,volume:890,trend:"up",traffic:280},
    {keyword:"hotel linen manufacturer",site:"天猫苏豪站",rank:6,indexed:212,volume:2100,trend:"stable",traffic:680},
    {keyword:"home textile OEM",site:"天猫苏豪站",rank:22,indexed:74,volume:650,trend:"down",traffic:95},
    {keyword:"textile supplier china",site:"苏豪独立站B",rank:45,indexed:32,volume:3200,trend:"stable",traffic:48}
  ],
  auditLogs:[
    {id:"LOG-001",time:"2026-06-16 09:31",operator:"张明远",module:"跟进记录",action:"新增",content:"Global Trade Co. 报价打样",ip:"10.0.1.23",result:"成功",target:"FOL-001"},
    {id:"LOG-002",time:"2026-06-16 09:20",operator:"系统",module:"线索分配",action:"自动分配",content:"5 条线索按站点规则分配至业务员",ip:"—",result:"成功",target:"LEAD-BATCH"},
    {id:"LOG-003",time:"2026-06-16 09:15",operator:"系统管理员",module:"系统登录",action:"登录",content:"admin@sutex.net.cn 登录成功",ip:"10.0.1.10",result:"成功",target:"USR-001"},
    {id:"LOG-004",time:"2026-06-15 18:40",operator:"系统管理员",module:"权限中心",action:"权限调整",content:"陈协同新增天猫苏豪站数据范围",ip:"10.0.1.10",result:"成功",target:"USR-003"},
    {id:"LOG-005",time:"2026-06-15 16:25",operator:"刘运营",module:"线索中心",action:"导入",content:"公海池批量导入 12 条线索，成功 11 / 失败 1",ip:"10.0.1.15",result:"部分成功",target:"LEAD-IMPORT"},
    {id:"LOG-006",time:"2026-06-15 14:10",operator:"李晓燕",module:"沟通中心",action:"转线索",content:"Sun Fashion Ltd. 邮件确认转线索 LEAD-2026-0910",ip:"10.0.1.18",result:"成功",target:"MAIL-IN-002"},
    {id:"LOG-007",time:"2026-06-14 11:00",operator:"系统管理员",module:"合同中心",action:"关联合同",content:"合同 PC-2026-0156 关联客户 Bella Home Deco",ip:"10.0.1.10",result:"成功",target:"PC-2026-0156"},
    {id:"LOG-008",time:"2026-06-14 09:30",operator:"刘运营",module:"渠道配置",action:"测试连接",content:"天猫苏豪站-网站表单 接口连通正常",ip:"10.0.1.15",result:"成功",target:"CH-001"},
    {id:"LOG-009",time:"2026-06-13 17:20",operator:"王芳",module:"客户中心",action:"客户转移",content:"Euro Furniture GmbH 转入公海",ip:"10.0.1.22",result:"成功",target:"CUS-2026-0051"},
    {id:"LOG-010",time:"2026-06-12 08:05",operator:"系统",module:"渠道配置",action:"拉取失败",content:"苏豪独立站B API 拉取失败，保留上次快照",ip:"—",result:"失败",target:"CH-005"}
  ],
  opportunities:[
    {id:"OPP-001",name:"Bella Home Deco · 家居纺织品年度采购",customer:"Bella Home Deco",customerId:"CUS-2026-0079",lead:"LEAD-2026-0909",stage:"成交",amount:"$41,300",probability:90,owner:"张明远",created:"2026-05-25",expectedClose:"2026-06-20",status:"已成交",site:"天猫苏豪站",product:"家居纺织品系列",source:"WhatsApp"},
    {id:"OPP-002",name:"Global Trade Co. · 羊毛系列样品订单",customer:"Global Trade Co.",customerId:"CUS-2026-0081",lead:"LEAD-2026-0911",stage:"报价",amount:"$18,600",probability:72,owner:"张明远",created:"2026-06-16",expectedClose:"2026-07-15",status:"进行中",site:"天猫苏豪站",product:"羊毛系列",source:"官网询盘"},
    {id:"OPP-003",name:"Nordic Style AB · 秋季羊毛毯补货",customer:"Nordic Style AB",customerId:"CUS-2026-0065",lead:"LEAD-2026-0854",stage:"谈判",amount:"$28,500",probability:65,owner:"李晓燕",created:"2026-06-01",expectedClose:"2026-07-01",status:"进行中",site:"苏豪独立站A",product:"羊毛毯",source:"邮件"},
    {id:"OPP-004",name:"Moda Italia · 围巾首单试产",customer:"Moda Italia S.p.A",customerId:"CUS-2026-0048",lead:"LEAD-2026-0908",stage:"方案沟通",amount:"€12,000",probability:58,owner:"王芳",created:"2026-06-10",expectedClose:"2026-08-01",status:"进行中",site:"苏豪独立站B",product:"羊毛围巾",source:"接口拉取"}
  ],
  lifecyclePresets:{
    "LEAD-2026-0909":[
      {id:"ljt-bh-14",cat:"sales",time:"2026-06-20 16:00",title:"成交",summary:"累计成交金额：$41,300（2 份合同）",detail:"合同 PC-2026-0156 + PC-2026-0157 均已完成签约与 CRM 关联<br>最近成交：2026-06-18",operator:"张明远"},
      {id:"ljt-bh-13",cat:"sales",time:"2026-06-15 16:20",title:"合同签订",summary:"合同 PC-2026-0156 · 金额 $12,800",detail:"客户确认订单并关联合同 PC-2026-0156<br>普泽系统已同步 · 已完成签约",operator:"张明远"},
      {id:"ljt-bh-12",cat:"sales",time:"2026-06-02 14:30",title:"商务谈判",summary:"确认交期、付款条款与下一季新品打样意向",detail:"Anna Keller 确认 Q3 补货计划<br>讨论 OEKO-TEX 认证清单与 MOQ 条款",operator:"张明远"},
      {id:"ljt-bh-11",cat:"sales",time:"2026-05-25 10:00",title:"商务谈判",summary:"家居纺织品年度采购 · 预计 $41,300",detail:"确认 Q3 补货计划与 MOQ 条款<br>进入合同洽谈阶段",operator:"张明远"},
      {id:"ljt-bh-10",cat:"lead",time:"2026-05-20 14:30",title:"转为客户",summary:"生成客户档案 CUS-2026-0079",detail:"WhatsApp 会话识别后人工确认转客户<br>同步创建联系人 Anna Keller",operator:"张明远"},
      {id:"ljt-bh-09",cat:"sales",time:"2026-05-18 11:00",title:"客户确认样品通过",summary:"深色系家居纺织品样品测试合格",detail:"客户反馈色牢度与手感符合要求<br>可进入批量报价阶段",operator:"张明远"},
      {id:"ljt-bh-08",cat:"sales",time:"2026-05-12 09:30",title:"样品寄送",summary:"物流单号：DHL 7293847562",detail:"寄送 3 款家居纺织品样品至 Munich<br>预计 5 个工作日送达",operator:"张明远"},
      {id:"ljt-bh-07",cat:"sales",time:"2026-05-08 15:20",title:"发送报价单",summary:"报价金额：USD 28,500",detail:"首单报价 PC-2026-0157 对应产品组合<br>含 MOQ、交期与认证说明",operator:"张明远"},
      {id:"ljt-bh-06",cat:"comm",time:"2026-05-06 10:15",title:"发起 WhatsApp 沟通",summary:"Anna Keller 主动追问 MOQ 与认证",detail:"会话 WA-002 实时入库<br>客户关注 OEKO-TEX 与 BSCI 认证",operator:"张明远"},
      {id:"ljt-bh-05",cat:"comm",time:"2026-05-04 16:40",title:"客户回复邮件",summary:"咨询 MOQ 及 OEKO-TEX 认证",detail:"邮件 MAIL-IN-003 前序往来<br>AI 识别为高意向询价",operator:"Anna Keller"},
      {id:"ljt-bh-04",cat:"comm",time:"2026-05-02 09:00",title:"首次邮件回复",summary:"发送产品目录与认证清单",detail:"回复 WhatsApp 转邮件通道的询盘<br>附家居纺织品系列目录 PDF",operator:"张明远"},
      {id:"ljt-bh-03",cat:"lead",time:"2026-05-01 09:25",title:"系统自动分配给业务员",summary:"分配给张明远 · 按站点规则",detail:"分配路径：WhatsApp 会话识别 → 自动分配<br>站点：天猫苏豪站",operator:"系统"},
      {id:"ljt-bh-02",cat:"ai",time:"2026-05-01 09:22",title:"AI 来件人洞察生成",summary:"Bella Home Deco GmbH · 价值评分 92 分",detail:"AI 识别：德国家居纺织品牌商<br>行业匹配度 95% · 成交概率 90%<br>建议 24 小时内首响",operator:"AI 引擎"},
      {id:"ljt-bh-01",cat:"lead",time:"2026-05-01 09:20",title:"收到 WhatsApp 询盘",summary:"来源：WhatsApp · 自然询盘",detail:"产品意向：家居纺织品<br>国家：德国 · 入池方式：会话识别",operator:"系统"}
    ],
    "LEAD-2026-0911":[
      {id:"ljt-gt-08",cat:"sales",time:"2026-06-16 10:12",title:"发送报价单",summary:"报价金额：USD 18,600 · 羊毛系列",detail:"客户关注 MOQ 灵活性与 50 pcs 样品单",operator:"张明远"},
      {id:"ljt-gt-07",cat:"comm",time:"2026-06-16 09:31",title:"客户回复邮件",summary:"咨询 MOQ 及样品单条款",detail:"邮件 MAIL-IN-001 · AI 识别高意向",operator:"Michael Johnson"},
      {id:"ljt-gt-06",cat:"comm",time:"2026-06-16 09:15",title:"首次邮件回复",summary:"发送产品目录",detail:"确认羊毛系列意向并附目录 PDF",operator:"张明远"},
      {id:"ljt-gt-05",cat:"lead",time:"2026-06-16 09:08",title:"转为客户",summary:"客户档案 CUS-2026-0081",detail:"按站点规则自动分配后转客户",operator:"张明远"},
      {id:"ljt-gt-04",cat:"lead",time:"2026-06-16 09:05",title:"系统自动分配给业务员",summary:"分配给张明远",detail:"网站表单自动生成线索 · 方案一",operator:"系统"},
      {id:"ljt-gt-03",cat:"ai",time:"2026-06-16 09:06",title:"AI 来件人洞察生成",summary:"Global Trade Co. · 价值评分 78 分",detail:"美国中型纺织品贸易商 · 成交概率 72%",operator:"AI 引擎"},
      {id:"ljt-gt-02",cat:"lead",time:"2026-06-16 09:05",title:"状态变更",summary:"待跟进 → 跟进中 · 报价打样",detail:"阶段流转记录 · 历史状态已保留",operator:"系统"},
      {id:"ljt-gt-01",cat:"lead",time:"2026-06-16 09:05",title:"收到官网询盘",summary:"来源：官网询盘 · 网站表单",detail:"产品意向：羊毛系列 · 站点：天猫苏豪站",operator:"系统"}
    ],
    "LEAD-2026-0854":[
      {id:"ljt-ns-07",cat:"sales",time:"2026-06-12 17:30",title:"合同签订",summary:"PC-2026-0148 · $28,500",detail:"普成同步完成 · 已完成签约",operator:"李晓燕"},
      {id:"ljt-ns-06",cat:"sales",time:"2026-06-09 09:30",title:"转为客户",summary:"CUS-2026-0065",detail:"邮件确认后转入客户档案",operator:"李晓燕"},
      {id:"ljt-ns-05",cat:"sales",time:"2026-06-07 10:20",title:"发送报价单",summary:"秋季羊毛毯报价",detail:"客户价格敏感 · 需突出交期优势",operator:"李晓燕"},
      {id:"ljt-ns-04",cat:"comm",time:"2026-06-05 14:00",title:"首次邮件回复",summary:"发送产品目录",detail:"确认秋季羊毛毯采购意向",operator:"李晓燕"},
      {id:"ljt-ns-03",cat:"lead",time:"2026-06-05 09:35",title:"分配线索",summary:"李晓燕分配公海线索",detail:"来源：客户转介绍",operator:"李晓燕"},
      {id:"ljt-ns-02",cat:"ai",time:"2026-06-05 09:32",title:"AI 来件人洞察生成",summary:"Nordic Style AB · 74 分",detail:"瑞典北欧风格家居零售商",operator:"AI 引擎"},
      {id:"ljt-ns-01",cat:"lead",time:"2026-06-05 09:30",title:"收到邮件询盘",summary:"来源：客户转介绍",detail:"产品意向：秋季羊毛毯",operator:"系统"}
    ],
    "PC-2026-0156":[
      {id:"ljt-pc156-03",cat:"sales",time:"2026-06-15 16:20",title:"合同签订",summary:"金额 $12,800 · 生效中",detail:"关联客户 Bella Home Deco · 来源 LEAD-2026-0909",operator:"张明远"},
      {id:"ljt-pc156-02",cat:"sales",time:"2026-06-10 11:00",title:"商务谈判",summary:"确认产品清单与交期",detail:"客户要求同步签章合同副本",operator:"张明远"},
      {id:"ljt-pc156-01",cat:"sales",time:"2026-05-08 15:20",title:"合同录入",summary:"首单报价转合同",detail:"金额 $28,500 首单 · 后拆分为两单执行",operator:"张明远"}
    ],
    "LEAD-2026-0917":[
      {id:"ljt-hs-04",cat:"lead",time:"2026-06-14 09:00",title:"回收至公海池",summary:"原负责人：王芳",detail:"回收原因：超过7天未跟进，系统自动回收<br>当前公海状态：已回收 · 待重新分配",operator:"系统"},
      {id:"ljt-hs-03",cat:"lead",time:"2026-05-28 10:00",title:"分配负责人",summary:"分配给王芳",detail:"分配方式：运营人工分配",operator:"刘运营"},
      {id:"ljt-hs-02",cat:"ai",time:"2026-05-20 11:05",title:"AI 来件人洞察生成",summary:"HomeStyle Trading Co. · 68 分",detail:"法国家居贸易分销商",operator:"AI 引擎"},
      {id:"ljt-hs-01",cat:"lead",time:"2026-05-20 11:00",title:"收到邮件询盘",summary:"来源：自然询盘",detail:"产品意向：装饰靠垫",operator:"系统"}
    ],
    "LEAD-2026-0918":[
      {id:"ljt-ul-04",cat:"lead",time:"2026-06-15 09:00",title:"超时释放至公海池",summary:"原负责人：张明远",detail:"释放原因：分配后48小时未首响，自动释放回公海池<br>当前公海状态：超时释放 · 待重新分配",operator:"系统"},
      {id:"ljt-ul-03",cat:"lead",time:"2026-06-10 09:00",title:"线索分配",summary:"张明远分配线索",detail:"管理员分配 · 进入我的线索",operator:"张明远"},
      {id:"ljt-ul-02",cat:"ai",time:"2026-06-10 08:35",title:"AI 来件人洞察生成",summary:"Urban Living Ltd. · 85 分",detail:"英国窗帘布艺零售商 · 高意向",operator:"AI 引擎"},
      {id:"ljt-ul-01",cat:"lead",time:"2026-06-10 08:30",title:"收到 WhatsApp 询盘",summary:"来源：WhatsApp",detail:"产品意向：窗帘布艺",operator:"系统"}
    ]
  }
};

function bootstrapAiState(){
  restoreAiConfigFromStorage();
  if(canUseAiFeature()){
    if(datasets.aiAnalysisResult&&!aiResultState.result){
      aiResultState.result=datasets.aiAnalysisResult;
      aiResultState.status="ready";
      aiResultState.pageId=datasets.aiAnalysisResult.meta?.pageId||"ai-analysis";
    }
    if(!aiResultState.result){
      AI_ENGINE.run(getAiConfig(),collectAIPageData("ai-analysis"));
    }
    syncAiRuntimeState();
  }
}

const pageMeta = {
  "lead-all":{title:"公海池",desc:"未分配的公共询盘；分配后进入我的线索跟进，已有负责人的线索不在此池。",custom:"leadAll"},
  "lead-pending":{title:"我的线索",desc:"当前负责人名下的线索，跟进、报价与转客户。",custom:"leadTasks"},
  "lead-invalid":{title:"异常线索",desc:"无效、重复、未授权及人工标记的异常线索，不参与正常跟进与漏斗统计。",custom:"leadInvalid"},
  "lead-converted":{title:"转化记录",desc:"线索分配、转客户、培育与合同成交全链路转化节点记录。",custom:"leadConverted"},
  "site-management":{title:"站点管理",desc:"站点主数据、状态、负责人与接口配置。",custom:"siteManagement"},
  "site-page-management":{title:"页面管理",desc:"落地页、专题页与活动页管理。",custom:"sitePageManagement"},
  "site-form-management":{title:"表单管理",desc:"询盘表单、字段配置与表单统计。",custom:"siteFormManagement"},
  "site-seo-analysis":{title:"SEO分析",desc:"关键词收录、排名与流量分析。",custom:"siteSeoAnalysis"},
  "customer-profile":{title:"客户列表",desc:"企业客户资产：汇总历史询盘线索、联系人与合作合同。",custom:"customerProfile"},
  "follow-record":{title:"跟进日志",desc:"全局线索跟进日志查询，支持销售复盘与运营审计。",custom:"followRecords"},
  "contract-list":{title:"合同中心",desc:"统一管理全部合同，关联客户与来源线索。",custom:"contractList"},
  "lead-analysis":{title:"询盘分析",desc:"海外获客质量：询盘趋势、来源渠道、有效询盘率与转客户率。",custom:"leadAnalysis"},
  "data-analysis-hub":{title:"数据总览",desc:"CRM 整体经营情况：询盘、客户、销售跟进与成交结果一览。",custom:"dataAnalysisHub"},
  "customer-analysis":{title:"客户分析",desc:"客户资产：增长趋势、结构分布与客户状态分层。",custom:"customerAnalysis"},
  "communication-analysis":{title:"沟通分析",desc:"已合并至运营分析，保留深链兼容。",custom:"communicationAnalysis"},
  "team-analysis":{title:"运营分析",desc:"资源流转：线索运营、分配效率与客户运营指标。",custom:"teamAnalysis"},
  "ai-analysis":{title:"AI 洞察",desc:"一期未建设 AI 预测类分析，保留深链兼容。",custom:"aiAnalysis"},
  "funnel-analysis":{title:"成交分析",desc:"最终业务结果：成交趋势、业务员排行与客户贡献。",custom:"funnelAnalysis"},
  "performance-analysis":{title:"销售分析",desc:"业务员执行效率：业绩排行、跟进过程与转化漏斗。",custom:"performanceAnalysis"},
  "site-stat":{title:"站点统计",desc:"站点 UV、询盘、转化与经营指标。",custom:"siteStat"},
  "user-management":{title:"用户管理",desc:"系统用户账号管理。",custom:"userManagement"},
  "role-management":{title:"角色管理",desc:"角色与权限配置。",custom:"roleManagement"},
  "permission-management":{title:"权限管理",desc:"角色按钮权限与数据范围配置。",custom:"permissionManagement"},
  "menu-management":{title:"菜单管理",desc:"系统菜单、路由与显示配置。",custom:"menuManagement"},
  "data-dictionary":{title:"数据字典",desc:"业务枚举与字段字典维护。",custom:"dataDictionary"},
  "param-config":{title:"参数配置",desc:"AI 能力接入与 CRM 系统规则配置。",custom:"paramConfig"},
  "channel-config":{title:"来源管理",desc:"SEM、SEO、社媒、展会等线索来源渠道配置。",custom:"channelConfig"},
  "communication-desk":{title:"沟通工作台",desc:"销售日常沟通处理入口：聚合跨渠道待办、待跟进提醒与 AI 跟进建议。",custom:"communicationWorkbench"},
  "communication-email":{title:"邮件中心",desc:"邮件检索、条件筛选、历史记录查询与详细管理。",custom:"communicationWorkbench"},
  "communication-whatsapp":{title:"WhatsApp",desc:"WhatsApp 会话检索、筛选、历史记录与详细管理。",custom:"communicationWorkbench"},
  "communication-config":{title:"账号设置",desc:"邮箱与 WhatsApp 账号接入、同步与入库配置。",custom:"communicationWorkbench"},
  "communication-workbench":{title:"沟通工作台",desc:"已合并至沟通工作台，保留深链兼容。",custom:"communicationWorkbench"},
  "system-log":{title:"系统日志",desc:"系统操作与审计日志。",custom:"systemLog"}
};

let currentPage = "workbench";
let commView = "desk";
let emailBox = "inbox";
let contractView = "list";
let customerTab = "profile";
let customerDetailTab = "overview";
let focusedCustomerIdx = null;
let siteScrollTarget = null;
let leadPoolTab = "all";
let myLeadTab = "all";
let myLeadIntentFilter = "";
let invalidLeadTab = "all";
let myLeadSelected = new Set();
let messageTab = "all";
const messageCenterData = [
  {id:"MSG-000",cat:"ai",title:"AI 来件人洞察已生成",desc:"john@abc-tech.de → 自动识别 ABC Technology GmbH · 高意向来件 · 点击跳转",time:"刚刚",unread:true,page:"communication-email",opts:{emailBox:"inbox",emailId:"MAIL-IN-006"},roles:["管理员","运营专员","外贸业务员"]},
  {id:"MSG-001",cat:"business",title:"新询盘到达",desc:"Harbor Linens LLC WhatsApp 高意向询盘已进入公海池 · 点击跳转",time:"5分钟前",unread:true,page:"lead-all",target:{type:"lead",id:"LEAD-2026-0913"}},
  {id:"MSG-002",cat:"business",title:"客户回复邮件",desc:"Global Trade Co. 回复报价邮件：关注 MOQ 与样品单条款 · 点击跳转",time:"32分钟前",unread:true,page:"communication-email",opts:{emailBox:"inbox",emailId:"MAIL-IN-001"}},
  {id:"MSG-003",cat:"business",title:"WhatsApp 新消息",desc:"Global Trade Co. 询问 50 pcs 样品单价格与交期 · 点击跳转",time:"1小时前",unread:true,page:"communication-whatsapp",opts:{chatId:"WA-001"}},
  {id:"MSG-004",cat:"business",title:"合同状态变更",desc:"PC-2026-0156 已录入合同中心（生效中），关联 Bella Home Deco · 点击跳转",time:"2小时前",unread:false,page:"contract-list",target:{type:"contract",id:"PC-2026-0156"}},
  {id:"MSG-005",cat:"approval",title:"待审批报价",desc:"Sun Fashion Ltd. 开司米围巾报价单待运营确认后发送 · 点击跳转",time:"3小时前",unread:true,page:"lead-pending",target:{type:"lead",id:"LEAD-2026-0910"}},
  {id:"MSG-006",cat:"approval",title:"待处理分配申请",desc:"Luna Fabrics 跨站点转移申请，待管理员审批 · 点击跳转",time:"今天 09:10",unread:true,page:"lead-all",target:{type:"lead",id:"LEAD-2026-0912"},roles:["管理员","运营专员"]},
  {id:"MSG-007",cat:"ai",title:"超过 7 天未跟进客户",desc:"Nordic Style AB 下次跟进已超期，建议今日联系 · 点击跳转",time:"1小时前",unread:true,page:"customer-profile",target:{type:"customer",name:"Nordic Style AB",tab:"360"}},
  {id:"MSG-008",cat:"ai",title:"高价值客户异常",desc:"Bella Home Deco 成交概率从 92% 下降至 78%，沟通频率降低 · 点击跳转",time:"2小时前",unread:true,page:"customer-profile",target:{type:"customer",name:"Bella Home Deco",tab:"360"},roles:["管理员","协同人","外贸业务员"]},
  {id:"MSG-009",cat:"ai",title:"成交概率下降",desc:"Moda Italia 样品反馈停滞 3 天，AI 建议 6/18 前主动跟进 · 点击跳转",time:"昨天",unread:false,page:"lead-pending",target:{type:"lead",id:"LEAD-2026-0908"}},
  {id:"MSG-010",cat:"system",title:"系统公告",desc:"6 月 20 日 02:00-04:00 将进行 CRM 例行维护，期间邮件同步暂停",time:"昨天",unread:false,page:"message-center"},
  {id:"MSG-011",cat:"system",title:"功能更新",desc:"Lead Intelligence 已上线：收到询盘即生成企业画像与跟进建议",time:"6/14",unread:false,page:"message-center"},
  {id:"MSG-012",cat:"system",title:"权限变更",desc:"陈协同新增天猫苏豪站授权范围，可监督团队跟进",time:"6/13",unread:false,page:"role-management",roles:["管理员"]}
];
let messageReadSet = new Set();
const reviewAccounts = {
  "admin@sutex.net.cn":{name:"系统管理员",role:"管理员",avatar:"管",sites:["天猫苏豪站","苏豪独立站A","苏豪独立站B"]},
  "operator@sutex.net.cn":{name:"刘运营",role:"运营专员",avatar:"运",sites:["天猫苏豪站","苏豪独立站A"]},
  "seller@sutex.net.cn":{name:"张明远",role:"外贸业务员",avatar:"业",sites:["天猫苏豪站"]},
  "collab@sutex.net.cn":{name:"陈协同",role:"协同人",avatar:"协",sites:["天猫苏豪站"]},
  "guest@sutex.net.cn":{name:"访客账号",role:"访客",avatar:"访",sites:[]}
};
let sessionUser = reviewAccounts["admin@sutex.net.cn"];
let currentRole = "管理员";
let selectedSiteStat = "天猫苏豪站";
let siteMgmtAdvancedOpen = false;
let siteMgmtSelected = new Set();
let siteOwnerSelected = new Set();
let siteOwnerPreviewSite = 0;
let siteStatPeriod = "本月";
let siteStatAdvancedOpen = false;
let siteStatMonth = "2026-06";
let wbPeriod = "本月";
let wbCustomRange = "2026-06-01 ~ 2026-06-30";
let wbCompareMode = "环比";
let leadPoolSelected = new Set();
let leadPoolAdvancedOpen = false;
let leadTaskSelected = new Set();
let leadTaskAdvancedOpen = false;
let leadTaskView = "list";
let leadConvertedAdvancedOpen = false;
let leadInvalidSelected = new Set();
let leadInvalidAdvancedOpen = false;
let leadPoolFilters = { poolType: "", timeStatus: "" };
let leadPoolTagFilter = [];
let myLeadTagFilter = [];
let leadTagEditIdx = null;
let leadTagBatchMode = null;
let leadTagBatchScope = null;
let leadMarkAbnormalIdx = null;
let leadRestoreAbnormalIdx = null;
const LEAD_ABNORMAL_REASONS = ["联系方式无效","邮箱退信","电话空号","重复线索","虚假询盘","无明确采购需求","恶意提交","数据错误","其他"];
let customerSelected = new Set();
let customerAdvancedOpen = false;
let contactSelected = new Set();
let contactAdvancedOpen = false;
let followAdvancedOpen = false;
let followLogFilters={owner:"",customer:"",leadKeyword:"",site:"",method:"",status:"",dateFrom:"",dateTo:""};
let tagCategoryFilter = "全部";
let tagMgmtTab = "customer";
let tagUsageContext = null;
let contractSelected = new Set();
let contractAdvancedOpen = false;
let contractCustomerAdvancedOpen = false;
let commWorkbenchAdvancedOpen = false;
let emailInboxSelected = new Set();
let emailInboxAdvancedOpen = false;
let emailSentAdvancedOpen = false;
let emailDraftSelected = new Set();
let emailDraftAdvancedOpen = false;
let emailActiveIdx = 0;
let currentMailAccountId = null;
let emailCustomerCtx = null;
let customerEmailActiveIdx = 0;
let whatsappActiveIdx = 0;
let whatsappFilterOpen = false;
let whatsappAiOpen = false;
let commConfigAdvancedOpen = false;
let analysisPeriod = "本月";
let analysisSite = "全部站点";
let analysisAdvancedOpen = false;
let funnelSchemeFilter = "全部方案";
let performanceView = "管理层视角";
let userSelected = new Set();
let userAdvancedOpen = false;
let userEditIdx = null;
let menuEditIdx = null;
let roleAdvancedOpen = false;
let selectedRoleIdx = 0;
let channelSelected = new Set();
let channelAdvancedOpen = false;
let logAdvancedOpen = false;
const pageListStates = {};
const LIST_STATE_LABELS = {normal:"正常",empty:"空",loading:"加载",error:"异常",pagination:"末页"};
const LIST_PAGE_IDS = new Set(["lead-all","lead-pending","lead-invalid","customer-profile","follow-record","contract-list","communication-desk","communication-email","communication-whatsapp","communication-config","communication-workbench","site-management","site-page-management","site-form-management","channel-config","lead-analysis","site-stat","site-seo-analysis","user-management","role-management","permission-management","menu-management","data-dictionary","param-config","system-log"]);
const LEAD_SOURCE_CHANNELS = ["SEM广告","自然询盘","官网询盘","WhatsApp","邮件营销","Facebook","LinkedIn","Instagram","TikTok","展会","客户转介绍","其他"];
const PAGE_SIZE_OPTIONS = [10,20,50,100];
const listPageSizes = {};
const listPageNums = {};
function getPageSize(key){ return listPageSizes[key]||20; }
function setListPageSize(key,val){ listPageSizes[key]=+val; listPageNums[key]=1; renderPage(); }
function setListPageNum(key,p){ listPageNums[key]=Math.max(1,p); renderPage(); }
function sliceForPage(rows,key){
  const size=getPageSize(key);
  const total=rows.length;
  const pages=Math.max(1,Math.ceil(total/size));
  let page=listPageNums[key]||1;
  if(page>pages){page=1;listPageNums[key]=1;}
  const start=(page-1)*size;
  return {display:rows.slice(start,start+size),total,page,pages,size};
}
function renderListPager(key,total,hint){
  const size=getPageSize(key);
  const pages=Math.max(1,Math.ceil(total/size));
  const page=Math.min(listPageNums[key]||1,pages);
  listPageNums[key]=page;
  let btns="";
  const maxShow=Math.min(pages,5);
  const startP=pages<=5?1:Math.max(1,Math.min(page-2,pages-4));
  for(let p=startP;p<startP+maxShow&&p<=pages;p++){
    btns+=`<button type="button" class="page-btn ${p===page?"active":""}" onclick="setListPageNum('${key}',${p})">${p}</button>`;
  }
  const hintHtml=hint?`<span style="margin-right:auto;color:var(--soft)">${hint}</span>`:"";
  return `<div class="table-foot">${hintHtml}<span>共 ${total} 条</span><div class="pager-bar"><div class="pager"><button type="button" class="page-btn" ${page<=1?"disabled":""} onclick="setListPageNum('${key}',${page-1})">‹</button>${btns}<button type="button" class="page-btn" ${page>=pages?"disabled":""} onclick="setListPageNum('${key}',${page+1})">›</button></div><label class="page-size-wrap">每页显示 <select class="page-size-select" onchange="setListPageSize('${key}',this.value)">${PAGE_SIZE_OPTIONS.map(n=>`<option value="${n}" ${size===n?"selected":""}>${n}</option>`).join("")}</select></label></div></div>`;
}
const ROW_ACTION_VISIBLE_MAX = 3;
let openRowActionMenuId = null;
function closeRowActionMenu(){ openRowActionMenuId = null; }
function positionRowActionMenu(menuEl,btnEl){
  if(!menuEl||!btnEl) return;
  menuEl.style.visibility="hidden";
  menuEl.style.display="block";
  const menuW=menuEl.offsetWidth||128;
  const r=btnEl.getBoundingClientRect();
  const top=r.bottom+4;
  const left=Math.min(Math.max(8,r.right-menuW),window.innerWidth-menuW-8);
  menuEl.style.top=`${top}px`;
  menuEl.style.left=`${left}px`;
  menuEl.style.visibility="";
}
function syncRowActionMenus(){
  document.querySelectorAll(".row-action-menu").forEach(el=>{
    const show=el.id===openRowActionMenuId;
    el.classList.toggle("show",show);
    if(show){
      const btn=el.closest(".row-action-more-wrap")?.querySelector(".row-action-more");
      if(btn) positionRowActionMenu(el,btn);
    }else{
      el.style.top=""; el.style.left=""; el.style.visibility=""; el.style.display="";
    }
  });
  document.querySelectorAll(".row-action-more").forEach(btn=>{
    const menu = btn.closest(".row-action-more-wrap")?.querySelector(".row-action-menu");
    const on = menu && menu.id===openRowActionMenuId;
    btn.classList.toggle("active", !!on);
    btn.setAttribute("aria-expanded", on?"true":"false");
  });
}
function repositionOpenRowActionMenu(){
  if(!openRowActionMenuId) return;
  const menu=document.getElementById(openRowActionMenuId);
  const btn=menu?.closest(".row-action-more-wrap")?.querySelector(".row-action-more");
  if(menu&&btn&&menu.classList.contains("show")) positionRowActionMenu(menu,btn);
}
function toggleRowActionMenu(menuId, ev){
  ev?.stopPropagation();
  openRowActionMenuId = openRowActionMenuId===menuId ? null : menuId;
  syncRowActionMenus();
}
function rowActionBtnHtml(a){
  const cls = ["btn","small", a.primary?"primary":"", a.danger?"danger":""].filter(Boolean).join(" ");
  return `<button type="button" class="${cls}" onclick="${a.onclick}">${a.label}</button>`;
}
function rowActionMenuItemHtml(a){
  return `<button type="button" class="row-action-menu-item${a.danger?" danger":""}" onclick="closeRowActionMenu();syncRowActionMenus();${a.onclick}">${a.label}</button>`;
}
function renderRowActions(actions, menuKey){
  const items = (actions||[]).filter(Boolean);
  if(!items.length) return `<div class="row-actions"></div>`;
  if(items.length <= ROW_ACTION_VISIBLE_MAX){
    return `<div class="row-actions">${items.map(rowActionBtnHtml).join("")}</div>`;
  }
  const visible = items.slice(0, ROW_ACTION_VISIBLE_MAX);
  const hidden = items.slice(ROW_ACTION_VISIBLE_MAX);
  const menuId = `ra-${menuKey}`;
  const isOpen = openRowActionMenuId===menuId;
  return `<div class="row-actions">
    ${visible.map(rowActionBtnHtml).join("")}
    <div class="row-action-more-wrap">
      <button type="button" class="btn small row-action-more${isOpen?" active":""}" onclick="toggleRowActionMenu('${menuId}',event)" aria-haspopup="menu" aria-expanded="${isOpen?"true":"false"}">更多 ▾</button>
      <div class="row-action-menu${isOpen?" show":""}" id="${menuId}" role="menu">${hidden.map(rowActionMenuItemHtml).join("")}</div>
    </div>
  </div>`;
}
function leadChannelLabel(r){ return r?.channel||({网站表单:"官网询盘",邮件:"自然询盘",WhatsApp:"WhatsApp",接口拉取:"自然询盘",手动录入:"其他"}[r?.source]||r?.source||"其他"); }
function leadSourceFilterOptions(){ return `<option>全部</option>${LEAD_SOURCE_CHANNELS.map(c=>`<option>${c}</option>`).join("")}`; }
function leadSourceStatsRows(){ return datasets.leadSourceStats||[]; }
function leadDrawerCommEntryHtml(lead){
  const mailCnt=datasets.emails.filter(e=>e.lead===lead.id||e.customer===lead.name).length;
  const chatCnt=datasets.chats.filter(c=>c.lead===lead.id||c.customer===lead.name).length;
  const total=mailCnt+chatCnt;
  const hint=total?`该线索关联 ${mailCnt} 封邮件、${chatCnt} 条 WhatsApp 会话，完整沟通历史请在沟通中心查看。`:"暂无沟通记录，可在沟通中心发起联系。";
  const safeName=(lead.name||"").replace(/'/g,"\\'");
  return `<div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.65">${hint}</div><div class="toolbar-actions"><button type="button" class="btn small primary" onclick="openLeadCommunicationCenter({leadId:'${lead.id}',customerName:'${safeName}'})">查看客户沟通记录</button></div>`;
}
function openLeadCommunicationCenter(opts){
  closeDrawer();
  emailCustomerCtx=resolveEmailCustomerCtx(opts||{});
  nav("communication-desk");
}
function openLeadCommunicationCenterFromLeadRow(listIdx,pool){
  const row=pool==="pool"?getLeadPoolRows()[listIdx]:pool==="invalid"?getInvalidLeadRows()[listIdx]:getMyLeadRows()[listIdx];
  if(!row) return;
  openLeadCommunicationCenter({leadId:row.id,customerName:row.name});
}
function isLeadLifecycleMilestone(e){
  if(!e) return false;
  if(["comm","system","ai"].includes(e.cat)) return false;
  const title=String(e.title||"");
  const summary=String(e.summary||"");
  if(/邮件|WhatsApp|报价单|样品寄送|样品通过|沟通|回复|发起|来件人洞察|商务谈判|发送报价|确认样品/.test(title+summary)) return false;
  if(e.cat==="sales"){
    return /^(成交|合同签订|合同录入|流失|已失效|标记异常)/.test(title);
  }
  if(e.cat==="lead"){
    if(/邮件|WhatsApp|回复|沟通/.test(title)) return false;
    return /收到|询盘|分配|认领|回收|释放|超时|转为客户|转客户|状态变更|阶段变更/.test(title);
  }
  return false;
}
function isLeadFollowBehavior(f){
  if(!f) return false;
  if(f.method==="系统"||/收到询盘/.test(f.state||"")) return false;
  if(["邮件","WhatsApp","电话","会议","拜访","样品","微信","面谈"].some(m=>(f.method||"").includes(m))) return true;
  if(/状态变更|阶段变更|分配业务员|转为客户|转客户|认领|回收/.test(f.state||"")&&!(f.summary||"").trim()) return false;
  return !!(f.summary||"").trim()||!!(f.feedback||"").trim();
}
function getLeadFollowEvents(lead){
  const ctx=buildLifecycleContext("leads",lead);
  const presets=collectLifecyclePresets(ctx);
  const items=[];
  const seen=new Set();
  const push=(time,title,meta,text)=>{
    const key=`${title}|${ljtFormatDate(time)}`;
    if(seen.has(key)) return;
    seen.add(key);
    items.push({time,title,meta:meta||"—",text:text||"—",sort:ljtParseTime(time)});
  };
  presets.filter(e=>!isLeadLifecycleMilestone(e)&&e.cat!=="ai"&&e.cat!=="system").forEach(e=>{
    push(e.time,e.title,e.operator,e.summary);
  });
  datasets.follow.filter(f=>f.target?.includes(lead.id)||f.customer===lead.name).filter(isLeadFollowBehavior).forEach(f=>{
    push(f.time,`${f.method||"跟进"} · ${f.state||"记录"}`,f.owner,f.summary||f.feedback);
  });
  return items.sort((a,b)=>b.sort-a.sort);
}
function leadDrawerFollowHtml(lead){
  const rows=getLeadFollowEvents(lead);
  return rows.length?`<div class="timeline">${rows.map(f=>`<div class="time-item"><div class="time-title">${f.title}</div><div class="time-meta">${f.time} / ${f.meta}</div><div class="time-text">${f.text}</div></div>`).join("")}</div>`:`<div class="empty" style="padding:12px">暂无跟进记录，销售沟通与跟进备注将沉淀于此</div>`;
}
function leadDrawerAttachHtml(lead){
  const att=(lead.attachments||[]).length?lead.attachments.map(a=>`<div class="summary-row"><div class="summary-text"><strong>${a.name||a}</strong><span>${a.size||"—"} · ${a.time||"—"}</span></div></div>`).join(""):`${kv("询盘附件","catalog-request.pdf · 248KB")}${kv("企业资料","company-profile.pdf · 1.2MB")}`;
  return `<div class="summary-list">${att}</div>`;
}
function leadDrawerAuditHtml(lead){
  const logs=datasets.auditLogs.filter(l=>l.target===lead.id||(l.content||"").includes(lead.name));
  return logs.length?`<div class="timeline">${logs.map(l=>`<div class="time-item"><div class="time-title">${l.action} · ${l.module}</div><div class="time-meta">${l.time} / ${l.operator}</div><div class="time-text">${l.content}</div></div>`).join("")}</div>`:`<div class="empty" style="padding:12px">暂无操作记录</div>`;
}
function ensureLeadTagStore(leadId){
  if(!datasets.leadTagAssignments) datasets.leadTagAssignments={};
  if(!datasets.leadTagHistory) datasets.leadTagHistory={};
  if(!datasets.leadTagAssignments[leadId]){
    const lead=datasets.leads.find(l=>l.id===leadId);
    const parts=(lead?.tags||"").split(/[/、,，]/).map(s=>s.trim()).filter(Boolean);
    datasets.leadTagAssignments[leadId]=parts.map(name=>({name,source:/AI|推荐/.test(name)?"ai":"business",status:"confirmed"}));
  }
  return datasets.leadTagAssignments[leadId];
}
function pushLeadTagHistory(leadId,action,detail,operator){
  if(!datasets.leadTagHistory) datasets.leadTagHistory={};
  if(!datasets.leadTagHistory[leadId]) datasets.leadTagHistory[leadId]=[];
  datasets.leadTagHistory[leadId].unshift({time:"2026-06-16 "+new Date().toTimeString().slice(0,5),action,detail,operator:operator||sessionUser?.name||"系统"});
}
function getLeadListTags(leadId){
  return ensureLeadTagStore(leadId).filter(t=>{
    if(t.status==="ignored"|| (t.source==="ai"&&t.status==="pending")) return false;
    if(t.source==="ai"&&!canUseAiFeature()) return false;
    return true;
  });
}
function getLeadActiveTagNames(leadId){
  return getLeadListTags(leadId).map(t=>t.name);
}
function leadMatchesTagFilter(leadId,filterArr){
  if(!filterArr?.length) return true;
  const names=getLeadActiveTagNames(leadId);
  return filterArr.every(t=>names.includes(t));
}
function getLeadTagFilterOptions(){
  const set=new Set((datasets.leadTagPresets||[]).map(p=>p.name));
  Object.values(datasets.leadTagAssignments||{}).flat().forEach(t=>{ if(t.status!=="ignored") set.add(t.name); });
  return [...set].sort();
}
function leadTagsDisplayHtml(leadId){
  const tags=getLeadListTags(leadId);
  if(!tags.length) return `<span style="color:var(--soft)">—</span>`;
  return tags.map(t=>tag(t.name)).join(" ");
}
function leadTagsCellHtml(leadId,maxShow=3){
  const tags=getLeadListTags(leadId);
  if(!tags.length) return `<span style="color:var(--soft);font-size:11px">—</span>`;
  const names=tags.map(t=>t.name);
  const vis=names.slice(0,maxShow);
  const rest=names.length-maxShow;
  return `<div class="lead-tag-wrap" onclick="event.stopPropagation()">${vis.map(n=>tag(n)).join("")}${rest>0?`<span class="lead-tag-more" title="${names.slice(maxShow).join("、")}">+${rest}</span>`:""}</div>`;
}
function getSelectedLeadRowsForTag(scope){
  if(scope==="pool") return [...leadPoolSelected].map(i=>getLeadPoolRows()[i]).filter(Boolean);
  if(scope==="my") return [...myLeadSelected].map(i=>getMyLeadRows()[i]).filter(Boolean);
  return [];
}
function getRemovableLeadTagNames(leadIds){
  const set=new Set();
  leadIds.forEach(id=>{
    ensureLeadTagStore(id).forEach(t=>{
      if(t.status!=="ignored"&&t.source!=="ai") set.add(t.name);
    });
  });
  return [...set].sort();
}
function openLeadTagBatchModal(mode,scope){
  const n=scope==="pool"?leadPoolSelected.size:myLeadSelected.size;
  if(!n){ toast("请先选择线索"); return; }
  leadTagBatchMode=mode;
  leadTagBatchScope=scope;
  leadTagEditIdx=null;
  openModal("leadTag");
}
function openLeadTagModal(idx){
  leadTagEditIdx=idx;
  leadTagBatchMode=null;
  leadTagBatchScope=null;
  openModal("leadTag");
}
function applyLeadTagsAdd(leadIds,presetCodes,customName){
  let added=0;
  leadIds.forEach(leadId=>{
    const store=ensureLeadTagStore(leadId);
    presetCodes.forEach(code=>{
      const preset=(datasets.leadTagPresets||[]).find(p=>p.code===code);
      if(!preset||store.some(t=>t.name===preset.name&&t.status!=="ignored")) return;
      store.push({name:preset.name,source:"system",preset:preset.code,status:"confirmed"});
      pushLeadTagHistory(leadId,"添加系统预设",preset.name,sessionUser?.name);
      added++;
    });
    const name=(customName||"").trim();
    if(name&&!store.some(t=>t.name===name&&t.status!=="ignored")){
      store.push({name,source:"business",owner:sessionUser?.name||"业务员",status:"confirmed"});
      pushLeadTagHistory(leadId,"添加业务标签",name,sessionUser?.name);
      added++;
    }
  });
  return added;
}
function applyLeadTagsRemove(leadIds,tagNames){
  let removed=0;
  leadIds.forEach(leadId=>{
    const store=ensureLeadTagStore(leadId);
    tagNames.forEach(name=>{
      const i=store.findIndex(x=>x.name===name&&x.source!=="ai"&&x.status!=="ignored");
      if(i>=0){ store.splice(i,1); pushLeadTagHistory(leadId,"删除标签",name,sessionUser?.name); removed++; }
    });
  });
  return removed;
}
function saveLeadTagsFromModal(){
  const presetCodes=[...document.querySelectorAll('#modalBody input[name="leadTagPreset"]:checked:not(:disabled)')].map(inp=>inp.value);
  const custom=getModalFieldValue("customTag");
  if(leadTagBatchMode==="remove"){
    const tagNames=[...document.querySelectorAll('#modalBody input[name="leadTagRemove"]:checked')].map(inp=>inp.value);
    if(!tagNames.length){ toast("请选择要移除的标签"); return false; }
    const rows=leadTagEditIdx!=null?[datasets.leads[leadTagEditIdx]].filter(Boolean):getSelectedLeadRowsForTag(leadTagBatchScope);
    const leadIds=rows.map(r=>r.id);
    const n=applyLeadTagsRemove(leadIds,tagNames);
    if(!n){ toast("所选标签无法移除"); return false; }
    toast(`已从 ${leadIds.length} 条线索移除 ${tagNames.length} 类标签`);
  }else{
    if(leadTagBatchMode==="add"||leadTagBatchScope){
      const rows=getSelectedLeadRowsForTag(leadTagBatchScope);
      if(!rows.length){ toast("未选择线索"); return false; }
      if(!presetCodes.length&&!custom.trim()){ toast("请选择预设标签或输入自定义标签"); return false; }
      const n=applyLeadTagsAdd(rows.map(r=>r.id),presetCodes,custom);
      if(!n){ toast("标签已存在或未变更"); return false; }
      toast(`已为 ${rows.length} 条线索添加标签`);
    }else{
      const lead=leadTagEditIdx!=null?datasets.leads[leadTagEditIdx]:null;
      if(!lead){ toast("未选择线索"); return false; }
      if(!presetCodes.length&&!custom.trim()){ toast("请选择预设标签或输入自定义标签"); return false; }
      const n=applyLeadTagsAdd([lead.id],presetCodes,custom);
      if(!n){ toast("标签已存在或未变更"); return false; }
      toast(`已添加 ${n} 个标签`);
    }
  }
  leadTagEditIdx=null;
  leadTagBatchMode=null;
  leadTagBatchScope=null;
  closeModal();
  renderPage();
  return true;
}
function toggleLeadTagFilter(scope,tagName){
  const ref=scope==="pool"?leadPoolTagFilter:scope==="my"?myLeadTagFilter:null;
  if(!ref) return;
  const i=ref.indexOf(tagName);
  if(i>=0) ref.splice(i,1); else ref.push(tagName);
  renderPage();
}
function clearLeadTagFilter(scope){
  if(scope==="pool") leadPoolTagFilter=[];
  else if(scope==="my") myLeadTagFilter=[];
  renderPage();
}
function leadTagFilterField(scope,selected){
  const opts=getLeadTagFilterOptions();
  if(!opts.length) return "";
  const esc=t=>t.replace(/'/g,"\\'");
  const available=opts.filter(t=>!selected.includes(t));
  const selectOpts=available.length
    ? available.map(t=>`<option value="${esc(t)}">${t}</option>`).join("")
    : `<option value="" disabled>已全部添加</option>`;
  const pills=selected.length
    ? `<div class="lead-tag-filter-pills">${selected.map(t=>`<span class="lead-tag-filter-pill">${t}<button type="button" aria-label="移除 ${t}" onclick="toggleLeadTagFilter('${scope}','${esc(t)}')">×</button></span>`).join("")}<button type="button" class="btn small ghost" onclick="clearLeadTagFilter('${scope}')">清空</button></div>`
    : "";
  return `<div class="field lead-tag-filter-field"><label>线索标签 <span style="font-size:11px;color:var(--soft)">多选 · 须同时满足</span></label><select onchange="if(this.value){toggleLeadTagFilter('${scope}',this.value);this.selectedIndex=0;}"><option value="">选择标签…</option>${selectOpts}</select>${pills}</div>`;
}
function customerDrawerAuditHtml(customer){
  const logs=datasets.auditLogs.filter(l=>l.target===customer.id||(l.content||"").includes(customer.name));
  return logs.length?`<div class="timeline">${logs.map(l=>`<div class="time-item"><div class="time-title">${l.action} · ${l.module}</div><div class="time-meta">${l.time} / ${l.operator}</div><div class="time-text">${l.content}</div></div>`).join("")}</div>`:`<div class="empty" style="padding:12px">暂无操作记录</div>`;
}
const LJT_CAT_LABELS={lead:"线索",comm:"沟通",sales:"销售",ai:"AI",system:"系统"};
function ljtParseTime(t){
  if(!t||t==="-") return 0;
  const s=String(t).replace("今天","2026-06-16").replace("昨天","2026-06-15");
  const m=s.match(/(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if(m) return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0)).getTime();
  return 0;
}
function ljtFormatDate(t){
  const ts=ljtParseTime(t);
  if(!ts) return t||"—";
  const d=new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function buildLifecycleContext(type,data){
  const ctx={type,data,leadId:null,customerId:null,customerName:null,contractId:null,lead:null,customer:null};
  if(type==="leads"){
    ctx.leadId=data.id; ctx.lead=data; ctx.customerName=data.name;
    ctx.customer=datasets.customers.find(c=>c.sourceLead===data.id||c.name===data.name);
    if(ctx.customer){ctx.customerId=ctx.customer.id;ctx.customerName=ctx.customer.name;}
  } else if(type==="customers"){
    ctx.customerId=data.id; ctx.customerName=data.name; ctx.customer=data;
    ctx.leadId=data.sourceLead; ctx.lead=datasets.leads.find(l=>l.id===data.sourceLead);
  } else if(type==="contracts"){
    ctx.contractId=data.id; ctx.customerName=data.customer;
    ctx.customer=datasets.customers.find(c=>c.name===data.customer);
    ctx.customerId=ctx.customer?.id; ctx.leadId=data.lead&&data.lead!=="-"?data.lead:null;
    ctx.lead=ctx.leadId?datasets.leads.find(l=>l.id===ctx.leadId):null;
  }
  return ctx;
}
function collectLifecyclePresets(ctx){
  const keys=new Set();
  [ctx.leadId,ctx.customerId,ctx.customerName,ctx.contractId].filter(Boolean).forEach(k=>keys.add(k));
  if(ctx.customer?.sourceLead) keys.add(ctx.customer.sourceLead);
  const out=[]; const seen=new Set();
  keys.forEach(k=>{
    (datasets.lifecyclePresets[k]||[]).forEach(e=>{
      const id=e.id||`${k}-${e.title}-${e.time}`;
      if(!seen.has(id)){seen.add(id);out.push({...e});}
    });
  });
  return out;
}
function collectLifecycleAuto(ctx){
  const events=[];
  const {lead,customerName,leadId,contractId,customerId}=ctx;
  if(lead?.inquiryTime){
    events.push({cat:"lead",time:lead.inquiryTime,title:"收到询盘",summary:`来源：${leadChannelLabel(lead)}`,detail:`站点：${lead.site||"—"}<br>产品意向：${lead.intent||"—"}<br>入池：${lead.capture||"—"}`,operator:lead.owner&&lead.owner!=="-"?lead.owner:"系统"});
  }
  if(lead){
    const intel=getLeadIntelligence(lead);
    if(intel?.analyzedAt){
      events.push({cat:"ai",time:intel.analyzedAt,title:"AI 企业洞察生成",summary:intel.identifiedCompany||lead.name,detail:`AI 识别：${intel.identifiedCompany||"—"}<br>采购阶段：${intel.purchaseStage||"—"}<br>建议：${intel.nextAction||"—"}`,operator:"AI 引擎"});
    }
  }
  if(leadId){
    datasets.conversions.filter(c=>c.lead===leadId).forEach(c=>{
      const title={"线索分配":"分配业务员","转客户":"转为客户","培育中":"状态变更 · 培育中","合同成交":"成交"}[c.node]||c.node;
      events.push({cat:c.node==="合同成交"?"sales":"lead",time:c.time,title,summary:c.result,detail:`节点：${c.node}<br>负责人：${c.owner}${c.contract&&c.contract!=="-"?`<br>合同：${c.contract}`:""}`,operator:c.owner});
    });
  }
  const folKey=customerName||lead?.name;
  datasets.follow.filter(f=>f.customer===folKey||(leadId&&f.target?.includes(leadId))).forEach(f=>{
    let title=f.state;
    if(f.method==="WhatsApp") title=f.state==="已成交"?"WhatsApp 确认成交":"WhatsApp 沟通";
    else if(f.method==="邮件"&&f.state.includes("首次")) title="首次邮件回复";
    else if(f.summary.includes("报价")) title="发送报价单";
    events.push({cat:f.method==="邮件"||f.method==="WhatsApp"?"comm":"sales",time:f.time,title,summary:f.summary,detail:`方式：${f.method}<br>反馈：${f.feedback||"—"}<br>下次：${f.nextPlan||"—"}`,operator:f.owner});
  });
  datasets.emails.filter(e=>e.lead===leadId||e.customer===folKey).forEach(e=>{
    events.push({cat:"comm",time:e.time,title:e.box==="sent"?"邮件发送":"邮件回复",summary:e.subject,detail:`${e.summary||"—"}<br>AI：${e.aiIntent||"—"}`,operator:e.owner});
  });
  datasets.chats.filter(c=>c.lead===leadId||c.customer===folKey).forEach(c=>{
    events.push({cat:"comm",time:c.time,title:"WhatsApp 消息",summary:c.preview,detail:`${c.contact} · ${c.stage||"—"}`,operator:c.owner});
  });
  datasets.contracts.filter(c=>c.lead===leadId||c.customer===folKey||(contractId&&c.id===contractId)).forEach(c=>{
    events.push({cat:"sales",time:c.date,title:"合同签订",summary:`${c.id} · ${c.amount}`,detail:`签约：${c.date}<br>状态：${c.state||"—"}`,operator:c.seller});
    if(c.latestDeal&&c.latestDeal!=="-") events.push({cat:"sales",time:c.latestDeal,title:"成交",summary:`金额：${c.amount}`,detail:`合同 ${c.id} 成交回写`,operator:c.seller});
  });
  [leadId,customerId,contractId,customerName].filter(Boolean).forEach(t=>{
    datasets.auditLogs.filter(l=>(l.target||"").includes(t)||(customerName&&(l.content||"").includes(customerName))).forEach(l=>{
      events.push({cat:"system",time:l.time,title:l.action,summary:l.content,detail:`${l.module} · ${l.result}`,operator:l.operator});
    });
  });
  if(customerName&&datasets.commIntelligence?.[customerName]?.analyzedAt){
    const ci=datasets.commIntelligence[customerName];
    events.push({cat:"ai",time:ci.analyzedAt,title:"AI 沟通画像更新",summary:ci.customer||customerName,detail:(ci.nextActions||[])[0]||(ci.topics||[]).join("、")||"—",operator:"AI 引擎"});
  }
  return events;
}
function mergeLifecycleEvents(presets,auto){
  if(presets.length>=6) return presets.slice().sort((a,b)=>ljtParseTime(b.time)-ljtParseTime(a.time));
  const sig=new Set(presets.map(p=>`${p.title}|${ljtFormatDate(p.time)}`));
  const extra=auto.filter(a=>!sig.has(`${a.title}|${ljtFormatDate(a.time)}`));
  return [...presets,...extra].sort((a,b)=>ljtParseTime(b.time)-ljtParseTime(a.time));
}
function buildLifecycleEvents(type,data){
  const ctx=buildLifecycleContext(type,data);
  let events=mergeLifecycleEvents(collectLifecyclePresets(ctx),collectLifecycleAuto(ctx));
  if(type==="leads"){
    events=events.filter(e=>!isLeadTagLifecycleEvent(e)&&e.cat!=="ai"&&isLeadLifecycleMilestone(e));
  }
  return events;
}
function getLifecycleStatus(type,data){
  if(type==="leads") return {label:getLeadBizStatus(data),sub:`${getLeadBizStage(data)!=="—"?getLeadBizStage(data)+" · ":""}意向：${getLeadIntentLevel(data)} · 负责人：${data.owner&&data.owner!=="-"?data.owner:"未分配"}`};
  if(type==="customers"){const p=getCustomerProfile(data);return {label:p.coopStage||data.level||"—",sub:`${p.followPriority||"—"} · 负责人 ${data.owner||"—"}`};}
  if(type==="contracts") return {label:displayContractState(data.state,data),sub:`${data.amount||"—"} · 负责人 ${data.seller||"—"}`};
  return {label:"—",sub:""};
}
function renderLifecycleTimeline(events,status){
  const banner=`<div class="lj-status-banner"><div><span class="lj-status-label">当前状态</span><strong class="lj-status-val">${status.label}</strong><span class="lj-status-sub">${status.sub}</span></div><span class="lj-status-count">${events.length} 个节点 · 最新在上 · 点击展开</span></div>`;
  if(!events.length) return `${banner}<div class="empty" style="padding:16px">暂无生命周期记录。状态变更、沟通与销售动作将自动沉淀，历史不会被覆盖。</div>`;
  const items=events.map((e,i)=>`<div class="ljt-item${i===0?" open":""}" onclick="event.stopPropagation();this.classList.toggle('open')">
    <div class="ljt-axis"><span class="ljt-dot ${e.cat||"lead"}"></span></div>
    <div class="ljt-body">
      <div class="ljt-head"><span class="ljt-date">${ljtFormatDate(e.time)}</span><span class="ljt-cat ${e.cat||"lead"}">${LJT_CAT_LABELS[e.cat]||"记录"}</span><strong class="ljt-title">${normalizeLeadCopy(e.title)}</strong></div>
      ${e.summary?`<div class="ljt-summary">${normalizeLeadCopy(e.summary)}</div>`:""}
      <div class="ljt-detail">${normalizeLeadCopy(e.detail||e.summary||"—")}${e.operator?`<div class="ljt-op">操作人：${e.operator}</div>`:""}</div>
    </div>
  </div>`).join("");
  return `${banner}<div class="ljt-timeline">${items}</div>`;
}
function renderLifecycleSection(type,data){
  const events=buildLifecycleEvents(type,data);
  const status=getLifecycleStatus(type,data);
  const title=type==="leads"?"生命周期":"生命周期轨迹 · 客户旅程";
  const emptyHint=type==="leads"?"暂无生命周期节点。线索创建、分配、状态/阶段变更与成交/流失等关键节点将自动沉淀。":"暂无生命周期记录。状态变更、沟通与销售动作将自动沉淀，历史不会被覆盖。";
  const banner=`<div class="lj-status-banner"><div><span class="lj-status-label">当前状态</span><strong class="lj-status-val">${status.label}</strong><span class="lj-status-sub">${status.sub}</span></div><span class="lj-status-count">${events.length} 个节点 · 最新在上 · 点击展开</span></div>`;
  if(!events.length) return drawerSection(title,`${banner}<div class="empty" style="padding:16px">${emptyHint}</div>`);
  return drawerSection(title,renderLifecycleTimeline(events,status));
}
function getCustomerContractDeal(c){
  return datasets.contracts.some(ct=>(ct.customer===c.name||ct.customerId===c.id)&&["已成交","生效中","已完成","执行中"].includes(ct.state||"")) || /\d+\s*\//.test(String(c?.contracts||""));
}
function resolveMessageTarget(target){
  if(!target) return;
  if(target.type==="lead"){
    const idx=datasets.leads.findIndex(l=>l.id===target.id);
    if(idx>=0) openDrawer("leads",idx);
  } else if(target.type==="contract"){
    const idx=datasets.contracts.findIndex(c=>c.id===target.id);
    if(idx>=0) openDrawer("contracts",idx);
  } else if(target.type==="customer"){
    const idx=datasets.customers.findIndex(c=>c.name===target.name);
    if(idx>=0){
      focusedCustomerIdx=idx;
      customerDetailTab=target.tab==="360"?"360":"overview";
      openDrawer("customers",idx,{keepDetailTab:true});
    }
  } else if(target.type==="task"){
    const idx=datasets.tasks.findIndex(t=>t.id===target.id);
    if(idx>=0) openDrawer("tasks",idx);
  }
}

function getListStateKey(){
  if(currentPage==="lead-all") return `lead-pool-${normalizeLeadPoolTab(leadPoolTab)}`;
  if(currentPage==="lead-pending") return `my-lead-${normalizeLeadStatusTab(myLeadTab)}`;
  if(currentPage==="lead-invalid") return `invalid-lead-${invalidLeadTab}`;
  if(currentPage==="customer-profile") return `customer-${customerTab||"profile"}`;
  if(currentPage==="contract-list") return `contract-${contractView}`;
  if(currentPage==="site-management") return "site-sites";
  if(isCommCenterPage(currentPage)){
    if(currentPage==="communication-email"||commView==="email") return `comm-email-${emailBox}`;
    if(currentPage==="communication-whatsapp"||commView==="whatsapp") return "comm-whatsapp";
    if(currentPage==="communication-config"||commView==="config") return "comm-config";
    return "comm-desk";
  }
  return currentPage;
}
function isListPage(pageId){ return LIST_PAGE_IDS.has(pageId); }
function getListRowCount(key){
  key = key || getListStateKey();
  const counts = {
    "lead-all":()=>getLeadPoolRows().length,
    "lead-pending":()=>getMyLeadRows().length,
    "lead-invalid":()=>getInvalidLeadRows().length,
    "customer-profile":()=>getCustomerRows().length,
    "customer-contacts":()=>getContactRows().length,
    "customer-tags":()=>getCustomerTagRows().length,
    "lead-tags":()=>getLeadTagRows().length,
    "follow-record":()=>getFollowRows().length,
    "contract-list":()=>getContractRows().length,
    "contract-customer":()=>getContractCustomerRows().length,
    "comm-desk":()=>getCommDeskRows().length,
    "comm-workbench":()=>getCommDeskRows().length,
    "comm-email-inbox":()=>getAccountInboxRows().length,
    "comm-email-sent":()=>getEmailSentRows().length,
    "comm-email-draft":()=>getEmailDraftRows().length,
    "comm-whatsapp":()=>getChatRows().length,
    "comm-config":()=>getCommAccountRows().length,
    "user-management":()=>getUserRows().length,
    "role-management":()=>getRoleRows().length,
    "site-sites":()=>getSiteMgmtRows().length,
    "site-owner":()=>getSiteOwnerRows().length,
    "site-stat-monthly":()=>{const siteStats=getSiteStatsData();const scope=getSiteStatScope();return Object.entries(siteStats).filter(([name])=>name!=="全部站点"&&scope.includes(name)).length;},
    "site-stat-sellers":()=>{const siteStats=getSiteStatsData();const scope=getSiteStatScope();const stat=siteStats[selectedSiteStat]||siteStats["天猫苏豪站"];return filterSiteStatSellers(stat.sellers||[]).length;},
    "menu-management":()=>getMenuRows().length,
    "data-dictionary":()=>5,
    "role-menu-matrix":()=>8,
    "channel-config":()=>getChannelRows().length,
    "system-log":()=>getAuditLogRows().length
  };
  return (counts[key]||(()=>0))();
}
function setPageListState(state){
  pageListStates[getListStateKey()] = state;
  renderPage();
}
function maskListTables(html){
  const state = pageListStates[getListStateKey()] || "normal";
  if(state==="normal") return html;
  if(state==="loading"){
    const block = `<div class="state-block loading"><div class="spinner-lg"></div><div style="margin-top:6px">数据加载中，请稍候…</div></div>`;
    return html.replace(/(<div class="table-wrap">)[\s\S]*?(<\/div>\s*<div class="table-foot">)/g, `$1${block}$2`);
  }
  if(state==="error"){
    const block = `<div class="state-block error"><strong>加载失败</strong><p style="font-size:13px;margin:8px 0 12px;line-height:1.6">接口超时或服务异常，请稍后重试。</p><button type="button" class="btn small primary" onclick="setPageListState('normal')">重试</button></div>`;
    return html.replace(/(<div class="table-wrap">)[\s\S]*?(<\/div>\s*<div class="table-foot">)/g, `$1${block}$2`);
  }
  if(state==="empty"){
    return html.replace(/(<tbody>)[\s\S]*?(<\/tbody>)/g, `$1<tr><td colspan="20"><div class="state-block empty"><div style="font-size:28px;margin-bottom:8px">📭</div><strong>暂无数据</strong><p style="font-size:12px;margin-top:6px;color:var(--soft)">当前筛选条件下没有匹配记录</p></div></td></tr>$2`);
  }
  if(state==="pagination"){
    return html.replace(/(<div class="table-foot">)/, `<div class="state-block pagination-edge">已到最后一页 · 不支持继续翻页</div>$1`);
  }
  return html;
}

function tag(text){
  const display=text==="待认领"?"待分配":text;
  const map = { "A类":"green","B类":"blue","C类":"amber","D类":"gray","已成交":"green","跟进中":"blue","培育中":"amber","休眠":"gray","公海待领":"red","公海待分配":"red","决策人":"red","采购负责人":"amber","关键联系人":"blue","收件":"blue","发件":"green","需求确认":"gray","方案沟通":"blue","报价":"amber","谈判":"amber","合同":"cyan","成交":"green","待跟进":"red","异常线索":"red","已失效":"gray","运营中":"green","暂停":"amber","正常":"green","冻结":"gray","独占":"cyan","公海":"amber","已签约":"green","待首响":"red","报价打样":"amber","未超期":"green","待确认":"amber","深度沟通":"blue","未读":"red","已读":"gray","已发送":"green","草稿":"amber","邮件":"blue","WhatsApp":"green","待回复":"red","已回复":"green","已分配":"green","未分配":"amber","待分配":"cyan","已回收":"amber","超时释放":"red","转客户":"cyan","合同成交":"green","培育中":"amber","线索分配":"blue","首次联系":"blue","网站表单":"blue","接口拉取":"gray","手动录入":"gray","信息不完整":"amber","重复线索":"red","站点未授权":"red","无负责人":"amber","无效线索":"gray","待处理":"red","已归档":"green","已恢复":"blue","启用":"green","停用":"gray","成功":"green","异常":"red","可用":"green","网站接口":"blue","手动":"gray","部分成功":"amber" };
  return `<span class="tag ${map[display]||map[text]||"blue"}">${display}</span>`;
}


function applySessionUser(){
  currentRole = sessionUser.role;
  const avatars = {"管理员":"管","运营专员":"运","协同人":"协","外贸业务员":"业","访客":"访"};
  document.getElementById("userAvatar").textContent = avatars[sessionUser.role]||sessionUser.avatar||"—";
  const avEl = document.getElementById("userAvatar");
  if(avEl) avEl.title = sessionUser.name;
}
function renderLifecycle(stages,currentIdx){
  return `<div class="lifecycle">${stages.map((s,i)=>`${i>0?'<span class="lifecycle-arrow">→</span>':""}<span class="lifecycle-step ${i<currentIdx?"done":i===currentIdx?"current":"disabled"}">${s}</span>`).join("")}</div>`;
}
function leadLifecycleHtml(stage){
  const normalized=mapLegacyStageToBiz(stage);
  const idx=normalized?Math.max(0,LEAD_BIZ_STAGES.indexOf(normalized)):0;
  return renderLifecycle(LEAD_BIZ_STAGES,idx);
}
function customerLifecycleHtml(row){
  const hasDeal = row && String(row.contracts||"").match(/\d+\s*\//);
  const stages=["潜客","培育中","报价打样","已成交","沉睡"];
  let idx = 1;
  if(row?.lock==="公海"||row?.next==="已超期") idx = 4;
  else if(hasDeal) idx = 3;
  else if(row?.level==="A类"||row?.level==="B类") idx = 2;
  return renderLifecycle(stages,idx);
}
function contractLifecycleHtml(state,row){
  const display=displayContractState(state,row&&typeof row==="object"?row:null);
  const stages=["生效中","已完成","已终止"];
  const idx=display==="已完成"?1:display==="已终止"?2:0;
  return renderLifecycle(stages,idx);
}
const COOP_STAGES = ["首次接触","需求确认","报价中","打样中","商务谈判","合同签署","成交"];
function coopStageHtml(stage){
  const idx = Math.max(0, COOP_STAGES.indexOf(stage||"首次接触"));
  return `<div class="cp360-coop">${renderLifecycle(COOP_STAGES, idx)}</div>`;
}
function parseDealProb(v, dims){
  if(typeof v==="string" && v.includes("%")) return parseInt(v,10)||0;
  return dims?.probability ?? 50;
}
function deriveCustomerSignals(c, p, stored){
  let activity = stored.activityLabel;
  if(!activity){
    if(p.scoreDims.active >= 80) activity = "近7天活跃";
    else if(p.scoreDims.active < 40) activity = "跟进停滞";
    else activity = "近30天活跃";
  }
  let health = stored.healthStatus;
  let risks = [...(stored.healthRisks || [])];
  if(!health){
    if(c.next==="已超期" || c.lock==="公海" || p.scoreDims.active < 35){
      health = "风险";
      if(c.next==="已超期" && !risks.length) risks.push("下次跟进已超期");
      if(c.lock==="公海" && !risks.some(r=>r.includes("公海"))) risks.push("客户处于公海池");
    } else if(p.scoreDims.active < 65){
      health = "一般";
      if(!risks.length) risks.push("近30天沟通频率下降");
    } else health = "健康";
  }
  return {activity, health, risks};
}
function mapTreeRole(contact){
  if(contact.decision==="老板") return "CEO";
  if(contact.decision==="关键决策人"){
    if(/总监|Director/i.test(contact.role)) return "采购总监";
    if(/经理|Manager|Owner/i.test(contact.role)) return contact.role==="Owner" ? "CEO" : "采购经理";
    return contact.role || "关键决策人";
  }
  if(contact.decision==="影响人") return "影响人";
  return contact.role || "执行联系人";
}
const TREE_ROLE_ORDER = {"CEO":0,"Owner":0,"采购总监":1,"采购经理":2,"关键决策人":2,"影响人":3,"执行联系人":4};
function customerRelationTreeHtml(name){
  const contacts = datasets.contacts.filter(x=>x.customer===name)
    .sort((a,b)=>(TREE_ROLE_ORDER[mapTreeRole(a)]??9)-(TREE_ROLE_ORDER[mapTreeRole(b)]??9));
  if(!contacts.length) return `<div style="font-size:12px;color:var(--soft)">暂无关键联系人，请补充客户关系图谱</div>`;
  return `<div class="c360-tree">
    <div class="c360-tree-root">${name}</div>
    <div class="c360-tree-node">${contacts.map(ct=>{
      const role = mapTreeRole(ct);
      const decTag = ct.decision==="关键决策人"||ct.decision==="老板" ? `<span class="c360-tree-tag">${ct.decision}</span>` : "";
      return `<div class="c360-tree-item"><span class="c360-tree-role">${role}</span><span class="c360-tree-name">${ct.name}</span>${decTag}</div>`;
    }).join("")}</div>
  </div>`;
}
function getCustomerProfile(c){
  const stored = datasets.customerProfiles?.[c.id] || {};
  const leadRow = c.sourceLead ? datasets.leads.find(l=>l.id===c.sourceLead) : null;
  const leadIntel = (canUseAiFeature() && leadRow) ? getLeadIntelligence(leadRow) : null;
  const emailCount = datasets.emails.filter(e=>e.customer===c.name).length;
  const waCount = datasets.chats.filter(x=>x.customer===c.name).length;
  const followCount = datasets.follow.filter(f=>f.customer===c.name).length;
  const contractCount = datasets.contracts.filter(x=>x.customer===c.name).length;
  const base = {
    shortName: stored.shortName || leadIntel?.inquiryName?.split(" ")[0] || c.name?.split(" ")[0] || "-",
    website: stored.website || leadIntel?.website || "-", logo: stored.logo || leadIntel?.logo || (c.name||"?").slice(0,2).toUpperCase(),
    city: stored.city || leadIntel?.city || "-", founded: stored.founded || leadIntel?.founded || "-", scale: stored.scale || leadIntel?.scaleLabel || "-",
    employees: stored.employees || leadIntel?.employees || "-", revenue: stored.revenue || leadIntel?.revenue || "-",
    industry: stored.industry || leadIntel?.industry || c.industry || "-", subIndustry: stored.subIndustry || "-", nature: stored.nature || (leadIntel?.natures?.[0]||"-"),
    certified: stored.certified ?? !!(leadIntel?.certs?.length), certs: stored.certs?.length ? stored.certs : (leadIntel?.certs || []),
    bizType: stored.bizType || leadIntel?.natures?.[0] || "-", mainMarkets: stored.mainMarkets?.length ? stored.mainMarkets : (leadIntel?.mainMarkets || []),
    purchaseMode: stored.purchaseMode || "-", purchaseFreq: stored.purchaseFreq || "-",
    annualPurchase: stored.annualPurchase || leadIntel?.purchaseScale || "-", productLines: stored.productLines || [],
    valueScore: stored.valueScore ?? leadIntel?.valueScore ?? (c.level==="A类"?85:c.level==="B类"?70:55),
    scoreDims: stored.scoreDims || (leadIntel?.scoreDims ? {...leadIntel.scoreDims,potential:leadIntel.scoreDims.potential,history:leadIntel.scoreDims.history||50} : {scale:70,potential:70,history:50,active:60,probability:55}),
    valueLabel: stored.valueLabel || leadIntel?.valueLabel || c.level || "—", followPriority: stored.followPriority || "正常跟进",
    isTarget: stored.isTarget ?? (leadIntel?.valueScore>=80||c.level==="A类"), coopStage: stored.coopStage || "需求确认",
    dealProbability: stored.dealProbability || (leadIntel?.dealProbability!=null?`${leadIntel.dealProbability}%`:"-"),
    aiSummary: stored.aiSummary || leadIntel?.aiSummary || `基于 ${getCustomerLeadCount(c)} 条历史询盘、${emailCount} 封邮件与 ${contractCount} 份合同汇总生成。`,
    aiAnalysis: stored.aiAnalysis || stored.aiSummary || leadIntel?.aiSummary || `汇总 ${getCustomerLeadCount(c)} 条关联线索、${emailCount} 封邮件与 ${contractCount} 份合同信息生成企业画像。`,
    aiSuggestion: stored.aiSuggestion || leadIntel?.suggestions?.[0] || leadIntel?.nextAction || "建议结合最近沟通记录制定下一步跟进计划。",
    dataSources: stored.dataSources || leadIntel?.dataSources || ["CRM录入","跟进记录"].concat(emailCount?["邮件记录"]:[]).concat(waCount?["WhatsApp"]:[]).concat(contractCount?["合同记录"]:[]),
    inheritedFromLead: c.sourceLead && leadIntel ? c.sourceLead : null,
    companyIntro: stored.companyIntro || leadIntel?.aiSummary || "",
    mainBusiness: stored.mainBusiness || (leadIntel?.natures||[]).join(" · ") || "",
    targetMarket: stored.targetMarket || (stored.mainMarkets||leadIntel?.mainMarkets||[]).join("、") || "",
    purchaseProfile: stored.purchaseProfile || {focusedProducts:(stored.productLines||[]).join("、"),productDirection:leadIntel?.intentSummary||"-",purchaseNeeds:stored.purchaseMode||"-",concerns:(leadIntel?.risks||[]).join("；")||"-"}
  };
  const signals = deriveCustomerSignals(c, base, stored);
  base.activityLabel = signals.activity;
  base.healthStatus = signals.health;
  base.healthRisks = signals.risks;
  base.dealProbNum = parseDealProb(base.dealProbability, base.scoreDims);
  return base;
}
function customerCommRecordsHtml(name,customerId,sourceLead){
  const emails = datasets.emails.filter(e=>e.customer===name).slice(0,3);
  const chats = datasets.chats.filter(c=>c.customer===name).slice(0,2);
  const safeName=(name||"").replace(/'/g,"\\'");
  const mailBtn=`<div class="toolbar-actions" style="margin-top:8px"><button class="btn small primary" onclick="closeDrawer();openCustomerEmailThread({customerName:'${safeName}',customerId:'${customerId||""}',leadId:'${sourceLead&&sourceLead!=="-"?sourceLead:""}'})">查看邮件会话</button></div>`;
  const items = [
    ...emails.map(e=>`<div class="cp360-comm-item" style="cursor:pointer" onclick="closeDrawer();openCustomerEmailThread({customerName:'${safeName}',customerId:'${customerId||""}',leadId:'${sourceLead&&sourceLead!=="-"?sourceLead:""}'})"><div class="cp360-comm-icon mail">邮</div><div class="cp360-comm-body"><strong>${e.subject}</strong><span>${e.time} · ${e.from} · ${e.aiIntent||e.status}</span></div></div>`),
    ...chats.map(c=>`<div class="cp360-comm-item"><div class="cp360-comm-icon wa">WA</div><div class="cp360-comm-body"><strong>${c.contact} · ${c.stage}</strong><span>${c.time} · ${c.preview}</span></div></div>`)
  ];
  return items.length ? `${mailBtn}<div class="cp360-comm">${items.join("")}</div>` : `<div class="empty" style="padding:12px">暂无沟通记录</div>${currentRole!=="访客"&&currentRole!=="协同人"?mailBtn:""}`;
}
function customerConcernsHtml(c,p){
  const pp=p.purchaseProfile||{};
  const leadRow=c.sourceLead?datasets.leads.find(l=>l.id===c.sourceLead):null;
  const leadIntel=leadRow?getLeadIntelligence(leadRow):null;
  const concerns=pp.concerns||(leadIntel?.risks||[]).join("；")||"—";
  return `<div style="font-size:13px;line-height:1.65;color:var(--muted)">${concerns}</div>`;
}
function customerFollowSuggestionsHtml(c,p){
  const leadRow=c.sourceLead?datasets.leads.find(l=>l.id===c.sourceLead):null;
  const leadIntel=leadRow?getLeadIntelligence(leadRow):null;
  const items=[...new Set([p.aiSuggestion,leadIntel?.nextAction,...(leadIntel?.suggestions||[])].filter(Boolean))];
  return items.length
    ? `<div class="li-suggest-list">${items.map(s=>`<div class="li-suggest-item">${s}</div>`).join("")}</div>`
    : `<div style="font-size:12px;color:var(--soft)">建议结合最近沟通记录制定下一步跟进计划。</div>`;
}
function customerAiProfileTabHtml(c,p){
  return `<div class="c360-card" style="margin-bottom:14px"><div class="c360-card-title">企业画像</div>${customerEnterpriseProfileHtml(c,p)}</div>
    <div class="c360-card" style="margin-bottom:14px"><div class="c360-card-title">采购画像</div>${customerPurchaseProfileHtml(p)}</div>
    ${canUseAiFeature()&&p.inheritedFromLead?`<div class="li-inherit-note">🔗 部分画像信息继承自线索 <strong>${p.inheritedFromLead}</strong> 的 AI 分析，不代表客户主体唯一状态。</div>`:""}`;
}
function normalizeCustomerDetailTab(tab){
  if(!tab||tab==="opps"||tab==="follow"||tab==="email") return "overview";
  return tab;
}
function customerProfile360Html(c){
  const p=getCustomerProfile(c);
  return customerAiProfileTabHtml(c,p);
}
function customerDrawerQuickActions(data){
  if(currentRole==="访客") return "";
  const safeName=(data.name||"").replace(/'/g,"\\'");
  const mailBtn=currentRole!=="协同人"?`<button class="btn small" onclick="closeDrawer();openCustomerEmailThread({customerId:'${data.id}',customerName:'${safeName}'})">查看往来邮件</button>`:"";
  return drawerSection("快捷操作",`<div class="toolbar-actions">${currentRole!=="协同人"?`<button class="btn small" onclick="openCustomerContactModal('${(data.name||"").replace(/'/g,"\\'")}')">新增联系人</button>${mailBtn}`:""}${data.lock==="公海"&&(currentRole==="外贸业务员"||currentRole==="管理员"||currentRole==="运营专员")?`<button class="btn small primary" onclick="toast('已领取公海客户');closeDrawer()">领取客户</button>`:""}${currentRole==="管理员"||currentRole==="运营专员"?`<button class="btn small" onclick="openModal('assign')">客户转移</button>`:""}<button class="btn small" onclick="nav('customer-tag')">管理标签</button></div>`);
}
function isCustomerKeyContact(ct){
  if(!ct) return false;
  if(ct.decision==="老板"||ct.decision==="关键决策人") return true;
  return !!(ct.aiRole&&(ct.aiRole.includes("决策")||ct.aiRole.includes("关键")));
}
function customerKeyContactTag(ct){
  return isCustomerKeyContact(ct)?tag("是","green"):tag("否","gray");
}
function applyContactModalPrefill(){
  const ctx=window._contactModalCtx;
  if(!ctx) return;
  const body=document.getElementById("modalBody");
  if(!body) return;
  const custInput=body.querySelector('[data-field="customer"] input');
  if(custInput&&ctx.customerName){
    custInput.value=ctx.customerName;
    custInput.readOnly=true;
  }
  if(ctx.contactIdx==null) return;
  const ct=datasets.contacts[ctx.contactIdx];
  if(!ct||ct.customer!==ctx.customerName) return;
  const setVal=(sel,v)=>{const el=body.querySelector(sel);if(el&&v!=null&&v!=="") el.value=v;};
  setVal('[data-field="name"] input',ct.name);
  setVal('.field:nth-child(3) input',ct.role);
  const roleSel=body.querySelector('.field:nth-child(4) select');
  if(roleSel&&(ct.contactRole||ct.decision)) roleSel.value=ct.contactRole||ct.decision;
  setVal('[data-field="email"] input',ct.email);
  setVal('.field:nth-child(6) input',ct.phone);
  setVal('.field:nth-child(7) input',ct.whatsapp&&ct.whatsapp!=="-"?ct.whatsapp:"");
}
function openCustomerContactModal(customerName,contactIdx){
  window._contactModalCtx={customerName,contactIdx:contactIdx??null,mode:contactIdx!=null?"edit":"add"};
  openModal("contact");
  queueMicrotask(()=>applyContactModalPrefill());
}
function deleteCustomerContact(customerName,contactIdx){
  if(currentRole==="访客"||currentRole==="协同人"){ toast("权限不足"); return; }
  const ct=datasets.contacts[contactIdx];
  if(!ct||ct.customer!==customerName){ toast("联系人不存在"); return; }
  toast(`已删除联系人 ${ct.name}`);
  if(focusedCustomerIdx!=null) switchCustomerDetailTab("contacts",focusedCustomerIdx);
}
function customerContactsTabHtml(c,idx){
  const canWrite=currentRole!=="访客"&&currentRole!=="协同人";
  const safeName=(c.name||"").replace(/'/g,"\\'");
  const rows=datasets.contacts.map((ct,i)=>({...ct,_idx:i})).filter(ct=>ct.customer===c.name);
  const toolbar=canWrite?`<div class="toolbar-actions" style="margin-bottom:10px"><button class="btn small primary" onclick="openCustomerContactModal('${safeName}')">新增联系人</button></div>`:"";
  if(!rows.length) return `${toolbar}<div class="empty" style="padding:16px">暂无联系人，请为本客户新增联系人。</div>`;
  return `${toolbar}<div class="table-wrap"><table><thead><tr><th>姓名</th><th>职位</th><th>邮箱</th><th>电话</th><th>WhatsApp</th><th>联系角色</th><th>关键联系人</th><th>AI识别</th><th>操作</th></tr></thead><tbody>${rows.map(ct=>`<tr>
    <td><strong>${ct.name}</strong></td><td>${ct.role||"—"}</td><td>${ct.email||"—"}</td><td>${ct.phone||"—"}</td><td>${ct.whatsapp&&ct.whatsapp!=="-"?ct.whatsapp:"—"}</td>
    <td>${tag(ct.contactRole||ct.decision||"—")}</td>
    <td>${customerKeyContactTag(ct)}</td>
    <td>${canUseAiFeature()?contactAiRoleTag(ct.aiRole):"—"}</td>
    <td>${canWrite?renderRowActions([{label:"编辑",onclick:`openCustomerContactModal('${safeName}',${ct._idx})`},{label:"删除",onclick:`deleteCustomerContact('${safeName}',${ct._idx})`,danger:true}],`cust-ct-${ct._idx}`):"—"}</td>
  </tr>`).join("")}</tbody></table></div>`;
}
function renderCustomerDrawerTabs(idx){
  const tabs=[["overview","客户信息"],["leads","线索记录"],["contacts","联系人"],["orders","合作合同"],["attachments","客户附件"],["360","AI客户画像"]];
  return `<div class="tabs sub-tabs" style="margin-bottom:14px">${tabs.map(([id,label])=>`<button type="button" class="tab ${normalizeCustomerDetailTab(customerDetailTab)===id?"active":""}" onclick="switchCustomerDetailTab('${id}',${idx})">${label}</button>`).join("")}</div>`;
}
function switchCustomerDetailTab(tab,idx){
  customerDetailTab=normalizeCustomerDetailTab(tab);
  focusedCustomerIdx=idx;
  const data=datasets.customers[idx];
  if(!data) return;
  const detail=drawerDetail("customers",data,idx);
  document.getElementById("drawerTitle").textContent=detail.title;
  document.getElementById("drawerSub").textContent=detail.sub;
  document.getElementById("drawerBody").innerHTML=detail.body;
}
function customerDrawerTabBody(data,idx){
  const p=getCustomerProfile(data);
  const tab=normalizeCustomerDetailTab(customerDetailTab);
  if(tab==="360") return `${renderAiGateContent(()=>customerAiProfileTabHtml(data,p),{title:"AI 客户画像",features:"企业简介、主营业务、目标市场、采购方向、采购关注点"})}${customerDrawerQuickActions(data)}`;
  if(tab==="leads") return `${drawerSection("线索记录",customerLeadsTabHtml(data))}${customerDrawerQuickActions(data)}`;
  if(tab==="contacts") return `${drawerSection("联系人管理",customerContactsTabHtml(data,idx))}${canUseAiFeature()?drawerSection("AI 联系人识别",`<div style="font-size:12px;color:var(--muted);line-height:1.7">基于邮件签名、职位与沟通频次，AI 自动识别决策人、采购负责人与关键联系人。联系人与跟进均归属具体线索，此处按客户主体汇总展示。</div>`):""}${customerDrawerQuickActions(data)}`;
  if(tab==="attachments") return `${drawerSection("客户资料管理",customerAttachmentsHtml(data.id))}${currentRole!=="访客"&&currentRole!=="协同人"?`<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="toast('上传附件功能演示')">上传附件</button></div>`:""}${customerDrawerQuickActions(data)}`;
  if(tab==="orders") return `${drawerSection("合作合同",customerContractsHtml(data.name))}${customerDrawerQuickActions(data)}`;
  const contractSummary=getCustomerContractSummary(data.name);
  const leadCount=getCustomerLeadCount(data);
  return `${drawerSection("客户基础信息",customerBasicInfoHtml(data))}
    ${leadCount?drawerSection("线索记录摘要",`<div class="summary-list">${kv("历史询盘",leadCount+" 次")}${kv("覆盖站点",getCustomerSitesSummary(data))}${kv("来源渠道",getCustomerChannelsSummary(data))}</div><button class="btn small" style="margin-top:8px" onclick="switchCustomerDetailTab('leads',${idx})">查看全部线索记录</button>`):`<div class="empty" style="padding:8px">暂无线索关联记录</div>`}
    ${drawerSection("合作合同摘要",contractSummary.count?`<div class="summary-list">${kv("累计合同数",contractSummary.count+" 份")}${kv("累计合同金额",contractSummary.totalAmount)}${kv("最近签约时间",contractSummary.latestSignDate)}${kv("最近签约合同",`<strong>${contractSummary.latestContractId}</strong>`)}</div><button class="btn small" style="margin-top:8px" onclick="switchCustomerDetailTab('orders',${idx})">查看合同历史</button>`:`<div class="empty" style="padding:8px">暂无合作合同</div>`)}
    ${renderAiGateContent(()=>`${drawerSection("企业画像",customerEnterpriseProfileHtml(data,p))}${drawerSection("采购画像",customerPurchaseProfileHtml(p))}`,{title:"客户画像",features:"企业简介、主营业务、目标市场、采购方向、采购关注点"})}
    ${drawerSection("操作记录",customerDrawerAuditHtml(data))}
    ${customerDrawerQuickActions(data)}`;
}
function openCustomerDetail(i,tab){
  const r=getCustomerRows()[i];
  if(!r) return;
  customerDetailTab=normalizeCustomerDetailTab(tab);
  focusedCustomerIdx=r._idx;
  openDrawer("customers",r._idx,{keepDetailTab:true});
}
function wrapListPanel(title,toolbar,tableHtml,footNote,scope){ return tableHtml; }
const PURCHASE_STAGES = ["需求收集","供应商筛选","样品评估","商务谈判","准备下单"];
function parseLeadEmailDomain(lead){
  const raw = lead.contact || "";
  const email = raw.includes("@") ? raw : (raw.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] || "");
  if(!email) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  const free = ["gmail.com","yahoo.com","hotmail.com","outlook.com","163.com","qq.com","126.com","icloud.com","live.com"];
  if(!domain || free.includes(domain)) return null;
  return domain;
}
const CBG_PIPELINE = ["询盘内容分析","客户身份识别","公司信息匹配","公司背景摘要生成"];
const CBG_VERIFIED_SOURCE_HINTS = ["域名","工商","LinkedIn","WHOIS","官网","Companies House","企业注册","CRM","企业邮箱","公开信息","注册库"];
function isPersonalEmailAddress(addr){
  if(!addr||!addr.includes("@")) return false;
  const domain = addr.split("@")[1]?.toLowerCase();
  const free = ["gmail.com","yahoo.com","hotmail.com","outlook.com","163.com","qq.com","126.com","icloud.com","live.com"];
  return free.includes(domain);
}
function isVerifiedLeadIntel(intel){
  if(!intel?.identifySources?.length) return false;
  return intel.identifySources.some(s=>CBG_VERIFIED_SOURCE_HINTS.some(h=>s.includes(h)));
}
function mapLeadIntelToCompanyBackground(intel, lead, inquiryIntent){
  const intro = intel.aiSummary || "";
  const mainBiz = (intel.natures||[]).length ? (intel.natures||[]).join(" · ") : (intel.intentSummary||"—");
  const scale = [intel.employees, intel.revenue].filter(v=>v&&v!=="—"&&v!=="未知"&&v!=="待 AI 补充").join(" · ") || intel.scaleLabel || "";
  const market = (intel.mainMarkets||[]).join(" · ") || intel.country || "";
  const cred = intel.valueScore||70;
  return {
    status:"verified",
    companyName:intel.identifiedCompany,
    intro,
    industry:intel.industry||"—",
    mainBusiness:mainBiz,
    scaleInfo:scale||"—",
    marketInfo:market||"—",
    inquiryRelevance:inquiryIntent?`当前询盘「${inquiryIntent}」与 ${intel.industry||"企业"} 业务方向${(intel.scoreDims?.match||0)>=75?"高度":"较为"}一致。`:"—",
    credibilityScore:cred,
    credibilityLevel:cred>=85?"高":cred>=65?"中":"低",
    matchSources:intel.identifySources||intel.dataSources||[],
    analyzedAt:intel.analyzedAt||"—"
  };
}
function resolveCompanyBackground(ctx){
  if(!canUseAiFeature()) return {status:"disabled"};
  ctx = ctx?.email||ctx?.chat||ctx?.leadRow ? ctx : buildInsightCtx(ctx||{});
  const email = ctx.email;
  const chat = ctx.chat;
  const leadRow = ctx.leadRow || (ctx.lead?datasets.leads.find(l=>l.id===ctx.lead):null);
  const inquiryIntent = leadRow?.intent || email?.aiIntent || chat?.preview || email?.summary || "";
  const keys = [leadRow?.id, ctx.emailId, email?.id, chat?.id, ctx.lead].filter(Boolean);
  for(const k of keys){
    const stored = datasets.companyBackground?.[k];
    if(stored) return {...stored, _key:k, pipeline:CBG_PIPELINE};
  }
  const fromAddr = email?.from || ctx.from || leadRow?.contact || chat?.phone || "";
  if(isPersonalEmailAddress(fromAddr)) return {status:"personal", emptyReason:"来件使用个人邮箱，未识别可靠企业主体。", pipeline:CBG_PIPELINE, _key:fromAddr};
  if(leadRow){
    const liStored = datasets.leadIntelligence?.[leadRow.id];
    if(liStored && isVerifiedLeadIntel(liStored)) return {...mapLeadIntelToCompanyBackground(liStored, leadRow, inquiryIntent), _key:leadRow.id, pipeline:CBG_PIPELINE};
    if(isAbnormalLead(leadRow)||leadRow.status==="已失效") return {status:"not_found", emptyReason:"异常或无效线索，AI 未找到可靠企业主体信息。", pipeline:CBG_PIPELINE};
    const domain = parseLeadEmailDomain(leadRow);
    if(!domain && !(leadRow.contact||"").includes("@")) return {status:"unverified", emptyReason:"仅有联系方式片段，未能匹配可验证的企业注册或官网信息。", pipeline:CBG_PIPELINE};
    if(!domain) return {status:"personal", emptyReason:"未使用企业邮箱，且未能从公开信息匹配公司主体。", pipeline:CBG_PIPELINE};
    return {status:"unverified", emptyReason:"企业邮箱域名存在，但未匹配到工商注册、官网等可靠公开信息，暂不生成公司摘要。", pipeline:CBG_PIPELINE};
  }
  if(email||chat){
    const siKey = email?.id || chat?.id;
    const siStored = siKey ? datasets.senderIntelligence?.[siKey] : null;
    if(siStored?.identifiedCompany && (siStored.identifySources||[]).some(s=>CBG_VERIFIED_SOURCE_HINTS.some(h=>s.includes(h)))){
      return {
        status:"verified",
        companyName:siStored.identifiedCompany,
        intro:siStored.emailSummary||"—",
        industry:siStored.industry||"—",
        mainBusiness:(siStored.mainProducts||[]).join(" · ")||"—",
        scaleInfo:[siStored.employees, siStored.revenue].filter(Boolean).join(" · ")||"—",
        marketInfo:siStored.country||"—",
        inquiryRelevance:siStored.purchaseIntent?`当前来件关注「${siStored.purchaseIntent}」，与识别到的企业方向一致。`:"—",
        credibilityScore:siStored.credibilityScore||70,
        credibilityLevel:siStored.credibilityLevel||"中",
        matchSources:siStored.identifySources||[],
        analyzedAt:siStored.analyzedAt||"—",
        pipeline:CBG_PIPELINE, _key:siKey
      };
    }
    if(isPersonalEmailAddress(fromAddr)) return {status:"personal", emptyReason:"来件使用个人邮箱，未识别可靠企业主体。", pipeline:CBG_PIPELINE};
    return {status:"unverified", emptyReason:"未能从来件信息匹配到可靠企业公开资料。", pipeline:CBG_PIPELINE};
  }
  return {status:"not_found", emptyReason:"暂无可分析的询盘主体信息。", pipeline:CBG_PIPELINE};
}
function companyBackgroundPipelineHtml(cbg, lastStep){
  const steps = cbg.pipeline || CBG_PIPELINE;
  const failIdx = lastStep!=null ? steps.indexOf(lastStep) : -1;
  return `<div class="cbg-pipeline">${steps.map((s,i)=>{
    const cls = cbg.status==="verified" ? "done" : (failIdx>=0 && i===failIdx ? "fail" : (failIdx>=0 && i<failIdx ? "done" : ""));
    return `${i?`<span class="cbg-arrow">→</span>`:""}<span class="${cls}">${s}</span>`;
  }).join("")}</div>`;
}
function companyBackgroundHtmlInner(ctx, opts={}){
  const cbg = resolveCompanyBackground(ctx);
  if(cbg.status==="disabled") return "";
  const variant = opts.variant || "panel";
  const cardCls = variant==="inline" ? "cbg-card inline" : "cbg-card";
  const failStep = cbg.status==="verified" ? null : (cbg.status==="personal" ? "客户身份识别" : "公司信息匹配");
  const pipeline = companyBackgroundPipelineHtml(cbg, failStep);
  if(cbg.status!=="verified"){
    const reason = cbg.emptyReason || ({personal:"询盘来自个人，未识别企业主体。",not_found:"未找到对应公司信息。",unverified:"暂无可靠公开信息。"}[cbg.status] || "暂无公司背景信息。");
    return `<div class="${cardCls}"><div class="cbg-head">客户公司背景<span class="cbg-cred low">未匹配</span></div>${pipeline}<div class="cbg-empty" style="margin:0;border:0;background:transparent;padding:8px 0 0"><div class="cbg-empty-icon">🏢</div><strong>暂无可靠公司背景</strong><p>${reason}</p></div><div class="cbg-foot">仅展示可验证的公开企业信息 · 未确认内容不生成 · 不等同于 CRM 客户档案</div></div>`;
  }
  return `<div class="${cardCls}">
    <div class="cbg-head">客户公司背景</div>
    ${pipeline}
    <div class="cbg-name">${cbg.companyName||"—"}</div>
    <p class="cbg-intro">${cbg.intro||"—"}</p>
    <div class="cbg-grid">
      <div class="cbg-field"><label>所属行业</label><strong>${cbg.industry||"—"}</strong></div>
      <div class="cbg-field"><label>主营方向</label><strong>${cbg.mainBusiness||"—"}</strong></div>
      <div class="cbg-field"><label>企业规模</label><strong>${cbg.scaleInfo||"—"}</strong></div>
      <div class="cbg-field"><label>市场覆盖</label><strong>${cbg.marketInfo||"—"}</strong></div>
    </div>
    ${cbg.inquiryRelevance?`<div class="cbg-relevance"><strong>与当前询盘关联</strong>${cbg.inquiryRelevance}</div>`:""}
    ${(cbg.matchSources||[]).length?`<div class="cbg-sources">匹配依据<div class="ci-tags">${cbg.matchSources.map(s=>`<span class="ci-tag">${s}</span>`).join("")}</div></div>`:""}
    <div class="cbg-foot">辅助销售判断 · 来源可追溯 · 未确认信息不展示 · 转客户后请维护 CRM 正式档案</div>
  </div>`;
}
function companyBackgroundHtml(ctx, opts={}){
  return renderAiGateContent(()=>companyBackgroundHtmlInner(ctx, opts), {title:"客户公司背景", features:"身份识别、公开信息匹配、背景摘要"});
}
function companyBackgroundDrawerHtml(ctx){
  return renderAiGateContent(()=>{
    const inner = companyBackgroundHtmlInner(ctx, {variant:"inline"});
    return inner || aiDisabledPlaceholder("客户公司背景","身份识别、公开信息匹配、背景摘要", true);
  }, {title:"客户公司背景", features:"身份识别、公开信息匹配、背景摘要"});
}
function companyNameFromDomain(domain){
  const slug = domain.replace(/^www\./,"").replace(/\.(com|de|co\.uk|it|es|se|net|org|cn|fr)$/i,"").split(".").pop()||domain;
  return slug.split(/[-_]/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
}
function generateLeadIntelFromLead(lead){
  const scoreMap = {"A类":85,"B类":70,"C类":55,"D类":35};
  const probMap = {"A类":72,"B类":58,"C类":42,"D类":15};
  const vs = scoreMap[lead.score]||50;
  const domain = parseLeadEmailDomain(lead);
  const identified = domain ? `${companyNameFromDomain(domain)} ${lead.country==="德国"?"GmbH":lead.country==="英国"?"Ltd.":lead.country==="意大利"?"S.p.A":lead.country==="西班牙"?"S.L.":lead.country==="瑞典"?"AB":"Co."}` : lead.name;
  const website = domain ? `www.${domain}` : "—";
  const identifySources = [lead.source+" 来源", lead.capture||"系统自动"];
  if(domain){ identifySources.unshift(`企业邮箱域名 ${domain}`); identifySources.push("域名 WHOIS / 官网检索"); }
  if(lead.intent) identifySources.push("询盘内容 NLP");
  const orderSize = lead.score==="A类"?"大单":lead.score==="B类"?"中单":lead.score==="C类"?"小单":"待确认";
  const risks = isAbnormalLead(lead)?["线索已标记异常"]:lead.status==="已失效"?["线索已标记失效"]:domain?[]:["企业邮箱未识别，建议首响核实主体"];
  if(lead.score==="D类") risks.push("疑似低质量询盘");
  return {
    identifiedCompany:identified,inquiryName:lead.name,logo:(identified||"?").slice(0,2).toUpperCase(),website,
    identifySources,
    industry:lead.intent||"待确认",country:lead.country||"—",city:"—",founded:"—",employees:"待 AI 补充",revenue:"—",
    scaleLabel:"待识别",purchaseScale:"—",natures:[],certs:[],mainMarkets:[],
    valueScore:vs,valueLabel:(lead.score||"—").replace("类","级客户"),dealProbability:probMap[lead.score]||40,
    scoreDims:{scale:vs-10,match:vs,potential:vs-5,active:domain?55:35,influence:45,history:30},
    purchaseStage:"需求收集",purchaseStages:PURCHASE_STAGES,urgency:lead.score==="A类"?"高":"中",orderSize,
    intentSummary:lead.intent||"—",risks,suggestions:domain?["建议24小时内联系并确认采购需求","建议发送产品目录","建议核实企业规模与采购量级"]:["建议首响确认企业信息与采购需求","建议补充官网或企业邮箱验证"],
    nextAction:domain?`建议24小时内联系 · 发送产品目录（${domain}）`:"建议首响 · 确认企业信息与采购意向",
    worthFollow:lead.score!=="D类"&&!isAbnormalLead(lead),
    aiSummary:`基于询盘来源 ${lead.source}${domain?`、邮箱域名 ${domain}`:""} 与 ${lead.country||"未知地区"} 的 ${lead.intent||"待确认意向"} 自动生成初步洞察。${domain?"AI 已识别企业主体，建议优先跟进。":"建议首响后补充验证企业信息。"}`,
    dataSources:[lead.source,lead.capture||"系统"].concat(domain?["邮箱域名","WHOIS"]:[]),analyzedAt:lead.inquiryTime||"—"
  };
}
function getLeadIntelligence(lead){
  if(!lead||!canUseAiFeature()) return null;
  const stored = datasets.leadIntelligence?.[lead.id];
  if(stored) return {...stored, leadId:lead.id, inquiryName:stored.inquiryName||lead.name};
  return {...generateLeadIntelFromLead(lead), leadId:lead.id};
}
function leadIntelSubtitle(lead){
  const st=getLeadBizStatus(lead);
  const stage=getLeadBizStage(lead);
  return `${leadChannelLabel(lead)} · ${st}${stage!=="—"?" · "+stage:""} · ${getLeadIntentLevel(lead)}`;
}
function leadScorePill(_lead){ return ""; }
function leadIntelligenceHtml(lead){
  return renderAiGateContent(()=>leadIntelligenceHtmlInner(lead),{title:"AI 企业洞察",features:"企业识别、意向判断、跟进建议"});
}
function leadIntelligenceHtmlInner(lead){
  const intel = getLeadIntelligence(lead);
  if(!intel) return "";
  const insightCtx = buildInsightCtx({leadRow:lead, channel:"inquiry"});
  const stages = intel.purchaseStages || PURCHASE_STAGES;
  const stageIdx = Math.max(0, stages.indexOf(intel.purchaseStage));
  const concerns = (intel.risks||[]).length ? (intel.risks||[]).join("；") : (intel.intentSummary || "—");
  return `${companyBackgroundHtml(insightCtx,{variant:"inline"})}
  <div class="c360 li-intel">
    <div class="c360-card" style="margin-top:14px">
      <div class="c360-card-title">采购画像</div>
      <div class="li-meta-row">
        <span class="li-meta-pill ${intel.urgency==="高"?"hot":""}">紧急度 · ${intel.urgency}</span>
        <span class="li-meta-pill">规模 · ${intel.orderSize}</span>
        <span class="li-meta-pill">阶段 · ${intel.purchaseStage}</span>
      </div>
      ${renderLifecycle(stages, stageIdx)}
      <p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.65">${intel.intentSummary||"—"}</p>
    </div>
    <div class="c360-card">
      <div class="c360-card-title">客户关注点</div>
      <div style="font-size:13px;line-height:1.65;color:var(--muted)">${concerns}</div>
    </div>
    <div class="c360-card">
      <div class="c360-card-title">跟进建议</div>
      <div class="c360-action" style="margin-bottom:10px"><div class="c360-action-text"><strong>下一步行动</strong>${intel.nextAction||"—"}</div></div>
      <div class="li-suggest-list">${(intel.suggestions||[]).map(s=>`<div class="li-suggest-item">${s}</div>`).join("")}</div>
    </div>
    ${intel.syncedCustomerId?`<div class="li-inherit-note">🔗 该线索已转客户 <strong>${intel.syncedCustomerId}</strong>，企业画像与跟进建议已同步至客户档案。</div>`:""}
  </div>`;
}
const COMM_PURCHASE_STAGES = ["需求收集","供应商筛选","样品测试","报价比较","商务谈判","准备下单"];
function commStatusClass(status){
  const map = {"积极":"positive","正常":"normal","冷淡":"cold","失联":"lost","风险":"risk"};
  return map[status]||"normal";
}
function generateCommIntelFromContext(ctx){
  const customer = ctx?.customer || "未知客户";
  const emails = datasets.emails.filter(e=>e.customer===customer);
  const chats = datasets.chats.filter(c=>c.customer===customer);
  const follows = datasets.follow.filter(f=>f.customer===customer);
  const topics = [];
  follows.forEach(f=>(f.keywords||"").split(/[/、,，\s]+/).forEach(k=>{ if(k&&k.length>1&&!topics.includes(k)) topics.push(k); }));
  if(!topics.length) topics.push("价格","MOQ");
  const emailCnt = emails.length;
  const waCnt = chats.length;
  const active = emailCnt+waCnt>=8;
  const commStatus = active?"正常":"冷淡";
  const stage = chats[0]?.stage?.includes("报价")?"报价比较":chats[0]?.stage?.includes("样品")?"样品测试":"供应商筛选";
  return {
    customer,lead:ctx?.lead||emails[0]?.lead||chats[0]?.lead||"-",
    commStatus,commStatusLabel:commStatus==="正常"?"正常跟进中":"沟通偏少 · 需关注",
    topics:topics.slice(0,6),purchaseStage:stage,purchaseStages:COMM_PURCHASE_STAGES,
    attentionLevel:active?"中":"低",attentionReason:`邮件 ${emailCnt} 次 · WhatsApp ${waCnt} 次 · 跟进 ${follows.length} 条`,
    activity:{period:"近7天",email:Math.max(emailCnt,2),whatsapp:Math.max(waCnt,1),meeting:0,trend:[2,3,3,4,4,5,Math.max(emailCnt+waCnt,3)]},
    sentiment:"中性",dealSignals:emailCnt?["索要报价"]:[],
    dealScore:Math.min(40+emailCnt*8+waCnt*10,88),riskSignals:[],riskLevel:"低",
    nextActions:["建议跟进最新沟通","建议确认客户当前需求","建议同步报价或样品进展"],
    aiSummary:`基于 ${emailCnt} 封邮件、${waCnt} 条 WhatsApp 会话与 ${follows.length} 条跟进记录自动生成。客户近期关注 ${topics.slice(0,3).join("、")}。`,
    analyzedAt:new Date().toISOString().slice(0,16).replace("T"," "),dataSources:["邮件","WhatsApp","跟进记录"]
  };
}
function getCommIntelligence(ctx){
  const key = ctx?.customer;
  if(!key) return generateCommIntelFromContext(ctx||{});
  const stored = datasets.commIntelligence?.[key];
  if(stored) return {...stored,customer:key};
  return generateCommIntelFromContext(ctx);
}
function commActivityTrendHtml(trend){
  const max = Math.max(...(trend||[1]),1);
  return `<div class="ci-trend">${(trend||[]).map(v=>`<div class="ci-trend-bar" style="height:${Math.round(v/max*100)}%" title="${v}次"></div>`).join("")}</div>`;
}
function openCustomerFromCommIntel(customerName){
  const idx = datasets.customers.findIndex(c=>c.name===customerName);
  if(idx<0){ toast("客户未找到"); return; }
  focusedCustomerIdx = idx;
  customerDetailTab = "360";
  nav("customer-profile");
  setTimeout(()=>openDrawer("customers",idx,{keepDetailTab:true}),120);
}
function communicationIntelligenceHtml(ctx){
  const ci = getCommIntelligence(ctx);
  if(!ci) return "";
  return `<aside class="context-panel comm-intel-panel">
    <div class="context-head">◈ AI 沟通画像</div>
    <div class="context-body ci-body">
      ${buildCommInsightBody(ctx,ci)}
      <div class="ci-foot">
        <button type="button" class="btn small" onclick="openCustomerFromCommIntel('${(ci.customer||"").replace(/'/g,"\\'")}')">查看客户企业画像 →</button>
      </div>
    </div>
  </aside>`;
}
let lastSenderCtx = null;
function isCrmEstablished(ctx){
  if(!ctx) return false;
  const convertMode = ctx.convertMode || ctx.email?.convertMode || ctx.chat?.convertMode || "";
  if(convertMode==="待确认转线索"||convertMode==="未入库") return false;
  const leadId = ctx.lead || ctx.email?.lead || ctx.chat?.lead;
  if(!leadId||leadId==="-") return false;
  const leadRow = datasets.leads.find(l=>l.id===leadId);
  if(!leadRow) return false;
  if(leadRow.assignStatus==="未分配"&&isPublicPoolLead(leadRow)) return false;
  const customer = ctx.customer || ctx.email?.customer || ctx.chat?.customer;
  const cust = datasets.customers.find(c=>c.name===customer);
  if(!cust) return false;
  if(leadRow.assignStatus==="已分配"&&(convertMode.includes("已关联")||convertMode.includes("已转")||convertMode.includes("已发送"))) return true;
  return leadRow.status==="已成交"||leadRow.stage==="已成交";
}
function getSenderIntelligence(ctx){
  const email = ctx?.email;
  const chat = ctx?.chat;
  const leadRow = ctx?.leadRow || (ctx?.lead?datasets.leads.find(l=>l.id===ctx.lead):null);
  const keys = [ctx?.emailId, email?.id, chat?.id, leadRow?.id, email?.from, ctx?.from, leadRow?.id].filter(Boolean);
  for(const k of keys){
    const stored = datasets.senderIntelligence?.[k];
    if(stored) return {...stored, _key:k};
  }
  const domain = (email?.from||ctx?.from||"").split("@")[1];
  if(domain){
    const byDomain = Object.values(datasets.senderIntelligence||{}).find(s=>(s.senderEmail||"").includes(domain));
    if(byDomain) return {...byDomain,_key:domain};
  }
  if(leadRow && datasets.leadIntelligence?.[leadRow.id]){
    const li = datasets.leadIntelligence[leadRow.id];
    return {
      senderEmail:leadRow.contact, inquiryName:leadRow.name, identifiedCompany:li.identifiedCompany, logo:li.logo, website:li.website,
      country:li.country, city:li.city||"—", industry:li.industry, mainProducts:[leadRow.intent].filter(Boolean),
      founded:li.founded||"—", employees:li.employees, revenue:li.revenue, companyTypes:li.natures||[],
      identifySources:li.identifySources||["询盘信息"], credibilityScore:Math.min(li.valueScore||70,99),
      credibilityLevel:li.valueScore>=85?"高":li.valueScore>=65?"中":"低", opportunityLevel:li.valueLabel?.includes("A")?"A级机会":li.valueLabel?.includes("B")?"B级机会":"C级机会",
      opportunityReasons:li.suggestions?.slice(0,3)||["与产品线匹配"], valueJudgment:li.worthFollow?"高价值询盘":"低价值询盘",
      worthFollow:li.worthFollow, valueLabel:li.worthFollow?"建议优先跟进":"建议自动回复",
      purchaseIntent:li.intentSummary||leadRow.intent, purchaseStage:li.purchaseStage||"需求收集", topics:(leadRow.tags||"").split(/[/、\s]+/).filter(Boolean).slice(0,5),
      dealSignals:li.worthFollow?["高意向询盘"]:[] , riskSignals:li.risks||[], emailSummary:li.aiSummary||email?.summary||chat?.preview||"—",
      actionSuggestions:li.suggestions||["建议跟进"], analyzedAt:li.analyzedAt||"—", crmStatus:isPublicPoolLead(leadRow)?"pool":"pending", lead:leadRow.id
    };
  }
  const name = ctx?.customer || email?.customer || chat?.customer || "未知来件人";
  const from = email?.from || ctx?.from || chat?.phone || "—";
  return {
    senderEmail:from, inquiryName:name, identifiedCompany:name, logo:(name||"?").slice(0,2).toUpperCase(), website:"—",
    country:"待识别", city:"—", industry:"待 AI 识别", mainProducts:[email?.aiIntent||"待确认"].filter(x=>x&&x!=="待确认"),
    founded:"—", employees:"未知", revenue:"—", companyTypes:[],
    identifySources:["邮件正文","发件人信息"], credibilityScore:55, credibilityLevel:"中", opportunityLevel:"C级机会",
    opportunityReasons:["首次来信，企业信息待验证"], valueJudgment:"待评估询盘", worthFollow:true, valueLabel:"建议人工确认",
    purchaseIntent:email?.aiIntent||chat?.preview||"—", purchaseStage:"需求收集", topics:["价格","MOQ"],
    dealSignals:[], riskSignals:["企业信息待验证"], emailSummary:email?.aiBrief||email?.summary||chat?.preview||"系统自动分析中，建议人工确认来件人身份。",
    actionSuggestions:["建议24小时内回复","建议核实企业信息","建议确认是否转线索"], analyzedAt:new Date().toISOString().slice(0,16).replace("T"," "),
    crmStatus:"none", lead:email?.lead||chat?.lead||"-"
  };
}
function senderCrmActionsHtml(canWrite){
  if(!canWrite||currentRole==="协同人") return `<div class="si-flow-note">协同人只读，无法执行转线索等操作。</div>`;
  if(!canWrite) return "";
  return `<div class="ci-section">
    <div class="ci-label">AI 推荐动作</div>
    <div class="si-actions-grid">
      <button type="button" class="btn small primary" onclick="senderAction('toLead')">转线索</button>
      <button type="button" class="btn small" onclick="senderAction('toCustomer')">创建客户</button>
      <button type="button" class="btn small" onclick="senderAction('toPool')">加入公海池</button>
      <button type="button" class="btn small" onclick="senderAction('assign')">分配业务员</button>
      <button type="button" class="btn small danger" onclick="senderAction('spam')">标记垃圾询盘</button>
      <button type="button" class="btn small" onclick="senderAction('ignore')">忽略</button>
      <button type="button" class="btn small span-2" onclick="senderAction('watch')">加入观察名单</button>
    </div>
    <div class="si-flow-note">流程：来件 → 询盘内容分析 → 来件人洞察 → 客户公司背景 → 业务员判断 → 转线索 → 转客户 → 合同成交。无法验证企业信息时，公司背景保持为空。</div>
  </div>`;
}
function senderAction(action){
  const map = {toLead:"已确认转线索，进入公海池/跟进流程",toCustomer:"已创建客户草稿，请补充信息后保存",toPool:"已加入公海池，待分配",assign:"已打开分配流程",spam:"请确认异常原因后提交标记",ignore:"已忽略，移出待处理队列",watch:"已加入观察名单，系统将跟踪后续来信"};
  if(action==="spam"){
    const drawerIdx=window._drawerLeadIdx;
    if(drawerIdx!=null){ openMarkLeadAbnormalModal(drawerIdx); return; }
    toast(map.spam);
    return;
  }
  toast(map[action]||action);
  if(action==="toLead") openModal("lead");
  else if(action==="toCustomer") openModal("customer");
  else if(action==="toPool") nav("lead-all");
  else if(action==="assign") openModal("assign");
  else renderPage();
}
const COMM_DIALOG_STAGES = ["首次接触","需求确认","报价沟通","谈判阶段"];
function mapPurchaseStageToDialogStage(purchaseStage){
  const map={"需求收集":"首次接触","供应商筛选":"需求确认","样品测试":"需求确认","报价比较":"报价沟通","商务谈判":"谈判阶段","准备下单":"谈判阶段"};
  return map[purchaseStage]||"首次接触";
}
function mapChatStageToDialogStage(chatStage){
  const s=chatStage||"";
  if(/待认领|待首响|首次/.test(s)) return "首次接触";
  if(/深度|需求|筛选|样品/.test(s)) return "需求确认";
  if(/报价|打样/.test(s)) return "报价沟通";
  if(/谈判|成交|下单/.test(s)) return "谈判阶段";
  return "首次接触";
}
function mapSenderIntentLevel(si){
  if(!si) return "中意向";
  const opp=si.opportunityLevel||"";
  if(si.credibilityLevel==="高"||opp.includes("A")||si.worthFollow&&opp.includes("A")) return "高意向";
  if(si.credibilityLevel==="中"||opp.includes("B")) return "中意向";
  return "低意向";
}
function mapAttentionToIntentLevel(level){
  return {"高":"高意向","中":"中意向","低":"低意向"}[level]||"中意向";
}
function insightKvRow(label,val){
  return `<div class="ci-kv-row"><span class="ci-kv-label">${label}</span><strong class="ci-kv-val">${val||"—"}</strong></div>`;
}
function insightEnterpriseIntro(ctx,si,profile){
  if(profile?.companyIntro) return profile.companyIntro;
  const cbg=resolveCompanyBackground(ctx);
  if(cbg.status==="verified"&&cbg.intro) return cbg.intro;
  const name=si?.identifiedCompany||si?.inquiryName||profile?.shortName||"—";
  const products=(si?.mainProducts||profile?.productLines||[]).filter(Boolean).slice(0,3).join("、");
  const industry=si?.industry||profile?.industry||"";
  if(products&&industry&&industry!=="待 AI 识别") return `${name}位于${si?.country||profile?.city||"—"}，主营${products}，所属${industry}。`;
  const summary=si?.emailSummary||profile?.aiSummary||"";
  return summary?summary.split("。")[0]+"。" :"—";
}
function insightEnterpriseSectionHtml(ctx,si,profile){
  const name=si?.identifiedCompany||si?.inquiryName||profile?.shortName||ctx?.customer||"—";
  const region=[si?.country||profile?.city,si?.city&&si.city!=="—"?si.city:null].filter(Boolean).join(" · ")||profile?.targetMarket?.split("·")[0]?.trim()||"—";
  const industry=si?.industry||profile?.industry||profile?.subIndustry||"—";
  const intro=insightEnterpriseIntro(ctx,si,profile);
  return `<div class="ci-section">
    <div class="ci-label">企业背景</div>
    ${insightKvRow("企业名称",name)}
    ${insightKvRow("国家/地区",region)}
    ${insightKvRow("所属行业",industry)}
    <p class="ci-intro-text">${intro}</p>
  </div>`;
}
function insightPurchaseSectionHtml(opts){
  const products=(opts.products||[]).filter(Boolean);
  const topics=(opts.topics||[]).filter(Boolean);
  return `<div class="ci-section">
    <div class="ci-label">采购画像</div>
    ${insightKvRow("关注产品",products.length?products.join(" · "):"—")}
    ${insightKvRow("当前需求方向",opts.direction||"—")}
    ${insightKvRow("采购意图",opts.intent||"—")}
    <div class="ci-sub-label">客户关注</div>
    <div class="ci-tags">${topics.length?topics.map(t=>`<span class="ci-tag">${t}</span>`).join(""):`<span style="font-size:12px;color:var(--soft)">—</span>`}</div>
  </div>`;
}
function insightValueSectionHtml(intentLevel,dialogStage){
  const intentCls=intentLevel==="高意向"?"high":intentLevel==="低意向"?"low":"mid";
  return `<div class="ci-section">
    <div class="ci-label">客户价值判断</div>
    <div class="ci-value-grid">
      <div class="ci-value-cell"><span>意向等级</span><strong class="ci-intent-pill ${intentCls}">${intentLevel}</strong></div>
      <div class="ci-value-cell"><span>当前沟通阶段</span><strong class="ci-stage-badge">${dialogStage}</strong></div>
    </div>
  </div>`;
}
function insightAiSuggestSectionHtml(followAction,replyDirection,nextSteps){
  const steps=(nextSteps||[]).filter(Boolean);
  return `<div class="ci-section">
    <div class="ci-label">AI 建议</div>
    ${insightKvRow("推荐跟进动作",followAction)}
    ${insightKvRow("推荐回复方向",replyDirection)}
    <div class="ci-sub-label">推荐下一步推进动作</div>
    <div class="ci-actions">${steps.length?steps.map(a=>`<div class="ci-action-item">${a}</div>`).join(""):`<div class="ci-action-item">—</div>`}</div>
  </div>`;
}
function getCustomerProfileByCtx(ctx){
  const name=ctx?.customer||ctx?.email?.customer||ctx?.chat?.customer;
  if(!name) return null;
  const cust=datasets.customers.find(c=>c.name===name);
  return cust?datasets.customerProfiles?.[cust.id]:null;
}
function buildSenderInsightBody(ctx,si){
  const chat=ctx?.chat;
  const profile=getCustomerProfileByCtx(ctx);
  const products=si.mainProducts||profile?.purchaseProfile?.focusedProducts?.split(/[、,，/]/).filter(Boolean)||profile?.productLines||[];
  const direction=profile?.purchaseProfile?.productDirection||si.purchaseIntent||chat?.preview||"—";
  const intent=si.purchaseIntent||profile?.purchaseProfile?.purchaseNeeds||"—";
  const topics=si.topics||profile?.purchaseProfile?.concerns?.split(/[、,，/]/).filter(Boolean)||[];
  const dialogStage=chat?.stage?mapChatStageToDialogStage(chat.stage):mapPurchaseStageToDialogStage(si.purchaseStage);
  const actions=si.actionSuggestions||[];
  const replyDirection=si.emailSummary||chat?.preview||ctx?.email?.aiBrief||"—";
  const nextSteps=actions.length>1?actions.slice(1):(actions.length?[]:["—"]);
  return `${insightEnterpriseSectionHtml(ctx,si,profile)}
  ${insightPurchaseSectionHtml({products,direction:typeof direction==="string"?direction.slice(0,80):direction,intent,topics})}
  ${insightValueSectionHtml(mapSenderIntentLevel(si),dialogStage)}
  ${insightAiSuggestSectionHtml(actions[0]||"—",replyDirection,nextSteps)}`;
}
function buildCommInsightBody(ctx,ci){
  const profile=getCustomerProfileByCtx(ctx);
  const chat=ctx?.chat;
  const products=profile?.purchaseProfile?.focusedProducts?.split(/[、,，/]/).filter(Boolean)||profile?.productLines||ci.topics||[];
  const direction=profile?.purchaseProfile?.productDirection||ci.aiSummary?.slice(0,60)||chat?.preview||"—";
  const intent=profile?.purchaseProfile?.purchaseNeeds||ci.aiSummary?.split("。")[0]||chat?.preview||"—";
  const topics=ci.topics||profile?.purchaseProfile?.concerns?.split(/[、,，/]/).filter(Boolean)||[];
  const dialogStage=chat?.stage?mapChatStageToDialogStage(chat.stage):mapPurchaseStageToDialogStage(ci.purchaseStage);
  const actions=ci.nextActions||[];
  const replyDirection=ci.aiSummary||chat?.preview||"—";
  const nextSteps=actions.length>1?actions.slice(1):(actions.length?[]:["—"]);
  const siStub={identifiedCompany:ctx?.customer,country:profile?.city,industry:profile?.industry,mainProducts:products,emailSummary:ci.aiSummary};
  return `${insightEnterpriseSectionHtml(ctx,siStub,profile)}
  ${insightPurchaseSectionHtml({products,direction,intent,topics})}
  ${insightValueSectionHtml(mapAttentionToIntentLevel(ci.attentionLevel),dialogStage)}
  ${insightAiSuggestSectionHtml(actions[0]||"—",replyDirection,nextSteps)}`;
}
function senderIntelligenceHtml(ctx){
  lastSenderCtx = ctx;
  const si = getSenderIntelligence(ctx);
  if(!si) return "";
  const canWrite = currentRole!=="访客"&&currentRole!=="协同人";
  return `<aside class="context-panel comm-intel-panel sender-intel-panel">
    <div class="context-head">◈ AI 来件人洞察</div>
    <div class="context-body ci-body">
      ${buildSenderInsightBody(ctx,si)}
      ${senderCrmActionsHtml(canWrite)}
      <div class="ci-foot">来件人洞察面向尚未进入 CRM 的陌生询盘。转线索或创建客户后，画像将继承至线索/客户档案。</div>
    </div>
  </aside>`;
}
function buildInsightCtx(opts={}){
  const email = opts.email || (opts.emailIdx!=null?datasets.emails[opts.emailIdx]:null);
  const chat = opts.chat || (opts.chatIdx!=null?datasets.chats[opts.chatIdx]:null);
  const leadRow = opts.leadRow || (opts.lead?datasets.leads.find(l=>l.id===opts.lead):null);
  return {
    customer:opts.customer||email?.customer||chat?.customer||leadRow?.name,
    lead:opts.lead||email?.lead||chat?.lead||leadRow?.id,
    convertMode:opts.convertMode||email?.convertMode||chat?.convertMode,
    email, chat, leadRow,
    emailId:email?.id, from:email?.from||opts.from, channel:opts.channel||"email"
  };
}
function renderInsightPanel(ctx){
  const fullCtx = ctx?.email||ctx?.chat?ctx:buildInsightCtx(ctx||{});
  const established = isCrmEstablished(fullCtx);
  const title = established ? "AI 沟通画像" : "AI 来件人洞察";
  if(getAiStatus()==="quota") return aiInsightPanelShell(title, aiQuotaPlaceholder());
  if(getAiStatus()==="error") return aiInsightPanelShell(title, aiErrorPlaceholder());
  if(established) return communicationIntelligenceHtml(fullCtx);
  return senderIntelligenceHtml(fullCtx);
}
function cp360Dim(label,val){ return `<div class="cp360-dim"><span>${label}</span><div class="cp360-dim-bar"><span style="width:${val}%"></span></div><strong>${val}</strong></div>`; }
const PAGE_SHELL_KEEP_HEADER = new Set(["workbench","param-config"]);
function pageShellKeepHeader(pageId){ return PAGE_SHELL_KEEP_HEADER.has(pageId); }
function renderListPageToolbar(actions){
  if(!actions||!String(actions).trim()) return "";
  return `<div class="list-page-toolbar">${actions}</div>`;
}
function mergeListActions(...parts){ return parts.filter(p=>p&&String(p).trim()).join(""); }
/** 顶部操作与批量栏去重：顶部已有同类入口时，批量栏不再重复展示 */
const TOP_ACTION_DEDUP_RULES = [
  {cat:"export",top:/导出|export/i,batch:/导出|export/i},
  {cat:"transfer",top:/转移|分配|转客户|调整负责人|批量调整/i,batch:/转移|分配|转客户|重新关联|重新分配|换运营|换协同|换业务员|调整负责人/i},
  {cat:"delete",top:/删除|关闭|标记无效/i,batch:/删除|关闭|标记无效|下线/i},
  {cat:"batchProcess",top:/批量处理|批量标记处理/i,batch:/批量处理|批量标记处理/i}
];
function extractButtonLabelsFromHtml(html){
  const labels=[];
  const re=/<button[^>]*>([^<]+)</gi;
  let m;
  while((m=re.exec(html||""))) labels.push(m[1].replace(/\s+/g,"").trim());
  return labels;
}
function getTopToolbarCategories(topHtml){
  const cats=new Set();
  extractButtonLabelsFromHtml(topHtml).forEach(label=>{
    TOP_ACTION_DEDUP_RULES.forEach(rule=>{ if(rule.top.test(label)) cats.add(rule.cat); });
  });
  return cats;
}
function shouldHideBatchButton(label,topCats){
  if(!label||!topCats.size) return false;
  return [...topCats].some(cat=>{
    const rule=TOP_ACTION_DEDUP_RULES.find(r=>r.cat===cat);
    return rule&&rule.batch.test(label);
  });
}
function filterBatchActionButtons(actionsHtml,topCats){
  if(!actionsHtml||!topCats.size) return actionsHtml||"";
  return (actionsHtml||"").replace(/<button[^>]*>[\s\S]*?<\/button>/gi,btn=>{
    const label=(btn.match(/>([^<]+)</)||[])[1]?.replace(/\s+/g,"").trim()||"";
    if(label.includes("取消选择")) return btn;
    return shouldHideBatchButton(label,topCats)?"":btn;
  });
}
function getCurrentListTopActions(){
  const meta=pageMeta[currentPage];
  if(!meta) return "";
  if(meta.custom) return customActions(meta.custom)||"";
  return mergeListActions(headActions(meta),toolbar(meta));
}
function renderBatchBar(opts){
  const count=opts?.count??0;
  const unit=opts?.unit||"条数据";
  const show=opts?.show!==undefined?opts.show:count>0;
  const topCats=getTopToolbarCategories(getCurrentListTopActions());
  let actionsHtml=opts?.skipDedup?(opts?.actions||""):filterBatchActionButtons(opts?.actions||"",topCats);
  const onCancel=opts?.onCancel||"void";
  if(!actionsHtml.includes("取消选择")) actionsHtml+=`<button type="button" class="btn small ghost" onclick="${onCancel}">取消选择</button>`;
  const idAttr=opts?.id?` id="${opts.id}"`:"";
  const countIdAttr=opts?.countId?` id="${opts.countId}"`:"";
  const actionsBlock=actionsHtml.trim()?`<div class="batch-actions">${actionsHtml}</div>`:"";
  return `<div class="batch-bar${show?" show":""}"${idAttr}><span class="batch-bar-status">已选择 <strong${countIdAttr}>${count}</strong> ${unit}</span>${actionsBlock}</div>`;
}
function filterSectionEnd(body){
  let end = 0;
  const advIdx = body.lastIndexOf('class="filter-advanced');
  if(advIdx>=0){
    const close = body.indexOf("</div></div>", advIdx);
    if(close>=0) end = Math.max(end, close+13);
  }
  const filIdx = body.lastIndexOf('class="filters"');
  if(filIdx>=0){
    const close = body.indexOf("</div></div>", filIdx);
    if(close>=0) end = Math.max(end, close+13);
  }
  return end;
}
function tabsSectionEnd(body){
  let end = 0;
  for(const marker of ['class="msg-cat-tabs"','class="tabs sub-tabs"','class="tabs"']){
    const idx = body.indexOf(marker);
    if(idx<0) continue;
    const openDiv = body.indexOf("<div", idx);
    if(openDiv<0) continue;
    let depth = 0, search = openDiv;
    while(search<body.length){
      const nextOpen = body.indexOf("<div", search+4);
      const nextClose = body.indexOf("</div>", search);
      if(nextClose<0) break;
      if(nextOpen>=0 && nextOpen<nextClose){ depth++; search = nextOpen+4; }
      else {
        if(depth===0){ end = Math.max(end, nextClose+6); break; }
        depth--;
        search = nextClose+6;
      }
    }
  }
  return end;
}
function findListToolbarInsertIndex(body){
  const afterFilters = filterSectionEnd(body);
  const listAnchors = [
    '<div class="batch-bar',
    '<div class="settings-layout">',
    '<div class="mail-inbox-layout"',
    '<div class="comm-layout">',
    '<div class="wa-im-layout">',
    '<section class="panel settings-list"><div class="table-wrap">',
    '<section class="panel" style="flex:1;min-width:0"><div class="table-wrap">',
    '<section class="panel"><div class="table-wrap">',
    '<section class="panel" style="margin-bottom:14px"><div class="panel-head">'
  ];
  let best = -1;
  for(const a of listAnchors){
    const idx = afterFilters>0 ? body.indexOf(a, afterFilters) : body.indexOf(a);
    if(idx>=0 && (best<0 || idx<best)) best = idx;
  }
  if(best>=0) return best;
  if(afterFilters>0) return afterFilters;
  const afterTabs = tabsSectionEnd(body);
  if(afterTabs>0){
    const msgList = body.indexOf('<section class="panel"><div class="panel-body">', afterTabs);
    if(msgList>=0) return msgList;
    const sectIdx = body.indexOf('<section class="panel"', afterTabs);
    if(sectIdx>=0) return sectIdx;
    return afterTabs;
  }
  return 0;
}
function injectListToolbar(body, actions){
  const toolbar = renderListPageToolbar(actions);
  if(!toolbar) return body||"";
  const idx = findListToolbarInsertIndex(body||"");
  return (body||"").slice(0, idx)+toolbar+(body||"").slice(idx);
}
function pageShell(title,desc,actions,body,pageId=currentPage){
  if(pageShellKeepHeader(pageId)){
    return `<div class="breadcrumb">苏豪 B2B CRM / ${title}</div>
  <div class="page-head">
    <div><div class="page-title">${title}</div>${desc?`<div class="page-desc">${desc}</div>`:""}</div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ""}
  </div>${body}`;
  }
  return body;
}
function metric(label,value,note,cls=""){
  return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note ${cls}">${note}</div></div>`;
}
function metricDrill(label,value,note,cls="",page=""){
  const click = page ? `onclick="nav('${page}')" style="cursor:pointer"` : "";
  return `<div class="metric clickable" ${click}><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note ${cls}">${note}</div></div>`;
}
const WB_STATE_KEY = "crm_wb_state";
function saveWbState(){
  try{ sessionStorage.setItem(WB_STATE_KEY, JSON.stringify({wbPeriod, wbCustomRange, wbCompareMode})); }catch(e){}
}
function loadWbState(){
  try{
    const raw = sessionStorage.getItem(WB_STATE_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    if(s.wbPeriod) wbPeriod = s.wbPeriod;
    if(s.wbCustomRange) wbCustomRange = s.wbCustomRange;
    if(s.wbCompareMode) wbCompareMode = s.wbCompareMode;
  }catch(e){}
}
function getWbScopeLabel(){
  if(currentRole==="外贸业务员") return "个人负责范围";
  if(currentRole==="运营专员") return "负责站点汇总";
  if(currentRole==="协同人") return "授权监督范围";
  if(currentRole==="访客") return "只读汇总范围";
  return "全站点汇总";
}
function getWbPeriodMeta(){
  const ranges = {
    "今日":"2026-06-25",
    "本周":"2026-06-23 ~ 2026-06-29",
    "本月":"2026-06-01 ~ 2026-06-30",
    "本季度":"2026-04-01 ~ 2026-06-30",
    "本年":"2026-01-01 ~ 2026-12-31",
    "自定义时间":wbCustomRange
  };
  const calibers = {
    "今日":"线索按创建时间 · 成交按签约时间 · "+getWbScopeLabel(),
    "本周":"线索按创建时间 · 成交按签约时间 · "+getWbScopeLabel(),
    "本月":"线索按创建时间 · 成交按签约时间 · "+getWbScopeLabel(),
    "本季度":"线索按创建时间 · 成交按签约时间 · "+getWbScopeLabel(),
    "本年":"线索按创建时间 · 成交按签约时间 · "+getWbScopeLabel(),
    "自定义时间":"自定义区间 · 线索按创建时间 · 成交按签约时间 · "+getWbScopeLabel()
  };
  return {
    period:wbPeriod,
    rangeLabel:ranges[wbPeriod]||ranges["本月"],
    caliber:calibers[wbPeriod]||calibers["本月"],
    updatedAt:"2026-06-25 09:30"
  };
}
function setWbPeriod(v){
  wbPeriod = v;
  saveWbState();
  renderPage();
}
function setWbCompareMode(v){
  wbCompareMode = v;
  saveWbState();
  renderPage();
}
function refreshWorkbenchData(){
  toast(`已刷新 ${wbPeriod} 统计数据`);
  renderPage();
}
function getWbPeriodScale(){
  return {"今日":0.08,"本周":0.28,"本月":1,"本季度":2.85,"本年":11.2,"自定义时间":1}[wbPeriod]||1;
}
function getWbStats(){
  const scale = getWbPeriodScale();
  const meta = getWbPeriodMeta();
  const roleBase = {
    "管理员":{leads:23,pending:18,amount:186,validRate:77,leadsNote:"表单 14 / 邮件 6 / WA 3",pendingNote:"超期 5 条",amountNote:"签约口径",validNote:"线索→成交"},
    "运营专员":{leads:14,pending:11,amount:142,validRate:74,leadsNote:"负责站点",pendingNote:"含超期 5 条",amountNote:"负责站点成交",validNote:"负责站点转化"},
    "协同人":{leads:23,pending:14,amount:186,validRate:75,leadsNote:"监督范围",pendingNote:"超期 3 / 今日 5",amountNote:"团队成交",validNote:"团队转化"},
    "外贸业务员":{leads:3,pending:5,amount:68,validRate:83,leadsNote:"个人站点",pendingNote:"超期 1 / 今日 3",amountNote:"个人成交",validNote:"个人转化"},
    "访客":{leads:23,pending:18,amount:186,validRate:77,leadsNote:"只读汇总",pendingNote:"只读汇总",amountNote:"只读汇总",validNote:"只读汇总"}
  };
  const base = roleBase[currentRole] || roleBase["管理员"];
  const leads = Math.max(1, Math.round(base.leads * scale));
  const pending = Math.max(0, Math.round(base.pending * (wbPeriod==="今日"?0.45:wbPeriod==="本周"?0.72:1)));
  const amount = Math.round(base.amount * scale);
  const compare = {
    "环比":wbPeriod==="今日"?"+6.2%":wbPeriod==="本周"?"+4.8%":"+12.4%",
    "同比":"+18.6%",
    "无上期对比":"—"
  };
  const funnels = {
    "管理员":[[256,100,"线索进入"],[198,77,"有效线索"],[116,45,"转客户"],[68,27,"报价打样"],[34,13,"合同成交"]],
    "运营专员":[[128,100,"站点线索"],[98,76,"有效线索"],[56,44,"转客户"],[32,25,"报价打样"],[18,14,"合同成交"]],
    "协同人":[[256,100,"团队线索"],[198,77,"有效线索"],[116,45,"转客户"],[68,27,"报价打样"],[34,13,"合同成交"]],
    "外贸业务员":[[12,100,"我的线索"],[10,83,"有效线索"],[6,50,"转客户"],[4,33,"报价打样"],[2,17,"合同成交"]],
    "访客":[[256,100,"线索进入"],[198,77,"有效线索"],[116,45,"转客户"],[68,27,"报价打样"],[34,13,"合同成交"]]
  };
  const funnel = (funnels[currentRole]||funnels["管理员"]).map(([v,p,n])=>[Math.max(1,Math.round(v*scale)),p,n]);
  const trendMonths = wbPeriod==="今日"
    ? ["09:00","11:00","13:00","15:00","17:00","19:00"]
    : wbPeriod==="本周"
      ? ["周一","周二","周三","周四","周五","周六"]
      : wbPeriod==="本年"
        ? ["1月","2月","3月","4月","5月","6月"]
        : ["1月","2月","3月","4月","5月","6月"];
  const trendBase = currentRole==="外贸业务员" ? [32,41,38,52,58,68] : currentRole==="运营专员" ? [88,96,102,118,128,142] : [98,112,125,148,168,186];
  const trendVals = trendBase.map(v=>Math.max(8, Math.round(v * scale)));
  const activity = getWbCustomerActivity();
  return {
    meta,
    leads,
    pending,
    amount:"$"+amount+"K",
    validRate:base.validRate+"%",
    leadsNote:base.leadsNote,
    pendingNote:base.pendingNote,
    amountNote:base.amountNote,
    validNote:base.validNote,
    activityRate:activity.rate,
    activityNote:activity.note,
    compare,
    funnel,
    trendMonths,
    trendVals
  };
}
function getWbActivityWindowDays(){
  return {"今日":1,"本周":7,"本月":30,"本季度":90,"本年":365,"自定义时间":30}[wbPeriod]||30;
}
function getWbCustomerActivity(){
  const rows = getCustomerRows();
  const total = rows.length;
  if(!total) return {rate:"0%",active:0,total:0,note:"暂无客户"};
  const windowDays = getWbActivityWindowDays();
  const ref = new Date("2026-06-25T00:00:00");
  const active = rows.filter(c=>{
    if(!c.last) return false;
    const d = new Date(String(c.last).replace(" ","T"));
    if(Number.isNaN(d.getTime())) return false;
    const diff = (ref - d) / 86400000;
    return diff >= 0 && diff <= windowDays;
  }).length;
  const rate = Math.round(active / total * 100);
  return {rate:rate+"%",active,total,note:`活跃 ${active} / ${total}`};
}
function wbMetricItem(label,value,note,cls="",drill=""){
  if(currentRole==="访客" || !drill || !canAccessPage(drill)) return metric(label,value,note,cls);
  return metricDrill(label,value,note,cls,drill);
}
function wbCompareChips(stats){
  if(wbCompareMode==="无上期对比") return `<span class="tag gray">无上期对比</span>`;
  const val = stats.compare[wbCompareMode]||"—";
  const cls = val.startsWith("+")?"green":val.startsWith("-")?"red":"gray";
  return `<span class="tag ${cls}">${wbCompareMode} ${val}</span>`;
}
function wbTimeFilterHtml(){
  const presets = [["今日","今日"],["本周","本周"],["本月","本月"],["本季度","本季度"],["本年","本年"],["自定义时间","自定义"]];
  return `<div class="filters"><div class="filter-grid">
    <div class="field"><label>时间范围</label><select onchange="setWbPeriod(this.value)">${presets.map(([val,label])=>`<option value="${val}" ${wbPeriod===val?"selected":""}>${label}</option>`).join("")}</select></div>
    ${wbPeriod==="自定义时间"?`<div class="field"><label>起止日期</label><input value="${wbCustomRange}" placeholder="2026-06-01 ~ 2026-06-30" onchange="wbCustomRange=this.value;saveWbState();renderPage()"></div>`:""}
  </div></div>`;
}
function wbDataMetaBar(){
  return "";
}
function wbKpis(){
  const s = getWbStats();
  const leadLabel = wbPeriod==="今日"?"新增线索":wbPeriod==="本周"?"本周新增线索":wbPeriod==="本年"?"本年新增线索":"新增线索";
  const amountLabel = wbPeriod==="今日"?"今日成交额":wbPeriod==="本周"?"本周成交额":wbPeriod==="本年"?"本年成交额":"成交额";
  const activityCls = (parseInt(s.activityRate, 10) || 0) >= 60 ? "up" : "warn";
  return [
    wbMetricItem(leadLabel, s.leads, s.leadsNote, "up", "lead-analysis"),
    wbMetricItem("待跟进", s.pending, s.pendingNote, s.pending>0?"danger":"", "lead-pending"),
    wbMetricItem(amountLabel, s.amount, s.amountNote, "up", "performance-analysis"),
    wbMetricItem("有效线索率", s.validRate, s.validNote, "up", ""),
    wbMetricItem("客户活跃度", s.activityRate, s.activityNote, activityCls, "customer-profile")
  ].join("");
}
function wbQuickEntries(){
  const items = [
    {label:"公海池",page:"lead-all",icon:"▽"},
    {label:"我的线索",page:"lead-pending",icon:"!"},
    {label:"客户列表",page:"customer-profile",icon:"◉"},
    {label:"合同中心",page:"contract-list",icon:"▣"},
    {label:"沟通工作台",page:"communication-desk",icon:"▤"}
  ];
  const visible = items.filter(i=>canAccessPage(i.page));
  if(!visible.length) return "";
  return `<section class="panel"><div class="panel-head"><div class="panel-title">快捷入口</div></div><div class="panel-body"><div class="quick-grid">${visible.map(i=>`<div class="quick-item" onclick="nav('${i.page}')"><span class="quick-icon">${i.icon}</span>${getRoleMenuLabel(i.page,i.label)}</div>`).join("")}</div></div></section>`;
}
function getWorkbenchTodos(){
  const all = [
    {type:"AI",title:"AI 来件人洞察",subject:"ABC Technology GmbH · john@abc-tech.de · 可信度 92 分",deadline:"刚刚",priority:"高",action:"查看",page:"communication-email",opts:{emailBox:"inbox",emailId:"MAIL-IN-006"},roles:["管理员","运营专员","外贸业务员"]},
    {type:"邮件",title:"待回复邮件",subject:"Luna Fabrics · 羊毛披肩批发询盘",deadline:"今日",priority:"高",action:"回复",page:"communication-email",opts:{emailBox:"inbox",emailId:"MAIL-IN-005"},roles:["管理员","运营专员"]},
    {type:"邮件",title:"待回复邮件",subject:"Global Trade Co. · MOQ 二次确认",deadline:"今日",priority:"高",action:"回复",page:"communication-email",opts:{emailBox:"inbox"},roles:["外贸业务员"]},
    {type:"WA",title:"待回复 WhatsApp",subject:"Global Trade Co. · 50 pcs 样品单询价",deadline:"2小时内",priority:"高",action:"回复",page:"communication-whatsapp",roles:["管理员","外贸业务员"]},
    {type:"跟进",title:"待跟进客户",subject:"Sun Fashion Ltd. · 首响任务已超期",deadline:"已超期",priority:"高",action:"跟进",page:"lead-pending",roles:["管理员","运营专员","协同人","外贸业务员"]},
    {type:"跟进",title:"待跟进客户",subject:"Nordic Style AB · 样品方案待发送",deadline:"今日",priority:"中",action:"跟进",page:"lead-pending",roles:["管理员","外贸业务员"]},
    {type:"询盘",title:"待处理询盘",subject:"Harbor Linens LLC · 公海池待分配",deadline:"38分钟",priority:"高",action:"分配",page:"lead-all",roles:["管理员","运营专员","外贸业务员"]},
    {type:"询盘",title:"待处理询盘",subject:"Luna Fabrics · 西班牙批发 MOQ 询盘",deadline:"2小时",priority:"中",action:"分配",page:"lead-all",roles:["管理员","运营专员"]},
    {type:"合同",title:"待签合同",subject:"Global Trade Co. · PC-2026-0160 待同步成交时间",deadline:"本周",priority:"中",action:"处理",page:"contract-list",roles:["管理员","外贸业务员"]},
    {type:"合同",title:"待签合同",subject:"Bella Home Deco · 合同附件待补发",deadline:"今日",priority:"高",action:"处理",page:"lead-pending",roles:["外贸业务员"]},
    {type:"审批",title:"待审批事项",subject:"Luna Fabrics 跨站点转移申请",deadline:"待处理",priority:"中",action:"审批",page:"lead-all",roles:["管理员","运营专员"]}
  ];
  const roleFilter = {"管理员":null,"运营专员":null,"协同人":t=>["跟进"].includes(t.type),"外贸业务员":t=>["AI","邮件","WA","跟进","询盘","合同"].includes(t.type),"访客":()=>false};
  const fn = roleFilter[currentRole];
  let items = fn ? all.filter(t=>!fn || fn(t)) : all;
  if(!canUseAiFeature()) items = items.filter(t=>t.type!=="AI");
  if(currentRole==="协同人") items = items.filter(t=>t.priority==="高"||t.deadline.includes("超期"));
  if(currentRole==="访客") return [];
  return items.slice(0,6);
}
function wbTodos(){
  const items = getWorkbenchTodos();
  const readonly = currentRole==="访客";
  if(!items.length) return `<div class="empty" style="padding:28px 16px;text-align:center"><strong>暂无待办</strong></div>`;
  const rows = items.map((t,i)=>{
    const deadlineCell = t.deadline.includes("超期") ? `<span class="tag red">${t.deadline}</span>` : t.deadline;
    const rowClick = readonly ? "" : ` onclick="openWorkbenchTodo(${i})"`;
    const actionCell = readonly ? "" : `<td><span class="tag blue">${t.action}</span></td>`;
    return `<tr${rowClick}>
    <td><span class="todo-type">${t.type}</span></td>
    <td><strong>${t.title}</strong><div style="font-size:11px;color:var(--soft);margin-top:3px;line-height:1.5;white-space:normal">${t.subject}</div></td>
    <td>${deadlineCell}</td>
    <td>${tag(t.priority)}</td>
    ${actionCell}
  </tr>`;
  }).join("");
  const actionHeader = readonly ? "" : "<th>处理</th>";
  return `<div class="table-wrap"><table class="todo-table"><thead><tr><th>类型</th><th>待办事项</th><th>时限</th><th>优先级</th>${actionHeader}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function openWorkbenchTodo(i){
  const t = getWorkbenchTodos()[i];
  if(t) nav(t.page, t.opts);
}
function wbCustomerDistribution(){
  const rows = [
    ["A类客户",42,"green"],["B类客户",68,"blue"],["C类客户",31,"amber"],["公海/沉睡",15,"gray"]
  ];
  if(currentRole==="外贸业务员") return [["A类",8,"green"],["B类",12,"blue"],["C类",6,"amber"],["跟进中",16,"cyan"]].map(([n,c,cls])=>funnelRow(n,c,Math.round(c/28*100)||0)).join("");
  return rows.map(([n,c])=>funnelRow(n,c,Math.round(c/156*100)||0)).join("");
}
function wbContractProgress(){
  const total = datasets.contracts.length || 1;
  const countBy = label => datasets.contracts.filter(c=>displayContractState(c.state,c)===label).length;
  const active = countBy("生效中");
  const done = countBy("已完成");
  const terminated = countBy("已终止");
  return funnelRow("生效中",active,Math.round(active/total*100)||0)
    +funnelRow("已完成",done,Math.round(done/total*100)||0)
    +funnelRow("已终止",terminated,Math.round(terminated/total*100)||0);
}
function wbSalesTarget(){
  const pct = currentRole==="外贸业务员"?76:currentRole==="运营专员"?88:92;
  return `<div style="padding:4px 0"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span>${currentRole==="外贸业务员"?"个人目标":"团队目标"}完成率</span><strong style="color:var(--primary)">${pct}%</strong></div><div class="bar" style="height:10px;border-radius:999px;background:#e2e8f0"><span style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),#22d3ee);border-radius:999px"></span></div><div style="margin-top:10px;font-size:12px;color:var(--soft)">${currentRole==="外贸业务员"?"本月 $68K / 目标 $89K":"本月 $186K / 目标 $203K"} · 剩余 ${100-pct}%</div></div>`;
}
function getMessageItems(cat){
  return messageCenterData.filter(m=>{
    if(m.roles && !m.roles.includes(currentRole)) return false;
    if(cat && cat!=="all" && m.cat!==cat) return false;
    if(currentRole==="外贸业务员" && m.cat==="system" && m.id==="MSG-012") return false;
    if(currentRole==="访客" && (m.cat==="approval"||m.cat==="ai")) return m.unread===false;
    return true;
  });
}
function getUnreadMessageCount(){
  return getMessageItems("all").filter(m=>m.unread && !messageReadSet.has(m.id)).length;
}
function updateNotifyBadge(){
  const el = document.getElementById("notifyCount");
  if(!el) return;
  const n = getUnreadMessageCount();
  el.textContent = n;
  el.style.display = n ? "" : "none";
}
function updateTodoBadge(){
  const el = document.getElementById("todoCount");
  if(!el) return;
  const n = getWorkbenchTodos().length;
  el.textContent = n;
  el.style.display = n ? "" : "none";
}
function messageCatLabel(cat){
  return {all:"全部",business:"业务消息",system:"系统消息",approval:"审批消息",ai:"AI 提醒"}[cat]||cat;
}
function messageCatIcon(cat){
  return {business:"📨",system:"📢",approval:"✅",ai:"◈"}[cat]||"•";
}
function messageItemHtml(m){
  const unread = m.unread && !messageReadSet.has(m.id);
  return `<div class="msg-item ${unread?"unread":""}" onclick="openMessageItem('${m.id}')">
    <div class="msg-icon ${m.cat}">${messageCatIcon(m.cat)}</div>
    <div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px"><strong>${m.title}</strong><span class="tag ${m.cat==="ai"?"green":m.cat==="approval"?"amber":m.cat==="system"?"gray":"blue"}">${messageCatLabel(m.cat)}</span></div><div style="font-size:12px;color:var(--soft);line-height:1.6">${m.desc}</div></div>
    <span class="recent-time">${m.time}</span>
  </div>`;
}
function openMessageItem(id){
  const m = messageCenterData.find(x=>x.id===id);
  if(!m) return;
  messageReadSet.add(id);
  updateNotifyBadge();
  if(m.page==="message-center"){ if(currentPage==="message-center") renderPage(); else nav("message-center"); return; }
  if(m.opts?.customerTab) customerTab=m.opts.customerTab;
  nav(m.page, m.opts);
  if(m.target) setTimeout(()=>resolveMessageTarget(m.target),120);
}
function setMessageTab(cat){
  messageTab = cat;
  renderPage();
}
function markAllMessagesRead(){
  getMessageItems(messageTab).forEach(m=>messageReadSet.add(m.id));
  updateNotifyBadge();
  toast("已全部标为已读");
  renderPage();
}
/**
 * PAGE ID: message-center
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderMessageCenterPage(){
  const cats = ["all","business","system","approval","ai"];
  const allItems = getMessageItems(messageTab);
  const {display:items} = sliceForPage(allItems, "message-center");
  return `<div class="msg-cat-tabs">${cats.map(c=>{
    const cnt = getMessageItems(c).filter(m=>m.unread&&!messageReadSet.has(m.id)).length;
    return `<button type="button" class="msg-cat-tab ${messageTab===c?"active":""}" onclick="setMessageTab('${c}')">${messageCatLabel(c)}${cnt?`<span class="cnt">${cnt}</span>`:""}</button>`;
  }).join("")}</div>
  <section class="panel"><div class="panel-body">${allItems.length?items.map(messageItemHtml).join(""):`<div class="empty" style="padding:32px">暂无${messageCatLabel(messageTab)}</div>`}</div>${renderListPager("message-center",allItems.length)}</section>`;
}
/**
 * PAGE ID: message-center
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderMessageCenter(){
  const actions = `<button class="btn" onclick="markAllMessagesRead()">全部已读</button><button class="btn" onclick="nav('workbench')">返回工作台</button>`;
  document.getElementById("app").innerHTML = injectListToolbar(renderMessageCenterPage(), actions);
  updateNotifyBadge();
}
function wbFunnel(){
  const stats = getWbStats();
  return stats.funnel.map(([v,p,n])=>funnelRow(n,v,p)).join("");
}
function wbTrend(){
  const stats = getWbStats();
  const max = Math.max(...stats.trendVals);
  return stats.trendMonths.map((m,i)=>`<div class="trend-bar"><div class="bar-val">$${stats.trendVals[i]}K</div><div class="bar-col" style="height:${Math.round(stats.trendVals[i]/max*100)}%"></div><div class="bar-label">${m}</div></div>`).join("");
}
function wbTrendMeta(){
  return "";
}
function wbRanking(){
  const ranks = [
    {name:"张明远",meta:"天猫苏豪站 · 成交 2 单",val:"$68K"},
    {name:"李晓燕",meta:"苏豪独立站A · 跟进及时率 89%",val:"$52K"},
    {name:"王芳",meta:"苏豪独立站B · 样品转化 3 单",val:"$45K"},
    {name:"刘运营",meta:"运营分配率 96%",val:"210 线索"},
    {name:"陈协同",meta:"监督记录 12 次",val:"—"}
  ];
  if(currentRole==="运营专员") return ranks.filter((_,i)=>i===3||i<3).slice(0,4);
  return ranks.slice(0,4);
}
function rankHtml(r,i){
  const cls = i===0?"top1":i===1?"top2":i===2?"top3":"";
  return `<div class="rank-row"><div class="rank-no ${cls}">${i+1}</div><div><strong>${r.name}</strong><div class="rank-meta">${r.meta}</div></div><div class="rank-val">${r.val}</div></div>`;
}
function wbHeadActions(){
  if(currentRole==="访客") return `<button class="btn" onclick="toast('访客只读模式，禁止修改')">只读模式</button>`;
  return "";
}
function wbDesc(){
  return "";
}
function showRanking(){ return false; }
/**
 * PAGE ID: workbench
 * MODULE TYPE: dashboard
 * OWNER DOMAIN: system
 */
function renderWorkbench(){
  loadWbState();
  const todoCount = getWorkbenchTodos().length;
  const body = `
    ${wbTimeFilterHtml()}
    <div class="kpi-grid cols-5">${wbKpis()}</div>
    ${wbQuickEntries()}
    <section class="panel"><div class="panel-head"><div class="panel-title">我的待办${todoCount?` · ${todoCount}`:""}</div></div><div class="panel-body">${wbTodos()}</div></section>
    <div class="grid-2">
      <section class="panel"><div class="panel-head"><div class="panel-title">销售漏斗</div></div><div class="panel-body"><div class="funnel">${wbFunnel()}</div></div></section>
      <section class="panel"><div class="panel-head"><div class="panel-title">成交额趋势</div></div><div class="panel-body"><div class="trend-chart">${wbTrend()}</div></div></section>
    </div>
    ${canAccessPage("contract-list")?`<section class="panel" style="margin-top:14px"><div class="panel-head"><div class="panel-title">合同进度</div><button class="btn small" onclick="nav('contract-list')">合同中心</button></div><div class="panel-body"><div class="funnel">${wbContractProgress()}</div></div></section>`:""}`;
  document.getElementById("app").innerHTML = pageShell(getPageTitle("workbench"),wbDesc(),wbHeadActions(),body,"workbench");
  updateNotifyBadge();
  updateTodoBadge();
}
function funnelRow(name,value,pct){ return `<div class="funnel-item"><span>${name}</span><div class="bar"><span style="width:${pct}%"></span></div><strong>${value}</strong></div>`; }
function navFunnelStage(stage){
  const actions={
    "询盘进入":()=>nav("lead-all"),
    "线索进入":()=>nav("lead-all"),
    "有效线索":()=>nav("lead-pending"),
    "有效询盘":()=>nav("lead-pending"),
    "转客户":()=>nav("customer-profile"),
    "报价打样":()=>{ nav("lead-pending"); toast("已定位至报价打样阶段线索"); },
    "成交客户":()=>nav("contract-list"),
    "合同成交":()=>nav("contract-list")
  };
  (actions[stage]||(()=>toast(`查看 ${stage} 阶段数据`)))();
}
function funnelStageRow(name,value,pct){
  const safe=name.replace(/'/g,"\\'");
  return `<div class="funnel-item" style="cursor:pointer" onclick="navFunnelStage('${safe}')" title="点击查看 ${name} 阶段数据"><span>${name}</span><div class="bar"><span style="width:${pct}%"></span></div><strong>${value}</strong></div>`;
}
function funnelDropoffHtml(funnel){
  if(!funnel||funnel.length<2) return `<div class="empty" style="padding:16px">暂无阶段数据</div>`;
  return funnel.slice(1).map((cur,i)=>{
    const prev=funnel[i];
    const drop=Math.max(0,(prev[1]||0)-(cur[1]||0));
    const rate=prev[1]?Math.round((cur[1]||0)/prev[1]*100):0;
    return `<div class="summary-row"><div class="summary-text"><strong>${prev[0]} → ${cur[0]}</strong><span>阶段转化 ${rate}% · 流失 ${drop} 条</span></div><span class="tag ${rate>=50?"green":rate>=30?"amber":"red"}">${rate}%</span></div>`;
  }).join("");
}
function task(name,desc,owner,level){ return `<div class="summary-row"><div class="summary-main"><span class="dot" style="background:${level==="danger"?"var(--danger)":level==="warn"?"var(--warn)":"var(--primary)"}"></span><div class="summary-text"><strong>${name}</strong><span>${desc}</span></div></div><span class="tag gray">${owner}</span></div>`; }
function kv(k,v){ return `<div class="summary-row"><div class="summary-text"><strong>${k}</strong><span>${v}</span></div></div>`; }
function siteHealth(){ return datasets.sites.map(s=>`<div class="summary-row"><div class="summary-text"><strong>${s.name}</strong><span>${s.leads} 线索 / ${s.customers} 客户 / 转化 ${s.conversion}</span></div>${tag(s.status)}</div>`).join(""); }
function timelineHtml(customerName){
  const rows = customerName ? datasets.follow.filter(f=>f.customer===customerName) : datasets.follow;
  return rows.map(f=>`<div class="time-item"><div class="time-title">${f.customer} · ${f.state}</div><div class="time-meta">${f.time} / ${f.owner} / ${f.method}</div><div class="time-text">${f.summary}</div></div>`).join("");
}
function taskFullChainHtml(taskData){
  const lead = datasets.leads.find(l=>l.id===taskData.lead) || {};
  const followRecords = datasets.follow.filter(f=>f.customer===taskData.customer);
  const contracts = datasets.contracts.filter(c=>c.customer===taskData.customer || c.lead===taskData.lead);
  const emails = datasets.emails.filter(e=>e.customer===taskData.customer);
  const items = [];
  items.push({stage:"收到询盘",time:lead.inquiryTime||"-",detail:`来源：${lead.source||"-"} / ${lead.capture||"-"} / 客户：${lead.name||"-"} (${lead.country||"-"})`,icon:"primary"});
  if(lead.owner && lead.owner!=="-"){
    items.push({stage:"线索分配",time:lead.age||"-",detail:`分配给：${lead.owner} / 分配方式：${lead.route||"-"} / 意向：${getLeadIntentLevel(lead)}`,icon:"primary"});
  } else {
    items.push({stage:"线索分配",time:lead.age||"-",detail:`状态：${lead.assignStatus||"未分配"}`,icon:"amber"});
  }
  const firstContact = followRecords.length>0 ? followRecords[followRecords.length-1] : null;
  if(firstContact){
    items.push({stage:firstContact.state,time:firstContact.time,detail:`${firstContact.method} / ${firstContact.owner} / ${firstContact.summary}`,icon:"primary"});
  } else {
    const relatedMail = emails.find(e=>e.lead===taskData.lead);
    if(relatedMail){
      items.push({stage:"邮件往来",time:relatedMail.time,detail:`${relatedMail.subject} / ${relatedMail.customer} — ${relatedMail.aiIntent||""}`,icon:"primary"});
    }
  }
  const quoteFollows = followRecords.filter(f=>f.state.includes("报价")||f.state.includes("打样"));
  quoteFollows.forEach(f=>{
    items.push({stage:"报价跟进",time:f.time,detail:`${f.method} / ${f.owner} / ${f.summary}`,icon:"primary"});
  });
  if(contracts.length>0){
    contracts.forEach(c=>{
      items.push({stage:"合同成交",time:c.date,detail:`合同 ${c.id} / 金额 ${c.amount} / 状态：${c.state}${c.latestDeal?" / 最近成交："+c.latestDeal:""}`,icon:"success"});
    });
  } else if(taskData.stage==="已成交"){
    items.push({stage:"合同成交",time:"-",detail:"待关联合同",icon:"amber"});
  }
  if(items.length<3){
    items.push({stage:"后续跟进",time:taskData.deadline||"-",detail:`${taskData.next||"-"} / 截止：${taskData.deadline||"-"}`,icon:"primary"});
  }
  return items.map((it,i)=>`<div class="time-item"><div class="time-title" style="color:${it.icon==="success"?"var(--success)":it.icon==="amber"?"var(--warn)":"var(--primary)"}">${i+1}. ${it.stage}</div><div class="time-meta">${it.time}</div><div class="time-text">${it.detail}</div></div>`).join("");
}

function renderGeneric(meta){
  if(meta.custom) return renderCustom(meta);
  const allRows = getRows(meta);
  const pagerKey = currentPage;
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const pageActions = mergeListActions(headActions(meta), toolbar(meta));
  const body = `${renderFilters(meta)}${renderListPageToolbar(pageActions)}<section class="panel"><div class="table-wrap">${renderTable(rows,meta.dataset)}</div>${renderListPager(pagerKey,allRows.length)}</section>`;
  document.getElementById("app").innerHTML = pageShell(meta.title,meta.desc,"",body);
}
function getRows(meta){
  let rows = datasets[meta.dataset] || [];
  if(meta.dataset==="leads" && currentPage==="lead-all") rows = rows.filter(isPublicPoolLead);
  if(meta.leadStatus && meta.leadStatus !== "全部") rows = rows.filter(r=>r.status===meta.leadStatus || r.stage===meta.leadStatus);
  return rows;
}
function headActions(meta){
  if(currentRole==="访客") return "";
  if(meta.dataset==="customers") return `<button class="btn primary" onclick="openModal('customer')">新建客户</button>`;
  if(meta.dataset==="contacts") return `<button class="btn primary" onclick="openModal('contact')">新增联系人</button>`;
  if(meta.dataset==="follow") return `<button class="btn primary" onclick="openModal('follow')">新增跟进</button>`;
  if(meta.dataset==="users") return `<button class="btn primary" onclick="openUserModal()">新增用户</button>`;
  if(meta.dataset==="leads" && currentPage==="lead-all") return `<button class="btn" onclick="openModal('import')">导入线索</button><button class="btn primary" onclick="openModal('lead')">新建线索</button>`;
  if(meta.dataset==="leads") return "";
  return "";
}
function toolbar(meta){
  if(meta.dataset==="leads" && currentPage==="lead-all") return `<button class="btn small" onclick="openModal('assign')">分配线索</button>`;
  if(meta.dataset==="customers") return `<button class="btn small" onclick="openModal('assign')">客户转移</button>`;
  return "";
}
function renderLeadPoolTabs(){
  const norm=normalizeLeadPoolTab(leadPoolTab);
  return `<div class="tabs sub-tabs">${LEAD_POOL_VIEW_TABS.map(([id,label])=>`<button type="button" class="tab ${norm===id?"active":""}" onclick="setLeadPoolTab('${id}')">${label}</button>`).join("")}</div>`;
}
function renderMyLeadTabs(){
  return renderLeadStatusTabs(myLeadTab,"setMyLeadTab");
}
function renderInvalidLeadTabs(){
  const tabs = [["all","全部"],["stale","长期未跟进"],["bad_phone","无效号码"],["duplicate","重复线索"],["invalid","已失效"],["pending","待处理"]];
  return `<div class="tabs sub-tabs">${tabs.map(([id,label])=>`<button type="button" class="tab ${invalidLeadTab===id?"active":""}" onclick="setInvalidLeadTab('${id}')">${label}</button>`).join("")}</div>`;
}
function setLeadPoolTab(t){ leadPoolTab=normalizeLeadPoolTab(t); leadPoolSelected.clear(); renderPage(); }
function setMyLeadTab(t){ myLeadTab=normalizeLeadStatusTab(t); myLeadSelected.clear(); renderPage(); }
function setInvalidLeadTab(t){ invalidLeadTab=t; leadInvalidSelected.clear(); renderPage(); }
function isStaleLead(r){
  if(!r||isAbnormalLead(r)) return false;
  if(r.assignStatus!=="已分配"||!r.owner||r.owner==="-") return false;
  return (r.age||"").includes("天")&&parseInt(r.age,10)>=7;
}
function isExpiringPoolLead(r){
  if(!r) return false;
  if((r.age||"").includes("天")) return true;
  const h = parseInt(r.age,10);
  return (r.age||"").includes("小时")&&!isNaN(h)&&h>=2;
}
const PUBLIC_POOL_STATUSES = new Set(["未分配","待认领","已回收","超时释放"]);
const POOL_FORBIDDEN_STAGES = new Set(["跟进中","报价打样","已成交","深度沟通","待首响","已失效"]);
const POOL_FORBIDDEN_STATUS = new Set(["跟进中","已成交","已转客户","已转商机"]);
function hasLeadOwner(r){ return !!(r?.owner && r.owner!=="-" && r.owner!=="—"); }
function resolvePoolRecycleKind(r){
  if(!r) return null;
  if(r.poolStatus==="已回收"||r.poolStatus==="超时释放") return r.poolStatus;
  if((r.recycleReason||"").includes("超时")||r.poolStatus==="超时释放") return "超时释放";
  if(r.prevOwner||resolvePoolStatus(r)==="已回收") return "已回收";
  return null;
}
function resolvePoolStatus(r){
  if(r?.poolStatus && PUBLIC_POOL_STATUSES.has(r.poolStatus)) return r.poolStatus;
  if(r?.assignStatus==="未分配" && !hasLeadOwner(r)) return "未分配";
  return null;
}
function resolvePoolDisplayStatus(r){
  if(!r) return "—";
  if(r.assignStatus==="已分配"||hasLeadOwner(r)) return "已分配";
  const ps=resolvePoolStatus(r);
  if(ps==="待认领") return "待分配";
  return "未分配";
}
function normalizeLeadStageLabel(stage){
  if(stage==="待认领") return "待首响";
  return stage||"—";
}
function normalizeLeadCopy(text){
  if(text==null||text==="") return "—";
  return String(text).replace(/待重新认领/g,"待重新分配").replace(/待业务认领/g,"待运营分配").replace(/待认领/g,"待分配").replace(/认领/g,"分配");
}
const LEAD_BIZ_STATUSES=["待跟进","跟进中","已成交","已流失"];
const LEAD_BIZ_STAGES=["首次联系","需求确认","样品阶段","报价阶段","谈判阶段"];
const LEAD_INTENT_LEVELS=["低意向","中意向","高意向"];
const LEAD_STATUS_VIEW_TABS=[["all","全部"],["pending","待跟进"],["following","跟进中"],["won","已成交"],["lost","已流失"]];
const LEAD_POOL_VIEW_TABS=[["all","全部"],["pendingAssign","待分配"]];
function normalizeLeadPoolTab(tab){
  if(tab==="claimable") return "pendingAssign";
  if(["pending","following","won","lost","quote","converted","closed","high","highIntent"].includes(tab)) return "all";
  const valid=LEAD_POOL_VIEW_TABS.map(([id])=>id);
  return valid.includes(tab)?tab:"all";
}
function applyLeadPoolTabFilter(rows,tab){
  const t=normalizeLeadPoolTab(tab);
  if(t==="pendingAssign"||t==="claimable") return rows.filter(r=>["待认领","已回收","超时释放"].includes(resolvePoolStatus(r)||""));
  return rows;
}
function normalizeLeadStatusTab(tab){
  if(tab==="quote") return "following";
  if(tab==="converted") return "won";
  if(tab==="closed") return "lost";
  if(tab==="high"||tab==="highIntent") return "all";
  if(["unassigned","unclaimed","recycled","timeout","expiring"].includes(tab)) return "all";
  const valid=LEAD_STATUS_VIEW_TABS.map(([id])=>id);
  return valid.includes(tab)?tab:"all";
}
function applyLeadStatusTabFilter(rows,tab){
  const t=normalizeLeadStatusTab(tab);
  if(t==="pending") return rows.filter(r=>getLeadBizStatus(r)==="待跟进");
  if(t==="following") return rows.filter(r=>getLeadBizStatus(r)==="跟进中");
  if(t==="won") return rows.filter(r=>getLeadBizStatus(r)==="已成交");
  if(t==="lost") return rows.filter(r=>getLeadBizStatus(r)==="已流失");
  return rows;
}
function renderLeadStatusTabs(activeTab,setFn){
  const norm=normalizeLeadStatusTab(activeTab);
  return `<div class="tabs sub-tabs">${LEAD_STATUS_VIEW_TABS.map(([id,label])=>`<button type="button" class="tab ${norm===id?"active":""}" onclick="${setFn}('${id}')">${label}</button>`).join("")}</div>`;
}
function mapLegacyStageToBiz(stage){
  const m={"待认领":"首次联系","待首响":"首次联系","首次联系":"首次联系","深度沟通":"需求确认","需求确认":"需求确认","报价打样":"样品阶段","样品阶段":"样品阶段","报价阶段":"报价阶段","跟进中":"谈判阶段","谈判阶段":"谈判阶段","已成交":"","已失效":"","已关闭":""};
  return m[stage]||"首次联系";
}
function getLeadBizStatus(lead){
  if(!lead) return "—";
  if(isAbnormalLead(lead)||lead.status==="已失效"||lead.status==="已关闭"||lead.stage==="已失效") return "已流失";
  if(lead.status==="已成交"||lead.stage==="已成交") return "已成交";
  if(lead.status==="待跟进"||lead.status==="跟进中") return lead.status;
  if(["跟进中","深度沟通","报价打样","待首响","首次联系","需求确认","样品阶段","报价阶段","谈判阶段"].includes(lead.stage)) return "跟进中";
  return "待跟进";
}
function getLeadLostReason(lead){
  if(!lead) return "—";
  const tag=(lead.tags||"").split(/[/、,，]/).map(s=>s.trim()).find(t=>/无采购|无回复|竞争|价格|产品不匹配|不匹配|无意向|竞品/.test(t));
  if(tag) return tag;
  const route=String(lead.route||"");
  if(/关闭/.test(route)) return route.replace(/关闭$/,"").trim()||route;
  return route||"—";
}
function getLeadDealSummary(lead){
  if(!lead) return {contract:"—",dealTime:"—"};
  const ct=datasets.contracts.filter(c=>c.lead===lead.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""))[0];
  const conv=datasets.conversions.filter(c=>c.lead===lead.id&&c.node==="合同成交").sort((a,b)=>(b.time||"").localeCompare(a.time||""))[0];
  let contract=ct?.id||(conv?.contract&&conv.contract!=="-"?conv.contract:null);
  let dealTime=ct?.latestDeal||ct?.date||conv?.time||lead.last||"—";
  if(!contract||contract==="-"){
    const m=String(lead.route||"").match(/PC-\d{4}-\d+/);
    if(m) contract=m[0];
  }
  if(dealTime==="—"||!dealTime){
    const dm=String(lead.route||"").match(/(\d{4}-\d{2}-\d{2})/);
    if(dm) dealTime=dm[1];
  }
  return {contract:contract&&contract!=="-"?contract:"—",dealTime:dealTime||"—"};
}
function getLeadBizStage(lead){
  if(!lead||getLeadBizStatus(lead)!=="跟进中") return "—";
  return mapLegacyStageToBiz(lead.stage);
}
function getLeadIntentLevel(lead){
  if(!lead) return "—";
  const tags=(lead.tags||"")+getLeadActiveTagNames(lead.id).join("");
  if(/高意向|高潜|高采购/.test(tags)||lead.score==="A类") return "高意向";
  if(/无意向|低意向|低潜/.test(tags)||lead.score==="D类") return "低意向";
  return "中意向";
}
function leadBizStatusTag(lead){ return tag(getLeadBizStatus(lead)); }
function leadBizStageCell(lead){
  const st=getLeadBizStage(lead);
  return st==="—"?`<span style="color:var(--soft);font-size:11px">—</span>`:tag(st);
}
function leadIntentLevelTag(lead){
  const lv=getLeadIntentLevel(lead);
  const cls={高意向:"green",中意向:"blue",低意向:"gray"}[lv]||"";
  return `<span class="tag ${cls}">${lv}</span>`;
}
function getLeadLastFollowTime(lead){
  if(!lead) return "—";
  const rows=datasets.follow.filter(f=>f.target?.includes(lead.id)||f.customer===lead.name);
  return rows.length?rows[0].time:(lead.last||"—");
}
function getLeadNextFollowTime(lead){
  if(!lead) return "—";
  const rows=datasets.follow.filter(f=>(f.target||"").includes(lead.id)||f.customer===lead.name);
  const hit=rows.find(f=>f.nextPlan&&f.nextPlan!=="—");
  return hit?.nextPlan||lead.next||"—";
}
function leadBizStageTrack(lead){
  const st=getLeadBizStage(lead);
  if(st==="—") return "";
  const idx=Math.max(0,LEAD_BIZ_STAGES.indexOf(st));
  return renderLifecycle(LEAD_BIZ_STAGES,idx);
}
function renderLeadPoolFilterFields(){
  return `<div class="field"><label>分配状态</label><select disabled><option>待分配</option></select></div>
    <div class="field"><label>意向等级</label><select><option>全部</option>${LEAD_INTENT_LEVELS.map(s=>`<option>${s}</option>`).join("")}</select></div>`;
}
function renderLeadBizFilterFields(prefix){
  if(prefix==="pool") return renderLeadPoolFilterFields();
  const intentSelect=prefix==="my"
    ? `<div class="field"><label>意向等级</label><select onchange="setMyLeadIntentFilter(this.value)"><option value="">全部</option>${LEAD_INTENT_LEVELS.map(s=>`<option value="${s}" ${myLeadIntentFilter===s?"selected":""}>${s}</option>`).join("")}</select></div>`
    : `<div class="field"><label>意向等级</label><select><option>全部</option>${LEAD_INTENT_LEVELS.map(s=>`<option>${s}</option>`).join("")}</select></div>`;
  return `<div class="field"><label>状态</label><select><option>全部</option>${LEAD_BIZ_STATUSES.map(s=>`<option>${s}</option>`).join("")}</select></div>
    <div class="field"><label>阶段</label><select><option>全部</option>${LEAD_BIZ_STAGES.map(s=>`<option>${s}</option>`).join("")}</select></div>
    ${intentSelect}`;
}
function getLeadPoolBaseRows(){
  let rows = datasets.leads.map((r,i)=>({...r,_idx:i})).filter(isPublicPoolLead);
  if(currentRole==="运营专员") rows = rows.filter(r=>r.site.includes("天猫")||r.site.includes("独立站A"));
  if(currentRole==="外贸业务员") rows = rows.filter(r=>["天猫苏豪站"].includes(r.site));
  return rows;
}
function getLeadPoolStats(){
  const rows=getLeadPoolBaseRows();
  return {
    total:rows.length,
    todayNew:rows.filter(r=>(r.inquiryTime||"").startsWith("2026-06-16")).length,
    highIntent:rows.filter(r=>getLeadIntentLevel(r)==="高意向").length,
    overdueUnassigned:rows.filter(r=>isPoolOverdue(r)||isPoolSevenDaysNoFollow(r)).length
  };
}
function renderLeadPoolStats(){
  const s=getLeadPoolStats();
  const card=(label,val,note,cls,action)=>`<div class="metric${action?" clickable":""}" ${action?`onclick="${action}" style="cursor:pointer"`:""}><div class="metric-label">${label}</div><div class="metric-value">${val}</div><div class="metric-note ${cls}">${note}</div></div>`;
  return `<div class="kpi-grid cols-4" style="margin-bottom:14px">
    ${card("公海线索总数",s.total,s.total?"待分配资源":"—","",`setLeadPoolTab('all')`)}
    ${card("今日新增",s.todayNew,s.todayNew?"本日入池":"—",s.todayNew?"up":"",`setLeadPoolTab('all')`)}
    ${card("高意向线索",s.highIntent,s.highIntent?"建议优先分配":"—",s.highIntent?"up":"",`setLeadPoolTab('all')`)}
    ${card("超时未分配",s.overdueUnassigned,s.overdueUnassigned?"需尽快处理":"—",s.overdueUnassigned?"warn":"",`setLeadPoolTab('pendingAssign')`)}
  </div>`;
}
function leadPoolTypeTag(r){
  const ps=resolvePoolStatus(r)||"未分配";
  return tag(ps==="待认领"?"待分配":ps);
}
function setMyLeadIntentFilter(v){
  myLeadIntentFilter=v||"";
  myLeadSelected.clear();
  renderPage();
}
function drillMyLeadStat(tab){
  myLeadTab=normalizeLeadStatusTab(tab);
  myLeadSelected.clear();
  renderPage();
}
function getMyLeadBaseRows(){
  let rows = datasets.leads.map((r,i)=>({...r,_idx:i})).filter(r=>r.assignStatus==="已分配"&&r.owner&&r.owner!=="-"&&(isActiveLead(r)||r.status==="已关闭"));
  if(currentRole==="外贸业务员") rows = rows.filter(r=>r.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(r=>r.site.includes("天猫")||r.site.includes("独立站A"));
  else if(currentRole==="协同人") rows = rows.filter(r=>getLeadIntentLevel(r)==="高意向"||getLeadBizStatus(r)==="待跟进"||(r.age||"").includes("天")&&parseInt(r.age,10)>=5);
  return rows;
}
function getMyLeadStats(){
  const rows=getMyLeadBaseRows();
  return {
    pending:rows.filter(r=>getLeadBizStatus(r)==="待跟进").length,
    following:rows.filter(r=>getLeadBizStatus(r)==="跟进中").length,
    won:rows.filter(r=>getLeadBizStatus(r)==="已成交").length,
    lost:rows.filter(r=>getLeadBizStatus(r)==="已流失").length,
    highIntent:rows.filter(r=>getLeadIntentLevel(r)==="高意向").length,
    total:rows.length
  };
}
function renderMyLeadStats(){
  const s=getMyLeadStats();
  const card=(label,val,note,cls,action)=>`<div class="metric clickable" onclick="${action}" style="cursor:pointer"><div class="metric-label">${label}</div><div class="metric-value">${val}</div><div class="metric-note ${cls}">${note}</div></div>`;
  return `<div class="kpi-grid cols-5" style="margin-bottom:14px">
    ${card("待跟进",s.pending,s.pending?"需尽快首响":"—",s.pending?"warn":"","drillMyLeadStat('pending')")}
    ${card("跟进中",s.following,"报价 / 样品推进中","",`drillMyLeadStat('following')`)}
    ${card("已成交",s.won,s.won?"本周期成交":"—","up",`drillMyLeadStat('won')`)}
    ${card("已流失",s.lost,s.lost?"历史关闭线索":"—","",`drillMyLeadStat('lost')`)}
    ${card("高意向线索",s.highIntent,s.highIntent?"点击筛选高意向":"—",s.highIntent?"up":"","setMyLeadIntentFilter('高意向')")}
  </div>`;
}
function toggleLeadEditStageField(status){
  const wrap=document.getElementById("leadEditStageField");
  if(wrap) wrap.style.display=status==="跟进中"?"":"none";
}
function isPublicPoolLead(r){
  if(!r || isAbnormalLead(r)) return false;
  if(hasLeadOwner(r) || r.assignStatus==="已分配") return false;
  if(r.status==="已关闭"||POOL_FORBIDDEN_STATUS.has(r.status)) return false;
  if(POOL_FORBIDDEN_STAGES.has(r.stage)) return false;
  const ps = resolvePoolStatus(r);
  return !!(ps && PUBLIC_POOL_STATUSES.has(ps));
}
function isUnassignedLead(r){
  if(!r || isAbnormalLead(r)) return false;
  return !hasLeadOwner(r) && r.assignStatus!=="已分配";
}
function shouldHideLeadBusinessProgress(r){
  return isPublicPoolLead(r) || isUnassignedLead(r);
}
const LEAD_TAG_LIFECYCLE_ACTIONS = new Set(["AI分析线索","确认AI标签","忽略AI标签","添加系统预设","添加业务标签","删除业务标签"]);
function isLeadTagLifecycleEvent(e){
  if(!e) return false;
  const title=(e.title||"").trim();
  if(LEAD_TAG_LIFECYCLE_ACTIONS.has(title)) return true;
  if(e.cat==="ai"&&/标签|打标|推荐标签/.test(`${title}${e.summary||""}${e.detail||""}`)) return true;
  return /推荐标签|自动打标|AI.*标签/.test(`${e.summary||""}${e.detail||""}`);
}
function isAbnormalLead(r){
  return !!(r && (r.status==="异常线索" || r.status==="已失效" || r.stage==="已失效"));
}
function isActiveLead(r){ return !!(r && !isAbnormalLead(r)); }
function leadStatusTag(r){
  if(!r) return tag("—");
  if(r.status==="异常线索") return `<span class="tag red">异常线索</span>`;
  if(r.status==="已失效"||r.stage==="已失效") return `<span class="tag gray">已失效</span>`;
  return tag(r.status||"—");
}
function canMarkLeadAbnormal(r){
  if(!r || isAbnormalLead(r)) return false;
  if(currentRole==="访客"||currentRole==="协同人") return false;
  if(currentRole==="外贸业务员") return r.owner==="张明远"||isPublicPoolLead(r);
  return true;
}
function nowLeadTimestamp(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function appendLeadAbnormalHistory(lead,entry){
  if(!lead.abnormalHistory) lead.abnormalHistory=[];
  lead.abnormalHistory.unshift({id:`LAB-${Date.now()}`,...entry});
}
function appendLeadAuditLog(lead,action,content){
  datasets.auditLogs.unshift({id:`LOG-${Date.now()}`,time:nowLeadTimestamp(),operator:sessionUser?.name||currentRole,module:"线索中心",action,content,result:"成功",target:lead.id,ip:"10.0.1.18"});
}
function pushLeadLifecyclePreset(leadId,event){
  if(!datasets.lifecyclePresets[leadId]) datasets.lifecyclePresets[leadId]=[];
  datasets.lifecyclePresets[leadId].unshift({id:`ljt-ab-${Date.now()}`,cat:"system",...event});
}
function markLeadAbnormal(datasetIdx,reason,note){
  const lead=datasets.leads[datasetIdx];
  if(!lead||isAbnormalLead(lead)) return false;
  if(!lead.abnormalSnapshot){
    lead.abnormalSnapshot={status:lead.status,stage:lead.stage,owner:lead.owner,assignStatus:lead.assignStatus,poolStatus:lead.poolStatus,route:lead.route};
  }
  const operator=sessionUser?.name||currentRole;
  const time=nowLeadTimestamp();
  const snap=lead.abnormalSnapshot;
  lead.prevStatus=snap.status;
  lead.prevStage=snap.stage;
  lead.status="异常线索";
  lead.stage="已失效";
  lead.invalidType=reason;
  lead.invalidReason=note||reason;
  lead.processStatus="待处理";
  lead.invalidMarkedBy=operator;
  lead.invalidMarkedAt=time;
  lead.invalidMarkSource="人工标记";
  lead.route=lead.route||"业务员标记异常";
  if(!(lead.tags||"").includes("异常")) lead.tags=(lead.tags?lead.tags+" / ":"")+"异常线索";
  appendLeadAbnormalHistory(lead,{action:"标记异常",time,operator,reason,note:note||"-",prevStatus:snap.status,prevStage:snap.stage});
  appendLeadAuditLog(lead,"标记异常",`${lead.name}（${lead.id}）标记为异常线索 · 原因：${reason}${note?` · ${note}`:""}`);
  pushLeadLifecyclePreset(lead.id,{time,title:"标记异常",summary:reason,detail:`操作人：${operator}<br>说明：${note||reason}<br>原状态：${snap.status} / ${snap.stage}`,operator});
  return true;
}
function restoreLeadFromAbnormal(datasetIdx,note){
  const lead=datasets.leads[datasetIdx];
  if(!lead||!isAbnormalLead(lead)) return false;
  const snap=lead.abnormalSnapshot||{status:lead.prevStatus||"待跟进",stage:lead.prevStage||"待首响",owner:lead.owner,assignStatus:lead.assignStatus,poolStatus:lead.poolStatus,route:lead.route};
  const operator=sessionUser?.name||currentRole;
  const time=nowLeadTimestamp();
  const prevReason=lead.invalidType||"-";
  lead.status=snap.status||"待跟进";
  lead.stage=snap.stage||"待首响";
  if(snap.owner!=null) lead.owner=snap.owner;
  if(snap.assignStatus) lead.assignStatus=snap.assignStatus;
  if(snap.poolStatus) lead.poolStatus=snap.poolStatus;
  if(snap.route) lead.route=snap.route;
  lead.processStatus="已恢复";
  lead.restoredBy=operator;
  lead.restoredAt=time;
  lead.restoredNote=note||"";
  lead.invalidResolved=true;
  delete lead.abnormalSnapshot;
  appendLeadAbnormalHistory(lead,{action:"取消异常",time,operator,reason:prevReason,note:note||"恢复至原业务状态",restoredStatus:lead.status,restoredStage:lead.stage});
  appendLeadAuditLog(lead,"取消异常",`${lead.name}（${lead.id}）已恢复 · 状态：${lead.status} / ${lead.stage}`);
  pushLeadLifecyclePreset(lead.id,{time,title:"取消异常标记",summary:`恢复为 ${lead.status}`,detail:`操作人：${operator}<br>说明：${note||"人工取消异常标记"}<br>历史异常原因：${prevReason}`,operator});
  return true;
}
function openMarkLeadAbnormalModal(datasetIdx){
  if(currentRole==="访客"||currentRole==="协同人"){ toast("当前角色无权标记异常线索"); return; }
  const lead=datasets.leads[datasetIdx];
  if(!lead){ toast("线索不存在"); return; }
  if(isAbnormalLead(lead)){ toast("该线索已是异常状态"); return; }
  leadMarkAbnormalIdx=datasetIdx;
  openModal("leadMarkAbnormal");
}
function openRestoreLeadAbnormalModal(datasetIdx){
  if(currentRole==="访客"||currentRole==="协同人"){ toast("当前角色无权操作"); return; }
  const lead=datasets.leads[datasetIdx];
  if(!lead||!isAbnormalLead(lead)){ toast("该线索不是异常状态"); return; }
  leadRestoreAbnormalIdx=datasetIdx;
  openModal("leadRestoreAbnormal");
}
function openMarkLeadAbnormalFromPool(listIdx){
  const row=getLeadPoolRows()[listIdx];
  if(row) openMarkLeadAbnormalModal(row._idx);
}
function openMarkLeadAbnormalFromMy(listIdx){
  const row=getMyLeadRows()[listIdx];
  if(row) openMarkLeadAbnormalModal(row._idx);
}
function leadAbnormalHistoryHtml(lead){
  const rows=(lead.abnormalHistory||[]).length?lead.abnormalHistory:[];
  if(!rows.length&&!(lead.invalidMarkedAt||lead.restoredAt)) return "";
  const legacy=[];
  if(lead.invalidMarkedAt&&!rows.some(r=>r.action==="标记异常")) legacy.push({action:"标记异常",time:lead.invalidMarkedAt,operator:lead.invalidMarkedBy||lead.processedBy||"-",reason:lead.invalidType||"-",note:lead.invalidReason||"-",prevStatus:lead.prevStatus,prevStage:lead.prevStage});
  if(lead.restoredAt&&!rows.some(r=>r.action==="取消异常")) legacy.push({action:"取消异常",time:lead.restoredAt,operator:lead.restoredBy||"-",reason:lead.invalidType||"-",note:lead.restoredNote||"-",restoredStatus:lead.status,restoredStage:lead.stage});
  const all=[...rows,...legacy];
  return drawerSection("异常处理轨迹",`<div class="timeline">${all.map(h=>`<div class="time-item"><div class="time-title">${h.action} · ${h.reason||"-"}</div><div class="time-meta">${h.time} / ${h.operator||"-"}</div><div class="time-text">${h.note||"—"}${h.prevStatus?`<br><span style="color:var(--soft)">原状态：${h.prevStatus} / ${h.prevStage||"—"}</span>`:""}${h.restoredStatus?`<br><span style="color:var(--soft)">恢复为：${h.restoredStatus} / ${h.restoredStage||"—"}</span>`:""}</div></div>`).join("")}</div>`);
}
function leadAiRiskHintHtml(lead){
  if(!canUseAiFeature()||isAbnormalLead(lead)) return "";
  const intel=getLeadIntelligence(lead);
  const hints=[];
  if((lead.contact||"").includes("invalid")||lead.contact==="-") hints.push("联系方式格式异常，建议核实");
  if(intel?.risks?.length) hints.push(...intel.risks.filter(r=>!r.includes("已标记")));
  if(!hints.length) return "";
  return drawerSection("AI 异常风险提示",`<div class="alert-item" style="margin:0"><div class="alert-icon amber">!</div><div class="alert-body"><strong>AI 识别到潜在异常风险（仅供参考）</strong><span>${hints.join(" · ")}</span><div style="margin-top:8px;font-size:12px;color:var(--soft)">最终是否标记异常由人工确认，系统不会自动修改线索状态。</div>${canMarkLeadAbnormal(lead)?`<div class="toolbar-actions" style="margin-top:8px"><button class="btn small danger" onclick="openMarkLeadAbnormalModal(${datasets.leads.indexOf(lead)})">标记异常</button></div>`:""}</div></div>`);
}
function poolRecycleHistoryHtml(data){
  if(!data?.prevOwner) return "";
  return drawerSection("回收轨迹",`${kv("原负责人",data.prevOwner)}${kv("分配时间",data.assignedAt||"—")}${kv("回收/释放时间",data.recycledAt||"—")}${kv("回收原因",normalizeLeadCopy(data.recycleReason||"—"))}`);
}
/* MODULE: lead-all — 公海池筛选键 → 数据字段映射 */
function hasLeadFollowContact(lead){
  if(!lead) return false;
  return datasets.follow.some(f=>(f.target||"").includes(lead.id)||f.customer===lead.name);
}
function isPoolSevenDaysNoFollow(r){
  if(!r) return false;
  if((r.recycleReason||"").includes("7天")) return true;
  const age=r.age||"";
  if(age.includes("天")){
    const d=parseInt(age,10);
    if(!isNaN(d)&&d>=7) return true;
  }
  return resolvePoolStatus(r)==="已回收"&&age.includes("天")&&parseInt(age,10)>=7;
}
function isPoolOverdue(r){
  if(!r) return false;
  if(isExpiringPoolLead(r)) return true;
  const age=r.age||"";
  if(age.includes("小时")){
    const h=parseInt(age,10);
    if(!isNaN(h)&&h>=2) return true;
  }
  return false;
}
const LEAD_POOL_FILTER_DEFS = {
  poolType:{
    unassigned:{label:"未分配",match:r=>resolvePoolStatus(r)==="未分配"},
    unclaimed:{label:"待分配",match:r=>resolvePoolStatus(r)==="待认领"},
    recycled:{label:"已回收",match:r=>resolvePoolStatus(r)==="已回收"},
    timeout:{label:"超时释放",match:r=>resolvePoolStatus(r)==="超时释放"}
  },
  timeStatus:{
    todayNew:{label:"今日新增",fields:["inquiryTime"],match:r=>(r.inquiryTime||"").startsWith("2026-06-16")},
    "7dNoFollow":{label:"7天未跟进",fields:["age"],match:r=>isPoolSevenDaysNoFollow(r)},
    overdue:{label:"已超期",fields:["age"],match:r=>isPoolOverdue(r)}
  }
};
function matchesLeadPoolFilters(lead){
  for(const group of ["poolType","timeStatus"]){
    const key=leadPoolFilters[group];
    if(!key) continue;
    const def=LEAD_POOL_FILTER_DEFS[group][key];
    if(!def?.match(lead)) return false;
  }
  return true;
}
function setLeadPoolTypeFilter(key){
  leadPoolFilters.poolType=(key&&LEAD_POOL_FILTER_DEFS.poolType[key])?key:"";
  leadPoolSelected.clear();
  renderPage();
}
function setLeadPoolTimeStatus(key){
  leadPoolFilters.timeStatus=(key&&LEAD_POOL_FILTER_DEFS.timeStatus[key])?key:"";
  leadPoolSelected.clear();
  renderPage();
}
function clearLeadPoolFilters(){
  leadPoolFilters={poolType:"",timeStatus:""};
  leadPoolSelected.clear();
  renderPage();
}
function renderLeadPoolTypeSelect(){
  const cur=leadPoolFilters.poolType||"";
  const opts=[["","全部"],["unassigned","未分配"],["unclaimed","待分配"],["recycled","已回收"],["timeout","超时释放"]];
  return `<div class="field"><label>公海类型</label><select onchange="setLeadPoolTypeFilter(this.value)">${opts.map(([v,l])=>`<option value="${v}" ${cur===v?"selected":""}>${l}</option>`).join("")}</select></div>`;
}
function renderLeadPoolTimeStatusSelect(){
  const cur=leadPoolFilters.timeStatus||"";
  const opts=[["","全部"],["todayNew","今日新增"],["7dNoFollow","7天未跟进"],["overdue","已超期"]];
  return `<div class="field"><label>时间状态</label><select class="time-status-select" onchange="setLeadPoolTimeStatus(this.value)">${opts.map(([v,l])=>`<option value="${v}" ${cur===v?"selected":""}>${l}</option>`).join("")}</select></div>`;
}
function renderLeadPoolStatusFiltersClear(){
  const hasAny=!!(leadPoolFilters.poolType||leadPoolFilters.timeStatus);
  return hasAny?`<div class="field"><label>&nbsp;</label><button type="button" class="btn small ghost" onclick="clearLeadPoolFilters()">清空筛选</button></div>`:"";
}
function getLeadPoolRows(){
  let rows = getLeadPoolBaseRows();
  rows = applyLeadPoolTabFilter(rows,leadPoolTab);
  if(leadPoolFilters.poolType||leadPoolFilters.timeStatus) rows = rows.filter(matchesLeadPoolFilters);
  if(leadPoolTagFilter.length) rows = rows.filter(r=>leadMatchesTagFilter(r.id,leadPoolTagFilter));
  return rows;
}
function renderFilters(meta){
  const fields = filterFields(meta);
  if(!fields.length) return "";
  return `<div class="filters"><div class="filter-grid">
    ${fields.map(f=>filterField(f)).join("")}
    <div class="head-actions"><button class="btn primary" onclick="toast('查询完成')">查询</button><button class="btn" onclick="toast('筛选条件已重置')">重置</button></div>
  </div></div>`;
}
function filterFields(meta){
  const siteField = {label:"站点",type:"select",options:["全部可见站点",...datasets.sites.map(s=>s.name)]};
  const map = {
    leads:[siteField,{label:"创建时间",type:"date"},{label:"线索关键词",placeholder:"线索编号、客户名称、邮箱"},{label:"状态",type:"select",options:["全部",...LEAD_BIZ_STATUSES]},{label:"阶段",type:"select",options:["全部",...LEAD_BIZ_STAGES]},{label:"意向等级",type:"select",options:["全部",...LEAD_INTENT_LEVELS]},{label:"负责人",placeholder:"业务员"}],
    customers:[siteField,{label:"客户关键词",placeholder:"客户名称、编号、国家"},{label:"负责人",placeholder:"业务员"},{label:"客户等级",type:"select",options:["全部","A类","B类","C类","D类"]}],
    contacts:[{label:"所属客户",placeholder:"客户名称"},{label:"联系人",placeholder:"姓名、邮箱、WhatsApp"},{label:"决策角色",type:"select",options:["全部","关键决策人","影响人","执行联系人"]}],
    follow:[{label:"关联客户",placeholder:"客户名称"},{label:"跟进人",placeholder:"业务员"},{label:"跟进方式",type:"select",options:["全部","邮件","WhatsApp","电话","微信","面谈"]},{label:"跟进日期",type:"date"}],
    users:[{label:"用户关键词",placeholder:"姓名、账号"},{label:"角色",type:"select",options:["全部","管理员","运营专员","协同人","外贸业务员","访客"]},{label:"状态",type:"select",options:["全部","正常","冻结"]}]
  };
  return map[meta.dataset] || [];
}
function filterField(f){
  if(f.type==="select") return `<div class="field"><label>${f.label}</label><select>${f.options.map(o=>`<option>${o}</option>`).join("")}</select></div>`;
  if(f.type==="date") return `<div class="field"><label>${f.label}</label><input type="date"></div>`;
  return `<div class="field"><label>${f.label}</label><input placeholder="${f.placeholder||""}"></div>`;
}
function renderTable(rows,type){
  if(!rows.length) return `<div class="empty">暂无数据</div>`;
  const cols = columns(type);
  const selectable = type==="leads" && currentPage==="lead-all";
  const selectHead = selectable ? `<th><input type="checkbox"></th>` : "";
  return `<table><thead><tr>${selectHead}${cols.map(c=>`<th>${c.label}</th>`).join("")}<th>操作</th></tr></thead><tbody>
    ${rows.map((r,i)=>`<tr>${selectable?`<td><input type="checkbox"></td>`:""}${cols.map(c=>`<td>${formatCell(r[c.key],c.key,r)}</td>`).join("")}<td>${renderRowActions([{label:"详情",onclick:`openDrawer(${JSON.stringify(type)},${JSON.stringify(i)})`},currentRole!=="访客"&&{label:"编辑",onclick:"openModal('edit')"}].filter(Boolean),`${type}-${i}`)}</td></tr>`).join("")}
  </tbody></table>`;
}
function columns(type){
  const map = {
    leads:[["name","线索名称"],["channel","来源"],["owner","负责人"],["status","状态"],["stage","阶段"],["intentLevel","意向等级"],["lastFollow","最近跟进"],["inquiryTime","创建时间"]],
    customers:[["id","客户编号"],["site","站点"],["name","客户名称"],["country","国家"],["level","等级"],["owner","负责人"],["contacts","联系人"],["last","最近跟进"],["next","下次跟进"],["contracts","合同"],["lock","归属"]],
    sites:[["id","站点编号"],["name","站点名称"],["domain","域名"],["status","状态"],["dept","部门"],["operator","运营专员"],["seller","业务员"],["collab","协同人"],["leads","线索"],["conversion","转化率"]],
    contracts:[["id","合同编号"],["customer","客户"],["site","站点"],["lead","关联线索"],["amount","金额"],["date","签约日期"],["latestDeal","最近成交时间"],["seller","业务员"],["source","线索来源"],["state","状态"]],
    contacts:[["id","联系人编号"],["customer","客户"],["name","姓名"],["role","职务"],["email","邮箱"],["whatsapp","WhatsApp"],["decision","决策角色"],["last","最近联系"]],
    follow:[["time","跟进时间"],["customer","客户"],["method","方式"],["state","阶段"],["summary","内容摘要"],["owner","跟进人"]],
    users:[["account","账号"],["name","姓名"],["role","角色"],["sites","站点范围"],["state","状态"],["login","最后登录"]]
  };
  return (map[type]||[]).map(([key,label])=>({key,label}));
}
function formatCell(v,key,row){
  if(key==="status"&&row?.id) return leadBizStatusTag(row);
  if(key==="stage"&&row?.id) return leadBizStageCell(row);
  if(key==="intentLevel"&&row?.id) return leadIntentLevelTag(row);
  if(key==="lastFollow"&&row?.id) return getLeadLastFollowTime(row);
  if(key==="channel"&&row) return tag(leadChannelLabel(row));
  if(key==="stage") return tag(normalizeLeadStageLabel(v));
  if(key==="state"&&row&&String(row.id||"").match(/^PC-/)) return contractStateTag(row.state,row);
  if(["score","level","lock","state","role","assignStatus","decision","mode"].includes(key)) return tag(v);
  return v ?? "-";
}
/**
 * CUSTOM PAGE DISPATCH — pageMeta.custom → 页面渲染函数
 * 由 renderGeneric() 在 meta.custom 存在时调用
 */
function renderCustom(meta){
  const title = getPageTitle(currentPage), desc = meta.desc;
  let body = "";
  /* MODULE: site-management - 站点管理 / 站点负责人 */
  if(meta.custom==="siteManagement") body = renderSiteManagementPage();
  /* MODULE: contract-list - 合同中心 / 客户合同视图 */
  else if(meta.custom==="contractList") body = renderContractListPage();
  /* MODULE: communication-* - 沟通工作台域 */
  else if(meta.custom==="communicationWorkbench"){
    /* MODULE: communication-email - 邮件中心 */
    if(currentPage==="communication-email"||commView==="email") body = emailCustomerCtx ? renderEmailCustomerThreadPage() : emailBox==="sent" ? renderEmailSentPage() : emailBox==="draft" ? renderEmailDraftPage() : renderEmailInboxPage();
    /* MODULE: communication-whatsapp - WhatsApp 会话 */
    else if(currentPage==="communication-whatsapp"||commView==="whatsapp") body = renderWhatsappChatPage();
    /* MODULE: communication-config - 沟通账号设置 */
    else if(currentPage==="communication-config"||commView==="config") body = renderCommunicationConfigPage();
    /* MODULE: communication-desk - 沟通工作台首页 */
    else body = renderCommunicationDeskPage();
  }
  else {
    const panelFns = {
      /* MODULE: site-stat - 站点统计 */
      siteStat: renderSiteStatPage,
      /* MODULE: site-page-management - 页面管理 */
      sitePageManagement: renderSitePageManagementPage,
      /* MODULE: site-form-management - 表单管理 */
      siteFormManagement: renderSiteFormManagementPage,
      /* MODULE: site-seo-analysis - SEO 分析 */
      siteSeoAnalysis: renderSiteSeoAnalysisPage,
      /* MODULE: lead-all - 公海池 */
      leadAll: renderLeadAllPage,
      /* MODULE: lead-pending - 我的线索 */
      leadTasks: renderLeadPendingPage,
      /* MODULE: lead-invalid - 异常线索 */
      leadInvalid: renderLeadInvalidPage,
      /* MODULE: lead-converted - 转化记录 */
      leadConverted: renderLeadConvertedPage,
      /* MODULE: customer-profile - 客户列表 */
      customerProfile: renderCustomerProfilePage,
      /* MODULE: follow-record - 跟进记录 */
      followRecords: renderFollowRecordPage,
      /* MODULE: user-management - 用户管理 */
      userManagement: renderUserManagementPage,
      /* MODULE: role-management - 角色管理 */
      roleManagement: renderRoleManagementPage,
      /* MODULE: permission-management - 权限管理 */
      permissionManagement: renderPermissionManagementPage,
      /* MODULE: menu-management - 菜单管理 */
      menuManagement: renderMenuManagementPage,
      /* MODULE: data-dictionary - 数据字典 */
      dataDictionary: renderDataDictionaryPage,
      /* MODULE: param-config - 参数配置 */
      paramConfig: renderParamConfigPage,
      /* MODULE: channel-config - 来源管理 */
      channelConfig: renderChannelConfigPage,
      /* MODULE: system-log - 系统日志 */
      systemLog: renderSystemLogPage,
      /* MODULE: lead-analysis - 询盘分析 */
      leadAnalysis: renderLeadAnalysisPage,
      /* MODULE: data-analysis-hub - 分析总览 */
      dataAnalysisHub: renderDataAnalysisHubPage,
      /* MODULE: customer-analysis - 客户分析 */
      customerAnalysis: renderCustomerAnalysisPage,
      /* MODULE: communication-analysis - 沟通分析 */
      communicationAnalysis: renderCommunicationAnalysisPage,
      /* MODULE: team-analysis - 团队分析 */
      teamAnalysis: renderTeamAnalysisPage,
      /* MODULE: ai-analysis - AI 洞察 */
      aiAnalysis: renderAiAnalysisPage,
      /* MODULE: funnel-analysis - 成交分析 */
      funnelAnalysis: renderFunnelAnalysisPage,
      /* MODULE: performance-analysis - 销售分析 */
      performanceAnalysis: renderPerformanceAnalysisPage
    };
    body = (panelFns[meta.custom] || (() => ""))();
  }
  if(!body||!String(body).trim()) body = renderPageDevelopingBlock(meta.title);
  if(isListPage(currentPage)) body = maskListTables(body);
  const actions = customActions(meta.custom);
  if(!pageShellKeepHeader(currentPage)) body = injectListToolbar(body, actions);
  document.getElementById("app").innerHTML = pageShell(title,desc,pageShellKeepHeader(currentPage)?actions:"",body,currentPage);
  if(siteScrollTarget&&currentPage==="site-management"){
    const target=siteScrollTarget;
    siteScrollTarget=null;
    setTimeout(()=>scrollSiteSection(target),120);
  }
}
function scrollSiteSection(id){
  const el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
}
function siteSectionTitle(title,id){
  return `<h3 class="site-section-title" ${id?`id="${id}"`:""}>${title}</h3>`;
}
function customActions(type){
  if(currentRole==="访客") return "";
  if(type==="customerProfile"){
    if(customerTab==="tags"){
      if(tagMgmtTab==="lead"){
        return isTagAdmin()
          ? `<button class="btn" onclick="openModal('tagExport')">导出标签</button><button class="btn primary" onclick="openModal('tag')">新增线索标签</button>`
          : `<button class="btn" onclick="openModal('tagExport')">导出标签</button>`;
      }
      return isTagAdmin()
        ? `<button class="btn" onclick="openModal('tagExport')">导出标签</button><button class="btn primary" onclick="openModal('tag')">新增客户标签</button>`
        : `<button class="btn" onclick="openModal('tagExport')">导出标签</button>`;
    }
  }
  if(type==="communicationWorkbench"){
    if(currentPage==="communication-desk") return `<button class="btn" onclick="nav('communication-email')">邮件中心</button><button class="btn" onclick="nav('communication-whatsapp')">WhatsApp</button><button class="btn primary" onclick="openModal('compose')">写邮件</button>`;
    if(currentPage==="communication-email") return `<button class="btn" onclick="nav('communication-desk')">返回工作台</button><button class="btn" onclick="openModal('emailExport')">导出</button><button class="btn" onclick="openModal('emailSync')">同步邮件</button><button class="btn primary" onclick="openModal('compose')">写邮件</button>`;
    if(currentPage==="communication-whatsapp") return `<button class="btn" onclick="nav('communication-desk')">返回工作台</button><button class="btn" onclick="openModal('whatsappMessage')">新建会话</button><button class="btn primary" onclick="openModal('follow')">录入跟进</button>`;
    if(currentPage==="communication-config") return `<button class="btn" onclick="openModal('commAccountTest')">测试连接</button><button class="btn" onclick="openModal('whatsappConfig')">绑定 WhatsApp</button><button class="btn primary" onclick="openModal('email')">新增邮箱</button>`;
  }
  if(["roleManagement","systemLog","permissionManagement","menuManagement","dataDictionary","paramConfig"].includes(type) && currentRole!=="管理员") return "";
  if(type==="userManagement" && !canManageUsers()) return "";
  if(["siteManagement","siteOwner","sitePageManagement","siteFormManagement","siteSeoAnalysis"].includes(type) && !["管理员","运营专员"].includes(currentRole)) return "";
  if(type==="channelConfig" && !canManageChannels()) return "";
  if(currentRole==="协同人") return collabActions(type);
  if(currentRole==="外贸业务员") return sellerActions(type);
  if(type==="userManagement" && currentRole==="运营专员") return `<button class="btn" onclick="openModal('userExport')">导出用户</button><button class="btn primary" onclick="openUserModal()">新增用户</button>`;
  const map = {
    siteManagement:`<button class="btn" onclick="openModal('siteImport')">导入站点</button><button class="btn" onclick="toast('已导出当前站点列表 Excel')">导出</button><button class="btn primary" onclick="openModal('site')">新增站点</button>`,
    sitePageManagement:`<button class="btn" onclick="toast('已导出页面列表')">导出</button><button class="btn" onclick="nav('site-form-management')">表单管理</button><button class="btn" onclick="nav('lead-analysis')">来源分析</button><button class="btn primary" onclick="toast('新建落地页')">新建页面</button>`,
    siteFormManagement:`<button class="btn" onclick="toast('已导出表单配置')">导出</button><button class="btn" onclick="nav('channel-config')">来源管理</button><button class="btn" onclick="nav('site-page-management')">页面管理</button><button class="btn primary" onclick="toast('新建询盘表单')">新建表单</button>`,
    siteSeoAnalysis:`<button class="btn" onclick="nav('site-stat')">站点统计</button><button class="btn primary" onclick="toast('关键词数据已刷新')">刷新排名</button>`,
    permissionManagement:`<button class="btn" onclick="openModal('permMatrix')">权限矩阵</button><button class="btn primary" onclick="openModal('rolePerm')">配置权限</button>`,
    menuManagement:`<button class="btn" onclick="toast('菜单配置已导出 Excel')">导出菜单</button><button class="btn primary" onclick="openMenuModal()">新增菜单</button>`,
    dataDictionary:`<button class="btn" onclick="toast('字典已导出')">导出字典</button><button class="btn primary" onclick="toast('新增字典项')">新增字典</button>`,
    paramConfig:`<button class="btn" onclick="toast('系统规则已导出 Excel')">导出规则</button><button class="btn primary" onclick="toast('系统规则已保存')">保存规则</button>`,
    siteOwner:`<button class="btn" onclick="openModal('siteOwnerBatch')">批量调整</button><button class="btn" onclick="openSiteOwnerPreview(0)">权限配置</button><button class="btn primary" onclick="openSiteOwnerAuth(-1,'all')">调整负责人</button>`,
    siteStat:`<button class="btn" onclick="openModal('siteStatMonth')">切换月份</button><button class="btn primary" onclick="toast('站点统计已刷新')">刷新数据</button>`,
    leadAll:`<button class="btn" onclick="openModal('leadPoolImport')">导入线索</button><button class="btn" onclick="openModal('leadPoolExport')">导出</button><button class="btn" onclick="openModal('assign')">分配线索</button><button class="btn primary" onclick="openModal('lead')">新建线索</button>`,
    leadTasks:`<button class="btn" onclick="openModal('leadTaskExport')">导出</button><button class="btn" onclick="openModal('follow')">录入跟进</button><button class="btn" onclick="nav('follow-record')">跟进日志</button><button class="btn primary" onclick="openModal('assign')">转客户</button>`,
    leadConverted:`<button class="btn" onclick="openModal('leadConvertedExport')">导出记录</button><button class="btn" onclick="nav('lead-pending')">我的线索</button><button class="btn" onclick="nav('follow-record')">跟进日志</button><button class="btn" onclick="nav('customer-profile')">客户档案</button><button class="btn primary" onclick="toast('转化记录已刷新，同步 ${getConversionRows().length} 条')">刷新数据</button>`,
    leadInvalid:`<button class="btn" onclick="openModal('leadInvalidExport')">导出</button><button class="btn" onclick="toast('异常队列已刷新，共 ${getInvalidLeadRows().length} 条')">刷新</button><button class="btn primary" onclick="openModal('leadInvalidProcess')">批量标记处理</button>`,
    customerProfile:`<button class="btn" onclick="openModal('customerExport')">导出客户</button><button class="btn" onclick="openModal('assign')">客户转移</button><button class="btn primary" onclick="openModal('customer')">新建客户</button>`,
    customerTags:`<button class="btn" onclick="openModal('tagExport')">导出标签</button><button class="btn primary" onclick="openModal('tag')">新增标签</button>`,
    tags:`<button class="btn" onclick="openModal('tagExport')">导出标签</button><button class="btn primary" onclick="openModal('tag')">新增标签</button>`,
    contractList:`<button class="btn" onclick="openModal('contractExport')">导出合同</button><button class="btn" onclick="openModal('contractImport')">导入合同</button><button class="btn" onclick="nav('customer-profile')">客户列表</button><button class="btn primary" onclick="openModal('contract')">新增合同</button>`,
    contractCustomer:`<button class="btn" onclick="nav('contract-list')">合同列表</button><button class="btn primary" onclick="openModal('contract')">新增合同</button>`,
    followRecords:`<button class="btn" onclick="openModal('followExport')">导出日志</button><button class="btn" onclick="nav('lead-pending')">我的线索</button>`,
    roles:`<button class="btn primary" onclick="openModal('roles')">新增角色</button>`,
    userManagement:`<button class="btn" onclick="openModal('userExport')">导出用户</button><button class="btn" onclick="nav('role-management')">角色管理</button><button class="btn" onclick="nav('site-owner')">站点负责人</button><button class="btn primary" onclick="openUserModal()">新增用户</button>`,
    roleManagement:`<button class="btn" onclick="nav('user-management')">用户管理</button><button class="btn primary" onclick="openModal('roles')">新增角色</button>`,
    channels:`<button class="btn" onclick="openModal('channelExport')">导出配置</button><button class="btn" onclick="openModal('channelPull')">手动拉取</button><button class="btn primary" onclick="openModal('channels')">新增渠道</button>`,
    channelConfig:`<button class="btn" onclick="openModal('channelExport')">导出配置</button><button class="btn" onclick="openModal('channelPull')">手动拉取</button><button class="btn primary" onclick="openModal('channels')">新增渠道</button>`,
    logs:`<button class="btn" onclick="openModal('logExport')">导出日志</button><button class="btn primary" onclick="toast('审计日志已刷新')">刷新</button>`,
    systemLog:`<button class="btn" onclick="openModal('logExport')">导出日志</button><button class="btn primary" onclick="toast('审计日志已刷新')">刷新</button>`,
    communicationWorkbench:`<button class="btn" onclick="nav('communication-email')">邮件中心</button><button class="btn" onclick="nav('communication-whatsapp')">WhatsApp</button><button class="btn" onclick="openModal('emailExport')">导出沟通</button><button class="btn primary" onclick="openModal('compose')">写邮件</button>`,
    communicationConfig:`<button class="btn" onclick="openModal('commAccountTest')">测试连接</button><button class="btn" onclick="openModal('whatsappConfig')">绑定 WhatsApp</button><button class="btn primary" onclick="openModal('email')">新增邮箱</button>`,
    emailInbox:`<button class="btn" onclick="openModal('emailSync')">同步邮件</button><button class="btn" onclick="openModal('emailExport')">导出</button><button class="btn primary" onclick="openModal('compose')">写邮件</button>`,
    emailSent:`<button class="btn" onclick="openModal('emailExport')">导出</button><button class="btn primary" onclick="openModal('compose')">写邮件</button>`,
    emailDrafts:`<button class="btn" onclick="toast('已清理 30 天前草稿')">清理过期</button><button class="btn primary" onclick="openModal('compose')">写邮件</button>`,
    whatsappChat:`<button class="btn" onclick="openModal('commAccountTest')">测试连接</button><button class="btn" onclick="openModal('whatsappConfig')">账号管理</button><button class="btn primary" onclick="openModal('whatsappMessage')">新建会话</button>`,
    leadAnalysis:`<button class="btn primary" onclick="toast('询盘分析数据已刷新')">刷新数据</button>`,
    dataAnalysisHub:`<button class="btn primary" onclick="toast('分析数据已刷新')">刷新</button>`,
    funnelAnalysis:`<button class="btn primary" onclick="toast('成交分析数据已刷新')">刷新数据</button>`,
    performanceAnalysis:`<button class="btn primary" onclick="toast('销售分析数据已刷新')">刷新数据</button>`,
    aiAnalysis:`<button class="btn" onclick="openAiConfigPage()">AI 配置</button>`
  };
  return map[type] || "";
}
function collabActions(type){
  const map = {
    leadAll:`<button class="btn" onclick="toast('已打开跨站点分配审批队列')">审批分配</button>`,
    leadTasks:`<button class="btn" onclick="toast('已发送超期催办提醒')">催办超期</button><button class="btn primary" onclick="nav('follow-record')">监督跟进日志</button>`,
    leadInvalid:`<button class="btn" onclick="openModal('leadInvalidProcess')">批量处理</button>`,
    followRecords:`<button class="btn" onclick="openModal('followExport')">导出日志</button><button class="btn primary" onclick="nav('lead-pending')">监督任务</button>`,
    contractList:`<button class="btn" onclick="nav('customer-profile')">查看客户</button>`,
    communicationWorkbench:`<button class="btn" onclick="nav('communication-desk')">查看待处理</button>`,
  };
  return map[type] || "";
}
function sellerActions(type){
  const map = {
    leadAll:`<button class="btn primary" onclick="openModal('assign')">分配线索</button>`,
    leadTasks:`<button class="btn" onclick="openModal('leadTaskExport')">导出</button><button class="btn" onclick="openModal('compose')">写邮件</button><button class="btn" onclick="nav('follow-record')">跟进日志</button><button class="btn primary" onclick="openModal('follow')">录入跟进</button>`,
    customerProfile:`<button class="btn" onclick="openModal('customerExport')">导出客户</button><button class="btn primary" onclick="openModal('follow')">新增跟进</button>`,
    followRecords:`<button class="btn" onclick="openModal('followExport')">导出日志</button><button class="btn" onclick="nav('lead-pending')">我的线索</button>`,
    contractList:`<button class="btn" onclick="openModal('contractExport')">导出合同</button>`,
    communicationWorkbench:`<button class="btn" onclick="nav('communication-whatsapp')">WhatsApp</button><button class="btn" onclick="openModal('compose')">写邮件</button><button class="btn primary" onclick="nav('communication-desk')">沟通工作台</button>`
  };
  return map[type] || "";
}
function getSiteMgmtRows(){
  return datasets.sites.map((s,i)=>({
    ...s,
    source:i===0?"未迟建站":i===1?"苏豪自有系统":"苏豪自有系统",
    endpoint:i===0?"api.weichi.com/leads/sutex":i===1?"crm.sutex-a.com/api/inquiry":"crm.sutex-b.com/api/inquiry",
    frequency:i===2?"暂停拉取":"每30分钟",
    lastPull:i===0?"2026-06-16 09:15 / 8条":i===1?"2026-06-16 09:00 / 5条":"2026-06-10 18:00 / 0条",
    launchDate:i===0?"2024-03-15":i===1?"2024-08-01":"2025-01-10",
    lifecycle:i===0?"运营中":i===1?"运营中":"暂停",
    lifecycleStage:i===2?3:2,
    apiStatus:i===2?"异常":i===0?"正常":"正常",
    channels:[
      {name:"网站表单",on:true},
      {name:"邮件",on:true},
      {name:"WhatsApp",on:i!==2},
      {name:"API拉取",on:i!==2,err:i===2}
    ],
    flowName:i===0?"自动分配+首响提醒":i===1?"人工确认转线索":"暂停入池",
    updated:i===0?"2026-06-15 18:40":i===1?"2026-06-12 10:20":"2026-06-01 09:00"
  }));
}
function lifecycleMini(currentIdx){
  const steps=["筹","上","运","停","下"];
  return `<span class="lifecycle-mini">${steps.map((s,idx)=>`<span class="ld ${idx<currentIdx?"done":idx===currentIdx?"current":""}" title="${["筹备","上线","运营","暂停","下线"][idx]}"></span>`).join("")}</span>`;
}
function lifecycleTrack(stage,status){
  const steps=[["筹备",0],["上线",1],["运营",2],["暂停",3],["下线",4]];
  return `<div class="lifecycle-track">${steps.map(([label,idx])=>{
    let cls = idx<stage?"done":idx===stage?"current":"";
    if(status==="已下线"&&idx===4) cls="offline current";
    if(status==="暂停"&&idx===3) cls="warn current";
    if(status==="运营中"&&idx===2) cls="current";
    return `<div class="lifecycle-step ${cls}"><div class="dot"></div>${label}</div>`;
  }).join("")}</div>`;
}
function channelBadges(channels){
  return `<div class="channel-badges">${channels.map(c=>`<span class="channel-dot ${c.err?"err":c.on?"on":"off"}">${c.name}${c.err?"!":c.on?"✓":"—"}</span>`).join("")}</div>`;
}
function apiStatusHtml(status){
  const cls = status==="正常"?"":status==="异常"?"err":"warn";
  return `<span class="api-status"><span class="api-dot ${cls}"></span>${status}</span>`;
}
function toggleSiteAdvanced(){
  siteMgmtAdvancedOpen = !siteMgmtAdvancedOpen;
  renderPage();
}
function toggleSiteRow(i,checked){
  if(checked) siteMgmtSelected.add(i); else siteMgmtSelected.delete(i);
  const bar = document.getElementById("siteBatchBar");
  const cnt = document.getElementById("siteBatchCount");
  if(bar){ bar.classList.toggle("show",siteMgmtSelected.size>0); if(cnt) cnt.textContent=siteMgmtSelected.size; }
}
function toggleSiteAll(checked){
  getSiteMgmtRows().forEach((_,i)=> checked ? siteMgmtSelected.add(i) : siteMgmtSelected.delete(i));
  renderPage();
}
function batchSiteAction(action){
  const n = siteMgmtSelected.size || getSiteMgmtRows().length;
  const map = {enable:"批量启用",pause:"批量暂停",offline:"批量下线",export:"批量导出",test:"批量测试接口"};
  toast(`${map[action]||action}：已处理 ${n} 个站点`);
  siteMgmtSelected.clear();
  renderPage();
}
function toggleSiteStatus(i,action){
  const row = getSiteMgmtRows()[i];
  const map = {enable:"启用",pause:"暂停",offline:"下线",resume:"恢复运营"};
  toast(`站点「${row.name}」已${map[action]||action}${action==="pause"?"，拉取频率自动切换为暂停拉取":""}`);
  renderPage();
}
function testSiteApi(i){
  const row = getSiteMgmtRows()[i];
  toast(row.apiStatus==="异常"?`站点「${row.name}」接口连接失败，请检查 Endpoint`:`站点「${row.name}」接口连通正常`);
}
function openSiteFlow(i){
  window._siteFlowIndex = i;
  openModal("siteFlow");
}
/**
 * PAGE ID: site-management
 * MODULE TYPE: list
 * OWNER DOMAIN: site
 */
function renderSiteManagementPage(){
  return `<div class="site-center-page">${siteTraceBannerHtml()}
    <div class="site-section" id="site-basic-info">${siteSectionTitle("基本信息")}${renderSiteBasicInfoSection()}</div>
    <div class="site-section" id="site-permissions">${siteSectionTitle("权限配置")}${renderSitePermissionsSection()}</div>
    <div class="site-section" id="site-data-config">${siteSectionTitle("数据配置")}${renderSiteDataConfigSection()}</div>
    <div class="site-section" id="site-logs">${siteSectionTitle("变更日志")}${renderSiteLogsSection()}</div>
  </div>`;
}
function renderSiteBasicInfoSection(){
  const allRows = getSiteMgmtRows();
  const pagerKey = "site-sites";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const readonly = currentRole==="访客";
  const canWrite = !readonly && (currentRole==="管理员"||currentRole==="运营专员");
  const operating = allRows.filter(r=>r.status==="运营中").length;
  const paused = allRows.filter(r=>r.status==="暂停").length;
  const apiErr = allRows.filter(r=>r.apiStatus==="异常").length;
  return `
  <div class="metrics">
    ${metric("运营中站点",operating,`共 ${allRows.length} 个站点`)}
    ${metric("暂停站点",paused,paused?"暂停站点停止拉取新线索":"—",paused?"warn":"")}
    ${metric("接口异常",apiErr,apiErr?"需检查 Endpoint 与认证":"全部正常",apiErr?"danger":"up")}
    ${metric("本月新增线索",allRows.reduce((a,r)=>a+r.leads,0),"按站点汇总","up")}
  </div>

  <div class="filters"><div class="filter-grid">
    <div class="field"><label>站点名称</label><input placeholder="站点名称 / 编号 / 域名"></div>
    <div class="field"><label>站点状态</label><select><option>全部</option><option>运营中</option><option>暂停</option><option>已下线</option></select></div>
    <div class="field"><label>数据源系统</label><select><option>全部</option><option>未迟建站</option><option>苏豪自有系统</option><option>其他</option></select></div>
    <div class="field"><label>接口状态</label><select><option>全部</option><option>正常</option><option>异常</option><option>未配置</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleSiteAdvanced()">${siteMgmtAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>

  <div class="filter-advanced ${siteMgmtAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>生命周期阶段</label><select><option>全部</option><option>筹备中</option><option>已上线</option><option>运营中</option><option>暂停</option><option>已下线</option></select></div>
    <div class="field"><label>渠道接入</label><select><option>全部</option><option>网站表单</option><option>邮件</option><option>WhatsApp</option><option>API拉取</option></select></div>
    <div class="field"><label>上线时间</label><input type="date"></div>
    <div class="field"><label>拉取频率</label><select><option>全部</option><option>每15分钟</option><option>每30分钟</option><option>每小时</option><option>暂停拉取</option></select></div>
    <div class="field"><label>归属部门</label><input placeholder="如 外贸事业部"></div>
    <div class="field"><label>流程方案</label><select><option>全部</option><option>自动分配+首响提醒</option><option>人工确认转线索</option><option>暂停入池</option></select></div>
    <div class="field"><label>最近更新</label><input type="date"></div>
    <div class="field"><label>负责人</label><input placeholder="运营专员 / 业务员"></div>
    <div class="head-actions"><button class="btn primary" onclick="openModal('siteFilter')">保存筛选视图</button></div>
  </div></div>

  ${renderBatchBar({
    id:"siteBatchBar",
    countId:"siteBatchCount",
    count:siteMgmtSelected.size,
    unit:"个站点",
    onCancel:"siteMgmtSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="batchSiteAction('enable')">批量启用</button><button type="button" class="btn small" onclick="batchSiteAction('pause')">批量暂停</button><button type="button" class="btn small" onclick="batchSiteAction('offline')">批量下线</button><button type="button" class="btn small" onclick="batchSiteAction('test')">批量测试接口</button>`:""}<button type="button" class="btn small" onclick="batchSiteAction('export')">批量导出</button>`
  })}

  <section class="panel"><div class="panel-head"><div class="panel-title">站点主数据与接入配置</div><div class="toolbar-actions">
    ${canWrite?`<button class="btn small" onclick="batchSiteAction('test')">测试全部接口</button>`:""}
    <button class="btn small" onclick="scrollSiteSection('site-permissions')">负责人配置</button>
    <button class="btn small" onclick="nav('site-stat')">站点统计</button>
    <button class="btn small" onclick="nav('channel-config')">来源管理</button>
  </div></div>
    <div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleSiteAll(this.checked)" ${siteMgmtSelected.size===allRows.length&&allRows.length?"checked":""}></th>`:""}
      <th>站点编号</th><th>站点名称</th><th>域名</th><th>生命周期</th><th>状态</th><th>数据源</th><th>渠道接入</th><th>上线时间</th><th>拉取频率</th><th>接口状态</th><th>最近拉取</th><th>负责人</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.map((s,i)=>{const gi=allRows.indexOf(s);return `<tr>
        ${canWrite?`<td><input type="checkbox" onchange="toggleSiteRow(${gi>=0?gi:i},this.checked)" ${siteMgmtSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
        <td>${s.id}</td>
        <td><strong>${s.name}</strong><br><span style="font-size:11px;color:var(--soft)">${s.flowName}</span></td>
        <td>${s.domain}</td>
        <td>${lifecycleMini(s.lifecycleStage)}<br><span style="font-size:11px;color:var(--soft)">${s.lifecycle}</span></td>
        <td>${tag(s.status)}</td>
        <td>${s.source}</td>
        <td>${channelBadges(s.channels)}</td>
        <td>${s.launchDate}</td>
        <td>${s.frequency}</td>
        <td>${apiStatusHtml(s.apiStatus)}</td>
        <td>${s.lastPull}</td>
        <td><span class="site-link" onclick="scrollSiteSection('site-permissions')">${s.operator}</span><br><span style="font-size:11px;color:var(--soft)">${s.seller}</span></td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openDrawer("sites",${gi>=0?gi:i})`},
          canWrite&&{label:"编辑",onclick:"openModal('site')"},
          canWrite&&s.status==="运营中"&&{label:"暂停",onclick:`toggleSiteStatus(${gi>=0?gi:i},'pause')`},
          canWrite&&s.status==="暂停"&&{label:"启用",onclick:`toggleSiteStatus(${gi>=0?gi:i},'resume')`,primary:true},
          {label:"测接口",onclick:`testSiteApi(${gi>=0?gi:i})`},
          canWrite&&{label:"流程配置",onclick:`openSiteFlow(${gi>=0?gi:i})`},
          {label:"统计",onclick:`selectedSiteStat='${s.name}';nav('site-stat')`}
        ].filter(Boolean),`site-${gi>=0?gi:i}`)}</td>
      </tr>`;}).join("")}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
function renderSitePermissionsSection(){
  const allRows = getSiteOwnerRows();
  const pagerKey = "site-owner";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const readonly = currentRole==="访客";
  const canWrite = !readonly && (currentRole==="管理员"||currentRole==="运营专员");
  const configured = allRows.filter(r=>r.operators.length&&r.sellers.length).length;
  const withCollab = allRows.filter(r=>r.collabs.length).length;
  return `
  <div class="metrics">
    ${metric("已配置站点",configured,`共 ${allRows.length} 个站点`)}
    ${metric("运营专员",allRows.reduce((a,r)=>a+r.operators.length,0),"按站点绑定")}
    ${metric("协同人",withCollab,"已授权监督站点",withCollab?"up":"")}
    ${metric("外贸业务员",allRows.reduce((a,r)=>a+r.sellers.length+r.extraSellers.length,0),"含主业务员与协作")}
  </div>

  <div class="filters"><div class="filter-grid">
    <div class="field"><label>站点</label><select><option>全部站点</option>${allRows.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>运营专员</label><input placeholder="姓名 / 账号"></div>
    <div class="field"><label>协同人</label><input placeholder="姓名 / 账号"></div>
    <div class="field"><label>外贸业务员</label><input placeholder="姓名 / 账号"></div>
    <div class="field"><label>生效状态</label><select><option>全部</option><option>生效中</option><option>待生效</option><option>已失效</option></select></div>
    <div class="head-actions"><button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button><button class="btn" onclick="toast('筛选条件已重置')">重置</button></div>
  </div></div>

  ${renderBatchBar({
    id:"siteOwnerBatchBar",
    countId:"siteOwnerBatchCount",
    count:siteOwnerSelected.size,
    unit:"个站点",
    onCancel:"siteOwnerSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="openModal('siteOwnerBatch')">批量调整负责人</button><button type="button" class="btn small" onclick="batchSiteOwnerAction('operator')">批量换运营</button><button type="button" class="btn small" onclick="batchSiteOwnerAction('collab')">批量换协同</button><button type="button" class="btn small" onclick="batchSiteOwnerAction('seller')">批量换业务员</button>`:""}<button type="button" class="btn small" onclick="batchSiteOwnerAction('export')">导出关系表</button>`
  })}

  <section class="panel"><div class="panel-head"><div class="panel-title">站点负责人及授权关系</div><div class="toolbar-actions">
    <button class="btn small" onclick="scrollSiteSection('site-basic-info')">站点主数据</button>
    <button class="btn small" onclick="openSiteOwnerPreview(0)">权限配置</button>
  </div></div>
    <div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleSiteOwnerAll(this.checked)" ${siteOwnerSelected.size===allRows.length&&allRows.length?"checked":""}></th>`:""}
      <th>站点</th><th>运营专员</th><th>协同人</th><th>外贸业务员</th><th>生效时间</th><th>权限范围</th><th>异常</th><th>更新时间</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.map((s,i)=>{const gi=allRows.indexOf(s);const idx=gi>=0?gi:i;return `<tr>
        ${canWrite?`<td><input type="checkbox" onchange="toggleSiteOwnerRow(${idx},this.checked)" ${siteOwnerSelected.has(idx)?"checked":""}></td>`:""}
        <td><strong>${s.name}</strong><br><span style="font-size:11px;color:var(--soft)">${s.domain} · ${tag(s.status)}</span></td>
        <td>${assignCell(s.operators,"运营专员",idx)}</td>
        <td>${assignCell(s.collabs,"协同人",idx)}</td>
        <td>${assignCell([...s.sellers,...s.extraSellers],"外贸业务员",idx)}</td>
        <td><strong style="font-size:12px">${s.effectiveFrom}</strong><br><span style="font-size:11px;color:var(--soft)">至 ${s.effectiveTo}</span></td>
        <td><span style="font-size:12px;line-height:1.5">${s.scope}</span><br><button class="btn small" style="margin-top:4px" onclick="openSiteOwnerPreview(${idx})">预览</button></td>
        <td>${s.exception==="无"?tag("正常"):`<span class="tag amber">${s.exception}</span>`}</td>
        <td>${s.updated}</td>
        <td>${renderRowActions([
          canWrite&&{label:"配置",onclick:`openSiteOwnerAuth(${idx},'all')`,primary:true},
          {label:"详情",onclick:`openDrawer("siteOwners",${idx})`},
          {label:"权限",onclick:`openSiteOwnerPreview(${idx})`}
        ].filter(Boolean),`site-owner-${idx}`)}</td>
      </tr>`;}).join("")}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
function renderSiteDataConfigSection(){
  return `<section class="panel"><div class="panel-head"><div class="panel-title">渠道接入概览</div><button class="btn small" onclick="nav('channel-config')">管理渠道</button></div><div class="panel-body"><div class="site-channel-grid">
      ${[["网站表单","3/3 站点已接入","实时推送 + 表单映射"],["邮件","3/3 站点已接入","多邮箱 IMAP 拉取"],["WhatsApp","2/3 站点已接入","Business API 实时入库"],["API 拉取","3/3 站点已配置","未迟建站 / 自有系统"]].map(c=>`<div class="site-channel-card"><strong>${c[0]}</strong><span>${c[1]}<br>${c[2]}</span></div>`).join("")}
    </div></div></section>`;
}
function renderSiteLogsSection(){
  const logs = getSiteOwnerLogs();
  return `<section class="panel"><div class="panel-head"><div class="panel-title">责任关系变更记录</div><button class="btn small" onclick="toast('已导出变更记录')">导出</button></div><div class="panel-body"><div class="change-log">
      <div class="change-row" style="font-weight:800;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:8px"><span>时间</span><span>站点</span><span>变更内容</span><span>操作人</span></div>
      ${logs.map(l=>`<div class="change-row"><span class="change-time">${l.time}</span><span><strong>${l.site}</strong><br><span class="change-action">${l.action}</span></span><span>${l.field}：${l.before} → <strong>${l.after}</strong><br><span style="color:var(--soft)">${l.reason}</span></span><span>${l.by}</span></div>`).join("")}
    </div></div></section>`;
}
/** @deprecated alias — site-owner 深链已合并至站点管理页分区 */
function renderSiteOwnerPage(){ return renderSiteManagementPage(); }
function getSiteOwnerRows(){
  const configs = [
    {operators:["刘运营"],collabs:["陈协同"],sellers:["张明远"],extraSellers:["李晓燕"],effectiveFrom:"2024-03-15",scope:"站点全量数据 + 分配/导出",scopeShort:"运营全量；业务员本人；协同监督"},
    {operators:["刘运营"],collabs:["周协同"],sellers:["李晓燕"],extraSellers:[],effectiveFrom:"2024-08-01",scope:"站点全量数据 + 分配",scopeShort:"运营全量；业务员本人；协同只读监督"},
    {operators:["赵运营"],collabs:[],sellers:["王芳"],extraSellers:[],effectiveFrom:"2025-01-10",scope:"历史只读 + 客户转移",scopeShort:"暂停站点历史查看与转移"}
  ];
  return datasets.sites.map((s,i)=>{
    const c = configs[i]||configs[0];
    return {
      ...s,
      operators:c.operators,
      collabs:c.collabs,
      sellers:c.sellers,
      extraSellers:c.extraSellers,
      effectiveFrom:c.effectiveFrom+" 00:00",
      effectiveTo:s.status==="暂停"?"持续有效（暂停站点）":"—",
      permScope:c.scope,
      scope:c.scopeShort,
      scopeDetail:{
        operator:"负责站点",
        collab:c.collabs.length?"监督协同":"—",
        seller:"本人数据",
        admin:"全站"
      },
      exception:i===2?"1 个线索因站点暂停进入异常队列":"无",
      updated:i===0?"2026-06-15 18:40":i===1?"2026-06-12 10:20":"2026-06-01 09:00"
    };
  });
}
function getSiteOwnerLogs(){
  return [
    {time:"2026-06-15 18:40",site:"天猫苏豪站",action:"协同人分配",field:"协同人",before:"—",after:"陈协同",by:"管理员",reason:"新增天猫站监督授权"},
    {time:"2026-06-12 10:20",site:"苏豪独立站A",action:"外贸业务员分配",field:"主业务员",before:"张明远",after:"李晓燕",by:"管理员",reason:"站点负责人轮岗调整"},
    {time:"2026-06-01 09:00",site:"苏豪独立站B",action:"运营专员分配",field:"运营专员",before:"刘运营",after:"赵运营",by:"管理员",reason:"站点暂停后运营交接"},
    {time:"2025-01-10 08:00",site:"苏豪独立站B",action:"生效时间变更",field:"生效时间",before:"2024-08-01",after:"2025-01-10",by:"系统",reason:"站点重新上线负责人同步"},
    {time:"2024-08-01 00:00",site:"苏豪独立站A",action:"初始授权",field:"全部角色",before:"—",after:"刘运营 / 周协同 / 李晓燕",by:"管理员",reason:"站点上线初始化"}
  ];
}
function assignCell(names,role,i){
  const readonly = currentRole==="访客"||currentRole==="外贸业务员"||currentRole==="协同人";
  const list = (names||[]).length ? names : ["—"];
  return `<div class="assign-cell">${list.map(n=>`<strong>${n}</strong>`).join("")}${names&&names.length?`<span class="assign-meta">${role}</span>`:""}${!readonly?`<button class="btn small" style="margin-top:2px;width:fit-content" onclick="openSiteOwnerAuth(${i},'${role}')">分配</button>`:""}</div>`;
}
function permPreviewHtml(siteIdx){
  const s = getSiteOwnerRows()[siteIdx]||getSiteOwnerRows()[0];
  const roles = [
    {role:"运营专员",person:(s.operators||[]).join("、")||"—",scope:s.scopeDetail.operator,perms:["查看","新增","编辑","分配","导出"],deny:[]},
    {role:"协同人",person:(s.collabs||[]).join("、")||"未配置",scope:s.scopeDetail.collab,perms:["查看","监督","带教记录"],deny:s.collabs.length?["分配","删除"]:["全部"]},
    {role:"外贸业务员",person:[...(s.sellers||[]),...(s.extraSellers||[])].join("、")||"—",scope:s.scopeDetail.seller,perms:["查看","编辑本人","跟进","写邮件"],deny:["分配","导出全量","删除他人"]},
    {role:"访客",person:"—",scope:"只读看板与指定页面",perms:["查看汇总"],deny:["全部写操作"]}
  ];
  return `<div class="summary-list" style="margin-bottom:12px">${kv("站点",s.name)}${kv("生效时间",s.effectiveFrom+" 起 "+s.effectiveTo)}</div>
  <div class="permission-preview">${roles.map(r=>`<div class="perm-role-card"><div class="perm-role-head"><span>${r.role} · ${r.person}</span>${tag(r.person==="—"||r.person==="未配置"?"未配置":"生效中")}</div><div class="perm-role-body"><div class="perm-tags">${r.perms.map(p=>`<span class="perm-tag">${p}</span>`).join("")}${r.deny.map(p=>`<span class="perm-tag deny">${p}</span>`).join("")}</div></div></div>`).join("")}</div>`;
}
function openSiteOwnerPreview(i){
  siteOwnerPreviewSite = i>=0?i:0;
  openModal("siteOwnerPreview");
}
function openSiteOwnerAuth(i,role){
  window._siteOwnerIndex = i;
  window._siteOwnerRole = role;
  openModal("siteOwnerAuth");
}
function toggleSiteOwnerRow(i,checked){
  if(checked) siteOwnerSelected.add(i); else siteOwnerSelected.delete(i);
  const bar = document.getElementById("siteOwnerBatchBar");
  const cnt = document.getElementById("siteOwnerBatchCount");
  if(bar){ bar.classList.toggle("show",siteOwnerSelected.size>0); if(cnt) cnt.textContent=siteOwnerSelected.size; }
}
function toggleSiteOwnerAll(checked){
  getSiteOwnerRows().forEach((_,i)=> checked ? siteOwnerSelected.add(i) : siteOwnerSelected.delete(i));
  renderPage();
}
function batchSiteOwnerAction(action){
  const n = siteOwnerSelected.size || 1;
  const map = {operator:"批量调整运营专员",collab:"批量调整协同人",seller:"批量调整外贸业务员",export:"导出负责人关系"};
  toast(`${map[action]||action}：已处理 ${n} 个站点`);
  siteOwnerSelected.clear();
  renderPage();
}
function getSiteStatsData(){
  const base = {
    "天猫苏豪站":{
      uv:"14,280", leads:128, customers:86, dealCustomers:34, pendingCustomers:18, amount:"$186,200", conversion:"26.6%", firstResponse:"5.2小时",
      validRate:"75%", contractCount:34, avgDeal:"$5,476", overdueTasks:3,
      channels:[["网站表单",52,100],["邮件",38,73],["WhatsApp",28,54],["API拉取",10,19]],
      funnel:[["询盘进入",128,100],["有效询盘",96,75],["转客户",58,45],["报价打样",42,33],["成交客户",34,27]],
      distribution:[["A类客户",34,100],["B类客户",28,82],["C类客户",16,47],["D类客户",8,24]],
      sellers:[["张明远","天猫苏豪站",68,22,9,"$112,800","18分钟"],["李晓燕","天猫苏豪站",36,8,6,"$43,600","42分钟"],["王芳","天猫苏豪站",24,4,3,"$29,800","35分钟"]],
      trend:[98,112,118,125,132,128]
    },
    "苏豪独立站A":{
      uv:"8,320", leads:82, customers:49, dealCustomers:18, pendingCustomers:12, amount:"$98,500", conversion:"22.0%", firstResponse:"7.8小时",
      validRate:"74%", contractCount:18, avgDeal:"$5,472", overdueTasks:2,
      channels:[["网站表单",34,100],["邮件",28,82],["WhatsApp",14,41],["API拉取",6,18]],
      funnel:[["询盘进入",82,100],["有效询盘",61,74],["转客户",34,41],["报价打样",26,32],["成交客户",18,22]],
      distribution:[["A类客户",18,100],["B类客户",17,94],["C类客户",9,50],["D类客户",5,28]],
      sellers:[["李晓燕","苏豪独立站A",44,11,7,"$58,400","38分钟"],["张明远","苏豪独立站A",22,5,3,"$24,600","22分钟"],["王芳","苏豪独立站A",16,2,2,"$15,500","48分钟"]],
      trend:[62,68,71,75,78,82]
    },
    "苏豪独立站B":{
      uv:"3,460", leads:44, customers:21, dealCustomers:6, pendingCustomers:9, amount:"$32,400", conversion:"13.8%", firstResponse:"16.4小时",
      validRate:"64%", contractCount:6, avgDeal:"$5,400", overdueTasks:5,
      channels:[["网站表单",18,100],["邮件",12,67],["WhatsApp",8,44],["API拉取",6,33]],
      funnel:[["询盘进入",44,100],["有效询盘",28,64],["转客户",15,34],["报价打样",10,23],["成交客户",6,14]],
      distribution:[["A类客户",6,100],["B类客户",7,100],["C类客户",5,83],["D类客户",3,50]],
      sellers:[["王芳","苏豪独立站B",26,4,5,"$21,600","52分钟"],["李晓燕","苏豪独立站B",12,1,3,"$7,800","44分钟"],["张明远","苏豪独立站B",6,1,1,"$3,000","28分钟"]],
      trend:[38,40,42,41,43,44]
    }
  };
  base["全部站点"] = {
    uv:"26,060", leads:254, customers:156, dealCustomers:58, pendingCustomers:39, amount:"$317,100", conversion:"22.8%", firstResponse:"8.9小时",
    validRate:"73%", contractCount:58, avgDeal:"$5,467", overdueTasks:10,
    channels:[["网站表单",104,100],["邮件",78,75],["WhatsApp",50,48],["API拉取",22,21]],
    funnel:[["询盘进入",254,100],["有效询盘",185,73],["转客户",107,42],["报价打样",78,31],["成交客户",58,23]],
    distribution:[["A类客户",58,100],["B类客户",52,90],["C类客户",30,52],["D类客户",16,28]],
    sellers:[["张明远","全部站点",96,28,13,"$140,400","18分钟"],["李晓燕","全部站点",92,20,16,"$109,800","42分钟"],["王芳","全部站点",66,10,10,"$66,900","35分钟"]],
    trend:[198,220,231,241,253,254]
  };
  return base;
}
function getSiteStatScope(){
  if(currentRole==="管理员"||currentRole==="协同人") return Object.keys(getSiteStatsData());
  if(currentRole==="运营专员") return ["全部站点","天猫苏豪站","苏豪独立站A"];
  if(currentRole==="外贸业务员") return ["全部站点","天猫苏豪站"];
  return ["全部站点","天猫苏豪站","苏豪独立站A","苏豪独立站B"];
}
function siteStatTrend(vals){
  const max = Math.max(...vals);
  const labels = ["1月","2月","3月","4月","5月","6月"];
  return labels.map((m,i)=>`<div class="trend-bar"><div class="bar-val">${vals[i]}</div><div class="bar-col" style="height:${Math.round(vals[i]/max*100)}%"></div><div class="bar-label">${m}</div></div>`).join("");
}
function filterSiteStatSellers(sellers){
  if(currentRole==="外贸业务员") return sellers.filter(s=>s[0]==="张明远");
  return sellers;
}
function toggleSiteStatAdvanced(){
  siteStatAdvancedOpen = !siteStatAdvancedOpen;
  renderPage();
}
function openSiteStatDetail(name){
  const keys = Object.keys(getSiteStatsData()).filter(k=>k!=="全部站点");
  const idx = keys.indexOf(name);
  if(idx>=0) openDrawer("siteStats",idx);
  else toast("暂无该站点明细");
}
/**
 * PAGE ID: site-stat
 * MODULE TYPE: analysis
 * OWNER DOMAIN: site
 */
function renderSiteStatPage(){
  const siteStats = getSiteStatsData();
  const scope = getSiteStatScope();
  if(!scope.includes(selectedSiteStat)) selectedSiteStat = scope[0]||"天猫苏豪站";
  const stat = siteStats[selectedSiteStat] || siteStats["天猫苏豪站"];
  const readonly = currentRole==="访客";
  const allRows = Object.entries(siteStats).filter(([name])=>name!=="全部站点"&&scope.includes(name)).map(([name,s])=>({name,...s}));
  const pagerKey = "site-stat-monthly";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const allSellers = filterSiteStatSellers(stat.sellers||[]);
  const sellerPagerKey = "site-stat-sellers";
  const {display:sellers} = sliceForPage(allSellers, sellerPagerKey);
  const periodLabel = siteStatPeriod==="自定义时间"?"2026-06-01 ~ 2026-06-22":siteStatMonth+(siteStatPeriod==="本季度"?"(Q2)":siteStatPeriod==="本周"?"(W25)":"");
  return `${renderAnalysisPageHead()}
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>站点</label><select onchange="changeSiteStat(this.value)">${scope.map(name=>`<option ${name===selectedSiteStat?"selected":""}>${name}</option>`).join("")}</select></div>
    <div class="field"><label>统计维度</label><select onchange="siteStatPeriod=this.value;renderPage()"><option ${siteStatPeriod==="本月"?"selected":""}>本月</option><option ${siteStatPeriod==="本季度"?"selected":""}>本季度</option><option ${siteStatPeriod==="本周"?"selected":""}>本周</option><option ${siteStatPeriod==="自定义时间"?"selected":""}>自定义时间</option></select></div>
    <div class="field"><label>统计时间</label><input type="text" value="${periodLabel}" placeholder="选择时间范围"></div>
    <div class="field"><label>对比基准</label><select><option>无上期对比</option><option>环比上月</option><option>同比去年</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleSiteStatAdvanced()">${siteStatAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('站点统计已刷新')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>

  <div class="filter-advanced ${siteStatAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>线索来源</label><select><option>全部</option><option>网站表单</option><option>邮件</option><option>WhatsApp</option><option>API拉取</option></select></div>
    <div class="field"><label>客户等级</label><select><option>全部</option><option>A类</option><option>B类</option><option>C类</option><option>D类</option></select></div>
    <div class="field"><label>业务员</label><input placeholder="按业务员筛选"></div>
    <div class="field"><label>首响超时</label><select><option>全部</option><option>仅超期站点</option><option>正常范围</option></select></div>
    <div class="field"><label>站点状态</label><select><option>全部</option><option>运营中</option><option>暂停</option></select></div>
    <div class="field"><label>合同同步</label><select><option>全部</option><option>已同步</option><option>待同步</option></select></div>
  </div></div>

  <div class="kpi-grid cols-4">
    ${metricDrill("站点 UV",stat.uv,selectedSiteStat,"")}
    ${metricDrill("询盘数",stat.leads,"有效率 "+stat.validRate,"up","lead-all")}
    ${metricDrill("客户数",stat.customers,"待跟进 "+stat.pendingCustomers,"","customer-profile")}
    ${metricDrill("成交客户",stat.dealCustomers,"合同 "+stat.contractCount+" 单","up","contract-list")}
    ${metricDrill("成交金额",stat.amount,"客单价 "+stat.avgDeal,"up")}
    ${metricDrill("转化率",stat.conversion,"线索→成交","up")}
    ${metricDrill("平均首响",stat.firstResponse,stat.overdueTasks?"超期任务 "+stat.overdueTasks+" 条":"达标",stat.overdueTasks?"warn":"up",stat.overdueTasks?"lead-pending":"")}
    ${metricDrill("有效询盘率",stat.validRate,"当前统计周期","up")}
  </div>

  <div class="wb-split">
    <section class="panel"><div class="panel-head"><div class="panel-title">询盘转化漏斗</div></div><div class="panel-body"><div class="funnel">
      ${stat.funnel.map(r=>funnelRow(r[0],r[1],r[2])).join("")}
    </div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">客户等级分布</div><button class="btn small" onclick="nav('customer-profile')">查看</button></div><div class="panel-body"><div class="funnel">
      ${stat.distribution.map(r=>funnelRow(r[0],r[1],r[2])).join("")}
    </div></div></section>
  </div>

  <div class="grid-2" style="margin-bottom:14px">
    <section class="panel"><div class="panel-head"><div class="panel-title">线索来源分布</div></div><div class="panel-body"><div class="funnel">
      ${(stat.channels||[]).map(r=>funnelRow(r[0],r[1],r[2])).join("")}
    </div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">询盘趋势</div><span style="font-size:12px;color:var(--soft)">${selectedSiteStat} · 近6月</span></div><div class="panel-body"><div class="trend-chart">${siteStatTrend(stat.trend||[])}</div></div></section>
  </div>

  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">业务员站点数据</div><div class="toolbar-actions"><button class="btn small" onclick="nav('site-owner')">负责人</button></div></div>
    <div class="table-wrap"><table><thead><tr><th>业务员</th><th>负责站点</th><th>询盘数</th><th>已成交客户</th><th>待跟进客户</th><th>成交金额</th><th>平均回复</th><th>操作</th></tr></thead><tbody>
      ${sellers.length?sellers.map((r,pi)=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]||"-"}</td><td>—</td></tr>`).join(""):`<tr><td colspan="8"><div class="empty">当前角色无业务员明细数据</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(sellerPagerKey,allSellers.length)}
  </section>

  <section class="panel"><div class="panel-head"><div class="panel-title">站点月度统计</div><div class="toolbar-actions">
    ${readonly?"":"<button class=\"btn small\" onclick=\"openModal('siteStatMonth')\">切换月份</button>"}
    <button class="btn small" onclick="nav('site-management')">站点管理</button>
  </div></div>
    <div class="table-wrap"><table><thead><tr><th>站点</th><th>UV</th><th>线索数</th><th>客户数</th><th>成交客户</th><th>成交金额</th><th>转化率</th><th>平均首响</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map(r=>`<tr style="cursor:pointer" onclick="changeSiteStat('${r.name}')"><td><strong>${r.name}</strong><br><span style="font-size:11px;color:var(--soft)">${datasets.sites.find(s=>s.name===r.name)?.status||"-"}</span></td><td>${r.uv}</td><td>${r.leads}</td><td>${r.customers}</td><td>${r.dealCustomers}</td><td>${r.amount}</td><td>${r.conversion}</td><td>${r.firstResponse}</td><td onclick="event.stopPropagation()">${renderRowActions([{label:"明细",onclick:`openSiteStatDetail('${r.name}')`}],`site-stat-${r.name}`)}</td></tr>`).join(""):`<tr><td colspan="9"><div class="empty">无可见站点数据，请调整筛选或联系管理员授权</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
function changeSiteStat(siteName){
  selectedSiteStat = siteName;
  renderPage();
}
function getMyLeadRows(){
  let rows = getMyLeadBaseRows();
  rows = applyLeadStatusTabFilter(rows,myLeadTab);
  if(myLeadIntentFilter) rows = rows.filter(r=>getLeadIntentLevel(r)===myLeadIntentFilter);
  if(myLeadTagFilter.length) rows = rows.filter(r=>leadMatchesTagFilter(r.id,myLeadTagFilter));
  return rows;
}
function toggleMyLeadRow(i,checked){
  if(checked) myLeadSelected.add(i); else myLeadSelected.delete(i);
  const bar = document.getElementById("myLeadBatchBar");
  const cnt = document.getElementById("myLeadBatchCount");
  if(bar){ bar.classList.toggle("show",myLeadSelected.size>0); if(cnt) cnt.textContent=myLeadSelected.size; }
}
function toggleMyLeadAll(checked){
  getMyLeadRows().forEach((_,i)=> checked ? myLeadSelected.add(i) : myLeadSelected.delete(i));
  renderPage();
}
function batchMyLeadAction(action){
  const n = myLeadSelected.size || 1;
  const map = {follow:"批量跟进",convert:"批量转客户",export:"批量导出",email:"批量发邮件"};
  toast(`${map[action]||action}：已处理 ${n} 条线索`);
  myLeadSelected.clear();
  renderPage();
}
function openMyLeadDrawer(i){
  const row = getMyLeadRows()[i];
  if(row) openDrawer("leads",row._idx);
}
function toggleLeadPoolAdvanced(){
  leadPoolAdvancedOpen = !leadPoolAdvancedOpen;
  renderPage();
}
function toggleLeadPoolRow(i,checked){
  if(checked) leadPoolSelected.add(i); else leadPoolSelected.delete(i);
  const bar = document.getElementById("leadPoolBatchBar");
  const cnt = document.getElementById("leadPoolBatchCount");
  if(bar){ bar.classList.toggle("show",leadPoolSelected.size>0); if(cnt) cnt.textContent=leadPoolSelected.size; }
}
function toggleLeadPoolAll(checked){
  getLeadPoolRows().forEach((_,i)=> checked ? leadPoolSelected.add(i) : leadPoolSelected.delete(i));
  renderPage();
}
function batchLeadPoolAction(action){
  const n = leadPoolSelected.size || 1;
  if(action==="invalid"){
    const idxs=[...leadPoolSelected];
    let cnt=0;
    (idxs.length?idxs:getLeadPoolRows().map((_,i)=>i).slice(0,1)).forEach(li=>{
      const row=getLeadPoolRows()[li];
      if(row&&markLeadAbnormal(row._idx,"其他","批量标记异常")) cnt++;
    });
    toast(`已标记 ${cnt||n} 条线索为异常`);
  } else if(action==="assign"){
    openModal("assign");
    return;
  } else {
    const map = {export:"批量导出",invalid:"批量标记无效",recycle:"批量回收"};
    toast(`${map[action]||action}：已处理 ${n} 条线索`);
  }
  leadPoolSelected.clear();
  renderPage();
}
function openLeadAssignModal(datasetIdx){
  window._drawerLeadIdx=datasetIdx;
  openModal("assign");
}
function openLeadEditModal(datasetIdx){
  window._drawerLeadIdx=datasetIdx;
  openModal("edit");
}
function getLeadEditTarget(){
  if(window._drawerLeadIdx!=null) return datasets.leads[window._drawerLeadIdx]||null;
  return null;
}
function leadCaptureToSourceOption(capture){
  const map={"自动生成":"网站表单","邮件识别":"邮件","邮件转线索":"邮件","会话识别":"WhatsApp","接口入池":"接口拉取","手工录入":"手动录入","手动录入":"手动录入"};
  return map[capture]||capture||"网站表单";
}
function renderLeadFormHtml(lead){
  const isEdit=!!lead;
  const siteOpts=datasets.sites.map(s=>`<option ${lead&&s.name===lead.site?"selected":""}>${s.name}</option>`).join("");
  const channel=lead?.channel||leadChannelLabel(lead)||LEAD_SOURCE_CHANNELS[0];
  const channelOpts=LEAD_SOURCE_CHANNELS.map(c=>`<option ${c===channel?"selected":""}>${c}</option>`).join("");
  const captureOpt=leadCaptureToSourceOption(lead?.capture||lead?.source);
  const captureOpts=["网站表单","邮件","WhatsApp","接口拉取","手动录入"].map(c=>`<option ${c===captureOpt?"selected":""}>${c}</option>`).join("");
  const bizStatus=lead?getLeadBizStatus(lead):"待跟进";
  const bizStage=lead?getLeadBizStage(lead):"首次联系";
  const intentLv=lead?getLeadIntentLevel(lead):"中意向";
  const statusOpts=LEAD_BIZ_STATUSES.map(s=>`<option ${s===bizStatus?"selected":""}>${s}</option>`).join("");
  const stageOpts=LEAD_BIZ_STAGES.map(s=>`<option ${s===bizStage?"selected":""}>${s}</option>`).join("");
  const intentOpts=LEAD_INTENT_LEVELS.map(s=>`<option ${s===intentLv?"selected":""}>${s}</option>`).join("");
  const ownerVal=lead?.owner&&lead.owner!=="-"&&lead.owner!=="—"?lead.owner:"未分配";
  const ownerOpts=["未分配","张明远","李晓燕","王芳"].map(o=>`<option ${o===ownerVal?"selected":""}>${o}</option>`).join("");
  const esc=v=>String(v??"").replace(/"/g,"&quot;");
  return `<div class="form-grid">
    ${isEdit?`<div class="field span-2"><label>线索编号</label><input value="${esc(lead.id)}" readonly></div>`:""}
    <div class="field" data-field="site"><label>所属站点 <span style="color:var(--danger)">*</span></label><select>${siteOpts}</select><div class="form-feedback"></div></div>
    <div class="field" data-field="source"><label>来源渠道</label><select>${channelOpts}</select></div>
    <div class="field" data-field="capture"><label>采集方式</label><select>${captureOpts}</select></div>
    <div class="field" data-field="name"><label>客户名称 <span style="color:var(--danger)">*</span></label><input value="${esc(lead?.name)}" placeholder="如 Global Trade Co."><div class="form-feedback"></div></div>
    <div class="field" data-field="contact"><label>联系邮箱/账号 <span style="color:var(--danger)">*</span></label><input value="${esc(lead?.contact)}" placeholder="邮箱、WhatsApp 或其他账号"><div class="form-feedback"></div></div>
    <div class="field" data-field="country"><label>国家/地区</label><input value="${esc(lead?.country)}" placeholder="如 美国"></div>
    <div class="field" data-field="intent"><label>产品意向</label><input value="${esc(lead?.intent)}" placeholder="如 羊毛系列、开司米围巾"></div>
    <div class="field" data-field="leadBizStatus"><label>状态</label><select onchange="toggleLeadEditStageField(this.value)">${statusOpts}</select></div>
    <div class="field" id="leadEditStageField" data-field="leadBizStage" style="${bizStatus==="跟进中"?"":"display:none"}"><label>阶段</label><select>${stageOpts}</select></div>
    <div class="field" data-field="leadIntentLevel"><label>意向等级</label><select>${intentOpts}</select></div>
    <div class="field" data-field="owner"><label>负责人</label><select>${ownerOpts}</select></div>
    <div class="field span-2" data-field="inquiryNote"><label>原始询盘内容</label><textarea rows="4" placeholder="粘贴网站表单、邮件或聊天原文摘要">${esc(lead?.inquiryNote||lead?.summary||"")}</textarea></div>
  </div>`;
}
function openLeadPoolDrawer(i){
  const row = getLeadPoolRows()[i];
  if(row) openDrawer("leads",row._idx);
}
/**
 * PAGE ID: lead-all
 * MODULE TYPE: list
 * OWNER DOMAIN: leads
 */
function renderLeadAllPage(){
  const allRows = getLeadPoolRows();
  const pagerKey = `lead-pool-${normalizeLeadStatusTab(leadPoolTab)}`;
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const readonly = currentRole==="访客";
  const canAssign = !readonly && currentRole!=="协同人" && (currentRole==="管理员"||currentRole==="运营专员"||currentRole==="外贸业务员");
  const canMarkAbnormal = !readonly && currentRole!=="协同人";
  return `${renderLeadPoolTabs()}
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>站点</label><select><option>全部可见站点</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>创建时间</label><input type="date"></div>
    <div class="field"><label>线索关键词</label><input placeholder="线索编号、客户名称、邮箱"></div>
    <div class="field"><label>分配状态</label><select><option>全部</option><option>未分配</option><option>已分配</option></select></div>
    ${renderLeadBizFilterFields("pool")}
    <div class="head-actions">
      <button class="btn" onclick="toggleLeadPoolAdvanced()">${leadPoolAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${rows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>

  <div class="filter-advanced ${leadPoolAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>来源渠道</label><select>${leadSourceFilterOptions()}</select></div>
    <div class="field"><label>国家/地区</label><input placeholder="国家"></div>
    <div class="field"><label>入池方式</label><select><option>全部</option><option>自动生成</option><option>邮件识别</option><option>会话识别</option><option>接口入池</option><option>手工录入</option></select></div>
    <div class="field"><label>进入时长</label><select><option>全部</option><option>1小时内</option><option>超2小时</option><option>超1天</option></select></div>
    <div class="field"><label>分配规则</label><select><option>全部</option><option>待运营分配</option><option>进入公共线索池</option><option>自动分配</option></select></div>
    <div class="field"><label>公海类型</label><select><option>全部</option><option>未分配</option><option>已回收</option><option>超时释放</option><option>即将过期</option></select></div>
    ${renderLeadPoolTimeStatusSelect()}
    ${renderLeadPoolStatusFiltersClear()}
    ${leadTagFilterField("pool",leadPoolTagFilter)}
  </div></div>

  ${renderBatchBar({
    id:"leadPoolBatchBar",
    countId:"leadPoolBatchCount",
    count:leadPoolSelected.size,
    unit:"条线索",
    onCancel:"leadPoolSelected.clear();renderPage()",
    actions:`${canAssign?`<button type="button" class="btn small primary" onclick="openModal('assign')">批量分配</button>`:""}${!readonly&&currentRole!=="协同人"?`<button type="button" class="btn small" onclick="openLeadTagBatchModal('add','pool')">添加标签</button><button type="button" class="btn small" onclick="openLeadTagBatchModal('remove','pool')">移除标签</button>`:""}<button type="button" class="btn small" onclick="batchLeadPoolAction('export')">批量导出</button>${canAssign?`<button type="button" class="btn small danger" onclick="batchLeadPoolAction('invalid')">标记无效</button>`:""}`
  })}

  <section class="panel"><div class="table-wrap"><table class="lead-pool-table"><thead><tr>
      ${!readonly?`<th class="no-row-click"><input type="checkbox" onchange="toggleLeadPoolAll(this.checked)" ${leadPoolSelected.size===rows.length&&rows.length?"checked":""}></th>`:""}
      <th>线索名称</th><th>来源</th><th>公海类型</th><th>意向等级</th><th>标签</th><th>入池时长</th><th>创建时间</th><th class="no-row-click">操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);return `<tr class="row-clickable" onclick="openLeadPoolDrawer(${gi>=0?gi:i})">
        ${!readonly?`<td class="no-row-click" onclick="event.stopPropagation()"><input type="checkbox" onchange="toggleLeadPoolRow(${gi>=0?gi:i},this.checked)" ${leadPoolSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
        <td><strong>${r.name}</strong><br><span style="font-size:11px;color:var(--soft)">${r.id}</span></td>
        <td>${tag(leadChannelLabel(r))}</td>
        <td>${leadPoolTypeTag(r)}</td>
        <td>${leadIntentLevelTag(r)}</td>
        <td>${leadTagsCellHtml(r.id)}</td>
        <td>${r.age||"—"}</td>
        <td>${r.inquiryTime||"—"}</td>
        <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
          {label:"详情",onclick:`openLeadPoolDrawer(${gi>=0?gi:i})`},
          canAssign&&{label:"分配",onclick:`openLeadAssignModal(${r._idx})`,primary:true},
          canMarkAbnormal&&{label:"标记异常",onclick:`event.stopPropagation();openMarkLeadAbnormalFromPool(${gi>=0?gi:i})`,danger:true},
          !readonly&&currentRole!=="协同人"&&{label:"打标",onclick:`event.stopPropagation();openLeadTagModal(${r._idx})`},
          !readonly&&{label:"编辑",onclick:`openLeadEditModal(${r._idx})`}
        ].filter(Boolean),`lead-pool-${gi>=0?gi:i}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${readonly?11:12}"><div class="empty">公海池暂无可分配线索</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length,"点击行或客户名称查看线索详情")}
  </section>`;
}
function getCustomerContractRows(customerName){
  return datasets.contracts.filter(c=>c.customer===customerName).sort((a,b)=>b.date.localeCompare(a.date));
}
function formatContractTotalAmount(rows){
  if(!rows.length) return "—";
  const groups={};
  rows.forEach(c=>{
    const m=String(c.amount||"").match(/^([^\d\s-]+)?([\d,]+(?:\.\d+)?)/);
    const sym=m?.[1]||"";
    const num=parseFloat((m?.[2]||"0").replace(/,/g,""))||0;
    groups[sym]=(groups[sym]||0)+num;
  });
  return Object.entries(groups).map(([sym,total])=>{
    const formatted=total>=1000?total.toLocaleString("en-US",{maximumFractionDigits:0}):String(total);
    return `${sym}${formatted}`;
  }).join(" + ")||"—";
}
function getCustomerContractSummary(customerName){
  const rows=getCustomerContractRows(customerName);
  const latest=rows[0];
  return {
    count:rows.length,
    totalAmount:formatContractTotalAmount(rows),
    latestSignDate:latest?.date||"—",
    latestContractId:latest?.id||"—"
  };
}
function displayContractState(state,row){
  if(state==="已终止") return "已终止";
  if(state==="已完成") return "已完成";
  if(state==="已签约") return row?.latestDeal&&row.latestDeal!=="-"?"已完成":"生效中";
  if(row?.latestDeal&&row.latestDeal!=="-") return "已完成";
  return "生效中";
}
function contractStateTag(state,row){
  const label=displayContractState(state,row&&typeof row==="object"?row:null);
  if(label==="生效中") return `<span class="tag green">生效中</span>`;
  if(label==="已完成") return `<span class="tag blue">已完成</span>`;
  if(label==="已终止") return `<span class="tag gray">已终止</span>`;
  return tag(label);
}
function customerContractStateTag(state,row){
  return contractStateTag(state,row);
}
function customerContractRecordCell(c){
  const parts=[c.seller&&c.seller!=="-"?`负责人 ${c.seller}`:"",c.latestDeal&&c.latestDeal!=="-"?`最近成交 ${c.latestDeal}`:""].filter(Boolean);
  return parts.length?`<span style="font-size:12px;line-height:1.5">${parts.join(" · ")}</span>`:"—";
}
function openCustomerContractDrawer(idx){
  window._contractDrawerCustomerView=true;
  openDrawer("contracts",idx);
}
function customerContractDrawerBody(data,related,custIdx,canWrite){
  return `${drawerSection("合同信息",`<div class="detail-grid">${[["id","合同编号"],["site","合同名称"],["customer","关联客户"],["amount","合同金额"],["date","签约时间"],["state","合同状态"],["seller","负责人"]].map(([k,l])=>`<div class="detail-cell"><label>${l}</label><strong>${k==="state"?contractStateTag(data.state,data):formatCell(data[k],k,data)}</strong></div>`).join("")}</div>`)}
    ${contractDrawerTimeline(data)}
    ${drawerSection("合作记录",`${kv("签约时间",data.date||"—")}${kv("最近成交",data.latestDeal&&data.latestDeal!=="-"?data.latestDeal:"—")}${kv("合同状态",contractStateTag(data.state,data))}${kv("负责人",data.seller||"—")}${data.attachment&&data.attachment!=="无附件"?kv("附件",data.attachment):""}`)}
    ${custIdx>=0?drawerSection("关联客户",`${kv("客户名称",data.customer||"-")}${kv("同客户合同数",related.length+" 份")}${kv("累计金额",formatContractTotalAmount(related))}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small" onclick="closeDrawer();openDrawer('customers',${custIdx},{keepDetailTab:true,detailTab:'orders'})">返回客户合同</button></div>`):""}
    ${related.length>1?drawerSection("同客户其他合同",`<div class="table-wrap"><table class="todo-table"><thead><tr><th>合同编号</th><th>合同金额</th><th>签约时间</th><th>合同状态</th></tr></thead><tbody>${related.filter(c=>c.id!==data.id).map(c=>`<tr style="cursor:pointer" onclick="openCustomerContractDrawer(${datasets.contracts.indexOf(c)})"><td>${c.id}</td><td>${c.amount}</td><td>${c.date}</td><td>${contractStateTag(c.state,c)}</td></tr>`).join("")}</tbody></table></div>`):""}
    ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="closeDrawer();openModal('contract')">新增合同</button><button class="btn small" onclick="closeDrawer();openModal('follow')">录入跟进</button></div>`):""}`;
}
function contractPeriodCell(date,latestDeal){
  return `<div style="font-size:13px;line-height:1.55;white-space:nowrap">
    <div><span style="color:var(--soft);font-size:11px;margin-right:4px">开始</span>${date||"—"}</div>
    <div style="margin-top:2px"><span style="color:var(--soft);font-size:11px;margin-right:4px">结束</span>${latestDeal&&latestDeal!=="-"?latestDeal:"—"}</div>
  </div>`;
}
function contractDrawerTimeline(data){
  const items=[
    data.date&&{time:data.date,title:"合同签署",summary:`${data.id||"—"} · ${data.amount||"—"} · 负责人 ${data.seller||"—"}`},
    data.latestDeal&&data.latestDeal!=="-"&&{time:data.latestDeal,title:"最近成交",summary:`金额 ${data.amount||"—"}`}
  ].filter(Boolean);
  if(!items.length) return "";
  return drawerSection("合同轨迹",`<div class="timeline">${items.map(e=>`<div class="time-item"><div class="time-title">${e.title}</div><div class="time-meta">${e.time}</div><div class="time-text">${e.summary}</div></div>`).join("")}</div>`);
}
function getContractRows(){
  let rows = datasets.contracts.map((c,i)=>({...c,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(c=>c.seller==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(c=>c.site.includes("天猫")||c.site.includes("独立站A"));
  else if(currentRole==="协同人") rows = rows.filter(c=>c.site.includes("天猫")||c.site.includes("独立站"));
  return rows.sort((a,b)=>b.date.localeCompare(a.date));
}
function getContractCustomerRows(){
  let rows = datasets.contractCustomers.map((r,i)=>({...r,_idx:i,customerIdx:datasets.customers.findIndex(c=>c.id===r.customerId||c.name===r.customer)}));
  if(currentRole==="外贸业务员") rows = rows.filter(r=>r.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(r=>r.site.includes("天猫")||r.site.includes("独立站A"));
  else if(currentRole==="协同人") rows = rows.filter(r=>r.risk!=="无"||r.contracts===0);
  return rows;
}
function toggleContractAdvanced(){ contractAdvancedOpen=!contractAdvancedOpen; renderPage(); }
function toggleContractCustomerAdvanced(){ contractCustomerAdvancedOpen=!contractCustomerAdvancedOpen; renderPage(); }
function toggleContractRow(i,checked){ if(checked) contractSelected.add(i); else contractSelected.delete(i); renderPage(); }
function toggleContractAll(checked){ getContractRows().forEach((_,i)=> checked?contractSelected.add(i):contractSelected.delete(i)); renderPage(); }
function batchContractAction(action){ toast(`${{export:"批量导出",relink:"批量编辑"}[action]||action}：已处理 ${contractSelected.size||1} 条合同`); contractSelected.clear(); renderPage(); }
function openContractDrawer(i){ const r=getContractRows()[i]; if(r) openDrawer("contracts",r._idx); }
function openContractCustomerDrawer(i){
  const r=getContractCustomerRows()[i];
  if(r&&r.customerIdx>=0) openDrawer("customers",r.customerIdx);
  else toast("客户未找到");
}
function openCustomerContracts(i){
  const r=getContractCustomerRows()[i];
  const c=datasets.contracts.find(x=>x.customer===r.customer);
  if(c) openDrawer("contracts",datasets.contracts.indexOf(c));
  else toast("该客户暂无合作合同");
}
/**
 * PAGE ID: contract-list
 * MODULE TYPE: list
 * OWNER DOMAIN: contracts
 */
function renderContractListPage(){
  const allRows=getContractRows();
  const {display:rows}=sliceForPage(allRows,"contract-list");
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  return `
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>合同编号</label><input placeholder="PC-2026-xxxx"></div>
    <div class="field"><label>客户名称</label><input placeholder="客户名称/邮箱"></div>
    <div class="field"><label>签约日期</label><input type="date"></div>
    <div class="field"><label>合同状态</label><select><option>全部</option><option>生效中</option><option>已完成</option><option>已终止</option></select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleContractAdvanced()">${contractAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${rows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${contractAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>站点</label><select><option>全部可见站点</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>关联线索</label><input placeholder="LEAD-2026-xxxx（可选）"></div>
  </div></div>
  ${renderBatchBar({
    count:contractSelected.size,
    unit:"条合同",
    onCancel:"contractSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="batchContractAction('relink')">批量编辑</button>`:""}<button type="button" class="btn small" onclick="batchContractAction('export')">批量导出</button>`
  })}
  <section class="panel"><div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleContractAll(this.checked)"></th>`:""}
      <th>合同编号</th><th>合同名称</th><th>客户</th><th>金额</th><th>签约日期</th><th>合同状态</th><th>负责人</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((c,i)=>{const gi=allRows.indexOf(c);return `<tr class="row-clickable" onclick="openContractDrawer(${gi>=0?gi:i})">
        ${canWrite?`<td class="no-row-click" onclick="event.stopPropagation()"><input type="checkbox" onchange="toggleContractRow(${gi>=0?gi:i},this.checked)" ${contractSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
        <td><strong>${c.id}</strong></td>
        <td><strong>${c.site||"—"}</strong></td>
        <td><strong>${c.customer}</strong></td>
        <td><strong style="font-variant-numeric:tabular-nums">${c.amount}</strong></td>
        <td>${c.date}</td>
        <td>${contractStateTag(c.state,c)}</td>
        <td>${c.seller}</td>
        <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
          {label:"详情",onclick:`openContractDrawer(${gi>=0?gi:i})`},
          canWrite&&{label:"编辑金额",onclick:"openModal('contractEditAmount')"},
          canWrite&&{label:"编辑",onclick:"openModal('contract')"},
          {label:"客户→",onclick:"nav('customer-profile')"}
        ].filter(Boolean),`contract-${gi>=0?gi:i}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?9:8}"><div class="empty">暂无合同记录，可通过「新增合同」录入已签署合同</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager("contract-list",allRows.length)}
  </section>`;
}
/**
 * PAGE ID: contract-list
 * MODULE TYPE: list
 * OWNER DOMAIN: contracts
 * @deprecated 客户维度已迁移至客户详情，保留别名以兼容 contract-customer 路由
 */
function renderContractCustomerPage(){
  return renderContractListPage();
}
function isTaskOverdue(s){
  return (s||"").includes("已超期");
}
function getTaskRows(){
  let rows = datasets.tasks.map((t,i)=>({...t,_idx:i})).filter(t=>t.owner&&t.owner!=="-");
  if(currentRole==="外贸业务员") rows = rows.filter(t=>t.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(t=>t.site.includes("天猫")||t.site.includes("独立站A"));
  else if(currentRole==="协同人") rows = rows.filter(t=>isTaskOverdue(t.overdue)||t.priority==="高");
  return rows;
}
function toggleLeadTaskAdvanced(){
  leadTaskAdvancedOpen = !leadTaskAdvancedOpen;
  renderPage();
}
function toggleLeadTaskRow(i,checked){
  if(checked) leadTaskSelected.add(i); else leadTaskSelected.delete(i);
  const bar = document.getElementById("leadTaskBatchBar");
  const cnt = document.getElementById("leadTaskBatchCount");
  if(bar){ bar.classList.toggle("show",leadTaskSelected.size>0); if(cnt) cnt.textContent=leadTaskSelected.size; }
}
function toggleLeadTaskAll(checked){
  getTaskRows().forEach((_,i)=> checked ? leadTaskSelected.add(i) : leadTaskSelected.delete(i));
  renderPage();
}
function batchLeadTaskAction(action){
  const n = leadTaskSelected.size || 1;
  const map = {follow:"批量跟进",remind:"批量催办",export:"批量导出",transfer:"批量转移"};
  toast(`${map[action]||action}：已处理 ${n} 条任务`);
  leadTaskSelected.clear();
  renderPage();
}
function openTaskDrawer(i){
  const row = getTaskRows()[i];
  if(row) openDrawer("tasks",row._idx);
}
function completeTask(i){
  const row = getTaskRows()[i];
  toast(`任务 ${row?.id||""} 已完成，跟进内容将沉淀至跟进日志`);
  openModal("follow");
}
function completeTaskById(id){
  const row = datasets.tasks.find(t=>t.id===id);
  toast(`任务 ${row?.id||id} 已完成，跟进内容将沉淀至跟进日志`);
  openModal("follow");
}
/**
 * PAGE ID: lead-pending
 * MODULE TYPE: list
 * OWNER DOMAIN: leads
 */
function renderLeadPendingPage(){
  const allRows = getMyLeadRows();
  const pagerKey = `my-lead-${normalizeLeadStatusTab(myLeadTab)}`;
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const tabNorm = normalizeLeadStatusTab(myLeadTab);
  const isLostTab = tabNorm === "lost";
  const isWonTab = tabNorm === "won";
  const readonly = currentRole==="访客";
  const canWrite = !readonly && currentRole!=="访客" && currentRole!=="协同人";
  const emptyHtml = `<div class="empty">暂无符合条件的线索<br><span style="font-size:12px;color:var(--soft)">调整筛选条件后重试</span></div>`;
  const colCount = (canWrite ? 1 : 0) + (isLostTab || isWonTab ? 7 : 10);
  const thead = isLostTab
    ? `<tr>${canWrite?`<th class="no-row-click"><input type="checkbox" onchange="toggleMyLeadAll(this.checked)" ${myLeadSelected.size===rows.length&&rows.length?"checked":""}></th>`:""}<th>线索名称</th><th>来源</th><th>流失原因</th><th>最近跟进</th><th>负责人</th><th>创建时间</th><th class="no-row-click">操作</th></tr>`
    : isWonTab
    ? `<tr>${canWrite?`<th class="no-row-click"><input type="checkbox" onchange="toggleMyLeadAll(this.checked)" ${myLeadSelected.size===rows.length&&rows.length?"checked":""}></th>`:""}<th>线索名称</th><th>来源</th><th>成交时间</th><th>合同编号</th><th>负责人</th><th>创建时间</th><th class="no-row-click">操作</th></tr>`
    : `<tr>${canWrite?`<th class="no-row-click"><input type="checkbox" onchange="toggleMyLeadAll(this.checked)" ${myLeadSelected.size===rows.length&&rows.length?"checked":""}></th>`:""}<th>线索名称</th><th>来源</th><th>负责人</th><th>状态</th><th>阶段</th><th>意向等级</th><th>标签</th><th>最近跟进</th><th>创建时间</th><th class="no-row-click">操作</th></tr>`;
  const tbody = rows.length ? rows.map((r,i)=>{
    const gi=allRows.indexOf(r);
    const rowActions=renderRowActions([
      canWrite&&{label:"跟进",onclick:"openModal('follow')",primary:true},
      canWrite&&{label:"打标",onclick:`event.stopPropagation();openLeadTagModal(${r._idx})`},
      canWrite&&{label:"编辑",onclick:`openLeadEditModal(${r._idx})`},
      canWrite&&!isLostTab&&!isWonTab&&{label:"转客户",onclick:"openModal('assign')"},
      canWrite&&!isLostTab&&!isWonTab&&{label:"标记异常",onclick:`openMarkLeadAbnormalFromMy(${gi>=0?gi:i})`,danger:true},
      {label:"详情",onclick:`openMyLeadDrawer(${gi>=0?gi:i})`},
      canWrite&&!isLostTab&&!isWonTab&&{label:"沟通",onclick:`openLeadCommunicationCenterFromLeadRow(${gi>=0?gi:i},'my')`},
      canWrite&&!isLostTab&&!isWonTab&&{label:"WhatsApp",onclick:"nav('whatsapp-chat')"}
    ].filter(Boolean),`my-lead-${gi>=0?gi:i}`);
    const cells = isLostTab
      ? `<td><strong>${r.name}</strong><br><span style="font-size:11px;color:var(--soft)">${r.id}</span></td>
        <td>${tag(leadChannelLabel(r))}</td>
        <td>${tag(getLeadLostReason(r))}</td>
        <td>${getLeadLastFollowTime(r)}</td>
        <td>${r.owner||"—"}</td>
        <td>${r.inquiryTime||"—"}</td>`
      : isWonTab
      ? (()=>{const deal=getLeadDealSummary(r);return `<td><strong>${r.name}</strong><br><span style="font-size:11px;color:var(--soft)">${r.id}</span></td>
        <td>${tag(leadChannelLabel(r))}</td>
        <td>${deal.dealTime}</td>
        <td><strong style="font-size:12px">${deal.contract}</strong></td>
        <td>${r.owner||"—"}</td>
        <td>${r.inquiryTime||"—"}</td>`;})()
      : `<td><strong>${r.name}</strong><br><span style="font-size:11px;color:var(--soft)">${r.id}</span></td>
        <td>${tag(leadChannelLabel(r))}</td>
        <td>${r.owner||"—"}</td>
        <td>${leadBizStatusTag(r)}</td>
        <td>${leadBizStageCell(r)}</td>
        <td>${leadIntentLevelTag(r)}</td>
        <td>${leadTagsCellHtml(r.id)}</td>
        <td>${getLeadLastFollowTime(r)}</td>
        <td>${r.inquiryTime||"—"}</td>`;
    return `<tr class="row-clickable" onclick="openMyLeadDrawer(${gi>=0?gi:i})">
      ${canWrite?`<td class="no-row-click" onclick="event.stopPropagation()"><input type="checkbox" onchange="toggleMyLeadRow(${gi>=0?gi:i},this.checked)" ${myLeadSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
      ${cells}
      <td class="no-row-click" onclick="event.stopPropagation()">${rowActions}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="${colCount}">${emptyHtml}</td></tr>`;
  return `${renderMyLeadTabs()}
  ${renderMyLeadStats()}
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>站点</label><select><option>全部可见站点</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>创建时间</label><input type="date"></div>
    <div class="field"><label>线索关键词</label><input placeholder="线索编号、客户名称、邮箱"></div>
    ${renderLeadBizFilterFields("my")}
    <div class="head-actions">
      <button class="btn" onclick="toggleLeadTaskAdvanced()">${leadTaskAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${rows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>

  <div class="filter-advanced ${leadTaskAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>来源渠道</label><select>${leadSourceFilterOptions()}</select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    ${leadTagFilterField("my",myLeadTagFilter)}
  </div></div>

  ${renderBatchBar({
    id:"myLeadBatchBar",
    countId:"myLeadBatchCount",
    count:myLeadSelected.size,
    unit:"条线索",
    onCancel:"myLeadSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="batchMyLeadAction('follow')">批量跟进</button><button type="button" class="btn small" onclick="openModal('assign')">批量转客户</button><button type="button" class="btn small" onclick="openLeadTagBatchModal('add','my')">添加标签</button><button type="button" class="btn small" onclick="openLeadTagBatchModal('remove','my')">移除标签</button><button type="button" class="btn small" onclick="openModal('compose')">批量发邮件</button>`:""}<button type="button" class="btn small" onclick="batchMyLeadAction('export')">批量导出</button>`
  })}

  <section class="panel"><div class="table-wrap"><table class="lead-tag-table"><thead><tr>
      ${canWrite?`<th class="no-row-click"><input type="checkbox" onchange="toggleMyLeadAll(this.checked)" ${myLeadSelected.size===rows.length&&rows.length?"checked":""}></th>`:""}
      <th>线索名称</th><th>来源</th><th>负责人</th><th>状态</th><th>阶段</th><th>意向等级</th><th>标签</th><th>最近跟进</th><th>创建时间</th><th class="no-row-click">操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);return `<tr class="row-clickable" onclick="openMyLeadDrawer(${gi>=0?gi:i})">
        ${canWrite?`<td class="no-row-click" onclick="event.stopPropagation()"><input type="checkbox" onchange="toggleMyLeadRow(${gi>=0?gi:i},this.checked)" ${myLeadSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
        <td><strong>${r.name}</strong><br><span style="font-size:11px;color:var(--soft)">${r.id}</span></td>
        <td>${tag(leadChannelLabel(r))}</td>
        <td>${r.owner||"—"}</td>
        <td>${leadBizStatusTag(r)}</td>
        <td>${leadBizStageCell(r)}</td>
        <td>${leadIntentLevelTag(r)}</td>
        <td>${leadTagsCellHtml(r.id)}</td>
        <td>${getLeadLastFollowTime(r)}</td>
        <td>${r.inquiryTime||"—"}</td>
        <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
          canWrite&&{label:"跟进",onclick:"openModal('follow')",primary:true},
          canWrite&&{label:"打标",onclick:`event.stopPropagation();openLeadTagModal(${r._idx})`},
          canWrite&&{label:"编辑",onclick:`openLeadEditModal(${r._idx})`},
          canWrite&&{label:"转客户",onclick:"openModal('assign')"},
          canWrite&&{label:"标记异常",onclick:`openMarkLeadAbnormalFromMy(${gi>=0?gi:i})`,danger:true},
          {label:"详情",onclick:`openMyLeadDrawer(${gi>=0?gi:i})`},
          canWrite&&{label:"沟通",onclick:`openLeadCommunicationCenterFromLeadRow(${gi>=0?gi:i},'my')`},
          canWrite&&{label:"WhatsApp",onclick:"nav('whatsapp-chat')"}
        ].filter(Boolean),`my-lead-${gi>=0?gi:i}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?11:10}"><div class="empty">暂无线索，请从公海池分配或由运营分配</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length,"点击行查看线索详情与跟进记录")}
  </section>`;
}
/**
 * PAGE ID: customer-profile
 * MODULE TYPE: list
 * OWNER DOMAIN: customers
 */
function applyCustomerModuleEntryTab(){
  if(window.__customerEntryTabApplied) return;
  window.__customerEntryTabApplied = true;
  if(!String(window.CRM_MODULE_FILE||"").includes("customers")) return;
  const pageParam = new URLSearchParams(window.location.search).get("page");
  const entryId = pageParam || currentPage || "customer-profile";
  if(entryId === "customer-profile") customerTab = "profile";
  else if(entryId === "customer-tag") customerTab = "tags";
  else if(entryId === "contact-management") customerTab = "profile";
}
function switchCustomerSubTab(tab){
  if(tab==="contacts") tab="profile";
  customerTab = tab;
  renderPage();
}
function installCustomerNavGuard(){
  if(window.__customerNavGuardInstalled || typeof nav !== "function") return;
  window.__customerNavGuardInstalled = true;
  const baseNav = nav;
  window.nav = function(id, opts){
    if(!(opts && opts.customerTab)){
      if(id === "customer-profile") customerTab = "profile";
      else if(id === "customer-tag") customerTab = "tags";
      else if(id === "contact-management") customerTab = "profile";
    }
    return baseNav.call(this, id, opts);
  };
}
function renderCustomerProfilePage(){
  applyCustomerModuleEntryTab();
  if(customerTab==="tags") return renderCustomerTagPage();
  if(customerTab==="contacts") customerTab = "profile";
  return renderCustomerProfileListPage();
}
function openCustomerDrawer(i){ openCustomerDetail(i,"overview"); }
function renderTaskFilters(){
  return `<div class="filters"><div class="filter-grid">
    <div class="field"><label>任务状态</label><select><option>待处理</option><option>今日到期</option><option>已超期</option><option>高优先级</option></select></div>
    <div class="field"><label>站点</label><select><option>全部可见站点</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="field"><label>任务关键词</label><input placeholder="任务编号、线索编号、客户名称"></div>
    <div class="head-actions"><button class="btn primary" onclick="toast('查询完成')">查询</button><button class="btn" onclick="toast('筛选条件已重置')">重置</button></div>
  </div></div>`;
}
function priorityTag(level){
  const map = {高:"red",中:"amber",低:"gray"};
  return `<span class="tag ${map[level]||"blue"}">${level}</span>`;
}
function getCustomerRows(){
  let rows = datasets.customers.map((c,i)=>({...c,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(c=>c.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(c=>getCustomerLeadRows(c).some(l=>l.site.includes("天猫")||l.site.includes("独立站A")));
  else if(currentRole==="协同人") rows = rows.filter(c=>c.level==="A类"||c.lock==="公海"||c.next==="已超期");
  return rows;
}
/** 客户关联的全部线索（企业主体 ← 多次询盘行为），只读 datasets.leads，不改线索结构 */
function getCustomerLeadRows(c){
  if(!c) return [];
  const seen=new Set();
  const rows=[];
  const push=(l)=>{ if(l&&!seen.has(l.id)){seen.add(l.id);rows.push(l);} };
  datasets.leads.filter(l=>l.name===c.name).forEach(push);
  if(c.sourceLead&&c.sourceLead!=="-") push(datasets.leads.find(l=>l.id===c.sourceLead));
  datasets.conversions.filter(cv=>(cv.customerId===c.id||cv.customer===c.name)&&cv.lead&&cv.lead!=="-").forEach(cv=>push(datasets.leads.find(l=>l.id===cv.lead)));
  return rows.sort((a,b)=>(b.inquiryTime||"").localeCompare(a.inquiryTime||""));
}
function getCustomerLeadCount(c){ return getCustomerLeadRows(c).length; }
function getCustomerSiteCount(c){
  return new Set(getCustomerLeadRows(c).map(l=>l.site).filter(Boolean)).size;
}
function getCustomerSitesSummary(c){
  const sites=[...new Set(getCustomerLeadRows(c).map(l=>l.site).filter(Boolean))];
  return sites.length?sites.join("、"):"—";
}
function getCustomerChannelsSummary(c){
  const channels=[...new Set(getCustomerLeadRows(c).map(l=>l.channel||l.source).filter(Boolean))];
  return channels.length?channels.join("、"):getCustomerChannel(c);
}
function getCustomerLeadProcessStatus(lead,c){
  if(!lead||!c) return "—";
  const converted=datasets.conversions.some(cv=>cv.lead===lead.id&&cv.node==="转客户"&&(cv.customerId===c.id||cv.customer===c.name));
  if(converted||c.sourceLead===lead.id) return "已转客户";
  if(lead.status==="已失效"||lead.stage==="已失效") return "已失效";
  return "跟进中";
}
function customerLeadProcessTag(status){
  if(status==="已转客户") return tag("已转客户");
  if(status==="已失效") return tag("已失效");
  if(status==="跟进中") return tag("跟进中");
  return tag(status||"—");
}
function openCustomerLeadDetail(leadId){
  const idx=datasets.leads.findIndex(l=>l.id===leadId);
  if(idx>=0) openDrawer("leads",idx);
  else toast("线索未找到");
}
function customerLeadsTabHtml(c){
  const rows=getCustomerLeadRows(c);
  if(!rows.length) return `<div class="empty" style="padding:16px">暂无关联线索记录。客户由首次有效询盘创建，后续同主体询盘将自动关联至此。</div>`;
  return `<div class="summary-list" style="margin-bottom:12px">${kv("关联线索数",rows.length+" 条")}${kv("来源站点数",getCustomerSiteCount(c)+" 个")}${kv("来源渠道",getCustomerChannelsSummary(c))}</div>
  <div class="table-wrap"><table><thead><tr><th>线索编号</th><th>来源站点</th><th>来源渠道</th><th>询盘时间</th><th>产品需求</th><th>处理状态</th><th>负责人</th><th>操作</th></tr></thead><tbody>
  ${rows.map(l=>`<tr class="row-clickable" onclick="openCustomerLeadDetail('${l.id}')">
    <td><strong>${l.id}</strong></td>
    <td>${l.site||"—"}</td>
    <td>${tag(leadChannelLabel(l))}</td>
    <td>${l.inquiryTime||"—"}</td>
    <td><span style="font-size:12px;line-height:1.5">${l.intent||"—"}</span></td>
    <td>${customerLeadProcessTag(getCustomerLeadProcessStatus(l,c))}</td>
    <td>${l.owner&&l.owner!=="-"?l.owner:"—"}</td>
    <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([{label:"详情",onclick:`openCustomerLeadDetail('${l.id}')`}],`cust-lead-${l.id}`)}</td>
  </tr>`).join("")}
  </tbody></table></div>`;
}
const CUSTOMER_STATUSES = ["跟进中","培育中","已成交","休眠","公海待领"];
function getCustomerChannel(c){
  if(c?.channel) return c.channel;
  if(c?.sourceLead){
    const lead = datasets.leads.find(l=>l.id===c.sourceLead);
    return lead?.channel || lead?.source || "—";
  }
  return "—";
}
function getCustomerBizStatus(c){
  if(c?.status) return c.status;
  if(c?.lock==="公海") return "公海待领";
  if(getCustomerContractDeal(c)) return "已成交";
  if(c?.next==="已超期") return "休眠";
  return "跟进中";
}
function customerStatusTag(status){ return tag(status); }
function contactAiRoleTag(aiRole){ return aiRole ? tag(aiRole) : "—"; }
function formatCustomerTagsHtml(tags){
  if(!tags) return "—";
  return tags.split(/[/、,，]/).map(t=>t.trim()).filter(Boolean).map(t=>tag(t)).join(" ");
}
function getCustomerAttachments(customerId){
  return datasets.customerAttachments?.[customerId] || [];
}
function customerAttachmentsHtml(customerId){
  const rows = getCustomerAttachments(customerId);
  if(!rows.length) return `<div class="empty" style="padding:12px">暂无客户资料附件</div>`;
  const cats = ["公司资料","产品需求文件","报价文件","合同文件","其他附件"];
  return cats.filter(cat=>rows.some(r=>r.category===cat)).map(cat=>`
    <div style="margin-bottom:12px"><div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px">${cat}</div>
    <div class="summary-list">${rows.filter(r=>r.category===cat).map(a=>`<div class="summary-row"><div class="summary-text"><strong>${a.name}</strong><span>${a.size} · ${a.time} · ${a.uploader}</span></div><span class="tag gray">${a.id}</span></div>`).join("")}</div></div>`).join("");
}
function customerEnterpriseProfileHtml(c, p){
  return `<div class="detail-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    <div class="detail-cell span-2"><label>公司简介</label><strong style="font-weight:500;line-height:1.6">${p.companyIntro || p.aiSummary?.slice(0,120) || "—"}</strong></div>
    <div class="detail-cell"><label>主营业务</label><strong>${p.mainBusiness || p.bizType || "—"}</strong></div>
    <div class="detail-cell"><label>所属行业</label><strong>${p.industry || c.industry || "—"}</strong></div>
    <div class="detail-cell"><label>企业规模</label><strong>${p.scale || "—"} · ${p.employees || "—"}</strong></div>
    <div class="detail-cell"><label>目标市场</label><strong>${p.targetMarket || (p.mainMarkets||[]).join("、") || "—"}</strong></div>
  </div>`;
}
function customerPurchaseProfileHtml(p){
  const pp = p.purchaseProfile || {};
  return `<div class="detail-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    <div class="detail-cell"><label>关注产品</label><strong>${pp.focusedProducts || (p.productLines||[]).join("、") || "—"}</strong></div>
    <div class="detail-cell"><label>采购方向</label><strong>${pp.productDirection || "—"}</strong></div>
    <div class="detail-cell"><label>采购需求</label><strong>${pp.purchaseNeeds || p.purchaseMode || "—"}</strong></div>
    <div class="detail-cell span-2"><label>采购关注点</label><strong>${pp.concerns || "—"}</strong></div>
  </div>`;
}
function customerBasicInfoHtml(c){
  const p = getCustomerProfile(c);
  return `<div class="detail-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    <div class="detail-cell"><label>公司名称</label><strong>${c.name}</strong></div>
    <div class="detail-cell"><label>国家/地区</label><strong>${c.country || "—"}</strong></div>
    <div class="detail-cell"><label>行业</label><strong>${c.industry || p.industry || "—"}</strong></div>
    <div class="detail-cell"><label>官网</label><strong>${c.website || p.website || "—"}</strong></div>
    <div class="detail-cell"><label>联系方式</label><strong>${c.phone || "—"}</strong></div>
    <div class="detail-cell"><label>负责人</label><strong>${c.owner || "—"}</strong></div>
    <div class="detail-cell"><label>创建时间</label><strong>${c.created || "—"}</strong></div>
    <div class="detail-cell"><label>归属</label><strong>${tag(c.lock || "—")}</strong></div>
  </div>`;
}
function buildCustomerEmailCtx(c){
  const customer=c?.id?c:datasets.customers.find(x=>x.name===c)||c;
  const contactEmails=getCustomerContactEmails(customer?.name||c?.name, null);
  return {
    customerId:customer?.id||c?.id||null,
    customerName:customer?.name||c?.name||c,
    contactEmails,
    leadIds:contactEmails.leadIds||[],
    customer
  };
}
function getContactRows(){
  let rows = datasets.contacts.map((c,i)=>({...c,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(c=>c.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(c=>["Global Trade Co.","Bella Home Deco","Nordic Style AB","Moda Italia S.p.A"].includes(c.customer));
  return rows;
}
function parseFollowLeadId(target){
  const m=String(target||"").match(/LEAD-\d{4}-\d+/);
  return m?m[0]:null;
}
function getFollowLeadDisplay(row){
  const id=parseFollowLeadId(row?.target);
  if(!id) return "—";
  const lead=datasets.leads.find(l=>l.id===id);
  return lead?(lead.name||id):id;
}
function getFollowSite(row){
  const id=parseFollowLeadId(row?.target);
  if(id){
    const lead=datasets.leads.find(l=>l.id===id);
    if(lead?.site) return lead.site;
  }
  const cust=datasets.customers.find(c=>c.name===row?.customer);
  return cust?.site||"—";
}
function normalizeFollowMethodLabel(method){
  const m=String(method||"");
  if(/邮件/.test(m)) return "邮件";
  if(/WhatsApp/i.test(m)) return "WhatsApp";
  if(/电话/.test(m)) return "电话";
  if(/微信|面谈|会议/.test(m)) return "会议";
  return "其他";
}
function setFollowLogFilter(key,value){
  followLogFilters[key]=value||"";
  renderPage();
}
function runFollowLogQuery(){
  ["owner","customer","leadKeyword"].forEach(k=>{
    const el=document.querySelector(`[data-follow-filter="${k}"]`);
    if(el) followLogFilters[k]=el.value.trim();
  });
  renderPage();
  toast(`查询完成，共 ${getFollowDisplayRows().length} 条`);
}
function clearFollowLogFilters(){
  followLogFilters={owner:"",customer:"",leadKeyword:"",site:"",method:"",status:"",dateFrom:"",dateTo:""};
  followAdvancedOpen=false;
  renderPage();
}
function matchesFollowLogFilters(row){
  const f=followLogFilters;
  if(f.owner&&!String(row.owner||"").includes(f.owner)) return false;
  if(f.customer&&!String(row.customer||"").includes(f.customer)) return false;
  if(f.leadKeyword){
    const id=parseFollowLeadId(row.target)||"";
    const name=getFollowLeadDisplay(row);
    const kw=f.leadKeyword.trim();
    if(kw&&!id.includes(kw)&&!String(name).includes(kw)&&!String(row.target||"").includes(kw)) return false;
  }
  if(f.site&&getFollowSite(row)!==f.site) return false;
  if(f.method&&normalizeFollowMethodLabel(row.method)!==f.method) return false;
  if(f.status&&String(row.state||"")!==f.status) return false;
  if(f.dateFrom&&String(row.time||"")<f.dateFrom) return false;
  if(f.dateTo&&String(row.time||"").slice(0,10)>f.dateTo) return false;
  return true;
}
function getFollowDisplayRows(){
  return getFollowRows().filter(matchesFollowLogFilters);
}
function getFollowRows(){
  let rows = datasets.follow.map((f,i)=>({...f,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(f=>f.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(f=>f.owner!=="系统"||f.customer.includes("Global")||f.customer.includes("Bella"));
  else if(currentRole==="协同人") rows = rows.filter(f=>f.owner!=="系统");
  return rows.sort((a,b)=>b.time.localeCompare(a.time));
}
function isTagAdmin(){ return currentRole==="管理员"; }
function isCustomerTagAiLocked(t){ return t.mode==="AI自动"||(t.mode||"").includes("AI"); }
function customerHasTagName(customerTags,tagName){
  return (customerTags||"").split(/\s*\/\s*/).map(s=>s.trim()).includes(tagName);
}
function countCustomerTagUsage(tagName){
  return datasets.customers.filter(c=>customerHasTagName(c.customerTags,tagName)).length;
}
function countLeadTagUsage(name){
  let n=0;
  Object.values(datasets.leadTagAssignments||{}).forEach(arr=>{
    arr.forEach(t=>{ if(t.name===name&&t.status!=="ignored") n++; });
  });
  return n;
}
function getCustomersByTag(tagName){
  let rows=datasets.customers.map((c,i)=>({...c,_idx:i})).filter(c=>customerHasTagName(c.customerTags,tagName));
  if(currentRole==="外贸业务员") rows=rows.filter(c=>c.owner==="张明远");
  else if(currentRole==="运营专员") rows=rows.filter(c=>c.site.includes("天猫")||c.site.includes("独立站A"));
  else if(currentRole==="协同人") rows=rows.filter(c=>c.lock!=="公海"||c.status==="已成交");
  return rows;
}
function getLeadsByTag(tagName){
  const rows=[];
  Object.entries(datasets.leadTagAssignments||{}).forEach(([leadId,tags])=>{
    if(!tags.some(t=>t.name===tagName&&t.status!=="ignored")) return;
    const lead=datasets.leads.find(l=>l.id===leadId);
    if(lead) rows.push({...lead,_idx:datasets.leads.indexOf(lead)});
  });
  if(currentRole==="外贸业务员") return rows.filter(l=>l.owner==="张明远"||l.owner==="-");
  if(currentRole==="运营专员") return rows.filter(l=>l.site.includes("天猫")||l.site.includes("独立站A")||l.site.includes("独立站B"));
  if(currentRole==="协同人") return rows.filter(l=>l.assignStatus==="已分配"||isPublicPoolLead(l));
  return rows;
}
function getCustomerTagRows(){
  let rows = datasets.tags.map((t,i)=>({...t,_idx:i})).filter(t=>t.target==="客户");
  rows=rows.map(t=>({...t,count:countCustomerTagUsage(t.name)}));
  if(tagCategoryFilter!=="全部") rows = rows.filter(t=>t.category===tagCategoryFilter);
  return rows;
}
function getLeadTagRows(){
  const rows=[];
  const seen=new Set();
  (datasets.leadTagPresets||[]).forEach((p,i)=>{
    seen.add(p.name);
    rows.push({
      id:p.code,code:p.code,name:p.name,category:p.category,
      sourceType:p.category==="AI洞察"?"ai":"system",
      count:countLeadTagUsage(p.name),status:"启用",
      createdAt:p.createdAt||"—",updatedAt:p.updatedAt||"—",
      _idx:i,_kind:"preset"
    });
  });
  datasets.tags.filter(t=>t.target==="线索").forEach((t,i)=>{
    if(seen.has(t.name)) return;
    seen.add(t.name);
    rows.push({
      id:t.id,code:t.code,name:t.name,category:t.category,
      sourceType:(t.mode||"").includes("AI")?"ai":"system",
      count:countLeadTagUsage(t.name)||t.count,status:t.status||"启用",
      createdAt:t.createdAt||"—",updatedAt:t.updatedAt||"—",
      _idx:(datasets.leadTagPresets||[]).length+i,_kind:"catalog"
    });
  });
  const customs=new Set();
  Object.values(datasets.leadTagAssignments||{}).flat().forEach(t=>{
    if(t.source==="business"&&t.status!=="ignored"&&!seen.has(t.name)) customs.add(t.name);
  });
  [...customs].sort().forEach((name,i)=>{
    rows.push({
      id:"CUSTOM-"+name,code:"—",name,category:"自定义",sourceType:"custom",
      count:countLeadTagUsage(name),status:"启用",
      createdAt:"—",updatedAt:"2026-06-16",
      _idx:(datasets.leadTagPresets||[]).length+datasets.tags.filter(t=>t.target==="线索").length+i,_kind:"custom"
    });
  });
  if(tagCategoryFilter!=="全部") rows = rows.filter(t=>t.category===tagCategoryFilter);
  return rows;
}
function getTagRows(){ return tagMgmtTab==="lead"?getLeadTagRows():getCustomerTagRows(); }
function getTagMgmtCategories(){
  const src=tagMgmtTab==="lead"?getLeadTagRows():getCustomerTagRows();
  return [...new Set(src.map(t=>t.category))].sort();
}
function tagSourceTypeLabel(type){
  return {ai:"AI 标签",system:"系统预设",custom:"自定义"}[type]||type;
}
function renderTagMgmtTabs(){
  const cc=getCustomerTagRows().length,lc=getLeadTagRows().length;
  return `<div class="tabs sub-tabs">
    <button type="button" class="tab ${tagMgmtTab==="customer"?"active":""}" onclick="tagMgmtTab='customer';tagCategoryFilter='全部';renderPage()">客户标签 <span style="font-size:11px;color:var(--soft)">${cc}</span></button>
    <button type="button" class="tab ${tagMgmtTab==="lead"?"active":""}" onclick="tagMgmtTab='lead';tagCategoryFilter='全部';renderPage()">线索标签 <span style="font-size:11px;color:var(--soft)">${lc}</span></button>
  </div>
  <p style="font-size:12px;color:var(--soft);margin:0 0 12px">${tagMgmtTab==="customer"?"客户标签仅用于客户资产，由管理员统一维护。":"线索标签仅用于线索，支持 AI 自动标记与业务员自定义。"}</p>`;
}
function tagUsageListModalHtml(scope,tagName,list){
  const label=scope==="customer"?"客户":"线索";
  const head=scope==="customer"
    ? `<tr><th>客户名称</th><th>国家/地区</th><th>负责人</th><th>客户状态</th></tr>`
    : `<tr><th>线索编号</th><th>客户名称</th><th>阶段</th><th>负责人</th></tr>`;
  const body=scope==="customer"
    ? list.map(c=>`<tr><td><strong>${c.name}</strong><div style="font-size:11px;color:var(--soft)">${c.id}</div></td><td>${c.country||"—"}</td><td>${c.owner||"—"}</td><td>${customerStatusTag(getCustomerBizStatus(c))}</td></tr>`).join("")
    : list.map(l=>`<tr><td><strong>${l.id}</strong></td><td>${l.name}</td><td>${tag(l.stage||"—")}</td><td>${l.owner||"—"}</td></tr>`).join("");
  return `<div class="assign-target-summary span-2" style="margin-bottom:12px"><div class="summary-list">${kv("标签",tagName)}${kv(`使用${label}数`,list.length+" 个")}</div></div>
    ${list.length?`<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`:`<div class="empty">暂无使用该标签的${label}</div>`}
    <p style="font-size:12px;color:var(--soft);margin-top:10px">标签与${label}为多对多关系，此处展示当前可见范围内所有打标${label}。</p>`;
}
function openTagCustomerList(tagIdx){
  const row=getCustomerTagRows()[tagIdx];
  if(!row){ toast("标签不存在"); return; }
  tagUsageContext={scope:"customer",tagName:row.name,tagCode:row.code,tagIdx};
  openModal("tagCustomerList");
}
function openTagLeadList(tagIdx){
  const row=getLeadTagRows()[tagIdx];
  if(!row){ toast("标签不存在"); return; }
  tagUsageContext={scope:"lead",tagName:row.name,tagCode:row.code,tagIdx};
  openModal("tagLeadList");
}
function openLeadTagMgmtDrawer(i){
  const r=getLeadTagRows()[i];
  if(!r) return;
  window._leadTagMgmtRow=r;
  window._leadTagMgmtIdx=i;
  openDrawer("tags",0);
}
function toggleCustomerAdvanced(){ customerAdvancedOpen=!customerAdvancedOpen; renderPage(); }
function toggleContactAdvanced(){ contactAdvancedOpen=!contactAdvancedOpen; renderPage(); }
function toggleFollowAdvanced(){ followAdvancedOpen=!followAdvancedOpen; renderPage(); }
function toggleCustomerRow(i,checked){ if(checked) customerSelected.add(i); else customerSelected.delete(i); renderPage(); }
function toggleCustomerAll(checked){ getCustomerRows().forEach((_,i)=> checked?customerSelected.add(i):customerSelected.delete(i)); renderPage(); }
function toggleContactRow(i,checked){ if(checked) contactSelected.add(i); else contactSelected.delete(i); renderPage(); }
function toggleContactAll(checked){ getContactRows().forEach((_,i)=> checked?contactSelected.add(i):contactSelected.delete(i)); renderPage(); }
function batchCustomerAction(action){ toast(`${{transfer:"批量转移",export:"批量导出"}[action]||action}：已处理 ${customerSelected.size||1} 条客户`); customerSelected.clear(); renderPage(); }
function openContactDrawer(i){ const r=getContactRows()[i]; if(r) openDrawer("contacts",r._idx); }
function openFollowDrawer(idx){ if(datasets.follow[idx]) openDrawer("follow",idx); }
function openTagDrawer(i){ const r=getCustomerTagRows()[i]; if(r) openDrawer("tags",r._idx); }
function claimPublicCustomer(i){
  const r=getCustomerRows()[i];
  if(currentRole==="访客"){ toast("权限不足"); return; }
  if(r?.lock!=="公海"){ toast("仅公海客户可领取"); return; }
  toast(`已领取公海客户 ${r.name}，归属变更为独占`);
}
/**
 * PAGE ID: customer-profile
 * MODULE TYPE: list
 * OWNER DOMAIN: customers
 */
function renderCustomerProfileListPage(){
  const allRows=getCustomerRows();
  const pagerKey="customer-profile";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  const canTransfer=!readonly&&(currentRole==="管理员"||currentRole==="运营专员");
  const countries=[...new Set(allRows.map(r=>r.country).filter(Boolean))];
  const industries=[...new Set(allRows.map(r=>r.industry).filter(Boolean))];
  const channels=[...new Set(allRows.map(r=>getCustomerChannel(r)).filter(c=>c!=="—"))];
  return `
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>客户关键词</label><input placeholder="客户名称、编号"></div>
    <div class="field"><label>国家/地区</label><select><option>全部</option>${countries.map(c=>`<option>${c}</option>`).join("")}</select></div>
    <div class="field"><label>行业</label><select><option>全部</option>${industries.map(c=>`<option>${c}</option>`).join("")}</select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleCustomerAdvanced()">${customerAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${customerAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>客户标签</label><select><option>全部</option><option>高意向</option><option>MOQ关注</option><option>大客户</option><option>样品敏感</option><option>超期未跟进</option></select></div>
    <div class="field"><label>客户状态</label><select><option>全部</option>${CUSTOMER_STATUSES.map(s=>`<option>${s}</option>`).join("")}</select></div>
    <div class="field"><label>来源渠道</label><select><option>全部</option>${channels.map(c=>`<option>${c}</option>`).join("")}</select></div>
    <div class="field"><label>关联线索数</label><select><option>全部</option><option>1 条</option><option>2 条及以上</option><option>3 条及以上</option></select></div>
  </div></div>
  ${renderBatchBar({
    count:customerSelected.size,
    unit:"条客户",
    onCancel:"customerSelected.clear();renderPage()",
    skipDedup:true,
    actions:canTransfer?`<button type="button" class="btn small primary" onclick="openModal('assign')">批量重新关联</button>`:""
  })}
  <section class="panel"><div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleCustomerAll(this.checked)"></th>`:""}
      <th>客户名称</th><th>国家/地区</th><th>负责人</th><th>客户标签</th><th>客户状态</th><th>关联线索数</th><th>来源站点数</th><th>最近联系时间</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);const idx=gi>=0?gi:i;const bizStatus=getCustomerBizStatus(r);return `<tr style="${r.next==="已超期"?"background:#fff7f7":""}">
        ${canWrite?`<td><input type="checkbox" onchange="toggleCustomerRow(${idx},this.checked)" ${customerSelected.has(idx)?"checked":""}></td>`:""}
        <td><strong><a href="javascript:void(0)" style="color:var(--primary);text-decoration:none" onclick="openCustomerDetail(${idx})">${r.name}</a></strong><div style="font-size:11px;color:var(--soft);margin-top:2px">${r.id}</div></td>
        <td>${r.country}</td><td>${r.owner}</td>
        <td>${formatCustomerTagsHtml(r.customerTags)}</td>
        <td>${customerStatusTag(bizStatus)}</td>
        <td><strong>${getCustomerLeadCount(r)}</strong><div style="font-size:11px;color:var(--soft);margin-top:2px">${getCustomerChannelsSummary(r)}</div></td>
        <td><strong>${getCustomerSiteCount(r)}</strong><div style="font-size:11px;color:var(--soft);margin-top:2px">${getCustomerSitesSummary(r)}</div></td>
        <td>${r.last||"—"}</td>
        <td>${renderRowActions([
          {label:"客户详情",onclick:`openCustomerDetail(${idx})`,primary:true},
          {label:"线索记录",onclick:`openCustomerDetail(${idx},'leads')`},
          {label:"AI画像",onclick:`openCustomerDetail(${idx},'360')`},
          canWrite&&{label:"编辑",onclick:"openModal('customer')"},
          r.lock==="公海"&&canWrite&&{label:"领取",onclick:`claimPublicCustomer(${idx})`,primary:true},
          canTransfer&&{label:"转移",onclick:"openModal('assign')"}
        ].filter(Boolean),`customer-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?9:8}"><div class="empty">暂无客户，线索转客户后将自动生成</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length,"点击客户名称打开详情 · 客户代表企业主体，线索代表每次询盘行为")}
  </section>`;
}
/**
 * PAGE ID: customer-profile
 * MODULE TYPE: list
 * OWNER DOMAIN: customers
 */
function renderContactManagementPage(){
  const allRows=getContactRows();
  const pagerKey="customer-contacts";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  return `
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>所属客户</label><input placeholder="客户名称"></div>
    <div class="field"><label>联系人</label><input placeholder="姓名、邮箱、WhatsApp"></div>
    <div class="field"><label>联系角色</label><select><option>全部</option><option>决策人</option><option>采购负责人</option><option>关键联系人</option><option>执行联系人</option></select></div>
    <div class="field"><label>AI识别角色</label><select><option>全部</option><option>决策人</option><option>采购负责人</option><option>关键联系人</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleContactAdvanced()">${contactAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${contactAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>负责人</label><input placeholder="所属业务员"></div>
    <div class="field"><label>邮箱/电话</label><input placeholder="邮箱 / 电话 / WhatsApp"></div>
    <div class="field"><label>最近联系</label><input type="date"></div>
  </div></div>
  ${renderBatchBar({
    count:contactSelected.size,
    unit:"条联系人",
    onCancel:"contactSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="openModal('contact')">批量编辑</button>`:""}<button type="button" class="btn small" onclick="toast('已导出 ${contactSelected.size||rows.length} 条联系人')">批量导出</button>`
  })}
  <section class="panel"><div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleContactAll(this.checked)"></th>`:""}
      <th>客户</th><th>姓名</th><th>职位</th><th>邮箱</th><th>电话</th><th>WhatsApp</th><th>联系角色</th><th>AI识别</th><th>最近联系</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);const idx=gi>=0?gi:i;return `<tr>
        ${canWrite?`<td><input type="checkbox" onchange="toggleContactRow(${idx},this.checked)" ${contactSelected.has(idx)?"checked":""}></td>`:""}
        <td><strong>${r.customer}</strong></td><td>${r.name}</td><td>${r.role}</td>
        <td>${r.email}</td><td>${r.phone||"—"}</td><td>${r.whatsapp&&r.whatsapp!=="-"?r.whatsapp:"—"}</td>
        <td>${tag(r.contactRole||r.decision==="老板"?"关键决策人":r.decision)}</td>
        <td>${canUseAiFeature()?contactAiRoleTag(r.aiRole):"—"}</td><td>${r.last}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openContactDrawer(${idx})`},
          canWrite&&{label:"编辑",onclick:"openModal('contact')"},
          {label:"客户→",onclick:"nav('customer-profile')"}
        ].filter(Boolean),`contact-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?11:10}"><div class="empty">暂无联系人，请从客户列表或本页新增</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
/**
 * PAGE ID: customer-profile
 * MODULE TYPE: list
 * OWNER DOMAIN: customers
 */
function renderCustomerTagPage(){
  if(tagMgmtTab==="lead") return renderLeadTagMgmtPage();
  const allRows=getCustomerTagRows();
  const pagerKey="customer-tags";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const cats=getTagMgmtCategories();
  return `${renderTagMgmtTabs()}
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>标签名称</label><input placeholder="标签名称"></div>
    <div class="field"><label>标签分类</label><select onchange="tagCategoryFilter=this.value;renderPage()"><option ${tagCategoryFilter==="全部"?"selected":""}>全部</option>${cats.map(c=>`<option ${tagCategoryFilter===c?"selected":""}>${c}</option>`).join("")}</select></div>
    <div class="head-actions"><button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button><button class="btn" onclick="tagCategoryFilter='全部';renderPage()">重置</button></div>
  </div></div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>标签名称</th><th>标签分类</th><th>使用数量</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map((t,i)=>{const gi=allRows.indexOf(t);const idx=gi>=0?gi:i;return `<tr style="${t.status==="停用"?"opacity:.7":""}">
        <td>${tag(t.name)}${isCustomerTagAiLocked(t)?`<span class="tag blue" style="margin-left:4px;font-size:10px">AI</span>`:""}<div style="font-size:11px;color:var(--soft);margin-top:2px">${t.code}</div></td>
        <td>${t.category}</td><td>${t.count}</td><td>${t.createdAt||"—"}</td><td>${t.updatedAt||"—"}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openTagDrawer(${idx})`},
          isTagAdmin()&&{label:"维护",onclick:"openModal('tag')"},
          {label:"查看客户",onclick:`openTagCustomerList(${idx})`}
        ].filter(Boolean),`tag-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="6"><div class="empty">暂无客户标签</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
function renderLeadTagMgmtPage(){
  const allRows=getLeadTagRows();
  const pagerKey="lead-tags";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const cats=getTagMgmtCategories();
  return `${renderTagMgmtTabs()}
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>标签名称</label><input placeholder="标签名称"></div>
    <div class="field"><label>标签分类</label><select onchange="tagCategoryFilter=this.value;renderPage()"><option ${tagCategoryFilter==="全部"?"selected":""}>全部</option>${cats.map(c=>`<option ${tagCategoryFilter===c?"selected":""}>${c}</option>`).join("")}</select></div>
    <div class="head-actions"><button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button><button class="btn" onclick="tagCategoryFilter='全部';renderPage()">重置</button></div>
  </div></div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>标签名称</th><th>标签分类</th><th>使用数量</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map((t,i)=>{const gi=allRows.indexOf(t);const idx=gi>=0?gi:i;
        return `<tr>
        <td>${tag(t.name)}<div style="font-size:11px;color:var(--soft);margin-top:2px">${t.sourceType==="ai"?"AI 标签":t.sourceType==="custom"?"自定义":t.code}</div></td>
        <td>${t.category}</td><td>${t.count}</td><td>${t.createdAt||"—"}</td><td>${t.updatedAt||"—"}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openLeadTagMgmtDrawer(${idx})`},
          t.sourceType==="system"&&isTagAdmin()&&{label:"维护",onclick:"openModal('tag')"},
          {label:"查看线索",onclick:`openTagLeadList(${idx})`}
        ].filter(Boolean),`ltag-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="6"><div class="empty">暂无线索标签</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
/**
 * PAGE ID: follow-record
 * MODULE TYPE: list
 * OWNER DOMAIN: leads
 */
function renderFollowRecordPage(){
  const allRows=getFollowDisplayRows();
  const pagerKey="follow-record";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const f=followLogFilters;
  const siteOpts=[["","全部"],...datasets.sites.map(s=>[s.name,s.name])];
  const methodOpts=["","邮件","电话","WhatsApp","会议","其他"];
  const statusOpts=["",...LEAD_BIZ_STAGES,"首次联系","报价打样","深度沟通","已成交","收到询盘"];
  return `
  <p style="font-size:12px;color:var(--soft);margin:0 0 14px;line-height:1.7">线索跟进日志全局查询，用于销售复盘、主管检查与运营审计；仅支持查询与查看详情。</p>
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>业务员</label><input data-follow-filter="owner" placeholder="跟进人姓名" value="${f.owner||""}" onchange="setFollowLogFilter('owner',this.value)"></div>
    <div class="field"><label>客户</label><input data-follow-filter="customer" placeholder="客户名称" value="${f.customer||""}" onchange="setFollowLogFilter('customer',this.value)"></div>
    <div class="field"><label>线索</label><input data-follow-filter="leadKeyword" placeholder="线索编号 / 名称" value="${f.leadKeyword||""}" onchange="setFollowLogFilter('leadKeyword',this.value)"></div>
    <div class="field"><label>来源站点</label><select onchange="setFollowLogFilter('site',this.value)">${siteOpts.map(([v,l])=>`<option value="${v}" ${f.site===v?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label>跟进方式</label><select onchange="setFollowLogFilter('method',this.value)">${methodOpts.map(m=>`<option value="${m}" ${f.method===m?"selected":""}>${m||"全部"}</option>`).join("")}</select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleFollowAdvanced()">${followAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="runFollowLogQuery()">查询</button>
      <button class="btn" onclick="clearFollowLogFilters()">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${followAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>跟进状态</label><select onchange="setFollowLogFilter('status',this.value)">${statusOpts.map(s=>`<option value="${s}" ${f.status===s?"selected":""}>${s||"全部"}</option>`).join("")}</select></div>
    <div class="field"><label>开始日期</label><input type="date" value="${f.dateFrom||""}" onchange="setFollowLogFilter('dateFrom',this.value)"></div>
    <div class="field"><label>结束日期</label><input type="date" value="${f.dateTo||""}" onchange="setFollowLogFilter('dateTo',this.value)"></div>
  </div></div>
  <section class="panel"><div class="table-wrap"><table><thead><tr>
      <th>跟进时间</th><th>客户名称</th><th>线索名称</th><th>来源站点</th><th>跟进方式</th><th>跟进状态</th><th>跟进内容摘要</th><th>业务员</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);const idx=gi>=0?gi:i;return `<tr class="row-clickable" onclick="openFollowDrawer(${r._idx})">
        <td>${r.time}</td><td><strong>${r.customer||"—"}</strong></td>
        <td>${getFollowLeadDisplay(r)}</td><td>${getFollowSite(r)}</td>
        <td>${tag(normalizeFollowMethodLabel(r.method))}</td><td>${tag(r.state||"—")}</td>
        <td><span style="font-size:12px;line-height:1.5">${r.summary||"—"}</span></td>
        <td>${r.owner||"—"}</td>
        <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
          {label:"详情",onclick:`openFollowDrawer(${r._idx})`}
        ],`follow-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="9"><div class="empty">暂无跟进日志，销售沟通与跟进备注将沉淀于此</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length,"点击行查看跟进详情")}
  </section>`;
}
function conversionNodeTag(node){
  const map = {"合同成交":"green","成单":"green","转客户":"cyan","培育中":"amber","线索分配":"blue","首次联系":"blue"};
  return `<span class="tag ${map[node]||"gray"}">${node}</span>`;
}
function getConversionRows(){
  let rows = datasets.conversions.map((c,i)=>({...c,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(c=>c.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(c=>c.site.includes("天猫")||c.site.includes("独立站A"));
  else if(currentRole==="协同人") rows = rows.filter(c=>c.node==="合同成交"||c.node==="转客户");
  return rows.sort((a,b)=>b.time.localeCompare(a.time));
}
function toggleLeadConvertedAdvanced(){
  leadConvertedAdvancedOpen = !leadConvertedAdvancedOpen;
  renderPage();
}
function openConversionDrawer(i){
  const row = getConversionRows()[i];
  if(row) openDrawer("conversions",row._idx);
}
function conversionLeadTimeline(leadId){
  return datasets.conversions.filter(c=>c.lead===leadId).sort((a,b)=>a.time.localeCompare(b.time)).map(c=>`<div class="time-item"><div class="time-title">${conversionNodeTag(c.node)} ${c.time}</div><div class="time-meta">${c.owner} / ${c.scheme||"-"}</div><div class="time-text">${c.result}</div></div>`).join("");
}
function conversionChainHtml(conv){
  const lead = datasets.leads.find(l=>l.id===conv.lead)||{};
  const stage = conv.node==="合同成交"?"已成交":lead.stage||conv.node;
  return taskFullChainHtml({lead:conv.lead,customer:conv.customer,stage,next:"-",deadline:"-"});
}
/**
 * PAGE ID: lead-converted
 * MODULE TYPE: list
 * OWNER DOMAIN: leads
 */
function renderLeadConvertedPage(){
  const rows = getConversionRows();
  const readonly = currentRole==="访客";
  const converted = rows.filter(r=>r.node==="转客户").length;
  const deal = rows.filter(r=>r.node==="合同成交").length;
  const nurturing = rows.filter(r=>r.node==="培育中").length;
  const nodes = ["线索分配","转客户","培育中","合同成交"].map(n=>[n,rows.filter(r=>r.node===n).length]);
  const maxNode = Math.max(...nodes.map(n=>n[1]),1);
  const sources = ["网站表单","邮件","WhatsApp","接口拉取"].map(s=>[s,rows.filter(r=>r.source===s).length]);
  const maxSrc = Math.max(...sources.map(s=>s[1]),1);
  const uniqueLeads = [...new Set(rows.map(r=>r.lead))].length;
  return `
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>线索编号</label><input placeholder="LEAD-2026-xxxx"></div>
    <div class="field"><label>客户名称</label><input placeholder="客户名称"></div>
    <div class="field"><label>来源</label><select><option>全部</option><option>网站表单</option><option>邮件</option><option>WhatsApp</option><option>接口拉取</option><option>手动录入</option></select></div>
    <div class="field"><label>转化节点</label><select><option>全部</option><option>线索分配</option><option>转客户</option><option>培育中</option><option>合同成交</option></select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleLeadConvertedAdvanced()">${leadConvertedAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${rows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>

  <div class="filter-advanced ${leadConvertedAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>站点</label><select><option>全部可见站点</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>客户编号</label><input placeholder="CUS-2026-xxxx"></div>
    <div class="field"><label>转化方案</label><select><option>全部方案</option><option>方案一：自动建线索</option><option>方案二：人工转线索</option></select></div>
    <div class="field"><label>转化时间</label><input type="date"></div>
    <div class="field"><label>关联合同</label><select><option>全部</option><option>已关联合同</option><option>未关联合同</option></select></div>
    <div class="field"><label>同步状态</label><select><option>全部</option><option>已同步</option><option>待同步</option></select></div>
  </div></div>

  <section class="panel"><div class="table-wrap"><table><thead><tr>
      <th>线索编号</th><th>客户名称</th><th>来源</th><th>转化节点</th><th>客户编号</th><th>负责人</th><th>转化时间</th><th>结果说明</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>`<tr style="cursor:pointer" onclick="openConversionDrawer(${i})">
        <td><strong>${r.lead}</strong></td><td><strong>${r.customer}</strong></td><td>${tag(r.source)}</td>
        <td>${conversionNodeTag(r.node)}</td>
        <td>${r.customerId&&r.customerId!=="-"?`<strong>${r.customerId}</strong>`:"—"}</td>
        <td>${r.owner}</td><td>${r.time}</td>
        <td><span style="font-size:12px;line-height:1.5">${r.result}</span></td>
        <td onclick="event.stopPropagation()">${renderRowActions([
          {label:"详情",onclick:`openConversionDrawer(${i})`},
          r.customerId&&r.customerId!=="-"&&{label:"客户→",onclick:"nav('customer-profile')"},
          r.contract&&r.contract!=="-"&&{label:"合同→",onclick:"nav('contract-list')"}
        ].filter(Boolean),`conversion-${i}`)}</td>
      </tr>`).join(""):`<tr><td colspan="9"><div class="empty">暂无转化记录，线索分配或转客户后将自动生成节点</div></td></tr>`}
    </tbody></table></div>
    <div class="table-foot"><span>共 ${rows.length} 条</span><div class="pager"><button class="page-btn">‹</button><button class="page-btn active">1</button><button class="page-btn">›</button></div></div>
  </section>`;
}
function getInvalidLeadRows(){
  let rows = datasets.leads.map((l,i)=>({...l,_idx:i})).filter(l=>{
    if(l.status==="异常线索"||l.status==="已失效"||l.stage==="已失效") return true;
    if(l.processStatus==="待处理"&&l.invalidType) return true;
    if(isStaleLead(l)) return true;
    if(l.invalidType&&l.invalidMarkSource==="人工标记") return true;
    if((l.contact||"").includes("invalid")||l.contact==="-") return true;
    return false;
  });
  if(currentRole==="外贸业务员") rows = rows.filter(l=>l.owner==="张明远"||l.owner==="-");
  else if(currentRole==="运营专员") rows = rows.filter(l=>l.site.includes("天猫")||l.site.includes("独立站A")||l.site.includes("独立站B"));
  else if(currentRole==="协同人") rows = rows.filter(l=>l.processStatus==="待处理"||l.invalidType==="重复线索"||isStaleLead(l));
  if(invalidLeadTab==="stale") rows = rows.filter(isStaleLead);
  else if(invalidLeadTab==="bad_phone") rows = rows.filter(l=>(l.contact||"").includes("invalid")||l.contact==="-"||l.invalidType==="信息不完整");
  else if(invalidLeadTab==="duplicate") rows = rows.filter(l=>l.invalidType==="重复线索");
  else if(invalidLeadTab==="invalid") rows = rows.filter(l=>l.status==="异常线索"||l.status==="已失效"||l.stage==="已失效");
  else if(invalidLeadTab==="pending") rows = rows.filter(l=>l.processStatus==="待处理");
  return rows.sort((a,b)=>b.inquiryTime.localeCompare(a.inquiryTime));
}
function toggleLeadInvalidAdvanced(){
  leadInvalidAdvancedOpen = !leadInvalidAdvancedOpen;
  renderPage();
}
function toggleLeadInvalidRow(i,checked){
  if(checked) leadInvalidSelected.add(i); else leadInvalidSelected.delete(i);
  const bar = document.getElementById("leadInvalidBatchBar");
  const cnt = document.getElementById("leadInvalidBatchCount");
  if(bar){ bar.classList.toggle("show",leadInvalidSelected.size>0); if(cnt) cnt.textContent=leadInvalidSelected.size; }
}
function toggleLeadInvalidAll(checked){
  getInvalidLeadRows().forEach((_,i)=> checked ? leadInvalidSelected.add(i) : leadInvalidSelected.delete(i));
  renderPage();
}
function batchLeadInvalidAction(action){
  const n = leadInvalidSelected.size || 1;
  const map = {reassign:"批量重新分配",restore:"批量恢复",close:"批量关闭",export:"批量导出",process:"批量处理"};
  toast(`${map[action]||action}：已处理 ${n} 条异常线索`);
  leadInvalidSelected.clear();
  renderPage();
}
function openInvalidLeadDrawer(i){
  const row = getInvalidLeadRows()[i];
  if(row) openDrawer("leads",row._idx);
}
function processInvalidLead(i){
  const row = getInvalidLeadRows()[i];
  if(currentRole==="访客"){ toast("权限不足，请联系管理员"); return; }
  if(row?.processStatus==="已归档"){ toast("该线索已归档，无需重复处理"); return; }
  toast(`线索 ${row?.id||""} 已确认归档，移出待处理队列`);
  openModal("leadInvalidProcess");
}
function restoreInvalidLead(i){
  const row = getInvalidLeadRows()[i];
  if(currentRole==="访客"||currentRole==="协同人"){ toast("权限不足"); return; }
  if(row) openRestoreLeadAbnormalModal(row._idx);
}
/**
 * PAGE ID: lead-invalid
 * MODULE TYPE: list
 * OWNER DOMAIN: leads
 */
function renderLeadInvalidPage(){
  const allRows = getInvalidLeadRows();
  const pagerKey = `invalid-lead-${invalidLeadTab}`;
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const readonly = currentRole==="访客";
  const canProcess = !readonly && currentRole!=="协同人";
  const canRestore = !readonly && currentRole!=="协同人";
  return `${renderInvalidLeadTabs()}

  <div class="filters"><div class="filter-grid">
    <div class="field"><label>线索编号</label><input placeholder="LEAD-2026-xxxx"></div>
    <div class="field"><label>站点</label><select><option>全部</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}<option>未授权外部站</option></select></div>
    <div class="field"><label>来源渠道</label><select>${leadSourceFilterOptions()}</select></div>
    <div class="field"><label>客户名称</label><input placeholder="客户名称"></div>
    <div class="field"><label>异常类型</label><select><option>全部</option><option>信息不完整</option><option>重复线索</option><option>站点未授权</option><option>无负责人</option><option>无效线索</option></select></div>
    ${renderLeadBizFilterFields("invalid")}
    <div class="head-actions">
      <button class="btn" onclick="toggleLeadInvalidAdvanced()">${leadInvalidAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>

  <div class="filter-advanced ${leadInvalidAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>处理状态</label><select><option>全部</option><option>待处理</option><option>已归档</option></select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="field"><label>进入时长</label><select><option>全部</option><option>1天内</option><option>3天内</option><option>超7天</option></select></div>
    <div class="field"><label>入池方式</label><select><option>全部</option><option>自动去重</option><option>接口入池</option><option>手工录入</option><option>会话识别</option></select></div>
    <div class="field"><label>处理人</label><input placeholder="运营/系统"></div>
  </div></div>

  ${renderBatchBar({
    id:"leadInvalidBatchBar",
    countId:"leadInvalidBatchCount",
    count:leadInvalidSelected.size,
    unit:"条异常线索",
    onCancel:"leadInvalidSelected.clear();renderPage()",
    actions:`${canProcess?`<button type="button" class="btn small primary" onclick="openModal('assign')">重新分配</button><button type="button" class="btn small" onclick="batchLeadInvalidAction('process')">批量处理</button>`:""}${canRestore?`<button type="button" class="btn small" onclick="batchLeadInvalidAction('restore')">批量恢复</button>`:""}${canProcess?`<button type="button" class="btn small danger" onclick="batchLeadInvalidAction('close')">批量关闭</button>`:""}<button type="button" class="btn small" onclick="batchLeadInvalidAction('export')">批量导出</button>`
  })}

  <section class="panel"><div class="table-wrap"><table><thead><tr>
      ${canProcess?`<th class="no-row-click"><input type="checkbox" onchange="toggleLeadInvalidAll(this.checked)" ${leadInvalidSelected.size===rows.length&&rows.length?"checked":""}></th>`:""}
      <th>线索编号</th><th>站点</th><th>来源渠道</th><th>客户名称</th><th>异常类型</th><th>状态</th><th>阶段</th><th>意向等级</th><th>负责人</th><th>进入时长</th><th class="no-row-click">操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);return `<tr class="row-clickable" style="${r.processStatus==="待处理"?"background:#fffbf0":""}" onclick="openInvalidLeadDrawer(${gi>=0?gi:i})">
        ${canProcess?`<td class="no-row-click" onclick="event.stopPropagation()"><input type="checkbox" onchange="toggleLeadInvalidRow(${gi>=0?gi:i},this.checked)" ${leadInvalidSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
        <td><strong>${r.id}</strong></td><td>${r.site}</td><td>${tag(leadChannelLabel(r))}</td><td><strong>${r.name}</strong></td>
        <td>${tag(r.invalidType||"无效线索")}</td><td>${leadBizStatusTag(r)}</td><td>${leadBizStageCell(r)}</td><td>${leadIntentLevelTag(r)}</td>
        <td>${r.owner&&r.owner!=="-"?r.owner:"—"}</td><td>${r.age}</td>
        <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
          {label:"详情",onclick:`openInvalidLeadDrawer(${gi>=0?gi:i})`},
          canProcess&&r.processStatus!=="已归档"&&{label:"重新分配",onclick:"openModal('assign')"},
          canProcess&&r.processStatus!=="已归档"&&{label:"处理",onclick:`processInvalidLead(${gi>=0?gi:i})`,primary:true},
          canProcess&&r.processStatus!=="已归档"&&{label:"关闭",onclick:`toast('线索 ${r.id} 已关闭')`,danger:true},
          canRestore&&{label:"恢复",onclick:`restoreInvalidLead(${gi>=0?gi:i})`}
        ].filter(Boolean),`lead-invalid-${gi>=0?gi:i}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canProcess?12:11}"><div class="empty">暂无异常线索，无效/重复/未授权线索将自动进入此队列</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length,"点击行查看线索详情")}
  </section>`;
}
/** PAGE ID: role-management | alias */
function rolePage(){ return renderRoleManagementPage(); }
function renderPermissionTabs(){ return ""; }
function renderSystemTabs(pages){ return ""; }
/** 一期分析页仅保留标题区，内部分 Tab 已移除，导航由左侧菜单承担 */
function renderAnalysisPageHead(){
  const meta = pageMeta[currentPage];
  if(!meta) return "";
  const isAnalysisPage = DATA_ANALYSIS_PAGES.includes(currentPage)
    || ["communication-analysis","ai-analysis","site-stat","site-seo-analysis"].includes(currentPage);
  if(!isAnalysisPage) return "";
  const title = getPageTitle(currentPage);
  return `<div class="page-head" style="margin-bottom:14px"><div><div class="page-title">${title}</div>${meta.desc?`<div class="page-desc">${meta.desc}</div>`:""}</div></div>`;
}
function renderDataAnalysisTabs(){ return ""; }
function siteTraceBannerHtml(){
  return `<div class="review-bar" style="margin-bottom:14px;background:linear-gradient(135deg,#f0fdf4,#ecfeff);border-color:#86efac">
    <div><strong>CRM 经营闭环</strong> · 询盘进入 → 线索管理 → 业务跟进 → 客户沉淀 → 成交</div>
    <div class="state-pills">
      <button type="button" class="state-pill" onclick="nav('lead-analysis')">询盘</button><span style="color:var(--soft);font-size:11px">→</span>
      <button type="button" class="state-pill" onclick="nav('lead-all')">线索</button><span style="color:var(--soft);font-size:11px">→</span>
      <button type="button" class="state-pill" onclick="nav('follow-record')">跟进</button><span style="color:var(--soft);font-size:11px">→</span>
      <button type="button" class="state-pill" onclick="nav('customer-profile')">客户</button><span style="color:var(--soft);font-size:11px">→</span>
      <button type="button" class="state-pill" onclick="nav('funnel-analysis')">成交</button>
    </div>
  </div>`;
}
function getSitePageRows(){
  let rows = datasets.sitePages.map((r,i)=>({...r,_idx:i}));
  if(currentRole==="运营专员") rows = rows.filter(r=>r.site!=="苏豪独立站B");
  return rows;
}
function getSiteFormRows(){
  let rows = datasets.siteForms.map((r,i)=>({...r,_idx:i}));
  if(currentRole==="运营专员") rows = rows.filter(r=>r.site!=="苏豪独立站B"&&r.site!=="全部站点");
  return rows;
}
function getSeoKeywordRows(){
  let rows = datasets.siteSeoKeywords.map((r,i)=>({...r,_idx:i}));
  if(currentRole==="运营专员") rows = rows.filter(r=>r.site!=="苏豪独立站B");
  else if(currentRole==="外贸业务员") rows = rows.filter(r=>r.site==="天猫苏豪站");
  return rows;
}
/**
 * PAGE ID: site-page-management
 * MODULE TYPE: list
 * OWNER DOMAIN: site
 */
function renderSitePageManagementPage(){
  const allRows = getSitePageRows();
  const {display:rows} = sliceForPage(allRows,"site-page-management");
  const canWrite = ["管理员","运营专员"].includes(currentRole)&&currentRole!=="访客";
  const byType = {落地页:0,专题页:0,活动页:0};
  allRows.forEach(r=>{ if(byType[r.type]!=null) byType[r.type]++; });
  return `<div class="site-center-page">${siteTraceBannerHtml()}
  <div class="kpi-grid cols-4">
    ${metric("页面总数",allRows.length,`${allRows.filter(r=>r.status==="发布中").length} 个发布中`)}
    ${metric("落地页",byType["落地页"]||0,"主要获客页")}
    ${metric("专题页",byType["专题页"]||0,"品类专题")}
    ${metric("活动页",byType["活动页"]||0,"营销活动")}
  </div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>页面名称</th><th>站点</th><th>类型</th><th>URL</th><th>UV</th><th>询盘数</th><th>状态</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map((r,pi)=>`<tr><td><strong>${r.name}</strong></td><td>${r.site}</td><td>${tag(r.type)}</td><td style="font-size:12px;color:var(--muted)">${r.url}</td><td>${r.uv}</td><td><strong>${r.leads}</strong></td><td>${tag(r.status)}</td><td>${renderRowActions([{label:"查看线索",onclick:"nav('lead-all')"},{label:"编辑",onclick:`toast('编辑 ${r.name}')`}].filter(a=>a.label!=="编辑"||canWrite),`site-page-${pi}`)}</td></tr>`).join(""):`<tr><td colspan="8"><div class="empty">暂无页面</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager("site-page-management",allRows.length)}
  </section></div>`;
}
/**
 * PAGE ID: site-form-management
 * MODULE TYPE: list
 * OWNER DOMAIN: site
 */
function renderSiteFormManagementPage(){
  const allRows = getSiteFormRows();
  const {display:rows} = sliceForPage(allRows,"site-form-management");
  const canWrite = ["管理员","运营专员"].includes(currentRole)&&currentRole!=="访客";
  const enabled = allRows.filter(r=>r.status==="启用").length;
  const totalSub = allRows.reduce((s,r)=>s+(r.submissions||0),0);
  return `<div class="site-center-page">${siteTraceBannerHtml()}
  <div class="kpi-grid cols-4">
    ${metric("表单总数",allRows.length,`${enabled} 个启用`)}
    ${metric("提交总量",totalSub,"本月累计")}
    ${metric("平均转化率",((totalSub/Math.max(allRows.reduce((s,r)=>s+(r.uv||100),0),1))*100).toFixed(1)+"%","表单→询盘")}
    ${metric("关联来源",LEAD_SOURCE_CHANNELS.length+" 种","与来源管理一致")}
  </div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>表单名称</th><th>站点</th><th>字段数</th><th>提交量</th><th>转化率</th><th>来源渠道</th><th>状态</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map((r,pi)=>`<tr><td><strong>${r.name}</strong></td><td>${r.site}</td><td>${r.fields}</td><td>${r.submissions}</td><td>${r.conversion}</td><td>${tag(r.source)}</td><td>${tag(r.status)}</td><td>${renderRowActions([{label:"查看线索",onclick:"nav('lead-all')"},{label:"字段配置",onclick:`toast('配置字段：${r.name}')`}].filter(a=>a.label!=="字段配置"||canWrite),`site-form-${pi}`)}</td></tr>`).join(""):`<tr><td colspan="8"><div class="empty">暂无表单</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager("site-form-management",allRows.length)}
  </section></div>`;
}
/**
 * PAGE ID: site-seo-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: site
 */
function renderSiteSeoAnalysisPage(){
  const allRows = getSeoKeywordRows();
  const {display:rows} = sliceForPage(allRows,"site-seo-analysis");
  const totalTraffic = allRows.reduce((s,r)=>s+(r.traffic||0),0);
  const indexed = allRows.reduce((s,r)=>s+(r.indexed||0),0);
  return `${renderAnalysisPageHead()}
  <div class="kpi-grid cols-4">
    ${metric("收录页面",indexed,"各站点合计")}
    ${metric("自然流量",totalTraffic,"本月 UV 估算")}
    ${metric("Top10 词",allRows.filter(r=>r.rank<=10).length,"排名前十")}
  </div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>关键词</th><th>站点</th><th>排名</th><th>收录数</th><th>搜索量</th><th>预估流量</th><th>趋势</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map((r,pi)=>`<tr><td><strong>${r.keyword}</strong></td><td>${r.site}</td><td>${r.rank<=10?`<span class="tag green">${r.rank}</span>`:r.rank}</td><td>${r.indexed}</td><td>${r.volume}</td><td>${r.traffic}</td><td>${r.trend==="up"?tag("上升"):r.trend==="down"?`<span class="tag red">下降</span>`:tag("稳定")}</td><td>${renderRowActions([{label:"关联页面",onclick:"nav('site-page-management')"}],`seo-${pi}`)}</td></tr>`).join(""):`<tr><td colspan="8"><div class="empty">暂无 SEO 数据</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager("site-seo-analysis",allRows.length)}
  </section>`;
}
/**
 * PAGE ID: permission-management
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderPermissionManagementPage(){
  const rows = getRoleRows();
  const active = rows[selectedRoleIdx]||rows[0]||{};
  const permLabels = [["view","查看"],["create","新增"],["edit","编辑"],["delete","删除"],["export","导出"],["assign","分配"],["transfer","客户转移"],["auth","授权管理"]];
  return `<div class="kpi-grid cols-4">
    ${metric("角色数",rows.length,"权限模板")}
    ${metric("预置角色",rows.filter(r=>r.preset).length,"不可删除")}
    ${metric("菜单分组",navGroups.length,"含站点中心")}
    ${metric("站点中心页",SITE_CENTER_PAGES.length,"业务运营模块")}
  </div>
  <div class="grid-2">
    <section class="panel"><div class="panel-head"><div class="panel-title">按钮权限 · ${active.name||"—"}</div></div><div class="panel-body">
      <div class="check-grid">${permLabels.map(([k,l])=>`<div class="check-row"><span>${l}</span><input type="checkbox" ${active.perms&&active.perms[k]?"checked":""} disabled></div>`).join("")}</div>
      <div class="toolbar-actions" style="margin-top:12px"><button class="btn small primary" onclick="openModal('rolePerm')">编辑权限</button><button class="btn small" onclick="openModal('permMatrix')">权限矩阵</button></div>
    </div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">模块访问范围</div></div><div class="panel-body"><div class="summary-list">
      ${kv("站点中心","运营专员/管理员可编辑 · 协同人/业务员只读部分")}${kv("数据分析","全员可读（业务员仅个人绩效）")}${kv("系统管理","仅管理员 · 不含站点管理")}${kv("数据范围",active.scope||"—")}
    </div></div></section>
  </div>`;
}
/**
 * PAGE ID: menu-management
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function buildSystemMenusFromNavGroups(){
  const rows = [];
  let sortBase = 0;
  navGroups.forEach(g=>{
    sortBase += 10;
    rows.push({
      id:`MENU-G-${String(sortBase).padStart(3,"0")}`,
      name:g.title,
      type:"目录",
      pageId:"—",
      route:"—",
      parent:"—",
      sort:sortBase,
      visible:true,
      status:"启用"
    });
    g.items.forEach((item, idx)=>{
      rows.push({
        id:`MENU-${String(rows.length + 1).padStart(3,"0")}`,
        name:item[1],
        type:"页面",
        pageId:item[0],
        route:item[0],
        parent:g.title,
        sort:sortBase + idx + 1,
        visible:true,
        status:"启用"
      });
    });
  });
  return rows;
}
function ensureSystemMenusDataset(){
  if(!datasets.systemMenus || !datasets.systemMenus.length){
    datasets.systemMenus = buildSystemMenusFromNavGroups();
  }
  return datasets.systemMenus;
}
function getMenuRows(){
  return ensureSystemMenusDataset().map((m,i)=>({...m,_idx:i})).sort((a,b)=>(a.sort||0)-(b.sort||0));
}
function nextMenuId(){
  const nums = datasets.systemMenus.map(m=>parseInt(String(m.id||"").replace(/\D/g,""),10)).filter(n=>!isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return "MENU-" + String(next).padStart(3,"0");
}
function openMenuModal(idx){
  menuEditIdx = idx != null && idx >= 0 ? idx : null;
  openModal("menu");
}
function moveMenuItem(idx, dir){
  const rows = ensureSystemMenusDataset();
  const targetIdx = dir === "up" ? idx - 1 : idx + 1;
  if(targetIdx < 0 || targetIdx >= rows.length) return;
  const cur = rows[idx];
  const other = rows[targetIdx];
  if(!cur || !other) return;
  const tmp = cur.sort;
  cur.sort = other.sort;
  other.sort = tmp;
  rows.sort((a,b)=>a.sort - b.sort);
  toast(dir === "up" ? `「${cur.name}」已上移` : `「${cur.name}」已下移`);
  renderPage();
}
function toggleMenuVisible(idx, visible){
  const m = datasets.systemMenus?.[idx];
  if(!m) return;
  m.visible = visible;
  toast(`「${m.name}」已${visible ? "设为显示" : "隐藏"}`);
  renderPage();
}
function toggleMenuStatus(idx, status){
  const m = datasets.systemMenus?.[idx];
  if(!m) return;
  m.status = status;
  toast(`「${m.name}」已${status}`);
  renderPage();
}
function renderMenuFormHtml(editIdx){
  const m = editIdx != null ? datasets.systemMenus[editIdx] : null;
  const isEdit = !!m;
  const parentOptions = ["—", ...navGroups.map(g=>g.title)].map(p=>`<option${(m?.parent || "—") === p ? " selected" : ""}>${p}</option>`).join("");
  return `<div style="margin-bottom:12px;padding:10px 12px;background:#f6f9fc;border-radius:8px;font-size:12px;line-height:1.7;color:var(--muted)">
    配置系统左侧导航菜单：维护菜单名称、路由 pageId、排序与显示状态。角色权限请在「权限管理」中配置。
  </div>
  <div class="form-grid">
    <div class="field" data-field="menuName"><label>菜单名称 <span style="color:var(--danger)">*</span></label><input placeholder="如 用户管理" value="${m?.name || ""}"><div class="form-feedback"></div></div>
    <div class="field" data-field="menuType"><label>菜单类型</label><select><option${!m || m.type === "页面" ? " selected" : ""}>页面</option><option${m?.type === "目录" ? " selected" : ""}>目录</option></select></div>
    <div class="field" data-field="menuPageId"><label>路由 / pageId</label><input placeholder="如 user-management" value="${m?.pageId && m.pageId !== "—" ? m.pageId : ""}"><div class="form-feedback"></div></div>
    <div class="field" data-field="menuParent"><label>上级菜单</label><select>${parentOptions}</select></div>
    <div class="field" data-field="menuSort"><label>排序</label><input type="number" min="1" placeholder="数字越小越靠前" value="${m?.sort ?? ""}"><div class="form-feedback"></div></div>
    <div class="field" data-field="menuStatus"><label>状态</label><select><option${!m || m.status === "启用" ? " selected" : ""}>启用</option><option${m?.status === "停用" ? " selected" : ""}>停用</option></select></div>
    <div class="field span-2" data-field="menuVisible"><label>是否显示</label><select><option value="1"${!m || m.visible !== false ? " selected" : ""}>显示</option><option value="0"${m && m.visible === false ? " selected" : ""}>隐藏</option></select></div>
    <div class="field span-2"><label>备注</label><textarea rows="2" placeholder="菜单说明、路由备注（可选）">${m?.note || ""}</textarea></div>
  </div>`;
}
function validateMenuModalForm(){
  clearFormValidation();
  let ok = true;
  const name = getModalFieldValue("menuName");
  const pageId = getModalFieldValue("menuPageId");
  const type = getModalFieldValue("menuType") || "页面";
  const checks = [
    {field:"menuName", label:"菜单名称", val:name, required:true},
    {field:"menuPageId", label:"路由 / pageId", val:pageId, required:type === "页面", validate:v=>/^[a-z0-9-]+$/.test(v), msg:"pageId 仅支持小写字母、数字与连字符"}
  ];
  for(const rule of checks){
    const wrap = document.querySelector(`#modalBody [data-field="${rule.field}"]`);
    const fb = wrap?.querySelector(".form-feedback");
    if(rule.required && !rule.val){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = `${rule.label}为必填项`; fb.classList.add("err"); }
      continue;
    }
    if(rule.validate && rule.val && !rule.validate(rule.val)){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = rule.msg || `${rule.label}格式不正确`; fb.classList.add("err"); }
    }
  }
  return ok ? {ok:true} : {ok:false, msg:"请修正表单错误后再提交"};
}
function saveMenuFromModal(){
  const name = getModalFieldValue("menuName");
  const type = getModalFieldValue("menuType") || "页面";
  const pageId = getModalFieldValue("menuPageId") || "—";
  const parent = getModalFieldValue("menuParent") || "—";
  const sort = parseInt(getModalFieldValue("menuSort"), 10);
  const status = getModalFieldValue("menuStatus") || "启用";
  const visible = getModalFieldValue("menuVisible") !== "0";
  const note = document.querySelector("#modalBody textarea")?.value.trim() || "";
  const rows = ensureSystemMenusDataset();
  const payload = {
    name,
    type,
    pageId: type === "目录" ? "—" : pageId,
    route: type === "目录" ? "—" : pageId,
    parent,
    sort: Number.isFinite(sort) ? sort : rows.length + 1,
    visible,
    status,
    note
  };
  if(menuEditIdx != null){
    Object.assign(rows[menuEditIdx], payload);
  }else{
    rows.push({id:nextMenuId(), ...payload});
    rows.sort((a,b)=>a.sort - b.sort);
  }
  return true;
}
function renderMenuManagementPage(){
  const allRows = getMenuRows();
  const pagerKey = "menu-management";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const canWrite = currentRole === "管理员";
  const enabled = allRows.filter(m=>m.status === "启用").length;
  const visible = allRows.filter(m=>m.visible !== false).length;
  const pageMenus = allRows.filter(m=>m.type === "页面").length;
  return `<div style="margin-bottom:14px;padding:12px 14px;background:#f6f9fc;border:1px solid var(--line);border-radius:8px;font-size:12px;line-height:1.75;color:var(--muted)">
    <strong style="color:var(--text)">菜单配置后台</strong> · 维护系统导航菜单、路由 pageId、排序与显示控制。角色权限与用户分配请在对应模块中管理。
  </div>
  <div class="kpi-grid cols-4">
    ${metric("菜单总数",allRows.length,`${pageMenus} 个页面菜单`)}
    ${metric("启用菜单",enabled,"可访问")}
    ${metric("显示中",visible,"左侧导航可见")}
    ${metric("目录分组",allRows.filter(m=>m.type === "目录").length,"一级菜单")}
  </div>
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>菜单名称</label><input placeholder="菜单关键词"></div>
    <div class="field"><label>菜单类型</label><select><option>全部</option><option>目录</option><option>页面</option></select></div>
    <div class="field"><label>状态</label><select><option>全部</option><option>启用</option><option>停用</option></select></div>
    <div class="head-actions">
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条菜单')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <section class="panel"><div class="panel-head"><div class="panel-title">系统菜单列表</div></div>
    <div class="table-wrap"><table><thead><tr>
      <th>菜单名称</th><th>菜单类型</th><th>路由 / pageId</th><th>上级菜单</th><th>排序</th><th>是否显示</th><th>状态</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length ? rows.map((m,i)=>{
        const gi = allRows.indexOf(m);
        const idx = gi >= 0 ? gi : i;
        return `<tr style="${m.visible === false ? "opacity:.65" : ""}">
          <td><strong>${m.name}</strong>${m.type === "目录" ? `<br><span style="font-size:11px;color:var(--soft)">一级分组</span>` : ""}</td>
          <td>${m.type === "目录" ? tag("目录") : tag("页面")}</td>
          <td><code>${m.pageId || "—"}</code></td>
          <td>${m.parent || "—"}</td>
          <td>${m.sort ?? "—"}</td>
          <td>${m.visible !== false ? tag("显示") : `<span class="tag gray">隐藏</span>`}</td>
          <td>${m.status === "启用" ? tag("启用") : tag("停用")}</td>
          <td>${renderRowActions([
            {label:"编辑", onclick:`openMenuModal(${idx})`},
            canWrite && m.type !== "目录" && {label:"上移", onclick:`moveMenuItem(${idx},"up")`},
            canWrite && m.type !== "目录" && {label:"下移", onclick:`moveMenuItem(${idx},"down")`},
            canWrite && m.type !== "目录" && m.visible !== false && {label:"隐藏", onclick:`toggleMenuVisible(${idx},false)`},
            canWrite && m.type !== "目录" && m.visible === false && {label:"显示", onclick:`toggleMenuVisible(${idx},true)`, primary:true},
            canWrite && m.type !== "目录" && m.status === "启用" && {label:"停用", onclick:`toggleMenuStatus(${idx},"停用")`},
            canWrite && m.type !== "目录" && m.status === "停用" && {label:"启用", onclick:`toggleMenuStatus(${idx},"启用")`, primary:true}
          ].filter(Boolean), `menu-${idx}`)}</td>
        </tr>`;
      }).join("") : `<tr><td colspan="8"><div class="empty">暂无菜单配置</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey, allRows.length)}
  </section>`;
}
/**
 * PAGE ID: data-dictionary
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderDataDictionaryPage(){
  const allRows = [
    {code:"lead_stage",name:"线索阶段",items:"待首响/跟进中/报价打样/已成交/已失效",module:"线索中心"},
    {code:"lead_channel",name:"来源渠道",items:LEAD_SOURCE_CHANNELS.join("、"),module:"站点中心"},
    {code:"customer_level",name:"客户等级",items:"A类/B类/C类/D类",module:"客户中心"},
    {code:"contract_state",name:"合同状态",items:"生效中/已完成/已终止",module:"合同中心"},
    {code:"follow_method",name:"跟进方式",items:"邮件/WhatsApp/电话/微信/面谈",module:"客户中心"}
  ];
  const pagerKey = "data-dictionary";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  return `<section class="panel"><div class="panel-head"><div class="panel-title">数据字典</div></div>
    <div class="table-wrap"><table><thead><tr><th>编码</th><th>名称</th><th>枚举值</th><th>所属模块</th><th>操作</th></tr></thead><tbody>
      ${rows.map((d,pi)=>`<tr><td><code>${d.code}</code></td><td><strong>${d.name}</strong></td><td style="font-size:12px;color:var(--muted)">${d.items}</td><td>${d.module}</td><td>${renderRowActions([{label:"编辑",onclick:`toast('编辑字典 ${d.name}')`}],`dict-${pi}`)}</td></tr>`).join("")}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
/**
 * PAGE ID: param-config
 * MODULE TYPE: detail
 * OWNER DOMAIN: system
 */
function formatSystemRuleValue(value){
  if(value==="开启"||value==="是") return tag(value);
  if(value==="关闭"||value==="否") return `<span class="tag gray">${value}</span>`;
  return tag(value);
}
function renderSystemRulesGroupsHtml(){
  const groups = datasets.systemRuleGroups || [];
  const canWrite = currentRole==="管理员";
  return groups.map((g,gi)=>`<section class="panel param-config-rule-group">
    <div class="panel-head"><div class="panel-title">${g.title}</div></div>
    ${g.note?`<div class="param-config-rule-note">${g.note}</div>`:""}
    <div class="table-wrap"><table class="param-config-rule-table"><thead><tr><th>规则名称</th><th>规则说明</th><th>当前配置</th>${canWrite?"<th>操作</th>":""}</tr></thead><tbody>
      ${(g.rules||[]).map((r,ri)=>`<tr>
        <td><strong>${r.name}</strong></td>
        <td style="font-size:12px;color:var(--muted);line-height:1.65;white-space:normal;max-width:420px">${r.desc||"—"}</td>
        <td>${formatSystemRuleValue(r.value)}</td>
        ${canWrite?`<td>${renderRowActions([{label:"编辑",onclick:`toast('编辑规则：${r.name}')`}],`rule-${gi}-${ri}`)}</td>`:""}
      </tr>`).join("")}
    </tbody></table></div>
  </section>`).join("");
}
function renderParamConfigPage(){
  return `<div class="param-config-page">
  <div class="param-config-intro">
    <strong>参数配置</strong> · 包含 <strong>AI 配置</strong> 与 <strong>系统规则</strong> 两部分，用于管理 CRM 能力接入与自动化业务运行规则。
  </div>
  <section class="panel param-config-ai-panel">${renderAiConfigFormHtml()}</section>
  ${renderAiInsightPanel()}
  <section class="panel param-config-rules-intro">
    <div class="panel-head"><div class="panel-title">系统规则配置</div></div>
    <div class="panel-body">
      <p class="param-config-rules-desc">用于管理 CRM 自动化业务规则与系统运行规则。</p>
    </div>
  </section>
  ${renderSystemRulesGroupsHtml()}
</div>`;
}
function getUserRows(){
  let rows = datasets.users.map((u,i)=>({...u,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(u=>u.name==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(u=>u.role!=="管理员");
  else if(currentRole==="协同人") rows = rows.filter(u=>u.role!=="管理员");
  return rows;
}
function getDingTalkBindStatus(user){
  return user?.dingtalkId ? "已绑定" : "未绑定";
}
function getDingTalkBindTag(user){
  return user?.dingtalkId ? tag("已绑定") : `<span class="tag gray">未绑定</span>`;
}
function getUserByDingTalkId(dingtalkId){
  const id = String(dingtalkId || "").trim();
  if(!id || id === DINGTALK_UNBOUND_DEMO_ID) return null;
  return datasets.users.find(u => u.dingtalkId === id) || null;
}
function isDingTalkIdTaken(dingtalkId, excludeIdx){
  const id = String(dingtalkId || "").trim();
  if(!id) return false;
  return datasets.users.some((u, i) => u.dingtalkId === id && i !== excludeIdx);
}
function buildSessionUserFromDataset(user){
  const sites = user.sites === "全部站点"
    ? datasets.sites.map(s => s.name)
    : String(user.sites || "").split("、").filter(Boolean);
  return {name:user.name, role:user.role, avatar:(user.name || "?").charAt(0), sites};
}
function syncReviewAccountFromUser(user){
  if(!user?.account) return;
  reviewAccounts[String(user.account).trim().toLowerCase()] = buildSessionUserFromDataset(user);
}
function nextUserId(){
  const nums = datasets.users.map(u => parseInt(String(u.id || "").replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return "USR-" + String(next).padStart(3, "0");
}
function isUserDingBindEnabled(){
  const el = document.getElementById("userDingBindToggle");
  return !!el?.checked;
}
function toggleUserDingBindFields(checked){
  const box = document.getElementById("userDingBindFields");
  if(box) box.style.display = checked ? "" : "none";
}
function renderUserFormHtml(editIdx){
  const u = editIdx != null ? datasets.users[editIdx] : null;
  const isEdit = !!u;
  const roleOptions = ["管理员","运营专员","协同人","外贸业务员","访客"].map(r=>{
    const disabled = r === "管理员" && currentRole !== "管理员" ? " disabled" : "";
    return `<option${u?.role === r ? " selected" : ""}${disabled}>${r}</option>`;
  }).join("");
  const siteOptions = ["全部站点", ...datasets.sites.map(s => s.name)].map(s=>`<option${u?.sites === s || (!u && s === "指定站点") ? " selected" : ""}>${s}</option>`).join("");
  return `<div style="margin-bottom:12px;padding:10px 12px;background:#f6f9fc;border-radius:8px;font-size:12px;line-height:1.7;color:var(--muted)">
    <strong style="color:var(--text)">登录规则：</strong>系统支持<strong>账号密码登录</strong>与<strong>钉钉扫码登录</strong>两种方式。一个钉钉账号只能绑定一个系统账号；仅已绑定的钉钉账号可登录成功。
  </div>
  <div class="form-grid">
    <div class="field" data-field="name"><label>姓名 <span style="color:var(--danger)">*</span></label><input placeholder="用户姓名" value="${u?.name || ""}"><div class="form-feedback"></div></div>
    <div class="field" data-field="account"><label>系统账号 <span style="color:var(--danger)">*</span></label><input placeholder="邮箱格式登录账号" value="${u?.account || ""}"${isEdit ? " readonly" : ""}><div class="form-feedback"></div></div>
    <div class="field" data-field="password"><label>密码${isEdit ? "" : " <span style=\"color:var(--danger)\">*</span>"}</label><input type="password" placeholder="${isEdit ? "留空则不修改" : "初始登录密码"}"><div class="form-feedback"></div></div>
    <div class="field" data-field="role"><label>角色</label><select>${roleOptions}</select></div>
    <div class="field" data-field="state"><label>账号状态</label><select><option${!u || u.state === "正常" ? " selected" : ""}>正常</option><option${u?.state === "冻结" ? " selected" : ""}>冻结</option></select></div>
    <div class="field span-2" data-field="sites"><label>站点范围</label><select><option>按站点范围配置</option>${siteOptions}<option>指定站点</option></select></div>
    <div class="field span-2">
      <label>钉钉账号绑定</label>
      <div class="check-row" style="margin-bottom:8px"><span>绑定钉钉账号</span><input type="checkbox" id="userDingBindToggle" ${u?.dingtalkId ? "checked" : ""} onchange="toggleUserDingBindFields(this.checked)"></div>
      <div id="userDingBindFields" style="${u?.dingtalkId ? "" : "display:none"}">
        <div class="form-grid" style="margin-top:4px">
          <div class="field" data-field="dingtalkId"><label>钉钉账号 ID <span style="color:var(--danger)">*</span></label><input placeholder="如 DT-006" value="${u?.dingtalkId || ""}"><div class="form-feedback"></div></div>
          <div class="field" data-field="dingtalkName"><label>钉钉显示名 <span style="color:var(--danger)">*</span></label><input placeholder="钉钉通讯录姓名" value="${u?.dingtalkName || ""}"><div class="form-feedback"></div></div>
        </div>
        ${isEdit && u?.dingtalkId ? `<p style="font-size:11px;color:var(--soft);margin-top:6px">当前已绑定：${u.dingtalkName}（${u.dingtalkId}）</p>` : ""}
      </div>
    </div>
    <div class="field span-2"><label>备注</label><textarea rows="3" placeholder="记录账号用途、授权原因或交接说明">${u?.note || ""}</textarea></div>
  </div>`;
}
function openUserModal(idx){
  userEditIdx = idx != null && idx >= 0 ? idx : null;
  openModal("user");
}
function validateUserModalForm(){
  clearFormValidation();
  let ok = true;
  const name = getModalFieldValue("name");
  const account = getModalFieldValue("account");
  const password = getModalFieldValue("password");
  const bindEnabled = isUserDingBindEnabled();
  const dingtalkId = getModalFieldValue("dingtalkId");
  const dingtalkName = getModalFieldValue("dingtalkName");
  const checks = [
    {field:"name", label:"姓名", val:name, required:true},
    {field:"account", label:"系统账号", val:account, required:true, validate:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg:"请输入有效邮箱格式系统账号", unique:v=>{
      const key = v.toLowerCase();
      return !datasets.users.some((u,i)=>u.account.toLowerCase()===key && i!==userEditIdx);
    }, msgUnique:"系统账号已存在"},
    {field:"password", label:"密码", val:password, required:userEditIdx==null, minLen:userEditIdx==null?6:0}
  ];
  if(bindEnabled){
    checks.push(
      {field:"dingtalkId", label:"钉钉账号 ID", val:dingtalkId, required:true, unique:v=>!isDingTalkIdTaken(v, userEditIdx), msgUnique:"该钉钉账号已绑定其他系统账号，一个钉钉账号只能绑定一个系统账号"},
      {field:"dingtalkName", label:"钉钉显示名", val:dingtalkName, required:true}
    );
  }
  for(const rule of checks){
    const wrap = document.querySelector(`#modalBody [data-field="${rule.field}"]`);
    const fb = wrap?.querySelector(".form-feedback");
    if(rule.required && !rule.val){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = `${rule.label}为必填项`; fb.classList.add("err"); }
      continue;
    }
    if(rule.minLen && rule.val && rule.val.length < rule.minLen){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = `${rule.label}至少 ${rule.minLen} 个字符`; fb.classList.add("err"); }
      continue;
    }
    if(rule.validate && rule.val && !rule.validate(rule.val)){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = rule.msg || `${rule.label}格式不正确`; fb.classList.add("err"); }
      continue;
    }
    if(rule.unique && rule.val && !rule.unique(rule.val)){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = rule.msgUnique || `${rule.label}已存在`; fb.classList.add("err"); }
    }
  }
  return ok ? {ok:true} : {ok:false, msg:"请修正表单错误后再提交"};
}
function saveUserFromModal(){
  const name = getModalFieldValue("name");
  const account = getModalFieldValue("account").toLowerCase();
  const password = getModalFieldValue("password");
  const role = getModalFieldValue("role") || "外贸业务员";
  const state = getModalFieldValue("state") || "正常";
  const sites = getModalFieldValue("sites") || "指定站点";
  const bindEnabled = isUserDingBindEnabled();
  const dingtalkId = bindEnabled ? getModalFieldValue("dingtalkId").trim() : null;
  const dingtalkName = bindEnabled ? getModalFieldValue("dingtalkName").trim() : null;
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  if(userEditIdx != null){
    const user = datasets.users[userEditIdx];
    if(!user) return false;
    user.name = name;
    user.role = role;
    user.state = state;
    user.sites = sites;
    if(password) user.password = password;
    user.dingtalkId = dingtalkId;
    user.dingtalkName = dingtalkName;
    user.lastOp = `${now} 编辑用户`;
    syncReviewAccountFromUser(user);
  }else{
    datasets.users.push({
      id:nextUserId(),
      account,
      name,
      role,
      sites,
      state,
      login:"-",
      dept:"—",
      phone:"—",
      created:now.slice(0, 10),
      lastOp:`${now} 新增用户`,
      password:password || "123456",
      dingtalkId,
      dingtalkName
    });
    syncReviewAccountFromUser(datasets.users[datasets.users.length - 1]);
  }
  return true;
}
function getDingTalkPrototypeOptionsHtml(){
  const bound = datasets.users.filter(u => u.dingtalkId);
  const boundOpts = bound.map(u=>`<option value="${u.dingtalkId}">${u.dingtalkName}（${u.dingtalkId}）· 已绑定</option>`).join("");
  return `<option value="${DINGTALK_UNBOUND_DEMO_ID}">未绑定钉钉（演示失败）</option>${boundOpts}`;
}
function handleDingTalkLogin(){
  const err = document.getElementById("loginError");
  const sel = document.getElementById("dingTalkProtoAccount");
  const dingId = sel?.value || DINGTALK_UNBOUND_DEMO_ID;
  const btn = document.querySelector("#loginSso .login-sso");
  if(err) err.classList.remove("show");
  if(btn){ btn.disabled = true; btn.textContent = "扫码验证中…"; }
  setTimeout(()=>{
    if(btn){ btn.disabled = false; btn.textContent = "模拟扫码成功（演示）"; }
    const user = getUserByDingTalkId(dingId);
    if(!user){
      if(err){
        err.textContent = "钉钉账号未绑定系统账号，无法登录。请在用户管理中完成绑定后重试。";
        err.classList.add("show");
      }
      return;
    }
    if(user.state === "冻结"){
      if(err){
        err.textContent = "系统账号已冻结，无法登录。";
        err.classList.add("show");
      }
      return;
    }
    sessionUser = reviewAccounts[user.account.toLowerCase()] || buildSessionUserFromDataset(user);
    if(typeof setActiveSessionEmail === "function") setActiveSessionEmail(user.account.toLowerCase());
    if(typeof enterApp === "function") enterApp();
  }, 600);
}
function injectDingTalkLoginPrototype(){
  const ssoPane = document.getElementById("loginSso");
  if(!ssoPane || ssoPane.dataset.dingProto === "1") return;
  ssoPane.dataset.dingProto = "1";
  const qrBox = document.getElementById("dingTalkQr");
  if(qrBox){
    qrBox.insertAdjacentHTML("afterend", `<div class="login-field" style="margin-top:12px"><label>原型：模拟扫码身份</label><select id="dingTalkProtoAccount">${getDingTalkPrototypeOptionsHtml()}</select></div>`);
  }
  const btn = ssoPane.querySelector(".login-sso");
  if(btn) btn.onclick = handleDingTalkLogin;
  const note = ssoPane.querySelector(".login-note");
  if(note){
    note.innerHTML = `请使用钉钉 App 扫描上方二维码登录<br><span style="font-size:11px;color:var(--soft)">原型规则：扫码默认成功，但未绑定系统账号的钉钉身份将登录失败</span><br><a href="javascript:void(0)" onclick="initDingTalkQr();toast('二维码已刷新')">刷新二维码</a>`;
  }
}
function installDingTalkLoginPrototype(){
  const loginView = document.getElementById("loginView");
  if(!loginView) return;
  injectDingTalkLoginPrototype();
  if(loginView.dataset.dingLoginHook === "1") return;
  loginView.dataset.dingLoginHook = "1";
  new MutationObserver(()=>injectDingTalkLoginPrototype()).observe(loginView, {childList:true, subtree:true});
}
function bootstrapDingTalkLoginSupport(){
  installDingTalkLoginPrototype();
  if(typeof getActiveSessionUser !== "function") return;
  const origGetActive = getActiveSessionUser;
  window.getActiveSessionUser = function(){
    try{
      const email = sessionStorage.getItem("crm_active_email_v1");
      if(email){
        const key = String(email).trim().toLowerCase();
        if(reviewAccounts[key]) return reviewAccounts[key];
        const dsUser = datasets.users.find(u => u.account.toLowerCase() === key);
        if(dsUser) return dsUser.state === "冻结" ? null : buildSessionUserFromDataset(dsUser);
      }
    }catch(e){}
    return origGetActive();
  };
  if(typeof switchLoginTab === "function"){
    const origSwitch = switchLoginTab;
    window.switchLoginTab = function(type, el){
      origSwitch(type, el);
      if(type === "sso") setTimeout(injectDingTalkLoginPrototype, 0);
    };
  }
}
(function initDingTalkSupport(){
  function boot(){ bootstrapDingTalkLoginSupport(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ()=>setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
function getRoleRows(){
  let rows = datasets.roles.map((r,i)=>({...r,_idx:i}));
  if(currentRole==="运营专员"||currentRole==="协同人"||currentRole==="外贸业务员") rows = rows.filter(r=>!r.deletable||r.preset);
  return rows;
}
function canManageUsers(){
  return currentRole==="管理员"||(currentRole==="运营专员"&&currentPage==="user-management");
}
function toggleUserAdvanced(){ userAdvancedOpen=!userAdvancedOpen; renderPage(); }
function toggleRoleAdvanced(){ roleAdvancedOpen=!roleAdvancedOpen; renderPage(); }
function toggleUserRow(i,checked){ if(checked) userSelected.add(i); else userSelected.delete(i); renderPage(); }
function toggleUserAll(checked){ getUserRows().forEach((_,i)=> checked?userSelected.add(i):userSelected.delete(i)); renderPage(); }
function batchUserAction(action){ toast(`${{freeze:"批量冻结",enable:"批量启用",export:"批量导出",auth:"批量授权"}[action]||action}：已处理 ${userSelected.size||1} 个用户`); userSelected.clear(); renderPage(); }
function selectRoleForPerm(i){ selectedRoleIdx=i; renderPage(); }
function openRoleDrawer(i){ openDrawer("roles",i); }
/**
 * PAGE ID: user-management
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderUserManagementPage(){
  const allRows = getUserRows();
  const pagerKey = "user-management";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const readonly = currentRole==="访客";
  const canWrite = canManageUsers()&&!readonly;
  const normal = allRows.filter(u=>u.state==="正常").length;
  const frozen = allRows.filter(u=>u.state==="冻结").length;
  return `${currentRole==="运营专员"?`<div style="margin-bottom:10px"><span class="tag blue">按站点维护</span></div>`:""}
  <div style="margin-bottom:14px;padding:12px 14px;background:#f6f9fc;border:1px solid var(--line);border-radius:8px;font-size:12px;line-height:1.75;color:var(--muted)">
    <strong style="color:var(--text)">登录方式与绑定规则</strong><br>
    系统支持 <strong>系统账号密码登录</strong> 与 <strong>钉钉扫码登录</strong> 两种方式。业务规则：一个钉钉账号只能绑定一个系统账号；只有已绑定系统账号的钉钉账号才能登录成功。
  </div>
  <div class="kpi-grid cols-4">
    ${metric("用户总数",allRows.length,`${normal} 正常`)}
    ${metric("正常账号",normal,"可登录")}
    ${metric("冻结账号",frozen,frozen?"不可登录":"—",frozen?"warn":"")}
    ${metric("角色分布",new Set(allRows.map(u=>u.role)).size+" 种","预置+自定义")}
  </div>
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>账号/姓名</label><input placeholder="姓名、账号关键词"></div>
    <div class="field"><label>角色</label><select><option>全部</option><option>管理员</option><option>运营专员</option><option>协同人</option><option>外贸业务员</option><option>访客</option></select></div>
    <div class="field"><label>状态</label><select><option>全部</option><option>正常</option><option>冻结</option></select></div>
    <div class="field"><label>站点范围</label><select><option>全部</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}<option>全部站点</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleUserAdvanced()">${userAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 个用户')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${userAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>部门</label><input placeholder="归属部门"></div>
    <div class="field"><label>最后登录</label><input type="date"></div>
  </div></div>
  ${renderBatchBar({
    count:userSelected.size,
    unit:"个用户",
    onCancel:"userSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small" onclick="batchUserAction('freeze')">批量冻结</button><button type="button" class="btn small" onclick="batchUserAction('enable')">批量启用</button><button type="button" class="btn small primary" onclick="openModal('auth')">批量授权</button>`:""}<button type="button" class="btn small" onclick="batchUserAction('export')">批量导出</button>`
  })}
  <section class="panel"><div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleUserAll(this.checked)"></th>`:""}
      <th>系统账号</th><th>姓名</th><th>角色</th><th>钉钉绑定状态</th><th>钉钉账号</th><th>站点范围</th><th>部门</th><th>状态</th><th>最后登录</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((u,i)=>{const gi=allRows.indexOf(u);const idx=gi>=0?gi:i;return `<tr style="${u.state==="冻结"?"background:#f8f8f8":""}">
        ${canWrite?`<td><input type="checkbox" onchange="toggleUserRow(${idx},this.checked)" ${userSelected.has(idx)?"checked":""} ${u.role==="管理员"&&currentRole!=="管理员"?"disabled":""}></td>`:""}
        <td><strong>${u.account}</strong></td><td>${u.name}</td><td>${tag(u.role)}</td>
        <td>${getDingTalkBindTag(u)}</td><td>${u.dingtalkId ? `${u.dingtalkName || "—"}<br><span style="font-size:11px;color:var(--soft)">${u.dingtalkId}</span>` : "—"}</td>
        <td>${u.sites}</td><td>${u.dept||"—"}</td>
        <td>${u.state==="正常"?tag("正常"):`<span class="tag gray">${u.state}</span>`}</td><td>${u.login||"—"}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openDrawer("users",${u._idx})`},
          canWrite&&!(u.role==="管理员"&&currentRole!=="管理员")&&{label:"编辑",onclick:`openUserModal(${u._idx})`},
          canWrite&&!(u.role==="管理员"&&currentRole!=="管理员")&&{label:"授权",onclick:"openModal('auth')"},
          canWrite&&!(u.role==="管理员"&&currentRole!=="管理员")&&{label:u.state==="正常"?"冻结":"启用",onclick:"openModal('userFreeze')",danger:u.state==="正常"},
          {label:"站点→",onclick:"nav('site-owner')"}
        ].filter(Boolean),`user-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?9:8}"><div class="empty">暂无可见用户</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>`;
}
/**
 * PAGE ID: role-management
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderRoleManagementPage(){
  const allRows = getRoleRows();
  const pagerKey = "role-management";
  const {display:rows} = sliceForPage(allRows, pagerKey);
  const readonly = currentRole==="访客";
  const canWrite = currentRole==="管理员"&&!readonly;
  const active = allRows[selectedRoleIdx]||allRows[0]||{};
  const permLabels = [["view","查看"],["create","新增"],["edit","编辑"],["delete","删除"],["export","导出"],["assign","分配"],["transfer","客户转移"],["auth","授权管理"]];
  const menuGroups = ["工作台","线索中心","客户中心","合同中心","沟通中心","站点中心","数据分析","系统管理"];
  return `<div class="role-management-page">
  ${!canWrite?`<div class="role-mgmt-note"><span class="tag gray">仅管理员可编辑角色</span></div>`:""}
  <div class="kpi-grid cols-4">
    ${metric("角色总数",allRows.length,`${allRows.filter(r=>r.preset).length} 个预置`)}
    ${metric("启用角色",allRows.filter(r=>r.status==="启用").length,"可分配")}
    ${metric("关联用户",allRows.reduce((s,r)=>s+(r.userCount||0),0),"账号绑定")}
    ${metric("自定义角色",allRows.filter(r=>!r.preset).length,"可删除")}
  </div>
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>角色名称</label><input placeholder="角色关键词"></div>
    <div class="field"><label>类型</label><select><option>全部</option><option>预置</option><option>自定义</option></select></div>
    <div class="field"><label>状态</label><select><option>全部</option><option>启用</option><option>停用</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleRoleAdvanced()">${roleAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 个角色')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${roleAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>数据范围</label><input placeholder="如 全站、本人负责"></div>
    <div class="field"><label>菜单组数</label><select><option>全部</option><option>3 组及以下</option><option>4-6 组</option><option>7 组及以上</option></select></div>
  </div></div>
  <section class="panel role-mgmt-list-panel">
    <div class="panel-head"><div class="panel-title">角色列表</div></div>
    <div class="table-wrap"><table class="role-mgmt-table"><thead><tr><th>角色</th><th>类型</th><th>用户数</th><th>菜单组</th><th>状态</th><th>操作</th></tr></thead><tbody>
        ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);const idx=gi>=0?gi:i;return `<tr class="role-mgmt-row${selectedRoleIdx===idx?" is-active":""}" onclick="selectRoleForPerm(${idx})">
          <td><strong>${r.name}</strong><br><span class="role-mgmt-desc">${r.desc||""}</span></td>
          <td>${r.preset?tag("预置"):`<span class="tag blue">自定义</span>`}</td>
          <td>${r.userCount||0}</td><td>${r.menus||"—"}</td>
          <td>${r.status==="启用"?tag("启用"):tag("停用")}</td>
          <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
            {label:"详情",onclick:`openRoleDrawer(${r._idx})`},
            canWrite&&{label:"配置权限",onclick:"openModal('rolePerm')",primary:true},
            canWrite&&r.deletable&&{label:"删除",onclick:"toast('自定义角色已删除')",danger:true},
            !canWrite&&{label:"查看用户",onclick:"nav('user-management')"}
          ].filter(Boolean),`role-${idx}`)}${canWrite&&!r.deletable?`<span class="tag gray role-mgmt-tag">不可删</span>`:""}</td>
        </tr>`;}).join(""):`<tr><td colspan="6"><div class="empty">暂无可见角色</div></td></tr>`}
      </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>
  <div class="grid-2 role-mgmt-detail-grid">
    <section class="panel"><div class="panel-head"><div class="panel-title">${active.name||"角色"} · 按钮权限</div></div><div class="panel-body">
      <div class="check-grid role-mgmt-check-grid">${permLabels.map(([k,l])=>`<div class="check-row"><span>${l}</span><input type="checkbox" ${active.perms&&active.perms[k]?"checked":""} ${canWrite?"":"disabled"}></div>`).join("")}</div>
      ${canWrite?`<div class="toolbar-actions role-mgmt-toolbar"><button class="btn small primary" onclick="openModal('rolePerm')">编辑权限</button><button class="btn small" onclick="nav('user-management')">分配用户</button></div>`:""}
    </div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">${active.name||"角色"} · 数据范围</div></div><div class="panel-body"><div class="summary-list">
      ${kv("角色描述",active.desc||"—")}${kv("数据范围",active.scope||"—")}${kv("菜单组数",active.menus||"—")}${kv("角色状态",active.status||"—")}
    </div></div></section>
  </div>
  <section class="panel role-mgmt-menu-panel">
    <div class="panel-head"><div class="panel-title">菜单权限 · ${active.name||"—"}</div></div>
    <div class="table-wrap"><table class="role-menu-table"><thead><tr><th>菜单分组</th><th>可见</th></tr></thead><tbody>
      ${menuGroups.map(g=>`<tr><td><strong>${g}</strong></td><td><input type="checkbox" checked ${canWrite?"":"disabled"}></td></tr>`).join("")}
    </tbody></table></div>
    ${renderListPager("role-menu-matrix",menuGroups.length)}
  </section>
</div>`;
}
/** PAGE ID: channel-config | alias */
function channelPage(){ return renderChannelConfigPage(); }
function getChannelRows(){
  let rows = datasets.channels.map((c,i)=>({...c,_idx:i}));
  if(currentRole==="运营专员") rows = rows.filter(c=>c.site!=="苏豪独立站B"||c.status!=="异常");
  else if(currentRole==="外贸业务员") rows = rows.filter(c=>c.type==="WhatsApp"||c.site==="天猫苏豪站");
  else if(currentRole==="协同人") rows = rows.filter(c=>c.status!=="异常");
  return rows;
}
function getAuditLogRows(){
  let rows = datasets.auditLogs.map((l,i)=>({...l,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(l=>l.operator==="张明远"||l.operator==="系统");
  else if(currentRole==="运营专员") rows = rows.filter(l=>l.operator!=="系统管理员"||l.module==="渠道配置");
  else if(currentRole==="协同人") rows = rows.filter(l=>l.module!=="系统登录");
  return rows;
}
function canManageChannels(){ return currentRole==="管理员"||currentRole==="运营专员"; }
function toggleChannelAdvanced(){ channelAdvancedOpen=!channelAdvancedOpen; renderPage(); }
function toggleLogAdvanced(){ logAdvancedOpen=!logAdvancedOpen; renderPage(); }
function toggleChannelRow(i,checked){ if(checked) channelSelected.add(i); else channelSelected.delete(i); renderPage(); }
function toggleChannelAll(checked){ getChannelRows().forEach((_,i)=> checked?channelSelected.add(i):channelSelected.delete(i)); renderPage(); }
function batchChannelAction(action){ toast(`${{test:"批量测试连接",pull:"批量拉取",export:"批量导出"}[action]||action}：已处理 ${channelSelected.size||1} 个渠道`); channelSelected.clear(); renderPage(); }
function testChannel(i){ const c=getChannelRows()[i]; toast(c.status==="异常"?`「${c.name}」连接失败，请检查 Endpoint`:`「${c.name}」连接测试成功`); }
/**
 * PAGE ID: channel-config
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderChannelConfigPage(){
  const allRows = getChannelRows();
  const {display:rows} = sliceForPage(allRows, "channel-config");
  const readonly = currentRole==="访客";
  const canWrite = canManageChannels()&&!readonly;
  const normal = allRows.filter(c=>c.status==="正常"||c.status==="可用").length;
  const err = allRows.filter(c=>c.status==="异常").length;
  const typeCount = {网站接口:0,邮箱:0,WhatsApp:0,手动:0};
  allRows.forEach(c=>{ if(typeCount[c.type]!=null) typeCount[c.type]++; else if(c.type.includes("网站")) typeCount["网站接口"]++; });
  return `<div class="site-center-page">${siteTraceBannerHtml()}
  ${!canWrite?`<div style="margin-bottom:14px"><span class="tag gray">仅管理员/运营专员可编辑</span></div>`:""}
  <div class="kpi-grid cols-4">
    ${metric("渠道总数",allRows.length,`${normal} 个正常`)}
    ${metric("接口异常",err,err?"需检查连接":"全部正常",err?"danger":"up")}
    ${metric("网站/API",typeCount["网站接口"]||rows.filter(c=>c.type==="网站接口").length,"表单+API")}
    ${metric("沟通渠道",rows.filter(c=>c.type==="邮箱"||c.type==="WhatsApp").length,"邮箱 + WhatsApp")}
  </div>
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>渠道名称</label><input placeholder="渠道关键词"></div>
    <div class="field"><label>类型</label><select><option>全部</option><option>网站接口</option><option>邮箱</option><option>WhatsApp</option><option>手动</option></select></div>
    <div class="field"><label>关联站点</label><select><option>全部</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>状态</label><select><option>全部</option><option>正常</option><option>异常</option><option>可用</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleChannelAdvanced()">${channelAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${rows.length} 个渠道')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${channelAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>拉取频率</label><select><option>全部</option><option>每15分钟</option><option>每30分钟</option><option>实时推送</option><option>暂停拉取</option></select></div>
    <div class="field"><label>数据源</label><input placeholder="未迟建站 / Meta API 等"></div>
  </div></div>
  ${renderBatchBar({
    count:channelSelected.size,
    unit:"个渠道",
    onCancel:"channelSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="batchChannelAction('test')">批量测试</button><button type="button" class="btn small" onclick="batchChannelAction('pull')">批量拉取</button>`:""}<button type="button" class="btn small" onclick="batchChannelAction('export')">批量导出</button>`
  })}
  <div class="grid-2" style="margin-bottom:14px">
    <section class="panel"><div class="panel-head"><div class="panel-title">类型分布</div></div><div class="panel-body"><div class="funnel">
      ${[["网站接口",allRows.filter(c=>c.type==="网站接口").length],["邮箱",allRows.filter(c=>c.type==="邮箱").length],["WhatsApp",allRows.filter(c=>c.type==="WhatsApp").length],["手动",allRows.filter(c=>c.type==="手动").length]].map(([n,c])=>funnelRow(n,c,Math.round(c/Math.max(allRows.length,1)*100)||0)).join("")}
    </div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">标准来源渠道</div><button class="btn small" onclick="nav('lead-analysis')">转化分析→</button></div><div class="panel-body"><div style="display:flex;flex-wrap:wrap;gap:6px">${LEAD_SOURCE_CHANNELS.map(c=>`<span class="tag blue">${c}</span>`).join("")}</div><p style="font-size:12px;color:var(--soft);margin:10px 0 0;line-height:1.6">线索「来源渠道」字段统一使用以上枚举，在线索列表、详情、编辑与数据分析中一致展示。</p></div></section>
  </div>
  <section class="panel"><div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="toggleChannelAll(this.checked)"></th>`:""}
      <th>渠道</th><th>类型</th><th>关联站点</th><th>数据源</th><th>拉取频率</th><th>最近拉取</th><th>状态</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((c,i)=>{const gi=allRows.indexOf(c);return `<tr style="${c.status==="异常"?"background:#fff8f8":""}">
        ${canWrite?`<td><input type="checkbox" onchange="toggleChannelRow(${gi>=0?gi:i},this.checked)" ${channelSelected.has(gi>=0?gi:i)?"checked":""}></td>`:""}
        <td><strong>${c.name}</strong></td><td>${tag(c.type)}</td><td>${c.site}</td><td>${c.source}</td><td>${c.frequency}</td><td>${c.lastPull||"—"}</td>
        <td>${c.status==="正常"||c.status==="可用"?tag(c.status):`<span class="tag red">${c.status}</span>`}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openDrawer("channels",${c._idx})`},
          {label:"测试",onclick:`testChannel(${gi>=0?gi:i})`},
          canWrite&&{label:"编辑",onclick:"openModal('channels')"},
          canWrite&&{label:"拉取",onclick:`toast('已触发 ${c.name} 手动拉取')`,primary:true},
          {label:"站点→",onclick:"nav('site-management')"}
        ].filter(Boolean),`channel-${gi>=0?gi:i}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?9:8}"><div class="empty">暂无可见渠道</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager("channel-config",allRows.length)}
  </section></div>`;
}
/**
 * PAGE ID: system-log
 * MODULE TYPE: list
 * OWNER DOMAIN: system
 */
function renderSystemLogPage(){
  const allRows = getAuditLogRows();
  const {display:rows} = sliceForPage(allRows, "system-log");
  const readonly = currentRole==="访客";
  const canExport = currentRole!=="访客";
  const failed = rows.filter(l=>l.result==="失败"||l.result==="部分成功").length;
  const modules = [...new Set(rows.map(l=>l.module))];
  return `<div class="kpi-grid cols-4">
    ${metric("日志总数",allRows.length,`${analysisPeriod||"近7天"}`)}
    ${metric("涉及模块",modules.length,"跨模块操作")}
    ${metric("异常/部分成功",allRows.filter(l=>l.result==="失败"||l.result==="部分成功").length,failed?"需关注":"—",failed?"warn":"")}
    ${metric("今日记录",allRows.filter(l=>l.time.startsWith("2026-06-16")).length,"2026-06-16")}
  </div>
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>时间范围</label><select><option>近7天</option><option>近30天</option><option>本月</option><option>自定义</option></select></div>
    <div class="field"><label>操作人</label><input placeholder="姓名/账号"></div>
    <div class="field"><label>模块</label><select><option>全部</option>${modules.map(m=>`<option>${m}</option>`).join("")}</select></div>
    <div class="field"><label>动作</label><select><option>全部</option><option>新增</option><option>登录</option><option>导入</option><option>权限调整</option><option>自动分配</option><option>测试连接</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleLogAdvanced()">${logAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${rows.length} 条')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${logAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>结果</label><select><option>全部</option><option>成功</option><option>失败</option><option>部分成功</option></select></div>
    <div class="field"><label>目标对象</label><input placeholder="业务主键/编号"></div>
  </div></div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>时间</th><th>操作人</th><th>模块</th><th>动作</th><th>内容</th><th>结果</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map(l=>`<tr style="${l.result==="失败"?"background:#fff8f8":l.result==="部分成功"?"background:#fffbf0":""}">
        <td>${l.time}</td><td><strong>${l.operator}</strong></td><td>${tag(l.module)}</td><td>${l.action}</td>
        <td>${l.content}</td>
        <td>${l.result==="成功"?tag("成功"):l.result==="失败"?`<span class="tag red">${l.result}</span>`:`<span class="tag amber">${l.result}</span>`}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openDrawer("auditLogs",${l._idx})`},
          l.target&&l.target.startsWith("LEAD")&&{label:"线索→",onclick:"nav('lead-all')"},
          l.target&&l.target.startsWith("PC")&&{label:"合同→",onclick:"nav('contract-list')"}
        ].filter(Boolean),`audit-${l._idx}`)}</td>
      </tr>`).join(""):`<tr><td colspan="7"><div class="empty">暂无可见审计日志</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager("system-log",allRows.length)}
  </section>`;
}
/** PAGE ID: system-log | alias */
function logPage(){ return renderSystemLogPage(); }
function renderCommTabs(){ return ""; }
function commChannelHintHtml(label){ return ""; }
function openCommRecentActivity(i){
  const a=getCommRecentActivity()[i];
  if(!a) return;
  if(a._type==="email"){
    const e=datasets.emails[a._idx];
    if(e){
      currentMailAccountId=resolveEmailAccountId(e);
      MAIL_API.switchAccount(currentMailAccountId);
      const accountRows=getAccountInboxRows(currentMailAccountId);
      emailActiveIdx=accountRows.findIndex(x=>x._idx===a._idx);
      if(emailActiveIdx<0) emailActiveIdx=0;
    } else emailActiveIdx=0;
    nav("communication-email",{emailBox:"inbox"});
  } else {
    whatsappActiveIdx=a._idx;
    nav("communication-whatsapp");
  }
}
function senderIntelBannerHtml(){
  if(!canUseAiFeature()) return "";
  const scopeRows=isCommCenterPage()&&currentPage==="communication-email"&&emailBox==="inbox"&&!emailCustomerCtx
    ? getAccountInboxRows(currentMailAccountId)
    : getEmailInboxRows();
  const preCrm = scopeRows.filter(e=>e.convertMode==="未入库"||e.convertMode==="待确认转线索");
  if(!preCrm.length) return "";
  const demo = preCrm.find(e=>e.id==="MAIL-IN-006") || preCrm[0];
  const acctHint=currentMailAccountId?`（当前邮箱 ${getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId)?.account||""}）`:"";
  return `<div class="sender-intel-banner">
    <div><strong>◈ AI 来件人洞察 · ${preCrm.length} 封陌生来件待识别${acctHint}</strong>
      <p>无需先建客户。进入<strong>邮件中心 → 收件</strong>，选中来件后在<strong>右侧面板</strong>查看企业识别、可信度与 AI 行动建议。示例：${demo.customer}（${demo.from||demo.customer}）</p></div>
    <div class="toolbar-actions"><button type="button" class="btn small primary" onclick="openSenderIntelDemo('email')">查看来件人洞察 →</button></div>
  </div>`;
}
function openSenderIntelDemo(channel){
  if(channel==="whatsapp") nav("communication-whatsapp",{chatId:"WA-006"});
  else nav("communication-email",{emailBox:"inbox",emailId:"MAIL-IN-006"});
}
function inboxPriorityScore(e){
  if(e.convertMode==="未入库") return 0;
  if(e.convertMode==="待确认转线索") return 1;
  return 2;
}
function selectEmailById(id){
  commView="email"; emailBox="inbox";
  const mail=getEmailInboxRows().find(e=>e.id===id);
  if(mail){
    currentMailAccountId=resolveEmailAccountId(mail);
    MAIL_API.switchAccount(currentMailAccountId);
    const accountRows=getAccountInboxRows(currentMailAccountId);
    emailActiveIdx=accountRows.findIndex(e=>e.id===id);
    if(emailActiveIdx<0) emailActiveIdx=0;
  } else emailActiveIdx=0;
}
const MAILBOX_ACCOUNT_MAP={"zsn@sutex.net.cn":"ACC-001","sales@sutex.net.cn":"ACC-003","noreply@sutex.net.cn":"ACC-002"};
function resolveEmailAccountId(e){
  if(e?.accountId) return e.accountId;
  return MAILBOX_ACCOUNT_MAP[e?.mailbox]||MAILBOX_ACCOUNT_MAP[e?.to]||"ACC-001";
}
const MAIL_API={
  _requests:[],
  request(action,params={}){
    ensureActiveMailAccount();
    const accountId=params.accountId??currentMailAccountId??null;
    const payload={action,accountId,...params,ts:Date.now()};
    this._requests.push(payload);
    return payload;
  },
  fetchInbox(accountId){ return this.request("fetchInbox",{accountId:accountId||currentMailAccountId}); },
  fetchSent(accountId){ return this.request("fetchSent",{accountId:accountId||currentMailAccountId}); },
  fetchDrafts(accountId){ return this.request("fetchDrafts",{accountId:accountId||currentMailAccountId}); },
  switchAccount(accountId){ return this.request("switchAccount",{accountId}); },
  markRead(emailIds,accountId){ return this.request("markRead",{accountId:accountId||currentMailAccountId,emailIds}); },
  batchAction(action,emailIds,accountId){ return this.request("batchInboxAction",{action,accountId:accountId||currentMailAccountId,emailIds}); }
};
function getLoggedInMailAccounts(){
  let rows=datasets.commAccounts.filter(a=>a.type.includes("IMAP")&&a.status==="正常");
  if(currentRole==="外贸业务员") rows=rows.filter(a=>a.account==="zsn@sutex.net.cn"||a.account==="sales@sutex.net.cn");
  else if(currentRole==="运营专员") rows=rows.filter(a=>a.account==="zsn@sutex.net.cn"||a.account==="sales@sutex.net.cn");
  else if(currentRole==="协同人") rows=rows.filter(a=>a.account==="zsn@sutex.net.cn");
  return rows;
}
function ensureActiveMailAccount(){
  const accounts=getLoggedInMailAccounts();
  if(!accounts.length){ currentMailAccountId=null; return; }
  if(!currentMailAccountId||!accounts.some(a=>a.id===currentMailAccountId)) currentMailAccountId=accounts[0].id;
}
function getMailAccountUnreadCount(accountId){
  return getEmailInboxRows().filter(e=>resolveEmailAccountId(e)===accountId&&e.status==="未读").length;
}
function filterEmailsByAccount(rows,accountId){
  if(!accountId) return rows;
  return rows.filter(e=>resolveEmailAccountId(e)===accountId);
}
function getAccountInboxRows(accountId){
  ensureActiveMailAccount();
  const id=accountId||currentMailAccountId;
  MAIL_API.fetchInbox(id);
  if(!id) return getEmailInboxRows();
  return filterEmailsByAccount(getEmailInboxRows(),id);
}
function getAccountSentRows(accountId){
  ensureActiveMailAccount();
  const id=accountId||currentMailAccountId;
  MAIL_API.fetchSent(id);
  return filterEmailsByAccount(getEmailSentRows(),id);
}
function getAccountDraftRows(accountId){
  ensureActiveMailAccount();
  const id=accountId||currentMailAccountId;
  MAIL_API.fetchDrafts(id);
  return filterEmailsByAccount(getEmailDraftRows(),id);
}
function setActiveMailAccount(id){
  if(currentMailAccountId===id) return;
  currentMailAccountId=id;
  MAIL_API.switchAccount(id);
  emailActiveIdx=0;
  emailInboxSelected.clear();
  listPageNums["comm-email-inbox"]=1;
  listPageNums["comm-email-sent"]=1;
  listPageNums["comm-email-draft"]=1;
  renderPage();
}
function renderMailAccountSwitcher(){
  const accounts=getLoggedInMailAccounts();
  ensureActiveMailAccount();
  if(!accounts.length) return `<section class="mail-account-panel"><div class="mail-account-head">邮箱账号</div><div class="empty" style="padding:20px;font-size:12px">暂无已登录邮箱</div></section>`;
  return `<section class="mail-account-panel"><div class="mail-account-head">邮箱账号</div><div class="mail-account-list">
    ${accounts.map(a=>{const unread=getMailAccountUnreadCount(a.id);const total=getEmailInboxRows().filter(e=>resolveEmailAccountId(e)===a.id).length;return `<div class="mail-account-item ${currentMailAccountId===a.id?"active":""}" onclick="setActiveMailAccount('${a.id}')">
      <div class="mail-account-addr">${a.account}</div>
      <div class="mail-account-meta"><span>${a.name}</span>${unread?`<span class="tag red">${unread} 未读</span>`:`<span>${total} 封</span>`}</div>
    </div>`;}).join("")}
  </div></section>`;
}
function selectChatById(id){
  commView="whatsapp";
  const rows = getChatRows();
  const idx = rows.findIndex(c=>c.id===id);
  whatsappActiveIdx = idx>=0 ? idx : 0;
}
function renderEmailTabs(){
  if(!isCommCenterPage()||currentPage!=="communication-email") return "";
  if(emailCustomerCtx){
    return `<div class="tabs sub-tabs"><button class="tab active">客户邮件会话 · ${emailCustomerCtx.customerName||""}</button><button class="tab" onclick="clearEmailCustomerCtx()">全部邮件</button></div>`;
  }
  const tabs = [["inbox","收件"],["sent","发件"],["draft","草稿"]];
  return `<div class="tabs sub-tabs">${tabs.map(([id,label])=>`<button class="tab ${emailBox===id?"active":""}" onclick="emailCustomerCtx=null;emailBox='${id}';renderPage()">${label}</button>`).join("")}</div>`;
}
function renderCustomerDetailTabs(active){
  return "";
}
function getEmailInboxRows(){
  let rows = datasets.emails.filter(e=>e.box==="inbox").map(e=>({...e,accountId:resolveEmailAccountId(e),_idx:datasets.emails.indexOf(e)}));
  const sellerName = roleScopes["外贸业务员"]?.owner || "张明远";
  if(currentRole==="外贸业务员") rows = rows.filter(e=>e.owner===sellerName||e.convertMode==="未入库"||e.convertMode==="待确认转线索");
  else if(currentRole==="运营专员") rows = rows.filter(e=>e.mailbox==="zsn@sutex.net.cn"||e.mailbox==="sales@sutex.net.cn");
  else if(currentRole==="协同人") rows = rows.filter(e=>e.status==="未读"||e.convertMode==="待确认转线索"||e.convertMode==="未入库");
  rows.sort((a,b)=>inboxPriorityScore(a)-inboxPriorityScore(b)||0);
  return rows;
}
function getEmailSentRows(){
  let rows = datasets.emails.filter(e=>e.box==="sent").map(e=>({...e,accountId:resolveEmailAccountId(e),_idx:datasets.emails.indexOf(e)}));
  if(currentRole==="外贸业务员") rows = rows.filter(e=>e.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(e=>e.mailbox==="sales@sutex.net.cn"||e.mailbox==="noreply@sutex.net.cn");
  return rows;
}
function getEmailDraftRows(){
  let rows = datasets.emails.filter(e=>e.box==="draft").map(e=>({...e,accountId:resolveEmailAccountId(e),_idx:datasets.emails.indexOf(e)}));
  if(currentRole==="外贸业务员") rows = rows.filter(e=>e.owner==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(e=>e.owner!=="王芳"||e.mailbox==="sales@sutex.net.cn");
  return rows;
}
function getChatRows(){
  let rows = datasets.chats.map((c,i)=>({...c,_idx:i}));
  const sellerName = roleScopes["外贸业务员"]?.owner || "张明远";
  if(currentRole==="外贸业务员") rows = rows.filter(c=>c.owner===sellerName||c.convertMode==="未入库");
  else if(currentRole==="运营专员") rows = rows.filter(c=>c.account.includes("主账号")||c.owner==="李晓燕");
  else if(currentRole==="协同人") rows = rows.filter(c=>c.status==="待回复"||c.unread>0);
  rows.sort((a,b)=>(a.convertMode==="未入库"?0:1)-(b.convertMode==="未入库"?0:1));
  return rows;
}
function getCommDeskRows(){
  const rows = [];
  const sellerName = roleScopes["外贸业务员"]?.owner || "张明远";
  getEmailInboxRows().forEach(e=>{
    const pending = e.status==="未读" || e.convertMode==="待确认转线索" || e.convertMode==="未入库";
    const lead = e.lead && e.lead!=="-" ? datasets.leads.find(l=>l.id===e.lead) : null;
    const cust = datasets.customers.find(c=>c.name===e.customer);
    const chat = datasets.chats.find(c=>c.customer===e.customer);
    const ci = datasets.commIntelligence?.[e.customer];
    const contact = datasets.contacts.find(c=>c.customer===e.customer)?.name || (e.from||"").split("@")[0] || e.customer;
    const aiPriority = e.convertMode==="未入库" || (e.aiIntent||"").includes("高") ? "高" : (e.status==="未读" ? "中" : "低");
    rows.push({
      priority: e.convertMode==="未入库"?0:e.status==="未读"?1:e.convertMode==="待确认转线索"?2:5,
      pending,
      channel:"邮件",
      customer:e.customer,
      contact,
      time:e.time,
      summary:e.subject,
      preview:e.aiBrief||e.summary||"—",
      followStage: lead?.stage || (cust?.next==="已超期"?"跟进超期":cust?.level)||"—",
      nextAction: ci?.nextActions?.[0] || (e.convertMode==="未入库"?"查看来件人洞察 · 确认是否转线索": e.convertMode==="待确认转线索"?"确认转线索并分配": e.status==="未读"?"回复邮件":"—"),
      aiPriority,
      aiNote: canUseAiFeature() ? (e.convertMode==="未入库"?"AI：陌生来件待识别": (e.aiIntent||"—")) : "",
      status:e.status,
      owner:e.owner,
      convertMode:e.convertMode,
      _type:"email", _idx:e._idx, _id:e.id
    });
  });
  getChatRows().forEach(c=>{
    const pending = c.status==="待回复" || (c.unread||0)>0 || c.convertMode==="未入库";
    const lead = c.lead && c.lead!=="-" ? datasets.leads.find(l=>l.id===c.lead) : null;
    const cust = datasets.customers.find(x=>x.name===c.customer);
    const ci = datasets.commIntelligence?.[c.customer];
    const aiPriority = c.convertMode==="未入库" || c.unread>=2 ? "高" : (c.status==="待回复"?"中":"低");
    rows.push({
      priority: c.convertMode==="未入库"?0:c.status==="待回复"?1:3,
      pending,
      channel:"WhatsApp",
      customer:c.customer,
      contact:c.contact||c.customer,
      time:c.time||c.last,
      summary:c.preview,
      preview:c.summary||c.preview||"—",
      followStage: lead?.stage || c.stage || (cust?.next==="已超期"?"跟进超期":"—"),
      nextAction: ci?.nextActions?.[0] || (c.status==="待回复"?"回复 WhatsApp 消息": c.convertMode==="未入库"?"识别来件人并转线索":"—"),
      aiPriority,
      aiNote: canUseAiFeature() ? (c.convertMode==="未入库"?"AI：陌生会话待识别": (ci?.aiSummary?.slice(0,40)||"—")) : "",
      status:c.status,
      owner:c.owner,
      convertMode:c.convertMode,
      _type:"chat", _idx:c._idx, _id:c.id
    });
  });
  return filterCommDeskRowsByCustomerCtx(rows.sort((a,b)=>a.priority-b.priority||0));
}
function filterCommDeskRowsByCustomerCtx(rows){
  if(!emailCustomerCtx) return rows;
  const {customerName,leadId}=emailCustomerCtx;
  return rows.filter(r=>{
    if(customerName&&r.customer===customerName) return true;
    if(leadId&&r._type==="email"){
      const e=datasets.emails[r._idx];
      return e&&(e.lead===leadId||e.customer===customerName);
    }
    if(leadId&&r._type==="chat"){
      const c=datasets.chats[r._idx];
      return c&&(c.lead===leadId||c.customer===customerName);
    }
    return false;
  });
}
function getCommWorkbenchRows(){ return getCommDeskRows().filter(r=>r.pending); }
function getCommFollowReminders(){
  const sellerName = roleScopes["外贸业务员"]?.owner || "张明远";
  let customers = datasets.customers.map(c=>({...c}));
  if(currentRole==="外贸业务员") customers = customers.filter(c=>c.owner===sellerName);
  else if(currentRole==="运营专员") customers = customers.filter(c=>c.site.includes("天猫")||c.site.includes("独立站A"));
  return customers.filter(c=>c.next==="已超期"||c.next==="2026-06-16"||c.next==="2026-06-17").slice(0,5);
}
function getCommRecentActivity(){
  const acts = [];
  getEmailInboxRows().slice(0,4).forEach(e=>acts.push({time:e.time, channel:"邮件", customer:e.customer, text:e.subject, _type:"email", _idx:e._idx}));
  getChatRows().slice(0,4).forEach(c=>acts.push({time:c.time||c.last, channel:"WhatsApp", customer:c.customer, text:c.preview, _type:"chat", _idx:c._idx}));
  return acts.slice(0,6);
}
function openCommDeskRow(i){
  const r = getCommDeskRows()[i];
  if(!r) return;
  openCommRowFromDesk(r);
}
function openCommRowFromDesk(r){
  if(!r) return;
  if(r._type==="email"){
    emailActiveIdx = getEmailInboxRows().findIndex(e=>e._idx===r._idx);
    if(r.convertMode==="未入库"||r.convertMode==="待确认转线索") nav("communication-email",{emailBox:"inbox",emailId:r._id});
    else openCustomerEmailThread({customerName:r.customer});
  } else {
    whatsappActiveIdx = r._idx;
    nav("communication-whatsapp",{chatId:r._id});
  }
}
function getCommAccountRows(){
  let rows = datasets.commAccounts.map((a,i)=>({...a,_idx:i}));
  if(currentRole==="外贸业务员") rows = rows.filter(a=>a.type.includes("WhatsApp"));
  else if(currentRole==="访客") rows = rows.filter(a=>a.status==="正常");
  return rows;
}
function toggleCommWorkbenchAdvanced(){ commWorkbenchAdvancedOpen=!commWorkbenchAdvancedOpen; renderPage(); }
function toggleEmailInboxAdvanced(){ emailInboxAdvancedOpen=!emailInboxAdvancedOpen; renderPage(); }
function toggleEmailSentAdvanced(){ emailSentAdvancedOpen=!emailSentAdvancedOpen; renderPage(); }
function toggleEmailDraftAdvanced(){ emailDraftAdvancedOpen=!emailDraftAdvancedOpen; renderPage(); }
function toggleWhatsappFilter(){ whatsappFilterOpen=!whatsappFilterOpen; renderPage(); }
function toggleWhatsappAiPanel(){ whatsappAiOpen=!whatsappAiOpen; renderPage(); }
function toggleCommConfigAdvanced(){ commConfigAdvancedOpen=!commConfigAdvancedOpen; renderPage(); }
function toggleEmailInboxRow(i,checked){ if(checked) emailInboxSelected.add(i); else emailInboxSelected.delete(i); renderPage(); }
function toggleEmailInboxAll(checked){ getAccountInboxRows().forEach((_,i)=> checked?emailInboxSelected.add(i):emailInboxSelected.delete(i)); renderPage(); }
function toggleEmailDraftRow(i,checked){ if(checked) emailDraftSelected.add(i); else emailDraftSelected.delete(i); renderPage(); }
function batchEmailInboxAction(action){
  const ids=[...emailInboxSelected];
  MAIL_API.batchAction(action,ids,currentMailAccountId);
  toast(`${{read:"批量标记已读",convert:"批量确认转线索",export:"批量导出"}[action]||action}：已处理 ${ids.length||1} 封邮件（账号 ${getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId)?.account||"—"}）`);
  emailInboxSelected.clear();
  renderPage();
}
function batchEmailDraftAction(action){ toast(`${{send:"批量发送",delete:"批量删除"}[action]||action}：已处理 ${emailDraftSelected.size||1} 份草稿`); emailDraftSelected.clear(); renderPage(); }
function parseContactEmail(contact){
  if(!contact) return null;
  const m=String(contact).match(/[\w.+-]+@[\w.-]+\.\w+/);
  return m?m[0].toLowerCase():null;
}
function formatContactEmailsHint(contactEmails){
  const data=typeof contactEmails==="object"&&!Array.isArray(contactEmails)?contactEmails:{emails:contactEmails||[],domains:[]};
  const parts=[...(data.emails||[]),...(data.domains||[]).map(d=>"*@"+d)];
  return parts.length?parts.join("、"):"—";
}
function getCustomerContactEmails(customerName, leadId){
  const emails=new Set();
  const domains=new Set();
  const leadIds=new Set();
  if(leadId&&leadId!=="-") leadIds.add(leadId);
  if(customerName){
    const cust=datasets.customers.find(c=>c.name===customerName);
    if(cust) getCustomerLeadRows(cust).forEach(l=>leadIds.add(l.id));
    datasets.contacts.filter(c=>c.customer===customerName).forEach(c=>{
      if(c.email) emails.add(c.email.toLowerCase());
      const d=c.email?.split("@")[1]?.toLowerCase();
      if(d) domains.add(d);
    });
    const site=(cust?.website||datasets.customerProfiles?.[cust?.id]?.website||"").replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0];
    if(site&&site.includes(".")) domains.add(site.toLowerCase());
  }
  leadIds.forEach(id=>{
    const lead=datasets.leads.find(l=>l.id===id);
    const e=parseContactEmail(lead?.contact);
    if(e) emails.add(e);
    const d=parseLeadEmailDomain(lead);
    if(d) domains.add(d);
  });
  datasets.emails.forEach(em=>{
    if((customerName&&em.customer===customerName)||(em.lead&&leadIds.has(em.lead))){
      if(em.from) emails.add(em.from.toLowerCase());
      if(em.to) emails.add(em.to.toLowerCase());
    }
  });
  return {emails:[...emails],domains:[...domains],leadIds:[...leadIds]};
}
function emailMatchesCustomerCtx(e,ctx){
  if(!ctx) return true;
  if(ctx.leadId&&e.lead===ctx.leadId) return true;
  if(ctx.leadIds?.includes(e.lead)) return true;
  if(ctx.customerName&&e.customer===ctx.customerName) return true;
  if(ctx.customerId){
    const cust=datasets.customers.find(c=>c.id===ctx.customerId);
    if(cust&&e.customer===cust.name) return true;
  }
  const addr=((e.box==="sent"?e.to:e.from)||"").toLowerCase();
  const contactData=typeof ctx.contactEmails==="object"&&!Array.isArray(ctx.contactEmails)?ctx.contactEmails:{emails:ctx.contactEmails||[],domains:[]};
  if(contactData.emails?.some(ce=>addr.includes(ce))) return true;
  const domain=addr.split("@")[1];
  if(domain&&contactData.domains?.some(d=>domain===d||domain.endsWith("."+d))) return true;
  return false;
}
function emailTimeScore(e){
  const t=e.time||"";
  if(t.includes("今天")) return 100;
  if(t.includes("昨天")) return 90;
  const d=t.match(/(\d+)天前/);
  if(d) return 80-(parseInt(d[1],10)||0);
  return 50;
}
function getCustomerEmailThread(ctx){
  if(!ctx) return [];
  let rows=datasets.emails.filter(e=>(e.box==="inbox"||e.box==="sent")&&emailMatchesCustomerCtx(e,ctx)).map(e=>({...e,_datasetIdx:datasets.emails.indexOf(e)}));
  const sellerName=roleScopes["外贸业务员"]?.owner||"张明远";
  if(currentRole==="外贸业务员") rows=rows.filter(e=>e.owner===sellerName||e.convertMode==="未入库"||e.convertMode==="待确认转线索");
  else if(currentRole==="运营专员") rows=rows.filter(e=>["zsn@sutex.net.cn","sales@sutex.net.cn","noreply@sutex.net.cn"].includes(e.mailbox));
  else if(currentRole==="协同人") rows=rows.filter(e=>e.status==="未读"||e.convertMode==="待确认转线索"||e.convertMode==="未入库");
  rows.sort((a,b)=>emailTimeScore(b)-emailTimeScore(a));
  return rows;
}
function getCustomerEmailReplyStatus(thread){
  if(!thread.length) return {label:"暂无往来",cls:""};
  const latest=thread[0];
  if(latest.box==="inbox"&&(latest.status==="未读"||latest.status==="待回复")) return {label:"待回复",cls:"danger"};
  if(latest.box==="inbox") return {label:"待回复",cls:"warn"};
  return {label:"已回复",cls:"green"};
}
function resolveEmailCustomerCtx(opts){
  opts=opts||{};
  let leadId=opts.leadId||null, customerId=opts.customerId||null, customerName=opts.customerName||null;
  let lead=null, customer=null;
  if(opts.leadIdx!=null) lead=datasets.leads[opts.leadIdx];
  else if(leadId) lead=datasets.leads.find(l=>l.id===leadId);
  if(lead){ leadId=lead.id; customerName=customerName||lead.name; }
  if(opts.customerIdx!=null) customer=datasets.customers[opts.customerIdx];
  else if(customerId) customer=datasets.customers.find(c=>c.id===customerId);
  else if(customerName) customer=datasets.customers.find(c=>c.name===customerName);
  if(customer){
    customerId=customer.id; customerName=customer.name;
    if(!leadId&&customer.sourceLead&&customer.sourceLead!=="-") leadId=customer.sourceLead;
  }
  const contactEmails=getCustomerContactEmails(customerName,leadId);
  return {leadId,customerId,customerName,contactEmails,leadIds:contactEmails.leadIds||[],lead,customer};
}
function openCustomerEmailThread(opts){
  closeDrawer();
  emailCustomerCtx=resolveEmailCustomerCtx(opts);
  customerEmailActiveIdx=0;
  const thread=getCustomerEmailThread(emailCustomerCtx);
  if(thread.length){
    const unreadIdx=thread.findIndex(e=>e.box==="inbox"&&(e.status==="未读"||e.status==="待回复"));
    customerEmailActiveIdx=unreadIdx>=0?unreadIdx:0;
  }
  nav("communication-email",{emailBox:"thread"});
}
function openCustomerEmailThreadFromLeadRow(listIdx,pool){
  const row=pool==="pool"?getLeadPoolRows()[listIdx]:pool==="invalid"?getInvalidLeadRows()[listIdx]:getMyLeadRows()[listIdx];
  if(!row) return;
  openCustomerEmailThread({leadId:row.id,customerName:row.name});
}
function openCustomerEmailThreadFromLeadDataset(idx){
  const lead=datasets.leads[idx];
  if(!lead) return;
  openCustomerEmailThread({leadId:lead.id,customerName:lead.name});
}
function clearEmailCustomerCtx(){
  emailCustomerCtx=null;
  customerEmailActiveIdx=0;
  emailBox="inbox";
  renderPage();
}
function selectCustomerThreadEmail(i){ customerEmailActiveIdx=i; renderPage(); }
function renderEmailCustomerBanner(ctx,thread){
  const replyStatus=getCustomerEmailReplyStatus(thread);
  const lastContact=thread[0]?.time||"—";
  const inboxCnt=thread.filter(e=>e.box==="inbox").length;
  const sentCnt=thread.filter(e=>e.box==="sent").length;
  const emailHint=formatContactEmailsHint(ctx.contactEmails);
  return `<div class="email-customer-banner">
    <div>
      <h4>${ctx.customerName||"客户邮件会话"}</h4>
      <div class="email-customer-meta">
        ${ctx.leadId?`<span>线索 ${ctx.leadId}</span> · `:``}${ctx.customerId?`<span>客户 ${ctx.customerId}</span> · `:``}
        <span>匹配规则 ${emailHint}</span><br>
        <span>最近沟通 ${lastContact}</span> · <span>回复状态 ${replyStatus.cls?`<span class="tag ${replyStatus.cls}">${replyStatus.label}</span>`:replyStatus.label}</span>
        ${thread.length?` · <span>往来 ${thread.length} 封（收件 ${inboxCnt} / 发件 ${sentCnt}）</span>`:""}
      </div>
    </div>
    <div class="toolbar-actions"><button class="btn small" onclick="clearEmailCustomerCtx()">查看全部邮件</button></div>
  </div>`;
}
/**
 * PAGE ID: communication-email
 * MODULE TYPE: detail
 * OWNER DOMAIN: communication
 */
function renderEmailCustomerThreadPage(){
  const ctx=emailCustomerCtx;
  const thread=getCustomerEmailThread(ctx);
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  if(!ctx) return renderEmailInboxPage();
  if(!thread.length){
    return `${renderCommTabs()}${renderEmailTabs()}${renderEmailCustomerBanner(ctx,thread)}
    <section class="panel"><div class="panel-body"><div class="empty" style="padding:48px 24px;text-align:center;line-height:1.8">
      <div style="font-size:36px;margin-bottom:12px">✉</div>
      <strong>该客户暂无邮件往来，可发送首封开发邮件。</strong>
      <p style="font-size:13px;color:var(--soft);margin-top:8px">${ctx.customerName||""}${ctx.leadId?` · ${ctx.leadId}`:""}${emailHint!=="—"?`<br>匹配规则：公司名称 · 联系人邮箱 · 域名（${emailHint}）`:""}</p>
      ${canWrite?`<button type="button" class="btn primary" style="margin-top:16px" onclick="openModal('compose')">发送邮件</button>`:""}
    </div></div></section>`;
  }
  if(customerEmailActiveIdx<0||customerEmailActiveIdx>=thread.length) customerEmailActiveIdx=0;
  const active=thread[customerEmailActiveIdx]||thread[0];
  const insightCtx=buildInsightCtx({email:active,channel:"email"});
  const panelLabel=active&&!isCrmEstablished(insightCtx)?"AI 来件人洞察":"AI 沟通画像";
  const replyStatus=getCustomerEmailReplyStatus(thread);
  return `${renderCommTabs()}${renderEmailTabs()}${senderIntelBannerHtml()}${renderEmailCustomerBanner(ctx,thread)}
  <div class="kpi-grid cols-4">
    ${metric("邮件往来",thread.length,`收件 ${thread.filter(e=>e.box==="inbox").length} / 发件 ${thread.filter(e=>e.box==="sent").length}`)}
    ${metric("最近沟通",active?.time||"—",active?.subject||"—")}
    ${metric("回复状态",replyStatus.label,replyStatus.label==="待回复"?"需跟进":replyStatus.label,replyStatus.cls||"")}
    ${canUseAiFeature()?metric("AI 意图",active?.aiIntent||"—",active?.aiBrief?active.aiBrief.slice(0,24)+"...":"—","up"):metric("AI 增强","未启用","配置后可识别邮件意图","warn")}
  </div>
  <div class="comm-layout" style="margin-top:14px">
    <section class="comm-list">
      <div class="comm-list-head"><span>邮件线程</span><span class="tag blue">${thread.length} 封</span></div>
      <div class="thread-search"><input placeholder="搜索主题、发件人"></div>
      <div style="max-height:560px;overflow:auto">
        ${thread.map((e,i)=>`<div class="email-list-item ${i===customerEmailActiveIdx?"active":""} ${e.box==="inbox"&&e.status==="未读"?"unread":""}" onclick="selectCustomerThreadEmail(${i})">
          <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px">
            <span class="email-list-from"><span class="email-thread-dir ${e.box==="sent"?"sent":""}">${e.box==="sent"?"发件":"收件"}</span>${e.box==="sent"?(e.to||e.customer):(e.from||e.customer)}</span>
            <span style="font-size:11px;color:var(--soft)">${e.time}</span>
          </div>
          <div class="email-list-subject">${e.subject}</div>
          <div class="email-list-preview">${e.aiBrief||e.summary||""}</div>
          <div style="margin-top:6px">${e.status==="未读"?`<span class="tag red">${e.status}</span>`:tag(e.status)} ${tag(e.aiIntent||"")}</div>
        </div>`).join("")}
      </div>
    </section>
    ${emailDetailHtml(active,canWrite,true)}
    ${renderInsightPanel(insightCtx)}
  </div>`;
}
function selectWhatsappThread(i){ whatsappActiveIdx=i; renderPage(); }
function selectEmailThread(i){
  emailActiveIdx=i;
  const rows=getAccountInboxRows();
  const mail=rows[i];
  if(mail) MAIL_API.request("fetchMessage",{accountId:currentMailAccountId,emailId:mail.id});
  renderPage();
}
function emailDetailHtml(e,canWrite,inThread){
  if(!e) return `<section class="email-detail-panel"><div class="empty" style="padding:40px">请选择邮件查看详情与 AI 沟通洞察</div></section>`;
  const mailActions=canWrite?`<div class="toolbar-actions" style="margin-top:10px;flex-wrap:wrap;gap:6px">
    ${e.box==="inbox"||inThread?`<button class="btn small primary" onclick="openModal('reply')">回复</button><button class="btn small" onclick="openModal('reply')">回复全部</button>`:""}
    <button class="btn small" onclick="openModal('compose')">转发</button>
    <button class="btn small" onclick="openModal('compose')">新建邮件</button>
    ${!inThread&&e.box==="inbox"?`<button class="btn small" onclick="openModal('lead')">${e.convertMode==="待确认转线索"?"确认转线索":"转线索"}</button>`:""}
    <button class="btn small" onclick="openModal('follow')">录入跟进</button>
  </div>`:"";
  return `<section class="email-detail-panel">
    <div class="email-detail-head">
      <div class="email-detail-subject">${e.subject||"—"}</div>
      <div class="email-detail-meta">
        <div><strong>${e.box==="sent"?"收件人":"发件人"}</strong> ${e.box==="sent"?(e.to||"—"):(e.from||"—")} · <strong>客户</strong> ${e.customer||"—"}</div>
        <div><strong>时间</strong> ${e.time||"—"} · <strong>邮箱</strong> ${e.mailbox||"—"} · ${e.status==="未读"?`<span class="tag red">${e.status}</span>`:tag(e.status||"—")} · ${tag(e.aiIntent||"—")}</div>
        <div><strong>关联线索</strong> ${e.lead||"—"} · <strong>负责人</strong> ${e.owner||"—"} · <strong>方向</strong> ${tag(e.box==="sent"?"发件":"收件")}</div>
      </div>
      ${mailActions}
    </div>
    <div class="email-detail-body">
      <p style="margin-bottom:12px">${e.summary||"—"}</p>
      ${e.aiBrief&&canUseAiFeature()?`<div class="ai-box"><strong>AI 摘要建议</strong><br>${e.aiBrief}</div>`:e.aiBrief&&!canUseAiFeature()?`<div class="ai-box" style="background:#f8fafc">${aiDisabledPlaceholder("AI 邮件分析","邮件摘要、回复建议",true)}</div>`:""}
    </div>
  </section>`;
}
function openCommRow(i){
  const r=getCommDeskRows().filter(x=>x.pending)[i] || getCommDeskRows()[i];
  openCommRowFromDesk(r);
}
/**
 * PAGE ID: communication-desk
 * MODULE TYPE: dashboard
 * OWNER DOMAIN: communication
 */
function renderCommunicationDeskPage(){
  const allRows=getCommDeskRows();
  const pagerKey="comm-desk";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const pendingRows=allRows.filter(r=>r.pending);
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  const pendingMail=getEmailInboxRows().filter(e=>e.status==="未读").length;
  const pendingChat=getChatRows().filter(c=>c.status==="待回复").length;
  const highPri=pendingRows.filter(r=>r.aiPriority==="高").length;
  const followReminders=getCommFollowReminders();
  const recentActs=getCommRecentActivity();
  const aiSummary = canUseAiFeature()
    ? `今日 ${pendingRows.length} 条待处理沟通 · ${highPri} 条 AI 标记高优先级 · ${followReminders.length} 位客户需跟进`
    : `今日 ${pendingRows.length} 条待处理沟通 · ${followReminders.length} 位客户需跟进`;
  return `${senderIntelBannerHtml()}
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>关键词</label><input placeholder="客户 / 联系人 / 消息摘要"></div>
    <div class="field"><label>渠道</label><select><option>全部</option><option>邮件</option><option>WhatsApp</option></select></div>
    <div class="field"><label>优先级</label><select><option>全部</option><option>AI 高优先级</option><option>待回复</option></select></div>
    <div class="field"><label>状态</label><select><option>待处理</option><option>全部</option></select></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleCommWorkbenchAdvanced()">${commWorkbenchAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 条沟通任务')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${commWorkbenchAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="field"><label>转化状态</label><select><option>全部</option><option>未入库</option><option>待确认转线索</option><option>已关联线索</option></select></div>
    <div class="field"><label>跟进阶段</label><select><option>全部</option><option>待首响</option><option>报价打样</option><option>已成交</option></select></div>
  </div></div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>优先级</th><th>客户</th><th>联系人</th><th>渠道</th><th>最近沟通</th><th>消息摘要</th><th>跟进状态</th><th>下一步动作</th><th>负责人</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map((r,i)=>{const gi=allRows.indexOf(r);const idx=gi>=0?gi:i;return `<tr style="${r.pending?"background:#fffbf0":""}">
        <td>${r.aiPriority==="高"?`<span class="tag red">高</span>`:r.aiPriority==="中"?`<span class="tag amber">中</span>`:`<span class="tag gray">低</span>`}</td>
        <td><strong>${r.customer}</strong>${r.pending?`<br><span class="tag red" style="margin-top:4px;font-size:10px">待处理</span>`:""}</td>
        <td>${r.contact||"—"}</td>
        <td>${tag(r.channel)}</td>
        <td>${r.time}</td>
        <td><div style="font-size:12px"><strong>${r.summary}</strong>${r.preview?`<br><span style="color:var(--soft)">${r.preview.slice(0,60)}</span>`:""}${r.aiNote&&canUseAiFeature()?`<br><span class="tag cyan" style="margin-top:4px;font-size:10px">${r.aiNote}</span>`:""}</div></td>
        <td>${tag(r.followStage)}</td>
        <td><span style="font-size:12px;color:var(--primary)">${r.nextAction}</span></td>
        <td>${r.owner||"—"}</td>
        <td>${renderRowActions([
          {label:r.channel==="邮件"?"处理":"会话",onclick:`openCommDeskRow(${idx})`,primary:true},
          canWrite&&{label:"跟进",onclick:"openModal('follow')"}
        ].filter(Boolean),`comm-desk-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="10"><div class="empty">暂无沟通任务，可从邮件或 WhatsApp 渠道查看历史记录</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length,`待处理 ${pendingRows.length} 条`)}
  </section>`;
}
/** PAGE ID: communication-desk | alias */
function communicationWorkbenchPage(){ return renderCommunicationDeskPage(); }
/**
 * PAGE ID: communication-config
 * MODULE TYPE: detail
 * OWNER DOMAIN: communication
 */
function renderCommunicationConfigPage(){
  const allRows=getCommAccountRows();
  const pagerKey="comm-config";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const readonly=currentRole==="访客";
  const canWrite=currentRole==="管理员"||currentRole==="运营专员";
  const normal=allRows.filter(r=>r.status==="正常").length;
  const emailCnt=allRows.filter(r=>r.type.includes("邮箱")).length;
  const waCnt=allRows.filter(r=>r.type.includes("WhatsApp")).length;
  return `
  <div class="account-settings">
  <div class="filters"><div class="filter-grid">
    <div class="field"><label>账号类型</label><select><option>全部</option><option>邮箱 IMAP</option><option>邮箱 SMTP</option><option>WhatsApp</option></select></div>
    <div class="field"><label>状态</label><select><option>全部</option><option>正常</option><option>异常</option></select></div>
    <div class="field"><label>账号关键词</label><input placeholder="名称/邮箱/号码"></div>
    <div class="head-actions">
      <button class="btn" onclick="toggleCommConfigAdvanced()">${commConfigAdvancedOpen?"收起高级筛选":"高级筛选"}</button>
      <button class="btn primary" onclick="toast('查询完成，共 ${allRows.length} 个账号')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>
  <div class="filter-advanced ${commConfigAdvancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>入库方式</label><select><option>全部</option><option>自动入库</option><option>实时入库</option></select></div>
    <div class="field"><label>转发规则</label><select><option>全部</option><option>开启</option><option>按规则</option></select></div>
  </div></div>
  <div class="settings-layout">
    <div class="settings-content settings-scroll">
    <section class="panel settings-list"><div class="table-wrap"><table><thead><tr><th>账号类型</th><th>账号名称</th><th>账号/号码</th><th>服务器/API</th><th>用途</th><th>入库/转发</th><th>最近同步</th><th>状态</th><th>操作</th></tr></thead><tbody>
        ${rows.map((a,i)=>{const gi=allRows.indexOf(a);const idx=gi>=0?gi:i;return `<tr><td>${a.type}</td><td><strong>${a.name}</strong></td><td>${a.account}</td><td>${a.server}</td><td>${a.purpose}</td>
          <td>${a.warehouse}${a.forward&&a.forward!=="—"?` / ${a.forward}`:""}</td><td>${a.lastSync||"—"}</td>
          <td>${a.status==="正常"?tag("正常"):`<span class="tag red">${a.status}</span>`}</td>
          <td>${renderRowActions([
            canWrite&&{label:"编辑",onclick:`openModal('${a.type.includes("WhatsApp")?"whatsappConfig":"email"}')`},
            {label:"测试",onclick:`toast('${a.name} 连接测试成功')`},
            {label:"跳转→",onclick:`nav('${a.type.includes("WhatsApp")?"whatsapp-chat":"email-inbox"}')`}
          ].filter(Boolean),`comm-acct-${idx}`)}</td></tr>`;}).join("")}
      </tbody></table></div>
      ${renderListPager(pagerKey,allRows.length)}
    </section>
    </div>
  </div>
  </div>`;
}
/**
 * PAGE ID: communication-email
 * MODULE TYPE: list
 * OWNER DOMAIN: communication
 */
function renderEmailInboxPage(){
  ensureActiveMailAccount();
  const allRows=getAccountInboxRows();
  const activeAccount=getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId);
  const {display:listRows}=sliceForPage(allRows,"comm-email-inbox");
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  const unread=allRows.filter(e=>e.status==="未读").length;
  const pendingConvert=allRows.filter(e=>e.convertMode==="待确认转线索").length;
  if(allRows.length&&(emailActiveIdx<0||emailActiveIdx>=allRows.length)) emailActiveIdx=0;
  const activeEmail=allRows[emailActiveIdx]||allRows[0]||null;
  const insightCtx=activeEmail?buildInsightCtx({email:activeEmail,channel:"email"}):{};
  const panelLabel = activeEmail && !isCrmEstablished(insightCtx) ? "AI 来件人洞察" : "AI 沟通画像";
  return `${renderEmailTabs()}${senderIntelBannerHtml()}
  ${emailFilters("发件人 / 客户 / 主题",emailInboxAdvancedOpen,toggleEmailInboxAdvanced)}
  ${renderBatchBar({
    count:emailInboxSelected.size,
    unit:"封邮件",
    onCancel:"emailInboxSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small" onclick="batchEmailInboxAction('read')">标记已读</button><button type="button" class="btn small primary" onclick="batchEmailInboxAction('convert')">确认转线索</button>`:""}<button type="button" class="btn small" onclick="batchEmailInboxAction('export')">批量导出</button>`
  })}
  <div class="mail-inbox-layout" style="margin-top:14px">
    ${renderMailAccountSwitcher()}
    <div class="comm-layout">
    <section class="comm-list">
      <div class="comm-list-head"><span>${activeAccount?activeAccount.account:"收件列表"}</span><span class="tag red">${unread} 未读</span></div>
      <div class="thread-search"><input placeholder="搜索发件人、客户、主题"></div>
      <div style="max-height:560px;overflow:auto">
        ${listRows.length?listRows.map((e)=>{const gi=allRows.indexOf(e);return `<div class="email-list-item ${gi===emailActiveIdx?"active":""} ${e.status==="未读"?"unread":""}" onclick="selectEmailThread(${gi})">
          <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px"><span class="email-list-from">${e.customer}</span><span style="font-size:11px;color:var(--soft)">${e.time}</span></div>
          <div class="email-list-subject">${e.subject}</div>
          <div class="email-list-preview">${e.aiBrief||e.summary||""}</div>
          <div style="margin-top:6px">${e.status==="未读"?`<span class="tag red">${e.status}</span>`:tag(e.status)} ${tag(e.aiIntent||"")}</div>
        </div>`;}).join(""):`<div class="empty" style="padding:20px">${activeAccount?`「${activeAccount.account}」暂无收件`:"暂无收件记录"}</div>`}
      </div>
      ${renderListPager("comm-email-inbox",allRows.length,`右侧 ${panelLabel}`)}
    </section>
    ${emailDetailHtml(activeEmail,canWrite)}
    ${renderInsightPanel(insightCtx)}
    </div>
  </div>`;
}
/**
 * PAGE ID: communication-email
 * MODULE TYPE: list
 * OWNER DOMAIN: communication
 */
function renderEmailSentPage(){
  ensureActiveMailAccount();
  const allRows=getAccountSentRows();
  const activeAccount=getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId);
  const pagerKey="comm-email-sent";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const aiDraft=allRows.filter(e=>e.aiIntent&&e.aiIntent.includes("AI")).length;
  return `${renderEmailTabs()}
  ${emailFilters("收件人 / 客户 / 主题",emailSentAdvancedOpen,toggleEmailSentAdvanced,true)}
  <div class="mail-inbox-layout" style="margin-top:14px">
    ${renderMailAccountSwitcher()}
    <section class="panel" style="flex:1;min-width:0"><div class="table-wrap"><table><thead><tr><th>发送时间</th><th>发件账号</th><th>收件人</th><th>客户</th><th>主题</th><th>内容摘要</th><th>生成方式</th><th>负责人</th><th>关联线索</th><th>操作</th></tr></thead><tbody>
      ${rows.length?rows.map(e=>`<tr><td>${e.time}</td><td>${e.from}</td><td>${e.to}</td><td><strong>${e.customer}</strong></td><td>${e.subject}</td><td>${e.summary}</td>
        <td>${e.aiIntent&&e.aiIntent.includes("AI")?`<span class="tag cyan">${e.aiIntent}</span>`:e.aiIntent}</td>
        <td>${e.owner}</td><td>${e.lead||"—"}</td>
        <td>${renderRowActions([
          {label:"详情",onclick:`openDrawer("emails",${e._idx})`},
          {label:"再次编辑",onclick:"openModal('compose')"},
          {label:"跟进→",onclick:"nav('follow-record')"}
        ],`email-sent-${e._idx}`)}</td>
      </tr>`).join(""):`<tr><td colspan="10"><div class="empty">${activeAccount?`「${activeAccount.account}」暂无发件记录`:"暂无发件记录"}</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>
  </div>`;
}
/**
 * PAGE ID: communication-email
 * MODULE TYPE: list
 * OWNER DOMAIN: communication
 */
function renderEmailDraftPage(){
  ensureActiveMailAccount();
  const allRows=getAccountDraftRows();
  const activeAccount=getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId);
  const pagerKey="comm-email-draft";
  const {display:rows}=sliceForPage(allRows,pagerKey);
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  return `${renderEmailTabs()}
  ${emailFilters("收件人 / 客户 / 草稿主题",emailDraftAdvancedOpen,toggleEmailDraftAdvanced)}
  ${renderBatchBar({
    count:emailDraftSelected.size,
    unit:"份草稿",
    onCancel:"emailDraftSelected.clear();renderPage()",
    actions:`${canWrite?`<button type="button" class="btn small primary" onclick="batchEmailDraftAction('send')">批量发送</button><button type="button" class="btn small danger" onclick="batchEmailDraftAction('delete')">批量删除</button>`:""}`
  })}
  <div class="mail-inbox-layout" style="margin-top:14px">
    ${renderMailAccountSwitcher()}
    <section class="panel" style="flex:1;min-width:0"><div class="table-wrap"><table><thead><tr>
      ${canWrite?`<th><input type="checkbox" onchange="getAccountDraftRows().forEach((_,i)=>this.checked?emailDraftSelected.add(i):emailDraftSelected.delete(i));renderPage()"></th>`:""}
      <th>保存时间</th><th>发件账号</th><th>收件人</th><th>客户</th><th>主题</th><th>草稿摘要</th><th>AI 建议</th><th>状态</th><th>负责人</th><th>操作</th>
    </tr></thead><tbody>
      ${rows.length?rows.map((e,i)=>{const gi=allRows.indexOf(e);const idx=gi>=0?gi:i;return `<tr><td>${canWrite?`<input type="checkbox" onchange="toggleEmailDraftRow(${idx},this.checked)" ${emailDraftSelected.has(idx)?"checked":""}>`:""}</td>
        <td>${e.time}</td><td>${e.from}</td><td>${e.to}</td><td><strong>${e.customer}</strong></td><td>${e.subject}</td><td>${e.summary}</td>
        <td>${e.aiBrief||"—"}</td><td>${tag(e.status)}</td><td>${e.owner}</td>
        <td>${canWrite?renderRowActions([
          {label:"继续编辑",onclick:"openModal('compose')",primary:true},
          {label:"发送",onclick:"sendEmail()"},
          {label:"删除",onclick:"toast('草稿已删除')",danger:true}
        ],`email-draft-${idx}`):renderRowActions([{label:"查看",onclick:`openDrawer("emails",${e._idx})`}],`email-draft-${idx}`)}</td>
      </tr>`;}).join(""):`<tr><td colspan="${canWrite?11:10}"><div class="empty">${activeAccount?`「${activeAccount.account}」暂无草稿`:"暂无草稿"}</div></td></tr>`}
    </tbody></table></div>
    ${renderListPager(pagerKey,allRows.length)}
  </section>
  </div>`;
}
/**
 * PAGE ID: communication-whatsapp
 * MODULE TYPE: list
 * OWNER DOMAIN: communication
 */
function renderWhatsappChatPage(){
  const allChats=getChatRows();
  const {display:chats}=sliceForPage(allChats,"comm-whatsapp");
  const active=allChats.find(c=>c._idx===whatsappActiveIdx)||allChats[0]||{};
  const realIdx=active._idx!=null?active._idx:0;
  const pending=allChats.filter(c=>c.status==="待回复").length;
  const readonly=currentRole==="访客";
  const canWrite=!readonly&&currentRole!=="协同人";
  const insightCtx=buildInsightCtx({chat:active,channel:"whatsapp"});
  const panelLabel=active.customer&&!isCrmEstablished(insightCtx)?"AI 来件人洞察":"AI 沟通画像";
  const insightHtml=showAIModule&&canUseAiFeature()?renderInsightPanel(insightCtx):`<aside class="context-panel comm-intel-panel"><div class="context-head">◈ ${panelLabel}</div><div class="context-body ci-body"><div class="empty" style="padding:20px">AI 能力未启用</div></div></aside>`;
  return `
  <div class="comm-layout wa-comm-layout">
    <aside class="comm-list wa-sidebar">
      <div class="comm-list-head"><span>会话列表</span><span class="tag red">${pending} 待回复</span></div>
      <div class="thread-search"><input placeholder="搜索客户、手机号、负责人"></div>
      <div class="filters wa-sidebar-filters">
        <button type="button" class="btn small" onclick="toggleWhatsappFilter()">${whatsappFilterOpen?"收起筛选":"筛选"}</button>
        ${whatsappFilterOpen?`<div class="wa-filter-expand"><select><option>全部状态</option><option>待回复</option><option>已回复</option></select></div>`:""}
      </div>
      <div class="thread-list wa-thread-list">
        ${chats.length?chats.map((c)=>`<div class="thread-item ${realIdx===c._idx?"active":""}" onclick="selectWhatsappThread(${c._idx})"><div class="thread-avatar">${c.customer.slice(0,1)}</div><div class="thread-main"><div class="thread-row-top"><span class="thread-name">${c.customer}</span><span class="thread-time">${c.last}</span></div><div class="thread-preview">${c.preview}</div><div class="thread-meta">${c.status==="待回复"?`<span class="tag red">${c.status}</span>`:tag(c.status)}${c.unread?`<span class="tag red">${c.unread} 未读</span>`:""}<span class="tag blue">${c.convertMode}</span></div></div></div>`).join(""):`<div class="empty" style="padding:20px">暂无可见会话</div>`}
      </div>
      ${renderListPager("comm-whatsapp",allChats.length,`右侧 ${panelLabel}`)}
    </aside>
    <section class="chat-panel wa-chat-panel">
      <div class="chat-head"><div><div>${active.customer||"—"}</div><div class="wa-chat-sub">${active.contact||"—"} · ${active.phone||"—"} · ${active.lead||"—"} · ${active.account||"—"}</div></div><div class="toolbar-actions">
        <button type="button" class="btn small" onclick='openDrawer("chats",${realIdx})'>详情</button>
        ${canWrite?`<button type="button" class="btn small" onclick="openModal('lead')">转线索</button><button type="button" class="btn small primary" onclick="openModal('follow')">录入跟进</button>`:""}
      </div></div>
      <div class="chat-messages wa-chat-messages">
        <div class="chat-msg"><div class="thread-avatar">${(active.customer||"?").slice(0,1)}</div><div><div class="chat-bubble">Hello! I received your catalog. Very interested in your products. Could you share the price list?</div><div class="time-meta">09:15</div></div></div>
        <div class="chat-msg me"><div class="thread-avatar">我</div><div><div class="chat-bubble">Hi! Thank you for your interest. I'm attaching our updated price list. The MOQ is 100 pcs per color.</div><div class="time-meta" style="text-align:right">09:22</div></div></div>
        <div class="chat-msg"><div class="thread-avatar">${(active.customer||"?").slice(0,1)}</div><div><div class="chat-bubble">${active.preview||"Can you offer a sample order first?"}</div><div class="time-meta">${active.last||"—"}</div></div></div>
      </div>
      <div class="chat-tools wa-chat-tools">
        <div class="toolbar-actions wa-chat-quick"><button type="button" class="btn small">附件</button><button type="button" class="btn small">图片</button>${canWrite?`<button type="button" class="btn small" onclick="openModal('follow')">沉淀跟进</button><button type="button" class="btn small" onclick="toast('已生成小时沟通总结')">生成总结</button>`:""}</div>
        ${canWrite?`<div class="chat-input-row"><textarea placeholder="输入 WhatsApp 消息，人工确认后发送">Sure. We can arrange a sample order. The sample price would be...</textarea><button type="button" class="btn primary" onclick="sendWhatsapp()">发送</button></div>`:`<div class="ai-box">访客只读，不可发送消息</div>`}
      </div>
    </section>
    ${insightHtml}
  </div>`;
}
function emailFilters(keyword,advancedOpen,toggleFn,sentExtra){
  const adv=toggleFn?`<div class="filter-advanced ${advancedOpen?"show":""}"><div class="filter-grid">
    <div class="field"><label>AI 意图</label><select><option>全部</option><option>高意向</option><option>样品申请</option><option>成交确认</option></select></div>
    <div class="field"><label>关联线索</label><input placeholder="LEAD-2026-xxxx"></div>
    ${sentExtra?`<div class="field"><label>生成方式</label><select><option>全部</option><option>AI 草拟</option><option>人工回复</option></select></div>`:""}
    <div class="field"><label>时间范围</label><input type="date"></div>
  </div></div>`:"";
  return `<div class="filters"><div class="filter-grid">
    <div class="field"><label>邮箱账号</label><select><option>全部邮箱</option><option>zsn@sutex.net.cn</option><option>noreply@sutex.net.cn</option><option>sales@sutex.net.cn</option></select></div>
    <div class="field"><label>客户/邮件关键词</label><input placeholder="${keyword}"></div>
    <div class="field"><label>负责人</label><input placeholder="业务员"></div>
    <div class="field"><label>状态</label><select><option>全部</option><option>未读</option><option>已读</option><option>已发送</option><option>草稿</option></select></div>
    <div class="head-actions">
      ${toggleFn?`<button class="btn" onclick="${toggleFn.name}()">${advancedOpen?"收起高级筛选":"高级筛选"}</button>`:""}
      <button class="btn primary" onclick="toast('查询完成')">查询</button>
      <button class="btn" onclick="toast('筛选条件已重置')">重置</button>
    </div>
  </div></div>${adv}`;
}
function renderAnalysisTabs(){ return ""; }
function getAnalysisScope(){ return getSiteStatScope(); }
function getAnalysisStat(){
  const scope = getAnalysisScope();
  const site = scope.includes(analysisSite) ? analysisSite : (scope.includes("全部站点") ? "全部站点" : scope[0]);
  return { site, data: getSiteStatsData()[site] || getSiteStatsData()["全部站点"] };
}
function toggleAnalysisAdvanced(){ analysisAdvancedOpen=!analysisAdvancedOpen; renderPage(); }
function changeAnalysisSite(v){ analysisSite=v; renderPage(); }
function changeAnalysisPeriod(v){ analysisPeriod=v; renderPage(); }
function renderAnalysisFiltersHtml(extraFields){
  const {site} = getAnalysisStat();
  return `<div class="filters" style="margin-bottom:14px"><div class="filter-grid">
    <div class="field"><label>时间范围</label><select onchange="changeAnalysisPeriod(this.value)"><option ${analysisPeriod==="本月"?"selected":""}>本月</option><option ${analysisPeriod==="本季度"?"selected":""}>本季度</option><option ${analysisPeriod==="本周"?"selected":""}>本周</option></select></div>
    <div class="field"><label>站点</label><select onchange="changeAnalysisSite(this.value)">${getAnalysisScope().map(s=>`<option ${s===site?"selected":""}>${s}</option>`).join("")}</select></div>
    ${extraFields||""}
    <div class="head-actions"><button class="btn primary" onclick="toast('分析数据已刷新')">刷新</button></div>
  </div></div>`;
}
function crmTrendChart(vals, labels){
  const max = Math.max(...vals, 1);
  return (labels||vals.map((_,i)=>String(i+1))).map((m,i)=>`<div class="trend-bar"><div class="bar-val">${vals[i]}</div><div class="bar-col" style="height:${Math.round(vals[i]/max*100)}%"></div><div class="bar-label">${m}</div></div>`).join("");
}
function getScopedLeadsForAnalysis(){
  let rows = datasets.leads.filter(isActiveLead);
  const {site} = getAnalysisStat();
  if(site!=="全部站点") rows = rows.filter(r=>r.site===site);
  if(currentRole==="外贸业务员") rows = rows.filter(r=>r.owner==="张明远"||isPublicPoolLead(r));
  else if(currentRole==="运营专员") rows = rows.filter(r=>r.site!=="苏豪独立站B");
  return rows;
}
function getPhase1InquirySourceStats(){
  const raw = leadSourceStatsRows();
  const bucket = Object.fromEntries(CRM_PHASE1_INQUIRY_SOURCES.map(s=>[s,{channel:s,leads:0,customers:0,deals:0,amount:"$0",rate:"0%"}]));
  raw.forEach(r=>{
    const key = CRM_PHASE1_INQUIRY_SOURCES.find(src=>(CRM_INQUIRY_SOURCE_MAP[src]||[]).some(k=>r.channel.includes(k)||k===r.channel));
    if(!key) return;
    const b = bucket[key];
    b.leads += r.leads||0;
    b.customers += r.customers||0;
    b.deals += r.deals||0;
  });
  return CRM_PHASE1_INQUIRY_SOURCES.map(k=>{
    const b = bucket[k];
    b.rate = b.leads ? `${Math.round(b.customers/b.leads*1000)/10}%` : "0%";
    return b;
  });
}
function getCrmInquiryFunnel(){
  const {data} = getAnalysisStat();
  const f = data.funnel || [["询盘进入",254,100],["有效询盘",185,73],["转客户",107,42],["报价打样",78,31],["成交客户",58,23]];
  const inquiry = f[0]||["询盘",254,100];
  const valid = f[1]||["有效线索",185,73];
  const customer = f[2]||["客户",107,42];
  const deal = f[4]||f[f.length-1]||["成交",58,23];
  const base = inquiry[1]||1;
  return [
    ["询盘", inquiry[1], 100],
    ["有效线索", valid[1], Math.round(valid[1]/base*100)],
    ["客户", customer[1], Math.round(customer[1]/base*100)],
    ["成交", deal[1], Math.round(deal[1]/base*100)]
  ];
}
function getCrmSalesFunnel(){
  const {data} = getAnalysisStat();
  const inquiry = data.leads||254;
  const valid = Math.round(inquiry*(parseFloat(String(data.validRate||"73").replace("%",""))/100));
  const customers = data.customers||107;
  const deals = data.dealCustomers||58;
  const base = inquiry||1;
  return [
    ["询盘", inquiry, 100],
    ["线索", valid, Math.round(valid/base*100)],
    ["客户", customers, Math.round(customers/base*100)],
    ["成交", deals, Math.round(deals/base*100)]
  ];
}
function getCustomerTagDistribution(rows){
  const map = {};
  rows.forEach(c=>{
    (c.customerTags||"").split(/[/、,，]/).map(t=>t.trim()).filter(Boolean).forEach(t=>{ map[t]=(map[t]||0)+1; });
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}
function getCustomerStatusBuckets(rows){
  const highIntent = rows.filter(c=>(c.customerTags||"").includes("高意向")||((c.level==="A类")&&getCustomerBizStatus(c)==="跟进中")).length;
  const keyAccounts = rows.filter(c=>c.level==="A类").length;
  const normal = rows.filter(c=>c.level==="B类"||c.level==="C类").length;
  const dormant = rows.filter(c=>getCustomerBizStatus(c)==="休眠"||c.next==="已超期"||getCustomerBizStatus(c)==="公海待领").length;
  return [["高意向客户",highIntent],["重点客户",keyAccounts],["普通客户",normal],["沉睡客户",dormant]];
}
function getCrmHubMetrics(){
  const {site,data} = getAnalysisStat();
  const customers = getCustomerRows();
  const leads = getScopedLeadsForAnalysis();
  const pool = leads.filter(isPublicPoolLead).length;
  const assigned = leads.filter(r=>r.assignStatus==="已分配"||hasLeadOwner(r)).length;
  const pendingFollow = leads.filter(r=>r.status==="待跟进"||r.stage==="待首响").length;
  const followCustomers = new Set(datasets.follow.map(f=>f.customer)).size;
  const activeCustomers = customers.filter(c=>getCustomerBizStatus(c)==="跟进中"||getCustomerBizStatus(c)==="已成交").length;
  const newCustomers = customers.filter(c=>(c.created||"").startsWith("2026-06")).length;
  const sourceStats = getPhase1InquirySourceStats();
  const topSource = sourceStats.sort((a,b)=>b.leads-a.leads)[0];
  return {
    site, data,
    inquiryTotal: data.leads||254,
    inquiryNew: Math.round((data.leads||254)*0.18),
    inquiryValid: Math.round((data.leads||254)*(parseFloat(String(data.validRate||"73").replace("%",""))/100)),
    inquiryTopSource: topSource?`${topSource.channel} ${topSource.leads}`:"—",
    customerTotal: customers.length,
    customerNew: newCustomers,
    customerActive: activeCustomers,
    customerTags: getCustomerTagDistribution(customers).slice(0,3).map(([t,c])=>`${t} ${c}`).join(" · ")||"—",
    followCustomers,
    assignedLeads: assigned,
    pendingFollow,
    dealCustomers: data.dealCustomers||58,
    dealAmount: data.amount||"$317,100",
    dealTrend: data.trend||[198,220,231,241,253,254],
    poolLeads: pool,
    sourceStats
  };
}
function getCrmOperationsMetrics(){
  const leads = getScopedLeadsForAnalysis();
  const customers = getCustomerRows();
  const pool = leads.filter(isPublicPoolLead).length;
  const assigned = leads.filter(r=>r.assignStatus==="已分配"||hasLeadOwner(r)).length;
  const unprocessed = leads.filter(r=>r.status==="待跟进"&&!hasLeadOwner(r)).length;
  const responded = leads.filter(r=>r.stage!=="待首响"&&r.stage!=="待认领"&&hasLeadOwner(r)).length;
  const converted = datasets.conversions.filter(c=>c.node==="转客户").length;
  const newLeads = leads.filter(r=>(r.inquiryTime||"").startsWith("2026-06")).length;
  return {
    newLeads, pool, assigned, unprocessed, responded, converted,
    tagDist: getCustomerTagDistribution(customers),
    channelDist: Object.entries(leads.reduce((m,l)=>{ const ch=l.channel||l.source||"其他"; m[ch]=(m[ch]||0)+1; return m; },{})).sort((a,b)=>b[1]-a[1]),
    activeCustomers: customers.filter(c=>getCustomerBizStatus(c)==="跟进中").length,
    dormantCustomers: customers.filter(c=>c.next==="已超期"||getCustomerBizStatus(c)==="休眠").length
  };
}
function getCrmDealRankings(){
  const {data} = getAnalysisStat();
  const sellers = (data.sellers||[]).map(r=>({name:r[0],amount:r[5],deals:r[4],customers:r[3]})).sort((a,b)=>parseFloat(String(b.amount).replace(/[^\d.]/g,""))-parseFloat(String(a.amount).replace(/[^\d.]/g,"")));
  const customerRows = (datasets.contractCustomers||[]).slice().sort((a,b)=>parseFloat(String(b.amount).replace(/[^\d.]/g,""))-parseFloat(String(a.amount).replace(/[^\d.]/g,"")));
  return {sellers, customers: customerRows};
}
function getCrmPerformanceProcessMetrics(){
  const {data} = getAnalysisStat();
  let rows = (data.sellers||[]).map(r=>({name:r[0],site:r[1],leads:r[2],customers:r[3],deals:r[4],amount:r[5],reply:r[6]}));
  if(currentRole==="外贸业务员") rows = rows.filter(r=>r.name==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(r=>r.name!=="王芳"||r.site.includes("独立站A"));
  const customers = getCustomerRows();
  const unFollowed = customers.filter(c=>c.next==="已超期").length;
  const overdueFollow = datasets.tasks.filter(t=>(t.overdue||"").includes("超期")).length;
  return {
    rows,
    assignedTotal: rows.reduce((s,r)=>s+(parseInt(r.leads,10)||0),0),
    followTotal: new Set(datasets.follow.map(f=>f.customer)).size,
    firstResponse: data.firstResponse||"8.9小时",
    unFollowed,
    overdueFollow
  };
}
function crmRankList(items, valKey, metaKey){
  return items.slice(0,5).map((r,i)=>rankHtml({name:r.name||r.customer,meta:r[metaKey]||r.site||"—",val:r[valKey]||"—"},i)).join("");
}
function getLeadAnalysisRows(){
  const all = [
    {site:"天猫苏豪站",source:"网站表单",total:52,valid:42,overdue:2,dup:1,firstResp:"5.2h",rate:"80.8%"},
    {site:"天猫苏豪站",source:"邮件",total:38,valid:30,overdue:1,dup:2,firstResp:"6.1h",rate:"78.9%"},
    {site:"天猫苏豪站",source:"WhatsApp",total:28,valid:22,overdue:0,dup:1,firstResp:"4.8h",rate:"78.6%"},
    {site:"苏豪独立站A",source:"网站表单",total:34,valid:26,overdue:2,dup:1,firstResp:"7.8h",rate:"76.5%"},
    {site:"苏豪独立站A",source:"邮件",total:28,valid:21,overdue:1,dup:0,firstResp:"8.2h",rate:"75.0%"},
    {site:"苏豪独立站A",source:"WhatsApp",total:14,valid:10,overdue:1,dup:1,firstResp:"9.5h",rate:"71.4%"},
    {site:"苏豪独立站B",source:"网站表单",total:18,valid:11,overdue:3,dup:2,firstResp:"16.4h",rate:"61.1%"},
    {site:"苏豪独立站B",source:"邮件",total:12,valid:8,overdue:2,dup:1,firstResp:"18.2h",rate:"66.7%"},
    {site:"苏豪独立站B",source:"接口拉取",total:6,valid:4,overdue:1,dup:0,firstResp:"12.0h",rate:"66.7%"},
    {site:"全部站点",source:"手动录入",total:12,valid:9,overdue:0,dup:0,firstResp:"—",rate:"75.0%"}
  ];
  let rows = all;
  const {site} = getAnalysisStat();
  if(site!=="全部站点") rows = rows.filter(r=>r.site===site);
  if(currentRole==="外贸业务员") rows = rows.filter(r=>r.site==="天猫苏豪站");
  else if(currentRole==="运营专员") rows = rows.filter(r=>r.site!=="苏豪独立站B");
  return rows;
}
function getFunnelSchemeRows(){
  const schemes = [
    {scheme:"方案一：自动建线索",enter:168,valid:128,convert:78,quote:52,deal:26,rate:"15.5%"},
    {scheme:"方案二：人工转线索",enter:88,valid:70,convert:38,quote:26,deal:12,rate:"13.6%"}
  ];
  if(funnelSchemeFilter==="方案一：自动建线索") return schemes.filter(s=>s.scheme.includes("方案一"));
  if(funnelSchemeFilter==="方案二：人工转线索") return schemes.filter(s=>s.scheme.includes("方案二"));
  return schemes;
}
function getPerformanceRows(){
  const {data} = getAnalysisStat();
  let rows = (data.sellers||[]).map(r=>({name:r[0],site:r[1],leads:r[2],customers:r[3],deals:r[4],amount:r[5],reply:r[6]}));
  if(currentRole==="外贸业务员") rows = rows.filter(r=>r.name==="张明远");
  else if(currentRole==="运营专员") rows = rows.filter(r=>r.name!=="王芳"||r.site.includes("独立站A"));
  if(performanceView==="运营绩效") rows = [{name:"刘运营",site:"天猫+独立站A",leads:"210",customers:"—",deals:"—",amount:"分配率 96%",reply:"—"},{name:"陈协同",site:"天猫苏豪站",leads:"—",customers:"—",deals:"—",amount:"监督 12 次",reply:"—"}];
  return rows;
}
/**
 * PAGE ID: data-analysis-hub
 * MODULE TYPE: dashboard
 * OWNER DOMAIN: analysis
 */
function renderDataAnalysisHubPage(){
  const m = getCrmHubMetrics();
  return `${renderAnalysisPageHead()}
  ${renderAnalysisFiltersHtml()}
  <p style="font-size:12px;color:var(--soft);margin:0 0 14px;line-height:1.7">面向管理层、销售与运营，展示 CRM 一期经营闭环：<strong>询盘获取 → 客户沉淀 → 销售跟进 → 成交结果 → 团队效率</strong>。不含 AI 预测、SEO 与网站流量分析。</p>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">询盘</div></div><div class="panel-body">
    <div class="kpi-grid cols-4">
      ${metric("询盘总量",m.inquiryTotal,`${m.site} · ${analysisPeriod}`)}
      ${metric("新增询盘",m.inquiryNew,`${analysisPeriod}新增`)}
      ${metric("有效询盘量",m.inquiryValid,`有效率 ${m.data.validRate||"73%"}`,"up")}
      ${metric("询盘来源",m.inquiryTopSource,"Top 来源渠道")}
    </div>
  </div></section>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">客户</div></div><div class="panel-body">
    <div class="kpi-grid cols-4">
      ${metric("客户总数",m.customerTotal,`${m.site} 可见客户`)}
      ${metric("新增客户数",m.customerNew,`${analysisPeriod}新增`,"up")}
      ${metric("活跃客户数",m.customerActive,"跟进中 / 已成交")}
      ${metric("客户标签分布",m.customerTags,"Top 标签")}
    </div>
  </div></section>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">销售</div></div><div class="panel-body">
    <div class="kpi-grid cols-4">
      ${metric("跟进客户数量",m.followCustomers,"有跟进记录的客户")}
      ${metric("已分配线索数量",m.assignedLeads,"已分配至业务员")}
      ${metric("待跟进数量",m.pendingFollow,m.pendingFollow?"需尽快处理":"—",m.pendingFollow?"warn":"")}
      ${metric("公海池线索",m.poolLeads,"待分配资源")}
    </div>
  </div></section>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">成交</div></div><div class="panel-body">
    <div class="kpi-grid cols-4">
      ${metric("成交客户数量",m.dealCustomers,`${analysisPeriod}成交`)}
      ${metric("成交金额",m.dealAmount,m.site,"up")}
      ${metric("转化率",m.data.conversion||"22.8%","询盘→成交")}
    </div>
    <div style="margin-top:14px"><div class="panel-title" style="font-size:13px;margin-bottom:8px">成交趋势</div><div class="trend-chart">${siteStatTrend(m.dealTrend)}</div></div>
  </div></section>`;
}
/**
 * PAGE ID: customer-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderCustomerAnalysisPage(){
  const rows = getCustomerRows();
  const {data} = getAnalysisStat();
  const trend = data.trend||[198,220,231,241,253,254];
  const growth = Math.max(0, (trend[trend.length-1]||0)-(trend[0]||0));
  const countries = Object.entries(rows.reduce((m,c)=>{ const k=c.country||"其他"; m[k]=(m[k]||0)+1; return m; },{})).sort((a,b)=>b[1]-a[1]);
  const industries = Object.entries(rows.reduce((m,c)=>{ m[c.industry||"其他"]=(m[c.industry]||0)+1; return m; },{})).sort((a,b)=>b[1]-a[1]);
  const channels = Object.entries(rows.reduce((m,c)=>{ const ch=getCustomerChannel(c); m[ch]=(m[ch]||0)+1; return m; },{})).sort((a,b)=>b[1]-a[1]);
  const tags = getCustomerTagDistribution(rows);
  const statuses = getCustomerStatusBuckets(rows);
  const maxDim = Math.max(...countries.map(([,c])=>c),1);
  return `${renderAnalysisPageHead()}${renderAnalysisFiltersHtml()}
  <div class="kpi-grid cols-4">
    ${metric("客户总数",rows.length,`${analysisPeriod} · 可见客户`)}
    ${metric("新增客户",rows.filter(c=>(c.created||"").startsWith("2026-06")).length,"本月新增","up")}
    ${metric("活跃客户",rows.filter(c=>getCustomerBizStatus(c)==="跟进中"||getCustomerBizStatus(c)==="已成交").length,"跟进中 / 已成交")}
    ${metric("客户增长",`+${growth}`,"近6期趋势","up")}
  </div>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">客户增长</div><button class="btn small" onclick="nav('customer-profile')">客户列表</button></div><div class="panel-body">
    <div class="grid-2">
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">新增客户趋势</div><div class="trend-chart">${siteStatTrend(trend.map(v=>Math.round(v*0.42)))}</div></div>
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">客户增长数量</div><div class="summary-list">${kv("本周期新增",rows.filter(c=>(c.created||"").startsWith("2026-06")).length+" 家")}${kv("累计客户",rows.length+" 家")}${kv("近6期净增",growth+" 家")}</div></div>
    </div>
  </div></section>
  <div class="grid-2" style="margin-bottom:14px">
    <section class="panel"><div class="panel-head"><div class="panel-title">客户结构 · 国家/地区</div></div><div class="panel-body"><div class="funnel">${countries.slice(0,6).map(([n,c])=>funnelRow(n,c,Math.round(c/maxDim*100)||0)).join("")}</div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">客户结构 · 行业</div></div><div class="panel-body"><div class="funnel">${industries.slice(0,6).map(([n,c])=>funnelRow(n,c,Math.round(c/maxDim*100)||0)).join("")}</div></div></section>
  </div>
  <div class="grid-2" style="margin-bottom:14px">
    <section class="panel"><div class="panel-head"><div class="panel-title">客户结构 · 来源渠道</div></div><div class="panel-body"><div class="funnel">${channels.slice(0,6).map(([n,c])=>funnelRow(n,c,Math.round(c/maxDim*100)||0)).join("")}</div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">客户结构 · 客户标签</div></div><div class="panel-body"><div class="funnel">${(tags.length?tags:([["暂无标签",0]])).slice(0,6).map(([n,c])=>funnelRow(n,c,Math.round(c/(tags[0]?.[1]||1)*100)||0)).join("")}</div></div></section>
  </div>
  <section class="panel"><div class="panel-head"><div class="panel-title">客户状态</div></div><div class="panel-body"><div class="kpi-grid cols-4">${statuses.map(([label,val])=>metric(label,val,analysisPeriod)).join("")}</div></div></section>`;
}
/**
 * PAGE ID: communication-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderCommunicationAnalysisPage(){
  return `${renderAnalysisPageHead()}
  <section class="panel"><div class="panel-head"><div class="panel-title">沟通分析已调整</div></div><div class="panel-body">
    <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0">一期 CRM 数据分析聚焦经营闭环，沟通响应类指标已合并至<strong>运营分析</strong>。请通过左侧菜单切换分析页面；日常沟通处理请使用沟通工作台。</p>
  </div></section>`;
}
/**
 * PAGE ID: team-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderTeamAnalysisPage(){
  const ops = getCrmOperationsMetrics();
  const maxTag = Math.max(...ops.tagDist.map(([,c])=>c),1);
  const maxCh = Math.max(...ops.channelDist.map(([,c])=>c),1);
  return `${renderAnalysisPageHead()}${renderAnalysisFiltersHtml()}
  <p style="font-size:12px;color:var(--soft);margin:0 0 14px;line-height:1.7">分析线索与客户资源流转效率，支撑运营人员优化分配与跟进节奏。</p>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">线索运营</div><div class="toolbar-actions"><button class="btn small" onclick="nav('lead-all')">公海池</button><button class="btn small" onclick="nav('lead-pending')">我的线索</button></div></div><div class="panel-body">
    <div class="kpi-grid cols-4">
      ${metric("新增线索数量",ops.newLeads,analysisPeriod,"up")}
      ${metric("公海池数量",ops.pool,"待分配资源")}
      ${metric("已分配数量",ops.assigned,"已分配至业务员")}
      ${metric("未处理数量",ops.unprocessed,ops.unprocessed?"需运营关注":"—",ops.unprocessed?"warn":"")}
    </div>
  </div></section>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">分配效率</div></div><div class="panel-body">
    <div class="kpi-grid cols-3">
      ${metric("分配数量",ops.assigned,`${analysisPeriod}累计`)}
      ${metric("响应数量",ops.responded,"已首响 / 已跟进")}
      ${metric("转客户数量",ops.converted,"转化记录")}
    </div>
  </div></section>
  <div class="grid-2">
    <section class="panel"><div class="panel-head"><div class="panel-title">客户运营 · 标签分布</div></div><div class="panel-body"><div class="funnel">${(ops.tagDist.length?ops.tagDist:[["暂无",0]]).slice(0,6).map(([n,c])=>funnelRow(n,c,Math.round(c/maxTag*100)||0)).join("")}</div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">客户运营 · 来源分布</div></div><div class="panel-body"><div class="funnel">${ops.channelDist.slice(0,6).map(([n,c])=>funnelRow(n,c,Math.round(c/maxCh*100)||0)).join("")}</div></div></section>
  </div>
  <section class="panel" style="margin-top:14px"><div class="panel-head"><div class="panel-title">客户运营 · 活跃情况</div><button class="btn small" onclick="nav('customer-profile')">客户列表</button></div><div class="panel-body"><div class="kpi-grid cols-3">
    ${metric("活跃客户",ops.activeCustomers,"跟进中")}
    ${metric("沉睡客户",ops.dormantCustomers,"超期 / 休眠",ops.dormantCustomers?"warn":"")}
    ${metric("公海待分配",getCustomerRows().filter(c=>c.lock==="公海").length,"待分配客户")}
  </div></div></section>`;
}
/**
 * PAGE ID: ai-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderAiAnalysisPage(){
  return `${renderAnalysisPageHead()}
  <section class="panel"><div class="panel-head"><div class="panel-title">一期未建设 AI 预测分析</div></div><div class="panel-body">
    <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:0">CRM 一期数据分析聚焦经营闭环，不包含 AI 预测、健康度评分、流失预测与经营建议。请通过左侧菜单查看数据总览及各业务分析页。</p>
  </div></section>`;
}
function deskRowsCount(){ return getCommDeskRows().filter(r=>r.pending).length; }
/**
 * PAGE ID: lead-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderLeadAnalysisPage(){
  const {site,data} = getAnalysisStat();
  const sourceStats = getPhase1InquirySourceStats();
  const funnel = getCrmInquiryFunnel();
  const validRate = data.validRate||"73%";
  const convertRate = funnel[0][1] ? `${Math.round(funnel[2][1]/funnel[0][1]*1000)/10}%` : "—";
  const daily = [18,22,19,24,21,26,23];
  const weekly = [86,92,98,105];
  const monthly = data.trend||[198,220,231,241,253,254];
  const maxSrc = Math.max(...sourceStats.map(s=>s.leads),1);
  return `${renderAnalysisPageHead()}${renderAnalysisFiltersHtml(`<div class="field"><label>来源渠道</label><select>${leadSourceFilterOptions()}</select></div>`)}
  <div class="kpi-grid cols-4">
    ${metric("询盘总量",data.leads||254,`${site} · ${analysisPeriod}`)}
    ${metric("有效询盘率",validRate,`有效 ${funnel[1][1]} 条`,parseFloat(validRate)>=70?"up":"")}
    ${metric("转客户率",convertRate,`${funnel[2][1]} 家客户`,"up")}
    ${metric("成交关联",funnel[3][1],`${funnel[3][0]} 单`)}
  </div>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">询盘趋势</div></div><div class="panel-body">
    <div class="grid-3">
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">日询盘量</div><div class="trend-chart">${crmTrendChart(daily,["一","二","三","四","五","六","日"])}</div></div>
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">周询盘量</div><div class="trend-chart">${crmTrendChart(weekly,["W1","W2","W3","W4"])}</div></div>
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">月询盘量</div><div class="trend-chart">${siteStatTrend(monthly)}</div></div>
    </div>
  </div></section>
  <div class="grid-2" style="margin-bottom:14px">
    <section class="panel"><div class="panel-head"><div class="panel-title">来源渠道</div><button class="btn small" onclick="nav('lead-all')">公海池</button></div><div class="panel-body"><div class="funnel">${sourceStats.map(s=>funnelRow(s.channel,s.leads,Math.round(s.leads/maxSrc*100)||0)).join("")}</div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">询盘转化漏斗</div><span style="font-size:12px;color:var(--soft)">询盘 → 有效线索 → 客户 → 成交</span></div><div class="panel-body"><div class="funnel">${funnel.map(f=>funnelStageRow(f[0],f[1],f[2])).join("")}</div><div class="summary-list" style="margin-top:12px">${kv("有效询盘率",validRate)}${kv("转客户率",convertRate)}</div></div></section>
  </div>
  <section class="panel"><div class="panel-head"><div class="panel-title">来源渠道转化明细</div></div><div class="table-wrap"><table><thead><tr><th>来源</th><th>询盘数</th><th>客户数</th><th>成交数</th><th>转客户率</th></tr></thead><tbody>
    ${sourceStats.map(s=>`<tr><td>${tag(s.channel)}</td><td><strong>${s.leads}</strong></td><td>${s.customers}</td><td>${s.deals}</td><td>${s.rate}</td></tr>`).join("")}
  </tbody></table></div></section>`;
}
/**
 * PAGE ID: funnel-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderFunnelAnalysisPage(){
  const {site,data} = getAnalysisStat();
  const ranks = getCrmDealRankings();
  const trend = data.trend||[198,220,231,241,253,254];
  const dealTrend = trend.map(v=>Math.round(v*0.23));
  const amountTrend = trend.map((v,i)=>Math.round(v*1.25+i*3));
  const highValue = ranks.customers.filter(c=>parseFloat(String(c.amount).replace(/[^\d.]/g,""))>=30000);
  const repeat = ranks.customers.filter(c=>(c.contracts||0)>=2);
  return `${renderAnalysisPageHead()}${renderAnalysisFiltersHtml()}
  <div class="kpi-grid cols-4">
    ${metric("成交客户",data.dealCustomers||58,`${site} · ${analysisPeriod}`,"up")}
    ${metric("成交金额",data.amount||"$317,100",analysisPeriod,"up")}
    ${metric("合同数量",data.contractCount||58,"已录入")}
    ${metric("客单价",data.avgDeal||"$5,467","均值")}
  </div>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">成交趋势</div><button class="btn small" onclick="nav('contract-list')">合同中心</button></div><div class="panel-body">
    <div class="grid-2">
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">成交金额趋势（K）</div><div class="trend-chart">${crmTrendChart(amountTrend,["1月","2月","3月","4月","5月","6月"])}</div></div>
      <div><div style="font-size:12px;color:var(--soft);margin-bottom:8px">成交数量趋势</div><div class="trend-chart">${siteStatTrend(dealTrend)}</div></div>
    </div>
  </div></section>
  <div class="grid-2" style="margin-bottom:14px">
    <section class="panel"><div class="panel-head"><div class="panel-title">业务员成交排行</div></div><div class="panel-body"><div class="rank-list">${crmRankList(ranks.sellers,"amount","deals")}</div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">客户成交排行</div></div><div class="panel-body"><div class="rank-list">${crmRankList(ranks.customers.map(c=>({name:c.customer,amount:c.amount,meta:`${c.contracts||0} 份合同 · ${c.site}`})),"amount","meta")}</div></div></section>
  </div>
  <section class="panel"><div class="panel-head"><div class="panel-title">客户贡献</div></div><div class="panel-body">
    <div class="kpi-grid cols-3">
      ${metric("高贡献客户",highValue.length,"累计金额 ≥ $30K","up")}
      ${metric("复购客户",repeat.length,"2 份及以上合同")}
      ${metric("累计成交 TOP1",ranks.customers[0]?.amount||"—",ranks.customers[0]?.customer||"—")}
    </div>
    <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>客户</th><th>站点</th><th>合同数</th><th>累计成交金额</th><th>业务员</th></tr></thead><tbody>
      ${ranks.customers.slice(0,8).map(c=>`<tr><td><strong>${c.customer}</strong></td><td>${c.site}</td><td>${c.contracts||0}</td><td>${c.amount}</td><td>${c.owner||"—"}</td></tr>`).join("")}
    </tbody></table></div>
  </div></section>`;
}
/**
 * PAGE ID: performance-analysis
 * MODULE TYPE: analysis
 * OWNER DOMAIN: analysis
 */
function renderPerformanceAnalysisPage(){
  const {site,data} = getAnalysisStat();
  const proc = getCrmPerformanceProcessMetrics();
  const funnel = getCrmSalesFunnel();
  const ranks = getCrmDealRankings();
  const inquiryToCustomer = funnel[0][1] ? `${Math.round(funnel[2][1]/funnel[0][1]*1000)/10}%` : "—";
  const customerDealRate = funnel[2][1] ? `${Math.round(funnel[3][1]/funnel[2][1]*1000)/10}%` : "—";
  const newCustomerRank = (()=>{
    const {data} = getAnalysisStat();
    let rows = (data.sellers||[]).map(r=>({name:r[0],site:r[1],customers:r[3]}));
    if(currentRole==="外贸业务员") rows = rows.filter(r=>r.name==="张明远");
    return rows.sort((a,b)=>(parseInt(b.customers,10)||0)-(parseInt(a.customers,10)||0));
  })();
  return `${renderAnalysisPageHead()}${renderAnalysisFiltersHtml()}
  <p style="font-size:12px;color:var(--soft);margin:0 0 14px;line-height:1.7">分析业务员执行效率：业绩结果、跟进过程与销售转化，不含 AI 预测类指标。</p>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">销售业绩</div></div><div class="panel-body"><div class="grid-3">
    <div><div style="font-size:12px;font-weight:600;margin-bottom:8px">成交金额排行</div><div class="rank-list">${crmRankList(ranks.sellers,"amount","deals")}</div></div>
    <div><div style="font-size:12px;font-weight:600;margin-bottom:8px">成交客户排行</div><div class="rank-list">${crmRankList(ranks.sellers.map(r=>({name:r.name,meta:r.site,val:r.deals})),"val","meta")}</div></div>
    <div><div style="font-size:12px;font-weight:600;margin-bottom:8px">新增客户排行</div><div class="rank-list">${crmRankList(newCustomerRank.map(r=>({name:r.name,meta:r.site,val:r.customers})),"val","meta")}</div></div>
  </div></div></section>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">销售过程</div><button class="btn small" onclick="nav('follow-record')">跟进日志</button></div><div class="panel-body">
    <div class="kpi-grid cols-5">
      ${metric("分配线索数量",proc.assignedTotal,analysisPeriod)}
      ${metric("跟进客户数量",proc.followTotal,"跟进日志条数")}
      ${metric("首次响应时间",proc.firstResponse,`${site} 均值`)}
      ${metric("未跟进客户",proc.unFollowed,proc.unFollowed?"需关注":"—",proc.unFollowed?"warn":"")}
      ${metric("超时未跟进",proc.overdueFollow,proc.overdueFollow?"任务超期":"—",proc.overdueFollow?"danger":"")}
    </div>
  </div></section>
  <section class="panel" style="margin-bottom:14px"><div class="panel-head"><div class="panel-title">销售转化</div><span style="font-size:12px;color:var(--soft)">询盘 → 线索 → 客户 → 成交</span></div><div class="panel-body">
    <div class="grid-2">
      <div class="funnel">${funnel.map(f=>funnelStageRow(f[0],f[1],f[2])).join("")}</div>
      <div class="summary-list">${kv("询盘转客户率",inquiryToCustomer)}${kv("客户成交率",customerDealRate)}${kv("团队成交额",data.amount||"$317,100")}</div>
    </div>
  </div></section>
  <section class="panel"><div class="panel-head"><div class="panel-title">业务员明细</div><div class="toolbar-actions"><button class="btn small" onclick="nav('lead-pending')">我的线索</button><button class="btn small" onclick="nav('contract-list')">合同中心</button></div></div>
    <div class="table-wrap"><table><thead><tr><th>姓名</th><th>站点</th><th>分配线索</th><th>转客户</th><th>成交</th><th>成交额</th><th>平均回复</th></tr></thead><tbody>
      ${proc.rows.length?proc.rows.map(r=>`<tr><td><strong>${r.name}</strong></td><td>${r.site}</td><td>${r.leads}</td><td>${r.customers}</td><td>${r.deals}</td><td>${r.amount}</td><td>${r.reply||"—"}</td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">暂无绩效数据</div></td></tr>`}
    </tbody></table></div>
  </section>`;
}

/**
 * SPA 主路由 — nav(pageId) → renderPage()
 * PAGE ROUTE INDEX: workbench | message-center | pageMeta[*].custom → renderCustom panelFns
 */

function openDrawer(type,index,drawerOpts){
  window._drawerLeadIdx = type==="leads" ? index : null;
  if(type==="customers"){
    if(drawerOpts&&drawerOpts.detailTab!=null) customerDetailTab=drawerOpts.detailTab;
    else if(!(drawerOpts&&drawerOpts.keepDetailTab)) customerDetailTab="overview";
  }
  const rows = type==="sites" ? getSiteMgmtRows() : type==="siteOwners" ? getSiteOwnerRows() : type==="siteStats" ? Object.entries(getSiteStatsData()).filter(([n])=>n!=="全部站点").map(([name,s])=>({name,...s})) : (datasets[type] || datasets.customers);
  const data = rows[index] || rows[0] || {};
  const detail = drawerDetail(type,data,index);
  document.getElementById("drawerTitle").textContent = detail.title;
  document.getElementById("drawerSub").textContent = detail.sub;
  document.getElementById("drawerBody").innerHTML = detail.body;
  const drawerEl = document.querySelector("#drawerMask .drawer");
  if(drawerEl) drawerEl.classList.toggle("drawer-wide", type==="customers"||type==="leads"||(type==="tasks"&&!!data.lead));
  document.getElementById("drawerMask").classList.add("open");
}
function drawerDetail(type,data,index){
  const configs = {
    leads:(()=>{
      const isPool = isPublicPoolLead(data);
      const hideBiz = shouldHideLeadBusinessProgress(data);
      const insightCtx = buildInsightCtx({leadRow:data, channel:"inquiry"});
      const senderBlock = isPool ? drawerSection("来件人摘要", `<div style="font-size:12px;line-height:1.65;color:var(--muted);margin-bottom:10px">${data.intent||"—"} · ${data.country||"—"} · ${leadChannelLabel(data)}</div>${companyBackgroundDrawerHtml(insightCtx)}${currentRole!=="访客"&&currentRole!=="协同人"?`<div class="si-actions-grid"><button class="btn small primary" onclick="senderAction('assign')">分配业务员</button><button class="btn small danger" onclick="senderAction('spam')">标记无效</button></div>`:""}`) : "";
      const basicFields = hideBiz
        ? ["id","inquiryTime","site","channel","name","contact","country","intent","age"]
        : ["id","inquiryTime","site","channel","name","contact","country","intent","capture","route"];
      const bizInfo = hideBiz
        ? drawerSection("分配状态",`${kv("分配状态",tag(resolvePoolDisplayStatus(data)))}${kv("意向等级",getLeadIntentLevel(data))}${kv("标签",leadTagsDisplayHtml(data.id))}${kv("入池方式",data.capture||"—")}${kv("分配路径",normalizeLeadCopy(data.route||"—"))}`)
        : drawerSection("业务状态",`${kv("状态",getLeadBizStatus(data))}${getLeadBizStage(data)!=="—"?kv("阶段",getLeadBizStage(data)):""}${kv("意向等级",getLeadIntentLevel(data))}${kv("标签",leadTagsDisplayHtml(data.id))}${kv("负责人",data.owner&&data.owner!=="-"?data.owner:"未分配")}${kv("最近跟进",getLeadLastFollowTime(data))}${kv("下次跟进",getLeadNextFollowTime(data))}`);
      const stageTrack = !hideBiz&&getLeadBizStatus(data)==="跟进中"?drawerSection("销售阶段",leadBizStageTrack(data)):"";
      return {
      title: data.name || data.id || "询盘详情",
      sub:isPool?"公海池 · "+resolvePoolDisplayStatus(data)+" · 可分配资源":leadIntelSubtitle(data),
      body:`${senderBlock}
        ${drawerSection("线索基础信息",detailCells({...data,channel:leadChannelLabel(data)},basicFields))}
        ${bizInfo}
        ${stageTrack}
        ${isPool?poolRecycleHistoryHtml(data):""}
        ${!hideBiz?renderLifecycleSection("leads",data):""}
        ${!hideBiz?drawerSection("跟进记录",leadDrawerFollowHtml(data)):""}
        ${drawerSection("客户沟通",leadDrawerCommEntryHtml(data))}
        ${drawerSection("附件",leadDrawerAttachHtml(data))}
        ${drawerSection("操作记录",leadDrawerAuditHtml(data))}
        ${isAbnormalLead(data)?drawerSection("异常信息",`${kv("状态",getLeadBizStatus(data))}${kv("异常类型",tag(data.invalidType||"无效线索"))}${kv("异常原因",data.invalidReason||"-")}${kv("标记来源",data.invalidMarkSource||data.capture||"-")}${kv("标记时间",data.invalidMarkedAt||data.processedTime||"-")}${kv("标记人",data.invalidMarkedBy||data.processedBy||"-")}${kv("处理状态",tag(data.processStatus||"待处理"))}`):""}
        ${isAbnormalLead(data)?leadAbnormalHistoryHtml(data):""}
        ${currentRole!=="访客"?drawerSection("操作",`<div class="toolbar-actions" style="margin-top:8px;flex-wrap:wrap;gap:6px">${currentRole!=="协同人"?`<button class="btn small" onclick="openLeadEditModal(${index})">编辑线索</button>`:""}${currentPage==="lead-all"&&isPublicPoolLead(data)&&currentRole!=="访客"&&currentRole!=="协同人"?`<button class="btn small primary" onclick="openModal('assign')">分配线索</button>`:""}${currentPage==="lead-invalid"&&isAbnormalLead(data)?`${currentRole!=="访客"&&currentRole!=="协同人"&&data.processStatus!=="已归档"?`<button class="btn small primary" onclick="toast('已确认归档');closeDrawer()">确认归档</button>`:""}${currentRole!=="访客"&&currentRole!=="协同人"?`<button class="btn small primary" onclick="openRestoreLeadAbnormalModal(${index})">取消异常</button>`:""}`:""}${!isAbnormalLead(data)&&currentRole!=="访客"&&currentRole!=="协同人"&&!isPublicPoolLead(data)?`<button class="btn small primary" onclick="openModal('follow')">记录跟进</button>`:""}${!isAbnormalLead(data)&&currentRole!=="访客"&&currentRole!=="协同人"&&!isPublicPoolLead(data)?`<button class="btn small" onclick="openModal('assign')">转客户</button>`:""}${!isAbnormalLead(data)&&currentRole!=="访客"&&currentRole!=="协同人"&&!isPublicPoolLead(data)?`<button class="btn small danger" onclick="toast('线索已关闭')">关闭线索</button>`:""}${canMarkLeadAbnormal(data)?`<button class="btn small danger" onclick="openMarkLeadAbnormalModal(${index})">标记异常</button>`:""}${isAbnormalLead(data)&&currentRole!=="访客"&&currentRole!=="协同人"?`<button class="btn small primary" onclick="openRestoreLeadAbnormalModal(${index})">取消异常</button>`:""}</div>`):""}
        ${isAbnormalLead(data)?drawerSection("处理记录",`${kv("标记来源",data.invalidMarkSource||data.capture||"-")}${kv("标签",data.tags||"-")}`):""}`
    };})(),
    customers:(()=>{
      const p = getCustomerProfile(data);
      const idx = typeof index==="number"?index:datasets.customers.indexOf(data);
      return {
      title:data.name || data.id || "客户详情",
      sub:`${data.id} · ${getCustomerLeadCount(data)} 条线索 · ${getCustomerSiteCount(data)} 个站点 · 负责人 ${data.owner||"—"}`,
      body:`${renderCustomerDrawerTabs(idx>=0?idx:0)}${customerDrawerTabBody(data,idx>=0?idx:0)}`
    };})(),
    contacts:{
      title:data.name || "联系人详情",
      sub:`${data.customer||""} · ${data.contactRole||data.decision||""}`,
      body:`${drawerSection("联系人信息",detailCells(data,["id","customer","name","role","contactRole","decision","email","phone","whatsapp","owner","last"]))}
        ${canUseAiFeature()&&data.aiRole?drawerSection("AI 识别角色",`${kv("识别结果",contactAiRoleTag(data.aiRole))}${kv("说明","基于邮件签名、职位与沟通频次自动识别")}`):""}
        ${currentRole!=="访客"&&currentRole!=="协同人"?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="openModal('contact')">编辑联系人</button><button class="btn small" onclick="nav('customer-profile')">查看客户</button><button class="btn small" onclick="closeDrawer();openModal('follow')">记录跟进</button></div>`):""}`
    },
    tags:(()=>{
      const leadRow=window._leadTagMgmtRow;
      const leadIdx=window._leadTagMgmtIdx;
      if(leadRow){
        window._leadTagMgmtRow=null;
        window._leadTagMgmtIdx=null;
        const locked=leadRow.sourceType==="ai";
        const hint=locked
          ? "AI 标签由系统自动生成，不可人工编辑、修改或覆盖。"
          : leadRow.sourceType==="custom"
            ? "自定义标签由业务员在线索列表中维护。"
            : "系统预设标签由管理员统一配置。";
        const leadList=getLeadsByTag(leadRow.name);
        return {
          title:leadRow.name||leadRow.code||"线索标签详情",
          sub:tagSourceTypeLabel(leadRow.sourceType),
          body:`${drawerSection("标签信息",`<div class="detail-grid">${[["code","标签编码"],["name","标签名称"],["category","标签分类"],["sourceType","标签类型"],["count","使用数量"],["createdAt","创建时间"],["updatedAt","更新时间"]].map(([k,l])=>`<div class="detail-cell"><label>${l}</label><strong>${k==="sourceType"?tagSourceTypeLabel(leadRow[k]):formatCell(leadRow[k],k)}</strong></div>`).join("")}</div><p style="font-size:12px;color:var(--soft);margin-top:10px">${hint}</p>`)}
            ${drawerSection("使用线索",`${kv("使用线索数",leadList.length+" 条")}${leadList.length?`<div class="summary-list" style="margin-top:8px">${leadList.slice(0,5).map(l=>`<div class="summary-row"><div class="summary-text"><strong>${l.name}</strong><span>${l.id} · ${l.stage||"—"} · ${l.owner||"—"}</span></div></div>`).join("")}${leadList.length>5?`<p style="font-size:12px;color:var(--soft);margin-top:6px">还有 ${leadList.length-5} 条，点击「查看线索」查看完整列表</p>`:""}</div>`:`<div class="empty" style="padding:8px 0">暂无使用该标签的线索</div>`}`)}
            ${drawerSection("快捷操作",`<div class="toolbar-actions">${leadRow.sourceType==="system"&&isTagAdmin()?`<button class="btn small primary" onclick="openModal('tag')">维护标签</button>`:""}${leadIdx!=null?`<button class="btn small" onclick="openTagLeadList(${leadIdx})">查看线索</button>`:""}</div>`)}`
        };
      }
      const locked=isCustomerTagAiLocked(data);
      const custTagIdx=getCustomerTagRows().findIndex(t=>t._idx===index);
      const custList=getCustomersByTag(data.name);
      return {
      title:data.name || data.code || "客户标签详情",
      sub:data.category||"",
      body:`${drawerSection("标签信息",`<div class="detail-grid">${[["code","标签编码"],["name","标签名称"],["category","标签分类"],["count","使用数量"],["createdAt","创建时间"],["updatedAt","更新时间"],["status","状态"]].map(([k,l])=>`<div class="detail-cell"><label>${l}</label><strong>${formatCell(data[k],k)}</strong></div>`).join("")}</div>${locked?`<p style="font-size:12px;color:var(--soft);margin-top:10px">含 AI 自动打标能力，标签定义由管理员维护，业务员不可修改。</p>`:`<p style="font-size:12px;color:var(--soft);margin-top:10px">客户标签由管理员统一维护，业务员仅可查看与使用。</p>`}`)}
        ${drawerSection("使用客户",`${kv("使用客户数",custList.length+" 个")}${custList.length?`<div class="summary-list" style="margin-top:8px">${custList.slice(0,5).map(c=>`<div class="summary-row"><div class="summary-text"><strong>${c.name}</strong><span>${c.id} · ${c.country||"—"} · ${c.owner||"—"}</span></div></div>`).join("")}${custList.length>5?`<p style="font-size:12px;color:var(--soft);margin-top:6px">还有 ${custList.length-5} 个，点击「查看客户」查看完整列表</p>`:""}</div>`:`<div class="empty" style="padding:8px 0">暂无使用该标签的客户</div>`}`)}
        ${drawerSection("快捷操作",`<div class="toolbar-actions">${isTagAdmin()?`<button class="btn small primary" onclick="openModal('tag')">维护标签</button>`:""}${custTagIdx>=0?`<button class="btn small" onclick="openTagCustomerList(${custTagIdx})">查看客户</button>`:""}</div>`)}`
    };})(),
    sites:{
      title:data.name || data.id || "站点详情",
      sub:"",
      body:`${drawerSection("站点主数据",detailCells(data,["id","name","domain","status","dept","launchDate","source","frequency","lastPull","leads","customers","conversion"]))}
        ${drawerSection("生命周期",`${lifecycleTrack(data.lifecycleStage||2,data.status||"运营中")}${kv("当前阶段",data.lifecycle||data.status||"-")}${kv("最近更新",data.updated||"-")}`)}
        ${drawerSection("渠道接入配置",`${channelBadges(data.channels||[])}<div style="margin-top:10px" class="summary-list">${(data.channels||[]).map(c=>kv(c.name,c.on?(c.err?"已接入但同步异常":"已接入，正常运行"):"未接入或已关闭")).join("")}</div>`)}
        ${drawerSection("接口配置",`${kv("Endpoint",data.endpoint||"-")}${kv("接口状态",data.apiStatus||"正常")}${kv("数据源",data.source||"-")}${kv("拉取频率",data.frequency||"-")}${kv("最近拉取",data.lastPull||"-")}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="testSiteApi(${index})">测试接口</button>${currentRole!=="访客"?`<button class="btn small" onclick="openSiteFlow(${index})">流程配置</button>`:""}</div>`)}
        ${drawerSection("关联入口",`<div class="quick-grid" style="grid-template-columns:repeat(3,1fr)"><div class="quick-item" onclick="nav('site-owner')"><span class="quick-icon">◇</span>负责人配置</div><div class="quick-item" onclick="selectedSiteStat='${data.name}';nav('site-stat')"><span class="quick-icon">▤</span>站点统计</div><div class="quick-item" onclick="nav('channel-config')"><span class="quick-icon">⌬</span>来源管理</div></div>`)}
        ${currentRole!=="访客"?drawerSection("启停控制",`<div class="toolbar-actions">${data.status==="运营中"?`<button class="btn small" onclick="toggleSiteStatus(${index},'pause');closeDrawer()">暂停站点</button>`:`<button class="btn small primary" onclick="toggleSiteStatus(${index},'resume');closeDrawer()">恢复运营</button>`}<button class="btn small danger" onclick="toggleSiteStatus(${index},'offline');closeDrawer()">标记下线</button></div>`):""}`
    },
    siteOwners:{
      title:(data.name||"站点")+" · 负责人关系",
      sub:"",
      body:`${drawerSection("站点信息",`${kv("站点",data.name||"-")}${kv("域名",data.domain||"-")}${kv("状态",tag(data.status))}${kv("异常",data.exception||"无")}`)}
        ${drawerSection("运营专员分配",`${(data.operators||[]).map(o=>kv(o,"运营专员")).join("")||kv("未配置","—")}${currentRole!=="访客"&&currentRole!=="外贸业务员"&&currentRole!=="协同人"?`<div class="toolbar-actions" style="margin-top:8px"><button class="btn small primary" onclick="openSiteOwnerAuth(${index},'运营专员')">调整运营专员</button></div>`:""}`)}
        ${drawerSection("协同人分配",`${(data.collabs||[]).map(o=>kv(o,"协同人")).join("")||kv("未配置","暂无协同人")}${currentRole!=="访客"&&currentRole!=="外贸业务员"&&currentRole!=="协同人"?`<div class="toolbar-actions" style="margin-top:8px"><button class="btn small" onclick="openSiteOwnerAuth(${index},'协同人')">调整协同人</button></div>`:""}`)}
        ${drawerSection("外贸业务员分配",`${(data.sellers||[]).map(o=>kv(o,"主业务员")).join("")}${(data.extraSellers||[]).map(o=>kv(o,"协作业务员")).join("")}${currentRole!=="访客"&&currentRole!=="外贸业务员"&&currentRole!=="协同人"?`<div class="toolbar-actions" style="margin-top:8px"><button class="btn small" onclick="openSiteOwnerAuth(${index},'外贸业务员')">调整业务员</button></div>`:""}`)}
        ${drawerSection("生效时间",`${kv("生效起始",data.effectiveFrom||"-")}${kv("生效截止",data.effectiveTo||"—")}${kv("最近更新",data.updated||"-")}`)}
        ${drawerSection("权限配置",permPreviewHtml(index))}
        ${drawerSection("最近变更",`<div class="change-log">${getSiteOwnerLogs().filter(l=>l.site===data.name).slice(0,3).map(l=>`<div class="change-row" style="grid-template-columns:120px 1fr"><span class="change-time">${l.time}</span><span>${l.action}：${l.before} → <strong>${l.after}</strong></span></div>`).join("")||kv("暂无","—")}</div>`)}`
    },
    siteStats:{
      title:(data.name||"站点")+" · 经营统计明细",
      sub:"",
      body:`${drawerSection("核心指标",detailCells(data,["name","uv","leads","customers","dealCustomers","amount","conversion","firstResponse","validRate","contractCount","avgDeal","pendingCustomers"]))}
        ${drawerSection("询盘转化漏斗",`<div class="funnel">${(data.funnel||[]).map(r=>funnelRow(r[0],r[1],r[2])).join("")}</div>`)}
        ${drawerSection("客户等级分布",`<div class="funnel">${(data.distribution||[]).map(r=>funnelRow(r[0],r[1],r[2])).join("")}</div>`)}
        ${drawerSection("线索来源",`<div class="funnel">${(data.channels||[]).map(r=>funnelRow(r[0],r[1],r[2])).join("")}</div>`)}
        ${drawerSection("询盘趋势",`<div class="trend-chart">${siteStatTrend(data.trend||[])}</div>`)}
        ${drawerSection("业务员贡献",`<div class="table-wrap"><table class="todo-table"><thead><tr><th>业务员</th><th>询盘</th><th>成交</th><th>金额</th></tr></thead><tbody>${(data.sellers||[]).map(r=>`<tr><td>${r[0]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[5]}</td></tr>`).join("")}</tbody></table></div>`)}`
    },
    contracts:{
      title:data.id || "合同详情",
      sub:"",
      body:(()=>{
        const related=datasets.contracts.filter(c=>c.customer===data.customer);
        const custIdx=datasets.customers.findIndex(c=>c.name===data.customer);
        const canWrite=currentRole!=="访客"&&currentRole!=="协同人";
        const fromCustomer=window._contractDrawerCustomerView;
        if(fromCustomer){
          window._contractDrawerCustomerView=false;
          return customerContractDrawerBody(data,related,custIdx,canWrite);
        }
        return `${drawerSection("合同信息",detailCells(data,["id","customer","site","lead","amount","date","latestDeal","seller","source"]))}
        ${drawerSection("签约信息",`${contractLifecycleHtml(data.state,data)}${kv("合同状态",contractStateTag(data.state,data))}${kv("签约日期",data.date||"—")}${kv("最近成交",data.latestDeal&&data.latestDeal!=="-"?data.latestDeal:"—")}${kv("录入方式","人工录入")}`)}
        ${contractDrawerTimeline(data)}
        ${drawerSection("附件与来源",`${kv("附件",data.attachment||"-")}${kv("线索来源",data.source||"-")}`)}
        ${drawerSection("关联客户",`${kv("客户名称",data.customer||"-")}${kv("同客户合同数",related.length+" 份")}${kv("累计金额",formatContractTotalAmount(related))}${custIdx>=0?`<div class="toolbar-actions" style="margin-top:10px"><button class="btn small" onclick="closeDrawer();openDrawer('customers',${custIdx})">客户档案</button><button class="btn small" onclick="closeDrawer();openDrawer('customers',${custIdx},{keepDetailTab:true,detailTab:'orders'})">客户合同历史</button></div>`:""}`)}
        ${drawerSection("关联业务",`${kv("关联线索",data.lead&&data.lead!=="-"?data.lead:"未绑定（不影响合同有效性）")}${data.lead&&data.lead!=="-"?`<div class="toolbar-actions" style="margin-top:10px"><button class="btn small" onclick="closeDrawer();nav('lead-converted')">转化记录→</button></div>`:""}`)}
        ${related.length>1?drawerSection("同客户其他合同",`<div class="table-wrap"><table class="todo-table"><thead><tr><th>合同编号</th><th>金额</th><th>签约日期</th><th>合同状态</th></tr></thead><tbody>${related.filter(c=>c.id!==data.id).map(c=>`<tr style="cursor:pointer" onclick="openDrawer('contracts',${datasets.contracts.indexOf(c)})"><td>${c.id}</td><td>${c.amount}</td><td>${c.date}</td><td>${contractStateTag(c.state,c)}</td></tr>`).join("")}</tbody></table></div>`):""}
        ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="closeDrawer();openModal('contractEditAmount')">编辑金额</button><button class="btn small" onclick="closeDrawer();openModal('contract')">编辑合同</button><button class="btn small" onclick="closeDrawer();openModal('follow')">录入跟进</button></div>`):""}`;
      })()
    },
    tasks:(()=>{
      const leadIdx = data.lead ? datasets.leads.findIndex(l=>l.id===data.lead) : -1;
      const leadRow = leadIdx>=0 ? datasets.leads[leadIdx] : null;
      return {
      title:data.id || "任务详情",
      sub:leadRow ? leadIntelSubtitle(leadRow) : "",
      body:`${leadRow?drawerSection("线索业务状态",`${kv("状态",getLeadBizStatus(leadRow))}${getLeadBizStage(leadRow)!=="—"?kv("阶段",getLeadBizStage(leadRow)):""}${kv("意向等级",getLeadIntentLevel(leadRow))}${kv("最近跟进",getLeadLastFollowTime(leadRow))}${kv("下次跟进",getLeadNextFollowTime(leadRow))}`):""}
        ${drawerSection("任务信息",detailCells(data,["id","task","lead","site","customer","stage","deadline","overdue","priority","owner"]))}
        ${drawerSection("处理要求",`${kv("下一步动作",data.next || "-")}${currentRole!=="访客"?`<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="closeDrawer();openModal('follow')">录入跟进</button><button class="btn small" onclick="completeTaskById('${data.id}')">标记完成</button></div>`:""}`)}
        ${drawerSection("询盘全链路跟进记录",`<div class="timeline">${taskFullChainHtml(data)}</div>`)}
        ${drawerSection("关联邮件往来",data.relatedEmail&&data.relatedEmail!=="-"?`${kv("关联邮件",data.relatedEmail)}${kv("AI 识别",((datasets.emails.find(e=>e.id===data.relatedEmail)||{}).aiIntent)||"-")}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="closeDrawer();openCustomerEmailThread({leadId:'${data.lead||""}',customerName:'${(data.customer||"").replace(/'/g,"\\'")}'})">查看邮件会话</button></div>`:`${kv("关联邮件","暂无")}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small" onclick="closeDrawer();openCustomerEmailThread({leadId:'${data.lead||""}',customerName:'${(data.customer||"").replace(/'/g,"\\'")}'})">查看邮件会话</button></div>`)}
        ${data.relatedWa?drawerSection("关联 WhatsApp 会话",`${kv("会话编号",data.relatedWa)}${kv("最近消息",((datasets.chats.find(c=>c.id===data.relatedWa)||{}).preview)||"-")}${kv("入库状态",((datasets.chats.find(c=>c.id===data.relatedWa)||{}).warehouse)||"实时入库")}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="closeDrawer();nav('whatsapp-chat')">进入会话→</button></div>`):""}
        ${drawerSection("关联入口",`<div class="quick-grid" style="grid-template-columns:repeat(3,1fr)"><div class="quick-item" onclick="closeDrawer();nav('follow-record')"><span class="quick-icon">◷</span>跟进日志</div><div class="quick-item" onclick="closeDrawer();nav('lead-converted')"><span class="quick-icon">✓</span>转化记录</div><div class="quick-item" onclick="closeDrawer();nav('lead-all')"><span class="quick-icon">▽</span>公海池</div></div>`)}`
    };})(),
    conversions:{
      title:(data.lead||"线索")+" · "+(data.node||"转化节点"),
      sub:"",
      body:`${drawerSection("转化节点信息",detailCells(data,["id","lead","customer","source","node","customerId","owner","time","site","scheme"]))}
        ${drawerSection("结果说明",`${kv("说明",data.result||"-")}${kv("转化路径",data.path||"-")}${data.contract&&data.contract!=="-"?kv("关联合同",data.contract):""}`)}
        ${drawerSection("同线索转化流水",`<div class="timeline">${conversionLeadTimeline(data.lead)}</div>`)}
        ${drawerSection("询盘全链路跟进记录",`<div class="timeline">${conversionChainHtml(data)}</div>`)}
        ${drawerSection("关联入口",`<div class="quick-grid" style="grid-template-columns:repeat(3,1fr)"><div class="quick-item" onclick="closeDrawer();nav('lead-pending')"><span class="quick-icon">!</span>我的线索</div><div class="quick-item" onclick="closeDrawer();nav('follow-record')"><span class="quick-icon">◷</span>跟进日志</div>${data.customerId&&data.customerId!=="-"?`<div class="quick-item" onclick="closeDrawer();nav('customer-profile')"><span class="quick-icon">◉</span>客户档案</div>`:`<div class="quick-item" onclick="closeDrawer();nav('lead-all')"><span class="quick-icon">▽</span>公海池</div>`}${data.contract&&data.contract!=="-"?`<div class="quick-item" onclick="closeDrawer();nav('contract-list')"><span class="quick-icon">▣</span>合同中心</div>`:""}</div>`)}`
    },
    follow:{
      title:(data.customer || "跟进")+" · "+(data.state || "跟进记录"),
      sub:"",
      body:`${drawerSection("跟进记录",detailCells(data,["id","time","target","customer","method","state","summary","feedback","nextPlan","owner"]))}
        ${drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small" onclick="nav('customer-profile')">查看客户</button>${currentRole!=="访客"&&currentRole!=="协同人"?`<button class="btn small primary" onclick="closeDrawer();openModal('follow')">新增跟进</button>`:""}</div>`)}`
    },
    emails:{
      title:data.subject || data.id || "邮件详情",
      sub:"",
      body:(()=>{
        const canWrite=currentRole!=="访客"&&currentRole!=="协同人";
        const isInbox=data.box==="inbox";
        const iCtx=buildInsightCtx({email:data,channel:"email"});
        const established=isCrmEstablished(iCtx);
        const si=getSenderIntelligence(iCtx);
        const ci=getCommIntelligence(iCtx);
        const openInboxNav=`closeDrawer();selectEmailById('${data.id}');nav('communication-email')`;
        const intelBlock=canUseAiFeature()
          ? (established
          ? drawerSection("AI 沟通画像",`<span class="ci-status ${commStatusClass(ci.commStatus)}">${ci.commStatusLabel||ci.commStatus}</span><div style="margin-top:10px"><div class="ci-label">客户关注点</div><div class="ci-tags">${(ci.topics||[]).map(t=>`<span class="ci-tag">${t}</span>`).join("")||"—"}</div></div><div style="margin-top:10px"><div class="ci-label">跟进建议</div><div class="ci-actions">${(ci.nextActions||[]).slice(0,2).map(a=>`<div class="ci-action-item">${a}</div>`).join("")}</div></div><div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="${openInboxNav}">查看完整沟通画像 →</button></div>`)
          : drawerSection("AI 来件人洞察",`<div class="si-hero" style="margin-bottom:8px"><div class="si-logo">${si.logo||"?"}</div><div class="si-hero-text"><h3>${si.identifiedCompany||"—"}</h3><div class="si-hero-meta">${si.country||"—"} · ${si.industry||"—"}</div></div></div><div style="font-size:12px;margin-bottom:6px"><strong>采购意图</strong> · ${si.purchaseIntent||"—"}</div><div class="ci-label">客户关注点</div><div class="ci-tags">${(si.topics||[]).map(t=>`<span class="ci-tag">${t}</span>`).join("")||"—"}</div>${companyBackgroundDrawerHtml(iCtx)}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="${openInboxNav}">查看完整来件人洞察 →</button></div>${canWrite?`<div class="si-actions-grid" style="margin-top:10px"><button class="btn small primary" onclick="closeDrawer();openModal('lead')">转线索</button><button class="btn small" onclick="closeDrawer();openModal('assign')">分配业务员</button><button class="btn small" onclick="closeDrawer();nav('lead-all')">加入公海池</button></div>`:""}`))
          : drawerSection(established?"AI 沟通画像":"AI 来件人洞察", aiDisabledPlaceholder(established?"AI 沟通画像":"AI 来件人洞察", established?"沟通画像、情绪分析、成交信号":"来件人识别、意向判断、行动建议", true));
        return `${drawerSection("邮件信息",detailCells(data,["id","box","mailbox","time","from","to","customer","subject","status","owner","lead"]))}
        ${canUseAiFeature()?drawerSection("AI 处理结果",`${kv("客户意图",data.aiIntent||"-")}${kv("摘要建议",data.aiBrief||"-")}${kv("转化建议",data.convertMode||"-")}`):drawerSection("AI 处理结果", aiDisabledPlaceholder("AI 邮件分析","意图识别、摘要建议、回复生成", true))}
        ${drawerSection("邮件内容",`${kv("内容摘要",data.summary||"-")}`)}
        ${intelBlock}
        ${established?drawerSection("关联客户",`${kv("客户名称",data.customer||"-")}${kv("关联线索",data.lead||"-")}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small" onclick="closeDrawer();openCustomerFromCommIntel('${(data.customer||"").replace(/'/g,"\\'")}')">客户企业画像</button><button class="btn small" onclick="closeDrawer();nav('follow-record')">跟进日志</button></div>`):drawerSection("CRM 状态",`${kv("当前状态","尚未进入 CRM 正式流程")}${kv("建议","完成来件人判断后，再转线索或创建客户")}`)}
        ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions">${isInbox?`<button class="btn small primary" onclick="closeDrawer();openModal('reply')">回复邮件</button><button class="btn small" onclick="closeDrawer();openModal('lead')">${data.convertMode==="待确认转线索"||data.convertMode==="未入库"?"确认转线索":"转线索"}</button>`:data.box==="draft"?`<button class="btn small primary" onclick="closeDrawer();openModal('compose')">继续编辑</button><button class="btn small" onclick="sendEmail()">发送</button>`:`<button class="btn small" onclick="closeDrawer();openModal('compose')">再次编辑</button>`}<button class="btn small" onclick="closeDrawer();openModal('follow')">录入跟进</button></div>`):""}`;
      })()
    },
    chats:{
      title:(data.customer||"WhatsApp")+" · 会话",
      sub:"",
      body:(()=>{
        const canWrite=currentRole!=="访客"&&currentRole!=="协同人";
        const iCtx=buildInsightCtx({chat:data,channel:"whatsapp"});
        const established=isCrmEstablished(iCtx);
        const si=getSenderIntelligence(iCtx);
        const ci=getCommIntelligence(iCtx);
        const intelBlock=canUseAiFeature()
          ? (established
          ? drawerSection("AI 沟通画像",`<span class="ci-status ${commStatusClass(ci.commStatus)}">${ci.commStatusLabel||ci.commStatus}</span><div style="margin-top:10px"><div class="ci-label">客户关注点</div><div class="ci-tags">${(ci.topics||[]).map(t=>`<span class="ci-tag">${t}</span>`).join("")||"—"}</div></div><div style="margin-top:10px"><div class="ci-label">跟进建议</div><div class="ci-actions">${(ci.nextActions||[]).slice(0,2).map(a=>`<div class="ci-action-item">${a}</div>`).join("")}</div></div><div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="closeDrawer();selectWhatsappThread(${index});commView='whatsapp';nav('communication-whatsapp')">查看完整沟通画像 →</button></div>`)
          : drawerSection("AI 来件人洞察",`<div class="si-hero" style="margin-bottom:8px"><div class="si-logo">${si.logo||"?"}</div><div class="si-hero-text"><h3>${si.identifiedCompany||"—"}</h3><div class="si-hero-meta">${si.country||"—"} · ${si.industry||"—"}</div></div></div><div style="font-size:12px;margin-bottom:6px"><strong>采购意图</strong> · ${si.purchaseIntent||"—"}</div><div class="ci-label">客户关注点</div><div class="ci-tags">${(si.topics||[]).map(t=>`<span class="ci-tag">${t}</span>`).join("")||"—"}</div>${companyBackgroundDrawerHtml(iCtx)}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small primary" onclick="closeDrawer();selectWhatsappThread(${index});commView='whatsapp';nav('communication-whatsapp')">查看完整来件人洞察 →</button></div>`))
          : drawerSection(established?"AI 沟通画像":"AI 来件人洞察", aiDisabledPlaceholder(established?"AI 沟通画像":"AI 来件人洞察", established?"沟通画像、情绪分析":"来件人识别、意向判断", true));
        return `${drawerSection("会话信息",detailCells(data,["id","customer","contact","phone","account","lead","stage","status","owner","last","unread"]))}
        ${drawerSection("消息与入库",`${kv("最近消息",data.preview||"-")}${kv("沟通摘要",data.summary||"-")}${kv("入库状态",data.warehouse||"-")}${kv("转化状态",data.convertMode||"-")}`)}
        ${intelBlock}
        ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="closeDrawer();nav('whatsapp-chat');selectWhatsappThread(${index})">进入会话</button><button class="btn small" onclick="closeDrawer();openModal('lead')">转线索</button><button class="btn small" onclick="closeDrawer();openModal('follow')">录入跟进</button></div>`):""}`;
      })()
    },
    users:{
      title:data.name || data.account || "用户详情",
      sub:"",
      body:(()=>{
        const canWrite=canManageUsers()&&currentRole!=="访客"&&!(data.role==="管理员"&&currentRole!=="管理员");
        return `${drawerSection("账号信息",detailCells(data,["id","account","name","role","sites","state","dept","phone","login","created"]))}
        ${drawerSection("钉钉绑定",`${kv("绑定状态",getDingTalkBindStatus(data))}${kv("钉钉账号",data.dingtalkName || "—")}${kv("钉钉 ID",data.dingtalkId || "—")}${data.dingtalkId ? `<p style="font-size:11px;color:var(--soft);margin-top:8px;line-height:1.6">该钉钉账号已关联系统账号，可使用钉钉扫码登录。</p>` : `<p style="font-size:11px;color:var(--soft);margin-top:8px;line-height:1.6">未绑定钉钉账号，无法使用钉钉扫码登录。</p>`}`)}
        ${drawerSection("站点绑定",`${kv("站点范围",data.sites||"-")}<div class="toolbar-actions" style="margin-top:10px"><button class="btn small" onclick="closeDrawer();nav('site-management')">站点管理</button><button class="btn small" onclick="closeDrawer();nav('role-management')">角色管理</button></div>`)}
        ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="closeDrawer();openUserModal(${index})">编辑用户</button><button class="btn small" onclick="closeDrawer();openModal('auth')">调整授权</button><button class="btn small ${data.state==="正常"?"danger":""}" onclick="closeDrawer();openModal('userFreeze')">${data.state==="正常"?"冻结账号":"启用账号"}</button></div>`):""}`;
      })()
    },
    roles:{
      title:(data.name||"角色")+" · 权限详情",
      sub:"",
      body:(()=>{
        const canWrite=currentRole==="管理员";
        const permLabels=[["view","查看"],["create","新增"],["edit","编辑"],["delete","删除"],["export","导出"],["assign","分配"],["transfer","客户转移"],["auth","授权管理"]];
        const boundUsers=datasets.users.filter(u=>u.role===data.name);
        return `${drawerSection("角色信息",detailCells(data,["id","name","type","status","userCount","scope"]))}
        ${drawerSection("基本信息",`${kv("描述",data.desc||"-")}${kv("菜单组数",data.menus||"-")}`)}
        ${drawerSection("按钮权限",`<div class="check-grid">${permLabels.map(([k,l])=>`<div class="check-row"><span>${l}</span><input type="checkbox" ${data.perms&&data.perms[k]?"checked":""} disabled></div>`).join("")}</div>`)}
        ${drawerSection("已绑定用户",boundUsers.length?`<div class="table-wrap"><table class="todo-table"><thead><tr><th>姓名</th><th>账号</th><th>状态</th></tr></thead><tbody>${boundUsers.map(u=>`<tr><td>${u.name}</td><td>${u.account}</td><td>${tag(u.state)}</td></tr>`).join("")}</tbody></table></div>`:`${kv("暂无","该角色暂无绑定用户")}`)}
        ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="closeDrawer();openModal('rolePerm')">配置权限</button>${data.deletable?`<button class="btn small danger" onclick="toast('角色已删除');closeDrawer()">删除角色</button>`:""}<button class="btn small" onclick="closeDrawer();nav('user-management')">分配用户</button></div>`):""}`;
      })()
    },
    channels:{
      title:data.name || "渠道详情",
      sub:"",
      body:(()=>{
        const canWrite=canManageChannels()&&currentRole!=="访客";
        return `${drawerSection("渠道信息",detailCells(data,["id","name","type","site","source","frequency","status","lastPull"]))}
        ${drawerSection("接口配置",`${kv("Endpoint",data.endpoint||"-")}${kv("认证方式",data.auth||"-")}${kv("入池规则",data.leadRule||"-")}`)}
        ${drawerSection("关联入口",`<div class="toolbar-actions"><button class="btn small" onclick="closeDrawer();nav('site-management')">站点管理</button><button class="btn small" onclick="closeDrawer();nav('communication-config')">沟通账号</button><button class="btn small" onclick="closeDrawer();nav('system-log')">审计日志</button></div>`)}
        ${canWrite?drawerSection("快捷操作",`<div class="toolbar-actions"><button class="btn small primary" onclick="closeDrawer();openModal('channels')">编辑渠道</button><button class="btn small" onclick="toast('连接测试成功')">测试连接</button><button class="btn small" onclick="toast('已触发手动拉取')">手动拉取</button></div>`):""}`;
      })()
    },
    auditLogs:{
      title:(data.id||"审计")+" · 操作详情",
      sub:"",
      body:`${drawerSection("操作记录",detailCells(data,["id","time","operator","module","action","content","result","target","ip"]))}
        ${drawerSection("关联跳转",`<div class="toolbar-actions">${data.target&&data.target.startsWith("LEAD")?`<button class="btn small" onclick="closeDrawer();nav('lead-all')">线索中心</button>`:""}${data.target&&data.target.startsWith("PC")?`<button class="btn small" onclick="closeDrawer();nav('contract-list')">合同中心</button>`:""}${data.target&&data.target.startsWith("FOL")?`<button class="btn small" onclick="closeDrawer();nav('follow-record')">跟进日志</button>`:""}${data.target&&data.target.startsWith("CH")?`<button class="btn small" onclick="closeDrawer();nav('channel-config')">来源管理</button>`:""}<button class="btn small" onclick="closeDrawer();nav('user-management')">用户管理</button></div>`)}`
    },
  };
  return configs[type] || {
    title:data.name || data.customer || data.id || "详情",
    sub:"",
    body:drawerSection("基础信息",detailCells(data,Object.keys(data).slice(0,12)))
  };
}
function drawerSection(title,body){
  return `<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div class="panel-title">${title}</div></div><div class="panel-body">${body}</div></section>`;
}
function detailCells(data,fields){
  return `<div class="detail-grid">${fields.map(k=>`<div class="detail-cell"><label>${fieldName(k)}</label><strong>${formatCell(data[k],k)}</strong></div>`).join("")}</div>`;
}
function customerContactsHtml(customerName){
  const rows = datasets.contacts.filter(c=>c.customer===customerName);
  const body = rows.length ? rows.map((c,i)=>`<tr><td>${c.name}</td><td>${c.role}</td><td>${c.decision}</td><td>${c.email}</td><td>${c.whatsapp}</td><td>${renderRowActions([{label:"详情",onclick:`openDrawer("contacts",${datasets.contacts.indexOf(c)})`},{label:"编辑",onclick:"openModal('contact')"}],`drawer-contact-${i}`)}</td></tr>`).join("") : `<tr><td colspan="6">暂无联系人</td></tr>`;
  return `<div class="toolbar-actions" style="margin-bottom:10px"><button class="btn small primary" onclick="openModal('contact')">新增联系人</button></div><div class="table-wrap"><table><thead><tr><th>姓名</th><th>职务</th><th>决策角色</th><th>邮箱</th><th>WhatsApp</th><th>操作</th></tr></thead><tbody>${body}</tbody></table></div><div class="table-foot"><span>—</span></div>`;
}
function customerContractsHtml(customerName){
  const rows=getCustomerContractRows(customerName);
  const summary=getCustomerContractSummary(customerName);
  const canWrite=currentRole!=="访客"&&currentRole!=="协同人";
  const stats=`<div class="summary-list" style="margin-bottom:14px">${kv("累计合同数",summary.count+" 份")}${kv("累计合同金额",summary.totalAmount)}${kv("最近签约时间",summary.latestSignDate)}${kv("最近签约合同",summary.latestContractId!=="—"?`<strong>${summary.latestContractId}</strong>`:"—")}</div>`;
  const body=rows.length?rows.map((c,i)=>`<tr class="row-clickable" onclick="openCustomerContractDrawer(${datasets.contracts.indexOf(c)})">
    <td><strong>${c.id}</strong></td>
    <td><strong>${c.site||"—"}</strong></td>
    <td><strong style="font-variant-numeric:tabular-nums">${c.amount}</strong></td>
    <td>${c.date}</td>
    <td>${contractStateTag(c.state,c)}</td>
    <td class="no-row-click" onclick="event.stopPropagation()">${renderRowActions([
      {label:"详情",onclick:`openCustomerContractDrawer(${datasets.contracts.indexOf(c)})`}
    ],`drawer-contract-${i}`)}</td>
  </tr>`).join(""):`<tr><td colspan="6"><div class="empty">暂无合作合同记录</div></td></tr>`;
  return `${stats}${canWrite?`<div class="toolbar-actions" style="margin-bottom:10px"><button class="btn small" onclick="openModal('contractImport')">导入合同</button><button class="btn small primary" onclick="openModal('contract')">新增合同</button></div>`:""}<div class="table-wrap"><table><thead><tr><th>合同编号</th><th>合同名称</th><th>合同金额</th><th>签约时间</th><th>合同状态</th><th>操作</th></tr></thead><tbody>${body}</tbody></table></div><div class="table-foot"><span>—</span></div>`;
}
function fieldName(k){
  const names={id:"编号",inquiryTime:"询盘时间",site:"站点",source:"采集方式",channel:"来源渠道",name:"客户名称",contact:"联系方式",country:"国家",intent:"产品意向",score:"潜质",stage:"阶段",owner:"负责人",age:"进入时长",status:"状态",customer:"客户名称",amount:"金额",date:"日期",seller:"业务员",role:"职务",account:"账号",sites:"站点范围",login:"最后登录",domain:"域名",operator:"操作人",lead:"线索编号",task:"任务类型",deadline:"截止时间",overdue:"超期状态",priority:"优先级",next:"下次跟进",method:"方式",time:"时间",summary:"沟通内容",phone:"手机号",preview:"最近消息",unread:"未读数",last:"最近联系",box:"邮箱文件夹",mailbox:"邮箱账号",from:"发件人",to:"收件人",subject:"主题",dept:"归属部门",collab:"协同人",contacts:"联系人",contracts:"合同",lock:"归属",customers:"客户数",leads:"线索数",conversion:"转化率",state:"状态",decision:"决策角色",contactRole:"联系角色",aiRole:"AI识别",email:"邮箱",whatsapp:"WhatsApp",latestDeal:"最近成交时间",tags:"标签",collection:"采集方式",keywords:"关键词摘要",origin:"原始沟通",sync:"同步来源",launchDate:"站点上线时间",frequency:"拉取频率",lastPull:"最近拉取",endpoint:"Endpoint",apiStatus:"接口状态",lifecycle:"生命周期",flowName:"流程方案",updated:"最近更新",uv:"UV",dealCustomers:"成交客户",pendingCustomers:"待跟进客户",firstResponse:"平均首响",validRate:"有效询盘率",contractCount:"合同数",avgDeal:"客单价",node:"转化节点",customerId:"客户编号",result:"结果",target:"目标对象",scheme:"转化方案",contract:"关联合同",path:"转化路径",invalidType:"异常类型",invalidReason:"异常原因",processStatus:"处理状态",processedTime:"处理时间",processedBy:"处理人",route:"入池路径",capture:"标记来源",sourceLead:"来源线索",customerTags:"客户标签",industry:"行业",feedback:"客户反馈",nextPlan:"下次计划",code:"标签编码",category:"标签分类",mode:"打标方式",count:"打标数",level:"等级",rule:"规则条件",created:"创建时间",lastOp:"最近操作",type:"类型",userCount:"用户数",preset:"预置",scope:"数据范围",desc:"描述",menus:"菜单组数",auth:"认证方式",leadRule:"入池规则",action:"动作",content:"内容",ip:"IP地址",module:"模块",probability:"成交概率",expectedClose:"预计成交",product:"产品",website:"官网"};
  return names[k]||k;
}
function closeDrawer(e){
  if(!e || e.target.id==="drawerMask"){
    document.getElementById("drawerMask").classList.remove("open");
    document.querySelector("#drawerMask .drawer")?.classList.remove("drawer-wide");
    window._drawerLeadIdx = null;
    window._contractDrawerCustomerView = false;
  }
}
function getAssignModalContext(){
  const customerPages=["customer-profile","customer-tag"];
  const isCustomerCtx=customerPages.includes(currentPage)||customerSelected.size>0;
  if(isCustomerCtx){
    const rows=getCustomerRows();
    const idxs=customerSelected.size?[...customerSelected]:(focusedCustomerIdx!=null?[focusedCustomerIdx]:[]);
    const objects=idxs.map(i=>rows[i]).filter(Boolean);
    return{objectType:"customer",objects,count:objects.length||1,primary:objects[0]||null,isBatch:objects.length>1};
  }
  let objects=[];
  if(leadPoolSelected.size){
    const rows=getLeadPoolRows();
    objects=[...leadPoolSelected].map(i=>rows[i]).filter(Boolean);
  }else if(myLeadSelected.size){
    const rows=getMyLeadRows();
    objects=[...myLeadSelected].map(i=>rows[i]).filter(Boolean);
  }else if(window._drawerLeadIdx!=null){
    objects=[datasets.leads[window._drawerLeadIdx]].filter(Boolean);
  }
  if(!objects.length){
    const rows=currentPage==="lead-all"?getLeadPoolRows():getMyLeadRows();
    if(rows[0]) objects=[rows[0]];
  }
  return{objectType:"lead",objects,count:objects.length||1,primary:objects[0]||null,isBatch:objects.length>1};
}
function renderCustomerAssignModalContent(ctx){
  const primary=ctx.primary;
  return `<div class="form-grid">
    ${primary?`<div class="assign-target-summary span-2"><div class="summary-list">${kv("客户编号",primary.id||"—")}${kv("客户名称",primary.name||"—")}${kv("当前负责人",primary.owner||"—")}${kv("站点",primary.site||"—")}</div></div>`:""}
    <div class="field span-2" data-field="assignOwner"><label>负责人 <span style="color:var(--danger)">*</span></label><select><option ${primary&&primary.owner==="张明远"?"selected":""}>张明远</option><option ${primary&&primary.owner==="李晓燕"?"selected":""}>李晓燕</option><option ${primary&&primary.owner==="王芳"?"selected":""}>王芳</option></select></div>
    <div class="field span-2" data-field="assignNote"><label>转移备注</label><textarea rows="3" placeholder="记录转移原因（可选）"></textarea></div>
  </div>`;
}
function renderLeadAssignModalContent(ctx){
  const primary=ctx.primary;
  const defaultOwner=currentRole==="外贸业务员"?"张明远":(primary?.owner&&primary.owner!=="-"&&primary.owner!=="—"?primary.owner:"张明远");
  return `<div class="form-grid">
    ${primary?`<div class="assign-target-summary span-2"><div class="summary-list">${kv("线索编号",primary.id||"—")}${kv("客户名称",primary.name||"—")}${kv("分配状态",resolvePoolDisplayStatus(primary))}${kv("站点",primary.site||"—")}</div>${primary.id?`<div class="assign-target-tags">${leadTagsCellHtml(primary.id)}</div>`:""}</div>`:""}
    <div class="field span-2" data-field="assignOwner"><label>负责人 <span style="color:var(--danger)">*</span></label><select><option ${defaultOwner==="张明远"?"selected":""}>张明远</option><option ${defaultOwner==="李晓燕"?"selected":""}>李晓燕</option><option ${defaultOwner==="王芳"?"selected":""}>王芳</option></select></div>
    <div class="field span-2" data-field="assignNote"><label>分配备注</label><textarea rows="3" placeholder="记录分配原因（可选）"></textarea></div>
  </div>`;
}
function renderAssignModalContent(){
  const ctx=getAssignModalContext();
  if(ctx.objectType==="customer") return renderCustomerAssignModalContent(ctx);
  return renderLeadAssignModalContent(ctx);
}
function toggleAssignTagCard(method){
  const card=document.getElementById("assignTagCard");
  if(card) card.hidden=true;
}
function openModal(type){
  const aliases={siteManagement:"site",siteOwner:"siteOwnerAuth",siteStat:"siteStatExport",contractList:"contract",contractCustomer:"contract",leadConverted:"filter",tags:"tag",roles:"roles",channels:"channels",communicationConfig:"email",logs:"filter"};
  type = aliases[type] || type;
  window._currentModalType = type;
  window._formSimulateFail = false;
  const titles={lead:"新建线索",customer:"新建客户",contact:"新增联系人",contract:"新增合同",contractEditAmount:"编辑合同金额",contractExport:"导出合同台账",contractImport:"导入合同",emailExport:"导出邮件",emailSync:"同步邮件",commAccountTest:"测试账号连接",analysisExport:"导出分析报表",userExport:"导出用户",userFreeze:"账号冻结/启用",rolePerm:"配置角色权限",channelExport:"导出渠道配置",channelPull:"手动拉取渠道",logExport:"导出审计日志",follow:"新增跟进",site:"新增站点",siteFlow:"流程中心配置",siteImport:"导入站点",siteFilter:"高级筛选视图",siteOwnerAuth:"站点负责人配置",siteOwnerBatch:"批量调整负责人",siteOwnerPreview:"权限配置",siteStatMonth:"切换统计月份",siteStatExport:"导出站点报表",leadPoolImport:"导入线索",leadPoolExport:"导出公海池",leadTaskExport:"导出跟进任务",leadConvertedExport:"导出转化记录",leadInvalidExport:"导出异常线索",leadInvalidProcess:"异常线索处理",leadMarkAbnormal:"标记异常线索",leadRestoreAbnormal:"取消异常标记",leadTag:"添加线索标签",customerExport:"导出客户档案",contactExport:"导出联系人",tagExport:"导出标签",followExport:"导出跟进日志",assign:"线索/客户分配",auth:"负责人授权",user:"新增用户",import:"导入数据",filter:"高级筛选",edit:"编辑记录",tag:"标签配置",roles:"角色配置",channels:"渠道配置",email:"邮箱设置",compose:"写邮件",reply:"回复邮件",whatsappConfig:"WhatsApp 账号配置",whatsappMessage:"新建 WhatsApp 会话",permMatrix:"角色权限矩阵",menuMatrix:"角色菜单矩阵",pageMatrix:"页面访问矩阵"};
  document.getElementById("modalTitle").textContent = type==="assign"
    ? (getAssignModalContext().objectType==="customer"?"客户转移":"线索分配与转客户")
    : type==="user"
    ? (userEditIdx != null ? "编辑用户" : "新增用户")
    : type==="menu"
    ? (menuEditIdx != null ? "编辑菜单" : "新增菜单")
    : type==="tagCustomerList"
    ? `使用标签的客户 · ${tagUsageContext?.tagName||""}`
    : type==="tagLeadList"
    ? `使用标签的线索 · ${tagUsageContext?.tagName||""}`
    : (titles[type] || "配置");
  document.getElementById("modalBody").innerHTML = modalContent(type);
  document.querySelector("#modalMask .modal")?.classList.toggle("modal-wide",type==="assign"||type==="tagCustomerList"||type==="tagLeadList");
  if(type==="assign"){
    const method=document.querySelector('#modalBody [data-field="assignMethod"] select')?.value;
    toggleAssignTagCard(method||"");
  }
  document.getElementById("modalFoot").innerHTML = ["permMatrix","menuMatrix","pageMatrix","tagCustomerList","tagLeadList"].includes(type)
    ? `<button class="btn primary" onclick="closeModal()">关闭</button>`
    : ["compose","reply"].includes(type)
    ? `<button class="btn" onclick="closeModal()">取消</button><button class="btn" onclick="saveDraft()">保存草稿</button><button class="btn primary" onclick="sendEmail()">发送邮件</button>`
    : type==="whatsappMessage"
    ? `<button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="sendWhatsapp()">发送消息</button>`
    : type==="leadMarkAbnormal"
    ? `<button class="btn" onclick="closeModal()">取消</button><button class="btn primary danger" onclick="submitForm()">确认标记</button>`
    : type==="leadRestoreAbnormal"
    ? `<button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="submitForm()">确认恢复</button>`
    : type==="assign"
    ? `<button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="submitForm()">${getAssignModalContext().objectType==="customer"?"确认转移":"确认分配"}</button>`
    : `<button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="submitForm()">保存</button>`;
  document.getElementById("modalMask").classList.add("open");
}
function modalContent(type){
  if(type==="permMatrix") return `<p style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.7">角色权限参考 · 各角色登录后自动获得对应菜单、按钮与数据范围权限。</p>
    <div class="table-wrap"><table class="perm-matrix-table"><thead><tr><th>功能</th><th>管理员</th><th>运营</th><th>协同人</th><th>业务员</th><th>访客</th></tr></thead><tbody>
      ${permMatrixRows.map(r=>`<tr><td>${r[0]}</td>${r[1].map(v=>`<td class="${v.startsWith("√")?"ok":v.includes("只读")?"ro":"no"}">${v}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div>`;
  if(type==="menuMatrix") return `<p style="font-size:12px;color:var(--muted);margin-bottom:12px">各角色可见菜单（左侧导航将按此过滤）</p>
    ${ROLES.map(role=>`<div class="perm-role-card" style="margin-bottom:10px"><div class="perm-role-head"><span>${role}</span><span class="tag cyan">${getAccessiblePages(role).length} 项</span></div><div class="perm-role-body"><div class="perm-tags">${getAccessiblePages(role).map(id=>`<span class="perm-tag">${getRoleMenuLabel(id, pageMeta[id]?.title || id, role)}</span>`).join("")}</div><div style="margin-top:8px;color:var(--soft)">数据范围：${roleScopes[role].scope}</div></div></div>`).join("")}`;
  if(type==="pageMatrix") return `<p style="font-size:12px;color:var(--muted);margin-bottom:10px">页面访问与编辑模式：full=可编辑 · read=只读 · supervise=只读+监督 · none=不可访问</p>
    <div class="table-wrap"><table class="perm-matrix-table"><thead><tr><th>页面</th>${ROLES.map(r=>`<th>${r.replace("外贸业务员","业务员").replace("运营专员","运营")}</th>`).join("")}</tr></thead><tbody>
      ${Object.keys(pageMeta).concat(["workbench"]).map(pid=>{
        const title = pid==="workbench"?"首页看板":pageMeta[pid]?.title||pid;
        return `<tr><td>${title}</td>${ROLES.map(r=>{const m=getPageMode(pid,r);return `<td class="${m==="none"?"no":m==="read"||m==="supervise"?"ro":"ok"}">${pageModeLabel(m)}</td>`;}).join("")}</tr>`;
      }).join("")}
    </tbody></table></div>`;
  if(type==="lead") return renderLeadFormHtml(null);
  if(type==="customer") return `<div class="form-grid">
    <div class="field" data-field="name"><label>客户名称 <span style="color:var(--danger)">*</span></label><input placeholder="客户公司名称"><div class="form-feedback"></div></div>
    <div class="field" data-field="site"><label>所属站点 <span style="color:var(--danger)">*</span></label><select>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select><div class="form-feedback"></div></div>
    <div class="field"><label>国家/地区</label><input placeholder="国家或地区"></div>
    <div class="field"><label>行业</label><input placeholder="如 贸易、家居、服装"></div>
    <div class="field"><label>官网</label><input placeholder="www.example.com"></div>
    <div class="field"><label>联系方式</label><input placeholder="电话 / 邮箱"></div>
    <div class="field"><label>来源渠道</label><select><option>官网询盘</option><option>自然询盘</option><option>WhatsApp</option><option>邮件</option><option>展会</option><option>客户转介绍</option></select></div>
    <div class="field"><label>负责人</label><select><option>张明远</option><option>李晓燕</option><option>王芳</option></select></div>
    <div class="field"><label>客户状态</label><select>${CUSTOMER_STATUSES.map(s=>`<option>${s}</option>`).join("")}</select></div>
    <div class="field span-2"><label>客户标签</label><input placeholder="选择客户等级、产品偏好、区域市场等标签"></div>
    <div class="field span-2"><label>客户备注</label><textarea rows="3" placeholder="记录客户背景、采购偏好、风险事项"></textarea></div>
  </div>`;
  if(type==="contact") return `<div class="form-grid">
    <div class="field" data-field="customer"><label>所属客户 <span style="color:var(--danger)">*</span></label><input placeholder="搜索客户名称或客户编号"><div class="form-feedback"></div></div>
    <div class="field" data-field="name"><label>联系人姓名 <span style="color:var(--danger)">*</span></label><input placeholder="如 Michael Johnson"><div class="form-feedback"></div></div>
    <div class="field"><label>职位</label><input placeholder="采购经理、Owner、技术负责人"></div>
    <div class="field"><label>联系角色</label><select><option>决策人</option><option>采购负责人</option><option>关键联系人</option><option>执行联系人</option></select></div>
    <div class="field" data-field="email"><label>邮箱</label><input placeholder="name@example.com"><div class="form-feedback"></div></div>
    <div class="field"><label>电话</label><input placeholder="座机或手机号"></div>
    <div class="field"><label>WhatsApp</label><input placeholder="手机号或账号"></div>
    <div class="field span-2"><label>联系偏好</label><textarea rows="3" placeholder="记录沟通语言、时区、偏好渠道和注意事项"></textarea></div>
  </div>`;
  if(type==="follow") return `<div class="form-grid">
    <div class="field" data-field="customer"><label>关联客户/线索 <span style="color:var(--danger)">*</span></label><input placeholder="搜索客户名称、客户编号或线索编号"><div class="form-feedback"></div></div>
    <div class="field"><label>跟进方式</label><select><option>邮件</option><option>WhatsApp</option><option>电话</option><option>微信</option><option>面谈</option></select></div>
    <div class="field"><label>跟进时间</label><input type="datetime-local"></div>
    <div class="field span-2" data-field="summary"><label>跟进内容 <span style="color:var(--danger)">*</span></label><textarea rows="4" placeholder="本次沟通内容、客户回复、我方回复"></textarea><div class="form-feedback"></div></div>
    <div class="field"><label>当前阶段</label><select>${LEAD_BIZ_STAGES.map(s=>`<option>${s}</option>`).join("")}</select></div>
    <div class="field"><label>意向等级</label><select>${LEAD_INTENT_LEVELS.map(s=>`<option>${s}</option>`).join("")}</select></div>
    <div class="field"><label>下次跟进时间</label><input type="date"></div>
    <div class="field span-2"><label>附件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:20px;text-align:center;color:var(--muted);font-size:13px">点击上传附件，支持图片、PDF、报价单</div></div>
  </div>`;
  if(type==="contract") return `<div class="form-grid">
    <div class="field" data-field="id"><label>合同编号 <span style="color:var(--danger)">*</span></label><input placeholder="如 PC-2026-0156"><div class="form-feedback"></div></div>
    <div class="field" data-field="amount"><label>合同金额 <span style="color:var(--danger)">*</span></label><input placeholder="如 $12,800" inputmode="decimal"><div class="form-feedback"></div></div>
    <div class="field" data-field="customer"><label>关联客户 <span style="color:var(--danger)">*</span></label><input placeholder="搜索客户名称/客户编号"><div class="form-feedback"></div></div>
    <div class="field"><label>关联线索</label><input placeholder="可选，未绑定不影响合同有效性"></div>
    <div class="field"><label>签约日期</label><input type="date"></div>
    <div class="field"><label>最近成交时间</label><input type="datetime-local"></div>
    <div class="field"><label>合同状态</label><select><option selected>生效中</option><option>已完成</option><option>已终止</option></select></div>
    <div class="field"><label>负责人</label><select><option>张明远</option><option>李晓燕</option><option>王芳</option></select></div>
    <div class="field"><label>录入方式</label><input value="人工录入（已签署合同）" readonly></div>
    <div class="field"><label>附件</label><input placeholder="PDF/合同附件"></div>
    <div class="field span-2"><label>备注</label><textarea rows="3" placeholder="可选"></textarea></div>
  </div>`;
  if(type==="compose" || type==="reply") return `<div class="form-grid">
    <div class="field"><label>关联客户</label><input placeholder="搜索客户名称" value="Global Trade Co."></div>
    <div class="field"><label>收件人</label><input placeholder="客户邮箱" value="info@globaltrade.com"></div>
    <div class="field"><label>抄送</label><input placeholder="可选"></div>
    <div class="field"><label>发件账号</label><select><option>noreply@sutex.net.cn（运营统一账号）</option><option>zsn@sutex.net.cn</option><option>sales@sutex.net.cn</option></select></div>
    <div class="field span-2"><label>邮件主题</label><input value="Re: Spring 2026 Product Catalog Request"></div>
    ${canUseAiFeature()?`<div class="field span-2"><label>AI 回复建议</label><textarea rows="3">建议先确认 50 pcs 样品单是否接受打样费，再补充 MOQ、交期与运费承担方式，发送前由业务员完成最终确认。</textarea></div>`:`<div class="field span-2"><label>AI 回复建议</label>${aiDisabledPlaceholder("AI 邮件生成","回复建议、内容草拟",true)}</div>`}
    <div class="field span-2"><label>邮件正文</label><textarea rows="10">Dear Mr. Johnson,

Thank you for your interest in our Spring 2026 collection.

Please find attached our latest product catalog and quotation for the wool series.

Key highlights:
- Wool blend series MOQ: 100 pcs
- Cashmere scarves MOQ: 50 pcs
- Sample order can be arranged before bulk production

We look forward to your feedback.

Best regards,
Zhang Mingyuan
Sales Department | Suhao International</textarea></div>
    <div class="field"><label>自动转线索</label><select><option>保持当前关联</option><option>满足规则时自动转线索</option><option>仅人工确认转线索</option></select></div>
    <div class="field"><label>邮件转发</label><select><option>不转发</option><option>转发至业务负责人</option><option>转发至共享收件组</option></select></div>
    <div class="field span-2"><label>附件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:24px;text-align:center;color:var(--muted)">点击上传附件，支持报价单、产品目录、图片、PDF</div></div>
  </div>`;
  if(type==="site") return `<div class="form-grid">
    <div class="field" data-field="name"><label>站点名称 <span style="color:var(--danger)">*</span></label><input placeholder="如 苏豪独立站A"><div class="form-feedback"></div></div>
    <div class="field" data-field="domain"><label>站点域名 <span style="color:var(--danger)">*</span></label><input placeholder="www.example.com"><div class="form-feedback"></div></div>
    <div class="field"><label>站点状态</label><select><option>运营中</option><option>暂停</option><option>已下线</option></select></div>
    <div class="field"><label>生命周期阶段</label><select><option>筹备中</option><option>已上线</option><option selected>运营中</option><option>暂停</option><option>已下线</option></select></div>
    <div class="field"><label>归属部门</label><input placeholder="外贸事业部" value="外贸事业部"></div>
    <div class="field"><label>站点上线时间</label><input type="date"></div>
    <div class="field"><label>数据源系统</label><select><option>未迟建站</option><option>苏豪自有系统</option><option>其他</option></select></div>
    <div class="field"><label>Endpoint</label><input placeholder="api.example.com/leads"></div>
    <div class="field"><label>认证方式</label><select><option>API Key</option><option>OAuth</option><option>Basic Auth</option></select></div>
    <div class="field"><label>拉取频率</label><select><option>每15分钟</option><option selected>每30分钟</option><option>每小时</option><option>暂停拉取</option></select></div>
    <div class="field span-2"><label>渠道接入</label><div class="check-grid"><div class="check-row"><span>网站表单</span><input type="checkbox" checked></div><div class="check-row"><span>邮件</span><input type="checkbox" checked></div><div class="check-row"><span>WhatsApp</span><input type="checkbox" checked></div><div class="check-row"><span>API 拉取</span><input type="checkbox" checked></div></div></div>
    <div class="field span-2"><label>备注</label><textarea rows="2" placeholder="站点说明、接入注意事项"></textarea></div>
  </div>`;
  if(type==="siteFlow"){
    const s = getSiteMgmtRows()[window._siteFlowIndex||0]||{};
    return `<div class="summary-list" style="margin-bottom:14px">${kv("配置站点",s.name||"-")}${kv("当前方案",s.flowName||"-")}</div>
    <div class="form-grid">
      <div class="field"><label>流程方案名称</label><input value="${s.flowName||"自动分配+首响提醒"}"></div>
      <div class="field"><label>方案状态</label><select><option>启用</option><option>停用</option></select></div>
      <div class="field"><label>线索入池规则</label><select><option>接口拉取自动入池</option><option>邮件/WA 待确认入池</option><option>全部人工确认</option></select></div>
      <div class="field"><label>分配规则</label><select><option>按站点主业务员自动分配</option><option>进入公海待分配</option><option>按轮询分配</option><option>人工分配</option></select></div>
      <div class="field"><label>首响提醒</label><select><option>2 小时超期提醒</option><option>4 小时超期提醒</option><option>关闭</option></select></div>
      <div class="field"><label>二次跟进提醒</label><select><option>7 天未跟进提醒</option><option>14 天未跟进提醒</option><option>关闭</option></select></div>
      <div class="field"><label>邮件转线索</label><select><option>AI 识别后待确认</option><option>满足规则自动转线索</option><option>仅人工转线索</option></select></div>
      <div class="field"><label>WhatsApp 转线索</label><select><option>高意向自动转线索</option><option>待确认转线索</option><option>关闭</option></select></div>
      <div class="field"><label>无效线索处理</label><select><option>进入异常线索队列</option><option>直接标记无效</option></select></div>
      <div class="field"><label>暂停站点行为</label><select><option>停止拉取，保留历史</option><option>停止拉取，线索转异常</option></select></div>
      <div class="field span-2"><label>流程说明</label><textarea rows="3" placeholder="描述该站点的线索分配、首响、转客户与异常处理规则">新线索按站点主业务员自动分配；首响超期 2 小时生成待办；邮件与 WhatsApp 高意向进入待确认转线索队列。</textarea></div>
    </div>`;
  }
  if(type==="siteImport") return `<div class="field"><label>导入类型</label><select><option>站点主数据批量导入</option><option>接口配置批量导入</option><option>渠道映射批量导入</option></select></div><div class="field" style="margin-top:12px"><label>模板下载</label><div class="toolbar-actions"><button class="btn small" onclick="toast('已下载站点导入模板')">站点主数据模板</button><button class="btn small" onclick="toast('已下载接口配置模板')">接口配置模板</button></div></div><div class="field" style="margin-top:12px"><label>上传文件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:28px;text-align:center;color:var(--muted)">选择 Excel / CSV 文件<br><span style="font-size:12px">导入后生成成功与失败明细，失败行可下载修正后重导</span></div></div>`;
  if(type==="siteFilter") return `<div class="form-grid"><div class="field"><label>视图名称</label><input placeholder="如 暂停站点+接口异常"></div><div class="field"><label>默认视图</label><select><option>否</option><option>是</option></select></div><div class="field span-2"><label>筛选条件摘要</label><textarea rows="3" placeholder="保存当前高级筛选条件为个人视图">状态=暂停；接口状态=异常；生命周期=暂停</textarea></div><div class="field span-2"><label>共享范围</label><select><option>仅本人</option><option>运营团队</option><option>全部管理员</option></select></div></div>`;
  if(type==="siteOwnerAuth"){
    const idx = window._siteOwnerIndex>=0?window._siteOwnerIndex:0;
    const role = window._siteOwnerRole||"all";
    const s = getSiteOwnerRows()[idx]||{};
    const showOp = role==="all"||role==="运营专员";
    const showCol = role==="all"||role==="协同人";
    const showSel = role==="all"||role==="外贸业务员";
    return `<div class="summary-list" style="margin-bottom:14px">${kv("配置站点",s.name||"-")}${kv("当前生效",s.effectiveFrom||"-")}${role!=="all"?kv("调整角色",role):""}</div>
    <div class="form-grid">
      ${showOp?`<div class="field"><label>运营专员</label><select><option ${s.operators?.[0]==="刘运营"?"selected":""}>刘运营</option><option>赵运营</option><option>— 移除</option></select></div><div class="field"><label>运营专员账号</label><input value="liuyy@sutex.net.cn" placeholder="搜索账号"></div>`:""}
      ${showCol?`<div class="field"><label>协同人</label><select><option ${(s.collabs||[])[0]==="陈协同"?"selected":""}>陈协同</option><option>周协同</option><option ${!(s.collabs||[]).length?"selected":""}>— 不配置</option></select></div><div class="field"><label>协同人账号</label><input value="${(s.collabs||[])[0]==="陈协同"?"chenxt@sutex.net.cn":(s.collabs||[])[0]==="周协同"?"zhuxt@sutex.net.cn":""}" placeholder="搜索账号"></div>`:""}
      ${showSel?`<div class="field"><label>主业务员</label><select><option>张明远</option><option selected>${(s.sellers||[])[0]||"李晓燕"}</option><option>王芳</option></select></div><div class="field"><label>协作业务员</label><select><option>— 无</option><option ${(s.extraSellers||[]).length?"selected":""}>${(s.extraSellers||[])[0]||"李晓燕"}</option><option>张明远</option></select></div>`:""}
      <div class="field"><label>生效时间</label><input type="datetime-local" value="2026-06-22T00:00"></div>
      <div class="field"><label>生效方式</label><select><option>立即生效</option><option>定时生效</option><option>下次登录生效</option></select></div>
      <div class="field span-2"><label>数据范围</label><select><option>站点全部线索/客户（运营）</option><option>本人负责线索/客户（业务员）</option><option>站点全量只读+监督（协同）</option></select></div>
      <div class="field span-2"><label>变更原因</label><textarea rows="3" placeholder="记录负责人调整、轮岗、协同授权或交接原因"></textarea></div>
    </div>`;
  }
  if(type==="siteOwnerBatch") return `<div class="field"><label>已选站点</label><input value="${siteOwnerSelected.size?siteOwnerSelected.size+" 个站点":"请在列表中勾选站点"}" readonly></div><div class="form-grid" style="margin-top:12px">
    <div class="field"><label>调整类型</label><select><option>运营专员</option><option>协同人</option><option>外贸业务员</option><option>全部三类角色</option></select></div>
    <div class="field"><label>目标人员</label><input placeholder="搜索姓名或账号"></div>
    <div class="field"><label>生效时间</label><input type="datetime-local" value="2026-06-22T00:00"></div>
    <div class="field"><label>生效方式</label><select><option>立即生效</option><option>定时生效</option></select></div>
    <div class="field span-2"><label>数据范围（批量统一）</label><select><option>保持各角色默认范围</option><option>站点全量</option><option>本人负责</option></select></div>
    <div class="field span-2"><label>变更原因</label><textarea rows="3" placeholder="批量调整负责人原因，如组织调整、站点合并、人员离职交接"></textarea></div>
  </div>`;
  if(type==="siteOwnerPreview") return permPreviewHtml(siteOwnerPreviewSite);
  if(type==="siteStatMonth") return `<div class="form-grid"><div class="field"><label>统计月份</label><select onchange="siteStatMonth=this.value"><option>2026-06</option><option>2026-05</option><option>2026-04</option><option>2026-Q2</option><option>2026-Q1</option></select></div><div class="field"><label>统计维度</label><select><option>自然月</option><option>季度</option><option>周</option></select></div><div class="field span-2"><label>时间范围</label><input value="2026-06-01 ~ 2026-06-30" readonly></div></div>`;
  if(type==="siteStatExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前站点</option><option>全部可见站点</option><option>业务员明细</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option><option>PDF</option></select></div><div class="field span-2"><label>包含内容</label><div class="check-grid"><div class="check-row"><span>核心指标卡</span><input type="checkbox" checked></div><div class="check-row"><span>转化漏斗</span><input type="checkbox" checked></div><div class="check-row"><span>客户分布</span><input type="checkbox" checked></div><div class="check-row"><span>来源分布</span><input type="checkbox" checked></div><div class="check-row"><span>业务员数据</span><input type="checkbox" checked></div><div class="check-row"><span>月度统计表</span><input type="checkbox" checked></div></div></div></div>`;
  if(type==="leadPoolImport") return `<div class="field"><label>导入类型</label><select><option>线索批量导入</option><option>公海池补录</option></select></div><div class="field" style="margin-top:12px"><label>模板下载</label><div class="toolbar-actions"><button class="btn small" onclick="toast('已下载线索导入模板')">线索模板.xlsx</button></div></div><div class="field" style="margin-top:12px"><label>上传文件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:28px;text-align:center;color:var(--muted)">选择 Excel / CSV<br><span style="font-size:12px">必需列：站点、来源、客户名称、联系方式、国家、产品意向</span></div></div>`;
  if(type==="leadPoolExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选线索</option><option>全部公海池</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>文件命名</label><input value="公海池-20260622.xlsx" readonly></div></div>`;
  if(type==="leadTaskExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选任务</option><option>全部待办任务</option><option>仅超期任务</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>任务编号/类型</span><input type="checkbox" checked></div><div class="check-row"><span>关联线索/客户</span><input type="checkbox" checked></div><div class="check-row"><span>站点/阶段/截止时间</span><input type="checkbox" checked></div><div class="check-row"><span>超期状态/优先级</span><input type="checkbox" checked></div><div class="check-row"><span>负责人/下一步动作</span><input type="checkbox" checked></div><div class="check-row"><span>关联邮件/WhatsApp</span><input type="checkbox" checked></div></div></div><div class="field span-2"><label>文件命名</label><input value="跟进任务-${new Date().toISOString().slice(0,10).replace(/-/g)}.xlsx" readonly></div></div>`;
  if(type==="leadConvertedExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>全部可见记录</option><option>仅转客户节点</option><option>仅合同成交节点</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>线索编号/客户名称</span><input type="checkbox" checked></div><div class="check-row"><span>来源/转化节点</span><input type="checkbox" checked></div><div class="check-row"><span>客户编号/负责人</span><input type="checkbox" checked></div><div class="check-row"><span>转化时间/结果说明</span><input type="checkbox" checked></div><div class="check-row"><span>站点/转化方案</span><input type="checkbox" checked></div><div class="check-row"><span>关联合同</span><input type="checkbox" checked></div></div></div><div class="field span-2"><label>文件命名</label><input value="转化记录-${new Date().toISOString().slice(0,10).replace(/-/g)}.xlsx" readonly></div></div>`;
  if(type==="leadInvalidExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选线索</option><option>全部异常线索</option><option>仅待处理</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>线索编号/站点/来源</span><input type="checkbox" checked></div><div class="check-row"><span>客户名称/异常类型</span><input type="checkbox" checked></div><div class="check-row"><span>状态/阶段/负责人</span><input type="checkbox" checked></div><div class="check-row"><span>异常原因/处理状态</span><input type="checkbox" checked></div><div class="check-row"><span>处理时间/处理人</span><input type="checkbox" checked></div></div></div><div class="field span-2"><label>文件命名</label><input value="异常线索-${new Date().toISOString().slice(0,10).replace(/-/g)}.xlsx" readonly></div></div>`;
  if(type==="leadInvalidProcess") return `<div class="form-grid"><div class="field"><label>处理方式</label><select><option>确认归档</option><option>恢复至公海池</option><option>标记为重复并关闭</option></select></div><div class="field"><label>处理范围</label><select><option>当前选中线索</option><option>当前筛选结果</option></select></div><div class="field span-2"><label>处理说明</label><textarea rows="3" placeholder="记录异常确认原因、重复判定依据或恢复说明"></textarea></div></div>`;
  if(type==="leadTag"){
    const isRemove=leadTagBatchMode==="remove";
    const isBatch=!!leadTagBatchScope;
    const batchCount=leadTagBatchScope==="pool"?leadPoolSelected.size:leadTagBatchScope==="my"?myLeadSelected.size:0;
    const lead=leadTagEditIdx!=null?datasets.leads[leadTagEditIdx]:null;
    const batchRows=isBatch?getSelectedLeadRowsForTag(leadTagBatchScope):[];
    const leadIds=lead? [lead.id]:batchRows.map(r=>r.id);
    const store=lead?ensureLeadTagStore(lead.id):[];
    const active=new Set(store.filter(t=>t.status!=="ignored").map(t=>t.name));
    const presets=datasets.leadTagPresets||[];
    const esc=t=>String(t).replace(/'/g,"\\'");
    if(isRemove){
      const removable=getRemovableLeadTagNames(leadIds);
      return `<div class="summary-list" style="margin-bottom:14px">${isBatch?`${kv("已选线索",batchCount+" 条")}`:lead?`${kv("线索编号",lead.id)}${kv("客户名称",lead.name)}`:`<div class="empty" style="padding:12px">未选择线索</div>`}</div>
      <div class="form-grid"><div class="field span-2"><label>选择要移除的标签</label>
        <div class="lead-tag-filter">${removable.length?removable.map(n=>`<label class="lead-tag-filter-item"><input type="checkbox" name="leadTagRemove" value="${esc(n)}"><span>${n}</span></label>`).join(""):`<span style="font-size:12px;color:var(--soft)">所选线索暂无可移除标签</span>`}</div>
      </div></div>
      <p style="font-size:12px;color:var(--soft);margin-top:8px;line-height:1.7">AI 标签不可编辑或移除；系统预设与自定义标签可从所选线索批量移除。</p>`;
    }
    return `<div class="summary-list" style="margin-bottom:14px">${isBatch?`${kv("已选线索",batchCount+" 条")}`:lead?`${kv("线索编号",lead.id)}${kv("客户名称",lead.name)}`:`<div class="empty" style="padding:12px">未选择线索</div>`}</div>
    <div class="form-grid">
      <div class="field span-2"><label>系统预设标签</label>
        <div class="lead-tag-filter">${presets.length?presets.map(p=>`<label class="lead-tag-filter-item"><input type="checkbox" name="leadTagPreset" value="${p.code}" ${!isBatch&&active.has(p.name)?"checked disabled":""}><span>${p.name}</span><span style="font-size:10px;color:var(--soft)">${p.category}</span></label>`).join(""):`<span style="font-size:12px;color:var(--soft)">暂无系统预设</span>`}</div>
      </div>
      <div class="field span-2" data-field="customTag"><label>自定义标签</label><input placeholder="如 展会客户、重点跟进"><div class="form-feedback"></div></div>
    </div>
    <p style="font-size:12px;color:var(--soft);margin-top:8px;line-height:1.7">在线索列表勾选后批量添加，或单条操作「打标」快速添加；标签为辅助判断信息，详情页仅展示。</p>`;
  }
  if(type==="leadMarkAbnormal"){
    const lead=leadMarkAbnormalIdx!=null?datasets.leads[leadMarkAbnormalIdx]:null;
    return `<div class="summary-list" style="margin-bottom:14px">${lead?`${kv("线索编号",lead.id)}${kv("客户名称",lead.name)}${kv("当前状态",lead.status||"—")}${kv("负责人",lead.owner&&lead.owner!=="-"?lead.owner:"未分配")}`:`<div class="empty" style="padding:12px">未选择线索</div>`}</div>
    <div class="form-grid">
      <div class="field span-2" data-field="reason"><label>异常原因 <span style="color:var(--danger)">*</span></label><select>${LEAD_ABNORMAL_REASONS.map(r=>`<option>${r}</option>`).join("")}</select><div class="form-feedback"></div></div>
      <div class="field span-2" data-field="note"><label>异常说明</label><textarea rows="4" placeholder="补充说明无效联系方式、重复判定依据、客户反馈等"></textarea><div class="form-feedback"></div></div>
    </div>
    <p style="font-size:12px;color:var(--soft);margin-top:8px;line-height:1.7">标记后线索状态将更新为「异常线索」，从正常跟进队列、待跟进统计与销售漏斗中排除；完整处理轨迹将写入生命周期与操作记录。</p>`;
  }
  if(type==="leadRestoreAbnormal"){
    const lead=leadRestoreAbnormalIdx!=null?datasets.leads[leadRestoreAbnormalIdx]:null;
    const snap=lead?.abnormalSnapshot||{status:lead?.prevStatus||"待跟进",stage:lead?.prevStage||"待首响"};
    return `<div class="summary-list" style="margin-bottom:14px">${lead?`${kv("线索编号",lead.id)}${kv("客户名称",lead.name)}${kv("异常类型",lead.invalidType||"—")}${kv("异常原因",lead.invalidReason||"—")}${kv("将恢复为",`${snap.status||"待跟进"} / ${normalizeLeadStageLabel(snap.stage)}`)}`:`<div class="empty" style="padding:12px">未选择线索</div>`}</div>
    <div class="form-grid"><div class="field span-2" data-field="note"><label>恢复说明</label><textarea rows="3" placeholder="说明取消异常标记的原因，如联系方式已核实、重复判定有误等"></textarea></div></div>
    <p style="font-size:12px;color:var(--soft);margin-top:8px;line-height:1.7">取消异常后线索将恢复至标记前的业务状态；曾被标记异常的历史记录仍会保留。</p>`;
  }
  if(type==="customerExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选客户</option><option>全部可见客户</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>客户编号/名称/站点</span><input type="checkbox" checked></div><div class="check-row"><span>等级/负责人/归属</span><input type="checkbox" checked></div><div class="check-row"><span>联系人/合同汇总</span><input type="checkbox" checked></div><div class="check-row"><span>来源线索/标签</span><input type="checkbox" checked></div></div></div></div>`;
  if(type==="contactExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选联系人</option><option>全部可见联系人</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div></div>`;
  if(type==="tagExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>全部标签</option><option>仅启用标签</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div></div>`;
  if(type==="followExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>全部可见记录</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div></div>`;
  if(type==="contractExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选合同</option><option>全部可见合同</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>合同编号/名称/客户</span><input type="checkbox" checked></div><div class="check-row"><span>金额/签约日期/成交时间</span><input type="checkbox" checked></div><div class="check-row"><span>关联线索/负责人/合同状态</span><input type="checkbox" checked></div><div class="check-row"><span>附件/备注</span><input type="checkbox" checked></div></div></div><div class="field span-2"><label>文件命名</label><input value="合同台账-${new Date().toISOString().slice(0,10).replace(/-/g)}.xlsx" readonly></div></div>`;
  if(type==="contractImport") return `<div class="form-grid"><div class="field"><label>录入类型</label><select><option selected>批量录入合同</option><option>补录未关联合同</option></select></div><div class="field"><label>模板下载</label><div class="toolbar-actions"><button class="btn small" onclick="toast('已下载合同录入模板')">合同模板.xlsx</button></div></div><div class="field span-2"><label>上传文件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:28px;text-align:center;color:var(--muted)">选择 Excel / CSV 批量人工录入<br><span style="font-size:12px">必需列：合同编号、客户名称、金额、签约日期、关联线索</span></div></div></div>`;
  if(type==="contractEditAmount") return `<div class="form-grid"><div class="field"><label>合同编号</label><input value="PC-2026-0148" readonly></div><div class="field"><label>当前金额</label><input value="$28,500" readonly></div><div class="field" data-field="amount"><label>调整后金额 <span style="color:var(--danger)">*</span></label><input placeholder="如 $29,200" inputmode="decimal"><div class="form-feedback"></div></div><div class="field"><label>币种</label><select><option>USD</option><option>EUR</option><option>CNY</option></select></div><div class="field span-2"><label>调整原因</label><textarea rows="3" placeholder="记录金额变更原因或审批说明"></textarea></div></div>`;
  if(type==="emailExport"){ ensureActiveMailAccount(); const acct=getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId); MAIL_API.request("exportMail",{accountId:currentMailAccountId}); return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选邮件</option><option>收件箱全部</option><option>发件箱全部</option><option>草稿箱全部</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>EML 打包</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>时间/发件人/收件人</span><input type="checkbox" checked></div><div class="check-row"><span>客户/主题/摘要</span><input type="checkbox" checked></div><div class="check-row"><span>AI 意图/转化状态</span><input type="checkbox" checked></div><div class="check-row"><span>关联线索/负责人</span><input type="checkbox" checked></div></div></div></div><div class="summary-list" style="margin-top:12px">${kv("当前邮箱",acct?.account||"—")}${kv("当前账号收件",getAccountInboxRows().length+" 封")}${kv("当前账号发件",getAccountSentRows().length+" 封")}${kv("未读",getMailAccountUnreadCount(currentMailAccountId)+" 封")}</div>`; }
  if(type==="emailSync"){ ensureActiveMailAccount(); MAIL_API.request("syncMail",{accountId:currentMailAccountId}); return `<div class="form-grid"><div class="field"><label>同步邮箱</label><select><option>${getLoggedInMailAccounts().find(a=>a.id===currentMailAccountId)?.account||"当前账号"}</option><option>全部已绑定邮箱</option><option>zsn@sutex.net.cn</option><option>sales@sutex.net.cn</option><option>noreply@sutex.net.cn</option></select></div><div class="field"><label>同步范围</label><select><option>增量同步（推荐）</option><option>最近 7 天</option><option>全量重拉</option></select></div></div>`; }
  if(type==="commAccountTest") return `<div class="form-grid"><div class="field"><label>测试账号</label><select>${getCommAccountRows().map(a=>`<option>${a.name} (${a.account})</option>`).join("")}</select></div><div class="field"><label>测试项</label><select><option>连接 + 认证</option><option>收件测试</option><option>发件测试</option><option>WhatsApp Webhook</option></select></div></div>`;
  if(type==="analysisExport") return `<div class="form-grid"><div class="field"><label>报表类型</label><select><option ${currentPage==="lead-analysis"?"selected":""}>线索分析</option><option ${currentPage==="funnel-analysis"?"selected":""}>转化漏斗</option><option ${currentPage==="performance-analysis"?"selected":""}>绩效分析</option><option>综合分析包</option></select></div><div class="field"><label>统计维度</label><select><option>${analysisPeriod}</option><option>本季度</option><option>本周</option><option>自定义</option></select></div><div class="field"><label>站点范围</label><select>${getAnalysisScope().map(s=>`<option ${s===getAnalysisStat().site?"selected":""}>${s}</option>`).join("")}</select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>PDF</option><option>CSV</option></select></div><div class="field span-2"><label>包含内容</label><div class="check-grid"><div class="check-row"><span>指标卡</span><input type="checkbox" checked></div><div class="check-row"><span>漏斗/趋势图</span><input type="checkbox" checked></div><div class="check-row"><span>明细表格</span><input type="checkbox" checked></div><div class="check-row"><span>回复质量（管理）</span><input type="checkbox" ${currentRole==="管理员"||currentRole==="协同人"?"checked":""}></div></div></div></div><div class="summary-list" style="margin-top:12px">${kv("数据范围",getAnalysisStat().site+" / "+analysisPeriod)}${kv("权限",currentRole==="访客"?"访客不可导出":"—")}</div>`;
  if(type==="userExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选用户</option><option>全部可见用户</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>系统账号/姓名/角色</span><input type="checkbox" checked></div><div class="check-row"><span>钉钉绑定状态/钉钉账号</span><input type="checkbox" checked></div><div class="check-row"><span>站点范围/部门</span><input type="checkbox" checked></div><div class="check-row"><span>状态/最后登录</span><input type="checkbox" checked></div></div></div></div>`;
  if(type==="userFreeze") return `<div class="form-grid"><div class="field"><label>目标账号</label><input value="visitor@sutex.net.cn" readonly></div><div class="field"><label>操作类型</label><select><option>冻结账号</option><option>启用账号</option></select></div><div class="field span-2"><label>操作原因</label><textarea rows="3" placeholder="记录冻结/启用原因、交接说明"></textarea></div></div>`;
  if(type==="rolePerm"){ const r=(datasets.roles[selectedRoleIdx]||datasets.roles[0]||{}); return `<div class="summary-list" style="margin-bottom:14px">${kv("配置角色",r.name||"-")}${kv("类型",r.preset?"预置（不可删除）":"自定义")}</div><div class="form-grid"><div class="field span-2"><label>菜单权限</label><div class="check-grid">${["工作台","线索中心","客户中心","合同中心","沟通中心","站点中心","数据分析","系统管理"].map((m,i)=>`<div class="check-row"><span>${m}</span><input type="checkbox" ${r.name==="管理员"||i<(r.menus||0)?"checked":""}></div>`).join("")}</div></div><div class="field span-2"><label>按钮权限</label><div class="check-grid">${["查看","新增","编辑","删除","导出","分配","客户转移","授权管理"].map((p,i)=>`<div class="check-row"><span>${p}</span><input type="checkbox" ${r.perms&&Object.values(r.perms)[i]?"checked":i<5?"checked":""}></div>`).join("")}</div></div><div class="field span-2"><label>数据范围</label><textarea rows="2">${r.scope||""}</textarea></div></div>`; }
  if(type==="channelExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>已选渠道</option><option>全部可见渠道</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>JSON</option><option>CSV</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>渠道/类型/站点</span><input type="checkbox" checked></div><div class="check-row"><span>数据源/频率</span><input type="checkbox" checked></div><div class="check-row"><span>Endpoint/认证</span><input type="checkbox" checked></div><div class="check-row"><span>入池规则/最近拉取</span><input type="checkbox" checked></div></div></div></div>`;
  if(type==="channelPull") return `<div class="form-grid"><div class="field"><label>拉取渠道</label><select><option>全部正常渠道</option>${getChannelRows().map(c=>`<option>${c.name}</option>`).join("")}</select></div><div class="field"><label>拉取模式</label><select><option>增量拉取（推荐）</option><option>全量重拉</option><option>仅测试不写库</option></select></div></div>`;
  if(type==="logExport") return `<div class="form-grid"><div class="field"><label>导出范围</label><select><option>当前筛选结果</option><option>近7天</option><option>近30天</option><option>本月</option></select></div><div class="field"><label>导出格式</label><select><option>Excel</option><option>CSV</option><option>PDF</option></select></div><div class="field span-2"><label>包含字段</label><div class="check-grid"><div class="check-row"><span>时间/操作人/模块</span><input type="checkbox" checked></div><div class="check-row"><span>动作/内容/结果</span><input type="checkbox" checked></div><div class="check-row"><span>目标对象/IP</span><input type="checkbox" checked></div></div></div></div>`;
  if(type==="assign") return renderAssignModalContent();
  if(type==="auth") return `<div class="form-grid">
    <div class="field"><label>授权用户</label><input placeholder="搜索用户姓名或账号"></div>
    <div class="field"><label>用户角色</label><select><option>运营专员</option><option>协同人</option><option>外贸业务员</option><option>访客</option></select></div>
    <div class="field span-2"><label>授权站点</label><select><option>天猫苏豪站</option><option>苏豪独立站A</option><option>苏豪独立站B</option><option>全部站点</option></select></div>
    <div class="field"><label>数据范围</label><select><option>站点全部线索/客户</option><option>本人负责线索/客户</option><option>只读看板</option></select></div>
    <div class="field"><label>操作能力</label><select><option>查看</option><option>查看+分配</option><option>查看+编辑+转移</option></select></div>
    <div class="field span-2"><label>授权原因</label><textarea rows="3" placeholder="记录授权、调整负责人或协同监督原因"></textarea></div>
  </div>`;
  if(type==="user") return renderUserFormHtml(userEditIdx);
  if(type==="menu") return renderMenuFormHtml(menuEditIdx);
  if(type==="import") return `<div class="field"><label>导入类型</label><select><option>线索导入</option><option>合同初始化</option><option>邮箱账号导入</option></select></div><div class="field" style="margin-top:12px"><label>上传文件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:28px;text-align:center;color:var(--muted)">选择 Excel / CSV 文件，导入后生成成功与失败明细</div></div>`;
  if(type==="filter") return `<div class="form-grid">
    <div class="field"><label>站点范围</label><select><option>全部可见站点</option>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>时间范围</label><select><option>今日</option><option>本周</option><option>本月</option><option>自定义</option></select></div>
    <div class="field"><label>负责人</label><input placeholder="业务员/运营/协同人"></div>
    <div class="field"><label>来源/状态</label><input placeholder="按当前页面对象筛选"></div>
    <div class="field span-2"><label>保存为视图</label><input placeholder="可选，输入视图名称"></div>
  </div>`;
  if(type==="tagCustomerList"){
    const ctx=tagUsageContext||{};
    return tagUsageListModalHtml("customer",ctx.tagName||"",getCustomersByTag(ctx.tagName||""));
  }
  if(type==="tagLeadList"){
    const ctx=tagUsageContext||{};
    return tagUsageListModalHtml("lead",ctx.tagName||"",getLeadsByTag(ctx.tagName||""));
  }
  if(type==="tag") return `<div class="form-grid">
    <div class="field"><label>标签编码</label><input placeholder="如 TAG-PD-WOOL"></div>
    <div class="field"><label>标签名称</label><input placeholder="如 羊毛系列"></div>
    <div class="field"><label>标签分类</label><select><option>客户等级</option><option>产品偏好</option><option>风险</option><option>区域市场</option></select></div>
    <div class="field"><label>显示颜色</label><select><option>绿色</option><option>蓝色</option><option>红色</option><option>黄色</option><option>灰色</option><option>紫色</option></select></div>
    <div class="field"><label>状态</label><select><option>启用</option><option>停用</option></select></div>
  </div>`;
  if(type==="roles") return `<div class="form-grid">
    <div class="field"><label>角色名称</label><input placeholder="如 运营专员"></div>
    <div class="field"><label>角色状态</label><select><option>启用</option><option>禁用</option></select></div>
    <div class="field span-2"><label>菜单权限</label><textarea rows="3" placeholder="选择可访问的一级/二级菜单"></textarea></div>
    <div class="field span-2"><label>按钮权限</label><textarea rows="3" placeholder="查看、新增、编辑、删除、导出、分配、转移等"></textarea></div>
    <div class="field span-2"><label>角色说明</label><textarea rows="2" placeholder="描述角色职责和权限边界"></textarea></div>
  </div>`;
  if(type==="edit"){
    if(currentPage.startsWith("lead-")) return renderLeadFormHtml(getLeadEditTarget());
    if(currentPage.startsWith("customer-")) return modalContent("customer");
    if(currentPage.startsWith("contract-")) return modalContent("contract");
    if(currentPage.startsWith("site-")) return modalContent("site");
    if(currentPage==="follow-record") return modalContent("follow");
    return modalContent("filter");
  }
  if(type==="channels") return `<div class="form-grid">
    <div class="field"><label>渠道名称</label><input placeholder="如 天猫苏豪站-网站表单"></div>
    <div class="field"><label>渠道类型</label><select><option>网站接口</option><option>邮箱</option><option>WhatsApp</option><option>手动导入</option></select></div>
    <div class="field"><label>关联站点</label><select>${datasets.sites.map(s=>`<option>${s.name}</option>`).join("")}</select></div>
    <div class="field"><label>拉取频率</label><select><option>每15分钟</option><option>每30分钟</option><option>实时推送</option><option>手动</option></select></div>
    <div class="field span-2"><label>接口/账号配置</label><textarea rows="3" placeholder="Endpoint、认证方式、邮箱服务器或三方API说明"></textarea></div>
  </div>`;
  if(type==="email") return `<div class="form-grid">
    <div class="field"><label>配置类型</label><select><option>IMAP收件</option><option>SMTP发件</option><option>转发规则</option></select></div>
    <div class="field"><label>邮箱账号</label><input placeholder="zsn@sutex.net.cn"></div>
    <div class="field"><label>服务器</label><input placeholder="imap.163.com 或 smtp.163.com"></div>
    <div class="field"><label>端口/加密</label><input placeholder="993 SSL / 465 SSL"></div>
    <div class="field"><label>默认负责人</label><select><option>按站点匹配</option><option>张明远</option><option>李晓燕</option><option>王芳</option></select></div>
    <div class="field"><label>邮件转发规则</label><select><option>转发业务负责人</option><option>转发共享收件组</option><option>不自动转发</option></select></div>
    <div class="field span-2"><label>入库规则</label><textarea rows="3" placeholder="邮件入线索池、客户匹配、附件处理规则"></textarea></div>
  </div>`;
  if(type==="whatsappConfig") return `<div class="form-grid">
    <div class="field"><label>账号名称</label><input value="WhatsApp Business 主账号"></div>
    <div class="field"><label>绑定手机号</label><input value="+86 138****8888"></div>
    <div class="field"><label>接入方式</label><select><option>Meta Cloud API</option><option>第三方聚合 API</option><option>手动导入</option></select></div>
    <div class="field"><label>Webhook 状态</label><select><option>正常</option><option>暂停</option><option>待配置</option></select></div>
    <div class="field"><label>默认负责人</label><select><option>按客户负责人</option><option>张明远</option><option>李晓燕</option><option>王芳</option></select></div>
    <div class="field"><label>消息入库</label><select><option>实时入库</option><option>手动同步</option><option>暂停入库</option></select></div>
    <div class="field"><label>自动建线索规则</label><select><option>满足条件进入待确认队列</option><option>仅生成建议</option><option>关闭</option></select></div>
    <div class="field span-2"><label>会话入库规则</label><textarea rows="3" placeholder="按手机号、客户名、线索编号匹配客户；未匹配时进入待转线索队列"></textarea></div>
  </div>`;
  if(type==="whatsappMessage") return `<div class="form-grid">
    <div class="field"><label>关联客户</label><input value="Global Trade Co."></div>
    <div class="field"><label>WhatsApp 号码</label><input value="+1-555-0181"></div>
    <div class="field"><label>发送账号</label><select><option>WhatsApp Business 主账号</option><option>WhatsApp Business 备用账号</option></select></div>
    <div class="field"><label>消息模板</label><select><option>自由消息</option><option>报价跟进</option><option>样品确认</option><option>合同提醒</option></select></div>
    <div class="field span-2"><label>消息内容</label><textarea rows="5">Sure. We can arrange a sample order of 50 pcs. Please confirm the preferred color and shipping address.</textarea></div>
    <div class="field span-2"><label>附件</label><div style="border:2px dashed var(--line);border-radius:8px;padding:20px;text-align:center;color:var(--muted)">上传报价单、产品图片或样品确认单</div></div>
  </div>`;
  return `<div class="empty">当前模块暂无可配置表单。</div>`;
}
function closeModal(e){ if(!e || e.target.id==="modalMask"){ document.getElementById("modalMask").classList.remove("open"); document.querySelector("#modalMask .modal")?.classList.remove("modal-wide"); window._currentModalType=null; tagUsageContext=null; userEditIdx=null; menuEditIdx=null; leadMarkAbnormalIdx=null; leadRestoreAbnormalIdx=null; leadTagEditIdx=null; leadTagBatchMode=null; leadTagBatchScope=null; } }
function parseContractAmount(raw){
  if(raw==null) return NaN;
  const s=String(raw).trim();
  if(!s) return NaN;
  const n=parseFloat(s.replace(/[^\d.-]/g,""));
  return Number.isFinite(n)?n:NaN;
}
function isValidContractAmount(raw){
  const n=parseContractAmount(raw);
  return Number.isFinite(n)&&n>0;
}
const formValidationRules = {
  lead:[{field:"name",label:"客户名称",required:true},{field:"contact",label:"联系方式",required:true,validate:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)||/^\+?\d[\d\s-]{6,}$/.test(v),msg:"请输入有效邮箱或手机号"}],
  customer:[{field:"name",label:"客户名称",required:true},{field:"site",label:"所属站点",required:true,validate:v=>datasets.sites.some(s=>s.name===v),msg:"请选择有效站点"}],
  contact:[{field:"customer",label:"所属客户",required:true},{field:"name",label:"联系人姓名",required:true},{field:"email",label:"邮箱",validate:v=>!v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),msg:"邮箱格式不正确"}],
  follow:[{field:"customer",label:"关联对象",required:true},{field:"summary",label:"跟进内容",required:true,minLen:4}],
  contract:[{field:"id",label:"合同编号",required:true,validate:v=>/^PC-\d{4}-\d{4}$/.test(v),msg:"格式应为 PC-YYYY-NNNN",unique:v=>!datasets.contracts.some(c=>c.id===v),msgUnique:"合同编号已存在"},{field:"customer",label:"关联客户",required:true},{field:"amount",label:"合同金额",required:true,validate:v=>isValidContractAmount(v),msg:"金额须大于 0，不能为空、零或负数"}],
  contractEditAmount:[{field:"amount",label:"调整后金额",required:true,validate:v=>isValidContractAmount(v),msg:"金额须大于 0，不能为空、零或负数"}],
  user:[{field:"name",label:"姓名",required:true},{field:"account",label:"登录账号",required:true,validate:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),msg:"请输入有效邮箱账号"}],
  site:[{field:"name",label:"站点名称",required:true},{field:"domain",label:"站点域名",required:true}],
  leadMarkAbnormal:[{field:"reason",label:"异常原因",required:true}]
};
function getModalFieldValue(field){
  const el = document.querySelector(`#modalBody [data-field="${field}"] input, #modalBody [data-field="${field}"] select, #modalBody [data-field="${field}"] textarea`);
  if(!el) return "";
  return el.tagName==="SELECT" ? el.value : el.value.trim();
}
function clearFormValidation(){
  document.querySelectorAll("#modalBody .field.invalid").forEach(f=>f.classList.remove("invalid"));
  document.querySelectorAll("#modalBody .form-feedback").forEach(f=>{ f.textContent=""; f.className="form-feedback"; });
}
function validateModalForm(type){
  clearFormValidation();
  const rules = formValidationRules[type];
  if(!rules) return {ok:true};
  let ok = true;
  for(const rule of rules){
    const wrap = document.querySelector(`#modalBody [data-field="${rule.field}"]`);
    const val = getModalFieldValue(rule.field);
    const fb = wrap?.querySelector(".form-feedback");
    if(rule.required && !val){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = `${rule.label}为必填项`; fb.classList.add("err"); }
      continue;
    }
    if(rule.minLen && val.length < rule.minLen){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = `${rule.label}至少 ${rule.minLen} 个字符`; fb.classList.add("err"); }
      continue;
    }
    if(rule.validate && val && !rule.validate(val)){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = rule.msg || `${rule.label}格式不正确`; fb.classList.add("err"); }
      continue;
    }
    if(rule.unique && val && !rule.unique(val)){
      ok = false; wrap?.classList.add("invalid");
      if(fb){ fb.textContent = rule.msgUnique || rule.msg || `${rule.label}已存在`; fb.classList.add("err"); }
    }
  }
  return ok ? {ok:true} : {ok:false, msg:"请修正表单错误后再提交"};
}
function toggleFormSimulateFail(){
  window._formSimulateFail = !window._formSimulateFail;
  toast(window._formSimulateFail ? "已开启模拟提交失败" : "已关闭模拟提交失败");
}
function submitForm(){
  const type = window._currentModalType;
  if(!type || ["permMatrix","menuMatrix","pageMatrix"].includes(type)){ closeModal(); return; }
  if(type==="user"){
    const v = validateUserModalForm();
    if(!v.ok){ toast(v.msg || "请填写必填项并检查格式"); return; }
  }else if(type==="menu"){
    const v = validateMenuModalForm();
    if(!v.ok){ toast(v.msg || "请填写必填项并检查格式"); return; }
  }else{
    const v = validateModalForm(type);
    if(!v.ok){ toast(v.msg || "请填写必填项并检查格式"); return; }
  }
  const btn = document.querySelector("#modalFoot .btn.primary");
  if(btn){ btn.disabled = true; btn.textContent = "提交中…"; }
  setTimeout(()=>{
    if(btn){ btn.disabled = false; btn.textContent = "保存"; }
    if(window._formSimulateFail){
      toast("保存失败：服务端校验未通过，请稍后重试");
      return;
    }
    if(type==="leadMarkAbnormal"){
      const reason=getModalFieldValue("reason");
      const note=getModalFieldValue("note");
      const idx=leadMarkAbnormalIdx;
      if(idx!=null&&markLeadAbnormal(idx,reason,note)){
        closeModal();
        closeDrawer();
        toast(`已标记为异常线索 · ${reason}`);
        nav("lead-invalid");
        renderPage();
      } else toast("标记失败，请重试");
      leadMarkAbnormalIdx=null;
      return;
    }
    if(type==="leadRestoreAbnormal"){
      const note=getModalFieldValue("note");
      const idx=leadRestoreAbnormalIdx;
      if(idx!=null&&restoreLeadFromAbnormal(idx,note)){
        closeModal();
        closeDrawer();
        toast("已取消异常标记，线索已恢复至原业务状态");
        renderPage();
      } else toast("恢复失败，请重试");
      leadRestoreAbnormalIdx=null;
      return;
    }
    if(type==="leadTag"){
      saveLeadTagsFromModal();
      return;
    }
    if(type==="contract"){
      const amount=getModalFieldValue("amount");
      const id=getModalFieldValue("id");
      closeModal();
      toast(`合同 ${id} 已录入 · 状态：生效中 · 金额 ${amount}`);
      return;
    }
    if(type==="contractEditAmount"){
      const amount=getModalFieldValue("amount");
      closeModal();
      toast(`合同金额已更新为 ${amount}`);
      return;
    }
    if(type==="assign"){
      const ctx=getAssignModalContext();
      const owner=getModalFieldValue("assignOwner");
      const note=getModalFieldValue("assignNote");
      closeModal();
      if(ctx.objectType==="customer"){
        toast(`已转移 ${ctx.count} 条客户至 ${owner}${note?" · "+note:""}`);
      }else{
        toast(`已分配 ${ctx.count} 条线索至 ${owner}${note?" · "+note:""}`);
        if(currentPage==="lead-all"&&currentRole==="外贸业务员") nav("lead-pending");
      }
      leadPoolSelected.clear(); myLeadSelected.clear(); customerSelected.clear();
      renderPage();
      return;
    }
    if(type==="menu"){
      const isEdit = menuEditIdx != null;
      if(saveMenuFromModal()){
        closeModal();
        toast(isEdit ? "菜单配置已更新" : "菜单已新增");
        renderPage();
      }
      return;
    }
    if(type==="user"){
      const isEdit = userEditIdx != null;
      if(saveUserFromModal()){
        closeModal();
        toast(isEdit ? "用户信息已更新" : "用户已创建，钉钉绑定关系已保存");
        renderPage();
      }
      return;
    }
    closeModal();
    toast("保存成功");
  }, 600);
}
function saveMock(){ submitForm(); }
function validateForm(type){ return type==="user" ? validateUserModalForm().ok : type==="menu" ? validateMenuModalForm().ok : validateModalForm(type).ok; }
function saveDraft(){ closeModal(); toast("邮件已保存到草稿箱"); }
function sendEmail(){ closeModal(); toast("邮件已发送给客户，并记录到发件箱"); }
function sendWhatsapp(){ closeModal(); toast("WhatsApp 消息已发送，并可沉淀到客户跟进日志"); }
