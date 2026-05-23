/**
 * 获取切图信息工具
 * 
 * TODO: 实现切图获取逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';

export function createGetSlicesTool(): ToolHandler {
  return {
    name: 'lanhu_get_design_slices',
    description: '获取设计切图信息，支持批量下载切图资源',
    inputSchema: createSchema({
      url: { type: 'string', description: '设计稿 URL' },
      designId: { type: 'string', description: '设计图 ID' },
      outputDir: { type: 'string', description: '输出目录' },
    }, ['url', 'designId']),
    handler: async (_params: any) => {
      return { success: false, message: 'Not implemented yet' };
    },
  };
}