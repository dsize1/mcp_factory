/**
 * 获取原型页面列表工具
 * 
 * TODO: 实现页面列表获取逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createGetPagesTool(): ToolHandler {
  return {
    name: 'lanhu_get_pages',
    description: '获取 Axure 原型的所有页面列表',
    inputSchema: createSchema({
      url: { type: 'string', description: '需求文档 URL' },
    }, ['url']),
    handler: async (_params: any) => {
      // TODO: 实现获取页面列表逻辑
      return { success: false, message: 'Not implemented yet' };
    },
  };
}