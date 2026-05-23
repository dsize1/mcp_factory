/**
 * FastMCP Framework
 * 
 * A lightweight framework for building MCP servers with TypeScript.
 * Provides utilities for creating tools, resources, and server configurations.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ============================================================
// Type Definitions
// ============================================================

export interface FastMCPServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Optional server description */
  description?: string;
}

export interface ToolHandler<T = Record<string, any>> {
  /** Tool name (unique identifier) */
  name: string;
  /** Tool description */
  description: string;
  /** JSON Schema for tool parameters */
  inputSchema: Record<string, any>;
  /** Handler function */
  handler: (params: T) => Promise<any>;
}

export interface ResourceHandler {
  /** Resource URI */
  uri: string;
  /** Resource name */
  name: string;
  /** Optional MIME type */
  mimeType?: string;
  /** Optional description */
  description?: string;
  /** Read handler */
  read: () => Promise<string>;
}

export interface ResourceTemplateHandler {
  /** URI template pattern */
  uriTemplate: string;
  /** Human-readable name */
  name: string;
  /** Optional MIME type */
  mimeType?: string;
  /** Optional description */
  description?: string;
  /** Match and read handler */
  read: (uri: string) => Promise<string>;
}

// ============================================================
// FastMCPServer Class
// ============================================================

export class FastMCPServer {
  private server: Server;
  private config: FastMCPServerConfig;
  private tools: ToolHandler[] = [];
  private resources: ResourceHandler[] = [];
  private resourceTemplates: ResourceTemplateHandler[] = [];
  private customToolHandlers: Map<string, (args: any) => Promise<any>> = new Map();

  constructor(config: FastMCPServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupDefaultHandlers();
  }

  /**
   * Register a tool
   */
  registerTool<T = Record<string, any>>(tool: ToolHandler<T>): this {
    this.tools.push(tool as ToolHandler);
    this.customToolHandlers.set(tool.name, tool.handler);
    return this;
  }

  /**
   * Register a static resource
   */
  registerResource(resource: ResourceHandler): this {
    this.resources.push(resource);
    return this;
  }

  /**
   * Register a resource template
   */
  registerResourceTemplate(template: ResourceTemplateHandler): this {
    this.resourceTemplates.push(template);
    return this;
  }

  /**
   * Setup MCP request handlers
   */
  private setupDefaultHandlers(): void {
    // List tools
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: this.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      })
    );

    // Call tool
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: any) => {
        const handler = this.customToolHandlers.get(request.params.name);
        if (!handler) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        try {
          const result = await handler(request.params.arguments);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: error.message || String(error),
              },
            ],
            isError: true,
          };
        }
      }
    );

    // List resources
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async () => ({
        resources: this.resources.map((r) => ({
          uri: r.uri,
          name: r.name,
          mimeType: r.mimeType,
          description: r.description,
        })),
      })
    );

    // List resource templates
    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => ({
        resourceTemplates: this.resourceTemplates.map((t) => ({
          uriTemplate: t.uriTemplate,
          name: t.name,
          mimeType: t.mimeType,
          description: t.description,
        })),
      })
    );

    // Read resource
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: any) => {
        // Check static resources first
        const staticResource = this.resources.find((r) => r.uri === request.params.uri);
        if (staticResource) {
          const content = await staticResource.read();
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: staticResource.mimeType,
                text: content,
              },
            ],
          };
        }

        // Check resource templates
        for (const template of this.resourceTemplates) {
          try {
            const content = await template.read(request.params.uri);
            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: template.mimeType,
                  text: content,
                },
              ],
            };
          } catch {
            // Not a match for this template
            continue;
          }
        }

        throw new McpError(
          ErrorCode.InvalidRequest,
          `Resource not found: ${request.params.uri}`
        );
      }
    );

    // Error handling
    this.server.onerror = (error: any) => {
      console.error(`[MCP Error] ${error.message || error}`);
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.config.name} v${this.config.version} running on stdio`);
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    await this.server.close();
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Helper to create a JSON Schema for tool parameters
 */
export function createSchema(
  properties: Record<string, { type: string; description: string }>,
  required: string[] = []
): Record<string, any> {
  const schema: Record<string, any> = {
    type: 'object',
    properties,
  };
  if (required.length > 0) {
    schema.required = required;
  }
  return schema;
}

/**
 * Helper to run a server and handle graceful shutdown
 */
export async function runServer(server: FastMCPServer): Promise<void> {
  await server.start();

  const shutdown = async (signal: string) => {
    console.error(`Received ${signal}, shutting down gracefully...`);
    await server.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ============================================================
// Re-exports
// ============================================================

export { Server, StdioServerTransport };
export { ErrorCode, McpError };