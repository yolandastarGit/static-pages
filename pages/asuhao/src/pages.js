import {
  button,
  confirmAction,
  dataTable,
  emptyState,
  h,
  infoGrid,
  metricCard,
  noPermission,
  pageHeader,
  searchPanel,
  section,
  simpleForm,
  tabs,
  tag,
  toolbar
} from "./components.js";
import { customerName, formatCurrency, leadName, siteName, userName } from "./data.js";
import { getAppPathname, navigate, queryParams, withQuery } from "./router.js";
import { canOperate, mutate, openDrawer, openModal, setSelectedRows, state, toast } from "./store.js";
import { loginAs, logout } from "./store.js";

const statusTabs = ["全部", "待跟进", "跟进中", "已成交客户", "丢失"];

const leadStatusMap = {
  待跟进: ["已分配"],
  跟进中: ["跟进中", "高意向"],
  已成交客户: ["已转客户"],
  丢失: ["丢失"]
};

function ownerOptions() {
  return state.data.users.filter((user) => user.roleId === "sales").map((user) => user.name);
}

function siteOptions() {
  return ["全部", ...state.data.sites.map((site) => site.name)];
}

function inputValue(form, name) {
  return form.querySelector(`[name="${name}"]`)?.value?.trim() || "";
}

function openFollowDrawer(lead) {
  openDrawer({
    title: `录入跟进 - ${lead.name}`,
    body: simpleForm([
      { label: "线索名称", value: `${lead.code} · ${lead.name}` },
      { label: "跟进方式", type: "select", options: ["电话", "邮件", "WhatsApp", "会议", "拜访", "备注"], required: true },
      { label: "当前阶段", type: "select", options: ["首次联系", "需求确认", "样品阶段", "报价阶段", "合同已成交"], required: true },
      { label: "下次跟进时间", type: "date", value: "2026-07-01" },
      { label: "跟进内容", type: "textarea", full: true, placeholder: "请输入跟进内容，建议包含客户需求、反馈和下一步计划", required: true }
    ]),
    okText: "保存跟进",
    onSubmit: () =>
      mutate((data) => {
        data.followLogs.unshift({
          id: `fl-${Date.now()}`,
          leadId: lead.id,
          time: "2026-06-28 18:00",
          userId: state.user.id,
          method: "备注",
          stage: "需求确认",
          content: "新增跟进记录",
          nextFollow: "2026-07-01"
        });
        const target = data.leads.find((item) => item.id === lead.id);
        if (target) {
          target.lastFollow = "2026-06-28 18:00";
          target.stage = target.stage === "-" ? "需求确认" : target.stage;
          if (target.status === "已分配") target.status = "跟进中";
        }
      }, "跟进记录录入成功")
  });
}

function openLeadEditDrawer(lead) {
  openDrawer({
    title: `编辑线索 - ${lead.code}`,
    body: simpleForm([
      { label: "线索编号", value: lead.code },
      { label: "企业名称", value: lead.company, required: true },
      { label: "联系人姓名", value: lead.contact },
      { label: "联系人邮箱", value: lead.email },
      { label: "联系人电话", value: lead.phone },
      { label: "来源站点", type: "select", options: state.data.sites.map((site) => site.name), required: true },
      { label: "来源渠道", type: "select", options: ["官网询盘", "自然询盘", "WhatsApp", "展会", "客户转介绍", "其他"] },
      { label: "意向产品", value: lead.products.join("、") }
    ]),
    onSubmit: () => mutate(() => {}, "线索信息已更新")
  });
}

function openAssignLeadModal(leadIds) {
  const ids = Array.isArray(leadIds) ? leadIds : [leadIds];
  openModal({
    title: ids.length > 1 ? `批量分配线索（共 ${ids.length} 条）` : "分配线索",
    body: simpleForm([
      { label: "新负责人", type: "select", options: ownerOptions(), required: true },
      { label: "分配备注", type: "textarea", full: true, placeholder: "请输入分配原因", required: true }
    ]),
    okText: "确认分配",
    onConfirm: () =>
      mutate((data) => {
        const sales = data.users.find((user) => user.roleId === "sales");
        data.leads.forEach((lead) => {
          if (ids.includes(lead.id)) {
            lead.ownerId = sales.id;
            if (lead.status === "公海待分配") lead.status = "已分配";
          }
        });
      }, ids.length > 1 ? `成功分配 ${ids.length} 条线索` : "线索已成功分配")
  });
}

function openRecycleLeadModal(leadIds) {
  const ids = Array.isArray(leadIds) ? leadIds : [leadIds];
  openModal({
    title: "回收至公海",
    danger: true,
    body: simpleForm([{ label: "回收原因", type: "textarea", full: true, placeholder: "请输入回收原因", required: true }]),
    okText: "确认回收",
    onConfirm: () =>
      mutate((data) => {
        data.leads.forEach((lead) => {
          if (ids.includes(lead.id) && ["已分配", "跟进中"].includes(lead.status)) {
            lead.ownerId = "";
            lead.status = "公海待分配";
            lead.poolReason = "主管回收";
          }
        });
      }, "线索已回收至公海")
  });
}

function openCustomerDrawer(customer) {
  openDrawer({
    title: customer ? `编辑联系人 - ${customer.name}` : "新建客户",
    body: customer
      ? simpleForm([
          { label: "客户名称", value: customer.name },
          { label: "联系人姓名", value: customer.contacts[0]?.name || "", required: true },
          { label: "职位", value: customer.contacts[0]?.title || "" },
          { label: "邮箱", value: customer.contacts[0]?.email || "" },
          { label: "电话", value: customer.contacts[0]?.phone || "" },
          { label: "WhatsApp", value: customer.contacts[0]?.whatsapp || "" },
          { label: "联系角色", type: "select", options: ["决策人", "采购经理", "执行联系人", "关键联系人", "其他"] }
        ])
      : simpleForm([
          { label: "客户名称", required: true, placeholder: "请输入客户企业名称" },
          { label: "所属站点", type: "select", options: state.data.sites.map((site) => site.name), required: true },
          { label: "国家/地区", placeholder: "例如 United States" },
          { label: "行业", placeholder: "例如 工业制造" },
          { label: "联系人姓名" },
          { label: "联系人职位" },
          { label: "联系人邮箱" },
          { label: "联系人电话" }
        ]),
    okText: "保存",
    onSubmit: () =>
      mutate((data) => {
        if (!customer) {
          data.customers.unshift({
            id: `cus-${Date.now()}`,
            code: `CUS-2026-${String(data.customers.length + 1).padStart(4, "0")}`,
            name: "新建客户",
            siteId: data.sites[0].id,
            country: "United States",
            industry: "待完善",
            ownerId: state.user.id,
            tags: [],
            status: "潜在客户",
            website: "",
            createdAt: "2026-06-28 18:00",
            contacts: [],
            aiProfile: { intro: "暂无 AI 客户画像", business: "-", scale: "-", market: "-", risk: "-" }
          });
        }
      }, customer ? "联系人信息已更新" : "客户创建成功")
  });
}

function openCustomerTransferModal(customerIds) {
  const ids = Array.isArray(customerIds) ? customerIds : [customerIds];
  openModal({
    title: ids.length > 1 ? `批量客户转交（共 ${ids.length} 个）` : "客户转交",
    body: h("div", {}, [
      h("p", { class: "danger-note" }, "转交后，未结束线索同步转交给新人，历史线索不变。"),
      simpleForm([
        { label: "新负责人", type: "select", options: ownerOptions(), required: true },
        { label: "转交备注", type: "textarea", full: true, placeholder: "请输入转交原因", required: true }
      ])
    ]),
    okText: "确认转交",
    onConfirm: () =>
      mutate((data) => {
        const sales = data.users.find((user) => user.roleId === "sales");
        data.customers.forEach((customer) => {
          if (ids.includes(customer.id)) customer.ownerId = sales.id;
        });
      }, "客户已成功转交")
  });
}

function openContractDrawer(contract, fixedCustomerId = "") {
  const customer = fixedCustomerId ? state.data.customers.find((item) => item.id === fixedCustomerId) : null;
  openDrawer({
    title: contract ? `编辑合同 - ${contract.code}` : "新增合同",
    body: simpleForm([
      { label: "合同编号", value: contract?.code || `PC-2026-${String(200 + state.data.contracts.length)}`, required: true },
      { label: "合同名称", value: contract?.name || "", required: true },
      {
        label: "客户",
        type: "select",
        options: fixedCustomerId ? [customer.name] : state.data.customers.map((item) => item.name),
        required: true
      },
      { label: "关联线索", type: "select", options: ["不关联", ...state.data.leads.map((lead) => lead.name)] },
      { label: "金额（人民币）", type: "number", value: contract?.amount || "", required: true },
      { label: "签约日期", type: "date", value: contract?.signedAt || "2026-06-28", required: true },
      { label: "合同状态", type: "select", options: ["已签约", "执行中", "已完成", "已终止", "已作废"], required: true }
    ]),
    onSubmit: () =>
      mutate((data) => {
        if (!contract) {
          const targetCustomerId = fixedCustomerId || data.customers[0].id;
          const targetCustomer = data.customers.find((item) => item.id === targetCustomerId);
          data.contracts.unshift({
            id: `con-${Date.now()}`,
            code: `PC-2026-${String(130 + data.contracts.length)}`,
            name: "新录入合同",
            customerId: targetCustomerId,
            leadId: "",
            amount: 100000,
            signedAt: "2026-06-28",
            status: "已签约",
            ownerId: targetCustomer?.ownerId || state.user.id,
            createdAt: "2026-06-28 18:00"
          });
        }
      }, contract ? "合同信息已更新" : "合同录入成功")
  });
}

