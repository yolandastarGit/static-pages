const rechargeRows = [
  { order: "CJ20260727000186", created: "2026-07-27 09:42:18", paid: "2026-07-27 09:43:02", amount: "¥300.00", quota: "¥300.00", status: "success" },
  { order: "CJ20260726000152", created: "2026-07-26 18:16:45", paid: "2026-07-26 18:18:01", amount: "¥100.00", quota: "¥100.00", status: "success" },
  { order: "CJ20260725000097", created: "2026-07-25 14:05:33", paid: "--", amount: "¥500.00", quota: "--", status: "expired" },
  { order: "CJ20260724000063", created: "2026-07-24 10:22:19", paid: "--", amount: "¥50.00", quota: "--", status: "failed" },
];

const invoiceOrders = [
  { id: 1, order: "CJ20260727000186", paid: "2026-07-27 09:43:02", amountCent: 30000, eligible: true },
  { id: 2, order: "CJ20260726000152", paid: "2026-07-26 18:18:01", amountCent: 10000, eligible: true },
  { id: 3, order: "CJ20260721000018", paid: "2026-07-21 11:26:49", amountCent: 5000, eligible: true },
  { id: 4, order: "CJ20260718000005", paid: "2026-07-18 14:29:43", amountCent: 20000, eligible: true },
  { id: 5, order: "CJ20260712000088", paid: "2026-07-12 10:18:12", amountCent: 50000, eligible: true },
];

const invoiceRows = [
  {
    no: "FP20260727000015", time: "2026-07-27 10:26:18", amountCent: 10000,
    state: "pending_review", titleType: "company", title: "上海示例科技有限公司",
    taxNo: "91310115********2X", orderIds: [2], reason: "", files: [],
  },
  {
    no: "FP20260726000014", time: "2026-07-26 17:45:03", amountCent: 5000,
    state: "issuing", titleType: "personal", title: "示例用户",
    taxNo: "", orderIds: [3], reason: "", files: [],
  },
  {
    no: "FP20260724000012", time: "2026-07-24 16:38:12", amountCent: 50000,
    state: "invoiced", titleType: "company", title: "上海示例科技有限公司",
    taxNo: "91310115********2X", orderIds: [5], reason: "",
    files: ["电子发票-技术服务费-01.pdf", "电子发票-技术服务费-02.pdf"],
  },
  {
    no: "FP20260718000005", time: "2026-07-18 14:29:43", amountCent: 20000,
    state: "rejected", titleType: "company", title: "示例信息技术",
    taxNo: "91310115********9P", orderIds: [4], reason: "发票抬头与税号登记信息不一致，请核对后重新提交。", files: [],
  },
  {
    no: "FP20260717000003", time: "2026-07-17 09:12:44", amountCent: 30000,
    state: "withdrawn", titleType: "personal", title: "示例用户",
    taxNo: "", orderIds: [1], reason: "", files: [],
  },
];

let selectedAmount = 300;
let selectedOrders = new Set([1]);
let applicationSource = null;

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function statusTag(status) {
  const payment = {
    success: ["支付成功", "green"], pending: ["待支付", "blue"],
    failed: ["支付失败", "red"], expired: ["已关闭", "gray"],
    exception: ["支付处理中", "orange"],
  };
  const meta = payment[status]
    ? { text: payment[status][0], color: payment[status][1] }
    : InvoiceDomain.statusMeta(status);
  return `<span class="tag ${meta.color}">${meta.text}</span>`;
}

function formatCent(value) {
  return InvoiceDomain.formatCent(value);
}

function stateFromUrl() {
  return new URLSearchParams(location.search).get("state") || "normal";
}

function stateBlock(state) {
  if (state === "loading") return `<div class="loading-state"><div class="skeleton"><span></span><span></span><span></span><span></span><span></span></div><div>正在加载数据...</div></div>`;
  if (state === "empty") return `<div class="empty-state"><div class="state-icon">${icon("inbox")}</div><b>暂无数据</b><span>当前没有可展示的记录</span></div>`;
  if (state === "error") return `<div class="error-state"><div class="state-icon">${icon("wifi-off")}</div><b>加载失败，请重试</b><span>网络连接异常或服务暂时不可用</span><button class="btn btn-primary" onclick="location.href=location.pathname">重新加载</button></div>`;
  if (state === "forbidden") return `<div class="forbidden-state"><div class="state-icon">${icon("shield-x")}</div><b>暂无权限访问</b><span>请联系管理员确认账户权限</span></div>`;
  return "";
}

