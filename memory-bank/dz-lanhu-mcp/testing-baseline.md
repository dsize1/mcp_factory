# 蓝湖 MCP 测试基准文档

本文档记录 dz-lanhu-mcp 项目的远程 API 地址、端点信息和输入输出格式，用于后续测试基准对照。

---

## 📝 测试经验总结 (lanhu_get_pages)

> **完成时间**: 2026-05-24
> **工具**: lanhu_get_pages
> **状态**: ✅ 已完成并验证

### 1. ESLint 错误修复

#### 问题 1: 未使用的导入

**错误信息**: `'Logger' is defined but never used`

**原因**: 在 `src/tools/get-pages.ts` 中导入了 `Logger` 但未使用。

**解决方案**: 移除未使用的导入语句。

```typescript
// 错误
import { lanhuApi } from '../api/client.js';
import { Logger } from '../utils/logger.js';

// 正确
import { lanhuApi } from '../api/client.js';
```

---

#### 问题 2: ES Module 中使用 `dirname`

**错误信息**: `__dirname` 不能在 ES 模块中使用

**原因**: 项目使用 ES Module (`"type": "module"`)，而 `__dirname` 是 CommonJS 变量。

**解决方案**: 使用 `import.meta.url` 替代 `__dirname`。

```typescript
// 错误
const configDir = path.dirname(__filename);
const configPath = path.join(configDir, '../config.js');
await import(configPath);

// 正确
const fileUrl = import.meta.url;
const configDir = path.dirname(fileURLToPath(fileUrl));
const configPath = path.join(configDir, '../config.js');
await import(configPath);
```

**关键步骤**:
1. 从 `node:url` 导入 `fileURLToPath`
2. 从 `node:path` 导入 `dirname` 和 `join`（如果尚未导入）
3. 使用 `import.meta.url` 替代 `__filename`
4. 使用 `path.dirname()` 替代 `path.dirname(__filename)`

---

### 2. 蓝湖 API 调用修正

#### 问题: 错误的 API 端点

**原始错误**: 使用 `/api/project/doc_info` 导致 404 错误

**原因**: 蓝湖实际使用的 API 端点是 `/api/project/image`，而非 `/api/project/doc_info`。

**解决方案**: 修正 API 路径为 `/api/project/image`，与 Python 原始实现保持一致。

```typescript
// 错误
const response = await this.request.get<DocInfoResponse>('/api/project/doc_info', params);

// 正确
const response = await this.request.get<DocInfoResponse>('/api/project/image', params);
```

**经验教训**: 
- **始终对照原始 Python 实现验证 API 路径**
- Python 原始代码中使用的是 `/api/project/image?image_id=xxx&project_id=xxx`
- 不要仅依赖注释或文档中的 API 路径描述

---

### 3. 类型定义修复

#### 问题: `LanhuExtractor` 没有 `parseUrl` 属性

**错误信息**: `Property 'parseUrl' does not exist on type 'typeof LanhuExtractor'`

**原因**: `LanhuExtractor` 类中没有 `parseUrl` 静态方法，实际 URL 解析是通过 `extractProjectIds()` 函数实现的。

**解决方案**: 使用 `extractProjectIds()` 函数替代。

```typescript
// 错误
const params = LanhuExtractor.parseUrl(testUrl);

// 正确
const params = extractProjectIds(testUrl);
```

---

### 4. dotenv 环境变量加载顺序问题

#### 问题: `LANHU_COOKIE` 为 `your_lanhu_cookie_here`

**现象**: 构建后运行测试，Cookie 值未正确加载

**原因分析**:
1. TypeScript 模块按导入顺序初始化
2. `config.ts` 在 `.env` 文件加载之前就被导入了
3. `LanhuConfig` 读取的是默认值而非环境变量

**解决方案**: 在 `config.ts` 模块顶层主动加载 dotenv。

```typescript
// src/config.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });  // 在模块加载时立即加载 .env
```

