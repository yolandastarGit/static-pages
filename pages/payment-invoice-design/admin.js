const adminOrders = [
  { no: "CJ20260727000186", user: "示例用户", uid: 8, amount: "¥300.00", quota: "¥300.00", status: "success", created: "2026-07-27 09:42:18", paid: "2026-07-27 09:43:02", wx: "4200002638202607276849213652" },
  { no: "CJ20260727000173", user: "接口用户", uid: 12, amount: "¥500.00", quota: "--", status: "pending", created: "2026-07-27 09:21:04", paid: "--", wx: "--" },
  { no: "CJ20260727000154", user: "企业用户", uid: 17, amount: "¥1,000.00", quota: "--", status: "exception", created: "2026-07-27 08:46:51", paid: "2026-07-27 08:47:26", wx: "4200002638202607276849211498" },
  { no: "CJ20260726000152", user: "示例用户", uid: 8, amount: "¥100.00", quota: "¥100.00", status: "success", created: "2026-07-26 18:16:45", paid: "2026-07-26 18:18:01", wx: "4200002611202607269748102261" },
];

const adminInvoices = [
  {
    no: "FP20260730000021", user: "示例用户", uid: 8, amountCent: 40000, orderCount: 2,
    status: "pending_review", time: "2026-07-30 10:26:18", updated: "2026-07-30 10:26:18",
    titleType: "company", title: "上海示例科技有限公司", taxNo: "91310115********2X",
    orders: [
      { no: "CJ20260727000186", paid: "2026-07-27 09:43:02", amount: "¥300.00" },
      { no: "CJ20260726000152", paid: "2026-07-26 18:18:01", amount: "¥100.00" },
    ],
    reviewer: "--", reason: "", files: [], logs: ["用户提交开票申请"],
  },
  {
    no: "FP20260729000018", user: "企业用户", uid: 17, amountCent: 100000, orderCount: 1,
    status: "issuing", time: "2026-07-29 16:45:03", updated: "2026-07-30 09:12:40",
    titleType: "company", title: "北京某某信息技术有限公司", taxNo: "91110108********5R",
    orders: [{ no: "CJ20260723000086", paid: "2026-07-23 12:11:38", amount: "¥1,000.00" }],
    reviewer: "财务专员（#26）", reason: "", files: [], logs: ["用户提交开票申请", "财务审核通过"],
  },
  {
    no: "FP20260728000016", user: "示例用户", uid: 8, amountCent: 50000, orderCount: 1,
    status: "invoiced", time: "2026-07-28 14:38:12", updated: "2026-07-29 11:08:32",
    titleType: "personal", title: "示例用户", taxNo: "",
    orders: [{ no: "CJ20260712000088", paid: "2026-07-12 10:18:12", amount: "¥500.00" }],
    reviewer: "财务专员（#26）", reason: "",
    files: ["电子发票-20260729-01.pdf", "电子发票-20260729-02.pdf"],
    logs: ["用户提交开票申请", "财务审核通过", "上传 2 个电子发票 PDF", "申请完成"],
  },
  {
    no: "FP20260727000012", user: "开发用户", uid: 5, amountCent: 20000, orderCount: 1,
    status: "rejected", time: "2026-07-27 11:29:43", updated: "2026-07-27 15:20:08",
    titleType: "company", title: "开发信息技术", taxNo: "91310115********9P",
    orders: [{ no: "CJ20260721000018", paid: "2026-07-21 11:26:49", amount: "¥200.00" }],
    reviewer: "财务专员（#26）", reason: "发票抬头与税号登记信息不一致，请核对后重新提交。",
    files: [], logs: ["用户提交开票申请", "财务驳回申请"],
  },
];