function occupiedOrderIds() {
  return new Set(
    invoiceRows
      .filter((row) => ["pending_review", "issuing", "invoiced"].includes(row.state))
      .flatMap((row) => row.orderIds),
  );
}

function eligibleOrders() {
  const occupied = occupiedOrderIds();
  return invoiceOrders.filter((order) => order.eligible && !occupied.has(order.id));
}

function renderRecharge() {
  let content = stateBlock(stateFromUrl());
  if (!content) {
    const summary = InvoiceDomain.calculateSummary(invoiceOrders, invoiceRows);
    const rows = eligibleOrders();
    selectedOrders = new Set([...selectedOrders].filter((id) => rows.some((row) => row.id === id)));
    content = `<div class="wallet-original-layout"><div class="wallet-original-grid">
      <section class="wallet-native wallet-account-card"><div class="wallet-native-head"><div class="wallet-native-title"><span class="wallet-native-icon">${icon("credit-card")}</span><div><b>账户充值</b><span>多种充值方式，安全便捷</span></div></div><button class="btn btn-primary" id="recharge-records">${icon("receipt-text")}账单</button></div>
        <div class="account-overview"><div class="overview-title">账户统计</div><div class="overview-grid"><div><strong class="num">¥177.56</strong><span>${icon("wallet-cards")}当前余额</span></div><div><strong class="num">¥122.06</strong><span>${icon("trending-up")}历史消耗</span></div><div><strong class="num">299210</strong><span>${icon("chart-no-axes-column")}请求次数</span></div></div></div>
        <div class="wallet-native-section recharge-mode-section"><div class="native-section-head"><b>在线充值</b><div class="toolbar-actions"><span class="tag green">微信支付</span><button class="btn btn-small btn-plain" id="open-redeem">${icon("gift")}兑换码充值</button></div></div><div class="native-section-body recharge-mode-body"><div class="amount-grid">${[10, 50, 100, 300, 500].map((n) => `<button class="amount ${n === selectedAmount ? "active" : ""}" data-amount="${n}"><strong>¥${n}</strong><span>获得 ¥${n} 额度</span></button>`).join("")}</div><div class="online-bottom"><div class="field"><label>自定义金额</label><input class="input" id="custom-amount" placeholder="请输入整数金额" inputmode="numeric"><div class="custom-quota" id="custom-quota">获得 ¥${selectedAmount}.00 额度</div></div><button class="btn btn-primary native-pay-btn" id="create-pay">${icon("qr-code")}微信扫码支付</button></div></div></div>
      </section>
      <section class="wallet-native wallet-invite-card"><div class="wallet-native-head"><div class="wallet-native-title"><span class="wallet-native-icon invite-icon">${icon("gift")}</span><div><b>邀请奖励</b><span>邀请好友获得额外奖励</span></div></div></div>
        <div class="account-overview invite-overview"><div class="overview-title">收益统计</div><div class="overview-grid"><div><strong class="num">¥0.00</strong><span>${icon("trending-up")}待使用收益</span></div><div><strong class="num">¥0.00</strong><span>${icon("chart-no-axes-column")}总收益</span></div><div><strong class="num">0</strong><span>${icon("users")}邀请人数</span></div></div></div>
        <div class="invite-link-row"><span>邀请链接</span><input class="input" value="/register?aff=8K3M2P" readonly><button class="btn btn-primary">${icon("copy")}复制</button></div>
        <div class="wallet-native-section reward-section"><div class="native-section-head"><b>奖励说明</b></div><div class="native-section-body"><ul class="reward-list"><li>邀请好友注册，好友充值后可获得相应奖励</li><li>奖励额度可划转到账户余额</li><li>邀请人数越多，获得的奖励越多</li></ul></div></div>
      </section></div>
      <section class="wallet-native invoice-native-card"><div class="wallet-native-head"><div class="wallet-native-title"><span class="wallet-native-icon invoice-icon">${icon("file-text")}</span><div><b>发票管理</b><span>提交开票申请，审核完成后登录平台下载电子发票</span></div></div><button class="btn btn-plain" id="invoice-records">${icon("list")}开票记录</button></div><div class="native-section-body invoice-native-body">
        <div class="invoice-stats"><div><span>可开票金额</span><strong class="num">${formatCent(summary.availableCent)}</strong></div><div><span>申请中金额</span><strong class="num">${formatCent(summary.pendingCent)}</strong></div><div><span>已开票金额</span><strong class="num">${formatCent(summary.invoicedCent)}</strong></div></div>
        <div class="subheading"><span>可开票充值订单</span><small class="muted">仅支持整笔订单，可合并申请</small></div>
        <div class="eligible-list">${rows.length ? rows.map((row) => `<label class="eligible-item"><input type="checkbox" class="check order-check" value="${row.id}" ${selectedOrders.has(row.id) ? "checked" : ""}><span><b class="num">${row.order}</b><small>${row.paid} · 微信支付</small></span><strong class="num">${formatCent(row.amountCent)}</strong></label>`).join("") : `<div class="empty-inline">暂无可开票订单</div>`}</div>
        <div class="split-footer invoice-action"><div class="selected-summary">已选 <b id="selected-count">0</b> 笔<br><strong id="selected-total">¥0.00</strong></div><button class="btn btn-primary" id="apply-invoice">${icon("receipt-text")}申请开票</button></div>
      </div></section></div>`;
  }
  document.querySelector("#app-content").innerHTML = `<section class="wallet-page">${content}</section>`;
  bindCommon();
  updateSelection();
}