function rowActionButtons(actions) {
  return h("div", { class: "row-actions" }, actions.filter(Boolean));
}

export function DashboardPage() {
  const data = state.data;
  const totalAmount = data.contracts.reduce((sum, item) => sum + item.amount, 0);
  const actions = [
    button("刷新", { iconName: "refresh", onClick: () => toast("工作台数据已刷新") })
  ];
  return h("div", {}, [
    pageHeader({
      title: "工作台",
      description: "按角色展示今日待办、销售经营指标和核心业务入口。",
      breadcrumbs: ["工作台"],
      actions
    }),
    searchPanel(
      [
        { label: "时间范围", type: "select", options: ["今日", "本周", "本月", "自定义"], value: "今日" },
        { label: "站点", type: "select", options: siteOptions(), value: "全部" }
      ],
      [button("查询", { variant: "primary", iconName: "search", onClick: () => toast("工作台筛选已更新") }), button("重置", { onClick: () => toast("工作台筛选已重置") })]
    ),
    h("div", { class: "metrics-grid" }, [
      metricCard("新增线索", data.leads.length, "邮件 2 / WhatsApp 2", { onClick: () => navigate("/leads") }),
      metricCard("待跟进", data.leads.filter((lead) => lead.nextFollow === "2026-06-28").length, "点击查看今日待跟进", {
        onClick: () => navigate(withQuery("/leads", { nextFollow: "today" }))
      }),
      metricCard("成交额", formatCurrency(totalAmount), "较上期 +12.5%", { onClick: () => navigate("/contracts") }),
      metricCard("有效线索率", "68.5%", "198 / 289"),
      metricCard("线索成交率", "17.2%", "34 / 198"),
      metricCard("客户活跃度", "86", "近 30 天活跃客户")
    ]),
    h("div", { class: "content-grid" }, [
      section("销售漏斗", [
        chartBars([
          ["线索进入", 256, 100],
          ["有效线索", 198, 77],
          ["高意向", 68, 58],
          ["转客户", 34, 50],
          ["合同成交", 21, 62]
        ])
      ]),
      section("成交额趋势", [h("div", { class: "line-chart" })])
    ]),
    section("快捷入口", [
      h("div", { class: "quick-grid" }, [
        quickCard("公海池", "查看待分配线索", "/leads/public-pool"),
        quickCard("线索列表", "进入销售跟进工作台", "/leads"),
        quickCard("客户列表", "查看客户资产", "/customers"),
        quickCard("合同中心", "管理成交合同", "/contracts")
      ])
    ])
  ]);
}

function quickCard(title, desc, path) {
  return h("button", { class: "quick-card", onclick: () => navigate(path) }, [h("strong", {}, title), h("p", {}, desc)]);
}

function chartBars(items) {
  return h(
    "div",
    { class: "chart-bars" },
    items.map(([label, value, percent]) =>
      h("div", { class: "bar-row" }, [h("span", {}, label), h("div", { class: "bar" }, h("i", { style: `width:${percent}%` })), h("strong", {}, value)])
    )
  );
}

export function MailPage() {
  const mails = state.data.mails;
  const selected = mails[0];
  return h("div", {}, [
    pageHeader({
      title: "邮件",
      description: "统一管理绑定邮箱邮件，支持 AI 分析与线索生成。",
      breadcrumbs: ["沟通中心", "邮件"],
      actions: [button("刷新", { iconName: "refresh", onClick: () => toast("邮件已刷新") })]
    }),
    searchPanel(
      [
        { label: "邮箱", type: "select", options: ["sales@global.example.com", "quote@industrial.example.com"], value: "sales@global.example.com" },
        { label: "关键词", placeholder: "搜索主题、发件人、正文", onEnter: () => toast("邮件搜索完成") },
        { label: "时间范围", type: "date" },
        { label: "附件", type: "select", options: ["全部", "有附件", "无附件"], value: "全部" }
      ],
      [
        button("查询", { variant: "primary", iconName: "search", onClick: () => toast("邮件筛选已更新") }),
        button("批量 AI 提炼", { onClick: () => toast("已创建批量 AI 提炼任务") })
      ]
    ),
    h("div", { class: "mail-shell" }, [
      h("div", { class: "mail-folder" }, ["未读", "收件箱", "已发送", "草稿箱", "垃圾箱"].map((folder, index) => h("div", { class: `folder-item ${index === 1 ? "active" : ""}` }, folder))),
      h(
        "div",
        { class: "mail-list" },
        mails.map((mail, index) =>
          h("div", { class: `list-item ${index === 0 ? "active" : ""}` }, [
            h("strong", {}, `${mail.unread ? "● " : ""}${mail.subject}`),
            h("p", {}, mail.from),
            h("p", {}, mail.summary),
            h("small", {}, mail.time)
          ])
        )
      ),
      selected
        ? h("div", { class: "mail-detail" }, [
            h("h2", {}, selected.subject),
            infoGrid([
              { label: "发件人", value: selected.from },
              { label: "收件人", value: selected.to },
              { label: "时间", value: selected.time },
              { label: "来源站点", value: selected.siteId ? siteName(selected.siteId) : tag("待确认", "warning") }
            ]),
            section("AI 智能分析", [
              h("p", {}, selected.ai.summary),
              h("p", {}, `企业：${selected.ai.company}`),
              h("p", {}, `风险：${selected.ai.risk}`),
              h("div", {}, selected.ai.tags.map((item) => tag(`AI:${item}`)))
            ]),
            section("邮件原文", [h("p", {}, selected.body), h("p", {}, `附件：${selected.attachments.join("、") || "无"}`)]),
            h("div", { class: "page-actions" }, [
              selected.leadId
                ? button("查看线索", { variant: "primary", iconName: "eye", onClick: () => navigate(`/leads/${selected.leadId}`) })
                : button("生成线索", { variant: "primary", iconName: "plus", onClick: () => toast("线索生成成功") }),
              button("回复", { onClick: () => toast("已唤起回复流程") }),
              button("更多", { iconName: "more", onClick: () => toast("暂无更多邮件操作") })
            ])
          ])
        : emptyState("暂无邮件", "当前邮箱没有邮件。")
    ])
  ]);
}

export function WhatsappPage() {
  const conversations = state.data.conversations;
  const selected = conversations[0];
  return h("div", {}, [
    pageHeader({
      title: "WhatsApp",
      description: "管理绑定 WhatsApp 会话，支持 AI 洞察和线索流转。",
      breadcrumbs: ["沟通中心", "WhatsApp"],
      actions: [button("刷新", { iconName: "refresh", onClick: () => toast("会话已刷新") })]
    }),
    searchPanel(
      [
        { label: "账号", type: "select", options: ["+1 415 010 2026"], value: "+1 415 010 2026" },
        { label: "关键词", placeholder: "搜索联系人、企业、消息内容", onEnter: () => toast("会话搜索完成") }
      ],
      [button("查询", { variant: "primary", iconName: "search", onClick: () => toast("会话筛选已更新") })]
    ),
    h("div", { class: "whatsapp-shell" }, [
      h(
        "div",
        { class: "conversation-list" },
        conversations.map((item, index) =>
          h("div", { class: `conversation-item ${index === 0 ? "active" : ""}` }, [
            h("strong", {}, item.contact),
            h("p", {}, item.company),
            h("p", {}, item.lastMessage),
            h("small", {}, `${item.time}${item.unread ? ` · 未读 ${item.unread}` : ""}`)
          ])
        )
      ),
      h("div", { class: "conversation-detail" }, [
        h("h2", {}, selected.contact),
        infoGrid([
          { label: "手机号", value: selected.phone },
          { label: "企业名称", value: selected.company },
          { label: "地理位置", value: selected.location },
          { label: "状态", value: selected.leadId ? tag("已生成线索", "success") : tag("未生成线索", "warning") }
        ]),
        h("div", { class: "message-thread" }, selected.messages.map((message) => h("div", { class: `message-bubble ${message.from === "me" ? "me" : ""}` }, [h("p", {}, message.text), h("small", {}, message.time)]))),
        section("AI 智能洞察", [h("p", {}, selected.ai.summary), h("div", {}, selected.ai.tags.map((item) => tag(`AI:${item}`)))]),
        h("div", { class: "page-actions" }, [
          selected.leadId
            ? button("查看线索", { variant: "primary", onClick: () => navigate(`/leads/${selected.leadId}`) })
            : button("生成线索", { variant: "primary", onClick: () => toast("线索生成成功") }),
          selected.customerId ? button("查看客户", { onClick: () => navigate(`/customers/${selected.customerId}`) }) : null,
          button("回复", { onClick: () => toast("已进入回复模式") })
        ])
      ])
    ])
  ]);
}

