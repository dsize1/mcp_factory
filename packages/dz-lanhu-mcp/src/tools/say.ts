/**
 * 发布留言工具
 * 
 * TODO: 实现发布留言逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createSayTool(): ToolHandler {
  return {
    name: 'lanhu_say',
    description: '发布团队协作留言，支持 @提醒和飞书通知',
    inputSchema: createSchema({
      url: { type: 'string', description: '项目或文档 URL' },
      summary: { type: 'string', description: '留言摘要' },
      content: { type: 'string', description: '留言内容' },
      mention: { type: 'string', description: '提醒的用户名' },
      type: { type: 'string', description: '留言类型' },
    }, ['url', 'summary', 'content']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}