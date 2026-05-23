/**
 * 查看协作者工具
 * 
 * TODO: 实现协作者查询逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createGetMembersTool(): ToolHandler {
  return {
    name: 'lanhu_get_members',
    description: '查看项目协作者列表及访问记录',
    inputSchema: createSchema({
      url: { type: 'string', description: '项目 URL' },
    }, ['url']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}