const auditRows = [
  { time: "2026-07-30 10:28:43", no: "FP20260730000021", user: "示例用户（#8）", action: "提交开票申请", before: "--", after: "待审核", result: "成功", ip: "116.***.***.23" },
  { time: "2026-07-30 09:12:40", no: "FP20260729000018", user: "财务专员（#26）", action: "审核通过", before: "待审核", after: "开票中", result: "成功", ip: "116.***.***.18" },
  { time: "2026-07-29 11:08:32", no: "FP20260728000016", user: "财务专员（#26）", action: "上传电子发票", before: "开票中", after: "已开票", result: "成功", ip: "116.***.***.18" },
  { time: "2026-07-27 15:20:08", no: "FP20260727000012", user: "财务专员（#26）", action: "驳回申请", before: "待审核", after: "已驳回", result: "成功", ip: "116.***.***.18" },
];

let pendingAction = null;

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function statusTag(status) {
  const payment = {
    success: ["支付成功", "green"], pending: ["待支付", "blue"],
    failed: ["支付失败", "red"], expired: ["已关闭", "gray"],
    exception: ["支付异常", "orange"],
  };
  const meta = payment[status]
    ? { text: payment[status][0], color: payment[status][1] }
    : InvoiceDomain.statusMeta(status);
  return `<span class="tag ${meta.color}">${meta.text}</span>`;
}

function pageState() {
  return new URLSearchParams(location.search).get("state") || "normal";
}

function stateBlock(state) {
  if (state === "loading") return `<div class="loading-state"><div class="skeleton"><span></span><span></span><span></span><span></span><span></span></div><div>正在加载数据...</div></div>`;
  if (state === "empty") return `<div class="empty-state"><div class="state-icon">${icon("inbox")}</div><b>暂无数据</b><span>当前筛选条件下没有匹配记录</span></div>`;
  if (state === "error") return `<div class="error-state"><div class="state-icon">${icon("server-off")}</div><b>加载失败，请重试</b><span>服务暂时不可用</span><button class="btn btn-primary" onclick="location.href=location.pathname">重新加载</button></div>`;
  if (state === "forbidden") return `<div class="forbidden-state"><div class="state-icon">${icon("shield-x")}</div><b>暂无权限访问</b><span>当前财务账号没有该功能权限</span></div>`;
  return "";
}

function page(title, iconName, body, action = "") {
  return `<section class="page-shell"><div class="page-head"><div class="page-title">${icon(iconName)}${title}</div><div class="page-actions">${action}</div></div>${body}</section>`;
}

function setActive(route) {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });
}

function bindNav() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.onclick = () => navigate(button.dataset.route);
  });
  lucide.createIcons();
}

function pagination(total) {
  return `<div class="pagination"><span>显示第 1 条 - 第 ${total} 条，共 ${total} 条</span><div class="pages"><button class="page-btn" disabled>‹</button><button class="page-btn active">1</button><button class="page-btn" disabled>›</button></div></div>`;
}

function renderInvoices() {
  setActive("invoices");
  let content = stateBlock(pageState());
  if (!content) {
    content = `<div class="filters finance-filters"><input class="input" placeholder="申请单号 / 订单号"><input class="input" placeholder="用户 ID / 用户名 / 发票抬头"><select class="select"><option>全部状态</option><option>待审核</option><option>开票中</option><option>已开票</option><option>已驳回</option><option>已撤回</option><option>已退回</option><option>已取消</option></select><input class="input" value="2026-07-01 ~ 2026-07-30"><div class="toolbar-actions"><button class="btn btn-primary">查询</button><button class="btn btn-plain">重置</button></div></div>
      <div class="table-wrap"><table><thead><tr><th>申请时间</th><th>申请单号</th><th>用户</th><th>发票抬头</th><th>申请金额</th><th>订单数</th><th>状态</th><th>审核人</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${adminInvoices.map((row) => `<tr><td class="num">${row.time}</td><td class="num">${row.no}</td><td>${row.user} <span class="muted">#${row.uid}</span></td><td class="ellipsis">${row.title}</td><td class="num">${InvoiceDomain.formatCent(row.amountCent)}</td><td>${row.orderCount} 笔</td><td>${statusTag(row.status)}</td><td>${row.reviewer}</td><td class="num">${row.updated}</td><td><button class="btn btn-small ${row.status === "pending_review" ? "btn-primary" : "btn-plain"} invoice-detail" data-no="${row.no}">${row.status === "pending_review" ? "审核" : "查看详情"}</button></td></tr>`).join("")}</tbody></table></div>${pagination(adminInvoices.length)}`;
  }
  document.querySelector("#app-content").innerHTML = page("开票申请", "file-check-2", content, `<button class="btn btn-plain">${icon("refresh-cw")}刷新</button>`);
  bindNav();
  document.querySelectorAll(".invoice-detail").forEach((button) => {
    button.onclick = () => openInvoiceDetail(button.dataset.no);
  });
}

