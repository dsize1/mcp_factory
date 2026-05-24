# dz-lanhu-mcp 开发计划

本文档规划 dz-lanhu-mcp 项目的完整开发路径。

---

## 📋 当前状态

| 类别 | 已完成 | 待开发 | 总计 | 进度 |
|------|--------|--------|------|------|
| **基础设施模块** | 6 | 0 | 6 | 100% |
| **MCP 工具** | 2 | 12 | 14 | 14% |
| **开发文档** | 4 | 0 | 4 | 100% |

### 已完成的基础设施

| 模块 | 文件 | 状态 |
|------|------|------|
| HTTP 客户端 | `src/api/client.ts` | ✅ 307 行完整实现 |
| URL 解析工具 | `src/utils/url-parser.ts` | ✅ 63 行完整实现 |
| 配置模块 | `src/config.ts` | ✅ 完整实现 |
| 类型定义 | `src/types.ts` | ✅ 已创建 |
| 日志工具 | `src/utils/logger.ts` | ✅ 已创建 |
| 缓存模块 | `src/cache/index.ts` | ✅ 已创建 |

### 工具实现状态

| 工具 | 状态 | 备注 |
|------|------|------|
| `lanhu_resolve_invite_link` | ✅ 已实现 | 入口工具 |
| `lanhu_get_pages` | ✅ 已实现 | 页面列表，已测试通过 |
| `lanhu_get_designs` | ⏳ Handler TODO | 待实现 |
| `lanhu_get_design_slices` | ✅ 已实现 | 切图资源，含多倍图 URL |
| 其他工具 | ⏳ Handler TODO | 待实现 |

### 已完成工具详情

#### lanhu_get_pages

- **完成时间**: 2026-05-24
- **API 端点**: `GET /api/project/image?image_id=xxx&project_id=xxx`
- **测试状态**: ✅ 通过（8 个页面，2 个文件夹）
- **已知问题**: 
  - API 路径需与 Python 原始实现一致（`/api/project/image` 而非 `/api/project/doc_info`）
  - 需在 `config.ts` 中提前加载 dotenv
```typescript
handler: async (params) => {
  // TODO: 实现具体逻辑
  return { success: false, message: 'Not implemented yet' };
}
```

---

## 🎯 开发优先级

按用户要求调整的优先级：

### P0 - 核心数据获取（最高优先级）

| 序号 | 工具 | 代码位置 | 依赖 |
|------|------|---------|------|
| 1 | `lanhu_resolve_invite_link` | `src/tools/resolve-link.ts` | 无 |
| 2 | `lanhu_get_pages` | `src/tools/get-pages.ts` | 可选: #1 |
| 3 | `lanhu_get_designs` | `src/tools/get-designs.ts` | 可选: #1 |
| 4 | `lanhu_get_design_slices` | `src/tools/get-slices.ts` | #3（✅ 已实现）|

### P1 - AI 分析工具（高优先级）

| 序号 | 工具 | 代码位置 | 依赖 |
|------|------|---------|------|
| 5 | `lanhu_get_ai_analyze_page_result` | `src/tools/analyze-page.ts` | #2 |
| 6 | `lanhu_get_ai_analyze_design_result` | `src/tools/analyze-design.ts` | #3 |

### P2 - 产品文档（中优先级）

| 序号 | 工具 | 代码位置 | 依赖 |
|------|------|---------|------|
| 7 | `lanhu_list_product_documents` | 待创建 | 可选: #1 |

### P3 - 团队协作（最低优先级）

| 序号 | 工具 | 代码位置 | 依赖 |
|------|------|---------|------|
| 8 | `lanhu_say` | `src/tools/say.ts` | 无 |
| 9 | `lanhu_say_list` | `src/tools/say-list.ts` | 无 |
| 10 | `lanhu_say_detail` | `src/tools/say-detail.ts` | 无 |
| 11 | `lanhu_say_edit` | `src/tools/say-edit.ts` | 无 |
| 12 | `lanhu_say_delete` | `src/tools/say-delete.ts` | 无 |
| 13 | `lanhu_get_members` | `src/tools/get-members.ts` | 无 |

