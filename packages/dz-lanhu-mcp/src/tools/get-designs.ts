/**
 * 获取设计稿列表工具
 *
 * 从蓝湖 UI 设计稿项目中获取所有设计稿列表，包含设计稿名称、缩略图、创建/更新时间等信息
 *
 * 对应 Python 参考实现 (lanhu_mcp_server.py) 的设计稿列表获取逻辑
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import { parseLanhuUrl } from '../utils/url-parser.js';
import type { LanhuDesign } from '../types.js';

export function createGetDesignsTool(): ToolHandler {
  return {
    name: 'lanhu_get_designs',
    description:
      '获取蓝湖 UI 设计稿列表。从设计稿项目中获取所有设计图信息，包含设计图名称、ID、缩略图 URL、创建和更新时间等。返回设计稿名称、路径、ID 等信息，供其他工具（如切图获取、设计分析）使用。',
    inputSchema: createSchema(
      {
        url: {
          type: 'string',
          description:
            '蓝湖设计稿项目 URL，需包含 stage_id 参数。例: https://lanhuapp.com/design/#/project?tid=xxx&pid=xxx&stage_id=xxx。如果有邀请链接，请先用 lanhu_resolve_invite_link 获取参数！',
        },
      },
      ['url']
    ),
    handler: async (params: Record<string, any>): Promise<string> => {
      const url = (params as { url: string }).url;

      // 1. 解析 URL 提取 tid/pid/stageId
      const parsed = parseLanhuUrl(url);

      const teamId = parsed.teamId;
      const projectId = parsed.projectId;
      const stageId = parsed.stageId;

      if (!stageId) {
        return JSON.stringify(
          {
            status: 'error',
            error: 'URL 中缺少 stage_id 参数，请确保 URL 包含 stage_id（设计稿项目 URL 中的 stage_id 参数）',
            parsed_type: parsed.type,
            parsed_params: {
              teamId,
              projectId,
              stageId,
            },
            url: url,
          },
          null,
          2
        );
      }

      // 2. 调用 API 获取设计稿列表
      try {
        const designs: LanhuDesign[] = await lanhuApi.getDesignsList(stageId, teamId, projectId);

        // 3. 构建简化输出
        const simplifiedDesigns = designs.map((design: LanhuDesign) => ({
          id: design.id,
          name: design.name,
          stage_id: design.stage_id,
          project_id: design.project_id,
          creator_id: design.creator_id,
          created_at: design.created_at,
          updated_at: design.updated_at,
          thumb_url: design.thumb_url,
          original_url: design.original_url,
        }));

        const output = {
          status: 'success',
          stage: {
            id: stageId,
          },
          summary: {
            total_designs: designs.length,
          },
          designs: simplifiedDesigns,
        };

        return JSON.stringify(output, null, 2);
      } catch (error: any) {
        return JSON.stringify(
          {
            status: 'error',
            error: error.message || String(error),
            url: url,
            parsed_params: {
              teamId,
              projectId,
              stageId,
            },
          },
          null,
          2
        );
      }
    },
  };
}
