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
      "执行中": "blue", "已签约": "green", "已完成": "green", "已终止": "red", "已作废": "gray", "失效": "gray",
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
        <form id="modalForm" class="modal-form">
          <div class="modal-body">${body}</div>
          <div class="modal-foot"><button type="button" class="btn" data-close>取消</button><button class="btn primary" type="submit">确认</button></div>
        </form>
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
  multiSelect(name, options, values = []) {
    const selected = new Set((values || []).map(String));
    const selectedLabels = options.filter(o => selected.has(String(o.value))).map(o => o.label);
    const summary = selectedLabels.length
      ? selectedLabels.map(text => `<span class="multi-select-tag">${this.escapeHtml(text)}</span>`).join("")
      : `<span class="multi-select-placeholder">请选择</span>`;
    const menu = options.map(o => {
      const value = String(o.value ?? "");
      const checked = selected.has(value) ? "checked" : "";
      return `<label class="multi-select-option"><input type="checkbox" name="${name}" value="${this.escapeHtml(value)}" ${checked}><span>${this.escapeHtml(o.label)}</span></label>`;
    }).join("");
    return `
      <div class="multi-select" data-multi-select>
        <button type="button" class="multi-select-trigger" data-multi-select-trigger aria-expanded="false">
          <span class="multi-select-summary">${summary}</span>
          <span class="multi-select-arrow">⌄</span>
        </button>
        <div class="multi-select-menu" hidden data-multi-select-menu>${menu}</div>
      </div>
    `;
  },
  formMultiSelect(label, name, options, values = []) {
    return `<div class="form-field"><label>${label}</label>${this.multiSelect(name, options, values)}</div>`;
  },
  escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
  refreshMultiSelectSummary(root) {
    const select = root?.closest?.("[data-multi-select]") || root;
    if (!select) return;
    const summary = select.querySelector(".multi-select-summary");
    if (!summary) return;
    const checked = Array.from(select.querySelectorAll('input[type="checkbox"]:checked'));
    if (!checked.length) {
      summary.innerHTML = `<span class="multi-select-placeholder">请选择</span>`;
      return;
    }
    summary.innerHTML = checked.map(input => {
      const label = input.closest("label")?.querySelector("span")?.textContent?.trim() || input.value;
      return `<span class="multi-select-tag">${this.escapeHtml(label)}</span>`;
    }).join("");
  },
  actionMore(items) {
    return `<span class="action-more"><button class="btn action-more-trigger" type="button" data-action-more-trigger>更多 <span>⌄</span></button><div class="action-more-menu" hidden>${items.join("")}</div></span>`;
  }
};

(() => {
  const menuOf = more => more?._actionMoreMenu || more?.querySelector(".action-more-menu");

  const closeActionMore = except => {
    document.querySelectorAll(".action-more").forEach(more => {
      if (more === except) return;
      more.classList.remove("open");
      const menu = menuOf(more);
      if (!menu) return;
      menu.hidden = true;
      if (menu.parentElement !== more) more.appendChild(menu);
    });
  };

  const placeActionMoreMenu = more => {
    const trigger = more.querySelector("[data-action-more-trigger]");
    const menu = menuOf(more);
    if (!trigger || !menu || menu.hidden) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 6;
    const viewportPadding = 8;
    const maxLeft = window.innerWidth - menuRect.width - viewportPadding;
    const left = Math.max(viewportPadding, Math.min(triggerRect.right - menuRect.width, maxLeft));
    const bottomTop = triggerRect.bottom + gap;
    const top = bottomTop + menuRect.height > window.innerHeight - viewportPadding
      ? Math.max(viewportPadding, triggerRect.top - menuRect.height - gap)
      : bottomTop;

    menu.style.setProperty("--action-more-left", `${left}px`);
    menu.style.setProperty("--action-more-top", `${top}px`);
  };

  const closeMultiSelects = except => {
    document.querySelectorAll("[data-multi-select].open").forEach(select => {
      if (select === except) return;
      select.classList.remove("open");
      const trigger = select.querySelector("[data-multi-select-trigger]");
      const menu = select.querySelector("[data-multi-select-menu]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (menu) menu.hidden = true;
    });
  };

  document.addEventListener("click", event => {
    const multiTrigger = event.target.closest("[data-multi-select-trigger]");
    if (multiTrigger) {
      event.preventDefault();
      event.stopPropagation();
      const select = multiTrigger.closest("[data-multi-select]");
      const menu = select?.querySelector("[data-multi-select-menu]");
      if (!select || !menu) return;
      const willOpen = menu.hidden;
      closeMultiSelects(select);
      closeActionMore();
      menu.hidden = !willOpen;
      select.classList.toggle("open", willOpen);
      multiTrigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
      return;
    }

    if (event.target.closest("[data-multi-select-menu]")) {
      // 勾选时保持展开，仅阻止冒泡关闭
      event.stopPropagation();
      return;
    }

    const trigger = event.target.closest("[data-action-more-trigger]");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      const more = trigger.closest(".action-more");
      const menu = menuOf(more);
      if (!more || !menu) return;
      const willOpen = menu.hidden;
      closeActionMore(more);
      closeMultiSelects();
      if (willOpen) {
        more._actionMoreMenu = menu;
        document.body.appendChild(menu);
      }
      menu.hidden = !willOpen;
      more.classList.toggle("open", willOpen);
      if (willOpen) placeActionMoreMenu(more);
      return;
    }

    if (event.target.closest(".action-more-menu")) {
      setTimeout(() => closeActionMore(), 0);
      return;
    }

    if (!event.target.closest(".action-more")) closeActionMore();
    if (!event.target.closest("[data-multi-select]")) closeMultiSelects();
  });

  document.addEventListener("change", event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
    const select = input.closest("[data-multi-select]");
    if (!select) return;
    window.CRMUI.refreshMultiSelectSummary(select);
  });

  window.addEventListener("resize", () => {
    closeActionMore();
    closeMultiSelects();
  });
  window.addEventListener("scroll", () => {
    closeActionMore();
    closeMultiSelects();
  }, true);
})();