export function LeadsPage() {
  const selected = state.ui.selectedRows;
  const activeStatusTab = statusTabs.includes(queryParams().statusTab) ? queryParams().statusTab : "全部";
  const rows = state.data.leads.filter((lead) => {
    if (lead.status === "公海待分配") return false;
    const allowedStatuses = leadStatusMap[activeStatusTab];
    return !allowedStatuses || allowedStatuses.includes(lead.status);
  });
  const actions = [
    selected.length === 1 ? button("录入跟进", { variant: "primary", permission: "follow", onClick: () => openFollowDrawer(rows.find((lead) => lead.id === selected[0])) }) : null,
    selected.length ? button("批量分配", { permission: "assign", onClick: () => openAssignLeadModal(selected) }) : null,
    selected.length ? button("回收", { variant: "danger", permission: "recycle", onClick: () => openRecycleLeadModal(selected) }) : null,
    button("跟进日志", { onClick: () => navigate("/leads/follow-logs") }),
    button("刷新", { iconName: "refresh", onClick: () => toast("线索列表已刷新") }),
    button("导出", { iconName: "export", permission: "export", onClick: () => toast("已创建线索导出任务") })
  ];
  return listPage({
    title: "线索列表",
    desc: "管理当前用户有权限查看的所有线索。",
    breadcrumbs: ["线索中心", "线索列表"],
    extraTop: h("div", { class: "tabs" }, statusTabs.map((item) => h("button", {
      class: item === activeStatusTab ? "active" : "",
      onclick: () => {
        const nextUrl = item === "全部" ? "/leads" : withQuery("/leads", { statusTab: item });
        navigate(nextUrl);
      }
    }, item))),
    actions,
    fields: leadSearchFields(activeStatusTab),
    table: leadTable(rows, selected)
  });
}

function leadSearchFields(activeStatusTab = "全部") {
  const statusValue = activeStatusTab === "全部" ? "全部" : (leadStatusMap[activeStatusTab]?.join(" / ") || "全部");
  return [
    { label: "站点", type: "select", options: siteOptions(), value: "全部" },
    { label: "创建时间", type: "date" },
    { label: "线索关键词", placeholder: "编号、名称、企业、邮箱" },
    { label: "状态", type: "select", options: ["全部", "已分配", "跟进中 / 高意向", "已转客户", "无效", "丢失"], value: statusValue },
    { label: "阶段", type: "select", options: ["全部", "首次联系", "需求确认", "样品阶段", "报价阶段"], value: "全部" },
    { label: "意向产品", placeholder: "输入产品类目" }
  ];
}

function leadTable(rows, selected) {
  return dataTable({
    rows,
    selectedIds: selected,
    onSelect: setSelectedRows,
    onRowClick: (lead) => navigate(`/leads/${lead.id}`),
    columns: [
      { label: "线索名称", fixed: true, render: (lead) => h("button", { class: "btn btn-text", onclick: () => navigate(`/leads/${lead.id}`) }, `${lead.code} · ${lead.name}`) },
      { label: "来源", render: (lead) => lead.channel },
      { label: "所属站点", render: (lead) => siteName(lead.siteId) },
      { label: "负责人", render: (lead) => userName(lead.ownerId) },
      { label: "状态", render: (lead) => tag(lead.status) },
      { label: "阶段", render: (lead) => lead.stage },
      { label: "标签", render: (lead) => h("div", {}, lead.tags.slice(0, 3).map((item) => tag(item))) },
      { label: "意向产品", render: (lead) => lead.products.slice(0, 2).join("、") },
      { label: "最近跟进", render: (lead) => lead.lastFollow },
      { label: "创建时间", render: (lead) => lead.createdAt }
    ],
    rows: rows.map((lead) => ({
      ...lead,
      actions: () =>
        rowActionButtons([
          button("跟进", { variant: "text", permission: "follow", onClick: () => openFollowDrawer(lead) }),
          button("打标", { variant: "text", permission: "tag", onClick: () => toast("标签已更新") }),
          button("编辑", { variant: "text", permission: "edit", onClick: () => openLeadEditDrawer(lead) }),
          button("更多", {
            variant: "text",
            iconName: "more",
            onClick: () =>
              openModal({
                title: "更多操作",
                body: h("div", { class: "page-actions" }, [
                  button("查看邮件", { onClick: () => navigate("/communication/mail") }),
                  button("查看 WhatsApp", { onClick: () => navigate("/communication/whatsapp") }),
                  button("分配线索", { permission: "assign", onClick: () => openAssignLeadModal(lead.id) }),
                  button("标记无效", { variant: "danger", permission: "status-change", onClick: () => toast("线索已标记无效") })
                ])
              })
          })
        ])
    }))
  });
}

export function LeadDetailPage({ id }) {
  const lead = state.data.leads.find((item) => item.id === id);
  if (!lead) return emptyState("线索不存在", "请返回线索列表重新选择。", button("返回线索列表", { onClick: () => navigate("/leads") }));
  const isPublic = lead.status === "公海待分配";
  return h("div", {}, [
    pageHeader({
      title: lead.name,
      description: `${lead.code} · ${siteName(lead.siteId)} · ${lead.channel}`,
      breadcrumbs: ["线索中心", isPublic ? "公海池" : "线索列表", "线索详情"],
      actions: [
        isPublic ? button("分配", { variant: "primary", permission: "assign", onClick: () => openAssignLeadModal(lead.id) }) : null,
        !isPublic ? button("录入跟进", { variant: "primary", permission: "follow", onClick: () => openFollowDrawer(lead) }) : null,
        button("编辑", { permission: "edit", onClick: () => openLeadEditDrawer(lead) }),
        button("返回列表", { onClick: () => navigate(isPublic ? "/leads/public-pool" : "/leads") })
      ]
    }),
    h("div", { class: "metrics-grid" }, [
      metricCard("状态", lead.status, lead.stage),
      metricCard("负责人", userName(lead.ownerId), "当前负责人"),
      metricCard("最近跟进", lead.lastFollow, "跟进记录不可修改"),
      metricCard("下次跟进", lead.nextFollow || "-", "到期进入待跟进")
    ]),
    h("div", { class: "content-grid" }, [
      tabs(
        [
          { id: "messages", label: "沟通记录", render: () => communicationTimeline(lead) },
          { id: "follows", label: "跟进日志", render: () => followLogTable(lead.id) },
          { id: "contracts", label: "关联合同", render: () => contractMiniTable(state.data.contracts.filter((contract) => contract.leadId === lead.id)) }
        ],
        "messages",
        () => {}
      ),
      h("div", {}, [
        section("AI 智能分析", [h("p", {}, lead.aiSummary), h("div", {}, lead.tags.map((item) => tag(item))), h("p", {}, `意向产品：${lead.products.join("、")}`)]),
        section("基础信息", [
          infoGrid([
            { label: "企业名称", value: lead.company },
            { label: "联系人", value: lead.contact },
            { label: "邮箱", value: lead.email },
            { label: "电话", value: lead.phone },
            { label: "来源站点", value: siteName(lead.siteId) },
            { label: "创建时间", value: lead.createdAt }
          ])
        ]),
        section("关联对象", [
          infoGrid([
            { label: "关联客户", value: lead.customerId ? h("button", { class: "btn btn-text", onclick: () => navigate(`/customers/${lead.customerId}`) }, customerName(lead.customerId)) : "-" },
            { label: "关联消息", value: `${lead.sourceMessages.length} 条` }
          ])
        ])
      ])
    ])
  ]);
}

function communicationTimeline(lead) {
  const messages = state.data.mails.filter((mail) => lead.sourceMessages.includes(mail.id));
  const wa = state.data.conversations.filter((conversation) => lead.sourceMessages.includes(conversation.id));
  const records = [...messages.map((item) => ({ type: "邮件", title: item.subject, time: item.time })), ...wa.map((item) => ({ type: "WhatsApp", title: item.lastMessage, time: item.time }))];
  if (!records.length) return emptyState("暂无沟通记录", "该线索尚未关联邮件或 WhatsApp 会话。");
  return h("div", { class: "chart-bars" }, records.map((item) => h("div", { class: "card-section" }, [h("div", { class: "section-body" }, [tag(item.type), h("strong", {}, item.title), h("p", {}, item.time)])])));
}

function followLogTable(leadId = "") {
  const logs = state.data.followLogs.filter((log) => !leadId || log.leadId === leadId);
  if (!logs.length) return emptyState("暂无跟进记录", "跟进记录新增后会在这里展示。");
  return dataTable({
    selectable: false,
    rows: logs.map((log) => ({ ...log, actions: () => rowActionButtons([button("详情", { variant: "text", onClick: () => toast(log.content) })]) })),
    columns: [
      { label: "跟进时间", render: (log) => log.time, fixed: true },
      { label: "线索", render: (log) => leadName(log.leadId) },
      { label: "跟进人", render: (log) => userName(log.userId) },
      { label: "方式", render: (log) => log.method },
      { label: "阶段", render: (log) => log.stage },
      { label: "内容", render: (log) => log.content },
      { label: "下次跟进", render: (log) => log.nextFollow || "-" }
    ]
  });
}

export function FollowLogsPage() {
  return listPage({
    title: "跟进日志",
    desc: "查看授权范围内所有线索的跟进记录。",
    breadcrumbs: ["线索中心", "线索列表", "跟进日志"],
    actions: [button("返回线索列表", { onClick: () => navigate("/leads") }), button("导出", { iconName: "export", permission: "export", onClick: () => toast("已创建跟进日志导出任务") })],
    fields: [
      { label: "时间范围", type: "date" },
      { label: "跟进人", type: "select", options: ["全部", ...ownerOptions()], value: "全部" },
      { label: "线索关键词", placeholder: "线索编号或名称" },
      { label: "跟进方式", type: "select", options: ["全部", "电话", "邮件", "WhatsApp", "会议", "拜访", "备注"], value: "全部" }
    ],
    table: followLogTable()
  });
}

