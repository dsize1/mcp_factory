/**
 * 编辑留言工具
 * 
 * TODO: 实现编辑留言逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createSayEditTool(): ToolHandler {
  return {
    name: 'lanhu_say_edit',
    description: '编辑已发布的留言',
    inputSchema: createSchema({
      url: { type: 'string', description: '项目或文档 URL' },
      messageId: { type: 'string', description: '留言 ID' },
      summary: { type: 'string', description: '新的留言摘要' },
      content: { type: 'string', description: '新的留言内容' },
    }, ['url', 'messageId', 'summary', 'content']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}