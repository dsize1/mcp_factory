# 蓝湖 MCP 工具开发进度

本文档记录 dz-lanhu-mcp 项目中所有 MCP 工具的开发进度，对照原始 Python 项目 (`memory-bank/lanhu-mcp_resource/lanhu_mcp_server.py`)。

---

## 📊 整体进度

- **MCP 工具总数**: 14 个（13 个核心 + 1 个额外）
- **已完成**: 3 个（lanhu_resolve_invite_link, lanhu_get_pages, lanhu_get_designs, lanhu_get_design_slices）
- **开发中**: 0 个
- **待开发**: 10 个
- **进度**: 29%

---

## P0 - 核心数据获取（最高优先级）

### 1. lanhu_resolve_invite_link

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/resolve-link.ts` |
| **原始实现** | `lanhu_mcp_server.py` L4002-4080 |
| **依赖工具** | 无（入口工具） |
| **被依赖工具** | 所有其他工具 |

**功能描述**: 解析蓝湖邀请链接，获取项目、文档等基本信息

**原始 Python 实现要点**:
- 使用 playwright 处理前端重定向
- 从 `lanhuapp.com/link/#/invite?sid=xxx` 解析出 tid/pid/docId
- 返回解析后的 URL 和参数

**TypeScript 实现计划**:
- 使用 `http` 模块处理重定向（无需 playwright）
- 调用 `LanhuExtractor.parseUrl()` 解析参数

---

### 2. lanhu_get_pages

| 属性 | 值 |
|------|-----|
| **状态** | 🟢 已完成 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/get-pages.ts` |
| **原始实现** | `lanhu_mcp_server.py` L2702-2865 |
| **依赖工具** | `lanhu_resolve_invite_link`（可选，用户可直接传 pid） |
| **被依赖工具** | `lanhu_get_ai_analyze_page_result` |

**功能描述**: 获取 Axure 原型的所有页面列表

**原始 Python 实现要点**:
- 调用 `/api/project/image` 获取文档信息（与 Python 实现一致）
- 获取版本列表，从 `json_url` 获取项目 mapping JSON
- 从 `sitemap.rootNodes` 递归提取页面（保留层级结构）
- 返回页面索引、名称、路径、文件夹分组等信息

**TypeScript 实现要点**:
- 调用 `lanhuApi.getPagesList(docId, teamId, projectId)` 方法
- API 路径: `/api/project/image`（使用 `pid` 和 `image_id` 参数）
- 解析 sitemap 递归提取页面
- 返回页面列表（含文件夹分组、层级信息）
- 支持纯文件夹节点（type=Folder 且无 url）的层级管理

---

### 3. lanhu_get_designs

| 属性 | 值 |
|------|-----|
| **状态** | 🟢 已完成 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/get-designs.ts` |
| **原始实现** | `lanhu_mcp_server.py` L2345-2527 |
| **依赖工具** | `lanhu_resolve_invite_link`（可选） |
| **被依赖工具** | `lanhu_get_ai_analyze_design_result`, `lanhu_get_design_slices` |

**功能描述**: 获取 UI 设计图列表

**原始 Python 实现要点**:
- 调用 `/api/project/stage_design` 获取设计稿列表
- 返回设计稿基本信息（ID、名称、缩略图、创建/更新时间等）

**TypeScript 实现要点**:
- 调用 `lanhuApi.getDesignsList(stageId, teamId, projectId)` 方法
- API 路径: `/api/project/stage_design`
- 返回设计稿列表（含 ID、名称、缩略图 URL、创建/更新时间）
- 需要 URL 包含 `stage_id` 参数

**测试状态**: ⏳ 待测试（需要用户提供实际的蓝湖设计稿 URL）

---

### 4. lanhu_get_design_slices

| 属性 | 值 |
|------|-----|
| **状态** | 🟢 已完成 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/get-slices.ts` |
| **原始实现** | `lanhu_mcp_server.py` L3250-3506 |
| **API 实现** | `packages/dz-lanhu-mcp/src/api/client.ts` L434-555 (`getDesignSlicesInfo`) |
| **依赖工具** | `lanhu_get_designs`（通过 getDesignsList 获取设计稿列表） |
| **被依赖工具** | 无 |

**功能描述**: 获取设计切图信息，支持批量下载切图资源

**原始 Python 实现要点**:
- 通过 `image_id` 获取设计图详情
- 解析 DDS schema 获取切图数据
- 调用 `_build_scale_urls()` 生成多倍图 URL
- 返回切图列表（含各倍率 URL）

**TypeScript 实现要点**:
- 调用 `lanhuApi.getDesignSlicesInfo(imageId, teamId, projectId, includeMetadata)` 方法
- API 路径: `/api/project/image` + DDS JSON URL
- 递归遍历图层提取切图（支持 Sketch 和 Figma）
- 生成多倍图 URL（Web 1x/2x/3x, iOS @1x/@2x/@3x, Android mdpi~xxxhdpi）
- 构建 AI 工作流指南（平台选择、文件命名、环境检测）

**测试状态**: ⏳ 待测试（需要用户提供实际的蓝湖设计稿 URL）

---

## P1 - AI 分析工具（高优先级）

### 5. lanhu_get_ai_analyze_page_result

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/analyze-page.ts` |
| **原始实现** | `lanhu_mcp_server.py` L1510-2100 |
| **依赖工具** | `lanhu_get_pages` |
| **被依赖工具** | 无 |