**关键原则**:
- **dotenv 必须在任何其他模块导入 config.ts 之前加载**
- 测试脚本中不需要再次加载 dotenv（但也不会出错）
- 确保 `.env` 文件路径正确（相对于工作目录）

**验证方法**:
```bash
# 在 config.ts 中添加临时日志验证
console.log('LANHU_COOKIE loaded:', process.env.LANHU_COOKIE?.substring(0, 20) + '...');
```

---

### 5. 测试脚本编写规范

#### 推荐结构

```typescript
/**
 * 测试工具名称
 * 
 * 运行方式: npx tsx tests/test-tool-name.ts
 */

// 1. 加载环境变量
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// 2. 导入模块
import { toolName } from '../src/api/client.js';

// 3. 定义测试参数
const TEST_URL = process.argv[2] || process.env.TEST_URL || 'default-url';

// 4. URL 解析辅助函数（如需要）
function extractParams(url: string): Record<string, string> {
  // ...
}

// 5. 主测试函数
async function test() {
  console.log('=== 工具名称测试 ===\n');
  
  try {
    // 6. 执行测试
    const result = await toolNameMethod(params);
    
    // 7. 输出结果
    console.log('\n=== 测试成功 ===');
    console.log('数据:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('错误:', error.message);
    process.exit(1);
  }
}

test();
```

#### 测试脚本存放位置

```
packages/dz-lanhu-mcp/
├── tests/
│   └── test-get-pages.ts      # 测试脚本统一存放位置
```

#### package.json 测试脚本

```json
{
  "scripts": {
    "test:pages": "tsx tests/test-get-pages.ts"
  }
}
```

---

### 6. URL 解析注意事项

蓝湖 URL 有两种常见格式：

#### Hash 路由格式
```
https://lanhuapp.com/web/#/item/project/product?tid=xxx&pid=xxx&docId=xxx
```

#### 查询参数格式
```
https://lanhuapp.com/link/?pid=xxx&tid=xxx&doc_id=xxx
```

**解析策略**:
1. 首先尝试从 hash 部分 (`#/item/...?params`) 提取参数
2. 如果 hash 中没有，尝试从常规查询字符串提取
3. 支持驼峰命名 (`docId`) 和下划线命名 (`doc_id`)

---

### 7. API 响应数据结构

`lanhu_get_pages` 返回的标准格式：

```typescript
interface GetPagesResult {
  document_id: string;           // 文档 ID
  document_name: string;         // 文档名称
  document_type: string;         // 文档类型 (axure)
  total_pages: number;           // 页面总数
  max_level: number;             // 最大层级深度
  pages_with_children: number;   // 有子页面的数量
  pages: PageItem[];             // 页面列表
  folder_statistics: Record<string, number>;  // 文件夹统计
}

interface PageItem {
  index: number;                 // 页面索引
  name: string;                  // 页面名称
  page_id: string;               // 页面 ID
  folder: string;                // 所属文件夹
  level: number;                 // 层级深度 (0 = 根级)
  path: string;                  // 完整路径
  has_children: boolean;         // 是否有子页面
  width: number;                 // 页面宽度
  height: number;                // 页面高度
}
```

---

## 📌 通用测试 Checklist

在实现和测试新工具时，请对照以下清单：

- [ ] ESLint 检查通过（无未使用导入、无类型错误）
- [ ] TypeScript 编译通过（`pnpm build`）
- [ ] 环境变量正确加载（.env 文件存在且内容正确）
- [ ] API 端点与 Python 原始实现一致
- [ ] URL 解析支持所有蓝湖 URL 格式
- [ ] 错误处理完善（网络错误、API 错误、数据解析错误）
- [ ] 测试脚本结构规范（dotenv 加载 → 导入 → 测试 → 输出）
- [ ] 测试结果符合预期格式

---

## ⚙️ 测试环境配置

### 环境变量

```bash
# packages/dz-lanhu-mcp/.env
LANHU_COOKIE=your_actual_cookie_here
HTTP_TIMEOUT=30000
```

