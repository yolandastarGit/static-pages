export const roles = [
  { id: "sales", name: "销售业务员", dataScope: "仅本人" },
  { id: "manager", name: "销售主管", dataScope: "本团队" },
  { id: "regional", name: "区域负责人", dataScope: "本区域" },
  { id: "admin", name: "系统管理员", dataScope: "全部" }
];

export const users = [
  {
    id: "u-admin",
    name: "林若宁",
    account: "admin",
    phone: "13800000001",
    email: "admin@soho-crm.cn",
    roleId: "admin",
    role: "系统管理员",
    sites: ["global-shop", "industrial-hub", "home-deco"],
    status: "启用",
    team: "平台管理",
    region: "全球"
  },
  {
    id: "u-manager",
    name: "陈启航",
    account: "manager",
    phone: "13800000002",
    email: "manager@soho-crm.cn",
    roleId: "manager",
    role: "销售主管",
    sites: ["global-shop", "industrial-hub"],
    status: "启用",
    team: "北美销售组",
    region: "北美"
  },
  {
    id: "u-sales-a",
    name: "赵思琪",
    account: "sales",
    phone: "13800000003",
    email: "sales-a@soho-crm.cn",
    roleId: "sales",
    role: "销售业务员",
    sites: ["global-shop"],
    status: "启用",
    team: "北美销售组",
    region: "北美"
  },
  {
    id: "u-sales-b",
    name: "王奕辰",
    account: "sales-b",
    phone: "13800000004",
    email: "sales-b@soho-crm.cn",
    roleId: "sales",
    role: "销售业务员",
    sites: ["industrial-hub"],
    status: "启用",
    team: "欧洲销售组",
    region: "欧洲"
  },
  {
    id: "u-regional",
    name: "周语桐",
    account: "regional",
    phone: "13800000005",
    email: "regional@soho-crm.cn",
    roleId: "regional",
    role: "区域负责人",
    sites: ["global-shop", "industrial-hub", "home-deco"],
    status: "启用",
    team: "区域管理",
    region: "全球"
  }
];

export const currentUser = users[0];

export const navigation = [
  { id: "dashboard", label: "工作台", path: "/dashboard", icon: "grid" },
  {
    id: "communication",
    label: "沟通中心",
    icon: "message",
    children: [
      { id: "mail", label: "邮件", path: "/communication/mail" },
      { id: "whatsapp", label: "WhatsApp", path: "/communication/whatsapp" }
    ]
  },
  {
    id: "leads",
    label: "线索中心",
    icon: "target",
    children: [
      { id: "lead-list", label: "线索列表", path: "/leads" },
      { id: "public-pool", label: "公海池", path: "/leads/public-pool" }
    ]
  },
  {
    id: "customers",
    label: "客户中心",
    icon: "building",
    children: [
      { id: "customer-list", label: "客户列表", path: "/customers" },
      { id: "contract-center", label: "合同中心", path: "/contracts" }
    ]
  },
  {
    id: "analytics",
    label: "分析中心",
    icon: "chart",
    children: [
      { id: "sales-analytics", label: "销售经营", path: "/analytics/sales" },
      { id: "acquisition-analytics", label: "获客分析", path: "/analytics/acquisition" },
      { id: "customer-analytics", label: "客户经营", path: "/analytics/customers" }
    ]
  },
  {
    id: "sites",
    label: "站点中心",
    icon: "globe",
    children: [{ id: "site-management", label: "站点管理", path: "/sites" }]
  },
  {
    id: "system",
    label: "系统管理",
    icon: "settings",
    children: [
      { id: "user-management", label: "用户管理", path: "/system/users" },
      { id: "system-logs", label: "系统日志", path: "/system/logs" },
      { id: "system-params", label: "系统参数", path: "/system/params" }
    ]
  }
];

