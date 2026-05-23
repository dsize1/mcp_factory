/**
 * 查看留言详情工具
 * 
 * TODO: 实现留言详情逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createSayDetailTool(): ToolHandler {
  return {
    name: 'lanhu_say_detail',
    description: '查看留言完整内容',
    inputSchema: createSchema({
      url: { type: 'string', description: '项目或文档 URL' },
      messageId: { type: 'string', description: '留言 ID' },
    }, ['url', 'messageId']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}