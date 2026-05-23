/**
 * 删除留言工具
 * 
 * TODO: 实现删除留言逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createSayDeleteTool(): ToolHandler {
  return {
    name: 'lanhu_say_delete',
    description: '删除已发布的留言',
    inputSchema: createSchema({
      url: { type: 'string', description: '项目或文档 URL' },
      messageId: { type: 'string', description: '留言 ID' },
    }, ['url', 'messageId']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}