### 运行测试

```bash
# 运行特定工具测试
pnpm test:pages

# 或直接在 tests/ 目录运行
cd packages/dz-lanhu-mcp
npx tsx tests/test-get-pages.ts
```

---

> **最后更新**: 2026-05-24 (lanhu_get_pages 测试经验)

## 🌐 远程 API 地址

| 用途 | 基础 URL | 用途说明 |
|------|---------|---------|
| **主 API** | `https://lanhuapp.com` | 项目数据、留言、协作者、文档等 |
| **DDS API** | `https://dds.lanhuapp.com` | 设计图 Schema 获取、设计标注数据 |
| **CDN** | `https://axure-file.lanhuapp.com` | 静态资源下载（HTML/CSS/JS/图片） |
| **邀请页** | `https://lanhuapp.com/link/#/invite?sid=xxx` | 邀请链接格式 |

---

## 📡 API 端点列表

### 1. 项目与文档

| 端点 | 方法 | 原始实现位置 | 说明 |
|------|------|------------|------|
| `/api/project/multi_info` | GET | `lanhu_mcp_server.py` L673-742 | 获取项目多文档信息 |
| `/api/project/doc_info` | GET | `lanhu_mcp_server.py` L2702-2865 | 获取文档信息（含 sitemap） |
| `/api/project/project_sectors` | GET | `lanhu_mcp_server.py` L2345-2527 | 获取项目分组信息 |
| `/api/project/images` | GET | `lanhu_mcp_server.py` L2345-2527 | 获取图片/设计稿列表 |

### 2. 设计图相关

| 端点 | 方法 | 原始实现位置 | 说明 |
|------|------|------------|------|
| `/api/project/image` | GET | `lanhu_mcp_server.py` L3250-3506 | 获取设计图详情 |
| `GET /api/project/image/<image_id>` | GET | — | 带 image_id 参数获取指定设计图 |

**设计图详情请求参数**:
```
GET /api/project/image?image_id={image_id}&last_update_time={update_time}
```

### 3. 留言板相关

| 端点 | 方法 | 原始实现位置 | 说明 |
|------|------|------------|------|
| `/api/project/message/say` | GET | `lanhu_mcp_server.py` L4798-4950 | 发布留言 |
| `/api/project/message/list` | GET | `lanhu_mcp_server.py` L4565-4649 | 获取留言列表 |
| `/api/project/message/delete` | GET | `lanhu_mcp_server.py` L4951-5042 | 删除留言 |

**发布留言请求参数**:
```
GET /api/project/message/say?project_id={pid}&doc_id={docId}&summary={摘要}&content={内容}&mention_uids={@用户ID}
```

**获取留言列表请求参数**:
```
GET /api/project/message/list?project_id={pid}&doc_id={docId}&type={类型}&search={关键词}
```

### 4. 协作者相关

| 端点 | 方法 | 原始实现位置 | 说明 |
|------|------|------------|------|
| `/api/project/member/list` | GET | `lanhu_mcp_server.py` L5043-5145 | 获取成员列表 |
| `/api/project/access_record` | GET | `lanhu_mcp_server.py` L5043-5145 | 获取访问记录 |

**获取成员列表请求参数**:
```
GET /api/project/member/list?project_id={pid}
```

---

## 📥 请求格式基准

### 认证方式

所有请求通过 Cookie 进行认证：

```
Cookie: your_lanhu_cookie_here
```

**TypeScript 实现**: Cookie 配置在 `src/config.ts` 中，通过 `LANHU_COOKIE` 环境变量设置。

### 请求头标准

```http
User-Agent: dz-lanhu-mcp/1.0.0
Accept: application/json
Content-Type: application/json; charset=utf-8
```

### 统一响应格式

蓝湖 API 返回统一格式：

```json
{
  "code": "00000",
  "msg": "success",
  "result": { ... }
}
```

- `code`: 状态码，`"00000"` 表示成功
- `msg`: 状态消息
- `result`: 实际返回数据

