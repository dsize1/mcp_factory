# 蓝湖 MCP 工具关系图

本文档描述 dz-lanhu-mcp 项目中所有 MCP 工具之间的依赖关系和调用链。

---

## 📊 工具依赖关系总览

```mermaid
graph TD
    subgraph "入口工具"
        A[lanhu_resolve_invite_link]
    end

    subgraph "核心数据获取 P0"
        A --> B[lanhu_get_pages]
        A --> C[lanhu_get_designs]
        A --> G[lanhu_list_product_documents]
        B --> D[lanhu_get_ai_analyze_page_result]
        C --> E[lanhu_get_ai_analyze_design_result]
        C --> F[lanhu_get_design_slices]
    end

    subgraph "团队协作 P3"
        H[lanhu_say]
        I[lanhu_say_list]
        J[lanhu_say_detail]
        K[lanhu_say_edit]
        L[lanhu_say_delete]
        M[lanhu_get_members]
    end

    style A fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style C fill:#2196F3,color:#fff
    style D fill:#FF9800,color:#fff
    style E fill:#FF9800,color:#fff
    style F fill:#2196F3,color:#fff
    style H fill:#9E9E9E,color:#fff
    style I fill:#9E9E9E,color:#fff
    style J fill:#9E9E9E,color:#fff
    style K fill:#9E9E9E,color:#fff
    style L fill:#9E9E9E,color:#fff
    style M fill:#9E9E9E,color:#fff
```

---

## 📋 工具详细说明

### 入口工具

| 工具 | 功能 | 返回参数 | 依赖 |
|------|------|---------|------|
| `lanhu_resolve_invite_link` | 解析蓝湖邀请链接 | `tid`, `pid`, `docId` | 无 |

### 核心数据获取工具 (P0)

| 工具 | 依赖参数 | 被依赖工具 |
|------|---------|-----------|
| `lanhu_get_pages` | `pid`, `tid`, `docId` | `lanhu_get_ai_analyze_page_result` |
| `lanhu_get_designs` | `pid`, `tid` | `lanhu_get_ai_analyze_design_result`, `lanhu_get_design_slices` |
| `lanhu_get_ai_analyze_page_result` | `pid`, `pageName` | 无 |
| `lanhu_get_ai_analyze_design_result` | `pid`, `designName` | 无 |
| `lanhu_get_design_slices` | `pid`, `designName` | 无 |
| `lanhu_list_product_documents` | `pid`, `tid` | 无 |

### 团队协作工具 (P3)

| 工具 | 依赖参数 | 备注 |
|------|---------|------|
| `lanhu_say` | `pid`, `tid` | 发布留言 |
| `lanhu_say_list` | `pid`, `tid` | 查看留言列表 |
| `lanhu_say_detail` | `pid`, `tid`, `messageId` | 查看留言详情 |
| `lanhu_say_edit` | `pid`, `tid`, `messageId` | 编辑留言 |
| `lanhu_say_delete` | `pid`, `tid`, `messageId` | 删除留言 |
| `lanhu_get_members` | `pid`, `tid` | 查看协作者 |

---

## 🔗 调用链关系

### 调用链 1: 需求文档分析全流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Resolve as lanhu_resolve_invite_link
    participant Pages as lanhu_get_pages
    participant Analyze as lanhu_get_ai_analyze_page_result

    User->>Resolve: 传入蓝湖邀请链接
    Resolve-->>User: 返回 pid, tid, docId
    User->>Pages: 传入 pid, tid, docId
    Pages-->>User: 返回页面列表
    User->>Analyze: 传入 pid, pageName
    Analyze-->>User: 返回分析结果
```

**说明**:
1. 用户首先调用 `lanhu_resolve_invite_link` 解析邀请链接
2. 从返回结果中获取 `pid`（项目 ID）、`tid`（团队 ID）、`docId`（文档 ID）
3. 调用 `lanhu_get_pages` 获取项目下所有原型页面
4. 从页面列表中选择一个页面，调用 `lanhu_get_ai_analyze_page_result` 分析

### 调用链 2: UI 设计稿分析全流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Resolve as lanhu_resolve_invite_link
    participant Designs as lanhu_get_designs
    participant Analyze as lanhu_get_ai_analyze_design_result
    participant Slices as lanhu_get_design_slices

    User->>Resolve: 传入蓝湖邀请链接
    Resolve-->>User: 返回 pid, tid
    User->>Designs: 传入 pid, tid
    Designs-->>User: 返回设计稿列表
    User->>Analyze: 传入 pid, designName
    Analyze-->>User: 返回设计稿分析结果
    User->>Slices: 传入 pid, designName
    Slices-->>User: 返回切图信息
```

