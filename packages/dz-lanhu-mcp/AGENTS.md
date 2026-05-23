# dz-lanhu-mcp Agent 文档

本文档为 AI agents 提供 dz-lanhu-mcp 项目的开发指南和文档导航。

---

## 📂 项目概述

dz-lanhu-mcp 是一个基于 TypeScript 和 FastMCPServer 框架构建的蓝湖 MCP 服务器。它是原始 Python 项目 (`memory-bank/lanhu-mcp_resource/lanhu_mcp_server.py`) 的 TypeScript 重构版。

---

## 📚 开发文档导航

所有开发相关文档位于 `memory-bank/dz-lanhu-mcp/` 目录：

| 文档 | 说明 |
|------|------|
| [工具开发进度](../memory-bank/dz-lanhu-mcp/tool-progress.md) | 所有 MCP 工具的开发进度、代码位置、实现计划 |
| [工具关系图](../memory-bank/dz-lanhu-mcp/tool-relationships.md) | 工具依赖关系、调用链、数据流转图 |
| [测试基准](../memory-bank/dz-lanhu-mcp/testing-baseline.md) | 远程 API 地址、端点信息、输入输出格式对照 |

---

## 🏗️ 项目结构

```
packages/dz-lanhu-mcp/
├── package.json                 # 包配置
├── tsconfig.json                # TypeScript 配置
├── .env.example                 # 环境变量示例
├── .env                         # 环境变量（已配置）
├── .gitignore
├── README.md
├── src/
│   ├── index.ts                 # 服务器入口
│   ├── config.ts                # 配置模块
│   ├── types.ts                 # 类型定义
│   │
│   ├── api/                     # HTTP 客户端与 API 模块
│   │   ├── client.ts            # 蓝湖 HTTP 客户端（已实现）
│   │   ├── designs.ts           # 设计稿 API
│   │   ├── members.ts           # 成员 API
│   │   └── products.ts          # 产品 API
│   │
│   ├── tools/                   # MCP 工具实现
│   │   ├── index.ts             # 工具统一导出
│   │   ├── resolve-link.ts      # 入口工具
│   │   ├── get-pages.ts         # 页面列表
│   │   ├── get-designs.ts       # 设计稿列表
│   │   ├── get-slices.ts        # 切图信息
│   │   ├── analyze-page.ts      # 页面分析
│   │   ├── analyze-design.ts    # 设计稿分析
│   │   ├── say.ts               # 发布留言
│   │   ├── say-list.ts          # 留言列表
│   │   ├── say-detail.ts        # 留言详情
│   │   ├── say-edit.ts          # 编辑留言
│   │   ├── say-delete.ts        # 删除留言
│   │   └── get-members.ts       # 协作者列表
│   │
│   ├── resources/               # MCP 资源
│   │   └── index.ts
│   │
│   ├── cache/                   # 缓存模块
│   │   └── index.ts
│   │
│   └── utils/                   # 工具函数
│       ├── index.ts
│       ├── logger.ts            # 日志工具
│       ├── url-parser.ts        # URL 解析
│       └── role-matcher.ts      # 角色匹配
```

---

## 🎯 开发优先级

### P0 - 核心数据获取（最高优先级）
1. `lanhu_resolve_invite_link` - 入口工具
2. `lanhu_get_pages` - 页面列表
3. `lanhu_get_designs` - 设计稿列表
4. `lanhu_get_design_slices` - 切图资源

### P1 - AI 分析工具（高优先级）
5. `lanhu_get_ai_analyze_page_result` - 页面分析
6. `lanhu_get_ai_analyze_design_result` - 设计稿分析

### P2 - 产品文档（中优先级）
7. `lanhu_list_product_documents` - 产品文档列表

### P3 - 团队协作（最低优先级）
8-12. 留言板工具集 (say/list/detail/edit/delete)
13. `lanhu_get_members` - 协作者查询

