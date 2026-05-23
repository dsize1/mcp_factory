/**
 * 查看留言列表工具
 * 
 * TODO: 实现留言列表逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createSayListTool(): ToolHandler {
  return {
    name: 'lanhu_say_list',
    description: '查看团队协作留言列表，支持筛选和搜索',
    inputSchema: createSchema({
      url: { type: 'string', description: '项目或文档 URL，使用 "all" 搜索全局' },
      type: { type: 'string', description: '按类型筛选' },
      search: { type: 'string', description: '正则搜索关键词' },
      limit: { type: 'number', description: '返回数量限制' },
    }, ['url']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}