---

## 📅 开发阶段

### Phase 1: 入口工具实现

**目标**: 实现 `lanhu_resolve_invite_link`，作为所有工具的入口

**任务**:
1. 实现邀请链接解析逻辑
2. 处理 HTTP 重定向（`lanhuapp.com/link/#/invite?sid=xxx`）
3. 提取 `tid`, `pid`, `docId` 参数
4. 添加单元测试

**参考**:
- 原始实现: `memory-bank/lanhu-mcp_resource/lanhu_mcp_server.py` L4002-4080
- 代码位置: `src/tools/resolve-link.ts`
- API 端点: `https://lanhuapp.com/link/#/invite?sid=xxx`

**验收标准**:
- [ ] 能正确解析蓝湖邀请链接
- [ ] 返回 tid, pid, docId 等核心参数
- [ ] 错误处理完善（无效链接、过期链接）

---

### Phase 2: 页面列表获取

**目标**: 实现 `lanhu_get_pages`，获取原型页面列表

**任务**:
1. 调用 `/api/project/doc_info` 获取文档信息
2. 从版本列表获取 sitemap JSON URL
3. 解析 sitemap 提取页面层级结构
4. 返回页面列表（含文件夹分组）

**参考**:
- 原始实现: `lanhu_mcp_server.py` L2702-2865
- 代码位置: `src/tools/get-pages.ts`
- API 端点: `GET /api/project/doc_info`

**验收标准**:
- [ ] 返回完整的页面列表
- [ ] 保留文件夹层级结构
- [ ] 包含页面尺寸信息

---

### Phase 3: 设计稿列表获取

**目标**: 实现 `lanhu_get_designs`，获取 UI 设计稿列表

**任务**:
1. 调用 `/api/project/images` 获取图片列表
2. 调用 `/api/project/project_sectors` 获取分组信息
3. 关联图片与分组
4. 返回设计稿列表

**参考**:
- 原始实现: `lanhu_mcp_server.py` L2345-2527
- 代码位置: `src/tools/get-designs.ts`
- API 端点: `GET /api/project/images`, `GET /api/project/project_sectors`

**验收标准**:
- [ ] 返回完整的设计稿列表
- [ ] 包含分组信息
- [ ] 包含设计稿尺寸和时间信息

---

### Phase 4: 切图资源获取

**目标**: 实现 `lanhu_get_design_slices`，获取设计切图信息

**状态**: ✅ 已完成

**任务**:
1. ✅ 调用 `/api/project/image` 获取设计图详情
2. ✅ 从 DDS JSON URL 获取 Sketch/Figma 数据
3. ✅ 递归解析切图数据
4. ✅ 生成多倍图 URL（Web/iOS/Android）
5. ✅ 构建 AI 工作流指南

**参考**:
- 原始实现: `lanhu_mcp_server.py` L3250-3506
- 代码位置: `src/tools/get-slices.ts`, `src/api/client.ts` L434-555
- API 端点: `GET /api/project/image`, DDS JSON URL

**验收标准**:
- [x] 返回完整的切图列表
- [x] 包含 1x/2x/3x 各倍率 URL
- [x] 支持 Sketch 和 Figma 格式
- [x] 构建 AI 工作流指南

---

### Phase 5: AI 页面分析

**目标**: 实现 `lanhu_get_ai_analyze_page_result`

**任务**:
1. 集成 playwright 截图（或使用 headless 浏览器）
2. 提取页面文本内容（红色注释、形状文本）
3. 提取设计样式信息（颜色、字体、尺寸）
4. 调用 LLM API 生成分析结果
5. 支持 development/testing/explore 三种模式

**参考**:
- 原始实现: `lanhu_mcp_server.py` L1510-2100
- 代码位置: `src/tools/analyze-page.ts`
- 需要 LLM API 配置

**验收标准**:
- [ ] 能正确提取页面信息
- [ ] 支持三种分析模式
- [ ] AI 分析结果结构化

---

### Phase 6: AI 设计稿分析

**目标**: 实现 `lanhu_get_ai_analyze_design_result`