详见: [工具开发进度](../memory-bank/dz-lanhu-mcp/tool-progress.md)

---

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm --filter @dz-lanhu-mcp build

# 开发模式（热重载）
pnpm --filter @dz-lanhu-mcp dev

# 清理构建产物
pnpm clean

# 运行 lint
pnpm lint
```

---

## 📝 代码规范

- **TypeScript 严格模式**: 启用 strict mode
- **模块系统**: ES Modules (`"type": "module"`)
- **Target**: ES2022
- **编码**: UTF-8, LF 换行
- **缩进**: 2 空格
- **命名规范**: 
  - 文件名: kebab-case (`resolve-link.ts`)
  - 类名/接口: PascalCase (`LanhuAPIClient`)
  - 函数/变量: camelCase (`resolveInviteLink`)

---

## 🔗 工具依赖关系

所有工具间的依赖关系和调用链见: [工具关系图](../memory-bank/dz-lanhu-mcp/tool-relationships.md)

关键要点:
- `lanhu_resolve_invite_link` 是入口工具，其他工具都可独立使用
- 所有工具通过 `pid` (项目 ID) 和 `tid` (团队 ID) 参数关联
- 用户可以直接传入 `pid`/`tid` 跳过链接解析步骤

---

## 🧪 测试基准

远程 API 地址、端点信息和输入输出格式见: [测试基准](../memory-bank/dz-lanhu-mcp/testing-baseline.md)

> **⚠️ 测试暂不启动**: 本文档仅作为开发参考。

---

## 📋 开发任务清单

从 [工具开发进度](../memory-bank/dz-lanhu-mcp/tool-progress.md) 复制：

- [ ] P0-1: 实现 `lanhu_resolve_invite_link` → `src/tools/resolve-link.ts`
- [ ] P0-2: 实现 `lanhu_get_pages` → `src/tools/get-pages.ts`
- [ ] P0-3: 实现 `lanhu_get_designs` → `src/tools/get-designs.ts`
- [ ] P0-4: 实现 `lanhu_get_design_slices` → `src/tools/get-slices.ts`
- [ ] P1-1: 实现 `lanhu_get_ai_analyze_page_result` → `src/tools/analyze-page.ts`
- [ ] P1-2: 实现 `lanhu_get_ai_analyze_design_result` → `src/tools/analyze-design.ts`
- [ ] P2-1: 实现 `lanhu_list_product_documents` → `src/tools/` (待创建)
- [ ] P3-1: 实现 `lanhu_say` → `src/tools/say.ts`
- [ ] P3-2: 实现 `lanhu_say_list` → `src/tools/say-list.ts`
- [ ] P3-3: 实现 `lanhu_say_detail` → `src/tools/say-detail.ts`
- [ ] P3-4: 实现 `lanhu_say_edit` → `src/tools/say-edit.ts`
- [ ] P3-5: 实现 `lanhu_say_delete` → `src/tools/say-delete.ts`
- [ ] P3-6: 实现 `lanhu_get_members` → `src/tools/get-members.ts`

---

## 🛠️ 基础设施状态

以下模块已实现，可直接使用：

| 模块 | 文件 | 状态 |
|------|------|------|
| HTTP 客户端 | `src/api/client.ts` | ✅ 完整实现 |
| URL 解析 | `src/utils/url-parser.ts` | ✅ 完整实现 |
| 配置模块 | `src/config.ts` | ✅ 完整实现 |
| 类型定义 | `src/types.ts` | ✅ 已创建 |
| 日志工具 | `src/utils/logger.ts` | ✅ 已创建 |
| 缓存模块 | `src/cache/index.ts` | ✅ 已创建 |

---

## 📖 参考资源

- 原始 Python 项目: `memory-bank/lanhu-mcp_resource/lanhu_mcp_server.py`
- FastMCPServer 框架: `mcp-dev-tools/`
- MCP 协议规范: https://modelcontextprotocol.io/