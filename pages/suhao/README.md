# AI CRM Enterprise Admin

企业级 AI 智能 CRM 后台管理系统，覆盖工作台、沟通中心、线索中心、客户中心、合同中心、分析中心、站点中心、系统管理与用户中心等业务模块。

## 技术栈

- 原生 JavaScript ES Modules
- 原生 CSS
- Node.js 内置 HTTP 开发服务器
- Mock 数据内置于前端工程

## 安装

```bash
npm install
```

## 本地启动

```bash
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:5173
```

如需指定端口：

```bash
npm run dev -- --port 5174
```

## 构建

```bash
npm run build
```

构建产物输出到：

```text
dist/
```

## 项目检查

```bash
npm run check
```

## 目录结构

```text
.
├── docs/                # 产品需求、设计规范、决策记录等协作资产
├── scripts/             # 开发服务器、构建与结构检查脚本
├── src/                 # 前端应用源码
│   ├── app.js           # 路由注册与应用布局
│   ├── components.js    # 公共 UI 组件
│   ├── data.js          # Mock 数据与基础格式化工具
│   ├── main.js          # 应用入口
│   ├── pages.js         # 页面实现
│   ├── router.js        # 前端路由
│   ├── store.js         # 全局状态与权限逻辑
│   └── styles.css       # 全局样式
├── index.html
├── package.json
└── package-lock.json
```

## 环境变量

当前版本无需必填环境变量。

开发服务器支持以下可选环境变量：

```text
PORT=5173
HOST=127.0.0.1
```

## 发布说明

本项目为静态 SPA，可将 `dist/` 目录部署到任意静态资源服务器。产品需求、设计规范和 AI 协作资产已归档到 `docs/`，不会影响项目安装、启动和构建。
