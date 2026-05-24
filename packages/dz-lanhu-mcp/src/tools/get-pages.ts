/**
 * 获取文档的所有页面列表工具
 *
 * 从蓝湖原型文档中获取所有页面列表，包含层级结构和文件夹信息
 *
 * 对应 Python 参考实现 (lanhu_mcp_server.py) 的 get_pages_list 方法和 lanhu_get_pages 工具
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import { parseLanhuUrl } from '../utils/url-parser.js';
import type { ParsedLanhuUrl } from '../types.js';

export function createGetPagesTool(): ToolHandler {
  return {
    name: 'lanhu_get_pages',
    description:
      '获取蓝湖原型文档的所有页面列表。从 sitemap 中提取页面信息，包含层级结构、文件夹分组和页面元数据。返回页面名称、路径、ID 等信息，供其他工具（如页面分析）使用。',
    inputSchema: createSchema(
      {
        url: {
          type: 'string',
          description:
            '蓝湖需求文档 URL，包含 docId 参数。例: https://lanhuapp.com/web/#/item/project/product?tid=xxx&pid=xxx&docId=xxx。如果有邀请链接，请先用 lanhu_resolve_invite_link 获取参数！',
        },
      },
      ['url']
    ),
    handler: async (params: Record<string, any>): Promise<string> => {
      const url = (params as { url: string }).url;

      // 1. 解析 URL 提取 tid/pid/docId
      const parsed = parseLanhuUrl(url);

      // 优先使用 docId，如果没有则尝试 productId
      const docId = parsed.docId || parsed.productId;
      const teamId = parsed.teamId;
      const projectId = parsed.projectId;

      if (!docId) {
        return JSON.stringify(
          {
            status: 'error',
            error: 'URL 中缺少 docId 参数，请确保 URL 包含 docId',
            parsed_type: parsed.type,
            url: url,
          },
          null,
          2
        );
      }

      // 2. 调用 API 获取页面列表
      try {
        const result = await lanhuApi.getPagesList(docId, teamId, projectId);

        // 3. 构建简化输出
        const simplifiedPages = result.pages.map((page) => ({
          index: page.index,
          name: page.name,
          id: page.id,
          type: page.type,
          level: page.level,
          folder: page.folder,
          path: page.path,
          has_children: page.has_children,
        }));

        const output = {
          status: 'success',
          document: {
            id: result.document_id,
            name: result.document_name,
            type: result.document_type,
          },
          summary: {
            total_pages: result.total_pages,
            max_level: result.max_level,
            pages_with_children: result.pages_with_children,
            folder_count: Object.keys(result.folder_statistics || {}).length,
          },
          folder_statistics: result.folder_statistics,
          pages: simplifiedPages,
          ...(result.create_time && { create_time: result.create_time }),
          ...(result.update_time && { update_time: result.update_time }),
          ...(result.latest_version && { latest_version: result.latest_version }),
          ...(result.creator_name && { creator_name: result.creator_name }),
        };

        return JSON.stringify(output, null, 2);
      } catch (error: any) {
        return JSON.stringify(
          {
            status: 'error',
            error: error.message || String(error),
            url: url,
            parsed_params: {
              docId,
              teamId,
              projectId,
            },
          },
          null,
          2
        );
      }
    },
  };
}