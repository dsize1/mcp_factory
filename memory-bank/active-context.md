# Active Context

## Current State
MCP Factory 项目已初始化完成。这是一个用于开发 MCP (Model Context Protocol) 服务器的 monorepo 项目。

## Project Setup
- **包管理器**: pnpm
- **开发语言**: TypeScript (ES2022)
- **MCP 框架**: FastMCP (基于 @modelcontextprotocol/sdk)
- **Monorepo 结构**: pnpm workspaces

## Recent Changes
- 创建项目基础结构
- 配置 pnpm workspaces
- 创建 FastMCP 开发框架框架 (mcp-dev-tools)
- 创建配置文件 (tsconfig.json, .gitignore, .editorconfig)
- 创建项目文档 (AGENTS.md, .clinerules, memory-bank/)

## Active Decisions
- 使用 `mcp-dev-tools` 作为共享的 MCP 开发框架
- 每个 MCP 服务器作为独立的 workspace package
- 使用 TypeScript strict mode 确保代码质量

## Next Steps
1. 运行 `pnpm install` 安装依赖
2. 运行 `pnpm build` 验证构建
3. 开始开发第一个 MCP 服务器