export const sites = [
  {
    id: "global-shop",
    name: "全球旗舰商城",
    code: "GLOBAL-SHOP",
    domain: "https://global.example.com",
    email: "sales@global.example.com",
    whatsapp: "+1 415 010 2026",
    status: "启用",
    createdAt: "2024-11-24 14:20",
    interfaceStatus: "正常",
    lastPull: "2026-06-28 08:10 · 126 条",
    config: {
      stageCount: 6,
      publicPool: "开启",
      ai: "开启",
      rules: "开启"
    },
    stages: [
      { name: "首次联系", highIntent: false },
      { name: "需求确认", highIntent: false },
      { name: "样品阶段", highIntent: true },
      { name: "报价阶段", highIntent: true },
      { name: "合同已成交", highIntent: true }
    ]
  },
  {
    id: "industrial-hub",
    name: "工业零件独立站",
    code: "IND-HUB",
    domain: "https://industrial.example.com",
    email: "quote@industrial.example.com",
    whatsapp: "+49 30 020 2026",
    status: "启用",
    createdAt: "2025-02-18 09:35",
    interfaceStatus: "正常",
    lastPull: "2026-06-28 08:04 · 84 条",
    config: {
      stageCount: 5,
      publicPool: "关闭",
      ai: "开启",
      rules: "开启"
    },
    stages: [
      { name: "待首响", highIntent: false },
      { name: "需求确认", highIntent: false },
      { name: "已打样", highIntent: true },
      { name: "报价阶段", highIntent: true }
    ]
  },
  {
    id: "home-deco",
    name: "家居装饰品牌站",
    code: "HOME-DECO",
    domain: "https://home.example.com",
    email: "hello@home.example.com",
    whatsapp: "+44 20 010 2026",
    status: "停用",
    createdAt: "2025-08-05 16:48",
    interfaceStatus: "异常",
    lastPull: "2026-06-20 22:12 · 0 条",
    config: {
      stageCount: 4,
      publicPool: "开启",
      ai: "关闭",
      rules: "开启"
    },
    stages: [
      { name: "首次联系", highIntent: false },
      { name: "需求确认", highIntent: false },
      { name: "报价阶段", highIntent: true }
    ]
  }
];

export const leads = [
  {
    id: "lead-001",
    code: "LEAD-2026-0911",
    name: "Bella Home Deco",
    siteId: "global-shop",
    channel: "官网询盘",
    ownerId: "u-sales-a",
    status: "高意向",
    stage: "样品阶段",
    tags: ["AI:高增长潜力", "欧洲市场", "复购询盘"],
    products: ["毛绒玩具", "家居摆件", "节日礼品"],
    lastFollow: "2026-06-27 16:20",
    nextFollow: "2026-06-29",
    createdAt: "2026-06-21 10:42",
    company: "Bella Home Deco Ltd.",
    contact: "Elena Rodriguez",
    email: "elena@bellahome.co",
    phone: "+34 600 012 345",
    customerId: "cus-001",
    aiSummary: "客户关注节日礼品系列，已完成样品沟通，采购计划明确，建议推进正式报价。",
    sourceMessages: ["mail-001", "wa-001"],
    poolReason: ""
  },
  {
    id: "lead-002",
    code: "LEAD-2026-0912",
    name: "Northstar Manufacturing",
    siteId: "industrial-hub",
    channel: "邮件",
    ownerId: "u-sales-b",
    status: "跟进中",
    stage: "需求确认",
    tags: ["AI:高价值询盘", "工业零件"],
    products: ["精密加工件", "铝合金外壳"],
    lastFollow: "2026-06-26 11:05",
    nextFollow: "2026-06-30",
    createdAt: "2026-06-22 09:15",
    company: "Northstar Manufacturing Inc.",
    contact: "Michael Turner",
    email: "m.turner@northstar-mfg.com",
    phone: "+1 312 010 8899",
    customerId: "cus-002",
    aiSummary: "客户正在评估小批量定制加工供应商，对交期和质检流程较敏感。",
    sourceMessages: ["mail-002"],
    poolReason: ""
  },
  {
    id: "lead-003",
    code: "LEAD-2026-0913",
    name: "Sakura Retail Group",
    siteId: "global-shop",
    channel: "WhatsApp",
    ownerId: "",
    status: "公海待分配",
    stage: "-",
    tags: ["AI:采购主管"],
    products: ["促销礼品", "毛绒挂件"],
    lastFollow: "-",
    nextFollow: "",
    createdAt: "2026-06-24 18:30",
    company: "Sakura Retail Group",
    contact: "Aiko Tanaka",
    email: "aiko@sakura-retail.jp",
    phone: "+81 90 0101 2026",
    customerId: "",
    aiSummary: "客户通过 WhatsApp 询问促销礼品 MOQ 与交付周期，尚未分配负责人。",
    sourceMessages: ["wa-002"],
    poolReason: "自动入池"
  },
  {
    id: "lead-004",
    code: "LEAD-2026-0914",
    name: "Nordic Kids Store",
    siteId: "global-shop",
    channel: "客户转介绍",
    ownerId: "u-sales-a",
    status: "已分配",
    stage: "首次联系",
    tags: ["北欧市场"],
    products: ["儿童玩具"],
    lastFollow: "-",
    nextFollow: "2026-06-28",
    createdAt: "2026-06-25 08:45",
    company: "Nordic Kids Store ApS",
    contact: "Lars Jensen",
    email: "lars@nordickids.dk",
    phone: "+45 20 010 882",
    customerId: "",
    aiSummary: "转介绍客户，对儿童礼品系列有初步兴趣。",
    sourceMessages: [],
    poolReason: ""
  },
  {
    id: "lead-005",
    code: "LEAD-2026-0915",
    name: "Blue Ocean Trading",
    siteId: "industrial-hub",
    channel: "自然询盘",
    ownerId: "u-sales-b",
    status: "丢失",
    stage: "报价阶段",
    tags: ["价格敏感"],
    products: ["冲压件"],
    lastFollow: "2026-06-20 13:30",
    nextFollow: "",
    createdAt: "2026-06-10 15:12",
    company: "Blue Ocean Trading GmbH",
    contact: "Nina Keller",
    email: "nina@blueocean.de",
    phone: "+49 151 2026 001",
    customerId: "",
    aiSummary: "客户价格目标与当前报价差距较大，已标记丢失。",
    sourceMessages: [],
    poolReason: ""
  }
];