---

## 📤 响应格式基准（原始 Python 项目）

### 1. 邀请链接解析 (`lanhu_resolve_invite_link`)

**输入**:
```
url = "https://lanhuapp.com/link/#/invite?sid=xxxxxxxx"
```

**原始 Python 输出**:
```json
{
  "success": true,
  "message": "",
  "result": {
    "tid": "123456",
    "pid": "789012",
    "doc_id": "345678",
    "invite_info": {
      "project_name": "项目名称",
      "invite_time": "2024-01-01"
    }
  }
}
```

**TypeScript 目标输出**:
```json
{
  "status": "success",
  "data": {
    "tid": "123456",
    "pid": "789012",
    "docId": "345678",
    "projectName": "项目名称",
    "inviteTime": "2024-01-01"
  }
}
```

---

### 2. 页面列表 (`lanhu_get_pages`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456&doc_id=345678"
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "doc_info": {
      "doc_id": "345678",
      "doc_name": "需求文档名称",
      "project_name": "项目名称"
    },
    "pages": [
      {
        "index": 0,
        "page_name": "首页",
        "page_id": "page_001",
        "path": "/首页",
        "parent_folder": "",
        "width": 720,
        "height": 1136,
        "type": "normal"
      },
      {
        "index": 1,
        "page_name": "登录",
        "page_id": "page_002",
        "path": "/用户体系/登录",
        "parent_folder": "用户体系",
        "width": 720,
        "height": 1136,
        "type": "normal"
      }
    ],
    "total": 2
  }
}
```

---

### 3. 设计稿列表 (`lanhu_get_designs`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456"
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "images": [
      {
        "image_id": "img_001",
        "name": "首页设计",
        "update_time": "2024-01-01 12:00:00",
        "sector_name": "UI设计",
        "width": 750,
        "height": 1334
      }
    ],
    "sectors": [
      {"sector_id": "sec_001", "name": "UI设计"},
      {"sector_id": "sec_002", "name": "原型设计"}
    ]
  }
}
```

---

### 4. 页面分析 (`lanhu_get_ai_analyze_page_result`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456&doc_id=345678"
pageId = "page_001"
mode = "development"  // development | testing | explore
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "page_name": "首页",
    "mode": "development",
    "text_info": {
      "red_annotation": ["欢迎用户使用本应用", "点击登录进入系统"],
      "shape_text": ["Logo", "登录按钮"],
      "full_text": ["首页", "欢迎用户使用本应用", "点击登录进入系统", "Logo", "登录按钮"]
    },
    "design_info": {
      "text_color": ["#333333", "#666666"],
      "background_color": ["#FFFFFF", "#F5F5F5"],
      "font_spec": [{"text": "首页", "size": 20, "weight": "bold"}],
      "image_resources": ["https://axure-file.lanhuapp.com/xxx.png"]
    },
    "ai_analysis": "AI 生成的分析结果..."
  }
}
```

---

### 5. 设计稿分析 (`lanhu_get_ai_analyze_design_result`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456"
designId = "img_001"
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "design_name": "首页设计",
    "design_info": {
      "width": 750,
      "height": 1334,
      "scale": "1x"
    },
    "slices": [
      {
        "name": "icon_home",
        "x": 10,
        "y": 20,
        "width": 24,
        "height": 24,
        "url_1x": "https://dds.lanhuapp.com/xxx@1x.png",
        "url_2x": "https://dds.lanhuapp.com/xxx@2x.png",
        "url_3x": "https://dds.lanhuapp.com/xxx@3x.png"
      }
    ],
    "html_css_code": "/* AI 生成的 HTML+CSS 代码 */\n..."
  }
}
```

---