**任务**:
1. 获取设计图 DDS schema
2. 解析切图和组件数据
3. 提取设计规范信息
4. 调用 LLM API 生成分析报告

**参考**:
- 原始实现: `lanhu_mcp_server.py` L2101-2344
- 代码位置: `src/tools/analyze-design.ts`

**验收标准**:
- [ ] 能获取设计图详细信息
- [ ] 返回结构化分析报告

---

### Phase 7: 产品文档列表

**目标**: 实现 `lanhu_list_product_documents`

**任务**:
1. 创建 `src/tools/list-documents.ts`
2. 调用 `/api/project/multi_info` 获取文档列表
3. 注册工具到 index.ts
4. 导出工具模块

**参考**:
- 原始实现: `lanhu_mcp_server.py` L673-1000
- API 端点: `GET /api/project/multi_info`

**验收标准**:
- [ ] 返回文档列表

---

### Phase 8: 团队协作工具

**目标**: 实现留言板相关工具（P3 低优先级）

**任务**:
1. 实现 `lanhu_say` - 发布留言
2. 实现 `lanhu_say_list` - 留言列表
3. 实现 `lanhu_say_detail` - 留言详情
4. 实现 `lanhu_say_edit` - 编辑留言
5. 实现 `lanhu_say_delete` - 删除留言

**参考**:
- 原始实现: `lanhu_mcp_server.py` L4565-5145
- API 端点: `/api/project/message/*`

**验收标准**:
- [ ] 所有留言 CRUD 操作正常工作

---

### Phase 9: 协作者查询

**目标**: 实现 `lanhu_get_members`

**任务**:
1. 调用 `/api/project/member/list` 获取成员
2. 调用 `/api/project/access_record` 获取访问记录

**参考**:
- 原始实现: `lanhu_mcp_server.py` L5043-5145
- 代码位置: `src/tools/get-members.ts`

**验收标准**:
- [ ] 返回成员列表和访问记录

---

### Phase 10: 集成与注册

**目标**: 启用工具注册代码，完成服务器集成

**任务**:
1. 修改 `src/index.ts`，取消注释 `registerAllTools()` 中的代码
2. 添加 `lanhu_list_product_documents` 工具注册
3. 运行构建和测试
4. 验证所有工具正常工作

---

## 📐 实现模板

每个工具的推荐实现结构：

```typescript
/**
 * 工具名称
 * 
 * 功能描述
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import { extractProjectIds } from '../utils/url-parser.js';

export function createToolName(): ToolHandler {
  return {
    name: 'lanhu_tool_name',
    description: '工具描述',
    inputSchema: createSchema({
      url: { type: 'string', description: '蓝湖 URL' },
      // 其他参数
    }, ['url']),
    handler: async (params) => {
      try {
        // 1. 解析 URL 获取 pid/tid
        const projectIds = extractProjectIds(params.url);
        const { pid, tid, docId } = projectIds;
        
        // 2. 调用蓝湖 API
        const response = await lanhuApi.get('/api/project/xxx', {
          params: { project_id: pid, /* 其他参数 */ }
        });
        
        // 3. 处理响应数据
        if (response.data.code !== '00000') {
          return {
            status: 'error',
            error: response.data.msg
          };
        }
        
        // 4. 返回结果
        return {
          status: 'success',
          data: response.data.result
        };
      } catch (error) {
        return {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
  };
}
```

---

## 🔗 相关文档

- [工具开发进度](./tool-progress.md) - 详细进度跟踪
- [工具关系图](./tool-relationships.md) - 依赖关系和调用链
- [测试基准](./testing-baseline.md) - API 地址和输入输出格式

---

## 📌 注意事项

1. **Cookie 配置**: 确保 `.env` 中配置了有效的 `LANHU_COOKIE`
2. **API 限流**: 蓝湖 API 可能有调用频率限制，建议添加缓存
3. **错误处理**: 所有工具必须包含完善的错误处理
4. **类型安全**: 使用 `src/types.ts` 中定义的类型
5. **日志记录**: 使用 `src/utils/logger.ts` 记录关键操作