export const customers = [
  {
    id: "cus-001",
    code: "CUS-2026-0001",
    name: "Bella Home Deco Ltd.",
    siteId: "global-shop",
    country: "Spain",
    industry: "家居零售",
    ownerId: "u-sales-a",
    tags: ["欧洲市场", "高复购"],
    status: "潜在客户",
    website: "https://bellahome.co",
    createdAt: "2026-06-21 11:22",
    contacts: [
      {
        id: "ct-001",
        name: "Elena Rodriguez",
        title: "采购经理",
        email: "elena@bellahome.co",
        phone: "+34 600 012 345",
        whatsapp: "+34 600 012 345",
        role: "采购经理",
        primary: true,
        ai: true
      }
    ],
    aiProfile: {
      intro: "西班牙家居装饰零售企业，经营节日礼品与家居摆件。",
      business: "家居装饰、礼品零售、节日促销商品",
      scale: "中型企业 · 200-500人",
      market: "欧洲",
      risk: "暂未发现明显风险"
    }
  },
  {
    id: "cus-002",
    code: "CUS-2026-0002",
    name: "Northstar Manufacturing Inc.",
    siteId: "industrial-hub",
    country: "United States",
    industry: "工业制造",
    ownerId: "u-sales-b",
    tags: ["工业客户", "质量敏感"],
    status: "潜在客户",
    website: "https://northstar-mfg.com",
    createdAt: "2026-06-22 10:02",
    contacts: [
      {
        id: "ct-002",
        name: "Michael Turner",
        title: "供应链总监",
        email: "m.turner@northstar-mfg.com",
        phone: "+1 312 010 8899",
        whatsapp: "",
        role: "决策人",
        primary: true,
        ai: true
      }
    ],
    aiProfile: {
      intro: "北美工业零部件采购企业，重视供应稳定性与质检能力。",
      business: "精密零件采购、工业设备供应链",
      scale: "大型企业 · 1000人以上",
      market: "北美",
      risk: "交期要求严格，需重点确认产能"
    }
  },
  {
    id: "cus-003",
    code: "CUS-2026-0003",
    name: "Evergreen Market",
    siteId: "global-shop",
    country: "Canada",
    industry: "礼品批发",
    ownerId: "u-sales-a",
    tags: ["成交客户"],
    status: "已成交客户",
    website: "https://evergreen-market.ca",
    createdAt: "2026-05-14 09:10",
    contacts: [
      {
        id: "ct-003",
        name: "Olivia Brown",
        title: "Buyer",
        email: "olivia@evergreen-market.ca",
        phone: "+1 604 010 6677",
        whatsapp: "+1 604 010 6677",
        role: "关键联系人",
        primary: true,
        ai: false
      }
    ],
    aiProfile: {
      intro: "加拿大礼品批发商，长期采购节日促销品。",
      business: "礼品批发、渠道分销",
      scale: "中型企业 · 100-200人",
      market: "北美",
      risk: "无"
    }
  }
];

