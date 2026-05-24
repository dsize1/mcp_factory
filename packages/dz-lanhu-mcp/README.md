# 🎨 dz-lanhu-mcp | 蓝湖 MCP 服务器

**TypeScript 重构版蓝湖 MCP 服务器，让 AI 助手直接读取蓝湖设计稿和需求文档**

## 📋 项目背景

本项目是 [lanhu-mcp-resource](https://github.com/dsphper/lanhu-mcp)（Python 开发）的 TypeScript 重构版本。原项目是一个功能强大的 Model Context Protocol (MCP) 服务器，专为 AI 编程时代设计，完美支持蓝湖（Lanhu）设计协作平台。

### 为什么需要重构？

- **原生 Node.js**：无需安装 Python 环境，更适合前端和全栈开发者
- **类型安全**：完整的 TypeScript 类型定义，更好的开发体验
- **模块化设计**：将原 6791 行单文件拆分为清晰的模块化架构
- **Monorepo 集成**：作为 mcp_factory 的一部分，共享框架和工具

## ✨ 核心功能

### 📋 需求文档分析
- **智能文档提取**：自动下载和解析 Axure 原型的所有页面、资源和交互
- **三种分析模式**：
  - 🔧 **开发视角**：详细字段规则、业务逻辑、全局流程图
  - 🧪 **测试视角**：测试场景、用例、边界值、校验规则
  - 🚀 **快速探索**：核心功能概览、模块依赖、评审要点
- **四阶段工作流**：全局扫描 → 分组分析 → 反向验证 → 生成交付物

### 🎨 UI 设计支持
- **设计稿查看**：批量下载和展示 UI 设计图
- **设计图分析**：获取详细设计参数（组件尺寸、间距、颜色/字体等），并自动将设计 Schema 转为 HTML+CSS 代码
- **切图提取**：自动识别和导出设计切图、图标资源
- **智能命名**：基于图层路径自动生成语义化文件名

### 💬 团队协作留言板
- **统一知识库**：所有 AI 助手连接同一个 MCP 服务器，共享留言板数据
- **上下文传递**：开发 AI 分析的需求，测试 AI 可以直接查询使用
- **@提醒机制**：支持飞书通知，打通 AI 协作与人工沟通
- **知识沉淀**：坑点、经验、最佳实践以"知识库"类型永久保存

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- pnpm（推荐使用 pnpm workspace）
- 蓝湖账号（需要获取 Cookie）

### 安装

```bash
# 在项目根目录安装依赖
pnpm install
```

### 配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 获取蓝湖 Cookie：
   - 登录 [蓝湖网页版](https://lanhuapp.com)
   - 按 F12 打开浏览器开发者工具
   - 切换到 Network 标签
   - 刷新页面
   - 点击任意蓝湖请求
   - 从请求头中复制 Cookie 值

3. 编辑 `.env` 文件，填入你的蓝湖 Cookie：
```bash
LANHU_COOKIE="your_lanhu_cookie_here"
```

### 运行

```bash
# 构建项目
pnpm build

# 启动服务
pnpm start
```

### 运行测试

```bash
# 测试 lanhu_get_pages 工具
pnpm test:pages

# 使用自定义链接测试
pnpm test:pages "https://lanhuapp.com/web/#/item/project/product?docId=YOUR_DOC_ID"

# 或使用环境变量
LANHU_TEST_URL="https://lanhuapp.com/..." pnpm test:pages
```

### 连接到 AI 客户端

在支持 MCP 的 AI 客户端（如 Cursor、Windsurf、Claude Code）中配置：

**stdio 模式配置示例：**
```json
{
  "mcpServers": {
    "lanhu": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "LANHU_COOKIE": "your_cookie_here"
      }
    }
  }
}
```

## 🛠️ 可用工具列表

| 工具名称 | 功能描述 | 使用场景 | 状态 |
|---------|---------|---------|------|
| `lanhu_resolve_invite_link` | 解析邀请链接 | 用户提供分享链接时 | ✅ |
| `lanhu_get_pages` | 获取原型页面列表 | 分析需求文档前必调用 | ✅ |
| `lanhu_get_ai_analyze_page_result` | 分析原型页面内容 | 提取需求细节 | ⏳ |
| `lanhu_get_designs` | 获取 UI 设计图列表 | 查看设计稿前必调用 | ⏳ |
| `lanhu_get_design_slices` | 获取切图信息 | 下载图标、素材 | ✅ |
| `lanhu_say` | 发布留言 | 团队协作、@提醒 | ⏳ |
| `lanhu_say_list` | 查看留言列表 | 查询历史消息 | ⏳ |
| `lanhu_say_detail` | 查看留言详情 | 查看完整内容 | ⏳ |
| `lanhu_say_edit` | 编辑留言 | 修改已发布消息 | ⏳ |
| `lanhu_say_delete` | 删除留言 | 移除消息 | ⏳ |
| `lanhu_get_members` | 查看协作者 | 查看团队成员 | ⏳ |

## 📁 项目结构

```
dz-lanhu-mcp/
├── package.json              # 包配置
├── tsconfig.json             # TypeScript 配置
├── .env.example              # 环境变量示例
├── .gitignore
├── README.md                 # 本文件
├── tests/                    # 测试脚本
│   └── test-get-pages.ts     # lanhu_get_pages 工具测试
└── src/
    ├── index.ts              # 入口文件，注册所有工具和资源
    ├── config.ts             # 配置管理（环境变量、默认值）
    ├── types.ts              # TypeScript 类型定义
    ├── api/                  # 蓝湖 API 客户端
    │   ├── client.ts         # HTTP 客户端封装
    │   ├── products.ts       # 产品文档 API
    │   ├── designs.ts        # UI 设计稿 API
    │   └── members.ts        # 协作者 API
    ├── tools/                # MCP 工具实现
    │   ├── resolve-link.ts
    │   ├── get-pages.ts
    │   ├── analyze-page.ts
    │   ├── get-designs.ts
    │   ├── analyze-design.ts
    │   ├── get-slices.ts
    │   ├── say.ts
    │   ├── say-list.ts
    │   ├── say-detail.ts
    │   ├── say-edit.ts
    │   ├── say-delete.ts
    │   └── get-members.ts
    ├── resources/            # MCP 资源实现
    │   ├── design-preview.ts
    │   └── page-screenshot.ts
    ├── cache/                # 缓存管理
    │   └── manager.ts
    └── utils/                # 工具函数
        ├── screenshot.ts     # Playwright 截图
        ├── html-converter.ts # CSS/HTML 转换
        └── feishu.ts         # 飞书通知
```

## ⚙️ 环境变量

| 变量名 | 必需 | 默认值 | 描述 |
|--------|------|--------|------|
| `LANHU_COOKIE` | ✅ | - | 蓝湖 Cookie，从浏览器开发者工具获取 |
| `DATA_DIR` | ❌ | `./data` | 数据存储目录（缓存 Axure 资源、设计稿截图、留言数据等） |
| `HTTP_TIMEOUT` | ❌ | `30` | HTTP 请求超时时间（秒） |
| `VIEWPORT_WIDTH` | ❌ | `1920` | 浏览器视口宽度 |
| `VIEWPORT_HEIGHT` | ❌ | `1080` | 浏览器视口高度 |
| `FEISHU_WEBHOOK_URL` | ❌ | - | 飞书机器人 Webhook URL |
| `DEBUG` | ❌ | `false` | 调试模式 |

## 🔧 技术栈

| 功能 | Python 原版 | TypeScript 重构版 |
|------|-------------|-------------------|
| MCP 框架 | fastmcp | mcp-dev-tools (FastMCPServer) |
| HTTP 客户端 | httpx | undici |
| HTML 解析 | BeautifulSoup | cheerio |
| 浏览器自动化 | playwright (Python) | playwright (Node.js) |
| 环境变量 | python-dotenv | dotenv |

## 🔒 安全说明

- ⚠️ **Cookie 安全**：请勿将含有 Cookie 的配置文件提交到公开仓库
- 🔐 **访问控制**：建议在内网环境部署或配置防火墙规则
- 📝 **数据隐私**：留言数据存储在本地，请妥善保管

## 📄 许可证

MIT License

## 🙏 致谢

- 原始 Python 项目：[lanhu-mcp](https://github.com/dsphper/lanhu-mcp)
- [FastMCP](https://github.com/jlowin/fastmcp) - MCP 服务器框架
- [Playwright](https://playwright.dev/) - 浏览器自动化工具