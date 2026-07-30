(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.InvoiceDomain = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STATUS = {
    pending_review: { text: "待审核", color: "orange" },
    issuing: { text: "开票中", color: "blue" },
    invoiced: { text: "已开票", color: "green" },
    rejected: { text: "已驳回", color: "red" },
    withdrawn: { text: "已撤回", color: "gray" },
    returned: { text: "已退回", color: "red" },
    cancelled: { text: "已取消", color: "gray" },
  };

  const TRANSITIONS = {
    pending_review: ["issuing", "rejected", "withdrawn"],
    issuing: ["invoiced", "returned", "cancelled"],
  };

  function statusMeta(status) {
    return STATUS[status] || { text: status, color: "gray" };
  }

  function calculateSummary(orders, applications) {
    const totalCent = orders
      .filter((order) => order.eligible)
      .reduce((sum, order) => sum + order.amountCent, 0);
    const pendingCent = applications
      .filter((application) =>
        ["pending_review", "issuing"].includes(application.state),
      )
      .reduce((sum, application) => sum + application.amountCent, 0);
    const invoicedCent = applications
      .filter((application) => application.state === "invoiced")
      .reduce((sum, application) => sum + application.amountCent, 0);
    return {
      totalCent,
      pendingCent,
      invoicedCent,
      availableCent: Math.max(0, totalCent - pendingCent - invoicedCent),
    };
  }

  function validateApplication(form, selectedOrders) {
    const errors = {};
    if (!selectedOrders.length) errors.orders = "请至少选择一笔可开票订单";
    if (!String(form.title || "").trim()) errors.title = "请填写发票抬头";
    if (
      form.titleType === "company" &&
      !String(form.taxNo || "").trim()
    ) {
      errors.taxNo = "请填写纳税人识别号";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validatePdfFiles(files, maxBytes) {
    const list = Array.from(files || []);
    if (!list.length) {
      return { valid: false, error: "请至少选择一个 PDF 文件" };
    }
    if (
      list.some(
        (file) =>
          file.type !== "application/pdf" &&
          !String(file.name || "").toLowerCase().endsWith(".pdf"),
      )
    ) {
      return { valid: false, error: "仅支持上传 PDF 文件" };
    }
    if (list.some((file) => !file.size)) {
      return { valid: false, error: "不能上传空文件" };
    }
    if (list.some((file) => file.size > maxBytes)) {
      return { valid: false, error: "单个 PDF 文件不能超过 20MB" };
    }
    return { valid: true, error: "" };
  }

  function canTransition(from, to) {
    return (TRANSITIONS[from] || []).includes(to);
  }

  function formatCent(amountCent) {
    return `¥${(amountCent / 100).toFixed(2)}`;
  }

  return {
    statusMeta,
    calculateSummary,
    validateApplication,
    validatePdfFiles,
    canTransition,
    formatCent,
  };
});
