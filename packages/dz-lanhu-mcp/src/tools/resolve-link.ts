/**
 * 解析蓝湖邀请链接工具
 * 
 * TODO: 实现邀请链接解析逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';

export function createResolveLinkTool(): ToolHandler {
  return {
    name: 'lanhu_resolve_invite_link',
    description: '解析蓝湖邀请链接，获取项目、文档等基本信息',
    inputSchema: createSchema({
      url: { type: 'string', description: '蓝湖邀请链接' },
    }, ['url']),
    handler: async (params) => {
      // TODO: 实现邀请链接解析逻辑
      console.log('resolve_invite_link called with:', params);
      return { success: false, message: 'Not implemented yet' };
    },
  };
}