function openInvoiceDetail(no) {
  const row = adminInvoices.find((item) => item.no === no);
  document.querySelector("#drawer-title").textContent = row.status === "pending_review" ? "审核开票申请" : "开票申请详情";
  const reason = ["rejected", "returned", "cancelled"].includes(row.status)
    ? `<div class="notice error">${icon("circle-alert")}<div><b>${InvoiceDomain.statusMeta(row.status).text}原因</b><br>${row.reason}</div></div>`
    : "";
  const files = row.files.length
    ? `<div class="section"><div class="section-title">电子发票文件</div><div class="file-list">${row.files.map((file) => `<div class="file-row">${icon("file-text")}<span>${file}</span><button class="btn btn-small btn-secondary">${icon("download")}下载</button></div>`).join("")}</div></div>`
    : "";
  document.querySelector("#drawer-body").innerHTML = `
    <div class="section"><div class="section-title">申请信息</div><dl class="desc"><dt>申请单号</dt><dd class="num">${row.no}</dd><dt>申请状态</dt><dd>${statusTag(row.status)}</dd><dt>申请时间</dt><dd>${row.time}</dd><dt>申请金额</dt><dd><strong>${InvoiceDomain.formatCent(row.amountCent)}</strong></dd><dt>用户</dt><dd>${row.user}（#${row.uid}）</dd></dl></div>
    ${reason}
    <div class="section"><div class="section-title">发票资料</div><dl class="desc"><dt>抬头类型</dt><dd>${row.titleType === "company" ? "企业" : "个人"}</dd><dt>发票抬头</dt><dd>${row.title}</dd><dt>纳税人识别号</dt><dd>${row.taxNo || "--"}</dd><dt>发票类型</dt><dd>电子发票</dd></dl></div>
    <div class="section"><div class="section-title">关联充值订单</div><table><thead><tr><th>订单号</th><th>支付时间</th><th>实付金额</th></tr></thead><tbody>${row.orders.map((order) => `<tr><td>${order.no}</td><td>${order.paid}</td><td>${order.amount}</td></tr>`).join("")}</tbody></table></div>
    ${row.status === "issuing" ? `<div class="notice">${icon("info")}请在外部税务软件完成本申请的全部开票，再上传对应的一个或多个 PDF。</div>` : ""}
    ${files}
    <div class="section"><div class="section-title">处理记录</div><div class="timeline">${row.logs.map((log, index) => `<div><span></span><b>${log}</b><small>${index === row.logs.length - 1 ? row.updated : row.time}</small></div>`).join("")}</div></div>`;

  let actions = `<button class="btn btn-plain" data-close="detail-drawer">关闭</button>`;
  if (row.status === "pending_review") {
    actions += `<button class="btn btn-danger" id="reject-application">${icon("x")}驳回</button><button class="btn btn-primary" id="approve-application">${icon("check")}审核通过</button>`;
  }
  if (row.status === "issuing") {
    actions += `<button class="btn btn-danger" id="cancel-application">取消申请</button><button class="btn btn-plain" id="return-application">退回修改</button><button class="btn btn-primary" id="upload-invoice">${icon("upload-cloud")}上传发票</button>`;
  }
  document.querySelector("#drawer-foot").innerHTML = actions;
  document.querySelector("#approve-application")?.addEventListener("click", () => approveApplication(row));
  document.querySelector("#reject-application")?.addEventListener("click", () => openReasonAction(row, "rejected", "驳回申请", "确认驳回"));
  document.querySelector("#return-application")?.addEventListener("click", () => openReasonAction(row, "returned", "退回修改", "确认退回"));
  document.querySelector("#cancel-application")?.addEventListener("click", () => openReasonAction(row, "cancelled", "取消申请", "确认取消"));
  document.querySelector("#upload-invoice")?.addEventListener("click", () => openUploadAction(row));
  openLayer("detail-drawer");
  lucide.createIcons();
}