export const contracts = [
  {
    id: "con-001",
    code: "PC-2026-0120",
    name: "Bella Home Deco 节日礼品采购合同",
    customerId: "cus-001",
    leadId: "lead-001",
    amount: 452000,
    signedAt: "2026-06-27",
    status: "已签约",
    ownerId: "u-sales-a",
    createdAt: "2026-06-27 17:12"
  },
  {
    id: "con-002",
    code: "PC-2026-0121",
    name: "Evergreen Market 年度补货合同",
    customerId: "cus-003",
    leadId: "",
    amount: 1280000,
    signedAt: "2026-06-16",
    status: "执行中",
    ownerId: "u-sales-a",
    createdAt: "2026-06-16 10:20"
  },
  {
    id: "con-003",
    code: "PC-2026-0117",
    name: "Northstar 样品加工协议",
    customerId: "cus-002",
    leadId: "lead-002",
    amount: 86000,
    signedAt: "2026-06-24",
    status: "已完成",
    ownerId: "u-sales-b",
    createdAt: "2026-06-24 15:40"
  }
];

export const followLogs = [
  {
    id: "fl-001",
    leadId: "lead-001",
    time: "2026-06-27 16:20",
    userId: "u-sales-a",
    method: "WhatsApp",
    stage: "样品阶段",
    content: "客户确认样品规格，希望下周收到正式报价。",
    nextFollow: "2026-06-29"
  },
  {
    id: "fl-002",
    leadId: "lead-002",
    time: "2026-06-26 11:05",
    userId: "u-sales-b",
    method: "邮件",
    stage: "需求确认",
    content: "已向客户发送质检流程与交期说明，等待技术图纸。",
    nextFollow: "2026-06-30"
  },
  {
    id: "fl-003",
    leadId: "lead-004",
    time: "2026-06-25 09:18",
    userId: "u-sales-a",
    method: "电话",
    stage: "首次联系",
    content: "客户由老客户介绍，希望了解儿童礼品系列目录。",
    nextFollow: "2026-06-28"
  }
];

export const mails = [
  {
    id: "mail-001",
    folder: "收件箱",
    mailbox: "sales@global.example.com",
    from: "Elena Rodriguez <elena@bellahome.co>",
    to: "sales@global.example.com",
    subject: "Inquiry for holiday gift collection",
    summary: "We are looking for customized plush ornaments for the holiday season...",
    body: "We are looking for customized plush ornaments for the holiday season. Please share MOQ, sample lead time and packaging options.",
    time: "2026-06-28 10:42",
    unread: true,
    siteId: "global-shop",
    leadId: "lead-001",
    attachments: ["Holiday-brief.pdf"],
    ai: {
      summary: "客户询问节日礼品定制，需求明确，关注 MOQ、样品周期和包装方案。",
      company: "Bella Home Deco Ltd.",
      risk: "无明显风险",
      tags: ["高增长潜力", "节日采购"]
    }
  },
  {
    id: "mail-002",
    folder: "收件箱",
    mailbox: "quote@industrial.example.com",
    from: "Michael Turner <m.turner@northstar-mfg.com>",
    to: "quote@industrial.example.com",
    subject: "RFQ for CNC aluminum enclosure",
    summary: "Could you quote a small batch for CNC aluminum enclosures...",
    body: "Could you quote a small batch for CNC aluminum enclosures? We need details on tolerance, inspection process and lead time.",
    time: "2026-06-27 15:16",
    unread: false,
    siteId: "industrial-hub",
    leadId: "lead-002",
    attachments: ["Drawing-v2.dwg", "Specification.pdf"],
    ai: {
      summary: "客户询问 CNC 铝合金外壳小批量加工，质量和交期为关键。",
      company: "Northstar Manufacturing Inc.",
      risk: "附件包含技术图纸，需注意版本管理。",
      tags: ["高价值询盘", "质量敏感"]
    }
  },
  {
    id: "mail-003",
    folder: "未读",
    mailbox: "hello@home.example.com",
    from: "Procurement <buy@unknown.co>",
    to: "hello@home.example.com",
    subject: "Product catalog request",
    summary: "Please send your catalog and wholesale price list.",
    body: "Please send your catalog and wholesale price list.",
    time: "2026-06-26 09:10",
    unread: true,
    siteId: "",
    leadId: "",
    attachments: [],
    ai: {
      summary: "客户索取产品目录和批发价格，来源站点未识别。",
      company: "Unknown Trading",
      risk: "来源站点未匹配，请人工确认。",
      tags: ["待确认"]
    }
  }
];

