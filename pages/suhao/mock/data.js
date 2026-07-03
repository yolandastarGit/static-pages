window.CRM_MOCK = {
  currentUser: {
    id: "u01",
    name: "管理员",
    role: "销售主管",
    roleCode: "supervisor",
    avatar: "AD",
    sites: ["s01", "s02"]
  },
  authUsers: [
    { username: "admin", email: "demo@example.com", password: "123456", userId: "u01" }
  ],
  users: [
    { id: "u01", name: "管理员", role: "销售主管", status: "启用", siteIds: ["s01", "s02"] },
    { id: "u02", name: "Chen Hao", role: "业务员", status: "启用", siteIds: ["s01"] },
    { id: "u03", name: "Mia Liu", role: "业务员", status: "启用", siteIds: ["s02"] },
    { id: "u04", name: "Alex Xu", role: "区域负责人", status: "启用", siteIds: ["s01", "s02", "s03"] }
  ],
  sites: [
    { id: "s01", name: "工业事业部官网", code: "INDUSTRIAL", domain: "industrial.example.com", status: "启用", ownerId: "u01", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s02", name: "玩具出口独立站", code: "TOYS", domain: "toys.example.com", status: "启用", ownerId: "u01", config: { ai: "开启", publicPool: "开启", sync: "自动" } },
    { id: "s03", name: "品牌展示站", code: "BRAND", domain: "brand.example.com", status: "停用", ownerId: "u04", config: { ai: "关闭", publicPool: "关闭", sync: "手动" } }
  ],
  customerTags: ["北美零售", "私标客户", "德国客户", "复购", "重点客户", "长期跟进"],
  leadTags: ["墨西哥市场", "北美零售", "德国客户", "手动录入", "大额采购", "样品优先"],
  contactTags: ["采购经理", "决策人", "技术联系人", "财务联系人", "重点联系人"],
  purchaseIntentOptions: ["明确采购", "样品评估", "价格咨询", "复购扩展", "信息不足"],
  notificationChannels: ["站内信", "钉钉"],
  notificationTargetOptions: ["当前负责人", "创建人", "分配人", "部门负责人", "指定用户"],
  notificationScenes: ["新线索分配", "新客户分配", "商机阶段变更", "合同到期提醒", "线索状态变更", "待跟进超时", "客户转移", "合同创建", "合同状态变更", "邮件未读数量提醒", "邮件未读超时提醒"],
  notificationRules: [
    { id: "nr01", scene: "新线索分配", channels: ["站内信", "钉钉"], targets: ["当前负责人", "部门负责人"], userIds: [], title: "新线索已分配", body: "您有一条新的线索需要跟进，请及时查看线索详情。", status: "开启" },
    { id: "nr02", scene: "新客户分配", channels: ["站内信"], targets: ["当前负责人"], userIds: [], title: "新客户已分配", body: "系统已为您分配新客户，请完善客户信息并建立跟进计划。", status: "开启" },
    { id: "nr03", scene: "商机阶段变更", channels: ["站内信", "钉钉"], targets: ["当前负责人", "创建人"], userIds: [], title: "商机阶段已变更", body: "商机阶段发生变化，请关注后续处理动作。", status: "开启" },
    { id: "nr04", scene: "合同到期提醒", channels: ["站内信"], targets: ["当前负责人", "部门负责人"], userIds: [], title: "合同即将到期", body: "合同即将到期，请提前确认续约或关闭计划。", status: "关闭" },
    { id: "nr05", scene: "线索状态变更", channels: ["站内信"], targets: ["当前负责人"], userIds: [], title: "线索状态变更", body: "线索状态已更新，请查看最新状态。", status: "开启" },
    { id: "nr06", scene: "待跟进超时", channels: ["站内信", "钉钉"], targets: ["当前负责人"], userIds: [], title: "待跟进超时提醒", body: "存在超时未跟进线索，请尽快处理。", status: "开启" },
    { id: "nr07", scene: "客户转移", channels: ["站内信"], targets: ["当前负责人", "分配人"], userIds: [], title: "客户已转移", body: "客户负责人发生变化，请关注客户交接信息。", status: "开启" },
    { id: "nr08", scene: "合同创建", channels: ["站内信"], targets: ["创建人", "部门负责人"], userIds: [], title: "合同已创建", body: "新的合同记录已创建，请关注审批和履约进度。", status: "开启" },
    { id: "nr09", scene: "合同状态变更", channels: ["站内信"], targets: ["当前负责人", "创建人"], userIds: [], title: "合同状态变更", body: "合同状态已更新，请查看合同详情。", status: "开启" },
    { id: "nr10", scene: "邮件未读数量提醒", channels: ["站内信"], targets: ["当前负责人"], userIds: [], title: "邮件未读数量提醒", body: "当前存在较多未读邮件，请及时处理。", status: "开启" },
    { id: "nr11", scene: "邮件未读超时提醒", channels: ["站内信", "钉钉"], targets: ["当前负责人", "部门负责人"], userIds: [], title: "邮件未读超时提醒", body: "存在长时间未读邮件，请及时查看并跟进。", status: "开启" }
  ],
  mailboxes: ["sales@industrial.example.com", "info@toys.example.com"],
  mailServiceConfig: {
    imapServer: "imap.qq.com",
    imapPort: 993,
    imapSsl: true,
    smtpServer: "smtp.qq.com",
    smtpPort: 465,
    smtpSsl: true,
    masterUsername: "719869119@qq.com",
    masterPassword: "",
    authMode: "MASTER_PASSWORD（子邮箱授权码）",
    pullInterval: 1800
  },
  whatsappServiceConfig: {
    provider: "Meta Cloud API",
    baseUrl: "https://graph.facebook.com/v20.0",
    apiKey: "wa_********",
    accessToken: "token_********",
    appId: "app_102938",
    appSecret: "secret_********",
    businessAccountId: "biz_829103",
    phoneNumberId: "phone_561829",
    webhookUrl: "https://crm.example.com/webhook/whatsapp",
    webhookVerifyToken: "verify_********",
    callbackUrl: "https://crm.example.com/callback/whatsapp",
    timeout: 30,
    retryCount: 3,
    enabled: true,
    defaultSender: "+1 650-123-4567"
  },
  personalEmailAccounts: [
    { id: "pe01", userId: "u01", email: "demo@example.com", isDefault: true, status: "已验证", boundAt: "2026-06-30 10:12" },
    { id: "pe02", userId: "u01", email: "demo.work@example.com", isDefault: false, status: "已验证", boundAt: "2026-07-01 09:20" }
  ],
  personalWhatsappAccount: {
    id: "pwa01",
    userId: "u01",
    account: "+1 650-123-4567",
    status: "已绑定",
    lastSyncAt: "2026-07-03 09:30",
    boundAt: "2026-06-28 15:40"
  },
  emailAccounts: [
    {
      id: "mail01",
      email: "sales@industrial.example.com",
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
      aiTags: ["来源待确认", "信息不足"],
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
      siteId: "s01",
      channel: "邮件",
      ownerId: "u02",
      status: "跟进中",
      stage: "需求确认",
      products: ["CNC 铝件", "工业壳体"],
      purchaseIntent: "明确采购",
      aiTags: ["高增长潜力", "批量采购"],
      manualTags: ["墨西哥市场"],
      createdAt: "2026-06-28 10:42",
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
      status: "高意向",
      stage: "报价",
      products: ["毛绒玩具", "私标包装"],
      purchaseIntent: "价格咨询",
      aiTags: ["节日订单", "认证关注"],
      manualTags: ["北美零售"],
      createdAt: "2026-07-01 16:18",
      lastFollowAt: "2026-07-02 09:20",
      nextFollowAt: "2026-07-03 14:00",
      customerId: "",
      aiSummary: "客户采购目标清晰，具备活动时间节点，可推进转高意向客户并录入报价跟进。"
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
      status: "公海待分配",
      stage: "待首响",
      products: ["毛绒玩具", "活动礼品"],
      purchaseIntent: "明确采购",
      aiTags: ["高意向"],
      manualTags: [],
      createdAt: "2026-07-02 09:31",
      lastFollowAt: "",
      nextFollowAt: "",
      customerId: "",
      poolReason: "系统采集",
      poolEnteredAt: "2026-07-02 09:35",
      aiSummary: "WhatsApp 会话显示客户有 8000 件订单需求，需要尽快分配负责人。"
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
      stage: "合同已成交",
      products: ["五金支架"],
      purchaseIntent: "复购扩展",
      aiTags: ["复购询盘"],
      manualTags: ["德国客户"],
      createdAt: "2026-05-18 13:22",
      lastFollowAt: "2026-06-20 10:10",
      nextFollowAt: "2026-07-08 10:00",
      customerId: "c02",
      aiSummary: "老客户复购，合同已成交，可进入客户经营。"
    }
  ],
  followLogs: [
    { id: "f01", leadId: "l01", userId: "u02", method: "邮件", stage: "需求确认", content: "已回复客户，确认图纸版本、材料牌号和认证要求。", nextFollowAt: "2026-07-04 10:00", createdAt: "2026-07-02 11:10" },
    { id: "f02", leadId: "l02", userId: "u03", method: "电话", stage: "报价", content: "客户希望今天收到 5000/10000 件阶梯报价。", nextFollowAt: "2026-07-03 14:00", createdAt: "2026-07-02 09:20" },
    { id: "f03", leadId: "l04", userId: "u02", method: "备注", stage: "合同已成交", content: "录入合同 CON-2026-0081。", nextFollowAt: "2026-07-08 10:00", createdAt: "2026-06-20 10:10" }
  ],
  customers: [
    {
      id: "c01",
      no: "CUS-2026-0301",
      name: "Northwind Retail Inc.",
      siteId: "s02",
      country: "United States",
      industry: "Retail",
      ownerId: "u03",
      status: "跟进中",
      tags: ["北美零售", "私标客户"],
      leadIds: [],
      contractIds: [],
      aiProfile: "手动创建客户，暂无 AI 画像数据。",
      createdAt: "2026-06-12"
    },
    {
      id: "c02",
      no: "CUS-2026-0268",
      name: "Meyer Automation GmbH",
      siteId: "s01",
      country: "Germany",
      industry: "Manufacturing",
      ownerId: "u02",
      status: "已成交",
      tags: ["德国客户", "复购"],
      leadIds: ["l04"],
      contractIds: ["ct01"],
      aiProfile: "德国自动化设备制造企业，关注稳定供货、批次一致性和技术响应速度。",
      createdAt: "2026-05-20"
    }
  ],
  contacts: [
    { id: "p01", customerId: "c02", name: "Lucas Meyer", title: "Procurement Manager", email: "lucas@meyer-auto.de", phone: "+49 151 2345 7788", whatsapp: "+49 151 2345 7788", role: "采购经理", primary: true, aiDetected: true, tags: ["采购经理", "重点联系人"] },
    { id: "p02", customerId: "c01", name: "Olivia Smith", title: "Buyer", email: "olivia@northwind.example", phone: "+1 408 222 1000", whatsapp: "", role: "执行联系人", primary: true, aiDetected: false, tags: ["采购经理"] }
  ],
  contracts: [
    { id: "ct01", no: "CON-2026-0081", name: "五金支架年度采购合同", customerId: "c02", leadId: "l04", amount: 45200, signedAt: "2026-06-16", status: "执行中", ownerId: "u02", attachments: ["contract-0081.pdf"] }
  ],
  aiConfig: {
    api: {
      apiKey: "sk-********",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
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
      name: "OpenAI",
      type: "大语言模型",
      defaultModel: "gpt-4o",
      status: "启用",
      updatedAt: "2026-07-02 16:20",
      config: {
        api: {
          apiKey: "sk-********",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o",
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
      name: "Azure OpenAI",
      type: "企业模型服务",
      defaultModel: "gpt-4o-mini",
      status: "停用",
      updatedAt: "2026-06-28 11:05",
      config: {
        api: {
          apiKey: "",
          baseUrl: "https://example.openai.azure.com",
          model: "gpt-4o-mini",
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