**功能描述**: 分析原型页面内容，支持开发/测试/探索三种分析模式

**原始 Python 实现要点**:
- 使用 playwright 截图获取页面视觉信息
- 提取页面文本内容（红色注释、形状文本、全量文本）
- 提取设计样式信息（文字颜色、背景色、字体规格、图片资源）
- 组装提示词发送给 LLM
- 返回结构化分析结果

**TypeScript 实现计划**:
- 集成 playwright 截图（或使用 headless 浏览器）
- 提取页面文本和设计样式
- 调用 LLM API 生成分析结果
- 支持三种模式：development/testing/explore

---

### 6. lanhu_get_ai_analyze_design_result

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/analyze-design.ts` |
| **原始实现** | `lanhu_mcp_server.py` L2101-2344 |
| **依赖工具** | `lanhu_get_designs` |
| **被依赖工具** | 无 |

**功能描述**: 分析 UI 设计图，获取详细设计参数和 HTML+CSS 代码

**原始 Python 实现要点**:
- 获取设计图 DDS schema
- 解析切图和组件数据
- 提取设计规范信息
- 组装提示词发送给 LLM

**TypeScript 实现计划**:
- 调用 DDS API 获取设计图 schema
- 解析设计数据
- 调用 LLM 生成分析报告

---

## P2 - 产品文档（中优先级）

### 7. lanhu_list_product_documents

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/` (待创建) |
| **原始实现** | `lanhu_mcp_server.py` L673-1000 |
| **依赖工具** | `lanhu_resolve_invite_link`（可选） |
| **被依赖工具** | 无 |

**功能描述**: 列出产品文档（PRD）列表

**原始 Python 实现要点**:
- 调用 `/api/project/multi_info` 获取项目信息
- 返回文档列表（含文档名称、类型、创建者等信息）
- 支持导出为 HTML 本地预览

**TypeScript 实现计划**:
- 调用 `lanhuApi.get('/api/project/multi_info')`
- 返回文档列表

---

## P3 - 团队协作（低优先级）

### 8. lanhu_say

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/say.ts` |
| **原始实现** | `lanhu_mcp_server.py` L4798-4950 |
| **依赖工具** | 无 |
| **被依赖工具** | 无 |

**功能描述**: 发布团队协作留言，支持 @提醒和飞书通知

---

### 9. lanhu_say_list

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/say-list.ts` |
| **原始实现** | `lanhu_mcp_server.py` L4565-4649 |
| **依赖工具** | 无 |
| **被依赖工具** | 无 |

**功能描述**: 查看团队协作留言列表，支持筛选和搜索

---

### 10. lanhu_say_detail

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/say-detail.ts` |
| **原始实现** | `lanhu_mcp_server.py` L4651-4712 |
| **依赖工具** | 无 |
| **被依赖工具** | 无 |

**功能描述**: 查看留言完整内容

---

### 11. lanhu_say_edit

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/say-edit.ts` |
| **原始实现** | `lanhu_mcp_server.py` L4713-4797 |
| **依赖工具** | 无 |
| **被依赖工具** | 无 |

**功能描述**: 编辑已发布的留言

---

### 12. lanhu_say_delete

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/say-delete.ts` |
| **原始实现** | `lanhu_mcp_server.py` L4951-5042 |
| **依赖工具** | 无 |
| **被依赖工具** | 无 |

**功能描述**: 删除已发布的留言

---

### 13. lanhu_get_members

| 属性 | 值 |
|------|-----|
| **状态** | 🔴 待开发 |
| **代码位置** | `packages/dz-lanhu-mcp/src/tools/get-members.ts` |
| **原始实现** | `lanhu_mcp_server.py` L5043-5145 |
| **依赖工具** | 无 |
| **被依赖工具** | 无 |

**功能描述**: 查看项目协作者列表及访问记录

---

## 📝 非 MCP 工具的核心方法

以下方法在原始 Python 项目中存在，但不是 MCP 工具（作为内部方法供其他工具调用）：

| 方法名 | 代码位置 | 功能 | 对应 TS 位置 |
|--------|---------|------|-------------|
| `get_document_info()` | L673-742 | 获取文档基本信息 | `src/api/products.ts` |
| `get_pages_list()` | L2702-2865 | 获取页面列表（含 sitemap） | `src/tools/get-pages.ts` |
| `download_resources()` | L2867-2976 | 下载所有 Axure 资源 | 待实现 |
| `get_design_schema_json()` | L3555-3561 | 获取设计图 Schema JSON | `src/api/designs.ts` |
| `get_sketch_json()` | L3563-3581 | 获取原始 Sketch JSON | `src/api/designs.ts` |
| `fix_html_files()` | L3654-3709 | 修复 HTML 文件 | 待实现 |
| `screenshot_page_internal()` | L3712-3998 | 页面截图（提取文本+样式） | `src/tools/analyze-page.ts` |

---

## 📅 开发里程碑

| 阶段 | 目标 | 预计完成 |
|------|------|---------|
| Phase 1 | P0 核心数据获取（4 个工具） | 待定 |
| Phase 2 | P1 AI 分析工具（2 个工具） | 待定 |
| Phase 3 | P2 产品文档（1 个工具） | 待定 |
| Phase 4 | P3 团队协作（5 个工具） | 待定 |