function approveApplication(row) {
  if (!InvoiceDomain.canTransition(row.status, "issuing")) return;
  row.status = "issuing";
  row.reviewer = "财务专员（#26）";
  row.updated = "2026-07-30 14:42:06";
  row.logs.push("财务审核通过");
  openInvoiceDetail(row.no);
}

function openReasonAction(row, nextState, title, confirmText) {
  openAction(
    title,
    `<div class="notice warning">${icon("triangle-alert")}该操作将关闭当前申请并释放关联订单的开票金额。用户如需继续开票，必须重新提交新的申请。</div><div class="field" style="margin-top:14px"><label>处理原因 <span class="required">*</span></label><textarea class="textarea" id="action-reason" placeholder="请输入处理原因"></textarea><div class="field-error" id="reason-error"></div></div>`,
    confirmText,
    () => {
      const reason = document.querySelector("#action-reason").value.trim();
      if (!reason) {
        document.querySelector("#reason-error").textContent = "请填写处理原因";
        return false;
      }
      if (!InvoiceDomain.canTransition(row.status, nextState)) return false;
      row.status = nextState;
      row.reason = reason;
      row.updated = "2026-07-30 14:48:20";
      row.logs.push(title);
      closeLayer("detail-drawer");
      renderInvoices();
      return true;
    },
    true,
  );
}

function openUploadAction(row) {
  openAction(
    "上传电子发票",
    `<div class="notice">${icon("info")}请上传在外部税务软件中针对申请 <b>${row.no}</b> 已开具的全部电子发票 PDF。</div>
      <label class="upload invoice-upload" for="invoice-files">${icon("upload-cloud")}<span><b>选择一个或多个 PDF</b><small>仅支持 PDF，单个文件不超过 20MB</small></span></label>
      <input class="hidden" id="invoice-files" type="file" accept=".pdf,application/pdf" multiple>
      <div class="selected-files" id="selected-files">尚未选择文件</div>
      <div class="field-error" id="upload-error"></div>`,
    "确认上传并完成",
    () => {
      const input = document.querySelector("#invoice-files");
      const validation = InvoiceDomain.validatePdfFiles(input.files, 20 * 1024 * 1024);
      document.querySelector("#upload-error").textContent = validation.error;
      if (!validation.valid) return false;
      row.files = Array.from(input.files).map((file) => file.name);
      row.status = "invoiced";
      row.updated = "2026-07-30 15:02:18";
      row.logs.push(`上传 ${row.files.length} 个电子发票 PDF`);
      row.logs.push("申请完成");
      closeLayer("detail-drawer");
      renderInvoices();
      return true;
    },
  );
  document.querySelector("#invoice-files").onchange = (event) => {
    const files = Array.from(event.target.files);
    document.querySelector("#selected-files").innerHTML = files.length
      ? files.map((file) => `<div class="file-chip">${icon("file-text")}${file.name}</div>`).join("")
      : "尚未选择文件";
    lucide.createIcons();
  };
}

function renderOrders() {
  setActive("orders");
  let content = stateBlock(pageState());
  if (!content) {
    content = `<div class="filters"><input class="input" placeholder="平台订单号 / 微信交易号"><input class="input" placeholder="用户 ID / 用户名"><select class="select"><option>全部状态</option><option>待支付</option><option>支付成功</option><option>支付异常</option></select><input class="input" value="2026-07-01 ~ 2026-07-30"><div class="toolbar-actions"><button class="btn btn-primary">查询</button><button class="btn btn-plain">重置</button></div></div><div class="table-wrap"><table><thead><tr><th>创建时间</th><th>平台订单号</th><th>用户</th><th>支付金额</th><th>到账额度</th><th>状态</th><th>支付完成时间</th><th>操作</th></tr></thead><tbody>${adminOrders.map((row) => `<tr><td>${row.created}</td><td>${row.no}</td><td>${row.user} <span class="muted">#${row.uid}</span></td><td>${row.amount}</td><td>${row.quota}</td><td>${statusTag(row.status)}</td><td>${row.paid}</td><td><button class="btn btn-small btn-plain order-detail" data-no="${row.no}">查看详情</button></td></tr>`).join("")}</tbody></table></div>${pagination(adminOrders.length)}`;
  }
  document.querySelector("#app-content").innerHTML = page("充值订单", "receipt", content);
  bindNav();
  document.querySelectorAll(".order-detail").forEach((button) => {
    button.onclick = () => openOrderDetail(button.dataset.no);
  });
}