### 6. 切图信息 (`lanhu_get_design_slices`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456"
designId = "img_001"
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "design_name": "首页设计",
    "slices": [
      {
        "slice_id": "slice_001",
        "name": "icon_home",
        "type": "icon",
        "sizes": {
          "1x": "https://axure-file.lanhuapp.com/xxx@1x.png",
          "2x": "https://axure-file.lanhuapp.com/xxx@2x.png",
          "3x": "https://axure-file.lanhuapp.com/xxx@3x.png"
        }
      }
    ]
  }
}
```

---

### 7. 发布留言 (`lanhu_say`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456"
summary = "需求变更"
content = "首页登录按钮需要改为圆角矩形"
mention = "张三"
type = "normal"
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "message_id": "msg_001",
    "success": true,
    "feishu_sent": false
  }
}
```

---

### 8. 留言列表 (`lanhu_say_list`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456"
type = "normal"
search = "登录"
limit = 20
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "messages": [
      {
        "message_id": "msg_001",
        "user_name": "李四",
        "user_id": "uid_001",
        "summary": "需求变更",
        "content": "首页登录按钮需要改为圆角矩形",
        "create_time": "2024-01-01 12:00:00",
        "type": "normal",
        "project_name": "项目名称",
        "doc_name": "需求文档"
      }
    ],
    "total": 1
  }
}
```

---

### 9. 协作者列表 (`lanhu_get_members`)

**输入**:
```
url = "https://lanhuapp.com/link/?pid=789012&tid=123456"
```

**原始 Python 输出**:
```json
{
  "code": "00000",
  "msg": "success",
  "result": {
    "members": [
      {
        "uid": "uid_001",
        "name": "张三",
        "email": "zhangsan@example.com",
        "avatar": "https://cdn.lanhuapp.com/avatar/xxx.jpg"
      }
    ],
    "access_records": [
      {
        "uid": "uid_001",
        "name": "张三",
        "last_visit": "2024-01-01 12:00:00"
      }
    ]
  }
}
```

---

## 🔍 测试对照方法

### 输入输出格式对照

| 项目 | 原始 Python 格式 | TypeScript 目标格式 |
|------|-----------------|-------------------|
| 状态字段 | `code: "00000"` | `status: "success"` |
| 消息字段 | `msg: "success"` | 包含在 `data` 中 |
| 数据字段 | `result: { ... }` | `data: { ... }` |
| 参数命名 | `doc_id` (下划线) | `docId` (驼峰) |
| 错误处理 | `code != "00000"` | `status: "error"` + `error` 字段 |

### 基准测试步骤（未来执行）

1. **准备阶段**
   - 从原始 Python 项目收集示例输入
   - 记录原始 API 响应作为期望输出

2. **执行阶段**
   - 使用相同输入调用 TypeScript 项目
   - 记录 TypeScript 项目的输出

3. **对照阶段**
   - 比较字段完整性（所有原始字段是否都存在）
   - 比较数据一致性（值是否相同）
   - 检查格式转换是否正确（camelCase vs snake_case）

4. **验证阶段**
   - 确认 TypeScript 项目的输出在语义上与原始输出等价
   - 记录差异说明（如有合理的格式调整）

---

## 📌 示例 URL 参考

| 类型 | URL 示例 |
|------|---------|
| 邀请链接 | `https://lanhuapp.com/link/#/invite?sid=xxxxxxxx` |
| 项目链接 | `https://lanhuapp.com/link/?pid=11111&tid=22222` |
| 文档链接 | `https://lanhuapp.com/link/?pid=11111&tid=22222&doc_id=33333` |
| 设计稿链接 | `https://lanhuapp.com/design/details/?pid=11111&tid=22222&page_id=44444` |

---

## ⚙️ 环境变量配置

测试前需配置以下环境变量：

```bash
# 在 packages/dz-lanhu-mcp/.env 中
LANHU_COOKIE=your_lanhu_cookie_here
DDS_COOKIE=your_ddss_cookie_here  # 可选，用于 DDS API
HTTP_TIMEOUT=30                    # HTTP 请求超时时间（秒）
```

> **⚠️ 测试暂不启动**: 本文档仅作为开发参考，实际测试将在工具实现完成后另行安排。