export function PublicPoolPage() {
  const rows = state.data.leads.filter((lead) => lead.status === "公海待分配");
  const selected = state.ui.selectedRows;
  return listPage({
    title: "公海池",
    desc: "仅展示当前未分配线索，支持主管分配。",
    breadcrumbs: ["线索中心", "公海池"],
    actions: [
      selected.length ? button("批量分配", { variant: "primary", permission: "assign", onClick: () => openAssignLeadModal(selected) }) : null,
      button("刷新", { iconName: "refresh", onClick: () => toast("公海池已刷新") })
    ],
    fields: [
      { label: "站点", type: "select", options: siteOptions(), value: "全部" },
      { label: "入池时间", type: "date" },
      { label: "线索关键词", placeholder: "编号、名称、企业" },
      { label: "来源渠道", type: "select", options: ["全部", "官网询盘", "WhatsApp", "自然询盘"], value: "全部" }
    ],
    searchFirst: true,
    table: dataTable({
      rows: rows.map((lead) => ({ ...lead, actions: () => rowActionButtons([button("分配", { variant: "text", permission: "assign", onClick: () => openAssignLeadModal(lead.id) }), button("查看详情", { variant: "text", onClick: () => navigate(`/leads/${lead.id}`) })]) })),
      selectedIds: selected,
      onSelect: setSelectedRows,
      onRowClick: (lead) => navigate(`/leads/${lead.id}`),
      columns: [
        { label: "线索名称", fixed: true, render: (lead) => `${lead.code} · ${lead.name}` },
        { label: "来源渠道", render: (lead) => lead.channel },
        { label: "所属站点", render: (lead) => siteName(lead.siteId) },
        { label: "入池时间", render: (lead) => lead.createdAt },
        { label: "意向产品", render: (lead) => lead.products.join("、") },
        { label: "入池原因", render: (lead) => lead.poolReason || "自动入池" }
      ]
    })
  });
}

export function CustomersPage() {
  const rows = state.data.customers;
  const selected = state.ui.selectedRows;
  return listPage({
    title: "客户列表",
    desc: "统一管理企业客户资产。",
    breadcrumbs: ["客户中心", "客户列表"],
    actions: [
      button("新建客户", { variant: "primary", iconName: "plus", permission: "create-customer", onClick: () => openCustomerDrawer() }),
      selected.length ? button("客户转交", { permission: "transfer", onClick: () => openCustomerTransferModal(selected) }) : null,
      button("刷新", { iconName: "refresh", onClick: () => toast("客户列表已刷新") }),
      button("导出客户", { iconName: "export", permission: "export", onClick: () => toast("已创建客户导出任务") })
    ],
    fields: [
      { label: "客户关键词", placeholder: "客户名称、客户编号" },
      { label: "国家/地区", type: "select", options: ["全部", "Spain", "United States", "Canada"], value: "全部" },
      { label: "行业", type: "select", options: ["全部", "家居零售", "工业制造", "礼品批发"], value: "全部" },
      { label: "负责人", type: "select", options: ["全部", ...ownerOptions()], value: "全部" },
      { label: "所属站点", type: "select", options: siteOptions(), value: "全部" }
    ],
    table: customerTable(rows, selected)
  });
}

function customerTable(rows, selected) {
  return dataTable({
    rows: rows.map((customer) => ({
      ...customer,
      actions: () =>
        rowActionButtons([
          button("详情", { variant: "text", onClick: () => navigate(`/customers/${customer.id}`) }),
          button("线索记录", { variant: "text", onClick: () => navigate(withQuery("/leads", { customerId: customer.id })) }),
          button("AI画像", { variant: "text", onClick: () => openModal({ title: "AI 客户画像", body: h("p", {}, customer.aiProfile.intro), okText: "知道了" }) }),
          button("更多", {
            variant: "text",
            iconName: "more",
            onClick: () =>
              openModal({
                title: "更多操作",
                body: h("div", { class: "page-actions" }, [
                  button("编辑联系人", { permission: "edit", onClick: () => openCustomerDrawer(customer) }),
                  button("转交", { permission: "transfer", onClick: () => openCustomerTransferModal(customer.id) })
                ])
              })
          })
        ])
    })),
    selectedIds: selected,
    onSelect: setSelectedRows,
    onRowClick: (customer) => navigate(`/customers/${customer.id}`),
    columns: [
      { label: "客户名称", fixed: true, render: (customer) => `${customer.code} · ${customer.name}` },
      { label: "所属站点", render: (customer) => siteName(customer.siteId) },
      { label: "国家/地区", render: (customer) => customer.country },
      { label: "行业", render: (customer) => customer.industry },
      { label: "负责人", render: (customer) => userName(customer.ownerId) },
      { label: "客户标签", render: (customer) => h("div", {}, customer.tags.map((item) => tag(item))) },
      { label: "关联线索数", render: (customer) => state.data.leads.filter((lead) => lead.customerId === customer.id).length },
      { label: "最近签约合同", render: (customer) => state.data.contracts.find((contract) => contract.customerId === customer.id)?.code || "-" }
    ]
  });
}

export function CustomerDetailPage({ id }) {
  const customer = state.data.customers.find((item) => item.id === id);
  if (!customer) return emptyState("客户不存在", "请返回客户列表重新选择。", button("返回客户列表", { onClick: () => navigate("/customers") }));
  const customerLeads = state.data.leads.filter((lead) => lead.customerId === customer.id);
  const customerContracts = state.data.contracts.filter((contract) => contract.customerId === customer.id);
  return h("div", {}, [
    pageHeader({
      title: customer.name,
      description: `${customer.code} · ${siteName(customer.siteId)} · 负责人 ${userName(customer.ownerId)}`,
      breadcrumbs: ["客户中心", "客户列表", "客户详情"],
      actions: [
        button("编辑联系人", { permission: "edit", onClick: () => openCustomerDrawer(customer) }),
        button("新增合同", { variant: "primary", permission: "create-contract", onClick: () => openContractDrawer(null, customer.id) }),
        button("返回列表", { onClick: () => navigate("/customers") })
      ]
    }),
    h("div", { class: "metrics-grid" }, [
      metricCard("关联线索", String(customerLeads.length), "单站点客户"),
      metricCard("合作合同", String(customerContracts.length), "历史合同保留"),
      metricCard("累计金额", formatCurrency(customerContracts.reduce((sum, item) => sum + item.amount, 0)), "人民币口径"),
      metricCard("客户状态", customer.status, "手动维护")
    ]),
    tabs(
      [
        {
          id: "info",
          label: "客户信息",
          render: () =>
            section("基础信息", [
              infoGrid([
                { label: "公司名称", value: customer.name },
                { label: "国家/地区", value: customer.country },
                { label: "行业", value: customer.industry },
                { label: "官网", value: customer.website },
                { label: "所属站点", value: siteName(customer.siteId) },
                { label: "创建时间", value: customer.createdAt },
                { label: "客户标签", value: h("div", {}, customer.tags.map((item) => tag(item))) }
              ])
            ])
        },
        { id: "leads", label: "线索记录", render: () => leadTable(customerLeads, []) },
        { id: "contacts", label: "联系人", render: () => contactTable(customer) },
        { id: "contracts", label: "合作合同", render: () => contractMiniTable(customerContracts, customer.id) },
        {
          id: "ai",
          label: "AI 客户画像",
          render: () =>
            section("AI 客户画像", [
              infoGrid([
                { label: "公司简介", value: customer.aiProfile.intro },
                { label: "主营业务", value: customer.aiProfile.business },
                { label: "企业规模", value: customer.aiProfile.scale },
                { label: "目标市场", value: customer.aiProfile.market },
                { label: "风险信息", value: customer.aiProfile.risk }
              ])
            ])
        }
      ],
      "info",
      { queryKey: "tab" }
    )
  ]);
}

function contactTable(customer) {
  return dataTable({
    selectable: false,
    rows: customer.contacts.map((contact) => ({
      ...contact,
      actions: () => rowActionButtons([button("编辑", { variant: "text", permission: "edit", onClick: () => openCustomerDrawer(customer) }), button("删除", { variant: "text", permission: "edit", onClick: () => confirmAction({ title: "删除联系人", message: `确认删除联系人 ${contact.name} 吗？`, danger: true, okText: "删除" }) })])
    })),
    columns: [
      { label: "姓名", fixed: true, render: (contact) => contact.name },
      { label: "职位", render: (contact) => contact.title },
      { label: "邮箱", render: (contact) => contact.email },
      { label: "电话", render: (contact) => contact.phone },
      { label: "WhatsApp", render: (contact) => contact.whatsapp || "-" },
      { label: "联系角色", render: (contact) => contact.role },
      { label: "主要联系人", render: (contact) => (contact.primary ? tag("主要联系人", "primary") : "-") },
      { label: "AI识别", render: (contact) => (contact.ai ? tag("AI:识别") : "-") }
    ]
  });
}