function bindCommon() {
  lucide.createIcons();
  document.querySelectorAll("[data-amount]").forEach((button) => {
    button.onclick = () => { selectedAmount = Number(button.dataset.amount); renderRecharge(); };
  });
  document.querySelector("#create-pay")?.addEventListener("click", openPay);
  document.querySelector("#recharge-records")?.addEventListener("click", openRechargeRecords);
  document.querySelector("#invoice-records")?.addEventListener("click", openInvoiceRecords);
  document.querySelector("#apply-invoice")?.addEventListener("click", () => openInvoiceApply());
  document.querySelector("#open-redeem")?.addEventListener("click", openRedeem);
  document.querySelectorAll(".order-check").forEach((checkbox) => {
    checkbox.onchange = () => {
      checkbox.checked ? selectedOrders.add(Number(checkbox.value)) : selectedOrders.delete(Number(checkbox.value));
      updateSelection();
    };
  });
}

function updateSelection() {
  const rows = eligibleOrders().filter((row) => selectedOrders.has(row.id));
  const total = rows.reduce((sum, row) => sum + row.amountCent, 0);
  const count = document.querySelector("#selected-count");
  if (!count) return;
  count.textContent = rows.length;
  document.querySelector("#selected-total").textContent = formatCent(total);
  document.querySelector("#apply-invoice").disabled = !rows.length;
}

function openInvoiceApply(source = null) {
  applicationSource = source;
  if (source) selectedOrders = new Set(source.orderIds.filter((id) => eligibleOrders().some((order) => order.id === id)));
  const rows = eligibleOrders().filter((row) => selectedOrders.has(row.id));
  const total = rows.reduce((sum, row) => sum + row.amountCent, 0);
  const defaultType = source?.titleType || "company";
  document.querySelector("#invoice-form").innerHTML = `
    <div class="section"><div class="section-title">已选充值订单</div><table><thead><tr><th>订单号</th><th>支付时间</th><th>金额</th></tr></thead><tbody>${rows.map((row) => `<tr><td class="num">${row.order}</td><td class="num">${row.paid}</td><td class="num">${formatCent(row.amountCent)}</td></tr>`).join("")}</tbody></table><div class="form-total">申请金额 <strong>${formatCent(total)}</strong></div></div>
    <div class="section"><div class="section-title">发票资料</div><div class="form-stack">
      <div class="field"><label>发票抬头类型 <span class="required">*</span></label><div class="segmented"><button type="button" class="title-type ${defaultType === "company" ? "active" : ""}" data-value="company">企业</button><button type="button" class="title-type ${defaultType === "personal" ? "active" : ""}" data-value="personal">个人</button></div><input type="hidden" id="title-type" value="${defaultType}"></div>
      <div class="field"><label>发票抬头 <span class="required">*</span></label><input class="input" id="invoice-title" maxlength="100" value="${source?.title || ""}" placeholder="请输入发票抬头"><div class="field-error" id="title-error"></div></div>
      <div class="field" id="tax-field"><label>纳税人识别号 <span class="required">*</span></label><input class="input" id="tax-no" maxlength="30" value="${source?.taxNo || ""}" placeholder="请输入纳税人识别号"><div class="field-error" id="tax-error"></div></div>
      <div class="field"><label>发票类型</label><input class="input" value="电子发票" disabled></div>
    </div></div>
    <div class="notice">${icon("info")}提交后进入财务审核；审核通过并完成开票后，可在开票记录中下载 PDF。</div>`;
  document.querySelectorAll(".title-type").forEach((button) => {
    button.onclick = () => {
      document.querySelectorAll(".title-type").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.querySelector("#title-type").value = button.dataset.value;
      document.querySelector("#tax-field").classList.toggle("hidden", button.dataset.value === "personal");
    };
  });
  document.querySelector("#tax-field").classList.toggle("hidden", defaultType === "personal");
  openLayer("invoice-drawer");
  lucide.createIcons();
}