**说明**:
1. 用户首先调用 `lanhu_resolve_invite_link` 解析邀请链接
2. 从返回结果中获取 `pid`（项目 ID）、`tid`（团队 ID）
3. 调用 `lanhu_get_designs` 获取项目下所有 UI 设计稿
4. 可选择调用 `lanhu_get_ai_analyze_design_result` 分析设计稿
5. 可选择调用 `lanhu_get_design_slices` 获取切图资源

### 调用链 3: 团队协作留言

```mermaid
sequenceDiagram
    participant User as 用户
    participant Say as lanhu_say
    participant SayList as lanhu_say_list
    participant SayDetail as lanhu_say_detail
    participant SayEdit as lanhu_say_edit
    participant SayDelete as lanhu_say_delete

    User->>Say: 发布留言
    Say-->>User: 返回留言 ID
    User->>SayList: 查看留言列表
    SayList-->>User: 返回留言列表
    User->>SayDetail: 查看留言详情
    SayDetail-->>User: 返回留言内容
    User->>SayEdit: 编辑留言
    SayEdit-->>User: 返回修改结果
    User->>SayDelete: 删除留言
    SayDelete-->>User: 返回删除结果
```

### 调用链 4: 直接传参模式

所有工具支持两种调用方式：

**方式 A: 通过邀请链接解析（推荐）**
```
用户 → lanhu_resolve_invite_link → pid/tid/docId → 其他工具
```

**方式 B: 直接传入参数**
```
用户 → 其他工具（直接传入 pid, tid）
```

---

## 📐 数据流转图

```mermaid
flowchart LR
    subgraph "输入"
        URL[蓝湖邀请链接]
        PID[pid 项目 ID]
        TID[tid 团队 ID]
    end

    subgraph "解析层"
        Resolve[lanhu_resolve_invite_link]
    end

    subgraph "数据获取层"
        Pages[lanhu_get_pages]
        Designs[lanhu_get_designs]
        Docs[lanhu_list_product_documents]
        Members[lanhu_get_members]
    end

    subgraph "分析层"
        PageAnalyze[lanhu_get_ai_analyze_page_result]
        DesignAnalyze[lanhu_get_ai_analyze_design_result]
        Slices[lanhu_get_design_slices]
    end

    subgraph "协作层"
        Say[留言板工具集]
    end

    URL --> Resolve
    Resolve --> PID
    Resolve --> TID
    PID --> Pages
    PID --> Designs
    PID --> Docs
    PID --> Members
    TID --> Pages
    TID --> Designs
    TID --> Docs
    TID --> Members

    Pages --> PageAnalyze
    Designs --> DesignAnalyze
    Designs --> Slices

    style URL fill:#fff3e0
    style Resolve fill:#4CAF50,color:#fff
    style Pages fill:#2196F3,color:#fff
    style Designs fill:#2196F3,color:#fff
    style PageAnalyze fill:#FF9800,color:#fff
    style DesignAnalyze fill:#FF9800,color:#fff
```

---

## 🏗️ 代码模块结构

```
packages/dz-lanhu-mcp/src/
├── tools/
│   ├── resolve-link.ts        ← 入口工具
│   ├── get-pages.ts           ← 核心数据
│   ├── get-designs.ts         ← 核心数据
│   ├── get-slices.ts          ← 核心数据
│   ├── analyze-page.ts        ← AI 分析
│   ├── analyze-design.ts      ← AI 分析
│   ├── say.ts                 ← 团队协作
│   ├── say-list.ts            ← 团队协作
│   ├── say-detail.ts          ← 团队协作
│   ├── say-edit.ts            ← 团队协作
│   ├── say-delete.ts          ← 团队协作
│   ├── get-members.ts         ← 团队协作
│   └── index.ts               ← 统一导出
├── api/
│   ├── client.ts              ← HTTP 客户端
│   ├── designs.ts             ← 设计稿 API
│   ├── members.ts             ← 成员 API
│   └── products.ts            ← 产品 API
├── utils/
│   ├── url-parser.ts          ← URL 解析工具
│   └── role-matcher.ts        ← 角色匹配工具
└── index.ts                   ← 服务器入口
```

---

## 📌 参数传递约定

所有工具使用统一的参数命名规范：

| 参数 | 来源 | 说明 |
|------|------|------|
| `tid` | 邀请链接解析 | 团队 ID，从蓝湖邀请链接中提取 |
| `pid` | 邀请链接解析 / 直接传入 | 项目 ID |
| `docId` | 邀请链接解析 | 文档 ID（用于原型文档） |
| `pageName` / `pageId` | `lanhu_get_pages` 返回 | 页面标识 |
| `designName` / `designId` | `lanhu_get_designs` 返回 | 设计稿标识 |
| `messageId` | 留言 API 返回 | 留言 ID |