function openOrderDetail(no) {
  const row = adminOrders.find((item) => item.no === no);
  document.querySelector("#drawer-title").textContent = "充值订单详情";
  document.querySelector("#drawer-body").innerHTML = `<div class="section"><div class="section-title">订单信息</div><dl class="desc"><dt>平台订单号</dt><dd>${row.no}</dd><dt>用户</dt><dd>${row.user}（#${row.uid}）</dd><dt>支付金额</dt><dd>${row.amount}</dd><dt>到账额度</dt><dd>${row.quota}</dd><dt>状态</dt><dd>${statusTag(row.status)}</dd><dt>支付完成时间</dt><dd>${row.paid}</dd></dl></div><div class="section"><div class="section-title">微信支付信息</div><dl class="desc"><dt>微信交易号</dt><dd>${row.wx}</dd><dt>金额校验</dt><dd><span class="tag green">一致</span></dd></dl></div>`;
  document.querySelector("#drawer-foot").innerHTML = `<button class="btn btn-plain" data-close="detail-drawer">关闭</button>`;
  openLayer("detail-drawer");
  lucide.createIcons();
}

function renderAudit() {
  setActive("audit");
  let content = stateBlock(pageState());
  if (!content) {
    content = `<div class="filters"><input class="input" placeholder="申请单号"><input class="input" placeholder="操作人"><select class="select"><option>全部操作</option><option>提交申请</option><option>审核通过</option><option>驳回申请</option><option>上传发票</option></select><input class="input" value="2026-07-01 ~ 2026-07-30"><div class="toolbar-actions"><button class="btn btn-primary">查询</button><button class="btn btn-plain">重置</button></div></div><div class="table-wrap"><table><thead><tr><th>操作时间</th><th>业务类型</th><th>业务单号</th><th>操作人</th><th>操作动作</th><th>操作前状态</th><th>操作后状态</th><th>结果</th><th>IP</th></tr></thead><tbody>${auditRows.map((row) => `<tr><td>${row.time}</td><td><span class="tag purple">开票申请</span></td><td>${row.no}</td><td>${row.user}</td><td>${row.action}</td><td>${row.before}</td><td>${row.after}</td><td><span class="tag green">${row.result}</span></td><td>${row.ip}</td></tr>`).join("")}</tbody></table></div>${pagination(auditRows.length)}`;
  }
  document.querySelector("#app-content").innerHTML = page("操作记录", "scroll-text", content);
  bindNav();
}

function openAction(title, body, confirmText, onConfirm, danger = false) {
  document.querySelector("#action-title").textContent = title;
  document.querySelector("#action-body").innerHTML = body;
  const button = document.querySelector("#action-confirm");
  button.textContent = confirmText;
  button.className = `btn ${danger ? "btn-danger" : "btn-primary"}`;
  pendingAction = onConfirm;
  openLayer("action-modal");
  lucide.createIcons();
}

function openLayer(id) {
  document.querySelector(`#${id}`).classList.add("open");
}

function closeLayer(id) {
  document.querySelector(`#${id}`).classList.remove("open");
}

function navigate(route) {
  ({ invoices: renderInvoices, orders: renderOrders, audit: renderAudit }[route] || renderInvoices)();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-close]");
  if (target) closeLayer(target.dataset.close);
});
document.querySelector("#action-confirm").onclick = () => {
  if (!pendingAction || pendingAction()) {
    closeLayer("action-modal");
    pendingAction = null;
  }
};
pageState() === "normal" ? renderInvoices() : renderOrders();
