window.CRM_MOCK = {
  currentUser: {
    id: "u01",
    name: "管理员",
    role: "运营专员",
    roleCode: "supervisor",
    avatar: "AD",
    sites: ["s01", "s02"]
  },
  authUsers: [
    { username: "sysadmin", email: "sysadmin@example.com", password: "123456", userId: "u00" },
    { username: "admin", email: "demo@example.com", password: "123456", userId: "u01" },
    { username: "chenhao", email: "chenhao@example.com", password: "123456", userId: "u02" },
    { username: "mialiu", email: "mia@example.com", password: "123456", userId: "u03" },
    { username: "alexxu", email: "alex@example.com", password: "123456", userId: "u04" }
  ],
  users: [
    { id: "u00", name: "系统管理员", account: "sysadmin", phone: "13800000000", email: "sysadmin@example.com", role: "系统管理员", status: "启用", siteIds: ["s01", "s02", "s03"], createdAt: "2026-05-01 09:00", dingTalkStatus: "已绑定", dingTalkAccount: "sysadmin.dingtalk" },
    { id: "u01", name: "管理员", account: "admin", phone: "13800000001", email: "demo@example.com", role: "运营专员", status: "启用", siteIds: ["s01", "s02"], createdAt: "2026-06-01 09:00", dingTalkStatus: "已绑定", dingTalkAccount: "admin.dingtalk" },
    { id: "u02", name: "Chen Hao", account: "chenhao", phone: "13800000002", email: "chenhao@example.com", role: "业务员", status: "启用", siteIds: ["s01"], createdAt: "2026-06-08 10:20", dingTalkStatus: "已绑定", dingTalkAccount: "chenhao.sales" },
    { id: "u03", name: "Mia Liu", account: "mialiu", phone: "13800000003", email: "mia@example.com", role: "业务员", status: "启用", siteIds: ["s02"], createdAt: "2026-06-12 14:35", dingTalkStatus: "未绑定", dingTalkAccount: "" },
    { id: "u04", name: "Alex Xu", account: "alexxu", phone: "13800000004", email: "alex@example.com", role: "协同人", status: "启用", siteIds: ["s01", "s02", "s03"], createdAt: "2026-06-20 16:10", dingTalkStatus: "未绑定", dingTalkAccount: "" }
  ],
  roles: [
    { id: 1, name: "系统管理员", code: "admin", dataScope: "全部数据权限", sort: 1, status: "启用", createdAt: "2026-05-01 09:00:00", builtin: true, protected: true },
    { id: 2, name: "运营专员", code: "supervisor", dataScope: "负责站点数据权限", sort: 2, status: "启用", createdAt: "2026-05-01 09:00:00", builtin: true, protected: false },
    { id: 3, name: "业务员", code: "sales", dataScope: "仅本人数据权限", sort: 3, status: "启用", createdAt: "2026-05-01 09:00:00", builtin: true, protected: false },
    { id: 4, name: "协同人", code: "collaborator", dataScope: "授权站点数据权限", sort: 4, status: "启用", createdAt: "2026-05-01 09:00:00", builtin: true, protected: false }
  ],
  dingTalkAccounts: ["admin.dingtalk", "chenhao.sales", "mia.sales", "alex.region"],
  sites: [
    { id: "s01", name: "工业事业部官网", code: "INDUSTRIAL", domain: "industrial.example.com", status: "启用", ownerId: "u01", createdAt: "2026-05-12 09:00", boundEmailOwnerId: "u01", boundEmail: "sales@industrial.example.com", boundEmailAt: "2026-07-01 09:00", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s02", name: "玩具出口独立站", code: "TOYS", domain: "toys.example.com", status: "启用", ownerId: "u01", createdAt: "2026-05-20 14:30", boundEmailOwnerId: "u01", boundEmail: "info@toys.example.com", boundEmailAt: "2026-07-01 09:30", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s03", name: "品牌展示站", code: "BRAND", domain: "brand.example.com", status: "停用", ownerId: "u04", createdAt: "2026-06-25 16:10", config: { ai: "关闭", publicPool: "关闭", sync: "手动" } }
  ],
  dictionaries: [
    { id: "dict-source-channel", code: "sourceChannel", name: "来源渠道", domain: "客户域", tier: "business", sort: 10, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "sc1", code: "email", name: "邮件", sort: 10, status: "启用", builtin: true },
      { id: "sc2", code: "website_inquiry", name: "官网询盘", sort: 20, status: "启用", builtin: true },
      { id: "sc3", code: "organic_inquiry", name: "自然询盘", sort: 30, status: "启用", builtin: true },
      { id: "sc4", code: "whatsapp", name: "WhatsApp", sort: 40, status: "启用", builtin: true },
      { id: "sc5", code: "exhibition", name: "展会", sort: 50, status: "启用", builtin: true },
      { id: "sc6", code: "customer_referral", name: "客户转介绍", sort: 60, status: "启用", builtin: true },
      { id: "sc7", code: "other", name: "其他", sort: 999, status: "启用", builtin: true }
    ]},
    { id: "dict-entry-method", code: "entryMethod", name: "录入方式", domain: "系统域", tier: "system", sort: 20, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "em1", code: "manual_create", name: "手动新建", sort: 10, status: "启用", builtin: true },
      { id: "em2", code: "batch_import", name: "批量导入", sort: 20, status: "启用", builtin: true },
      { id: "em3", code: "inquiry_conversion", name: "询盘转入", sort: 30, status: "启用", builtin: true },
      { id: "em4", code: "api_sync", name: "API 同步", sort: 40, status: "启用", builtin: true },
      { id: "em5", code: "system_generated", name: "系统生成", sort: 50, status: "启用", builtin: true }
    ]},
    { id: "dict-follow-stage", code: "followStage", name: "跟进阶段", domain: "线索域", tier: "business", sort: 30, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "fs1", code: "awaiting_first_response", name: "待首响", sort: 10, status: "启用", builtin: true, allowConvertToCustomer: false, countAsHighIntent: false },
      { id: "fs2", code: "contacted", name: "已联系", sort: 20, status: "启用", builtin: true, allowConvertToCustomer: false, countAsHighIntent: false },
      { id: "fs3", code: "need_confirmed", name: "需求确认", sort: 30, status: "启用", builtin: true, allowConvertToCustomer: false, countAsHighIntent: false },
      { id: "fs4", code: "sampling", name: "打样阶段", sort: 40, status: "启用", builtin: true, allowConvertToCustomer: true, countAsHighIntent: true },
      { id: "fs5", code: "quotation", name: "报价阶段", sort: 50, status: "启用", builtin: true, allowConvertToCustomer: true, countAsHighIntent: true },
      { id: "fs6", code: "negotiation", name: "谈判阶段", sort: 60, status: "启用", builtin: true, allowConvertToCustomer: true, countAsHighIntent: true }
    ]},
    { id: "dict-follow-method", code: "followMethod", name: "跟进方式", domain: "线索域", tier: "business", sort: 40, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "fm1", code: "phone", name: "电话", sort: 10, status: "启用", builtin: true },
      { id: "fm2", code: "email", name: "邮件", sort: 20, status: "启用", builtin: true },
      { id: "fm3", code: "whatsapp", name: "WhatsApp", sort: 30, status: "启用", builtin: true },
      { id: "fm4", code: "meeting", name: "会议", sort: 40, status: "启用", builtin: true },
      { id: "fm5", code: "online_meeting", name: "线上会议", sort: 50, status: "启用", builtin: true },
      { id: "fm6", code: "offline_visit", name: "线下拜访", sort: 60, status: "启用", builtin: true },
      { id: "fm7", code: "note", name: "备注", sort: 70, status: "启用", builtin: true },
      { id: "fm8", code: "other", name: "其他", sort: 999, status: "启用", builtin: true }
    ]},
    { id: "dict-customer-level", code: "customerLevel", name: "客户潜质分级", domain: "客户域", tier: "business", sort: 50, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "cl1", code: "high_potential", name: "高潜客户", sort: 10, status: "启用", builtin: true, isDefault: false },
      { id: "cl2", code: "potential", name: "潜在客户", sort: 20, status: "启用", builtin: true, isDefault: true },
      { id: "cl3", code: "general", name: "一般客户", sort: 30, status: "启用", builtin: true, isDefault: false }
    ]},
    { id: "dict-customer-tag", code: "customerTag", name: "客户标签", domain: "客户域", tier: "business", sort: 60, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "ct1", code: "重点客户", name: "重点客户", sort: 1, status: "启用", builtin: true },
      { id: "ct2", code: "高潜客户", name: "高潜客户", sort: 2, status: "启用", builtin: true },
      { id: "ct3", code: "复购客户", name: "复购客户", sort: 3, status: "启用", builtin: true },
      { id: "ct4", code: "长期合作客户", name: "长期合作客户", sort: 4, status: "启用", builtin: true },
      { id: "ct5", code: "待维护客户", name: "待维护客户", sort: 5, status: "启用", builtin: true },
      { id: "ct6", code: "价格敏感客户", name: "价格敏感客户", sort: 6, status: "启用", builtin: true },
      { id: "ct7", code: "新品客户", name: "新品客户", sort: 7, status: "启用", builtin: true },
      { id: "ct8", code: "已流失风险客户", name: "已流失风险客户", sort: 8, status: "启用", builtin: true }
    ]},
    { id: "dict-lead-tag", code: "leadTag", name: "线索手动标签", domain: "线索域", tier: "business", sort: 70, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "lt1", code: "北美市场", name: "北美市场", sort: 1, status: "启用", builtin: true },
      { id: "lt2", code: "欧洲市场", name: "欧洲市场", sort: 2, status: "启用", builtin: true },
      { id: "lt3", code: "东南亚市场", name: "东南亚市场", sort: 3, status: "启用", builtin: true },
      { id: "lt4", code: "中东市场", name: "中东市场", sort: 4, status: "启用", builtin: true },
      { id: "lt5", code: "拉美市场", name: "拉美市场", sort: 5, status: "启用", builtin: true },
      { id: "lt6", code: "老客户介绍", name: "老客户介绍", sort: 6, status: "启用", builtin: true },
      { id: "lt7", code: "展会线索", name: "展会线索", sort: 7, status: "启用", builtin: true },
      { id: "lt8", code: "大额采购", name: "大额采购", sort: 8, status: "启用", builtin: true },
      { id: "lt9", code: "样品优先", name: "样品优先", sort: 9, status: "启用", builtin: true },
      { id: "lt10", code: "复购询盘", name: "复购询盘", sort: 10, status: "启用", builtin: true },
      { id: "lt11", code: "紧急订单", name: "紧急订单", sort: 11, status: "启用", builtin: true },
      { id: "lt12", code: "价格敏感", name: "价格敏感", sort: 12, status: "启用", builtin: true }
    ]},
    { id: "dict-customer-focus", code: "customerFocus", name: "客户关注选项", domain: "客户域", tier: "business", sort: 80, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "cf1", code: "price_quotation", name: "价格与报价", sort: 10, status: "启用", builtin: true, displayGroup: "商务" },
      { id: "cf2", code: "minimum_order_quantity", name: "最小起订量", sort: 20, status: "启用", builtin: true, displayGroup: "商务" },
      { id: "cf3", code: "payment_terms", name: "付款方式与账期", sort: 30, status: "启用", builtin: true, displayGroup: "商务" },
      { id: "cf4", code: "delivery_time", name: "交货周期", sort: 40, status: "启用", builtin: true, displayGroup: "交付" },
      { id: "cf5", code: "logistics", name: "物流与运输", sort: 50, status: "启用", builtin: true, displayGroup: "交付" },
      { id: "cf6", code: "product_specification", name: "产品规格与参数", sort: 60, status: "启用", builtin: true, displayGroup: "产品" },
      { id: "cf7", code: "sample", name: "样品与打样", sort: 70, status: "启用", builtin: true, displayGroup: "产品" },
      { id: "cf8", code: "customization", name: "定制/OEM/ODM", sort: 80, status: "启用", builtin: true, displayGroup: "产品" },
      { id: "cf9", code: "quality_standard", name: "质量标准", sort: 90, status: "启用", builtin: true, displayGroup: "质量" },
      { id: "cf10", code: "qualification_certificate", name: "企业资质与产品认证", sort: 100, status: "启用", builtin: true, displayGroup: "质量" },
      { id: "cf11", code: "production_capacity", name: "生产能力", sort: 110, status: "启用", builtin: true, displayGroup: "供应能力" },
      { id: "cf12", code: "after_sales_service", name: "售后服务", sort: 120, status: "启用", builtin: true, displayGroup: "服务" },
      { id: "cf13", code: "compliance", name: "合规与可持续要求", sort: 130, status: "启用", builtin: true, displayGroup: "合规" },
      { id: "cf14", code: "other", name: "其他", sort: 999, status: "启用", builtin: true, displayGroup: "其他" }
    ]},
    { id: "dict-industry", code: "industry", name: "行业", domain: "客户域", tier: "business", sort: 90, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "ind1", code: "工业制造", name: "工业制造", sort: 1, status: "启用", builtin: true },
      { id: "ind2", code: "机械设备", name: "机械设备", sort: 2, status: "启用", builtin: true },
      { id: "ind3", code: "电子电器", name: "电子电器", sort: 3, status: "启用", builtin: true },
      { id: "ind4", code: "汽车配件", name: "汽车配件", sort: 4, status: "启用", builtin: true },
      { id: "ind5", code: "玩具礼品", name: "玩具礼品", sort: 5, status: "启用", builtin: true },
      { id: "ind6", code: "家居用品", name: "家居用品", sort: 6, status: "启用", builtin: true },
      { id: "ind7", code: "纺织服装", name: "纺织服装", sort: 7, status: "启用", builtin: true },
      { id: "ind8", code: "五金工具", name: "五金工具", sort: 8, status: "启用", builtin: true },
      { id: "ind9", code: "医疗器械", name: "医疗器械", sort: 9, status: "启用", builtin: true },
      { id: "ind10", code: "化工原料", name: "化工原料", sort: 10, status: "启用", builtin: true },
      { id: "ind11", code: "农副产品", name: "农副产品", sort: 11, status: "启用", builtin: true },
      { id: "ind12", code: "其他", name: "其他", sort: 999, status: "启用", builtin: true }
    ]},
    { id: "dict-country", code: "country", name: "国家/地区", domain: "客户域", tier: "business", sort: 100, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "co1", code: "中国", name: "中国", sort: 1, status: "启用", builtin: true },
      { id: "co2", code: "美国", name: "美国", sort: 2, status: "启用", builtin: true },
      { id: "co3", code: "加拿大", name: "加拿大", sort: 3, status: "启用", builtin: true },
      { id: "co4", code: "墨西哥", name: "墨西哥", sort: 4, status: "启用", builtin: true },
      { id: "co5", code: "德国", name: "德国", sort: 5, status: "启用", builtin: true },
      { id: "co6", code: "英国", name: "英国", sort: 6, status: "启用", builtin: true },
      { id: "co7", code: "法国", name: "法国", sort: 7, status: "启用", builtin: true },
      { id: "co8", code: "意大利", name: "意大利", sort: 8, status: "启用", builtin: true },
      { id: "co9", code: "阿联酋", name: "阿联酋", sort: 9, status: "启用", builtin: true },
      { id: "co10", code: "日本", name: "日本", sort: 10, status: "启用", builtin: true },
      { id: "co11", code: "韩国", name: "韩国", sort: 11, status: "启用", builtin: true },
      { id: "co12", code: "印度", name: "印度", sort: 12, status: "启用", builtin: true },
      { id: "co13", code: "巴西", name: "巴西", sort: 13, status: "启用", builtin: true },
      { id: "co14", code: "澳大利亚", name: "澳大利亚", sort: 14, status: "启用", builtin: true },
      { id: "co15", code: "其他", name: "其他", sort: 999, status: "启用", builtin: true }
    ]},
    { id: "dict-contact-role", code: "contactRole", name: "联系角色", domain: "客户域", tier: "business", sort: 110, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "cr1", code: "decision_maker", name: "决策人", sort: 10, status: "启用", builtin: true },
      { id: "cr2", code: "purchasing_manager", name: "采购经理", sort: 20, status: "启用", builtin: true },
      { id: "cr3", code: "key_contact", name: "关键联系人", sort: 30, status: "启用", builtin: true },
      { id: "cr4", code: "execution_contact", name: "执行联系人", sort: 40, status: "启用", builtin: true },
      { id: "cr5", code: "technical_contact", name: "技术联系人", sort: 50, status: "启用", builtin: true },
      { id: "cr6", code: "financial_contact", name: "财务联系人", sort: 60, status: "启用", builtin: true },
      { id: "cr7", code: "other", name: "其他", sort: 999, status: "启用", builtin: true }
    ]},
    { id: "dict-lead-status", code: "leadStatus", name: "线索状态", domain: "线索域", tier: "controlled", sort: 120, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "ls1", code: "pending_assign", name: "待分配", sort: 10, status: "启用", builtin: true },
      { id: "ls2", code: "pending_follow_up", name: "待跟进", sort: 20, status: "启用", builtin: true },
      { id: "ls3", code: "following", name: "跟进中", sort: 30, status: "启用", builtin: true },
      { id: "ls4", code: "converted", name: "已转客户", sort: 40, status: "启用", builtin: true },
      { id: "ls5", code: "won", name: "已成交", sort: 50, status: "启用", builtin: true },
      { id: "ls6", code: "invalid", name: "无效", sort: 60, status: "启用", builtin: true },
      { id: "ls7", code: "lost", name: "丢失", sort: 70, status: "启用", builtin: true }
    ]},
    { id: "dict-contract-status", code: "contractStatus", name: "合同状态", domain: "合同域", tier: "controlled", sort: 130, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "cs1", code: "signed", name: "已签约", sort: 10, status: "启用", builtin: true },
      { id: "cs2", code: "void", name: "失效", sort: 20, status: "启用", builtin: true }
    ]},
    { id: "dict-login-method", code: "loginMethod", name: "登录方式", domain: "系统域", tier: "system", sort: 140, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "lm1", code: "password", name: "账号密码", sort: 10, status: "启用", builtin: true },
      { id: "lm2", code: "dingtalk", name: "钉钉扫码", sort: 20, status: "启用", builtin: true }
    ]},
    { id: "dict-operation-type", code: "operationType", name: "操作类型", domain: "系统域", tier: "system", sort: 150, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "ot1", code: "create", name: "新增", sort: 10, status: "启用", builtin: true },
      { id: "ot2", code: "update", name: "编辑", sort: 20, status: "启用", builtin: true },
      { id: "ot3", code: "delete", name: "删除", sort: 30, status: "启用", builtin: true },
      { id: "ot4", code: "export", name: "导出", sort: 40, status: "启用", builtin: true },
      { id: "ot5", code: "import", name: "导入", sort: 50, status: "启用", builtin: true },
      { id: "ot6", code: "login", name: "登录", sort: 60, status: "启用", builtin: true },
      { id: "ot7", code: "config", name: "配置", sort: 70, status: "启用", builtin: true }
    ]},
    { id: "dict-ai-scene", code: "aiBusinessScenario", name: "AI 业务场景", domain: "系统域", tier: "system", sort: 160, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "as1", code: "mail_intent", name: "邮件意向分析", sort: 10, status: "启用", builtin: true },
      { id: "as2", code: "wa_intent", name: "WhatsApp 意向分析", sort: 20, status: "启用", builtin: true },
      { id: "as3", code: "company_extract", name: "AI 自动提取企业信息", sort: 30, status: "启用", builtin: true },
      { id: "as4", code: "batch_refine", name: "批量 AI 提炼", sort: 40, status: "启用", builtin: true }
    ]},
    { id: "dict-ai-provider", code: "aiProvider", name: "AI 服务商", domain: "系统域", tier: "business", sort: 170, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "ap1", code: "openai", name: "OpenAI / Azure OpenAI", sort: 10, status: "启用", builtin: true },
      { id: "ap2", code: "qwen", name: "通义千问", sort: 20, status: "启用", builtin: true },
      { id: "ap3", code: "zhipu", name: "智谱 AI", sort: 30, status: "启用", builtin: true },
      { id: "ap4", code: "deepseek", name: "DeepSeek", sort: 40, status: "启用", builtin: true },
      { id: "ap5", code: "doubao", name: "豆包", sort: 50, status: "启用", builtin: true },
      { id: "ap6", code: "moonshot", name: "月之暗面", sort: 60, status: "启用", builtin: true },
      { id: "ap7", code: "ernie", name: "文心一言", sort: 70, status: "启用", builtin: true }
    ]},
    { id: "dict-ai-model", code: "aiModel", name: "AI 模型", domain: "系统域", tier: "business", sort: 180, updatedAt: "2026-07-15 10:00", updatedBy: "系统管理员", items: [
      { id: "am1", code: "gpt-4o", name: "GPT-4o", sort: 10, status: "启用", builtin: true, parentId: "ap1" },
      { id: "am2", code: "gpt-4o-mini", name: "GPT-4o-mini", sort: 20, status: "启用", builtin: true, parentId: "ap1" },
      { id: "am3", code: "gpt-4.1", name: "GPT-4.1", sort: 30, status: "启用", builtin: true, parentId: "ap1" },
      { id: "am4", code: "gpt-4.1-mini", name: "GPT-4.1-mini", sort: 40, status: "启用", builtin: true, parentId: "ap1" },
      { id: "am5", code: "Qwen-Max", name: "Qwen-Max", sort: 10, status: "启用", builtin: true, parentId: "ap2" },
      { id: "am6", code: "Qwen-Plus", name: "Qwen-Plus", sort: 20, status: "启用", builtin: true, parentId: "ap2" },
      { id: "am7", code: "Qwen-Turbo", name: "Qwen-Turbo", sort: 30, status: "启用", builtin: true, parentId: "ap2" },
      { id: "am8", code: "Qwen-Long", name: "Qwen-Long", sort: 40, status: "启用", builtin: true, parentId: "ap2" },
      { id: "am9", code: "GLM-4", name: "GLM-4", sort: 10, status: "启用", builtin: true, parentId: "ap3" },
      { id: "am10", code: "GLM-4-Plus", name: "GLM-4-Plus", sort: 20, status: "启用", builtin: true, parentId: "ap3" },
      { id: "am11", code: "GLM-4-Flash", name: "GLM-4-Flash", sort: 30, status: "启用", builtin: true, parentId: "ap3" },
      { id: "am12", code: "DeepSeek-V4-Pro", name: "DeepSeek-V4-Pro", sort: 10, status: "启用", builtin: true, parentId: "ap4" },
      { id: "am13", code: "DeepSeek-V4-Flash", name: "DeepSeek-V4-Flash", sort: 20, status: "启用", builtin: true, parentId: "ap4" },
      { id: "am14", code: "DeepSeek-Chat", name: "DeepSeek-Chat", sort: 30, status: "启用", builtin: true, parentId: "ap4" },
      { id: "am15", code: "DeepSeek-Reasoner", name: "DeepSeek-Reasoner", sort: 40, status: "启用", builtin: true, parentId: "ap4" },
      { id: "am16", code: "Doubao-1.5-Pro", name: "Doubao-1.5-Pro", sort: 10, status: "启用", builtin: true, parentId: "ap5" },
      { id: "am17", code: "Doubao-Pro", name: "Doubao-Pro", sort: 20, status: "启用", builtin: true, parentId: "ap5" },
      { id: "am18", code: "Doubao-Lite", name: "Doubao-Lite", sort: 30, status: "启用", builtin: true, parentId: "ap5" },
      { id: "am19", code: "Kimi-K2", name: "Kimi-K2", sort: 10, status: "启用", builtin: true, parentId: "ap6" },
      { id: "am20", code: "moonshot-v1", name: "moonshot-v1", sort: 20, status: "启用", builtin: true, parentId: "ap6" },
      { id: "am21", code: "ERNIE-4.0", name: "ERNIE-4.0", sort: 10, status: "启用", builtin: true, parentId: "ap7" },
      { id: "am22", code: "ERNIE-Speed", name: "ERNIE-Speed", sort: 20, status: "启用", builtin: true, parentId: "ap7" }
    ]}
  ],
  // AI 服务商/模型下拉由 dictionaries.aiProvider / aiModel 驱动（见 pages-admin）
  aiProviderOptions: ["OpenAI / Azure OpenAI", "通义千问", "智谱 AI", "DeepSeek", "豆包", "月之暗面", "文心一言"],
  aiModelOptions: {
    "OpenAI / Azure OpenAI": ["GPT-4o", "GPT-4o-mini", "GPT-4.1", "GPT-4.1-mini"],
    "通义千问": ["Qwen-Max", "Qwen-Plus", "Qwen-Turbo", "Qwen-Long"],
    "智谱 AI": ["GLM-4", "GLM-4-Plus", "GLM-4-Flash"],
    "DeepSeek": ["DeepSeek-V4-Pro", "DeepSeek-V4-Flash", "DeepSeek-Chat", "DeepSeek-Reasoner"],
    "豆包": ["Doubao-1.5-Pro", "Doubao-Pro", "Doubao-Lite"],
    "月之暗面": ["Kimi-K2", "moonshot-v1"],
    "文心一言": ["ERNIE-4.0", "ERNIE-Speed"]
  },
  aiBusinessScenes: ["邮件意向分析", "WhatsApp 意向分析", "AI 自动提取企业信息", "批量 AI 提炼"],
  purchaseIntentOptions: ["明确采购", "样品评估", "价格咨询", "复购扩展", "信息不足"],
  notificationChannels: ["站内信", "钉钉"],
  notificationTargetOptions: ["当前负责人", "创建人", "分配人", "站点运营专员", "指定用户"],
  notificationScenes: ["新线索生成", "7 天邮件客户未回复提醒", "负责人变更", "邮件未读/未回数量提醒", "邮件未读/未回超时提醒", "跟进到期提醒"],
  notificationRules: [
    { id: "nr01", scene: "新线索生成", channels: ["站内信", "钉钉"], targets: ["当前负责人"], userIds: [], title: "新线索已生成", body: "AI 已识别有效询盘并生成线索，请及时查看并跟进。", status: "开启" },
    { id: "nr02", scene: "7 天邮件客户未回复提醒", channels: ["站内信"], targets: ["当前负责人"], userIds: [], title: "客户邮件待回复", body: "客户来信已超过 7 天未回复，请及时处理。", status: "开启" },
    { id: "nr03", scene: "负责人变更", channels: ["站内信", "钉钉"], targets: ["当前负责人"], userIds: [], title: "负责人已变更", body: "业务负责人发生变化，请关注交接信息。", status: "开启" },
    { id: "nr04", scene: "邮件未读/未回数量提醒", channels: ["站内信"], targets: ["当前负责人"], userIds: [], title: "邮件未读/未回数量提醒", body: "当前存在未读或未回复邮件，请及时处理。", status: "开启" },
    { id: "nr05", scene: "邮件未读/未回超时提醒", channels: ["站内信", "钉钉"], targets: ["当前负责人"], userIds: [], title: "邮件未读/未回超时提醒", body: "存在长时间未读或未回复邮件，请及时查看。", status: "开启" },
    { id: "nr06", scene: "跟进到期提醒", channels: ["站内信"], targets: ["当前负责人"], userIds: [], title: "跟进已到期", body: "线索下次跟进时间已到期，请及时跟进。", status: "开启" }
  ],
  mailboxes: ["sales@industrial.example.com", "info@toys.example.com"],
  mailServiceConfig: {
    imapServer: "imap.qq.com",
    imapPort: 993,
    imapSsl: true,
    smtpServer: "smtp.qq.com",
    smtpPort: 465,
    smtpSsl: true,
    authMode: "LOGIN",
    pullInterval: 1800
  },
  mailAuthModes: ["LOGIN", "PLAIN", "OAUTH2", "XOAUTH2"],
  personalEmailAccounts: [
    { id: "pe01", userId: "u01", email: "sales@industrial.example.com", authCode: "******", status: "已绑定", boundAt: "2026-06-30 10:12" },
    { id: "pe02", userId: "u01", email: "info@toys.example.com", authCode: "******", status: "已绑定", boundAt: "2026-07-01 09:20" }
  ],
  dingTalkServiceConfig: {
    appKey: "ding_********",
    appSecret: "",
    callbackUrl: "https://crm.example.com/callback/dingtalk",
    corpId: "ding_corp_********",
    enabled: true
  },
  pushServiceConfig: {
    channels: ["站内信", "钉钉"],
    dingTalkRobotWebhook: "https://oapi.dingtalk.com/robot/send?access_token=********",
    inboxRetentionDays: 365
  },
  whatsappServiceConfig: {
    apiEndpoint: "https://graph.facebook.com/v20.0",
    accessToken: "******",
    webhookUrl: "https://crm.example.com/webhook/whatsapp",
    enabled: true
  },
  siteOperationData: [
    { id: "sod01", siteId: "s01", periodType: "月", period: "2026-07", adSpend: 12800, websiteVisits: 45210, inquiryCount: 186, highIntentInquiryCount: 64, inquiryConversionRate: 4.1, costPerInquiry: 68.82, costPerHighIntentInquiry: 200, avgVisitDuration: 168, bounceRate: 38.5, gscImpressions: 186000, gscClicks: 7210, gscKeywords: 1260, gscAvgPosition: 18.4 },
    { id: "sod02", siteId: "s02", periodType: "月", period: "2026-07", adSpend: 9600, websiteVisits: 38620, inquiryCount: 154, highIntentInquiryCount: 52, inquiryConversionRate: 4.0, costPerInquiry: 62.34, costPerHighIntentInquiry: 184.62, avgVisitDuration: 151, bounceRate: 41.2, gscImpressions: 143000, gscClicks: 5860, gscKeywords: 980, gscAvgPosition: 21.6 },
    { id: "sod03", siteId: "s04", periodType: "月", period: "2026-07", adSpend: 15200, websiteVisits: 42100, inquiryCount: 132, highIntentInquiryCount: 48, inquiryConversionRate: 3.1, costPerInquiry: 115.15, costPerHighIntentInquiry: 316.67, avgVisitDuration: 176, bounceRate: 35.9, gscImpressions: 165200, gscClicks: 6420, gscKeywords: 1108, gscAvgPosition: 17.9 },
    { id: "sod04", siteId: "s05", periodType: "月", period: "2026-07", adSpend: 8800, websiteVisits: 31900, inquiryCount: 118, highIntentInquiryCount: 39, inquiryConversionRate: 3.7, costPerInquiry: 74.58, costPerHighIntentInquiry: 225.64, avgVisitDuration: 142, bounceRate: 44.1, gscImpressions: 120500, gscClicks: 4920, gscKeywords: 826, gscAvgPosition: 23.8 },
    { id: "sod05", siteId: "s06", periodType: "月", period: "2026-07", adSpend: 7300, websiteVisits: 27480, inquiryCount: 96, highIntentInquiryCount: 31, inquiryConversionRate: 3.5, costPerInquiry: 76.04, costPerHighIntentInquiry: 235.48, avgVisitDuration: 133, bounceRate: 46.6, gscImpressions: 101200, gscClicks: 3880, gscKeywords: 704, gscAvgPosition: 25.3 },
    { id: "sod06", siteId: "s07", periodType: "月", period: "2026-07", adSpend: 6900, websiteVisits: 23650, inquiryCount: 82, highIntentInquiryCount: 28, inquiryConversionRate: 3.5, costPerInquiry: 84.15, costPerHighIntentInquiry: 246.43, avgVisitDuration: 129, bounceRate: 43.8, gscImpressions: 94300, gscClicks: 3610, gscKeywords: 690, gscAvgPosition: 24.7 },
    { id: "sod07", siteId: "s08", periodType: "月", period: "2026-07", adSpend: 10400, websiteVisits: 29810, inquiryCount: 105, highIntentInquiryCount: 35, inquiryConversionRate: 3.5, costPerInquiry: 99.05, costPerHighIntentInquiry: 297.14, avgVisitDuration: 139, bounceRate: 42.5, gscImpressions: 118900, gscClicks: 4388, gscKeywords: 772, gscAvgPosition: 22.1 },
    { id: "sod08", siteId: "s09", periodType: "月", period: "2026-07", adSpend: 8100, websiteVisits: 25420, inquiryCount: 88, highIntentInquiryCount: 27, inquiryConversionRate: 3.5, costPerInquiry: 92.05, costPerHighIntentInquiry: 300, avgVisitDuration: 121, bounceRate: 47.2, gscImpressions: 109600, gscClicks: 4026, gscKeywords: 721, gscAvgPosition: 26.8 },
    { id: "sod09", siteId: "s01", periodType: "周", period: "2026-W27", adSpend: 3200, websiteVisits: 11240, inquiryCount: 45, highIntentInquiryCount: 16, inquiryConversionRate: 4.0, costPerInquiry: 71.11, costPerHighIntentInquiry: 200, avgVisitDuration: 166, bounceRate: 38.1, gscImpressions: 46200, gscClicks: 1780, gscKeywords: 430, gscAvgPosition: 18.7 },
    { id: "sod10", siteId: "s02", periodType: "周", period: "2026-W27", adSpend: 2400, websiteVisits: 9620, inquiryCount: 38, highIntentInquiryCount: 12, inquiryConversionRate: 4.0, costPerInquiry: 63.16, costPerHighIntentInquiry: 200, avgVisitDuration: 149, bounceRate: 40.4, gscImpressions: 34800, gscClicks: 1390, gscKeywords: 350, gscAvgPosition: 21.2 }
  ],
  paramSettings: [
    { id: "ps01", group: "login", name: "登录超时时长", code: "session_timeout", value: "1440 分钟", desc: "无操作自动退出时长（下次登录生效）", effect: "下次登录生效" },
    { id: "ps01b", group: "login", name: "登录失败锁定次数", code: "login_fail_lock_threshold", value: "5 次", desc: "MVP 不做；二期：连续登录失败达该次数锁定账号；0 表示不锁定", effect: "立即生效", deferred: true },
    { id: "ps01c", group: "login", name: "账号锁定时长", code: "login_lock_duration", value: "30 分钟", desc: "MVP 不做；二期：触发锁定后禁止登录的时长", effect: "立即生效", deferred: true },
    { id: "ps07", group: "login", name: "单端登录限制", code: "single_login", value: "关闭", desc: "MVP 不做；二期：开启后同一账号仅允许单设备在线", effect: "下次登录生效", deferred: true },
    { id: "ps08", group: "login", name: "会话刷新间隔", code: "session_refresh_interval", value: "5 分钟", desc: "MVP 不做；二期：Token 续期间隔", effect: "下次登录生效", deferred: true },
    { id: "ps02", group: "password", name: "密码最小长度", code: "password_min_length", value: "8 位", desc: "密码长度最小值", effect: "立即生效" },
    { id: "ps03", group: "password", name: "密码复杂度", code: "password_complexity", value: "数字+大小写字母", desc: "密码字符类型要求", effect: "立即生效" },
    { id: "ps06", group: "password", name: "首次登录强制改密", code: "first_login_change_password", value: "关闭", desc: "MVP 不做；二期支持系统管理员手动开启，开启后下次登录生效", effect: "下次登录生效", deferred: true },
    { id: "ps04", group: "general", name: "列表默认每页条数", code: "list_page_size", value: "20 条", desc: "列表页默认每页条数", effect: "立即生效" },
    { id: "ps05", group: "general", name: "单次导出上限", code: "export_max_rows", value: "10000 条", desc: "列表导出最大行数限制", effect: "立即生效" }
  ],
  businessRuleSettings: [
    { id: "br01b", name: "未跟进自动回收天数", value: "14 天", desc: "MVP 不做；二期：待跟进/跟进中超时自动回收公海（公海回收最高优先级）", effect: "立即生效", deferred: true },
    { id: "br04", name: "渠道定义规则", value: "系统默认", desc: "获客分析消息渠道分类映射（邮件/WhatsApp）", effect: "立即生效" },
    { id: "br04b", name: "客户活跃度判定天数", value: "90 天", desc: "客户在该天数内有跟进/消息互动记为活跃，超过记为沉默；用于客户经营·客户活跃度分析", effect: "立即生效" },
    { id: "br05", name: "AI 功能启用", value: "开启", desc: "AI 总开关；关闭后消息意向分析、AI 自动提取企业信息等全部停用，不自动识别询盘、不自动创建线索，转人工兜底创建", effect: "立即生效" },
    { id: "br06", name: "钉钉推送启用", value: "开启", desc: "关闭后不再发送钉钉推送", effect: "立即生效" }
  ],
  systemConfig: [
    { id: "sc01", name: "AI 能力总开关", code: "aiMaster", value: true, desc: "全局启用/停用 AI 能力。关闭后 AI 能力管理页仍可见，但所有 AI 业务场景不再调用 AI。" },
    { id: "sc02", name: "AI 邮件意向分析", code: "aiEmailIntent", value: true, desc: "邮件 AI 智能分析。" },
    { id: "sc03", name: "AI WhatsApp 意向分析", code: "aiWhatsappIntent", value: true, desc: "WhatsApp AI 智能分析。" },
    { id: "sc04", name: "AI 自动提取企业信息", code: "aiExtractCompany", value: true, desc: "消息中自动识别企业名称/规模等。" },
    { id: "sc05", name: "自动创建线索", code: "autoCreateLead", value: false, desc: "陌生发件人是否自动创建线索（与系统参数联动）。" },
    { id: "sc06", name: "访客邮件采集", code: "visitorEmailCollect", value: true, desc: "接收访客邮件采集请求。" },
    { id: "sc07", name: "WhatsApp 消息接收", code: "whatsappReceive", value: true, desc: "接收 WhatsApp 消息。" },
    { id: "sc08", name: "钉钉扫码登录", code: "dingTalkLogin", value: true, desc: "是否允许钉钉扫码登录（依赖沟通服务协议配置 - 钉钉应用配置）。" },
    { id: "sc09", name: "短信验证码登录", code: "smsLogin", value: false, desc: "是否允许短信验证码登录。" },
    { id: "sc10", name: "维护模式", code: "maintenance", value: false, desc: "开启后拒绝非系统管理员登录。" }
  ],
  personalWhatsappAccount: {
    id: "pwa01",
    userId: "u02",
    account: "+1 650-123-4567",
    status: "已绑定",
    lastSyncAt: "2026-07-03 09:30",
    boundAt: "2026-06-28 15:40"
  },
  emailAccounts: [
    {
      id: "mail01",
      email: "sales@industrial.example.com",
      siteId: "s01",
      displayName: "工业事业部销售邮箱",
      provider: "Google Workspace",
      imapHost: "imap.gmail.com",
      imapPort: "993",
      imapSsl: "开启",
      imapUser: "sales@industrial.example.com",
      imapPassword: "******",
      smtpHost: "smtp.gmail.com",
      smtpPort: "465",
      smtpSsl: "开启",
      smtpUser: "sales@industrial.example.com",
      smtpPassword: "******",
      imapStatus: "已验证",
      smtpStatus: "已验证",
      isDefault: true,
      status: "启用",
      createdAt: "2026-06-18 10:20"
    },
    {
      id: "mail02",
      email: "info@toys.example.com",
      siteId: "s02",
      displayName: "玩具站询盘邮箱",
      provider: "Microsoft 365",
      imapHost: "outlook.office365.com",
      imapPort: "993",
      imapSsl: "开启",
      imapUser: "info@toys.example.com",
      imapPassword: "******",
      smtpHost: "smtp.office365.com",
      smtpPort: "587",
      smtpSsl: "开启",
      smtpUser: "info@toys.example.com",
      smtpPassword: "******",
      imapStatus: "已验证",
      smtpStatus: "已验证",
      isDefault: false,
      status: "启用",
      createdAt: "2026-06-22 14:35"
    }
  ],
  companyProfiles: [
    {
      domain: "aeromex-parts.com",
      company: "AeroMex Precision Parts S.A. de C.V.",
      shortName: "AeroMex Precision",
      basicInfo: "墨西哥航空与工业零部件采购商，长期服务北美装配工厂。",
      registrationInfo: "墨西哥城工商注册，企业状态正常。",
      industry: "航空零部件 / CNC 精密加工",
      scale: "约 280 人",
      foundedAt: "2014",
      registeredCapital: "MXN 18,000,000",
      legalRepresentative: "Elena Rodriguez",
      mainBusiness: "航空铝件、工业壳体、定制 CNC 零部件采购与供应链集成。",
      location: "Mexico City, Mexico",
      intro: "企业具备稳定季度采购计划，关注质量体系、交期和批量供货能力，适合进入重点客户跟进池。",
      exhibitions: [
        { year: "2025", name: "Mexico Aerospace Fair" },
        { year: "2024", name: "Expo Manufactura Monterrey" },
        { year: "2023", name: "FABTECH Mexico" }
      ],
      exhibitionTrend: "近三年持续参加航空制造与工业加工展会，参展频率稳定，采购活跃度较高。",
      risk: {
        operation: "经营状态正常，订单集中在航空与工业制造客户。",
        litigation: "暂无重大法律诉讼记录。",
        administrativePenalty: "未发现近期行政处罚。",
        abnormal: "未列入经营异常名录。",
        dishonesty: "未发现失信记录。",
        level: "低",
        summary: "企业经营稳定，行业匹配度高，合作风险较低，建议重点关注交期与质量认证要求。"
      },
      aiRecommendation: "客户价值较高，应优先推进样品确认、认证资料同步和季度框架报价，建议由熟悉工业件的业务员当天跟进。"
    },
    {
      domain: "playnorth.co",
      company: "PlayNorth Retail Co.",
      shortName: "PlayNorth",
      basicInfo: "北美零售活动礼品采购商，主要面向连锁商超和节日活动渠道。",
      registrationInfo: "加拿大安大略省注册，企业状态正常。",
      industry: "玩具零售 / 私标礼品",
      scale: "约 120 人",
      foundedAt: "2017",
      registeredCapital: "CAD 2,500,000",
      legalRepresentative: "Sarah Jenkins",
      mainBusiness: "毛绒玩具、私标包装、节日促销礼品采购与渠道分销。",
      location: "Ontario, Canada",
      intro: "企业采购节奏受活动节点驱动，关注认证、包装设计和交付稳定性，适合按季度活动计划推进。",
      exhibitions: [
        { year: "2025", name: "Toy Fair New York" },
        { year: "2024", name: "ABC Kids Expo" }
      ],
      exhibitionTrend: "近两年持续参加玩具和儿童消费品展会，参展活跃度中高，具备渠道拓展需求。",
      risk: {
        operation: "经营状态稳定，采购受节日活动周期影响明显。",
        litigation: "暂无重大法律诉讼记录。",
        administrativePenalty: "未发现近期行政处罚。",
        abnormal: "未列入经营异常名录。",
        dishonesty: "未发现失信记录。",
        level: "低",
        summary: "企业渠道需求明确，风险较低，但需关注旺季交付压力与认证合规要求。"
      },
      aiRecommendation: "建议按 Q4 活动节点推进阶梯报价，优先确认 EN71 认证、私标包装和交付排期。"
    },
    {
      company: "Gulf Retail Group",
      shortName: "Gulf Retail",
      basicInfo: "中东礼品与玩具渠道采购商，服务海湾地区零售门店及活动礼品项目。",
      registrationInfo: "迪拜商业注册，企业状态正常。",
      industry: "玩具礼品 / 活动零售",
      scale: "约 90 人",
      foundedAt: "2018",
      registeredCapital: "AED 3,800,000",
      legalRepresentative: "Ahmed Khan",
      mainBusiness: "毛绒玩具、活动礼品、品牌定制周边的采购与区域分销。",
      location: "Dubai, UAE",
      intro: "企业通过 WhatsApp 明确提出 8000 件、25cm、10 月前交付需求，采购窗口清晰，适合快速报价并锁定样品方案。",
      exhibitions: [
        { year: "2025", name: "Middle East Toy Fair" },
        { year: "2024", name: "Dubai Gifts & Lifestyle Expo" },
        { year: "2023", name: "Gulf Retail Week" }
      ],
      exhibitionTrend: "近三年持续参加中东玩具礼品及零售展会，参展活跃度高，具备渠道扩张和旺季采购需求。",
      risk: {
        operation: "经营正常，采购项目受活动档期和进口交付周期影响较大。",
        litigation: "未发现重大法律诉讼记录。",
        administrativePenalty: "未发现近期行政处罚。",
        abnormal: "未列入经营异常名录。",
        dishonesty: "未发现失信记录。",
        level: "中",
        summary: "企业采购潜力较高，主要风险在于交付周期紧、定制规格确认不足，建议报价前锁定包装、认证和付款条件。"
      },
      aiRecommendation: "跟进优先级高。建议当天确认 LOGO 工艺、包装方式、样品费和 8000 件交期，并在报价中提供空运/海运两套交付方案。"
    },
    {
      company: "Meyer Automation GmbH",
      shortName: "Meyer Automation",
      basicInfo: "德国自动化设备制造企业，长期采购机械五金支架及定制结构件。",
      registrationInfo: "德国慕尼黑工商注册，企业状态正常。",
      industry: "自动化设备 / 精密五金",
      scale: "约 210 人",
      foundedAt: "2011",
      registeredCapital: "EUR 2,000,000",
      legalRepresentative: "Lucas Meyer",
      mainBusiness: "自动化产线设备、机械夹具、结构件采购与设备集成。",
      location: "Munich, Germany",
      intro: "企业已有合同记录，本次 WhatsApp 咨询为复购扩展，关注历史合同价格、批次一致性和 8 月交付排期。",
      exhibitions: [
        { year: "2025", name: "Automatica Munich" },
        { year: "2024", name: "Hannover Messe" },
        { year: "2022", name: "SPS Nuremberg" }
      ],
      exhibitionTrend: "近几年持续参加德国自动化和工业制造展会，参展频率稳定，技术采购活跃度高。",
      risk: {
        operation: "经营稳定，客户历史合作记录良好。",
        litigation: "暂无重大法律诉讼记录。",
        administrativePenalty: "未发现近期行政处罚。",
        abnormal: "未列入经营异常名录。",
        dishonesty: "未发现失信记录。",
        level: "低",
        summary: "复购客户风险较低，应重点控制历史价格延续、质量一致性和交付承诺。"
      },
      aiRecommendation: "建议由原负责人跟进，引用上一份合同的规格、价格区间和质检标准，优先给出 8 月批次交付计划。"
    }
  ],
  emails: [
    {
      id: "m01",
      mailbox: "sales@industrial.example.com",
      folder: "inbox",
      from: "Elena Rodriguez <elena@aeromex-parts.com>",
      senderName: "Elena Rodriguez",
      subject: "Inquiry for custom CNC aluminum parts",
      summary: "We are looking for a supplier for CNC aluminum housings, 12,000 pcs per quarter...",
      body: "Hello, we are sourcing custom CNC aluminum housings for our Mexico assembly plant. Please share MOQ, lead time, certificates and sample policy. Expected quarterly volume is 12,000 pcs.",
      time: "2026-07-02 10:42",
      read: false,
      siteId: "s01",
      leadId: "l01",
      attachments: ["drawing-v3.pdf", "spec-sheet.xlsx"],
      aiTags: ["高意向", "批量采购", "需资质"],
      aiSummary: "客户明确给出季度采购量，关注 MOQ、交期、认证和样品政策，建议优先回复并同步技术规格确认。"
    },
    {
      id: "m02",
      mailbox: "info@toys.example.com",
      folder: "inbox",
      from: "Sarah Jenkins <purchase@playnorth.co>",
      senderName: "Sarah Jenkins",
      subject: "Plush toy private label quote",
      summary: "Can you quote plush toys with custom label and EN71 certificate?",
      body: "Hi team, we need plush toys for a retail campaign in Q4. Please quote 5,000 and 10,000 pcs options with private label, EN71 certificate and packaging design support.",
      time: "2026-07-01 16:18",
      read: true,
      siteId: "s02",
      leadId: "l02",
      attachments: ["reference-photo.jpg"],
      aiTags: ["节日订单", "定制包装"],
      aiSummary: "客户关注私标、认证与包装设计，具备明确活动节点，可作为高优先级商机推进。"
    },
    {
      id: "m03",
      mailbox: "sales@industrial.example.com",
      folder: "inbox",
      from: "unknown@protonmail.com",
      senderName: "Unknown Buyer",
      subject: "Need price quickly",
      summary: "Send me best price today for steel valves...",
      body: "Need best price today for steel valves. We buy many items. Reply soon.",
      time: "2026-06-30 09:11",
      read: false,
      siteId: "",
      leadId: "",
      attachments: [],
      aiTags: ["来源未识别", "信息不足"],
      aiSummary: "采购意图存在但身份信息不足，发件域名无法匹配站点，建议先确认公司与应用场景。"
    },
    {
      id: "m04",
      mailbox: "sales@industrial.example.com",
      folder: "sent",
      from: "管理员 <sales@industrial.example.com>",
      senderName: "管理员",
      subject: "Re: Inquiry for custom CNC aluminum parts",
      summary: "Thanks for your inquiry. We can support CNC aluminum housing...",
      body: "Thanks for your inquiry. We can support CNC aluminum housing with ISO9001 and full inspection report. Please find our initial questions attached.",
      time: "2026-07-02 11:05",
      read: true,
      siteId: "s01",
      leadId: "l01",
      attachments: ["question-list.docx"],
      aiTags: ["已回复"],
      aiSummary: "我方已完成首轮回复，下一步等待客户补充图纸细节。"
    },
    {
      id: "m05",
      mailbox: "sales@industrial.example.com",
      folder: "draft",
      from: "管理员 <sales@industrial.example.com>",
      senderName: "管理员",
      subject: "Draft: CNC sample policy",
      summary: "We can provide samples with inspection report...",
      body: "We can provide samples with inspection report. Sample fee can be refunded after bulk order confirmation.",
      time: "2026-07-02 12:18",
      read: true,
      siteId: "s01",
      leadId: "l01",
      attachments: [],
      aiTags: ["草稿"],
      aiSummary: "草稿内容围绕样品政策与批量订单抵扣规则。"
    },
    {
      id: "m06",
      mailbox: "info@toys.example.com",
      folder: "trash",
      from: "promo@unknown-mail.net",
      senderName: "Unknown Promo",
      subject: "Marketing service offer",
      summary: "We can help you reach more buyers...",
      body: "We can help you reach more buyers with advertising service.",
      time: "2026-06-29 08:30",
      read: true,
      siteId: "s02",
      leadId: "",
      attachments: [],
      aiTags: ["无效营销"],
      aiSummary: "该邮件为营销推广内容，不建议生成线索。"
    }
  ],
  whatsappConversations: [
    {
      id: "w01",
      name: "Ahmed Khan",
      phone: "+971 55 128 9012",
      company: "Gulf Retail Group",
      location: "Dubai, UAE",
      listTime: "13:37",
      unreadCount: 14,
      avatarTone: "cyan",
      previewIcon: "↘",
      siteId: "s02",
      leadId: "l03",
      customerId: "",
      lastMessageTime: "2026-07-02 13:37",
      aiTags: ["高意向", "采购经理"],
      aiSummary: "联系人连续询问报价、包装和交期，采购窗口较近，建议今天完成报价并确认样品费。",
      messages: [
        { id: "wm01", from: "customer", text: "Hi, can you make plush toys with our logo?", time: "09:20" },
        { id: "wm02", from: "me", text: "Yes, please send size and quantity requirements.", time: "09:24" },
        { id: "wm03", from: "customer", text: "Need 8000 pcs, 25cm, delivery before October.", time: "09:31" }
      ]
    },
    {
      id: "w02",
      name: "Lucas Meyer",
      phone: "+49 151 2345 7788",
      company: "Meyer Automation GmbH",
      location: "Munich, Germany",
      listTime: "11:26",
      unreadCount: 0,
      avatarTone: "sage",
      previewIcon: "✓✓",
      siteId: "s01",
      leadId: "l04",
      customerId: "c02",
      lastMessageTime: "2026-07-01 11:26",
      aiTags: ["老客户", "复购"],
      aiSummary: "该客户已有合同记录，本次咨询为复购扩展，适合由原负责人直接跟进。",
      messages: [
        { id: "wm04", from: "customer", text: "We need another batch of brackets in August.", time: "昨天" },
        { id: "wm05", from: "me", text: "I will check previous contract and send the updated quote.", time: "昨天" }
      ]
    }
  ],
  leads: [
    {
      id: "l01",
      no: "LEAD-2026-0911",
      company: "Aeromex Parts S.A.",
      contact: "Elena Rodriguez",
      email: "elena@aeromex-parts.com",
      phone: "+52 55 2012 8890",
      whatsapp: "",
      siteId: "s01",
      channel: "邮件",
      ownerId: "u02",
      status: "跟进中",
      stage: "需求确认",
      products: ["CNC 铝件", "工业壳体"],
      purchaseIntent: "明确采购",
      aiTags: ["高增长潜力", "批量采购"],
      manualTags: ["拉美市场"],
      focusPoints: ["价格", "交期"],
      remark: "客户关注认证与交期，下周样品沟通。",
      createdAt: "2026-07-02 10:42",
      updatedAt: "2026-07-02 11:10",
      lastFollowAt: "2026-07-02 11:10",
      nextFollowAt: "2026-07-04 10:00",
      customerId: "",
      aiSummary: "客户有明确季度采购量，建议快速推动样品与认证资料。"
    },
    {
      id: "l02",
      no: "LEAD-2026-0912",
      company: "PlayNorth Trading",
      contact: "Sarah Jenkins",
      email: "purchase@playnorth.co",
      phone: "+1 415 890 2211",
      siteId: "s02",
      channel: "邮件",
      ownerId: "u03",
      status: "已转客户",
      stage: "报价阶段",
      products: ["毛绒玩具", "私标包装"],
      purchaseIntent: "价格咨询",
      aiTags: ["节日订单", "认证关注"],
      manualTags: ["北美市场"],
      createdAt: "2026-07-01 16:18",
      updatedAt: "2026-07-02 09:20",
      lastFollowAt: "2026-07-02 09:20",
      nextFollowAt: "2026-07-03 14:00",
      customerId: "c03",
      aiSummary: "客户采购目标清晰，具备活动时间节点，可推进转客户并录入报价跟进。"
    },
    {
      id: "l03",
      no: "LEAD-2026-0913",
      company: "Gulf Retail Group",
      contact: "Ahmed Khan",
      email: "",
      phone: "+971 55 128 9012",
      siteId: "s02",
      channel: "WhatsApp",
      ownerId: "",
      status: "待分配",
      stage: "待首响",
      products: ["毛绒玩具", "活动礼品"],
      purchaseIntent: "明确采购",
      aiTags: ["高意向"],
      manualTags: [],
      createdAt: "2026-07-02 09:31",
      updatedAt: "2026-07-02 09:35",
      lastFollowAt: "",
      nextFollowAt: "",
      customerId: "",
      poolReason: "运营专员手动回收",
      poolEnteredAt: "2026-07-02 09:35",
      aiSummary: "WhatsApp 会话显示客户有 8000 件订单需求，已回收至公海池等待重新分配负责人。"
    },
    {
      id: "l04",
      no: "LEAD-2026-0880",
      company: "Meyer Automation GmbH",
      contact: "Lucas Meyer",
      email: "lucas@meyer-auto.de",
      phone: "+49 151 2345 7788",
      siteId: "s01",
      channel: "WhatsApp",
      ownerId: "u02",
      status: "已成交",
      stage: "谈判阶段",
      products: ["五金支架"],
      purchaseIntent: "复购扩展",
      aiTags: ["复购询盘"],
      manualTags: ["欧洲市场"],
      createdAt: "2026-07-03 13:22",
      updatedAt: "2026-07-05 10:10",
      lastFollowAt: "2026-07-05 10:10",
      nextFollowAt: "2026-07-08 10:00",
      customerId: "c02",
      aiSummary: "老客户复购，已通过合同完成成交闭环，可进入客户经营。"
    },
    {
      id: "l05",
      no: "LEAD-2026-0915",
      company: "Nordic Home Co.",
      contact: "Erik Johansson",
      email: "erik@nordichome.se",
      phone: "+46 70 123 4567",
      whatsapp: "",
      siteId: "s01",
      channel: "官网询盘",
      ownerId: "u02",
      status: "待跟进",
      stage: "待首响",
      products: ["家居五金"],
      purchaseIntent: "",
      aiTags: ["新询盘"],
      manualTags: [],
      focusPoints: ["价格"],
      remark: "",
      createdAt: "2026-07-08 09:15",
      updatedAt: "2026-07-08 09:15",
      lastFollowAt: "",
      nextFollowAt: "",
      customerId: "",
      aiSummary: "官网表单询盘，待首响。"
    }
  ],
  followLogs: [
    // —— l01 Aeromex：全生命周期示例（创建 / 状态 / 负责人 / 编辑 / 多渠道跟进）——
    { id: "f01", leadId: "l01", userId: "u02", method: "邮件", stage: "需求确认", content: "已回复客户，确认图纸版本、材料牌号和认证要求。", focusPoints: ["交期", "质量认证"], nextFollowAt: "2026-07-04 10:00", attachments: ["图纸确认邮件.pdf"], createdAt: "2026-07-02 11:10" },
    { id: "f01b", leadId: "l01", userId: "u02", method: "电话", stage: "已联系", content: "首通电话，客户确认 Q3 采购窗口，需下周前提供样品政策。", focusPoints: ["交期", "价格"], nextFollowAt: "2026-07-03 16:00", attachments: [], createdAt: "2026-07-02 10:55" },
    { id: "f01c", leadId: "l01", userId: "u02", method: "备注", stage: "已联系", content: "关注点由[价格]变更为[价格、交期]；备注由[-]变更为[客户关注认证与交期，下周样品沟通。]", focusPoints: ["价格", "交期"], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 10:50" },
    { id: "f01d", leadId: "l01", userId: "u02", method: "备注", stage: "待首响", content: "状态由[待跟进]变更为[跟进中]（首次录入跟进）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 10:48" },
    { id: "f01e", leadId: "l01", userId: "u01", method: "备注", stage: "待首响", content: "由[管理员]变更至[Chen Hao]：工业站询盘交由业务员跟进。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 10:45" },
    { id: "f01f", leadId: "l01", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）：来源邮件询盘 CNC 铝件与工业壳体。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 10:42" },
    // —— l02 PlayNorth：跟进 + 转客户相关备注 ——
    { id: "f02", leadId: "l02", userId: "u03", method: "电话", stage: "报价阶段", content: "客户希望今天收到 5000/10000 件阶梯报价。", focusPoints: ["价格"], nextFollowAt: "2026-07-03 14:00", attachments: [], createdAt: "2026-07-02 09:20" },
    { id: "f02b", leadId: "l02", userId: "u03", method: "邮件", stage: "需求确认", content: "发送 EN71 认证清单与私标包装参考图，待客户确认活动节点。", focusPoints: ["质量认证"], nextFollowAt: "2026-07-02 18:00", attachments: ["EN71清单.pdf", "包装参考.jpg"], createdAt: "2026-07-01 17:40" },
    { id: "f02c", leadId: "l02", userId: "u03", method: "备注", stage: "需求确认", content: "状态由[待跟进]变更为[跟进中]（首次录入跟进）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-01 17:05" },
    { id: "f02d", leadId: "l02", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）：PlayNorth 节日礼品询盘。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-01 16:18" },
    // —— l03 Gulf Retail：公海回收维度 ——
    { id: "f03a", leadId: "l03", userId: "u01", method: "备注", stage: "待首响", content: "运营专员手动回收至公海：原负责人暂无档期跟进，回收待重新分配。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 09:35" },
    { id: "f03b", leadId: "l03", userId: "u03", method: "WhatsApp", stage: "待首响", content: "客户确认 8000 件、25cm、10 月前交付；待报价方案。", focusPoints: ["交期", "价格"], nextFollowAt: "2026-07-03 11:00", attachments: [], createdAt: "2026-07-02 09:20" },
    { id: "f03c", leadId: "l03", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（WhatsApp AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 09:31" },
    // —— l04 Meyer：合同 / 成交闭环 ——
    { id: "f03", leadId: "l04", userId: "u02", method: "备注", stage: "谈判阶段", content: "录入合同 CON-2026-0081。", focusPoints: [], nextFollowAt: "2026-07-08 10:00", attachments: ["CON-2026-0081.pdf"], createdAt: "2026-06-20 10:10" },
    { id: "f04a", leadId: "l04", userId: "u02", method: "备注", stage: "谈判阶段", content: "状态由[已转客户]变更为[已成交]（关联已签约合同）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-06-20 10:08" },
    { id: "f04b", leadId: "l04", userId: "u02", method: "会议", stage: "谈判阶段", content: "与客户确认复购批次价格与 8 月交付排期，双方认可历史合同条款延续。", focusPoints: ["价格", "交期"], nextFollowAt: "2026-06-22 10:00", attachments: ["会议纪要.docx"], createdAt: "2026-06-18 15:30" },
    { id: "f04c", leadId: "l04", userId: "u02", method: "WhatsApp", stage: "报价阶段", content: "客户询问历史合同单价与交期，已同步报价草案。", focusPoints: ["价格"], nextFollowAt: "2026-06-16 09:00", attachments: [], createdAt: "2026-06-15 11:20" },
    { id: "f04d", leadId: "l04", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（WhatsApp AI 自动识别有效询盘）：复购询盘。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 13:22" },
    // —— l05 Nordic 官网询盘：仅创建 ——
    { id: "f05a", leadId: "l05", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（官网询盘表单接入）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-08 09:15" }
  ],
  customers: [
    {
      id: "c01",
      no: "CUS-2026-0301",
      name: "Northwind Retail Inc.",
      siteId: "s02",
      country: "美国",
      industry: "玩具礼品",
      ownerId: "u03",
      potentialLevel: "潜在客户",
      tags: ["重点客户", "新品客户"],
      leadIds: [],
      contractIds: [],
      transferRecords: [],
      aiProfile: "手动创建客户，暂无 AI 画像数据。",
      createdAt: "2026-06-12"
    },
    {
      id: "c02",
      no: "CUS-2026-0268",
      name: "Meyer Automation GmbH",
      siteId: "s01",
      country: "德国",
      industry: "机械设备",
      ownerId: "u02",
      potentialLevel: "高潜客户",
      tags: ["复购客户", "长期合作客户"],
      leadIds: ["l04"],
      contractIds: ["ct01"],
      transferRecords: [
        { id: "tr01", fromOwnerId: "u03", toOwnerId: "u02", transferredAt: "2026-06-20 10:10", operatorId: "u01", reason: "老客户复购，转由工业事业部业务员继续跟进" }
      ],
      aiProfile: "德国自动化设备制造企业，关注稳定供货、批次一致性和技术响应速度。",
      createdAt: "2026-05-20"
    },
    {
      id: "c03",
      no: "CUS-2026-0302",
      name: "PlayNorth Trading",
      siteId: "s02",
      country: "加拿大",
      industry: "玩具礼品",
      ownerId: "u03",
      potentialLevel: "潜在客户",
      tags: ["高潜客户"],
      leadIds: ["l02"],
      contractIds: [],
      transferRecords: [],
      aiProfile: "北美零售活动礼品采购商，关注 EN71 认证、私标包装和活动节点交付。",
      createdAt: "2026-07-02"
    }
  ],
  contacts: [
    { id: "p01", customerId: "c02", name: "Lucas Meyer", title: "Procurement Manager", email: "lucas@meyer-auto.de", phone: "+49 151 2345 7788", whatsapp: "+49 151 2345 7788", role: "采购经理", primary: true, aiDetected: true },
    { id: "p02", customerId: "c01", name: "Olivia Smith", title: "Buyer", email: "olivia@northwind.example", phone: "+1 408 222 1000", whatsapp: "", role: "执行联系人", primary: true, aiDetected: false }
  ],
  contracts: [
    { id: "ct01", no: "CON-2026-0081", name: "五金支架年度采购合同", customerId: "c02", leadId: "l04", amount: 45200, signedAt: "2026-06-16", createdAt: "2026-06-16 10:30", status: "已签约", ownerId: "u02", attachments: ["contract-0081.pdf"] }
  ],
  aiConfig: {
    api: {
      apiKey: "sk-proj-demo1234567890",
      baseUrl: "https://api.openai.com/v1",
      model: "GPT-4o",
      secret: "",
      timeout: 30,
      temperature: 0.2,
      maxTokens: 4096
    },
    features: {
      mailAnalysis: "开启",
      whatsappAnalysis: "开启",
      leadSummary: "开启"
    }
  },
  aiProviders: [
    {
      id: "aip01",
      name: "OpenAI / Azure OpenAI",
      capabilityName: "OpenAI-邮件/WhatsApp 意向",
      type: "大语言模型",
      defaultModel: "GPT-4o",
      businessScene: ["邮件意向分析", "WhatsApp 意向分析"],
      status: "启用",
      updatedAt: "2026-07-02 16:20",
      config: {
        api: {
          apiKey: "sk-proj-demo1234567890",
          baseUrl: "https://api.openai.com/v1",
          model: "GPT-4o",
          secret: "",
          timeout: 30,
          temperature: 0.2,
          maxTokens: 4096
        },
        features: {
          mailAnalysis: "开启",
          whatsappAnalysis: "开启",
          leadSummary: "开启"
        }
      }
    },
    {
      id: "aip02",
      name: "月之暗面",
      capabilityName: "Kimi-批量备用",
      type: "大语言模型",
      defaultModel: "Kimi-K2",
      businessScene: [],
      status: "停用",
      updatedAt: "2026-06-28 11:05",
      config: {
        api: {
          apiKey: "",
          baseUrl: "https://example.openai.azure.com",
          model: "Kimi-K2",
          secret: "",
          timeout: 45,
          temperature: 0.3,
          maxTokens: 2048
        },
        features: {
          mailAnalysis: "关闭",
          whatsappAnalysis: "关闭",
          leadSummary: "开启"
        }
      }
    }
  ],
  loginLogs: [
    { id: "lg01", account: "admin", name: "管理员", ip: "192.168.1.10", method: "账号密码", result: "成功", browser: "Chrome 126", os: "macOS", loginTime: "2026-07-08 09:12:21" },
    { id: "lg02", account: "chenhao", name: "Chen Hao", ip: "192.168.1.21", method: "钉钉扫码", result: "成功", browser: "Chrome 126", os: "Windows 11", loginTime: "2026-07-08 08:45:09" },
    { id: "lg03", account: "mialiu", name: "Mia Liu", ip: "10.0.0.32", method: "账号密码", result: "失败", browser: "Safari 17", os: "macOS", loginTime: "2026-07-07 18:30:44" },
    { id: "lg04", account: "alexxu", name: "Alex Xu", ip: "192.168.1.55", method: "账号密码", result: "成功", browser: "Edge 126", os: "Windows 11", loginTime: "2026-07-06 14:20:11" },
    { id: "lg05", account: "admin", name: "管理员", ip: "192.168.1.10", method: "账号密码", result: "成功", browser: "Chrome 126", os: "macOS", loginTime: "2026-07-05 09:05:30" }
  ],
  operateLogs: [
    { id: "op01", user: "管理员", type: "新增", object: "线索", objectName: "LEAD-2026-0911", content: "新增线索", ip: "192.168.1.10", operateTime: "2026-07-08 10:12:09" },
    { id: "op02", user: "Chen Hao", type: "编辑", object: "线索", objectName: "LEAD-2026-0911", content: "录入跟进记录", ip: "192.168.1.21", operateTime: "2026-07-08 09:20:11" },
    { id: "op03", user: "管理员", type: "导出", object: "客户", objectName: "客户列表", content: "导出当前筛选结果 CSV", ip: "192.168.1.10", operateTime: "2026-07-07 16:40:55" },
    { id: "op04", user: "Mia Liu", type: "编辑", object: "合同", objectName: "CON-2026-0081", content: "合同状态 已签约→失效", ip: "10.0.0.32", operateTime: "2026-07-06 11:15:20" }
  ],
  configChangeLogs: [
    { id: "cf01", user: "管理员", type: "配置更新", item: "公海回收超时时长", before: "7 天", after: "14 天", ip: "192.168.1.10", changeTime: "2026-07-08 11:05:18" },
    { id: "cf02", user: "管理员", type: "开关切换", item: "AI 邮件意向分析", before: "关闭", after: "开启", ip: "192.168.1.10", changeTime: "2026-07-07 10:30:42" },
    { id: "cf03", user: "管理员", type: "配置更新", item: "个人目标金额", before: "0", after: "80000", ip: "192.168.1.10", changeTime: "2026-07-05 14:12:09" }
  ],
  analytics: {
    metrics: [
      { label: "新增线索", value: 842, foot: "较上期 +4.2%" },
      { label: "待跟进", value: 37, foot: "今日待处理" },
      { label: "成交额", value: "¥4.2M", foot: "较上期 +2.1%" },
      { label: "线索转化率", value: "24.8%", foot: "行业均值 18%" }
    ],
    funnel: [25000, 12482, 8240, 3120, 1220],
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月"],
    leadsTrend: [420, 510, 660, 590, 720, 810, 842],
    amountTrend: [1.2, 1.5, 1.8, 1.7, 2.6, 3.1, 4.2],
    channels: {
      email: { total: 4520, ai: 3096, valid: "68.5%", leads: 89, conversion: "1.97%" },
      whatsapp: { total: 8912, ai: 7316, valid: "82.1%", leads: 156, conversion: "1.75%" }
    },
    customersByIndustry: { Retail: 38, Manufacturing: 28, Technology: 18, Healthcare: 9, Other: 7 },
    customersByCountry: { "United States": 32, Germany: 21, UAE: 18, Mexico: 15, Canada: 11 }
  }
};

(() => {
  const mock = window.CRM_MOCK;
  const appendById = (key, rows) => {
    const existing = new Set((mock[key] || []).map(item => item.id));
    rows.forEach(row => {
      if (!existing.has(row.id)) mock[key].push(row);
    });
  };
  const providerConfig = (name, model, enabled = true) => ({
    api: {
      apiKey: enabled ? "sk-********" : "",
      baseUrl: "https://api.example.com/v1",
      model,
      secret: "",
      timeout: 30,
      temperature: 0.2,
      maxTokens: 4096
    },
    features: {
      mailAnalysis: enabled ? "开启" : "关闭",
      whatsappAnalysis: enabled ? "开启" : "关闭",
      leadSummary: "开启"
    }
  });

  appendById("sites", [
    { id: "s04", name: "汽车零部件独立站", code: "AUTO_PARTS", domain: "auto-parts.example.com", status: "启用", ownerId: "u02", createdAt: "2026-05-28 10:30", boundEmailOwnerId: "u01", boundEmail: "quotes@auto-parts.example.com", boundEmailAt: "2026-07-01 10:00", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s05", name: "家居用品 B2B 站", code: "HOME_B2B", domain: "home.example.com", status: "启用", ownerId: "u03", createdAt: "2026-06-02 09:20", boundEmailOwnerId: "u01", boundEmail: "inquiry@home.example.com", boundEmailAt: "2026-07-01 10:10", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s06", name: "电子元件询盘站", code: "ELECTRONICS", domain: "electronics.example.com", status: "启用", ownerId: "u02", createdAt: "2026-06-06 11:15", boundEmailOwnerId: "u01", boundEmail: "sales@electronics.example.com", boundEmailAt: "2026-07-01 10:20", config: { ai: "开启", publicPool: "关闭", sync: "自动" } },
    { id: "s07", name: "医疗耗材海外站", code: "MEDICAL", domain: "medical.example.com", status: "启用", ownerId: "u03", createdAt: "2026-06-10 15:40", boundEmailOwnerId: "u01", boundEmail: "orders@medical.example.com", boundEmailAt: "2026-07-01 10:30", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s08", name: "户外装备采购站", code: "OUTDOOR", domain: "outdoor.example.com", status: "启用", ownerId: "u04", createdAt: "2026-06-16 10:05", boundEmailOwnerId: "u01", boundEmail: "contact@outdoor.example.com", boundEmailAt: "2026-07-01 10:40", config: { ai: "开启", publicPool: "开启", sync: "手动" } },
    { id: "s09", name: "包装材料询价站", code: "PACKAGING", domain: "packaging.example.com", status: "启用", ownerId: "u02", createdAt: "2026-06-21 14:10", boundEmailOwnerId: "u01", boundEmail: "rfq@packaging.example.com", boundEmailAt: "2026-07-01 10:50", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s10", name: "新能源配件展示站", code: "ENERGY", domain: "energy.example.com", status: "停用", ownerId: "u04", createdAt: "2026-06-30 17:25", config: { ai: "关闭", publicPool: "关闭", sync: "手动" } }
  ]);

  appendById("emailAccounts", [
    { id: "mail03", email: "quotes@auto-parts.example.com", siteId: "s04", displayName: "汽车零部件询价邮箱", provider: "Google Workspace", imapHost: "imap.gmail.com", imapPort: "993", imapSsl: "开启", imapUser: "quotes@auto-parts.example.com", imapPassword: "******", smtpHost: "smtp.gmail.com", smtpPort: "465", smtpSsl: "开启", smtpUser: "quotes@auto-parts.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "启用", createdAt: "2026-06-24 10:20" },
    { id: "mail04", email: "inquiry@home.example.com", siteId: "s05", displayName: "家居用品询盘邮箱", provider: "Microsoft 365", imapHost: "outlook.office365.com", imapPort: "993", imapSsl: "开启", imapUser: "inquiry@home.example.com", imapPassword: "******", smtpHost: "smtp.office365.com", smtpPort: "587", smtpSsl: "开启", smtpUser: "inquiry@home.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "启用", createdAt: "2026-06-25 14:00" },
    { id: "mail05", email: "sales@electronics.example.com", siteId: "s06", displayName: "电子元件销售邮箱", provider: "自定义邮箱", imapHost: "imap.electronics.example.com", imapPort: "993", imapSsl: "开启", imapUser: "sales@electronics.example.com", imapPassword: "******", smtpHost: "smtp.electronics.example.com", smtpPort: "465", smtpSsl: "开启", smtpUser: "sales@electronics.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "启用", createdAt: "2026-06-26 09:45" },
    { id: "mail06", email: "orders@medical.example.com", siteId: "s07", displayName: "医疗耗材订单邮箱", provider: "Google Workspace", imapHost: "imap.gmail.com", imapPort: "993", imapSsl: "开启", imapUser: "orders@medical.example.com", imapPassword: "******", smtpHost: "smtp.gmail.com", smtpPort: "465", smtpSsl: "开启", smtpUser: "orders@medical.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "启用", createdAt: "2026-06-27 16:15" },
    { id: "mail07", email: "contact@outdoor.example.com", siteId: "s08", displayName: "户外装备联系邮箱", provider: "Microsoft 365", imapHost: "outlook.office365.com", imapPort: "993", imapSsl: "开启", imapUser: "contact@outdoor.example.com", imapPassword: "******", smtpHost: "smtp.office365.com", smtpPort: "587", smtpSsl: "开启", smtpUser: "contact@outdoor.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "启用", createdAt: "2026-06-28 11:30" },
    { id: "mail08", email: "rfq@packaging.example.com", siteId: "s09", displayName: "包装材料 RFQ 邮箱", provider: "自定义邮箱", imapHost: "imap.packaging.example.com", imapPort: "993", imapSsl: "开启", imapUser: "rfq@packaging.example.com", imapPassword: "******", smtpHost: "smtp.packaging.example.com", smtpPort: "465", smtpSsl: "开启", smtpUser: "rfq@packaging.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "启用", createdAt: "2026-06-29 10:55" },
    { id: "mail09", email: "partner@brand.example.com", siteId: "s03", displayName: "品牌站合作邮箱", provider: "自定义邮箱", imapHost: "imap.brand.example.com", imapPort: "993", imapSsl: "开启", imapUser: "partner@brand.example.com", imapPassword: "******", smtpHost: "smtp.brand.example.com", smtpPort: "465", smtpSsl: "开启", smtpUser: "partner@brand.example.com", smtpPassword: "******", imapStatus: "待验证", smtpStatus: "待验证", isDefault: false, status: "停用", createdAt: "2026-07-01 09:10" },
    { id: "mail10", email: "sales@energy.example.com", siteId: "s10", displayName: "新能源配件销售邮箱", provider: "Google Workspace", imapHost: "imap.gmail.com", imapPort: "993", imapSsl: "开启", imapUser: "sales@energy.example.com", imapPassword: "******", smtpHost: "smtp.gmail.com", smtpPort: "465", smtpSsl: "开启", smtpUser: "sales@energy.example.com", smtpPassword: "******", imapStatus: "已验证", smtpStatus: "已验证", isDefault: false, status: "停用", createdAt: "2026-07-02 13:25" }
  ]);
  mock.mailboxes = mock.emailAccounts.filter(account => account.status === "启用").map(account => account.email);

  appendById("emails", [
    { id: "m07", mailbox: "quotes@auto-parts.example.com", folder: "inbox", from: "Marco Silva <procurement@andesfleet.cl>", senderName: "Marco Silva", subject: "RFQ for brake caliper brackets", summary: "Please quote 18,000 brake caliper brackets with PPAP documents...", body: "We are sourcing brake caliper brackets for fleet maintenance. Please quote 18,000 pcs with PPAP documents and delivery schedule.", time: "2026-07-03 09:15", read: false, siteId: "s04", leadId: "l05", attachments: ["rfq-caliper.pdf"], aiTags: ["批量采购", "汽车配件"], aiSummary: "客户明确数量和 PPAP 要求，可优先分配汽车零部件业务员跟进。" },
    { id: "m08", mailbox: "inquiry@home.example.com", folder: "inbox", from: "Emma Brown <buyer@casa-global.co.uk>", senderName: "Emma Brown", subject: "Kitchen organizer private label", summary: "We need private label kitchen organizers for Q4 retail shelves...", body: "Please quote kitchen organizers with private label packaging. First batch 12,000 sets, target shipment in September.", time: "2026-07-03 10:05", read: true, siteId: "s05", leadId: "l06", attachments: ["package-reference.jpg"], aiTags: ["私标", "Q4 订单"], aiSummary: "客户有明确上市节点和数量，建议同步包装方案和打样周期。" },
    { id: "m09", mailbox: "sales@electronics.example.com", folder: "inbox", from: "Daniel Park <daniel@koreatech.kr>", senderName: "Daniel Park", subject: "Connector samples request", summary: "Could you provide USB-C connector samples and datasheet?", body: "Could you provide USB-C connector samples and datasheet? We are qualifying suppliers for a smart device project.", time: "2026-07-03 11:25", read: false, siteId: "s06", leadId: "l07", attachments: ["connector-spec.xlsx"], aiTags: ["样品评估", "电子元件"], aiSummary: "客户处于供应商导入阶段，需快速提供规格书和样品政策。" },
    { id: "m10", mailbox: "orders@medical.example.com", folder: "inbox", from: "Dr. Priya Nair <sourcing@medline-in.in>", senderName: "Dr. Priya Nair", subject: "Disposable nitrile gloves tender", summary: "Tender for disposable nitrile gloves, monthly 200 cartons...", body: "We are preparing a tender for disposable nitrile gloves. Monthly demand is about 200 cartons. Please provide certificates and payment terms.", time: "2026-07-03 13:40", read: true, siteId: "s07", leadId: "l08", attachments: ["tender-terms.pdf"], aiTags: ["招标", "认证关注"], aiSummary: "客户需要资质和付款条款，建议由医疗耗材负责人跟进投标资料。" },
    { id: "m11", mailbox: "contact@outdoor.example.com", folder: "inbox", from: "Noah Wilson <noah@trailmart.com.au>", senderName: "Noah Wilson", subject: "Camping cookware quote", summary: "Quote lightweight camping cookware set, 6,000 sets...", body: "We need a quote for lightweight camping cookware set, 6,000 sets, with retail box. Please include lead time.", time: "2026-07-03 15:18", read: false, siteId: "s08", leadId: "l09", attachments: [], aiTags: ["户外装备", "价格咨询"], aiSummary: "客户询价信息完整，可按 SKU 和包装方案推进报价。" },
    { id: "m12", mailbox: "rfq@packaging.example.com", folder: "inbox", from: "Sofia Rossi <sofia@italiafoods.it>", senderName: "Sofia Rossi", subject: "Custom kraft paper bags", summary: "Looking for kraft paper bags with FSC certificate...", body: "We are looking for custom kraft paper bags with FSC certificate. Please quote 50,000 pcs and 100,000 pcs.", time: "2026-07-04 08:50", read: true, siteId: "s09", leadId: "l10", attachments: ["bag-size.pdf"], aiTags: ["包装材料", "认证关注"], aiSummary: "客户关注环保认证和阶梯报价，建议同步 MOQ、交期和打样费。" },
    { id: "m13", mailbox: "sales@industrial.example.com", folder: "inbox", from: "Henry Adams <henry@polar-mining.ca>", senderName: "Henry Adams", subject: "Machined stainless valve body", summary: "Need stainless valve body samples before annual order...", body: "We need stainless valve body samples before confirming annual order. Please share machining tolerance and QC process.", time: "2026-07-04 10:32", read: false, siteId: "s01", leadId: "l11", attachments: ["valve-drawing.step"], aiTags: ["样品评估", "工业制造"], aiSummary: "客户询问样品与质检流程，属于工业站高价值技术询盘。" },
    { id: "m14", mailbox: "info@toys.example.com", folder: "inbox", from: "Marta Lopez <marta@fiesta-shop.mx>", senderName: "Marta Lopez", subject: "Holiday plush assortment", summary: "Need holiday plush assortment with mixed SKUs...", body: "Need holiday plush assortment with mixed SKUs. Please quote 20,000 pcs and provide EN71 certificate.", time: "2026-07-04 11:46", read: false, siteId: "s02", leadId: "l12", attachments: [], aiTags: ["节日订单", "批量采购"], aiSummary: "客户需求明确且数量较大，可进入报价阶段。" },
    { id: "m15", mailbox: "quotes@auto-parts.example.com", folder: "sent", from: "管理员 <quotes@auto-parts.example.com>", senderName: "管理员", subject: "Re: RFQ for brake caliper brackets", summary: "Thanks for your RFQ, we will prepare tooling and PPAP timeline...", body: "Thanks for your RFQ. We will prepare tooling cost, PPAP timeline and mass production schedule.", time: "2026-07-03 09:48", read: true, siteId: "s04", leadId: "l05", attachments: [], aiTags: ["已回复"], aiSummary: "已完成首轮回复，下一步等待客户确认图纸版本。" },
    { id: "m16", mailbox: "inquiry@home.example.com", folder: "draft", from: "管理员 <inquiry@home.example.com>", senderName: "管理员", subject: "Draft: Kitchen organizer quotation", summary: "Draft quotation for 12,000 sets with private label packaging...", body: "Draft quotation for 12,000 sets with private label packaging and September shipment.", time: "2026-07-03 16:20", read: true, siteId: "s05", leadId: "l06", attachments: [], aiTags: ["草稿"], aiSummary: "草稿报价待补充包装费用。" },
    { id: "m17", mailbox: "sales@electronics.example.com", folder: "trash", from: "ads@unknown-tools.net", senderName: "Unknown Ads", subject: "SEO service for suppliers", summary: "We can promote your B2B website globally...", body: "We can promote your B2B website globally with SEO service.", time: "2026-07-02 18:05", read: true, siteId: "s06", leadId: "", attachments: [], aiTags: ["无效营销"], aiSummary: "推广邮件，不建议进入线索。" }
  ]);

  appendById("whatsappConversations", [
    { id: "w03", name: "Marco Silva", phone: "+56 9 2211 3488", company: "Andes Fleet Supply", location: "Santiago, Chile", listTime: "09:48", unreadCount: 2, avatarTone: "blue", previewIcon: "↘", siteId: "s04", leadId: "l05", customerId: "", lastMessageTime: "2026-07-03 09:48", aiTags: ["汽车配件", "批量采购"], aiSummary: "客户补充了年框采购计划，建议确认图纸版本。", messages: [{ id: "wm06", from: "customer", text: "Can you support PPAP level 3?", time: "09:42" }, { id: "wm07", from: "me", text: "Yes, please share the drawing revision.", time: "09:48" }] },
    { id: "w04", name: "Emma Brown", phone: "+44 7700 900321", company: "Casa Global Retail", location: "London, UK", listTime: "10:18", unreadCount: 0, avatarTone: "violet", previewIcon: "✓✓", siteId: "s05", leadId: "l06", customerId: "", lastMessageTime: "2026-07-03 10:18", aiTags: ["私标", "零售"], aiSummary: "客户确认包装方案，等待报价。", messages: [{ id: "wm08", from: "customer", text: "Please include shelf-ready box cost.", time: "10:10" }, { id: "wm09", from: "me", text: "Noted, we will include it in the quote.", time: "10:18" }] },
    { id: "w05", name: "Daniel Park", phone: "+82 10 8822 1900", company: "KoreaTech Devices", location: "Seoul, Korea", listTime: "11:31", unreadCount: 5, avatarTone: "cyan", previewIcon: "↘", siteId: "s06", leadId: "l07", customerId: "", lastMessageTime: "2026-07-03 11:31", aiTags: ["样品评估", "电子元件"], aiSummary: "客户正在导入供应商，需要样品与规格书。", messages: [{ id: "wm10", from: "customer", text: "Can you send 20 sample pcs first?", time: "11:31" }] },
    { id: "w06", name: "Priya Nair", phone: "+91 98765 10234", company: "Medline India", location: "Mumbai, India", listTime: "13:55", unreadCount: 1, avatarTone: "sage", previewIcon: "↘", siteId: "s07", leadId: "l08", customerId: "", lastMessageTime: "2026-07-03 13:55", aiTags: ["招标", "认证关注"], aiSummary: "客户需要投标资料和证书扫描件。", messages: [{ id: "wm11", from: "customer", text: "Please share CE and ISO certificates.", time: "13:55" }] },
    { id: "w07", name: "Noah Wilson", phone: "+61 412 900 778", company: "TrailMart", location: "Sydney, Australia", listTime: "15:22", unreadCount: 0, avatarTone: "amber", previewIcon: "✓✓", siteId: "s08", leadId: "l09", customerId: "", lastMessageTime: "2026-07-03 15:22", aiTags: ["户外装备"], aiSummary: "客户等待 6,000 套户外炊具报价。", messages: [{ id: "wm12", from: "customer", text: "Can you quote with retail box?", time: "15:18" }, { id: "wm13", from: "me", text: "Yes, please confirm color mix.", time: "15:22" }] },
    { id: "w08", name: "Sofia Rossi", phone: "+39 347 110 2290", company: "Italia Foods", location: "Milan, Italy", listTime: "08:58", unreadCount: 3, avatarTone: "green", previewIcon: "↘", siteId: "s09", leadId: "l10", customerId: "", lastMessageTime: "2026-07-04 08:58", aiTags: ["包装材料"], aiSummary: "客户要求 FSC 证书和阶梯报价。", messages: [{ id: "wm14", from: "customer", text: "FSC certificate is mandatory.", time: "08:58" }] },
    { id: "w09", name: "Henry Adams", phone: "+1 604 882 1900", company: "Polar Mining", location: "Vancouver, Canada", listTime: "10:36", unreadCount: 4, avatarTone: "blue", previewIcon: "↘", siteId: "s01", leadId: "l11", customerId: "", lastMessageTime: "2026-07-04 10:36", aiTags: ["工业制造", "样品评估"], aiSummary: "客户询问不锈钢阀体样品和质检流程。", messages: [{ id: "wm15", from: "customer", text: "What tolerance can you hold for the valve body?", time: "10:36" }] },
    { id: "w10", name: "Marta Lopez", phone: "+52 55 4421 0091", company: "Fiesta Shop", location: "Mexico City, Mexico", listTime: "11:52", unreadCount: 0, avatarTone: "violet", previewIcon: "✓✓", siteId: "s02", leadId: "l12", customerId: "", lastMessageTime: "2026-07-04 11:52", aiTags: ["节日订单"], aiSummary: "客户已确认节日 SKU 组合，待报价。", messages: [{ id: "wm16", from: "customer", text: "Please include 6 SKU assortment.", time: "11:46" }, { id: "wm17", from: "me", text: "We will prepare the mixed SKU quote.", time: "11:52" }] }
  ]);

  appendById("leads", [
    { id: "l05", no: "LEAD-2026-0914", company: "Andes Fleet Supply", contact: "Marco Silva", email: "procurement@andesfleet.cl", phone: "+56 9 2211 3488", siteId: "s04", channel: "邮件", entryMethod: "询盘转入", ownerId: "u02", status: "待跟进", stage: "待首响", products: ["刹车卡钳支架", "汽车冲压件"], purchaseIntent: "明确采购", aiTags: ["批量采购", "汽车配件"], manualTags: ["拉美市场"], createdAt: "2026-07-03 09:15", updatedAt: "2026-07-03 09:48", lastFollowAt: "2026-07-03 09:48", nextFollowAt: "2026-07-05 10:00", customerId: "", aiSummary: "客户要求 PPAP 文件与年度采购计划，适合快速技术评估。" },
    { id: "l06", no: "LEAD-2026-0915", company: "Casa Global Retail", contact: "Emma Brown", email: "buyer@casa-global.co.uk", phone: "+44 7700 900321", siteId: "s05", channel: "邮件", entryMethod: "询盘转入", ownerId: "u03", status: "已报价", stage: "报价阶段", products: ["厨房收纳盒", "私标包装"], purchaseIntent: "价格咨询", aiTags: ["私标", "Q4 订单"], manualTags: ["欧洲市场"], createdAt: "2026-07-03 10:05", updatedAt: "2026-07-03 16:20", lastFollowAt: "2026-07-03 16:20", nextFollowAt: "2026-07-05 15:00", customerId: "", aiSummary: "客户需要私标包装并关注上架时间，报价需包含包装方案。" },
    { id: "l07", no: "LEAD-2026-0916", company: "KoreaTech Devices", contact: "Daniel Park", email: "daniel@koreatech.kr", phone: "+82 10 8822 1900", siteId: "s06", channel: "邮件", entryMethod: "询盘转入", ownerId: "u02", status: "跟进中", stage: "打样阶段", products: ["USB-C 连接器"], purchaseIntent: "样品评估", aiTags: ["样品评估", "电子元件"], manualTags: ["东南亚市场"], createdAt: "2026-07-03 11:25", updatedAt: "2026-07-03 11:31", lastFollowAt: "2026-07-03 11:31", nextFollowAt: "2026-07-04 16:00", customerId: "", aiSummary: "客户正在进行供应商导入，需优先提供样品和规格书。" },
    { id: "l08", no: "LEAD-2026-0917", company: "Medline India", contact: "Priya Nair", email: "sourcing@medline-in.in", phone: "+91 98765 10234", siteId: "s07", channel: "邮件", entryMethod: "询盘转入", ownerId: "u03", status: "待跟进", stage: "需求确认", products: ["丁腈手套", "医疗耗材"], purchaseIntent: "明确采购", aiTags: ["招标", "认证关注"], manualTags: [], createdAt: "2026-07-03 13:40", updatedAt: "2026-07-03 13:55", lastFollowAt: "2026-07-03 13:55", nextFollowAt: "2026-07-04 11:00", customerId: "", aiSummary: "客户准备招标，需要证书和付款条款。" },
    { id: "l09", no: "LEAD-2026-0918", company: "TrailMart", contact: "Noah Wilson", email: "noah@trailmart.com.au", phone: "+61 412 900 778", siteId: "s08", channel: "WhatsApp", entryMethod: "询盘转入", ownerId: "u04", status: "已联系", stage: "需求确认", products: ["户外炊具套装"], purchaseIntent: "价格咨询", aiTags: ["户外装备"], manualTags: ["样品优先"], createdAt: "2026-07-03 15:18", updatedAt: "2026-07-03 15:22", lastFollowAt: "2026-07-03 15:22", nextFollowAt: "2026-07-05 09:30", customerId: "", aiSummary: "客户关注包装和交期，报价前需确认颜色组合。" },
    { id: "l10", no: "LEAD-2026-0919", company: "Italia Foods", contact: "Sofia Rossi", email: "sofia@italiafoods.it", phone: "+39 347 110 2290", siteId: "s09", channel: "邮件", entryMethod: "询盘转入", ownerId: "u02", status: "跟进中", stage: "报价阶段", products: ["牛皮纸袋", "食品包装"], purchaseIntent: "明确采购", aiTags: ["包装材料", "认证关注"], manualTags: ["欧洲市场"], createdAt: "2026-07-04 08:50", updatedAt: "2026-07-04 08:58", lastFollowAt: "2026-07-04 08:58", nextFollowAt: "2026-07-05 14:30", customerId: "", aiSummary: "客户关注 FSC 认证和阶梯报价，需同步 MOQ 与打样费。" },
    { id: "l11", no: "LEAD-2026-0920", company: "Polar Mining", contact: "Henry Adams", email: "henry@polar-mining.ca", phone: "+1 604 882 1900", siteId: "s01", channel: "邮件", entryMethod: "询盘转入", ownerId: "u02", status: "跟进中", stage: "打样阶段", products: ["不锈钢阀体"], purchaseIntent: "样品评估", aiTags: ["工业制造", "样品评估"], manualTags: ["北美市场"], createdAt: "2026-07-04 10:32", updatedAt: "2026-07-04 10:36", lastFollowAt: "2026-07-04 10:36", nextFollowAt: "2026-07-06 10:30", customerId: "", aiSummary: "客户有技术图纸和样品需求，建议安排工程评审。" },
    { id: "l12", no: "LEAD-2026-0921", company: "Fiesta Shop", contact: "Marta Lopez", email: "marta@fiesta-shop.mx", phone: "+52 55 4421 0091", siteId: "s02", channel: "邮件", entryMethod: "询盘转入", ownerId: "u03", status: "已报价", stage: "报价阶段", products: ["节日毛绒玩具"], purchaseIntent: "明确采购", aiTags: ["节日订单", "批量采购"], manualTags: ["拉美市场"], createdAt: "2026-07-04 11:46", updatedAt: "2026-07-04 11:52", lastFollowAt: "2026-07-04 11:52", nextFollowAt: "2026-07-06 15:00", customerId: "", aiSummary: "客户要求 6 个 SKU 组合和 EN71 证书，适合推进报价确认。" }
  ]);

  appendById("followLogs", [
    { id: "f06", leadId: "l07", userId: "u02", method: "WhatsApp", stage: "打样阶段", content: "客户申请 20 pcs 样品，已准备规格书和样品政策。", focusPoints: ["交期"], nextFollowAt: "2026-07-04 16:00", attachments: ["规格书.pdf"], createdAt: "2026-07-03 11:31" },
    { id: "f06b", leadId: "l07", userId: "u02", method: "备注", stage: "打样阶段", content: "标签新增[样品评估、电子元件]。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 11:28" },
    { id: "f06c", leadId: "l07", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 11:25" },
    { id: "f05", leadId: "l06", userId: "u03", method: "邮件", stage: "报价阶段", content: "发送私标包装报价草稿，待补充 shelf-ready box 费用。", focusPoints: ["价格"], nextFollowAt: "2026-07-05 15:00", attachments: ["报价草稿.xlsx"], createdAt: "2026-07-03 16:20" },
    { id: "f05b", leadId: "l06", userId: "u03", method: "备注", stage: "报价阶段", content: "状态由[待跟进]变更为[跟进中]（首次录入跟进）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 10:20" },
    { id: "f05c", leadId: "l06", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 10:05" },
    { id: "f07", leadId: "l08", userId: "u03", method: "WhatsApp", stage: "需求确认", content: "客户要求 CE 与 ISO 证书扫描件，已转给品控确认。", focusPoints: ["质量认证"], nextFollowAt: "2026-07-04 11:00", attachments: [], createdAt: "2026-07-03 13:55" },
    { id: "f07b", leadId: "l08", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 13:40" },
    { id: "f08", leadId: "l09", userId: "u04", method: "WhatsApp", stage: "需求确认", content: "确认户外炊具套装颜色组合和零售盒方案。", focusPoints: ["价格"], nextFollowAt: "2026-07-05 09:30", attachments: [], createdAt: "2026-07-03 15:22" },
    { id: "f08b", leadId: "l09", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（WhatsApp AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-03 15:18" },
    { id: "f09", leadId: "l10", userId: "u02", method: "WhatsApp", stage: "报价阶段", content: "客户确认 FSC 证书为必需项，准备 5 万与 10 万阶梯报价。", focusPoints: ["质量认证", "价格"], nextFollowAt: "2026-07-05 14:30", attachments: [], createdAt: "2026-07-04 08:58" },
    { id: "f09b", leadId: "l10", userId: "u01", method: "备注", stage: "报价阶段", content: "由[管理员]从公海分配至[Chen Hao]。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-04 08:55" },
    { id: "f09c", leadId: "l10", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-04 08:50" },
    { id: "f10", leadId: "l11", userId: "u02", method: "电话", stage: "打样阶段", content: "安排工程评审阀体公差和 QC 流程。", focusPoints: ["质量认证"], nextFollowAt: "2026-07-06 10:30", attachments: ["阀体图纸.step"], createdAt: "2026-07-04 10:36" },
    { id: "f10b", leadId: "l11", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-04 10:32" },
    { id: "f11", leadId: "l12", userId: "u03", method: "邮件", stage: "报价阶段", content: "确认节日 SKU 组合，准备含 EN71 证书的报价。", focusPoints: ["质量认证", "交期"], nextFollowAt: "2026-07-06 15:00", attachments: ["EN71证书.pdf"], createdAt: "2026-07-04 11:52" },
    { id: "f11b", leadId: "l12", userId: "u03", method: "备注", stage: "报价阶段", content: "更新了客户画像。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-04 11:50" },
    { id: "f11c", leadId: "l12", userId: "u00", method: "备注", stage: "待首响", content: "系统创建线索（邮件 AI 自动识别有效询盘）。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-04 11:46" },
    // l02 转客户事件备注（演示多维度）
    { id: "f02e", leadId: "l02", userId: "u03", method: "备注", stage: "报价阶段", content: "线索已转化为客户 CUS-2026-0302（PlayNorth Retail）；状态由[跟进中]变更为[已转客户]。", focusPoints: [], nextFollowAt: "", attachments: [], createdAt: "2026-07-02 09:25" }
  ]);

  appendById("customers", [
    { id: "c04", no: "CUS-2026-0303", name: "AeroMex Precision Parts", siteId: "s01", country: "墨西哥", industry: "工业制造", ownerId: "u02", potentialLevel: "高潜客户", tags: ["重点客户", "高潜客户"], leadIds: ["l01"], contractIds: [], transferRecords: [], aiProfile: "墨西哥航空与工业零部件采购商，关注认证、交付与批量稳定性。", createdAt: "2026-07-03" },
    { id: "c05", no: "CUS-2026-0304", name: "Andes Fleet Supply", siteId: "s04", country: "智利", industry: "汽车零部件", ownerId: "u02", potentialLevel: "潜在客户", tags: ["高潜客户"], leadIds: ["l05"], contractIds: ["ct02"], transferRecords: [], aiProfile: "南美车队维修供应商，有年度框架采购潜力。", createdAt: "2026-07-03" },
    { id: "c06", no: "CUS-2026-0305", name: "Casa Global Retail", siteId: "s05", country: "英国", industry: "家居用品", ownerId: "u03", potentialLevel: "潜在客户", tags: ["新品客户"], leadIds: ["l06"], contractIds: ["ct03"], transferRecords: [], aiProfile: "英国零售渠道采购商，关注私标包装与上架时间。", createdAt: "2026-07-03" },
    { id: "c07", no: "CUS-2026-0306", name: "KoreaTech Devices", siteId: "s06", country: "韩国", industry: "电子元件", ownerId: "u02", potentialLevel: "高潜客户", tags: ["高潜客户"], leadIds: ["l07"], contractIds: ["ct04"], transferRecords: [], aiProfile: "智能设备项目供应商导入阶段，重视规格稳定性和样品响应。", createdAt: "2026-07-03" },
    { id: "c08", no: "CUS-2026-0307", name: "Medline India", siteId: "s07", country: "印度", industry: "医疗耗材", ownerId: "u03", potentialLevel: "潜在客户", tags: ["重点客户"], leadIds: ["l08"], contractIds: ["ct05"], transferRecords: [], aiProfile: "医疗耗材渠道商，采购流程偏招标制，关注证书与合规资料。", createdAt: "2026-07-03" },
    { id: "c09", no: "CUS-2026-0308", name: "TrailMart", siteId: "s08", country: "澳大利亚", industry: "户外装备", ownerId: "u04", potentialLevel: "一般客户", tags: ["价格敏感客户"], leadIds: ["l09"], contractIds: ["ct06"], transferRecords: [], aiProfile: "澳洲户外用品零售商，关注包装、交期和价格区间。", createdAt: "2026-07-03" },
    { id: "c10", no: "CUS-2026-0309", name: "Italia Foods", siteId: "s09", country: "意大利", industry: "食品包装", ownerId: "u02", potentialLevel: "高潜客户", tags: ["长期合作客户"], leadIds: ["l10"], contractIds: ["ct07"], transferRecords: [], aiProfile: "食品包装采购商，重视 FSC 认证和大批量阶梯报价。", createdAt: "2026-07-04" }
  ]);

  appendById("contacts", [
    { id: "p03", customerId: "c03", name: "Sarah Jenkins", title: "Sourcing Manager", email: "purchase@playnorth.co", phone: "+1 415 890 2211", whatsapp: "+1 415 890 2211", role: "采购经理", primary: true, aiDetected: true },
    { id: "p04", customerId: "c04", name: "Elena Rodriguez", title: "Supply Chain Lead", email: "elena@aeromex-parts.com", phone: "+52 55 2012 8890", whatsapp: "", role: "决策人", primary: true, aiDetected: true },
    { id: "p05", customerId: "c05", name: "Marco Silva", title: "Procurement Lead", email: "procurement@andesfleet.cl", phone: "+56 9 2211 3488", whatsapp: "+56 9 2211 3488", role: "采购经理", primary: true, aiDetected: true },
    { id: "p06", customerId: "c06", name: "Emma Brown", title: "Category Buyer", email: "buyer@casa-global.co.uk", phone: "+44 7700 900321", whatsapp: "+44 7700 900321", role: "执行联系人", primary: true, aiDetected: true },
    { id: "p07", customerId: "c07", name: "Daniel Park", title: "Hardware PM", email: "daniel@koreatech.kr", phone: "+82 10 8822 1900", whatsapp: "+82 10 8822 1900", role: "关键联系人", primary: true, aiDetected: true },
    { id: "p08", customerId: "c08", name: "Priya Nair", title: "Tender Manager", email: "sourcing@medline-in.in", phone: "+91 98765 10234", whatsapp: "+91 98765 10234", role: "决策人", primary: true, aiDetected: true },
    { id: "p09", customerId: "c09", name: "Noah Wilson", title: "Retail Buyer", email: "noah@trailmart.com.au", phone: "+61 412 900 778", whatsapp: "+61 412 900 778", role: "采购经理", primary: true, aiDetected: true },
    { id: "p10", customerId: "c10", name: "Sofia Rossi", title: "Packaging Buyer", email: "sofia@italiafoods.it", phone: "+39 347 110 2290", whatsapp: "+39 347 110 2290", role: "执行联系人", primary: true, aiDetected: true }
  ]);

  appendById("contracts", [
    { id: "ct02", no: "CON-2026-0082", name: "刹车卡钳支架试产合同", customerId: "c05", leadId: "l05", amount: 38600, signedAt: "2026-07-04", createdAt: "2026-07-04 10:20", status: "已签约", ownerId: "u02", attachments: ["contract-0082.pdf"] },
    { id: "ct03", no: "CON-2026-0083", name: "厨房收纳盒私标包装合同", customerId: "c06", leadId: "l06", amount: 61200, signedAt: "2026-07-05", createdAt: "2026-07-05 14:05", status: "已签约", ownerId: "u03", attachments: ["contract-0083.pdf"] },
    { id: "ct04", no: "CON-2026-0084", name: "USB-C 连接器样品合同", customerId: "c07", leadId: "l07", amount: 9200, signedAt: "2026-07-05", createdAt: "2026-07-05 16:30", status: "已签约", ownerId: "u02", attachments: [] },
    { id: "ct05", no: "CON-2026-0085", name: "丁腈手套投标样品合同", customerId: "c08", leadId: "l08", amount: 18400, signedAt: "2026-07-06", createdAt: "2026-07-06 09:45", status: "已签约", ownerId: "u03", attachments: ["contract-0085.pdf"] },
    { id: "ct06", no: "CON-2026-0086", name: "户外炊具套装首批合同", customerId: "c09", leadId: "l09", amount: 27500, signedAt: "2026-07-06", createdAt: "2026-07-06 11:10", status: "已签约", ownerId: "u04", attachments: ["contract-0086.pdf"] },
    { id: "ct07", no: "CON-2026-0087", name: "牛皮纸袋年度框架合同", customerId: "c10", leadId: "l10", amount: 78200, signedAt: "2026-07-07", createdAt: "2026-07-07 10:25", status: "已签约", ownerId: "u02", attachments: ["contract-0087.pdf"] },
    { id: "ct08", no: "CON-2026-0088", name: "CNC 铝件样品合同", customerId: "c04", leadId: "l01", amount: 12800, signedAt: "2026-07-07", createdAt: "2026-07-07 14:40", status: "已签约", ownerId: "u02", attachments: [] },
    { id: "ct09", no: "CON-2026-0089", name: "节日毛绒玩具预订单", customerId: "c03", leadId: "l12", amount: 52800, signedAt: "2026-07-08", createdAt: "2026-07-08 09:50", status: "已签约", ownerId: "u03", attachments: ["contract-0089.pdf"] },
    { id: "ct10", no: "CON-2026-0090", name: "北美零售样品补充协议", customerId: "c01", leadId: "", amount: 6800, signedAt: "2026-07-08", createdAt: "2026-07-08 16:15", status: "失效", ownerId: "u03", attachments: [] }
  ]);

  appendById("aiProviders", [
    { id: "aip03", name: "通义千问", capabilityName: "通义-邮件/WhatsApp 意向", type: "大语言模型", defaultModel: "Qwen-Plus", businessScene: ["邮件意向分析", "WhatsApp 意向分析"], status: "启用", updatedAt: "2026-07-01 10:15", config: providerConfig("通义千问", "Qwen-Plus", true) },
    { id: "aip04", name: "智谱 AI", capabilityName: "智谱-批量提炼", type: "大语言模型", defaultModel: "GLM-4", businessScene: ["批量 AI 提炼"], status: "启用", updatedAt: "2026-06-30 09:25", config: providerConfig("智谱 AI", "GLM-4", true) },
    { id: "aip05", name: "DeepSeek", capabilityName: "DeepSeek-企业信息提取", type: "大语言模型", defaultModel: "DeepSeek-Chat", businessScene: ["AI 自动提取企业信息"], status: "启用", updatedAt: "2026-06-29 17:40", config: providerConfig("DeepSeek", "DeepSeek-Chat", true) },
    { id: "aip09", name: "OpenAI / Azure OpenAI", capabilityName: "OpenAI 备用通道", type: "大语言模型", defaultModel: "GPT-4o", businessScene: [], status: "停用", updatedAt: "2026-06-25 16:25", config: providerConfig("OpenAI / Azure OpenAI", "GPT-4o", false) },
    { id: "aip10", name: "豆包", capabilityName: "豆包备用", type: "大语言模型", defaultModel: "Doubao-Pro", businessScene: [], status: "停用", updatedAt: "2026-06-24 10:10", config: providerConfig("豆包", "Doubao-Pro", false) }
  ]);

  mock.customers.forEach(customer => {
    customer.contractIds = mock.contracts.filter(contract => contract.customerId === customer.id).map(contract => contract.id);
  });
})();

(() => {
  const mock = window.CRM_MOCK;
  const appendById = (key, rows) => {
    const existing = new Set((mock[key] || []).map(item => item.id));
    rows.forEach(row => {
      if (!existing.has(row.id)) mock[key].push(row);
    });
  };

  appendById("users", [
    { id: "u05", name: "Nina Wang", account: "ninawang", phone: "13800000005", email: "nina@example.com", role: "业务员", status: "启用", siteIds: ["s04"], createdAt: "2026-06-22 09:30", dingTalkStatus: "已绑定", dingTalkAccount: "nina.sales" },
    { id: "u06", name: "Owen Zhao", account: "owenzhao", phone: "13800000006", email: "owen@example.com", role: "业务员", status: "启用", siteIds: ["s05"], createdAt: "2026-06-23 10:15", dingTalkStatus: "未绑定", dingTalkAccount: "" },
    { id: "u07", name: "Sophia Lin", account: "sophialin", phone: "13800000007", email: "sophia@example.com", role: "业务员", status: "启用", siteIds: ["s06"], createdAt: "2026-06-24 11:20", dingTalkStatus: "已绑定", dingTalkAccount: "sophia.sales" },
    { id: "u08", name: "Victor Chen", account: "victorchen", phone: "13800000008", email: "victor@example.com", role: "业务员", status: "启用", siteIds: ["s07"], createdAt: "2026-06-25 14:05", dingTalkStatus: "未绑定", dingTalkAccount: "" },
    { id: "u09", name: "Ivy Huang", account: "ivyhuang", phone: "13800000009", email: "ivy@example.com", role: "业务员", status: "启用", siteIds: ["s08"], createdAt: "2026-06-26 15:10", dingTalkStatus: "已绑定", dingTalkAccount: "ivy.sales" },
    { id: "u10", name: "Leo Sun", account: "leosun", phone: "13800000010", email: "leo@example.com", role: "业务员", status: "启用", siteIds: ["s09"], createdAt: "2026-06-27 16:30", dingTalkStatus: "未绑定", dingTalkAccount: "" },
    { id: "u11", name: "Grace Xu", account: "gracexu", phone: "13800000011", email: "grace@example.com", role: "业务员", status: "启用", siteIds: ["s11"], createdAt: "2026-06-28 09:45", dingTalkStatus: "已绑定", dingTalkAccount: "grace.sales" },
    { id: "u12", name: "Ryan He", account: "ryanhe", phone: "13800000012", email: "ryan@example.com", role: "业务员", status: "启用", siteIds: ["s12"], createdAt: "2026-06-29 13:20", dingTalkStatus: "未绑定", dingTalkAccount: "" }
  ]);
  appendById("authUsers", [
    { username: "ninawang", email: "nina@example.com", password: "123456", userId: "u05" },
    { username: "owenzhao", email: "owen@example.com", password: "123456", userId: "u06" },
    { username: "sophialin", email: "sophia@example.com", password: "123456", userId: "u07" },
    { username: "victorchen", email: "victor@example.com", password: "123456", userId: "u08" },
    { username: "ivyhuang", email: "ivy@example.com", password: "123456", userId: "u09" },
    { username: "leosun", email: "leo@example.com", password: "123456", userId: "u10" },
    { username: "gracexu", email: "grace@example.com", password: "123456", userId: "u11" },
    { username: "ryanhe", email: "ryan@example.com", password: "123456", userId: "u12" }
  ]);
  mock.dingTalkAccounts = Array.from(new Set([...(mock.dingTalkAccounts || []), "nina.sales", "sophia.sales", "ivy.sales", "grace.sales"]));

  appendById("sites", [
    { id: "s11", name: "宠物用品跨境站", code: "PET_SUPPLY", domain: "pet.example.com", status: "启用", ownerId: "u11", createdAt: "2026-07-03 09:00", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s12", name: "办公文具采购站", code: "STATIONERY", domain: "stationery.example.com", status: "启用", ownerId: "u12", createdAt: "2026-07-04 10:30", config: { ai: "开启", publicPool: "开启", sync: "自动" } }
  ]);

  appendById("leads", [
    { id: "l13", no: "LEAD-2026-0922", company: "Nordic Office Supply", contact: "Lars Petersen", email: "lars@nordic-office.dk", phone: "+45 31 20 4490", siteId: "s12", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["办公收纳", "文件夹"], purchaseIntent: "信息不足", aiTags: ["办公文具"], manualTags: [], createdAt: "2026-07-04 12:10", updatedAt: "2026-07-04 12:15", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "收件邮箱未绑定用户", poolEnteredAt: "2026-07-04 12:15", aiSummary: "客户询问办公收纳报价，收件账号负责人异常，进入公海池待分配。" },
    { id: "l14", no: "LEAD-2026-0923", company: "PetJoy Retail", contact: "Chloe Martin", email: "chloe@petjoy.fr", phone: "+33 6 44 21 0098", siteId: "s11", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["宠物牵引绳", "宠物玩具"], purchaseIntent: "价格咨询", aiTags: ["宠物用品"], manualTags: [], createdAt: "2026-07-04 13:05", updatedAt: "2026-07-04 13:12", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "运营专员手动回收", poolEnteredAt: "2026-07-04 13:12", aiSummary: "客户询问宠物用品组合报价，需分配对应业务员。" },
    { id: "l15", no: "LEAD-2026-0924", company: "Baltic Tools OU", contact: "Marek Tamm", email: "marek@baltic-tools.ee", phone: "+372 5551 2234", siteId: "s01", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "无效", stage: "待首响", products: ["工业铰链"], purchaseIntent: "明确采购", aiTags: ["工业制造"], manualTags: [], createdAt: "2026-07-04 14:20", updatedAt: "2026-07-04 14:23", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "超期回收", poolEnteredAt: "2026-07-04 14:23", aiSummary: "工业件询盘超过首响时限，系统回收至公海池。" },
    { id: "l16", no: "LEAD-2026-0925", company: "Desert Kids Trading", contact: "Omar Saleh", email: "omar@desertkids.ae", phone: "+971 50 334 8812", siteId: "s02", channel: "WhatsApp", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["益智玩具"], purchaseIntent: "明确采购", aiTags: ["中东市场"], manualTags: [], createdAt: "2026-07-04 15:08", updatedAt: "2026-07-04 15:12", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "运营专员手动回收", poolEnteredAt: "2026-07-04 15:12", aiSummary: "WhatsApp 询盘数量明确，运营回收后等待重新分配。" },
    { id: "l17", no: "LEAD-2026-0926", company: "Pacific Homeware", contact: "Mia Thompson", email: "mia@pacifichome.nz", phone: "+64 21 770 332", siteId: "s05", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["厨房置物架"], purchaseIntent: "样品评估", aiTags: ["家居用品"], manualTags: [], createdAt: "2026-07-04 16:00", updatedAt: "2026-07-04 16:05", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "负责人已停用", poolEnteredAt: "2026-07-04 16:05", aiSummary: "原负责人不可用，线索进入公海池待重新分配。" },
    { id: "l18", no: "LEAD-2026-0927", company: "Sana Medical Supply", contact: "Fatima Al Noor", email: "fatima@sanamed.qa", phone: "+974 5521 1190", siteId: "s07", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["一次性口罩"], purchaseIntent: "明确采购", aiTags: ["医疗耗材"], manualTags: [], createdAt: "2026-07-04 16:40", updatedAt: "2026-07-04 16:45", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "收件邮箱未绑定用户", poolEnteredAt: "2026-07-04 16:45", aiSummary: "医疗耗材批量询盘，邮箱绑定异常导致进入公海。" },
    { id: "l19", no: "LEAD-2026-0928", company: "GreenPack Chile", contact: "Valentina Rojas", email: "valentina@greenpack.cl", phone: "+56 9 7711 3022", siteId: "s09", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "丢失", stage: "待首响", products: ["环保纸盒"], purchaseIntent: "价格咨询", aiTags: ["包装材料"], manualTags: [], createdAt: "2026-07-04 17:05", updatedAt: "2026-07-04 17:08", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "超期回收", poolEnteredAt: "2026-07-04 17:08", aiSummary: "包装材料询价超期未响应，进入公海待认领。" },
    { id: "l20", no: "LEAD-2026-0929", company: "Summit Outdoor GmbH", contact: "Felix Bauer", email: "felix@summit-outdoor.de", phone: "+49 171 2233 9090", siteId: "s08", channel: "WhatsApp", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["登山杖", "户外水壶"], purchaseIntent: "明确采购", aiTags: ["户外装备"], manualTags: [], createdAt: "2026-07-04 17:35", updatedAt: "2026-07-04 17:40", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "运营专员手动回收", poolEnteredAt: "2026-07-04 17:40", aiSummary: "户外装备组合询盘，等待运营分配负责人。" },
    { id: "l21", no: "LEAD-2026-0930", company: "Nova EV Parts", contact: "Ethan Brooks", email: "ethan@novaev.us", phone: "+1 512 800 2340", siteId: "s10", channel: "邮件", entryMethod: "询盘转入", ownerId: "", status: "待分配", stage: "待首响", products: ["新能源线束"], purchaseIntent: "样品评估", aiTags: ["新能源配件"], manualTags: [], createdAt: "2026-07-04 18:10", updatedAt: "2026-07-04 18:15", lastFollowAt: "", nextFollowAt: "", customerId: "", poolReason: "站点停用待处理", poolEnteredAt: "2026-07-04 18:15", aiSummary: "停用站点收到样品询盘，进入公海池由运营判断是否继续跟进。" }
  ]);
})();
