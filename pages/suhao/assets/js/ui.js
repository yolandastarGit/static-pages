window.CRMUI = {
  $(selector, root = document) {
    if (root !== document) return root.querySelector(selector);
    const activeRoot = window.CRMWorkspace?.activeRoot?.();
    return activeRoot?.querySelector(selector) || document.querySelector(selector);
  },
  $$(selector, root = document) {
    if (root !== document) return Array.from(root.querySelectorAll(selector));
    const activeRoot = window.CRMWorkspace?.activeRoot?.();
    const scoped = activeRoot ? Array.from(activeRoot.querySelectorAll(selector)) : [];
    return scoped.length ? scoped : Array.from(document.querySelectorAll(selector));
  },
  siteName(id) {
    return CRM_MOCK.sites.find(s => s.id === id)?.name || "-";
  },
  userName(id) {
    return CRM_MOCK.users.find(u => u.id === id)?.name || "-";
  },
  customerName(id) {
    return CRM_MOCK.customers.find(c => c.id === id)?.name || "-";
  },
  badge(text) {
    const color = {
      "启用": "green", "停用": "gray", "禁用": "gray", "待分配": "amber", "待跟进": "cyan", "跟进中": "blue", "已转客户": "violet",
      "已成交": "green", "无效": "gray", "丢失": "red",
      "执行中": "blue", "已签约": "green", "已完成": "green", "已终止": "red", "已作废": "gray",
      "开启": "green", "关闭": "gray", "已绑定": "green", "未绑定": "gray"
    }[text] || "gray";
    return `<span class="badge ${color}">${text}</span>`;
  },
  table(columns, rows, empty = "暂无数据") {
    if (!rows.length) return `<div class="card pad muted">${empty}</div>`;
    return `
      <div class="card table-wrap">
        <table>
          <thead><tr>${columns.map(c => `<th>${c.title}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(row => `<tr>${columns.map(c => `<td>${typeof c.render === "function" ? c.render(row) : row[c.key]}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    `;
  },
  drawer(title, body) {
    const mask = this.$("#drawerMask");
    mask.innerHTML = `<div class="drawer"><div class="drawer-head"><div class="modal-title">${title}</div><button class="icon-btn" data-close>×</button></div>${body}</div>`;
    mask.classList.add("show");
    mask.querySelector("[data-close]").addEventListener("click", () => this.closeDrawer());
    mask.addEventListener("click", e => {
      if (e.target === mask) this.closeDrawer();
    }, { once: true });
  },
  closeDrawer() {
    const mask = this.$("#drawerMask");
    mask.classList.remove("show");
    mask.innerHTML = "";
  },
  modal(title, body, onSubmit) {
    const mask = this.$("#modalMask");
    mask.innerHTML = `
      <div class="modal">
        <div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn" data-close>×</button></div>
        <form id="modalForm">${body}<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="btn" data-close>取消</button><button class="btn primary" type="submit">确认</button></div></form>
      </div>
    `;
    mask.classList.add("show");
    mask.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => this.closeModal()));
    mask.querySelector("#modalForm").addEventListener("submit", e => {
      e.preventDefault();
      if (onSubmit) onSubmit(new FormData(e.target));
    });
  },
  closeModal() {
    const mask = this.$("#modalMask");
    mask.classList.remove("show");
    mask.innerHTML = "";
  },
  toast(message) {
    const toast = this.$("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  },
  optionList(items, valueKey = "id", labelKey = "name", selectedValue = "") {
    if (items.length && typeof valueKey === "string" && !(valueKey in items[0])) {
      selectedValue = valueKey;
      valueKey = "id";
      labelKey = "name";
    }
    return items.map(item => `<option value="${item[valueKey]}" ${item[valueKey] === selectedValue ? "selected" : ""}>${item[labelKey]}</option>`).join("");
  },
  createChart(canvasId, type, data, options = {}) {
    const canvas = this.$(`#${canvasId}`);
    if (!canvas) return;
    if (window.Chart) {
      return new Chart(canvas, { type, data, options: { maintainAspectRatio: false, responsive: true, ...options } });
    }
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e8f0ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2563eb";
    ctx.font = "16px sans-serif";
    ctx.fillText("Chart.js 未加载，已显示静态图表", 24, 42);
  },
  formInput(label, name, value = "", type = "text") {
    return `<div class="form-field"><label>${label}</label><input name="${name}" type="${type}" value="${value}"></div>`;
  },
  formSelect(label, name, options, value = "") {
    return `<div class="form-field"><label>${label}</label><select name="${name}">${options.map(o => `<option value="${o.value}" ${o.value === value ? "selected" : ""}>${o.label}</option>`).join("")}</select></div>`;
  },
  formMultiSelect(label, name, options, values = []) {
    const selected = new Set(values);
    return `<div class="form-field"><label>${label}</label><select name="${name}" multiple>${options.map(o => `<option value="${o.value}" ${selected.has(o.value) ? "selected" : ""}>${o.label}</option>`).join("")}</select><small class="muted">按住 Command/Ctrl 可选择多个标签</small></div>`;
  }
};
