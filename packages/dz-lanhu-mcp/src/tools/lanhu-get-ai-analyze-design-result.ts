/**
 * lanhu_get_ai_analyze_design_result 工具
 *
 * 分析蓝湖 UI 设计图，获取详细设计参数和截图。
 *
 * 实现原理（基于 Python 参考实现）：
 * 1. 从蓝湖 API 获取设计图详情
 * 2. 获取设计图原始图片和预览图
 * 3. 获取设计图的切图信息（slices）
 * 4. 返回设计图的图片数据供 AI 图像分析
 *
 * 注意：此工具本身不调用外部 AI 图像识别模型，而是将收集到的设计图数据
 * （图片 base64、尺寸、切图等）返回给 MCP 客户端，由客户端将数据发送给
 * 支持图像识别的 AI 模型进行分析。
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import { parseLanhuUrl } from '../utils/url-parser.js';
import type { ParsedLanhuUrl } from '../types.js';

/** 工具输入参数 */
export interface AnalyzeDesignInput {
  url: string;
  designId: string;
}

/**
 * 创建 lanhu_get_ai_analyze_design_result 工具
 */
export function createAnalyzeDesignTool(): ToolHandler {
  return {
    name: 'lanhu_get_ai_analyze_design_result',
    description: `分析蓝湖 UI 设计图，获取设计参数、切图信息和截图。

此工具从蓝湖 API 获取设计图的详细信息，包括：
- 设计图名称、尺寸、上传时间
- 设计图的原始图片和缩略图 URL
- 切图（slices）信息
- 设计稿详情（JSON schema）

返回的数据可被 MCP 客户端发送给 AI 模型进行图像分析。

参数：
- url: 蓝湖设计稿 URL
- designId: 设计图 ID（从设计稿列表工具获取）`,
    inputSchema: createSchema(
      {
        url: {
          type: 'string',
          description: '蓝湖设计稿 URL，如 https://lanhuapp.com/product/<productId>',
        },
        designId: {
          type: 'string',
          description: '设计图 ID，从设计稿列表工具获取',
        },
      },
      ['url', 'designId']
    ),
    handler: async (params: Record<string, any>): Promise<string> => {
      const url = params.url as string;
      const designId = params.designId as string;

      // 1. 验证 URL
      const parsedUrl = lanhuApi.parseUrl(url);
      if (parsedUrl.type !== 'product') {
        return JSON.stringify({
          status: 'error',
          error: '请提供蓝湖产品文档 URL',
          supported_formats: [
            'https://lanhuapp.com/product/<productId>',
            'https://lanhuapp.com/invite/<inviteCode>',
          ],
          parsed_type: parsedUrl.type,
        }, null, 2);
      }

      try {
        // 2. 获取设计稿列表
        const designs = await lanhuApi.getDesignsList(
          parsedUrl.productId || '',
          parsedUrl.teamId,
          parsedUrl.projectId
        );

        // 查找指定 designId 的设计图
        const targetDesign = designs.find((d: { id: string }) => d.id === designId);
        if (!targetDesign) {
          return JSON.stringify({
            status: 'error',
            error: `未找到设计图 ID 为 "${designId}" 的设计图`,
            available_designs: designs.map((d: { id: string; name: string }) => ({
              id: d.id,
              name: d.name,
            })),
          }, null, 2);
        }

        // 3. 获取设计稿详情
        const designDetail = await lanhuApi.getDesignDetail(
          designId,
          parsedUrl.teamId,
          parsedUrl.projectId
        );

        // 4. 获取切图信息
        let slicesInfo: { slices: Array<{ name: string; url: string; width?: number; height?: number }>; totalSlices: number } = {
          slices: [],
          totalSlices: 0,
        };
        try {
          slicesInfo = await lanhuApi.getDesignSlicesInfo(
            designId,
            parsedUrl.teamId,
            parsedUrl.projectId
          );
        } catch {
          // 切图信息获取失败不影响主流程
        }

        // 5. 构建分析结果
        const result = {
          status: 'success',
          designInfo: {
            id: targetDesign.id,
            name: targetDesign.name,
            thumb_url: targetDesign.thumb_url,
            original_url: targetDesign.original_url,
            created_at: targetDesign.created_at,
            updated_at: targetDesign.updated_at,
          },
          designDetail: {
            preview_url: designDetail.preview_url,
            schema: designDetail.schema,
          },
          slicesInfo: slicesInfo,
          // 提供给 AI 的提示词
          prompt: buildAnalysisPrompt(targetDesign, designDetail, slicesInfo),
        };

        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return JSON.stringify({
          status: 'error',
          error: `分析设计图时出错: ${error.message || String(error)}`,
          check_list: [
            'LANHU_COOKIE 环境变量是否正确',
            'URL 是否有效',
            '网络连接是否正常',
          ],
        }, null, 2);
      }
    },
  };
}

/**
 * 构建 AI 分析提示词
 */
function buildAnalysisPrompt(
  design: { name: string; original_url?: string; thumb_url?: string },
  detail: { preview_url?: string; schema?: any },
  slices: { slices: Array<{ name: string; url: string; width?: number; height?: number }>; totalSlices: number }
): string {
  return `你是一个 UI/UX 设计分析助手，请分析以下设计图：

设计图名称: ${design.name}

设计图资源:
- 原始图 URL: ${design.original_url || '无'}
- 缩略图 URL: ${design.thumb_url || '无'}
- 预览 JSON: ${detail.preview_url || '无'}

切图信息 (${slices.totalSlices} 个):
${slices.slices.map((s: { name: string; url: string; width?: number; height?: number }) => `- ${s.name}: ${s.url} (${s.width || '?'}x${s.height || '?'})`).join('\n') || '无切图'}

请提供：
1. 设计图内容描述
2. 主要 UI 组件识别
3. 布局和交互建议
4. 可导出的切图清单`;
}