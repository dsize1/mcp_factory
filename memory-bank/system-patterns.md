# System Patterns

## Architecture Overview

MCP Factory 采用 monorepo 架构，使用 pnpm workspaces 管理多包项目。

### 核心组件

1. **mcp-dev-tools** - MCP 开发框架
   - 提供 `FastMCPServer` 基类
   - 封装 MCP SDK 的常见模式
   - 提供工具、资源注册的统一 API
   - 包含实用函数 (`createSchema`, `runServer`)

2. **packages/** - MCP 服务器包
   - 每个 MCP 服务器是独立的 package
   - 依赖 `mcp-dev-tools` 框架
   - 独立构建和部署

## Design Patterns

### Server Creation Pattern

```typescript
import { FastMCPServer, runServer } from 'mcp-dev-tools';

const server = new FastMCPServer({
  name: 'my-server',
  version: '1.0.0'
});

server.registerTool({
  name: 'my-tool',
  description: 'Description of my tool',
  inputSchema: { /* JSON Schema */ },
  handler: async (params) => { /* implementation */ }
});

await runServer(server);
```

### Tool Registration Pattern
- 每个工具包含: name, description, inputSchema, handler
- handler 接收参数并返回 Promise<any>
- 错误通过返回 `isError: true` 处理

### Resource Pattern
- 静态资源: 固定 URI 的数据
- 动态资源: 使用 URI 模板 (`{param}`)
- 资源通过 `read()` 方法提供内容

## Conventions

### Naming
- 包名: `@mcp-factory/<server-name>`
- 工具名: 小写英文，使用 `-` 分隔符
- 资源 URI: `scheme://resource-name`

### File Structure
```
packages/<server-name>/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### Error Handling
- 工具错误: 返回 `{ content: [...], isError: true }`
- 资源错误: 抛出 `McpError` 异常
- 服务器错误: 通过 `server.onerror` 捕获

## Technology Stack

| Component | Technology |
|-----------|------------|
| Package Manager | pnpm |
| Language | TypeScript (ES2022) |
| MCP SDK | @modelcontextprotocol/sdk |
| Module System | ES Modules |