export function ContractsPage() {
  const rows = state.data.contracts;
  return listPage({
    title: "合同中心",
    desc: "统一管理销售合同，金额口径为人民币。",
    breadcrumbs: ["客户中心", "合同中心"],
    actions: [
      button("新增合同", { variant: "primary", iconName: "plus", permission: "create-contract", onClick: () => openContractDrawer() }),
      button("刷新", { iconName: "refresh", onClick: () => toast("合同中心已刷新") }),
      button("导出合同", { iconName: "export", permission: "export", onClick: () => toast("已创建合同导出任务") })
    ],
    fields: [
      { label: "合同编号", placeholder: "输入合同编号" },
      { label: "客户名称", placeholder: "输入客户名称或邮箱" },
      { label: "签约日期", type: "date" },
      { label: "合同状态", type: "select", options: ["全部", "已签约", "执行中", "已完成", "已终止", "已作废"], value: "全部" },
      { label: "负责人", type: "select", options: ["全部", ...ownerOptions()], value: "全部" }
    ],
    table: contractTable(rows)
  });
}

function contractTable(rows) {
  return dataTable({
    selectable: false,
    rows: rows.map((contract) => ({
      ...contract,
      actions: () => {
        const terminal = ["已完成", "已终止", "已作废"].includes(contract.status);
        return rowActionButtons([
          button("详情", { variant: "text", onClick: () => navigate(`/contracts/${contract.id}`) }),
          !terminal ? button("编辑金额", { variant: "text", permission: "edit", onClick: () => openContractDrawer(contract) }) : null,
          !terminal ? button("编辑", { variant: "text", permission: "edit", onClick: () => openContractDrawer(contract) }) : null,
          !terminal
            ? button("更多", {
                variant: "text",
                iconName: "more",
                onClick: () =>
                  confirmAction({
                    title: "合同状态变更",
                    message: "确认执行合同作废或终止操作吗？历史数据将保留。",
                    danger: true,
                    okText: "确认"
                  })
              })
            : null
        ]);
      }
    })),
    columns: [
      { label: "合同编号", fixed: true, render: (contract) => contract.code },
      { label: "合同名称", render: (contract) => contract.name },
      { label: "客户", render: (contract) => customerName(contract.customerId) },
      { label: "金额", render: (contract) => formatCurrency(contract.amount) },
      { label: "签约日期", render: (contract) => contract.signedAt },
      { label: "合同状态", render: (contract) => tag(contract.status) },
      { label: "负责人", render: (contract) => userName(contract.ownerId) }
    ]
  });
}

function contractMiniTable(rows, fixedCustomerId = "") {
  if (!rows.length) return emptyState("暂无合作合同", "新增合同后将在这里展示。", canOperate("create-contract") ? button("新增合同", { variant: "primary", onClick: () => openContractDrawer(null, fixedCustomerId) }) : null);
  return contractTable(rows);
}

export function ContractDetailPage({ id }) {
  const contract = state.data.contracts.find((item) => item.id === id);
  if (!contract) return emptyState("合同不存在", "请返回合同中心重新选择。", button("返回合同中心", { onClick: () => navigate("/contracts") }));
  const terminal = ["已完成", "已终止", "已作废"].includes(contract.status);
  return h("div", {}, [
    pageHeader({
      title: contract.code,
      description: `${contract.name} · ${tag(contract.status).outerHTML}`,
      breadcrumbs: ["客户中心", "合同中心", "合同详情"],
      actions: [
        !terminal ? button("编辑", { permission: "edit", onClick: () => openContractDrawer(contract) }) : null,
        button("返回合同中心", { onClick: () => navigate("/contracts") })
      ]
    }),
    h("div", { class: "metrics-grid" }, [
      metricCard("合同金额", formatCurrency(contract.amount), "人民币"),
      metricCard("合同状态", contract.status, "终态合同只读"),
      metricCard("负责人", userName(contract.ownerId), "按决策归属"),
      metricCard("签约日期", contract.signedAt, "保存即生效")
    ]),
    section("基本信息", [
      infoGrid([
        { label: "客户", value: h("button", { class: "btn btn-text", onclick: () => navigate(`/customers/${contract.customerId}`) }, customerName(contract.customerId)) },
        { label: "关联线索", value: contract.leadId ? h("button", { class: "btn btn-text", onclick: () => navigate(`/leads/${contract.leadId}`) }, leadName(contract.leadId)) : "未关联线索" },
        { label: "创建时间", value: contract.createdAt },
        { label: "合同名称", value: contract.name }
      ])
    ]),
    section("操作记录", [followLogTable(contract.leadId)])
  ]);
}

export function SalesAnalyticsPage() {
  return h("div", {}, [
    analyticsHeader("销售经营", "提供销售核心指标的经营分析，帮助管理者了解线索总量、成交金额、转化效率、销售漏斗及团队排行。", true),
    h("div", { class: "metrics-grid" }, [
      metricCard("线索总数", "12,482", "较上期增加 1,540 · 今日目标达成率 88%", { onClick: () => navigate("/leads") }),
      metricCard("新增线索", "842", "~+4.2% · 年度目标完成 62%"),
      metricCard("成交金额", "¥4.2M", "~+2.1%", { onClick: () => navigate("/contracts") }),
      metricCard("线索转化率", "24.8%", "~+0.5% · 行业平均水平 18%")
    ]),
    h("div", { class: "content-grid" }, [
      section("销售漏斗分析", [
        chartBars([
          ["全部消息", "25,000", 100],
          ["识别为线索", "12,482", 49.9],
          ["跟进中", "8,240", 32.9],
          ["高意向", "3,120", 12.5],
          ["转客户", "1,220", 4.9]
        ]),
        h("p", { class: "chart-note" }, "展示每个阶段绝对数量及相邻阶段转化率。")
      ]),
      section("线索增长与成交金额趋势", [
        comboTrendChart([
          ["1月", 520, 320000],
          ["2月", 610, 410000],
          ["3月", 680, 520000],
          ["4月", 740, 610000],
          ["5月", 790, 680000],
          ["6月", 842, 740000]
        ])
      ])
    ]),
    salesRankingSection()
  ]);
}

export function AcquisitionAnalyticsPage() {
  const siteRows = [
    { id: "acq-1", site: "全球旗舰商城", channel: "混合", messages: "12,450", leads: "842", conversion: "6.76%", amount: 1245000 },
    { id: "acq-2", site: "工业零件独立站", channel: "邮件", messages: "8,910", leads: "516", conversion: "5.79%", amount: 860000 },
    { id: "acq-3", site: "家居装饰品牌站", channel: "WhatsApp", messages: "3,240", leads: "188", conversion: "5.80%", amount: 230000 }
  ];
  return h("div", {}, [
    analyticsHeader("获客分析", "提供渠道效能与来源站点分析，帮助管理者了解不同渠道和站点的获客能力与转化效率。", true),
    h("div", { class: "channel-card-grid" }, [
      channelEfficiencyCard("邮件效能", [
        ["消息总量", "4,520"],
        ["AI 识别数量", "3,096"],
        ["有效消息比例", "68.5%"],
        ["增长", "+12%"]
      ]),
      channelEfficiencyCard("WhatsApp 效能", [
        ["消息总量", "8,912"],
        ["AI 识别数量", "7,316"],
        ["有效消息比例", "82.1%"],
        ["增长", "+24%"]
      ])
    ]),
    section("来源站点价值分析", [
      dataTable({
        selectable: false,
        rows: siteRows.map((row) => ({ ...row, actions: () => rowActionButtons([button("查看站点", { variant: "text", onClick: () => navigate("/sites/global-shop") })]) })),
        columns: [
          { label: "站点名称", fixed: true, render: (row) => row.site },
          { label: "渠道", render: (row) => tag(row.channel) },
          { label: "消息数量", render: (row) => row.messages },
          { label: "线索数量", render: (row) => row.leads },
          { label: "转化率", render: (row) => row.conversion },
          { label: "成交金额", render: (row) => formatCurrency(row.amount) }
        ]
      })
    ])
  ]);
}

export function CustomerAnalyticsPage() {
  return h("div", {}, [
    pageHeader({
      title: "客户经营",
      description: "提供客户维度经营数据分析，了解客户总量、增长趋势、行业分布、地域分布及线索转化效率。",
      breadcrumbs: ["分析中心", "客户经营"],
      actions: [button("刷新", { iconName: "refresh", onClick: () => toast("客户经营数据已刷新") })]
    }),
    searchPanel(
      [
        { label: "时间范围", type: "date", value: "2026-01-01" },
        { label: "站点", type: "select", options: siteOptions(), value: "全部" }
      ],
      [button("查询", { variant: "primary", iconName: "search", onClick: () => toast("客户经营筛选已更新") })]
    ),
    h("div", { class: "metrics-grid" }, [
      metricCard("客户总数", "12,840", "较上一统计周期 +8.2%", { onClick: () => navigate("/customers") }),
      metricCard("新增客户（本月）", "846", "较上一统计周期 +3.4%"),
      metricCard("成交客户", "3,124", "较上一统计周期 +5.1%"),
      metricCard("客户增长率", "24.5%", "稳定增长")
    ]),
    h("div", { class: "content-grid" }, [
      section("客户行业分布", [pieDistributionChart([["信息技术", "45.2%"], ["金融服务", "22.8%"], ["制造业", "18.5%"], ["其他", "13.5%"]])]),
      section("客户国家分布", [countryBarChart([["United States", 3240], ["Spain", 2180], ["Canada", 1760], ["Germany", 1420], ["Japan", 980]])])
    ]),
    section("年度转化趋势（线索→客户转化率）", [
      conversionTrendChart([
        ["1月", "12.4%"],
        ["2月", "13.1%"],
        ["3月", "15.2%"],
        ["4月", "16.3%"],
        ["5月", "17.4%"],
        ["6月", "18.7%"]
      ])
    ])
  ]);
}