export const conversations = [
  {
    id: "wa-001",
    contact: "Elena Rodriguez",
    phone: "+34 600 012 345",
    company: "Bella Home Deco Ltd.",
    location: "Spain",
    lastMessage: "Could you send the updated sample photos?",
    time: "2026-06-28 14:20",
    unread: 2,
    leadId: "lead-001",
    customerId: "cus-001",
    messages: [
      { id: "m1", from: "customer", text: "Could you send the updated sample photos?", time: "14:20", type: "text" },
      { id: "m2", from: "me", text: "Yes, I will send them within today.", time: "14:24", type: "text" }
    ],
    ai: {
      summary: "客户高频询问样品细节，采购动力较强，建议优先推进报价。",
      tags: ["高意向", "采购经理"]
    }
  },
  {
    id: "wa-002",
    contact: "Aiko Tanaka",
    phone: "+81 90 0101 2026",
    company: "Sakura Retail Group",
    location: "Japan",
    lastMessage: "What is the MOQ for promotional gifts?",
    time: "2026-06-27 18:30",
    unread: 0,
    leadId: "lead-003",
    customerId: "",
    messages: [
      { id: "m3", from: "customer", text: "What is the MOQ for promotional gifts?", time: "18:30", type: "text" }
    ],
    ai: {
      summary: "客户询问促销礼品 MOQ，尚未分配负责人。",
      tags: ["采购主管", "促销礼品"]
    }
  }
];

export const systemLogs = [
  {
    id: "log-001",
    type: "登录日志",
    time: "2026-06-28 09:00:12",
    account: "admin",
    user: "林若宁",
    ip: "10.0.0.21",
    method: "账号密码",
    result: "成功",
    browser: "Chrome",
    os: "macOS"
  },
  {
    id: "log-002",
    type: "操作日志",
    time: "2026-06-28 09:18:41",
    operator: "林若宁",
    action: "配置",
    objectType: "站点",
    objectName: "全球旗舰商城",
    content: "更新公海自动回收规则",
    ip: "10.0.0.21"
  },
  {
    id: "log-003",
    type: "操作日志",
    time: "2026-06-28 10:22:05",
    operator: "陈启航",
    action: "分配",
    objectType: "线索",
    objectName: "LEAD-2026-0913",
    content: "从公海分配至赵思琪",
    ip: "10.0.0.34"
  }
];

