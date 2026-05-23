# 蓝湖 MCP 测试基准文档

本文档记录 dz-lanhu-mcp 项目的远程 API 地址、端点信息和输入输出格式，用于后续测试基准对照。

> **⚠️ 注意**: 测试暂不启动，本文档仅作为参考基准使用。

---

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