function analyticsHeader(title, desc, showQuickTime) {
  return h("div", {}, [
    pageHeader({ title, description: desc, breadcrumbs: ["分析中心", title], actions: [button("刷新", { iconName: "refresh", onClick: () => toast("分析数据已刷新") })] }),
    searchPanel(
      [
        showQuickTime
          ? { label: "时间快捷选项", type: "select", options: ["今日", "本周", "本月", "本季度", "自定义"], value: "本月" }
          : { label: "时间范围", type: "date" },
        { label: "站点", type: "select", options: siteOptions(), value: "全部" }
      ],
      [button("查询", { variant: "primary", iconName: "search", onClick: () => toast("分析筛选已更新") })]
    )
  ]);
}

function comboTrendChart(items) {
  const maxLead = Math.max(...items.map((item) => item[1]));
  const maxAmount = Math.max(...items.map((item) => item[2]));
  return h("div", { class: "combo-chart" }, [
    h("div", { class: "combo-legend" }, [tag("线索数量", "primary"), tag("成交金额", "success")]),
    h(
      "div",
      { class: "combo-bars" },
      items.map(([month, leads, amount]) =>
        h("div", { class: "combo-item" }, [
          h("div", { class: "combo-bar", style: `height:${Math.max(16, (leads / maxLead) * 120)}px` }),
          h("span", { class: "combo-point", style: `bottom:${Math.max(18, (amount / maxAmount) * 126)}px` }),
          h("small", {}, month),
          h("em", {}, `${leads} / ${formatCurrency(amount)}`)
        ])
      )
    ),
    h("p", { class: "chart-note" }, "X 轴为本年度月份；左 Y 轴为线索数量，右 Y 轴为成交金额。")
  ]);
}

function salesRankingSection() {
  const rows = [
    { id: "rank-1", rank: 1, name: "赵思琪", team: "北美销售组", leads: 128, follows: 312, customers: 28, amount: 1280000, target: "92%" },
    { id: "rank-2", rank: 2, name: "王奕辰", team: "欧洲销售组", leads: 96, follows: 244, customers: 19, amount: 860000, target: "78%" },
    { id: "rank-3", rank: 3, name: "陈启航", team: "北美销售组", leads: 88, follows: 201, customers: 16, amount: 720000, target: "69%" }
  ];
  return section("销售排行榜 TOP10", [
    tabs(
      [
        { id: "amount", label: "按成交额", render: () => rankingTable(rows) },
        { id: "customers", label: "按转客数", render: () => rankingTable([...rows].sort((a, b) => b.customers - a.customers)) }
      ],
      "amount",
      () => {}
    )
  ]);
}

function rankingTable(rows) {
  return dataTable({
    selectable: false,
    rows: rows.map((row) => ({ ...row, actions: () => rowActionButtons([button("查看线索", { variant: "text", onClick: () => navigate("/leads") })]) })),
    columns: [
      { label: "排名", fixed: true, width: 100, render: (row) => row.rank },
      { label: "业务员", width: 220, render: (row) => `${row.name} · ${row.team}` },
      { label: "线索数量", render: (row) => row.leads },
      { label: "跟进数", render: (row) => row.follows },
      { label: "转客户数", render: (row) => row.customers },
      { label: "成交金额", render: (row) => formatCurrency(row.amount) },
      { label: "目标达成", render: (row) => row.target }
    ]
  });
}

function channelEfficiencyCard(title, metrics) {
  return section(title, [
    h("div", { class: "channel-metrics" }, metrics.map(([label, value]) => h("div", {}, [h("span", {}, label), h("strong", {}, value)]))),
    h("p", { class: "chart-note" }, "有效消息：经系统规则识别或 AI 识别，满足有效条件并生成线索的消息。")
  ]);
}

function pieDistributionChart(items) {
  return h("div", { class: "pie-chart-wrap" }, [
    h("div", { class: "pie-chart" }),
    h("div", { class: "chart-bars" }, items.map(([label, value]) => h("div", { class: "bar-row" }, [h("span", {}, label), h("div", { class: "bar" }, h("i", { style: `width:${parseFloat(value)}%` })), h("strong", {}, value)])))
  ]);
}

function countryBarChart(items) {
  const max = Math.max(...items.map((item) => item[1]));
  return h("div", { class: "chart-bars" }, items.map(([country, count]) => h("div", { class: "bar-row" }, [h("span", {}, country), h("div", { class: "bar" }, h("i", { style: `width:${(count / max) * 100}%` })), h("strong", {}, count)])));
}

function conversionTrendChart(items) {
  return h("div", { class: "conversion-trend" }, [
    h("div", { class: "line-chart" }),
    h("div", { class: "trend-points" }, items.map(([month, value]) => h("span", {}, `${month} ${value}`))),
    h("p", { class: "chart-note" }, "转化率 = 当月线索转客户数 / 当月有效线索数 × 100%。")
  ]);
}

export function SitesPage() {
  const rows = state.data.sites;
  return listPage({
    title: "站点管理",
    desc: "管理所有销售站点、联系方式和站点配置入口。",
    breadcrumbs: ["站点中心", "站点管理"],
    actions: [button("新增站点", { variant: "primary", iconName: "plus", onClick: () => openSiteDrawer() }), button("刷新", { iconName: "refresh", onClick: () => toast("站点列表已刷新") })],
    fields: [{ label: "站点关键词", placeholder: "站点名称或编码" }],
    searchFirst: true,
    table: dataTable({
      selectable: false,
      rows: rows.map((site) => ({
        ...site,
        actions: () =>
          rowActionButtons([
            button("编辑", { variant: "text", onClick: () => openSiteDrawer(site) }),
            button(site.status === "启用" ? "停用" : "启用", {
              variant: "text",
              onClick: () =>
                site.status === "启用"
                  ? confirmAction({ title: "停用站点", message: "停用后该站点将不再接收新消息，历史数据保留。", danger: true, okText: "停用" })
                  : toast("站点已启用")
            }),
            button("配置", { variant: "text", onClick: () => navigate(`/sites/${site.id}/config`) })
          ])
      })),
      columns: [
        { label: "站点名称", fixed: true, render: (site) => site.name },
        { label: "站点编码", render: (site) => site.code },
        { label: "域名", render: (site) => site.domain },
        { label: "状态", render: (site) => tag(site.status) },
        { label: "接口状态", render: (site) => tag(site.interfaceStatus) },
        { label: "最近拉取", render: (site) => site.lastPull },
        { label: "创建时间", render: (site) => site.createdAt }
      ]
    })
  });
}

function openSiteDrawer(site) {
  openDrawer({
    title: site ? `编辑站点 - ${site.name}` : "新增站点",
    body: simpleForm([
      { label: "站点名称", value: site?.name || "", required: true },
      { label: "站点编码", value: site?.code || "", required: true },
      { label: "域名", value: site?.domain || "", required: true },
      { label: "联系邮箱", value: site?.email || "" },
      { label: "WhatsApp", value: site?.whatsapp || "" }
    ]),
    onSubmit: () => mutate(() => {}, site ? "站点信息已更新" : "站点创建成功")
  });
}

export function SiteDetailPage({ id }) {
  const site = state.data.sites.find((item) => item.id === id);
  if (!site) return emptyState("站点不存在", "请返回站点管理重新选择。");
  return h("div", {}, [
    pageHeader({
      title: site.name,
      description: `${site.code} · ${tag(site.status).outerHTML}`,
      breadcrumbs: ["站点中心", "站点管理", "站点详情"],
      actions: [button("进入配置", { variant: "primary", onClick: () => navigate(`/sites/${site.id}/config`) }), button("返回列表", { onClick: () => navigate("/sites") })]
    }),
    h("div", { class: "metrics-grid" }, [
      metricCard("线索总数", String(state.data.leads.filter((lead) => lead.siteId === site.id).length), "该站点下"),
      metricCard("客户总数", String(state.data.customers.filter((customer) => customer.siteId === site.id).length), "单站点归属"),
      metricCard("合同总数", String(state.data.contracts.filter((contract) => state.data.customers.find((customer) => customer.id === contract.customerId)?.siteId === site.id).length), "人民币口径"),
      metricCard("接口状态", site.interfaceStatus, site.lastPull)
    ]),
    section("站点基础信息", [
      infoGrid([
        { label: "站点名称", value: site.name },
        { label: "站点编码", value: site.code },
        { label: "域名", value: site.domain },
        { label: "联系邮箱", value: site.email },
        { label: "WhatsApp", value: site.whatsapp },
        { label: "创建时间", value: site.createdAt },
        { label: "配置摘要", value: `阶段 ${site.config.stageCount} · 公海 ${site.config.publicPool} · AI ${site.config.ai} · 系统规则 ${site.config.rules}` }
      ])
    ])
  ]);
}

