/**
 * 获取设计稿列表工具
 * 
 * TODO: 实现设计稿列表获取逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createGetDesignsTool(): ToolHandler {
  return {
    name: 'lanhu_get_designs',
    description: '获取 UI 设计图列表',
    inputSchema: createSchema({
      url: { type: 'string', description: '设计稿项目 URL' },
    }, ['url']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}