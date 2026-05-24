/**
 * lanhu_get_ai_analyze_page_result 工具
 *
 * 分析蓝湖原型页面内容，返回页面文本、样式、交互信息和截图。
 *
 * 实现原理（基于 Python 参考实现）：
 * 1. 从蓝湖 API 获取 Axure 原型页面的 HTML 内容
 * 2. 使用 Playwright headless 浏览器加载 HTML
 * 3. 提取页面文本内容、设计样式信息、交互行为说明
 * 4. 对页面进行全屏截图
 * 5. 返回结构化数据供 AI 分析
 *
 * 注意：此工具本身不调用外部 AI 模型，而是将收集到的数据返回给 MCP 客户端，
 * 由客户端将数据发送给 AI 模型进行分析。
 */

import { createSchema, ToolHandler } from 'mcp-dev-tools';
import { lanhuApi } from '../api/client.js';
import { parseLanhuUrl } from '../utils/url-parser.js';
import { analyzeAxurePage } from '../utils/playwright-browser.js';
import type { ProductDetailResult } from '../types.js';

/** 工具输入参数 */
export interface AnalyzePageInput {
  url: string;
  pageId: string;
  mode?: 'development' | 'testing' | 'explore';
}

/**
 * 创建 lanhu_get_ai_analyze_page_result 工具
 */
export function createAnalyzePageTool(): ToolHandler {
  return {
    name: 'lanhu_get_ai_analyze_page_result',
    description: `分析蓝湖原型页面内容，提取页面文本、设计样式、交互信息和截图。

支持三种分析模式：
- development: 开发视角，关注实现细节和技术建议
- testing: 测试视角，关注功能点和测试场景  
- explore: 快速探索，概览页面主要内容

参数：
- url: 蓝湖需求文档 URL
- pageId: 页面 ID（从页面列表工具获取）
- mode: 分析模式（可选，默认 development）`,
    inputSchema: createSchema(
      {
        url: {
          type: 'string',
          description: '蓝湖需求文档 URL，如 https://lanhuapp.com/product/<productId>',
        },
        pageId: {
          type: 'string',
          description: '页面 ID，从页面列表工具获取',
        },
        mode: {
          type: 'string',
          description: '分析模式：development=开发视角, testing=测试视角, explore=快速探索（可选，默认 development）',
        },
      },
      ['url', 'pageId']
    ),
    handler: async (params: Record<string, any>): Promise<string> => {
      const url = params.url as string;
      const pageId = params.pageId as string;
      const mode = (params.mode as string) || 'development';

      // 1. 验证 URL
      const parsedUrl = lanhuApi.parseUrl(url);
      if (parsedUrl.type !== 'product') {
        return JSON.stringify({
          status: 'error',
          error: '请提供蓝湖需求文档 URL',
          supported_formats: [
            'https://lanhuapp.com/product/<productId>',
            'https://lanhuapp.com/invite/<inviteCode>',
          ],
          parsed_type: parsedUrl.type,
        }, null, 2);
      }

      try {
        // 2. 使用 docId 获取文档详情（优先使用 URL 中的 docId，其次使用 pageId 作为 docId）
        const docId = parsedUrl.docId || pageId;
        const productDetail = await lanhuApi.getProductDetail(
          docId,
          parsedUrl.teamId,
          parsedUrl.projectId
        );

        // 3. 获取页面列表
        const pagesList = await lanhuApi.getPagesList(
          docId,
          parsedUrl.teamId,
          parsedUrl.projectId
        );

        // 查找指定 pageId 的页面
        const targetPage = pagesList.pages?.find((p: { id: string }) => p.id === pageId);
        if (!targetPage) {
          return JSON.stringify({
            status: 'error',
            error: `未找到页面 ID 为 "${pageId}" 的页面`,
            available_pages: pagesList.pages?.map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            })),
          }, null, 2);
        }

        // 4. 获取 HTML 内容
        // 使用 signMd5（与 Python 版本一致）：f"{CDN_URL}/{sign_md5}"
        // 如果没有 signMd5，回退到使用 filename
        const htmlKey = targetPage.signMd5 || targetPage.filename;
        const htmlContent = await lanhuApi.getPageHtml(htmlKey);

        // 打印 HTML 内容用于调试
        console.log('=== HTML Content Start ===');
        console.log('HTML length:', htmlContent?.length);
        console.log('HTML preview:', htmlContent?.substring(0, 2000));
        console.log('=== HTML Content End ===');

        if (!htmlContent) {
          return JSON.stringify({
            status: 'error',
            error: `无法获取页面 "${targetPage.name}" 的 HTML 内容`,
          }, null, 2);
        }

        // 5. 使用 Playwright 分析页面
        const analysisResult = await analyzeAxurePage(htmlContent, targetPage.name, {
          fullPage: true,
          waitForTimeout: 3000,
        });

        // 6. 构建分析结果
        const modeDescriptions: Record<string, string> = {
          development: '开发视角 - 关注实现细节、技术建议、代码结构',
          testing: '测试视角 - 关注功能点、测试场景、边界条件',
          explore: '快速探索 - 概览页面主要内容、功能布局',
        };

        const result = {
          status: 'success',
          pageName: targetPage.name,
          pageId: pageId,
          mode: mode,
          modeDescription: modeDescriptions[mode] || modeDescriptions.development,
          textContent: analysisResult.textContent,
          designStyleInfo: analysisResult.designStyleInfo,
          interactionGuide: analysisResult.interactionGuide,
          screenshot: analysisResult.screenshot,
          screenshotMetadata: {
            width: analysisResult.screenshotWidth,
            height: analysisResult.screenshotHeight,
            format: 'png',
          },
          prompt: buildAnalysisPrompt(targetPage.name, mode, analysisResult),
        };

        return JSON.stringify(result, null, 2);
      } catch (error: any) {
        return JSON.stringify({
          status: 'error',
          error: `分析页面时出错: ${error.message || String(error)}`,
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
 *
 * 根据页面分析结果和分析模式，构建适合发送给 AI 模型的提示词。
 */
function buildAnalysisPrompt(
  pageName: string,
  mode: string,
  analysis: { textContent: string; designStyleInfo: string; interactionGuide: string }
): string {
  const modePrompts: Record<string, string> = {
    development: `你是一个资深前端开发工程师，请根据以下信息提供实现建议：

1. 页面名称: ${pageName}
2. 页面内容:
${analysis.textContent}

3. 设计样式:
${analysis.designStyleInfo}

4. 交互行为:
${analysis.interactionGuide}

请提供：
- 推荐的技术栈和组件结构
- 关键实现细节和注意事项
- 响应式设计建议
- 可访问性考虑`,

    testing: `你是一个测试工程师，请根据以下信息设计测试场景：

1. 页面名称: ${pageName}
2. 页面内容:
${analysis.textContent}

3. 设计样式:
${analysis.designStyleInfo}

4. 交互行为:
${analysis.interactionGuide}

请提供：
- 功能测试场景
- 边界条件测试
- 兼容性测试建议
- 回归测试要点`,

    explore: `你是一个产品经理，请根据以下信息快速了解页面功能：

1. 页面名称: ${pageName}
2. 页面内容:
${analysis.textContent}

3. 设计样式:
${analysis.designStyleInfo}

4. 交互行为:
${analysis.interactionGuide}

请提供：
- 页面主要功能概述
- 用户操作流程
- 关键交互说明`,
  };

  return modePrompts[mode] || modePrompts.development;
}