export function SiteConfigPage({ id }) {
  const site = state.data.sites.find((item) => item.id === id);
  if (!site) return emptyState("站点不存在", "请返回站点管理重新选择。");
  return h("div", {}, [
    pageHeader({
      title: `${site.name} · 站点配置`,
      description: `${site.code} · 各配置分组独立保存`,
      breadcrumbs: ["站点中心", "站点管理", "站点配置"],
      actions: [button("返回详情", { onClick: () => navigate(`/sites/${site.id}`) })]
    }),
    tabs(
      [
        { id: "contact", label: "联系方式", render: () => configForm([{ label: "联系邮箱", value: site.email }, { label: "WhatsApp", value: site.whatsapp }]) },
        { id: "process", label: "业务流程", render: () => stageConfig(site) },
        { id: "pool", label: "公海规则", render: () => configForm([{ label: "启用自动回收", type: "select", options: ["开启", "关闭"], value: site.config.publicPool }, { label: "回收超时时长", value: "7 天" }]) },
        { id: "ai", label: "AI 规则", render: () => configForm([{ label: "启用 AI 识别", type: "select", options: ["开启", "关闭"], value: site.config.ai }]) },
        { id: "rules", label: "系统规则", render: () => ruleConfig() }
      ],
      "contact",
      () => {}
    )
  ]);
}

function configForm(fields) {
  return section("配置项", [simpleForm(fields), h("div", { class: "page-actions", style: "margin-top:12px" }, [button("保存配置", { variant: "primary", onClick: () => toast("配置已保存") })])]);
}

function stageConfig(site) {
  return section("阶段管理", [
    dataTable({
      selectable: false,
      rows: site.stages.map((stage, index) => ({ id: `${stage.name}-${index}`, ...stage, actions: () => rowActionButtons([button("编辑", { variant: "text", onClick: () => toast("阶段已更新") }), button("删除", { variant: "text", onClick: () => confirmAction({ title: "删除阶段", message: "该阶段可能已被线索引用，确认删除吗？", danger: true, okText: "删除" }) })]) })),
      columns: [
        { label: "阶段名称", fixed: true, render: (stage) => stage.name },
        { label: "触发高意向", render: (stage) => (stage.highIntent ? tag("启用") : tag("停用")) },
        { label: "排序", render: (_, index) => index + 1 }
      ]
    })
  ], [button("新增阶段", { variant: "primary", iconName: "plus", onClick: () => toast("已新增阶段") })]);
}

function ruleConfig() {
  const rows = [
    { id: "rule-1", name: "询价关键词", keywords: "quote,buy,purchase", logic: "包含任一", priority: 10, status: "启用" },
    { id: "rule-2", name: "屏蔽内部域名", keywords: "internal,test", logic: "包含任一", priority: 1, status: "停用" }
  ];
  return section("关键词规则", [
    dataTable({
      selectable: false,
      rows: rows.map((row) => ({ ...row, actions: () => rowActionButtons([button("编辑", { variant: "text", onClick: () => toast("规则已更新") }), button("启用/停用", { variant: "text", onClick: () => toast("规则状态已更新") })]) })),
      columns: [
        { label: "规则名称", fixed: true, render: (row) => row.name },
        { label: "关键词", render: (row) => row.keywords },
        { label: "匹配逻辑", render: (row) => row.logic },
        { label: "优先级", render: (row) => row.priority },
        { label: "状态", render: (row) => tag(row.status) }
      ]
    })
  ], [button("新增规则", { variant: "primary", iconName: "plus", onClick: () => toast("规则已新增") })]);
}

export function UsersPage() {
  return listPage({
    title: "用户管理",
    desc: "管理系统用户、角色和站点授权。",
    breadcrumbs: ["系统管理", "用户管理"],
    actions: [
      button("新增用户", { variant: "primary", iconName: "plus", onClick: () => openUserDrawer() }),
      button("角色权限配置", { onClick: () => navigate("/system/roles") }),
      button("刷新", { iconName: "refresh", onClick: () => toast("用户列表已刷新") })
    ],
    fields: [{ label: "用户关键词", placeholder: "姓名、账号、手机号、邮箱" }, { label: "状态", type: "select", options: ["全部", "启用", "停用"], value: "全部" }],
    table: dataTable({
      selectable: false,
      rows: state.data.users.map((user) => ({
        ...user,
        actions: () => rowActionButtons([button("编辑", { variant: "text", onClick: () => openUserDrawer(user) }), button(user.status === "启用" ? "停用" : "启用", { variant: "text", onClick: () => user.roleId === "admin" ? toast("内置系统管理员不可停用", "error") : toast("用户状态已更新") }), button("重置密码", { variant: "text", onClick: () => confirmAction({ title: "重置密码", message: `确认重置 ${user.name} 的密码吗？`, okText: "重置" }) })])
      })),
      columns: [
        { label: "姓名", fixed: true, render: (user) => user.name },
        { label: "登录账号", render: (user) => user.account },
        { label: "手机号", render: (user) => user.phone },
        { label: "邮箱", render: (user) => user.email },
        { label: "角色", render: (user) => user.role },
        { label: "所属站点", render: (user) => user.sites.map(siteName).join("、") },
        { label: "状态", render: (user) => tag(user.status) }
      ]
    })
  });
}

function openUserDrawer(user) {
  openDrawer({
    title: user ? `编辑用户 - ${user.name}` : "新增用户",
    body: simpleForm([
      { label: "姓名", value: user?.name || "", required: true },
      { label: "登录账号", value: user?.account || "", required: true },
      { label: "手机号", value: user?.phone || "" },
      { label: "邮箱", value: user?.email || "" },
      { label: "角色", type: "select", options: state.data.roles.map((role) => role.name), required: true },
      { label: "所属站点", type: "select", options: state.data.sites.map((site) => site.name), required: true },
      { label: "状态", type: "select", options: ["启用", "停用"], value: user?.status || "启用" }
    ]),
    onSubmit: () => mutate(() => {}, user ? "用户信息已更新" : "用户创建成功")
  });
}

export function RolesPage() {
  const selectedRole = state.data.roles[0];
  return h("div", {}, [
    pageHeader({
      title: "角色权限",
      description: "配置菜单权限、按钮权限和数据权限。",
      breadcrumbs: ["系统管理", "角色权限"],
      actions: [button("保存权限", { variant: "primary", onClick: () => toast("角色权限已保存") })]
    }),
    h("div", { class: "role-shell" }, [
      h("div", { class: "role-list" }, state.data.roles.map((role, index) => h("div", { class: `folder-item ${index === 0 ? "active" : ""}` }, [h("strong", {}, role.name), h("p", {}, role.dataScope)]))),
      h("div", { class: "section-body" }, [
        h("p", { class: "danger-note" }, "内置系统管理员角色不可删除、不可停用、不可降权；系统必须至少保留一个可用管理员。"),
        h("h2", {}, selectedRole.name),
        h("div", { class: "permission-grid" }, [
          permissionBox("菜单权限", ["工作台", "沟通中心", "线索中心", "客户中心", "分析中心", "站点中心", "系统管理"]),
          permissionBox("按钮权限", ["新增", "编辑", "导出", "分配", "转交", "配置"]),
          permissionBox("数据权限", ["仅本人", "本团队", "本区域", "全部"])
        ])
      ])
    ])
  ]);
}

function permissionBox(title, items) {
  return h("div", { class: "permission-box" }, [h("h3", {}, title), ...items.map((item) => h("label", { class: "field" }, [h("span", {}, item), h("input", { type: "checkbox", checked: true })]))]);
}

export function LogsPage() {
  return h("div", {}, [
    pageHeader({ title: "系统日志", description: "查看登录日志和操作日志。", breadcrumbs: ["系统管理", "系统日志"], actions: [button("导出", { iconName: "export", onClick: () => toast("已创建日志导出任务") })] }),
    tabs(
      [
        { id: "login", label: "登录日志", render: () => logTable("登录日志") },
        { id: "operation", label: "操作日志", render: () => logTable("操作日志") }
      ],
      "login",
      () => {}
    )
  ]);
}

function logTable(type) {
  const rows = state.data.systemLogs.filter((log) => log.type === type);
  return h("div", {}, [
    searchPanel(
      [
        { label: "时间范围", type: "date" },
        { label: type === "登录日志" ? "登录账号" : "操作人", placeholder: "模糊搜索" },
        { label: "结果/类型", type: "select", options: ["全部", "成功", "失败", "新增", "编辑", "配置"], value: "全部" }
      ],
      [button("查询", { variant: "primary", iconName: "search", onClick: () => toast("日志筛选已更新") }), button("重置", { onClick: () => toast("日志筛选已重置") })]
    ),
    dataTable({
      selectable: false,
      rows: rows.map((log) => ({ ...log, actions: () => rowActionButtons([button("详情", { variant: "text", onClick: () => toast(log.content || log.result) })]) })),
      columns:
        type === "登录日志"
          ? [
              { label: "登录时间", fixed: true, render: (log) => log.time },
              { label: "登录账号", render: (log) => log.account },
              { label: "用户姓名", render: (log) => log.user },
              { label: "登录 IP", render: (log) => log.ip },
              { label: "登录方式", render: (log) => log.method },
              { label: "登录结果", render: (log) => tag(log.result) },
              { label: "浏览器", render: (log) => log.browser },
              { label: "操作系统", render: (log) => log.os }
            ]
          : [
              { label: "操作时间", fixed: true, render: (log) => log.time },
              { label: "操作人", render: (log) => log.operator },
              { label: "操作类型", render: (log) => log.action },
              { label: "业务对象", render: (log) => log.objectType },
              { label: "对象名称", render: (log) => log.objectName },
              { label: "操作内容", render: (log) => log.content },
              { label: "IP 地址", render: (log) => log.ip }
            ]
    })
  ]);
}