export const systemParams = {
  ai: {
    provider: "OpenAI",
    model: "gpt-4o",
    endpoint: "https://api.openai.com/v1",
    enabled: true,
    usage: "18,420 / 50,000"
  },
  rules: [
    { name: "有效询盘自动入池", desc: "有效询盘自动进入公海池等待分配", value: "开启" },
    { name: "采集邮箱来件自动创建线索", desc: "邮箱来件按规则生成线索", value: "开启" },
    { name: "未跟进自动回收天数", desc: "超过期限未跟进自动回收", value: "14 天" },
    { name: "新增合同自动归属客户负责人", desc: "未关联线索时合同归属客户负责人", value: "开启" }
  ],
  reminders: [
    { name: "线索分配提醒", desc: "线索分配至业务员时提醒", value: "开启" },
    { name: "待跟进提醒", desc: "下次跟进时间到期提醒", value: "开启" },
    { name: "合同签约提醒", desc: "合同签约后提醒负责人", value: "开启" }
  ],
  common: [
    { name: "登录超时时长", value: "30 分钟", desc: "用户无操作自动退出登录的时长" },
    { name: "密码最小长度", value: "8 位", desc: "密码长度最小值" },
    { name: "密码复杂度", value: "数字 + 大小写字母", desc: "密码字符类型要求" }
  ]
};

export const notifications = [
  {
    id: "noti-001",
    type: "lead",
    title: "新增线索待分配",
    summary: "Sakura Retail Group 通过 WhatsApp 提交促销礼品询盘。",
    module: "线索中心",
    time: "2026-06-28 17:42",
    read: false,
    target: "/leads/lead-003"
  },
  {
    id: "noti-002",
    type: "customer",
    title: "客户分配完成",
    summary: "Bella Home Deco Ltd. 已分配给赵思琪继续跟进。",
    module: "客户中心",
    time: "2026-06-28 16:58",
    read: false,
    target: "/customers/cus-001"
  },
  {
    id: "noti-003",
    type: "customer",
    title: "客户转交提醒",
    summary: "Northstar Manufacturing Inc. 的负责人发生变更，请关注交接记录。",
    module: "客户中心",
    time: "2026-06-28 15:31",
    read: false,
    target: "/customers/cus-002"
  },
  {
    id: "noti-004",
    type: "contract",
    title: "合同已创建",
    summary: "Bella Home Deco 节日礼品采购合同已创建，金额 ¥452,000。",
    module: "合同中心",
    time: "2026-06-28 14:20",
    read: false,
    target: "/contracts/con-001"
  },
  {
    id: "noti-005",
    type: "contract",
    title: "合同签署完成",
    summary: "Northstar 样品加工协议已完成归档。",
    module: "合同中心",
    time: "2026-06-28 13:05",
    read: false,
    target: "/contracts/con-003"
  },
  {
    id: "noti-006",
    type: "ai",
    title: "AI 分析完成",
    summary: "LEAD-2026-0912 已生成企业画像与风险摘要。",
    module: "AI",
    time: "2026-06-28 11:46",
    read: false,
    target: "/leads/lead-002"
  },
  {
    id: "noti-007",
    type: "system",
    title: "系统公告",
    summary: "系统将于今晚 23:30 进行例行维护，预计持续 10 分钟。",
    module: "系统管理",
    time: "2026-06-28 10:30",
    read: true,
    target: "/system/params"
  },
  {
    id: "noti-008",
    type: "system",
    title: "系统异常提醒",
    summary: "工业站点消息拉取接口出现短暂异常，请查看站点状态。",
    module: "系统管理",
    time: "2026-06-28 09:42",
    read: true,
    target: "/sites/industrial-hub"
  },
  {
    id: "noti-009",
    type: "system",
    title: "登录提醒",
    summary: "账号 admin 于 10.0.0.21 成功登录。",
    module: "系统管理",
    time: "2026-06-28 09:16",
    read: true,
    target: "/system/logs"
  },
  {
    id: "noti-010",
    type: "site",
    title: "站点配置更新",
    summary: "全球旗舰商城已更新公海自动回收规则。",
    module: "站点中心",
    time: "2026-06-28 09:02",
    read: true,
    target: "/sites/global-shop/config"
  }
];

export function siteName(siteId) {
  return sites.find((site) => site.id === siteId)?.name || "-";
}

export function userName(userId) {
  return users.find((user) => user.id === userId)?.name || "未分配";
}

export function customerName(customerId) {
  return customers.find((customer) => customer.id === customerId)?.name || "-";
}

export function leadName(leadId) {
  return leads.find((lead) => lead.id === leadId)?.name || "-";
}

export function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN")}`;
}

export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}
