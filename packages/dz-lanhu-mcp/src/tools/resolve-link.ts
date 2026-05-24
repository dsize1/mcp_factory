/**
 * 解析蓝湖邀请链接工具
 *
 * 入口工具，从蓝湖邀请链接中解析 tid/pid/docId 参数
 *
 * 支持两种格式：
 * 1. lanhuapp.com/link/#/invite?sid=xxx
 * 2. lanhuapp.com/invite/xxx
 *
 * 返回 tid/pid/docId 供其他工具直接使用
 *
 * 对应 Python 参考实现 (lanhu_mcp_server.py) 的 _resolve_invite_link_from_code
 * 和 resolve_invite_link 工具
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import type { InviteLinkInfoResult } from '../types.js';

export function createResolveLinkTool(): ToolHandler {
  return {
    name: 'lanhu_resolve_invite_link',
    description:
      '解析蓝湖邀请链接，获取项目、文档等基本信息。支持两种格式：1) lanhuapp.com/link/#/invite?sid=xxx 2) lanhuapp.com/invite/xxx。返回 tid/pid/docId 供其他工具直接使用。',
    inputSchema: createSchema(
      {
        url: {
          type: 'string',
          description: '蓝湖邀请链接，如 https://lanhuapp.com/link/#/invite?sid=xxx 或 https://lanhuapp.com/invite/xxx',
        },
      },
      ['url']
    ),
    handler: async (params: Record<string, any>): Promise<string> => {
      const url = (params as { url: string }).url;

      // 1. 解析 URL 提取邀请码
      const parsed = lanhuApi.parseUrl(url);

      if (!parsed.inviteCode) {
        return JSON.stringify(
          {
            status: 'error',
            error: '无法从 URL 中提取邀请码',
            parsed_type: parsed.type,
            url: url,
          },
          null,
          2
        );
      }

      const inviteCode = parsed.inviteCode;
      const originalUrl = url;

      // 2. 调用 API 获取邀请链接信息
      let inviteInfo: InviteLinkInfoResult;
      try {
        inviteInfo = await lanhuApi.getInviteLinkInfo(inviteCode);
      } catch (error: any) {
        return JSON.stringify(
          {
            status: 'error',
            error: `获取邀请链接信息失败: ${error.message || String(error)}`,
            invite_code: inviteCode,
            url: originalUrl,
          },
          null,
          2
        );
      }

      // 3. 构建解析后的 URL（用于其他工具）
      let resolvedUrl = '';
      if (inviteInfo.projectId && inviteInfo.teamId) {
        resolvedUrl = `${lanhuApi.getBaseUrl()}/team/${inviteInfo.teamId}/project/${inviteInfo.projectId}`;
      } else if (inviteInfo.teamId) {
        resolvedUrl = `${lanhuApi.getBaseUrl()}/team/${inviteInfo.teamId}`;
      } else {
        resolvedUrl = originalUrl;
      }

      // 4. 构建返回结果
      const result = {
        status: 'success',
        invite_url: originalUrl,
        resolved_url: resolvedUrl,
        parsed_params: {
          inviteCode,
          teamId: inviteInfo.teamId,
          projectId: inviteInfo.projectId,
        },
        invite_info: {
          folderName: inviteInfo.folderName,
          creatorName: inviteInfo.creatorName,
        },
        usage_tip:
          '现在可以使用 parsed_params 中的 tid/pid 与其他蓝湖工具（如获取设计稿列表、分析页面等）',
      };

      return JSON.stringify(result, null, 2);
    },
  };
}