export function ParamsPage() {
  const params = state.data.systemParams;
  return h("div", {}, [
    pageHeader({ title: "系统参数", description: "配置全局 AI、业务规则、消息提醒与公共参数。", breadcrumbs: ["系统管理", "系统参数"] }),
    tabs(
      [
        {
          id: "ai",
          label: "AI 能力配置",
          render: () =>
            configForm([
              { label: "AI 服务商", type: "select", options: ["OpenAI", "Azure", "自定义"], value: params.ai.provider },
              { label: "模型", type: "select", options: ["gpt-4o", "gpt-4-turbo", "其他"], value: params.ai.model },
              { label: "API Endpoint", value: params.ai.endpoint },
              { label: "启用 AI 增强能力", type: "select", options: ["开启", "关闭"], value: params.ai.enabled ? "开启" : "关闭" },
              { label: "本月用量", value: params.ai.usage }
            ])
        },
        { id: "rules", label: "业务规则配置", render: () => paramTable(params.rules) },
        { id: "reminders", label: "消息提醒规则", render: () => paramTable(params.reminders) },
        { id: "common", label: "系统参数", render: () => paramTable(params.common) }
      ],
      "ai",
      () => {}
    )
  ]);
}

function paramTable(rows) {
  return dataTable({
    selectable: false,
    rows: rows.map((row, index) => ({ id: `param-${index}`, ...row, actions: () => rowActionButtons([button("编辑", { variant: "text", onClick: () => toast("参数已更新") })]) })),
    columns: [
      { label: "参数 / 规则名称", fixed: true, render: (row) => row.name },
      { label: "说明", render: (row) => row.desc },
      { label: "当前配置", render: (row) => row.value }
    ]
  });
}

function listPage({ title, desc, breadcrumbs, actions, fields, table, extraTop, searchFirst = false }) {
  const search = searchPanel(fields, [button("查询", { variant: "primary", iconName: "search", onClick: () => toast("筛选已更新") }), button("重置", { onClick: () => toast("筛选已重置") })]);
  const operationToolbar = toolbar(actions, state.ui.selectedRows.length ? `已选 ${state.ui.selectedRows.length} 项` : "");
  return h("div", {}, [
    pageHeader({ title, description: desc, breadcrumbs }),
    extraTop || null,
    searchFirst ? search : operationToolbar,
    searchFirst ? operationToolbar : search,
    table
  ]);
}

export function NotFoundPage() {
  return emptyState("页面不存在", "请从左侧菜单重新进入系统页面。", button("返回工作台", { onClick: () => navigate("/dashboard") }));
}

export function LoginPage() {
  return h("div", { class: "auth-page" }, [
    h("div", { class: "auth-card" }, [
      h("div", { class: "auth-brand" }, [h("div", { class: "brand-mark" }, "AI"), h("div", {}, [h("h1", {}, "AI 智能 CRM"), h("p", {}, "企业销售管理后台")])]),
      h("div", { class: "tabs" }, [h("button", { class: "active" }, "账号密码登录"), h("button", { onclick: () => toast("请使用企业钉钉扫码完成登录") }, "钉钉扫码登录")]),
      simpleForm([
        { label: "登录账号", value: "admin", required: true },
        { label: "登录密码", type: "password", value: "********", required: true }
      ]),
      h("div", { class: "auth-row" }, [
        h("label", {}, [h("input", { type: "checkbox", checked: true }), " 记住账号"]),
        h("button", { class: "btn btn-text", onclick: () => navigate("/forgot-password") }, "忘记密码")
      ]),
      button("登录", {
        variant: "primary",
        onClick: () => {
          loginAs("u-admin");
          navigate("/dashboard");
        }
      }),
      h("p", { class: "auth-footer" }, "登录后将根据角色加载菜单、页面、按钮和数据权限。")
    ])
  ]);
}

export function ForgotPasswordPage() {
  return h("div", { class: "auth-page" }, [
    h("div", { class: "auth-card" }, [
      h("h1", {}, "忘记密码"),
      h("p", {}, "本期不启用自助找回，请联系系统管理员重置密码。"),
      simpleForm([{ label: "登录账号", placeholder: "请输入登录账号" }]),
      h("div", { class: "page-actions" }, [button("返回登录", { onClick: () => navigate("/login") }), button("联系管理员", { variant: "primary", onClick: () => toast("请联系系统管理员处理") })])
    ])
  ]);
}

export function FirstLoginPasswordPage() {
  return h("div", { class: "auth-page" }, [
    h("div", { class: "auth-card" }, [
      h("h1", {}, "首次登录修改密码"),
      h("p", {}, "为保障账号安全，请修改初始密码后继续使用系统。"),
      simpleForm([
        { label: "新密码", type: "password", required: true },
        { label: "确认新密码", type: "password", required: true }
      ]),
      button("确认修改", { variant: "primary", onClick: () => { toast("密码已修改，请重新登录"); navigate("/login"); } })
    ])
  ]);
}

export function SessionExpiredPage() {
  return h("div", { class: "auth-page" }, [
    h("div", { class: "auth-card" }, [
      h("h1", {}, "会话已过期"),
      h("p", {}, "由于长时间未操作，当前会话已失效，请重新登录。"),
      button("重新登录", { variant: "primary", onClick: () => navigate("/login") })
    ])
  ]);
}

export function ForbiddenPage() {
  return noPermission();
}

export function ServerErrorPage() {
  return errorPanel("系统异常", "系统暂时无法完成请求，请稍后重试或联系管理员。", "返回工作台");
}

export function NetworkErrorPage() {
  return errorPanel("网络异常", "网络连接异常，请检查网络后重试。", "重新加载");
}

export function LoadingPage() {
  return h("div", { class: "auth-page" }, [
    h("div", { class: "auth-card loading-card" }, [
      h("div", { class: "global-spinner" }),
      h("h1", {}, "系统加载中"),
      h("p", {}, "正在初始化用户信息、菜单权限和业务数据。")
    ])
  ]);
}

function errorPanel(title, desc, actionText) {
  return h("div", { class: "content" }, [
    h("div", { class: "state state-error" }, [
      h("div", { class: "state-icon" }, "!"),
      h("h3", {}, title),
      h("p", {}, desc),
      button(actionText, { variant: "primary", onClick: () => (actionText === "重新加载" ? window.location.reload() : navigate("/dashboard")) })
    ])
  ]);
}

export function ProfilePage() {
  return userCenterPage("我的资料", [
    simpleForm([
      { label: "姓名", value: state.user.name },
      { label: "手机号", value: state.user.phone },
      { label: "邮箱", value: state.user.email },
      { label: "所属角色", value: state.user.role }
    ]),
    h("div", { class: "page-actions" }, [button("保存", { variant: "primary", onClick: () => toast("个人信息已更新") })])
  ]);
}

export function AccountBindingPage() {
  return userCenterPage("账号绑定", [
    section("邮箱绑定", [
      infoGrid([
        { label: "已绑定邮箱", value: state.user.email },
        { label: "绑定时间", value: "2026-06-01 09:00" }
      ]),
      h("div", { class: "page-actions" }, [
        button("新增绑定", { variant: "primary", onClick: () => toast("邮箱绑定成功") }),
        button("删除绑定", { variant: "danger", onClick: () => confirmAction({ title: "删除邮箱绑定", message: "确认解除该邮箱绑定吗？", danger: true, okText: "删除" }) })
      ])
    ]),
    section("WhatsApp 绑定", [
      infoGrid([{ label: "WhatsApp", value: "+1 415 010 2026" }]),
      h("div", { class: "page-actions" }, [button("解绑", { variant: "danger", onClick: () => confirmAction({ title: "解绑 WhatsApp", message: "确认解绑当前 WhatsApp 账号吗？", danger: true, okText: "解绑" }) })])
    ])
  ]);
}

export function ChangePasswordPage() {
  return userCenterPage("修改密码", [
    simpleForm([
      { label: "新密码", type: "password", required: true },
      { label: "确认新密码", type: "password", required: true }
    ]),
    h("div", { class: "page-actions" }, [
      button("确认修改", {
        variant: "primary",
        onClick: () => {
          toast("密码已修改，请重新登录");
          logout(false);
          navigate("/login");
        }
      })
    ])
  ]);
}

export function LoginSecurityPage() {
  return userCenterPage("登录安全", [
    section("当前登录设备", [
      infoGrid([
        { label: "浏览器", value: "Chrome" },
        { label: "操作系统", value: "macOS" },
        { label: "IP 地址", value: "127.0.0.1" },
        { label: "登录方式", value: "账号密码" }
      ]),
      h("div", { class: "page-actions" }, [button("退出登录", { variant: "danger", onClick: () => { logout(false); navigate("/login"); } })])
    ])
  ]);
}

function userCenterPage(title, children) {
  const links = [
    ["我的资料", "/user/profile"],
    ["账号绑定", "/user/bindings"],
    ["修改密码", "/user/password"],
    ["登录安全", "/user/security"]
  ];
  return h("div", {}, [
    pageHeader({ title, description: "用户中心为非菜单入口，由 Header 用户头像进入。", breadcrumbs: ["用户中心", title] }),
    h("div", { class: "role-shell user-center-shell" }, [
      h("div", { class: "role-list" }, links.map(([label, path]) => h("a", { href: path, class: `folder-item ${getAppPathname() === path ? "active" : ""}`, onclick: (event) => { event.preventDefault(); navigate(path); } }, label))),
      h("div", { class: "section-body" }, children)
    ])
  ]);
}

export { noPermission };
