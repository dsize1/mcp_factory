# MCP Factory - Agent Documentation

This document provides guidance for AI agents working on the MCP Factory project.

## Project Overview

MCP Factory is a monorepo for developing MCP (Model Context Protocol) servers using TypeScript and the FastMCP framework. It uses pnpm workspaces for dependency management.

## Project Structure

```
mcp_factory/
├── package.json              # Root package (workspace root)
├── pnpm-workspace.yaml       # Workspace configuration
├── tsconfig.json             # Shared TypeScript configuration
├── .gitignore
├── .editorconfig
├── mcp-dev-tools/            # FastMCP framework & shared utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts          # Framework source
├── packages/                 # MCP server packages
│   └── <server-name>/        # Individual MCP server
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts      # Server entry point
└── memory-bank/              # Project memory and context
    ├── active-context.md
    ├── system-patterns.md
    └── progress.md
```

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm --filter <package> build` | Build specific package |
| `pnpm --filter <package> dev` | Dev mode (watch) for specific package |
| `pnpm lint` | Lint all packages |
| `pnpm clean` | Clean all build outputs |

## Developing a New MCP Server

1. Create a new directory under `packages/` with the server name
2. Create `package.json` with:
   - `name`: `@mcp-factory/<server-name>`
   - `dependencies`: `mcp-dev-tools` (workspace dependency)
   - `scripts`: `build`, `dev`
3. Create `tsconfig.json` extending the root config
4. Create `src/index.ts` with the server implementation
5. Use `FastMCPServer` from `mcp-dev-tools` to build the server

## Code Style

- TypeScript strict mode enabled
- ES2022 target, Node16 modules
- 2-space indentation
- UTF-8 encoding
- LF line endings
- No trailing whitespace (except in markdown)

## MCP Server Deployment

After building, the MCP server can be configured in:
- **VS Code / Claude Dev**: `cline_mcp_settings.json`
- **Claude Desktop**: `claude_desktop_config.json`

Example configuration:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/packages/my-server/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Memory Bank

Important project context is stored in `memory-bank/`. Always check and update these files as the project evolves.