function submitInvoice() {
  const rows = eligibleOrders().filter((row) => selectedOrders.has(row.id));
  const form = {
    titleType: document.querySelector("#title-type").value,
    title: document.querySelector("#invoice-title").value,
    taxNo: document.querySelector("#tax-no").value,
  };
  const validation = InvoiceDomain.validateApplication(form, rows);
  document.querySelector("#title-error").textContent = validation.errors.title || "";
  document.querySelector("#tax-error").textContent = validation.errors.taxNo || "";
  if (!validation.valid) return;
  const application = {
    no: `FP202607300000${invoiceRows.length + 20}`,
    time: "2026-07-30 14:36:20",
    amountCent: rows.reduce((sum, row) => sum + row.amountCent, 0),
    state: "pending_review",
    titleType: form.titleType,
    title: form.title.trim(),
    taxNo: form.titleType === "company" ? form.taxNo.trim() : "",
    orderIds: rows.map((row) => row.id),
    reason: "",
    files: [],
    sourceNo: applicationSource?.no || "",
  };
  invoiceRows.unshift(application);
  selectedOrders.clear();
  applicationSource = null;
  closeLayer("invoice-drawer");
  renderRecharge();
  openInvoiceDetail(application.no);
}

function openInvoiceRecords() {
  document.querySelector("#drawer-title").textContent = "开票记录";
  document.querySelector("#drawer-body").innerHTML = `<div class="invoice-record-filters"><input class="input" placeholder="申请单号"><select class="select"><option>全部状态</option><option>待审核</option><option>开票中</option><option>已开票</option><option>已驳回</option><option>已撤回</option><option>已退回</option><option>已取消</option></select><input class="input" value="2026-07-01 ~ 2026-07-30"><button class="btn btn-plain">查询</button></div><div class="table-wrap"><table><thead><tr><th>申请时间</th><th>申请单号</th><th>发票抬头</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>${invoiceRows.map((row) => `<tr><td class="num">${row.time}</td><td class="num">${row.no}</td><td class="ellipsis">${row.title}</td><td class="num">${formatCent(row.amountCent)}</td><td>${statusTag(row.state)}</td><td><button class="btn btn-small btn-plain invoice-detail" data-no="${row.no}">详情</button></td></tr>`).join("")}</tbody></table></div><div class="pagination"><span>共 ${invoiceRows.length} 条</span><button class="page-btn active">1</button></div>`;
  document.querySelector("#detail-drawer .drawer-foot").innerHTML = `<button class="btn btn-plain" data-close="detail-drawer">关闭</button>`;
  openLayer("detail-drawer");
  document.querySelectorAll(".invoice-detail").forEach((button) => {
    button.onclick = () => openInvoiceDetail(button.dataset.no);
  });
  lucide.createIcons();
}

function openInvoiceDetail(no) {
  const row = invoiceRows.find((item) => item.no === no);
  const orders = invoiceOrders.filter((order) => row.orderIds.includes(order.id));
  document.querySelector("#drawer-title").textContent = "开票申请详情";
  const reason = ["rejected", "returned", "cancelled"].includes(row.state)
    ? `<div class="notice error">${icon("circle-alert")}<div><b>${InvoiceDomain.statusMeta(row.state).text}原因</b><br>${row.reason || "申请资料需要调整"}</div></div>`
    : "";
  const files = row.state === "invoiced"
    ? `<div class="section"><div class="section-title">电子发票</div><div class="file-list">${row.files.map((file, index) => `<div class="file-row">${icon("file-text")}<span>${file}</span><button class="btn btn-small btn-secondary">${icon("download")}下载</button></div>`).join("")}</div></div>`
    : "";
  document.querySelector("#drawer-body").innerHTML = `
    <div class="section"><div class="section-title">申请信息</div><dl class="desc"><dt>申请单号</dt><dd class="num">${row.no}</dd><dt>申请时间</dt><dd>${row.time}</dd><dt>申请状态</dt><dd>${statusTag(row.state)}</dd><dt>申请金额</dt><dd><strong>${formatCent(row.amountCent)}</strong></dd><dt>发票类型</dt><dd>电子发票</dd></dl></div>
    ${reason}
    <div class="section"><div class="section-title">发票资料</div><dl class="desc"><dt>抬头类型</dt><dd>${row.titleType === "company" ? "企业" : "个人"}</dd><dt>发票抬头</dt><dd>${row.title}</dd><dt>纳税人识别号</dt><dd>${row.taxNo || "--"}</dd></dl></div>
    <div class="section"><div class="section-title">关联充值订单</div><table><thead><tr><th>订单号</th><th>支付时间</th><th>金额</th></tr></thead><tbody>${orders.map((order) => `<tr><td>${order.order}</td><td>${order.paid}</td><td>${formatCent(order.amountCent)}</td></tr>`).join("")}</tbody></table></div>
    ${row.state === "pending_review" ? `<div class="notice warning">${icon("clock-3")}申请等待财务审核，可在审核前撤回。</div>` : ""}
    ${row.state === "issuing" ? `<div class="notice">${icon("file-clock")}财务正在处理，请稍后查看开票结果。</div>` : ""}
    ${files}`;
  let actions = `<button class="btn btn-plain" data-close="detail-drawer">关闭</button>`;
  if (row.state === "pending_review") actions += `<button class="btn btn-danger" id="withdraw-invoice">${icon("undo-2")}撤回申请</button>`;
  if (["rejected", "returned"].includes(row.state)) actions += `<button class="btn btn-primary" id="resubmit-invoice">${icon("refresh-cw")}修改后重新申请</button>`;
  document.querySelector("#detail-drawer .drawer-foot").innerHTML = actions;
  document.querySelector("#withdraw-invoice")?.addEventListener("click", () => {
    if (InvoiceDomain.canTransition(row.state, "withdrawn")) row.state = "withdrawn";
    openInvoiceDetail(row.no);
  });
  document.querySelector("#resubmit-invoice")?.addEventListener("click", () => {
    closeLayer("detail-drawer");
    openInvoiceApply(row);
  });
  openLayer("detail-drawer");
  lucide.createIcons();
}

function openPay() {
  document.querySelector("#pay-modal-body").innerHTML = `<div class="pay-summary"><div class="muted">请使用微信扫描二维码支付</div><div class="qr"></div><strong class="num">¥${selectedAmount}.00</strong><div>订单号：<span class="num">CJ20260730000218</span></div></div>`;
  openLayer("pay-modal");
}

function openRechargeRecords() {
  document.querySelector("#recharge-modal-title").textContent = "充值记录";
  document.querySelector("#recharge-modal-body").innerHTML = `<div class="table-wrap"><table><thead><tr><th>创建时间</th><th>订单号</th><th>支付方式</th><th>支付金额</th><th>到账额度</th><th>状态</th><th>支付完成时间</th></tr></thead><tbody>${rechargeRows.map((row) => `<tr><td>${row.created}</td><td>${row.order}</td><td>微信支付</td><td>${row.amount}</td><td>${row.quota}</td><td>${statusTag(row.status)}</td><td>${row.paid}</td></tr>`).join("")}</tbody></table></div>`;
  openLayer("recharge-records-modal");
}

function openRedeem() {
  document.querySelector("#redeem-modal-body").innerHTML = `<div class="field"><label>兑换码</label><input class="input" placeholder="请输入兑换码"></div>`;
  openLayer("redeem-modal");
}

function openLayer(id) {
  document.querySelector(`#${id}`).classList.add("open");
}

function closeLayer(id) {
  document.querySelector(`#${id}`).classList.remove("open");
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-close]");
  if (target) closeLayer(target.dataset.close);
});
document.querySelector("#submit-invoice").onclick = submitInvoice;
document.querySelector("#refresh-pay").onclick = () => {
  document.querySelector("#pay-modal-body").innerHTML = `<div class="empty-state redeem-success"><div class="state-icon">${icon("circle-check")}</div><b>充值成功</b><span>额度已到账</span></div>`;
  lucide.createIcons();
};
renderRecharge();
